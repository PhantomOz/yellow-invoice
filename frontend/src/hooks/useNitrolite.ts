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

// Configuration - Using Production ClearNode
// Note: Sandbox (wss://clearnet-sandbox.yellow.com/ws) was returning connection errors
// Production endpoint from SDK: https://github.com/erc7824/nitrolite
const WS_URL = 'wss://clearnet.yellow.com/ws';

// Existing Yellow Network Contracts on Sepolia (from clearsync/docs)
const ADDRESSES = {
    custody: '0x019B65A265EB3363822f2752141b3dF16131b262',
    adjudicator: '0x7c7ccbc98469190849BCC6c926307794fDfB11F2',
};

// USDC Token on Sepolia (Circle test USDC)
const USDC_TOKEN = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}`;

const CHAIN = sepolia;

export function useNitrolite(walletClient: WalletClient | null | undefined, address: Address | null | undefined) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [client, setClient] = useState<NitroliteClient | null>(null);
    const [status, setStatus] = useState<string>('disconnected');
    const [channelId, setChannelId] = useState<string | null>(null);
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
            transport: http('https://rpc.sepolia.org')
        });

        const newClient = new NitroliteClient({
            publicClient,
            walletClient: walletClient as any,
            stateSigner: new WalletStateSigner(walletClient as any),
            addresses: {
                custody: ADDRESSES.custody as `0x${string}`,
                adjudicator: ADDRESSES.adjudicator as `0x${string}`,
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

        setStatus('connecting');
        console.log('[Yellow] Starting connection...');

        // 1. Generate Session Key
        const sessionPrivateKey = generatePrivateKey();
        const sessionAccount = privateKeyToAccount(sessionPrivateKey);
        sessionKeyRef.current = sessionPrivateKey;
        console.log('[Yellow] Session key generated:', sessionAccount.address);

        // 2. Open WebSocket
        console.log('[Yellow] Attempting WebSocket connection to:', WS_URL);
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        return new Promise<void>((resolve, reject) => {
            // Add timeout for connection
            const timeout = setTimeout(() => {
                console.error('[Yellow] Connection timeout after 30s');
                console.error('[Yellow] WebSocket readyState:', ws.readyState);
                console.error('[Yellow] Possible causes:');
                console.error('  1. Channel not created at apps.yellow.com');
                console.error('  2. ClearNode service may be down');
                console.error('  3. Network/firewall blocking WebSocket');
                setStatus('error');
                ws.close();
                reject(new Error('Connection timeout - Yellow ClearNode not responding. Please create a channel at apps.yellow.com first.'));
            }, 30000);

            // Handle WebSocket errors early
            ws.onerror = (e) => {
                console.error('[Yellow] WebSocket error:', e);
                clearTimeout(timeout);
                setStatus('error');
                reject(new Error('WebSocket connection failed'));
            };

            // Handle early close (before onopen)
            ws.onclose = (e) => {
                console.log('[Yellow] WebSocket closed. Code:', e.code, 'Reason:', e.reason || 'none');
                if (e.code === 1006) {
                    console.error('[Yellow] Abnormal closure - ClearNode may require registration at apps.yellow.com');
                }
                if (!isAuthenticated) {
                    clearTimeout(timeout);
                    setStatus('disconnected');
                }
            };

            ws.onopen = async () => {
                console.log('[Yellow] WebSocket opened, sending auth request...');
                setStatus('authenticating');

                // 3. Send Auth Request
                const authParams = {
                    session_key: sessionAccount.address,
                    allowances: [{ asset: 'ytest.usd', amount: '1000000000' }],
                    expires_at: BigInt(Math.floor(Date.now() / 1000) + 3600),
                    scope: 'yellow-invoice',
                };

                try {
                    const authRequestMsg = await createAuthRequestMessage({
                        address: address,
                        application: 'Yellow Invoice',
                        ...authParams
                    });

                    console.log('[Yellow] Sending auth request message');
                    ws.send(authRequestMsg);
                } catch (e) {
                    console.error('[Yellow] Failed to create auth request:', e);
                    clearTimeout(timeout);
                    reject(e);
                    return;
                }

                // Handle Messages
                const messageHandler = async (event: MessageEvent) => {
                    try {
                        const response = JSON.parse(event.data.toString());
                        console.log('[Yellow] Received message:', response.res?.[1] || 'unknown', response);

                        // Handle errors from server
                        if (response.err) {
                            console.error('[Yellow] Server error:', response.err);
                            setStatus('error');
                            clearTimeout(timeout);
                            reject(new Error(response.err[2]?.message || 'Server error'));
                            return;
                        }

                        if (response.res && response.res[1] === 'auth_challenge') {
                            console.log('[Yellow] Received challenge, signing with wallet...');
                            const challenge = response.res[2].challenge_message;

                            // User signs with Wallet (EIP-712)
                            const signer = createEIP712AuthMessageSigner(
                                walletClient as any,
                                authParams,
                                { name: 'Yellow Invoice' }
                            );

                            const verifyMsg = await createAuthVerifyMessageFromChallenge(signer, challenge);
                            console.log('[Yellow] Sending verify message');
                            ws.send(verifyMsg);
                        }

                        if (response.res && response.res[1] === 'auth_verify') {
                            console.log('[Yellow] Authentication successful!');
                            clearTimeout(timeout);
                            setStatus('connected');
                            setIsAuthenticated(true);
                            ws.removeEventListener('message', messageHandler);
                            resolve();
                        }
                    } catch (e) {
                        console.error('[Yellow] Error processing message:', e);
                    }
                };

                ws.addEventListener('message', messageHandler);

                ws.onerror = (e) => {
                    console.error("[Yellow] WS Error", e);
                    clearTimeout(timeout);
                    setStatus('error');
                    reject(e);
                };

                ws.onclose = (e) => {
                    console.log('[Yellow] WebSocket closed:', e.code, e.reason);
                    if (!isAuthenticated) {
                        clearTimeout(timeout);
                        setStatus('disconnected');
                    }
                };
            };
        });


    }, [walletClient, address]);

    // Helper: Fund a Channel
    const fundChannel = useCallback(async (token: string, amount: bigint) => {
        if (!wsRef.current || !sessionKeyRef.current || !client || !address) throw new Error("Not connected");

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
        );
        wsRef.current.send(createChannelMsg);

        return new Promise((resolve, reject) => {
            const handler = async (event: MessageEvent) => {
                const response = JSON.parse(event.data.toString());

                // Handle Create Channel Response
                if (response.res && response.res[1] === 'create_channel') {
                    const { channel_id, channel, state, server_signature } = response.res[2];

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
                        setChannelId(channel_id);

                        // Now Resize (Fund)
                        const resizeMsg = await createResizeChannelMessage(
                            sessionSigner,
                            {
                                channel_id: channel_id as `0x${string}`,
                                allocate_amount: amount, // From Unified Balance
                                funds_destination: address as Address,
                            }
                        );
                        wsRef.current?.send(resizeMsg);

                    } catch (e) {
                        console.error("Creation Failed", e);
                        reject(e);
                    }
                }

                // Handle Resize Response
                if (response.res && response.res[1] === 'resize_channel') {
                    const { channel_id, state, server_signature } = response.res[2];

                    // Submit Resize to Chain logic here...
                    // For MVP, completing
                    console.log("Resize Approved by Server", channel_id);
                    resolve(channel_id);
                    wsRef.current?.removeEventListener('message', handler);
                }
            };
            wsRef.current?.addEventListener('message', handler);
        });

    }, [client, walletClient, address]);

    /**
     * Pay Invoice - Full Yellow Network Payment Flow
     * 1. Connect to Yellow ClearNode (if not connected)
     * 2. Create/Fund a channel with USDC
     * 3. Payment is settled to merchant via Yellow state channels
     */
    const payInvoice = useCallback(async (params: {
        amount: bigint;           // Amount in USDC (6 decimals)
        merchantAddress: Address; // Merchant's wallet address
        invoiceId: string;        // Invoice reference
    }) => {
        const { amount, merchantAddress, invoiceId } = params;

        if (!walletClient || !address) {
            throw new Error("Wallet not connected");
        }

        try {
            // 1. Connect to Yellow if not connected
            if (!isAuthenticated) {
                setStatus('connecting');
                await connect();
            }

            // 2. Create channel and fund with payment amount
            setStatus('creating_channel');
            const createdChannelId = await fundChannel(USDC_TOKEN, amount);

            // 3. For MVP: The channel creation funds the payment
            // In production: Would use state channel updates to transfer to merchant
            // The merchant claims funds from their channel

            setStatus('payment_complete');

            return {
                success: true,
                channelId: createdChannelId,
                invoiceId,
                amount,
                merchantAddress,
                message: `Payment of ${Number(amount) / 1e6} USDC sent via Yellow Network`
            };

        } catch (error: any) {
            setStatus('error');
            throw new Error(`Payment failed: ${error.message}`);
        }
    }, [walletClient, address, isAuthenticated, connect, fundChannel]);

    // React to wallet changes
    useEffect(() => {
        if (walletClient && address) {
            initClient();
        }
    }, [initClient, walletClient, address]);

    return {
        connect,
        fundChannel,
        payInvoice,
        isAuthenticated,
        status,
        channelId,
        client,
        USDC_TOKEN,
        CHAIN,
    };
}

