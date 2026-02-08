import { useState, useCallback, useRef, useEffect } from 'react';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { Client } from 'yellow-ts';
import { createPublicClient, http, type WalletClient, type Address, getAddress } from 'viem';
import { sepolia, baseSepolia, polygonAmoy } from 'viem/chains';
import {
    Allocation,
    AuthChallengeResponse,
    Channel,
    createAuthRequestMessage,
    createAuthVerifyMessage,
    createCreateChannelMessage,
    createCloseChannelMessage,
    createGetChannelsMessage,
    createGetLedgerBalancesMessage,
    createAppSessionMessage,
    createCloseAppSessionMessage,
    createTransferMessage,
    createECDSAMessageSigner,
    createEIP712AuthMessageSigner,
    NitroliteClient,
    RPCMethod,
    RPCProtocolVersion,
    RPCResponse,
    StateIntent,
    WalletStateSigner,
    BalanceUpdateResponse,
    GetLedgerBalancesResponse,
} from '@erc7824/nitrolite';

// Yellow ClearNode Sandbox
const WS_URL = 'wss://clearnet-sandbox.yellow.com/ws';

// ytest.usd is the only token supported on testnet
const YTEST_USD_TOKEN = '0xDB9F293e3898c9E5536A3be1b0C56c89d2b32DEb' as const;

// Supported chains for Yellow Network unified balance
export type SupportedChainId = typeof sepolia.id | typeof baseSepolia.id | typeof polygonAmoy.id;

export const SUPPORTED_CHAINS = [
    { id: sepolia.id, name: 'Sepolia', chain: sepolia },
    { id: baseSepolia.id, name: 'Base Sepolia', chain: baseSepolia },
    { id: polygonAmoy.id, name: 'Polygon Amoy', chain: polygonAmoy },
] as const;

// Supported assets on Yellow Network testnet
export const SUPPORTED_ASSETS = [
    { address: '0xDB9F293e3898c9E5536A3be1b0C56c89d2b32DEb' as `0x${string}`, symbol: 'ytest.usd', name: 'Yellow Test USD' },
    { address: '0x0000000000000000000000000000000000000000' as `0x${string}`, symbol: 'ETH', name: 'Ethereum' },
] as const;

export type SupportedAssetAddress = typeof SUPPORTED_ASSETS[number]['address'];

// Network asset type (from Yellow Network API)
export interface NetworkAsset {
    token: `0x${string}`;
    chainId: number;
    symbol: string;
    decimals: number;
}

export type YellowStatus =
    | 'idle'
    | 'connecting'
    | 'authenticating'
    | 'authenticated'
    | 'fetching_channels'
    | 'creating_channel'
    | 'channel_created'
    | 'creating_session'
    | 'session_created'
    | 'sending_payment'
    | 'depositing'
    | 'payment_complete'
    | 'error';

interface ChannelInfo {
    channelId: string;
    txHash?: string;
    status: 'pending' | 'open' | 'closed';
}

interface UseYellowChannelResult {
    status: YellowStatus;
    error: string | null;
    jwtToken: string | null;
    channels: ChannelInfo[];
    existingChannelId: string | null;
    appSessionId: string | null;
    connect: () => Promise<void>;
    createChannel: () => Promise<void>;
    closeChannel: (channelId: string) => Promise<void>;
    getChannels: () => Promise<void>;
    createPaymentSession: (merchantAddress: Address, amount: string, invoiceId?: string) => Promise<void>;
    sendPayment: (merchantAddress: Address, amount: string) => Promise<void>;
    getLedgerBalances: () => Promise<void>;
    ledgerBalances: { asset: string; amount: string }[];
    selectedChainId: SupportedChainId;
    setSelectedChainId: (chainId: SupportedChainId) => void;
    supportedChains: typeof SUPPORTED_CHAINS;
    selectedAsset: SupportedAssetAddress;
    setSelectedAsset: (asset: SupportedAssetAddress) => void;
    supportedAssets: typeof SUPPORTED_ASSETS;
    networkAssets: NetworkAsset[];
    depositToLedger: (amount: string) => Promise<string | null>;
    lastPaidInvoiceId: string | null;
    disconnect: () => void;
}

/**
 * useYellowChannel - React hook for Yellow Network state channels
 * 
 * Based on working script pattern:
 * 1. Connect to ClearNode WebSocket
 * 2. Auth: auth_request → auth_challenge → auth_verify (EIP-712)
 * 3. Create/Get channels with ytest.usd token
 * 
 * @param walletClient - Viem wallet client for signing
 * @param address - Connected wallet address
 * @param allowanceAmount - Amount to set as session key allowance (defaults to '1000')
 */
export function useYellowChannel(
    walletClient: WalletClient | null | undefined,
    address: Address | null | undefined,
    allowanceAmount: string = '1000'
): UseYellowChannelResult {
    const [status, setStatus] = useState<YellowStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [lastPaidInvoiceId, setLastPaidInvoiceId] = useState<string | null>(null);
    const [jwtToken, setJwtToken] = useState<string | null>(null);
    const [channels, setChannels] = useState<ChannelInfo[]>([]);
    const [existingChannelId, setExistingChannelId] = useState<string | null>(null);
    const [appSessionId, setAppSessionId] = useState<string | null>(null);
    const [ledgerBalances, setLedgerBalances] = useState<{ asset: string; amount: string }[]>([]);
    const [selectedChainId, setSelectedChainId] = useState<SupportedChainId>(sepolia.id);
    const [selectedAsset, setSelectedAsset] = useState<SupportedAssetAddress>(SUPPORTED_ASSETS[0].address);
    const [networkAssets, setNetworkAssets] = useState<NetworkAsset[]>([]);

    // Refs for persistent values
    const clientRef = useRef<Client | null>(null);
    const sessionKeyRef = useRef<{ privateKey: `0x${string}`; address: Address } | null>(null);
    const sessionSignerRef = useRef<any>(null);

    // Generate session key
    const generateSessionKey = useCallback(() => {
        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);
        sessionKeyRef.current = {
            privateKey,
            address: account.address,
        };
        sessionSignerRef.current = createECDSAMessageSigner(privateKey);
        return sessionKeyRef.current;
    }, []);

    // Get contract addresses by chain
    const getContractAddresses = useCallback((chainId: number) => {
        switch (chainId) {
            case sepolia.id:
            case baseSepolia.id:
            case polygonAmoy.id:
                return {
                    adjudicator: '0x7c7ccbc98469190849BCC6c926307794fDfB11F2' as `0x${string}`,
                    custody: '0x019B65A265EB3363822f2752141b3dF16131b262' as `0x${string}`,
                };
            default:
                throw new Error('Unsupported chain');
        }
    }, []);

    // Get chain object by ID
    const getChainById = useCallback((chainId: SupportedChainId) => {
        const found = SUPPORTED_CHAINS.find(c => c.id === chainId);
        if (!found) throw new Error('Unsupported chain');
        return found.chain;
    }, []);

    // Get asset symbol from address
    const getAssetSymbol = useCallback((assetAddress: SupportedAssetAddress) => {
        const found = SUPPORTED_ASSETS.find(a => a.address === assetAddress);
        if (!found) throw new Error('Unsupported asset');
        return found.symbol;
    }, []);

    // Connect and authenticate to Yellow Network
    const connect = useCallback(async () => {
        if (!walletClient || !address) {
            setError('Wallet not connected');
            setStatus('error');
            return;
        }
        console.log(walletClient, address);

        try {
            setStatus('connecting');
            setError(null);

            // Create Yellow client
            const yellow = new Client({ url: WS_URL });
            clientRef.current = yellow;

            await yellow.connect();
            console.log('[Yellow] WebSocket connected');

            // Generate session key
            const sessionKey = generateSessionKey();
            const sessionExpireTimestamp = BigInt(Math.floor(Date.now() / 1000) + 3600);

            console.log(sessionKey);

            setStatus('authenticating');

            // Use checksummed address - EIP-712 signatures are case-sensitive!
            const checksummedAddress = getAddress(address);
            console.log('[Yellow] Checksummed address:', checksummedAddress);

            // Create and send auth request - MUST match working script exactly
            const authMessage = await createAuthRequestMessage({
                address: checksummedAddress,
                session_key: sessionKey.address,
                application: 'yellow-invoice',
                allowances: [{ asset: getAssetSymbol(selectedAsset), amount: allowanceAmount }], // Session spending limit based on invoice
                expires_at: sessionExpireTimestamp,
                scope: 'yellow.invoice',
            });

            yellow.sendMessage(authMessage);

            // Set up message listener
            yellow.listen(async (message: RPCResponse) => {
                console.log('[Yellow] Received:', message.method, message.params);

                switch (message.method) {
                    case RPCMethod.AuthChallenge:
                        console.log('[Yellow] Auth Challenge received');
                        console.log('[Yellow] Challenge message:', message.params);
                        console.log('[Yellow] Using wallet address:', address);
                        console.log('[Yellow] Using session key:', sessionKey.address);

                        // Auth params MUST match working script structure exactly
                        // Use checksummed address for EIP-712!
                        const checksummedAddr = getAddress(address);
                        const authParams = {
                            scope: 'yellow.invoice',
                            application: checksummedAddr,
                            participant: sessionKey.address,
                            session_key: sessionKey.address,
                            expire: sessionExpireTimestamp,
                            allowances: [{ asset: getAssetSymbol(selectedAsset), amount: allowanceAmount }], // Session spending limit based on invoice
                            expires_at: sessionExpireTimestamp,
                        };

                        console.log('[Yellow] Auth params for EIP-712:', authParams);
                        console.log('[Yellow] WalletClient:', walletClient);
                        console.log('[Yellow] WalletClient account:', walletClient?.account);

                        try {
                            const eip712Signer = createEIP712AuthMessageSigner(
                                walletClient as any,
                                authParams,
                                { name: 'yellow-invoice' }
                            );

                            console.log('[Yellow] EIP-712 signer created, generating verify message...');

                            const authVerifyMessage = await createAuthVerifyMessage(
                                eip712Signer,
                                message as AuthChallengeResponse
                            );

                            console.log('[Yellow] Auth verify message created, sending...');
                            yellow.sendMessage(authVerifyMessage);
                        } catch (signError: any) {
                            console.error('[Yellow] Signing error:', signError);
                            setError(`Signing failed: ${signError.message}`);
                            setStatus('error');
                        }
                        break;

                    case RPCMethod.AuthVerify:
                        console.log('[Yellow] Auth successful!');
                        setJwtToken((message.params as any).jwtToken || null);

                        // Automatically create channel after auth (matching working script)
                        console.log('[Yellow] Creating channel with ytest.usd...');
                        setStatus('authenticated');


                        break;

                    case RPCMethod.GetChannels:
                        console.log('[Yellow] Channels:', message.params);
                        // Parse channels from response
                        const channelList = (message.params as any)?.channels || [];
                        setChannels(channelList.map((ch: any) => ({
                            channelId: ch.channel_id,
                            status: ch.status || 'open',
                        })));
                        break;

                    case RPCMethod.CreateChannel:
                        console.log('[Yellow] Channel created:', message.params);

                        // Get the chain object for the selected chain
                        const selectedChain = getChainById(selectedChainId);

                        // Submit to blockchain
                        const publicClient = createPublicClient({
                            chain: selectedChain,
                            transport: http(),
                        });

                        const nitroliteClient = new NitroliteClient({
                            walletClient: walletClient as any,
                            publicClient: publicClient as any,
                            stateSigner: new WalletStateSigner(walletClient as any),
                            addresses: getContractAddresses(selectedChainId),
                            chainId: selectedChainId,
                            challengeDuration: BigInt(3600),
                        });

                        try {
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

                            console.log('[Yellow] Channel on-chain:', channelId, txHash);
                            setChannels(prev => [...prev, { channelId, txHash, status: 'open' }]);
                            setStatus('channel_created');
                        } catch (e: any) {
                            console.error('[Yellow] Channel creation failed:', e);
                            setError(e.message);
                            setStatus('error');
                        }
                        break;

                    case RPCMethod.BalanceUpdate:
                        const balanceUpdate = message as BalanceUpdateResponse;
                        const balances = balanceUpdate.params.balanceUpdates;

                        console.log('Live balance update received:', balances);

                        // Same data transformation as above
                        const balancesMap = Object.fromEntries(
                            balances.map((balance) => [balance.asset, balance.amount]),
                        );
                        console.log('Updating balances in real-time:', balancesMap);
                        break;

                    case RPCMethod.Assets:
                        const networkAssetsList = (message.params as any)?.assets || [];
                        console.log('[Yellow] Assets received:', networkAssetsList);
                        setNetworkAssets(networkAssetsList.map((a: any) => ({
                            token: a.token as `0x${string}`,
                            chainId: a.chainId,
                            symbol: a.symbol,
                            decimals: a.decimals,
                        })));
                        break;

                    case RPCMethod.GetLedgerBalances:
                        console.log('[Yellow] Ledger balances received:', message.params);
                        const ledgerResponse = (message as GetLedgerBalancesResponse).params.ledgerBalances || [];
                        setLedgerBalances(ledgerResponse.map((b: any) => ({
                            asset: b.asset,
                            amount: b.amount,
                        })));
                        break;

                    case RPCMethod.CreateAppSession:
                        console.log('[Yellow] App session created:', message.params);
                        const sessionParams = message.params as any;
                        // Handle both camelCase and snake_case responses
                        const newAppSessionId = sessionParams?.appSessionId || sessionParams?.app_session_id || sessionParams?.[0]?.appSessionId || sessionParams?.[0]?.app_session_id;
                        if (newAppSessionId) {
                            setAppSessionId(newAppSessionId);
                            setStatus('session_created');
                            console.log('[Yellow] App session ID:', newAppSessionId);

                            // Check for invoice ID in application protocol fields
                            // We encode invoiceId in the nonce: nonce = (invoiceId * 10^10) + timestamp
                            try {
                                const appDef = sessionParams.definition || sessionParams.appDefinition;
                                const nonce = appDef?.nonce || sessionParams.nonce;

                                if (nonce && typeof nonce === 'number') {
                                    // Check if nonce is large enough to contain invoice ID
                                    // 10^10 is our multiplier
                                    const multiplier = 10000000000;
                                    if (nonce > multiplier) {
                                        const extractedId = Math.floor(nonce / multiplier).toString();
                                        if (extractedId && extractedId !== '0') {
                                            console.log('[Yellow] Detected payment for invoice (via nonce):', extractedId);
                                            setLastPaidInvoiceId(extractedId);
                                        }
                                    }
                                }
                            } catch (err) {
                                console.warn('[Yellow] Failed to parse app session for invoice ID', err);
                            }
                        } else {
                            console.error('[Yellow] No app_session_id in response:', message.params);
                            setError('No app_session_id returned');
                            setStatus('error');
                        }
                        break;

                    case RPCMethod.Transfer:
                        console.log('[Yellow] Transfer complete:', message.params);



                        setStatus('payment_complete');
                        break;

                    case RPCMethod.CloseAppSession:
                        console.log('[Yellow] App session closed (payment complete):', message.params);
                        setStatus('payment_complete');
                        setAppSessionId(null); // Session is now closed
                        break;

                    case RPCMethod.CloseChannel:
                        console.log('[Yellow] Channel closed:', message.params);
                        // Refresh channels list
                        setChannels(prev => prev.filter(ch => ch.channelId !== (message.params as any)?.channelId));
                        setExistingChannelId(null);
                        setStatus('authenticated');
                        break;

                    case RPCMethod.Error:
                        console.error('[Yellow] Error:', message.params);
                        const errorMsg = (message.params as any)?.error || 'Unknown error';

                        // Handle "channel already exists" error
                        if (errorMsg.includes('an open channel with broker already exists')) {
                            const match = errorMsg.match(/0x[a-fA-F0-9]+/);
                            if (match) {
                                setExistingChannelId(match[0]);
                                setStatus('authenticated');
                                console.log('[Yellow] Using existing channel:', match[0]);
                                return;
                            }
                        }

                        setError(errorMsg);
                        setStatus('error');
                        break;
                }
            });

        } catch (e: any) {
            console.error('[Yellow] Connection error:', e);
            setError(e.message || 'Connection failed');
            setStatus('error');
        }
    }, [walletClient, address, generateSessionKey, getContractAddresses]);

    // Create a new channel on selected chain with selected asset
    const createChannel = useCallback(async () => {
        if (!clientRef.current || !sessionSignerRef.current) {
            setError('Not connected');
            return;
        }

        setStatus('creating_channel');
        const assetInfo = SUPPORTED_ASSETS.find(a => a.address === selectedAsset);
        console.log(`[Yellow] Creating channel on chain ${selectedChainId} with asset ${assetInfo?.symbol || selectedAsset}...`);

        const createChannelMessage = await createCreateChannelMessage(
            sessionSignerRef.current,
            {
                chain_id: selectedChainId,
                token: selectedAsset,
            }
        );

        clientRef.current.sendMessage(createChannelMessage);
    }, [selectedChainId, selectedAsset]);

    // Get existing channels
    const getChannels = useCallback(async () => {
        if (!clientRef.current || !sessionSignerRef.current) {
            setError('Not connected');
            return;
        }

        setStatus('fetching_channels');

        const getChannelsMessage = await createGetChannelsMessage(sessionSignerRef.current);
        clientRef.current.sendMessage(getChannelsMessage);
    }, []);

    // Close a channel and return funds to wallet
    const closeChannel = useCallback(async (channelId: string) => {
        if (!clientRef.current || !sessionSignerRef.current || !address) {
            setError('Not connected');
            return;
        }

        try {
            setStatus('creating_channel'); // Reuse status for closing
            setError(null);

            console.log('[Yellow] Closing channel:', channelId);

            const closeMessage = await createCloseChannelMessage(
                sessionSignerRef.current,
                channelId as `0x${string}`,
                getAddress(address) // Return funds to connected wallet
            );

            clientRef.current.sendMessage(closeMessage);
            // Response handled in message listener
        } catch (e: any) {
            console.error('[Yellow] Error closing channel:', e);
            setError(e.message || 'Failed to close channel');
            setStatus('error');
        }
    }, [address]);

    // Get ledger balances
    const getLedgerBalances = useCallback(async () => {
        if (!clientRef.current || !sessionSignerRef.current) {
            setError('Not connected');
            return;
        }

        try {
            console.log('[Yellow] Getting ledger balances...');
            const message = await createGetLedgerBalancesMessage(sessionSignerRef.current);
            clientRef.current.sendMessage(message);
            // Response handled in message listener
        } catch (e: any) {
            console.error('[Yellow] Error getting ledger balances:', e);
            setError(e.message || 'Failed to get ledger balances');
        }
    }, []);

    // Disconnect
    const disconnect = useCallback(() => {
        if (clientRef.current) {
            clientRef.current.disconnect();
            clientRef.current = null;
        }
        setStatus('idle');
        setJwtToken(null);
        setChannels([]);
        setExistingChannelId(null);
        setAppSessionId(null);
    }, []);

    /**
     * Create a payment session (app session) with a merchant
     * This sets up an off-chain payment channel where funds can be transferred
     * @param merchantAddress - Address of the merchant
     * @param amount - Amount to pay
     * @param invoiceId - Optional invoice ID for attribution
     */
    const createPaymentSession = useCallback(async (merchantAddress: Address, amount: string, invoiceId?: string) => {
        if (!clientRef.current || !sessionSignerRef.current || !address) {
            setError('Not connected to Yellow Network');
            return;
        }

        try {
            setStatus('creating_session');
            setError(null);

            const checksummedAddress = getAddress(address);
            const checksummedMerchant = getAddress(merchantAddress);

            // encode invoiceId in nonce to avoid "Application mismatch" with session key
            // Session keys are signed for "yellow-invoice" only.
            // We use 10^10 multiplier to shift invoiceId to high bits of safe integer
            let nonce = Date.now();
            if (invoiceId) {
                const idNum = parseInt(invoiceId);
                if (!isNaN(idNum)) {
                    // invoiceId * 10^10 + seconds (to save space)
                    const timestamp = Math.floor(Date.now() / 1000);
                    nonce = (idNum * 10000000000) + timestamp;
                    console.log('[Yellow] Encoded invoice ID into nonce:', nonce);
                }
            }

            // Define the application session parameters
            const appDefinition = {
                protocol: RPCProtocolVersion.NitroRPC_0_2,
                application: 'yellow-invoice', // Must match session key scope!
                participants: [checksummedAddress, checksummedMerchant],
                weights: [100, 0],  // Payer has control
                quorum: 100,
                challenge: 0,
                nonce: nonce,
            };

            // Define allocations - payer starts with funds, merchant starts with 0
            const allocations = [
                {
                    participant: checksummedAddress,
                    asset: getAssetSymbol(selectedAsset),
                    amount: amount,  // Payer's initial balance
                },
                {
                    participant: checksummedMerchant,
                    asset: getAssetSymbol(selectedAsset),
                    amount: '0',  // Merchant starts with 0
                },
            ];

            console.log('[Yellow] Creating app session:', { appDefinition, allocations });

            const signedMessage = await createAppSessionMessage(
                sessionSignerRef.current,
                { definition: appDefinition, allocations }
            );

            clientRef.current.sendMessage(signedMessage);
            // Response handled in message listener
        } catch (e: any) {
            console.error('[Yellow] Error creating payment session:', e);
            setError(e.message || 'Failed to create payment session');
            setStatus('error');
        }
    }, [address]);

    /**
     * Deposit tokens from wallet to Yellow Network ledger
     * Uses NitroliteClient to handle approval + deposit in one flow
     */
    const depositToLedger = useCallback(async (amount: string): Promise<string | null> => {
        if (!walletClient || !address) {
            setError('Wallet not connected');
            return null;
        }

        try {
            setStatus('depositing');
            setError(null);

            // Get chain config
            const selectedChain = getChainById(selectedChainId);

            const publicClient = createPublicClient({
                chain: selectedChain,
                transport: http(),
            });

            // ytest.usd token address
            const tokenAddress = YTEST_USD_TOKEN;

            // Convert amount to BigInt (ytest.usd has 6 decimals)
            const depositAmount = BigInt(Math.floor(parseFloat(amount) * 1_000_000));

            console.log(`[Yellow] Depositing ${amount} ytest.usd to ledger on chain ${selectedChainId}...`);

            // Create NitroliteClient for the deposit
            const nitroliteClient = new NitroliteClient({
                walletClient: walletClient as any,
                publicClient: publicClient as any,
                stateSigner: new WalletStateSigner(walletClient as any),
                addresses: getContractAddresses(selectedChainId),
                chainId: selectedChainId,
                challengeDuration: BigInt(3600),
            });

            // Execute deposit (handles approval automatically)
            const txHash = await nitroliteClient.deposit(tokenAddress, depositAmount);

            console.log(`[Yellow] Deposit successful! TxHash: ${txHash}`);

            // Refresh ledger balances after deposit
            setTimeout(() => {
                getLedgerBalances();
            }, 3000); // Wait 3s for indexing

            setStatus('authenticated'); // Reset to authenticated
            return txHash;
        } catch (e: any) {
            console.error('[Yellow] Error depositing:', e);
            setError(e.message || 'Failed to deposit');
            setStatus('error');
            return null;
        }
    }, [walletClient, address, selectedChainId, getChainById, getContractAddresses, getLedgerBalances]);

    /**
     * Send a direct payment to the merchant using Yellow Network transfer
     * This is a simpler approach than app sessions - just transfer funds directly
     */
    const sendPayment = useCallback(async (merchantAddress: Address, amount: string) => {
        if (!clientRef.current || !sessionSignerRef.current || !address) {
            setError('Not connected to Yellow Network');
            return;
        }

        try {
            setStatus('sending_payment');
            setError(null);

            const checksummedMerchant = getAddress(merchantAddress);

            // Direct transfer allocations - send amount to merchant
            const transferAllocations = [
                {
                    asset: getAssetSymbol(selectedAsset),
                    amount: amount,
                },
            ];

            console.log('[Yellow] Sending direct transfer payment:', {
                destination: checksummedMerchant,
                allocations: transferAllocations,
            });

            const signedMessage = await createTransferMessage(
                sessionSignerRef.current,
                {
                    destination: checksummedMerchant,
                    allocations: transferAllocations,
                }
            );

            clientRef.current.sendMessage(signedMessage);
            // Response handled in message listener
        } catch (e: any) {
            console.error('[Yellow] Error sending payment:', e);
            setError(e.message || 'Failed to send payment');
            setStatus('error');
        }
    }, [address]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        status,
        error,
        jwtToken,
        channels,
        existingChannelId,
        appSessionId,
        connect,
        createChannel,
        closeChannel,
        getChannels,
        getLedgerBalances,
        ledgerBalances,
        selectedChainId,
        setSelectedChainId,
        supportedChains: SUPPORTED_CHAINS,
        selectedAsset,
        setSelectedAsset,
        supportedAssets: SUPPORTED_ASSETS,
        networkAssets,
        createPaymentSession,
        sendPayment,
        depositToLedger,
        lastPaidInvoiceId,
        disconnect,
    };
}
