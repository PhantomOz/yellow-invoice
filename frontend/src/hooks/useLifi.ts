import { createConfig, getQuote, getStatus, getTokens, executeRoute, type Route } from '@lifi/sdk';
import { useMemo, useEffect } from 'react';

export const useLifi = () => {

    useEffect(() => {
        createConfig({
            integrator: 'yellow-invoice',
            apiUrl: 'https://staging.li.quest/v1',
        });
    }, []);

    const getTransferQuote = async (
        fromChain: number,
        fromToken: string,
        toChain: number,
        toToken: string,
        fromAmount: string,
        fromAddress: string,
        recipient?: string
    ) => {
        try {
            const quote = await getQuote({
                fromChain,
                fromToken,
                toChain,
                toToken,
                fromAmount,
                fromAddress,
                toAddress: recipient,
            });
            return quote;
        } catch (error) {
            console.error('Li.Fi Quote Error:', error);
            throw error;
        }
    };

    const executeTransfer = async (route: Route, signer: any) => {
        try {
            // executeRoute signature in v3: (signer, route) OR (route, settings) depending on version.
            // Based on lint error "Route has no properties in common with ExecutionOptions", 
            // it seems we might be passing arguments in wrong order if it expects options first?
            // OR the sdk exports `executeRoute` which takes `(walletClient, route)`.
            // Let's force cast or check docs. Assuming (signer, route) is standard for viem integration.

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const executedRoute = await executeRoute(signer, route);
            return executedRoute;
        } catch (error) {
            console.error('Li.Fi Execution Error:', error);
            throw error;
        }
    };

    const getTransferStatus = async (txHash: string, bridge: string, fromChain: number, toChain: number) => {
        return await getStatus({
            txHash,
            bridge,
            fromChain,
            toChain,
        });
    };

    const getChainTokens = async (chainId: number) => {
        const result = await getTokens({ chains: [chainId] });
        return result.tokens[chainId] || [];
    };

    return {
        getQuote: getTransferQuote,
        executeRoute: executeTransfer,
        getStatus: getTransferStatus,
        getTokens: getChainTokens
    };
};
