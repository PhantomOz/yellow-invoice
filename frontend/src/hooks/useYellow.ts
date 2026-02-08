import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { Client } from "yellow-ts";
import { createPublicClient, createWalletClient, http } from "viem";
import { baseSepolia, polygonAmoy, sepolia } from "viem/chains";
import { Allocation, AuthChallengeResponse, Channel, createAuthRequestMessage, createAuthVerifyMessage, createCreateChannelMessage, createECDSAMessageSigner, createEIP712AuthMessageSigner, NitroliteClient, RPCMethod, RPCResponse, StateIntent, WalletStateSigner } from "@erc7824/nitrolite";

export async function main() {

    const yellow = new Client(
        {
            url: "wss://clearnet-sandbox.yellow.com/ws"
        }
    );

    await yellow.connect();

    const account = privateKeyToAccount("0x");

    if (!account) {
        throw new Error("Failed to create account");
    }

    const walletClient = createWalletClient({
        chain: sepolia,
        transport: http(),
        account,
    });

    const sessionKey = generateSessionKey();

    const sessionExpireTimestamp = BigInt(Math.floor(Date.now() / 1000) + 3600);

    const sessionSigner = createECDSAMessageSigner(sessionKey.privateKey);

    const authMessage = await createAuthRequestMessage({
        address: account.address,
        session_key: sessionKey.address,
        application: "yellow-invoice",
        allowances: [{
            asset: 'ytest.usd',
            amount: '0.01'
        }],
        expires_at: sessionExpireTimestamp,
        scope: "yellow.invoice"
    });

    yellow.sendMessage(authMessage);

    yellow.listen(async (message: RPCResponse) => {
        switch (message.method) {
            case RPCMethod.AuthChallenge:
                console.log("Auth Challenge", message.params);
                const authParams = {
                    scope: "yellow.invoice",
                    application: account.address,
                    participant: sessionKey.address,
                    session_key: sessionKey.address,
                    expire: sessionExpireTimestamp,
                    allowances: [{
                        asset: 'ytest.usd',
                        amount: '0.01'
                    }],
                    expires_at: sessionExpireTimestamp,
                }
                const eip712Signer = createEIP712AuthMessageSigner(walletClient, authParams, { name: "yellow-invoice" });
                const authVerifyMessage = await createAuthVerifyMessage(eip712Signer, message as AuthChallengeResponse);
                yellow.sendMessage(authVerifyMessage);
                break;
            case RPCMethod.AuthVerify:
                console.log("Auth Verify", message.params);

                const createChannelMessage = await createCreateChannelMessage(sessionSigner, {
                    chain_id: sepolia.id,
                    token: "0xDB9F293e3898c9E5536A3be1b0C56c89d2b32DEb" as `0x${string}`,
                });

                yellow.sendMessage(createChannelMessage);
                break;
            case RPCMethod.CreateChannel:
                console.log("Create Channel", message.params);

                const publicClient = createPublicClient({
                    chain: sepolia,
                    transport: http(),
                });

                const nitroliteClient = new NitroliteClient({
                    walletClient,
                    publicClient: publicClient as any,
                    stateSigner: new WalletStateSigner(walletClient),
                    addresses: getContractAddresses(sepolia.id),
                    chainId: sepolia.id,
                    challengeDuration: BigInt(3600),
                });

                const { channelId, txHash } = await nitroliteClient.createChannel({
                    channel: message.params.channel as unknown as Channel,
                    unsignedInitialState: {
                        intent: message.params.state.intent as StateIntent,
                        version: BigInt(message.params.state.version),
                        data: message.params.state.stateData,
                        allocations: message.params.state.allocations as Allocation[],
                    },
                    serverSignature: message.params.serverSignature as `0x${string}`,
                });

                console.log("Create Channel On Sepolia Chain", channelId, txHash);
                await yellow.disconnect()
                process.exit(0);
                break;
            case RPCMethod.GetChannels:
                console.log("Get Channels", message.params);
                break;
            case RPCMethod.Error:
                console.log("Errors", message.params);
                await yellow.disconnect();
                process.exit(1);
                break;
        }
    });
}

function generateSessionKey() {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    return {
        privateKey,
        address: account.address,
    };
}

function getContractAddresses(chainId: number): {
    adjudicator: `0x${string}`;
    custody: `0x${string}`;
} {
    switch (chainId) {
        case sepolia.id:
            return {
                adjudicator: "0x7c7ccbc98469190849BCC6c926307794fDfB11F2",
                custody: "0x019B65A265EB3363822f2752141b3dF16131b262",
            };

        case baseSepolia.id:
            return {
                adjudicator: "0x7c7ccbc98469190849BCC6c926307794fDfB11F2",
                custody: "0x019B65A265EB3363822f2752141b3dF16131b262",
            };
        case polygonAmoy.id:
            return {
                adjudicator: "0x7c7ccbc98469190849BCC6c926307794fDfB11F2",
                custody: "0x019B65A265EB3363822f2752141b3dF16131b262",
            };
        default:
            throw new Error("Unsupported chain");
    }
}

main();
