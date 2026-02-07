import {
  NitroliteClient,
  WalletStateSigner,
  createECDSAMessageSigner,
  createEIP712AuthMessageSigner,
  createAuthRequestMessage,
  createAuthVerifyMessageFromChallenge,
  createCreateChannelMessage,
  createResizeChannelMessage,
  type RPCAsset,
} from "@erc7824/nitrolite";
import { createPublicClient, Hex, http, Address, WalletClient } from "viem";
import { sepolia } from "viem/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { useState, useCallback, useEffect, useRef } from "react";

import { NITROLITE_ADDRESSES } from "../constants/address";

// Configuration
const WS_URL = "wss://clearnet-sandbox.yellow.com/ws";

const CHAIN = sepolia;

export function useNitrolite(
  walletClient: WalletClient | null | undefined,
  address: Address | null | undefined,
) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [client, setClient] = useState<NitroliteClient | null>(null);
  const [status, setStatus] = useState<string>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const sessionKeyRef = useRef<`0x${string}` | null>(null);

  // Initialize Client
  const initClient = useCallback(async () => {
    if (!walletClient || !address || !walletClient.account) {
      // Cannot init without wallet
      return;
    }

    const publicClient = createPublicClient({
      chain: CHAIN,
      transport: http("https://rpc.sepolia.org"),
    });

    const newClient = new NitroliteClient({
      publicClient,
      walletClient: walletClient as any,
      stateSigner: new WalletStateSigner(walletClient as any),
      addresses: {
        custody: NITROLITE_ADDRESSES.custody as `0x${string}`,
        adjudicator: NITROLITE_ADDRESSES.adjudicator as `0x${string}`,
      },
      chainId: CHAIN.id,
      challengeDuration: BigInt(3600),
    });

    setClient(newClient);
    return newClient;
  }, [walletClient, address]);

  // Connect and Authenticate
  const connect = useCallback(async () => {
    if (!walletClient || !address) throw new Error("Wallet not connected");

    setStatus("connecting");

    // 1. Generate Session Key
    const sessionPrivateKey = generatePrivateKey();
    const sessionAccount = privateKeyToAccount(sessionPrivateKey);
    sessionKeyRef.current = sessionPrivateKey;
    // const sessionSigner = createECDSAMessageSigner(sessionPrivateKey);

    // 2. Open WebSocket
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    return new Promise<void>((resolve, reject) => {
      ws.onopen = async () => {
        setStatus("authenticating");

        // 3. Send Auth Request
        const authParams = {
          session_key: sessionAccount.address,
          allowances: [{ asset: "ytest.usd", amount: "1000000000" }],
          expires_at: BigInt(Math.floor(Date.now() / 1000) + 3600),
          scope: "yellow-invoice",
        };

        const authRequestMsg = await createAuthRequestMessage({
          address: address,
          application: "Yellow Invoice",
          ...authParams,
        });

        ws.send(authRequestMsg);

        // Handle Messages
        const messageHandler = async (event: MessageEvent) => {
          const response = JSON.parse(event.data.toString());

          if (response.res && response.res[1] === "auth_challenge") {
            const challenge = response.res[2].challenge_message;

            // User signs with Wallet (EIP-712)
            const signer = createEIP712AuthMessageSigner(
              walletClient as any,
              authParams,
              { name: "Yellow Invoice" },
            );

            const verifyMsg = await createAuthVerifyMessageFromChallenge(
              signer,
              challenge,
            );
            ws.send(verifyMsg);
          }

          if (response.res && response.res[1] === "auth_verify") {
            setStatus("connected");
            setIsAuthenticated(true);
            ws.removeEventListener("message", messageHandler); // Cleanup auth listener

            // Re-attach generic listener or handle specific logic elsewhere?
            // For now, keep it simple.
            resolve();
          }
        };

        ws.addEventListener("message", messageHandler);

        ws.onerror = (e) => {
          console.error("WS Error", e);
          setStatus("error");
          reject(e);
        };
      };
    });
  }, [walletClient, address]);

  // Helper: Fund a Channel
  const fundChannel = useCallback(
    async (token: string, amount: bigint) => {
      if (!wsRef.current || !sessionKeyRef.current || !client || !address)
        throw new Error("Not connected");

      setStatus("funding");
      const sessionSigner = createECDSAMessageSigner(sessionKeyRef.current);

      const createChannelMsg = await createCreateChannelMessage(sessionSigner, {
        chain_id: CHAIN.id, // Target Chain
        token: token as Hex,
      });
      wsRef.current.send(createChannelMsg);

      return new Promise((resolve, reject) => {
        const handler = async (event: MessageEvent) => {
          const response = JSON.parse(event.data.toString());

          // Handle Create Channel Response
          if (response.res && response.res[1] === "create_channel") {
            const { channel_id, channel, state, server_signature } =
              response.res[2];

            // Submit to Chain
            const unsignedInitialState = {
              intent: state.intent,
              version: BigInt(state.version),
              data: state.state_data,
              allocations: state.allocations.map((a: any) => ({
                destination: a.destination,
                token: a.token,
                amount: BigInt(a.amount),
              })),
            };

            try {
              const tx = await client.createChannel({
                channel,
                unsignedInitialState,
                serverSignature: server_signature,
              });
              console.log("Channel Created", tx);

              // Now Resize (Fund)
              const resizeMsg = await createResizeChannelMessage(
                sessionSigner,
                {
                  channel_id: channel_id as `0x${string}`,
                  allocate_amount: amount, // From Unified Balance
                  funds_destination: address as Address,
                },
              );
              wsRef.current?.send(resizeMsg);
            } catch (e) {
              console.error("Creation Failed", e);
              reject(e);
            }
          }

          // Handle Resize Response
          if (response.res && response.res[1] === "resize_channel") {
            const { channel_id, state, server_signature } = response.res[2];

            // Submit Resize to Chain logic here...
            // For MVP, completing
            console.log("Resize Approved by Server", channel_id);
            resolve(channel_id);
            wsRef.current?.removeEventListener("message", handler);
          }
        };
        wsRef.current?.addEventListener("message", handler);
      });
    },
    [client, walletClient, address],
  );

  // React to wallet changes
  useEffect(() => {
    if (walletClient && address) {
      initClient();
    }
  }, [initClient, walletClient, address]);

  return {
    connect,
    fundChannel,
    isAuthenticated,
    status,
    client,
  };
}
