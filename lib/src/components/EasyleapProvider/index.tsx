import { mainnet, sepolia } from "@starknet-react/chains";
import {
    publicProvider,
    StarknetConfig,
    StarknetConfigProps,
    voyager
} from "@starknet-react/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { mainnet as mainnetEVM, sepolia as sepoliaEVM } from "viem/chains";
import {
    cookieStorage,
    createConfig,
    createStorage,
    http,
    Config as WagmiConfig,
    WagmiProvider
} from "wagmi";
import { coinbaseWallet, walletConnect } from "wagmi/connectors";
import { PrivyProvider } from "@privy-io/react-auth";
import type { PrivyClientConfig } from "@privy-io/react-auth";

import { Toaster } from "@lib/components/ui/toaster";
import { AnalyticsProvider } from "@lib/contexts/AnalyticsContext";
import { BridgeStarkzapContextProvider } from "@lib/contexts/BridgeStarkzapContext";
import { SharedStateProvider } from "@lib/contexts/SharedState";
import { GlobalTheme, ThemeProvider } from "@lib/contexts/ThemeContext";
import { PrivyContextProvider } from "@lib/contexts/PrivyContext";
import { readEnv } from "@lib/utils/env";

export interface EasyleapConfig {
    wagmiConfig?: WagmiConfig;
    starknetConfig?: StarknetConfigProps;
    children?: React.ReactNode;
    theme?: GlobalTheme;
    queryClient?: QueryClient;
    /**
     * Client-side Privy app id. In Next.js this should be `NEXT_PUBLIC_PRIVY_APP_ID`.
     * If omitted, the provider will attempt to resolve it from env.
     */
    privyAppId?: string;
    /**
     * Optional Privy React SDK config passed to `@privy-io/react-auth`.
     * Useful for controlling available login methods (e.g. Google/email only).
     */
    privyConfig?: PrivyClientConfig;
    /**
     * StarkZap config used by the SDK’s Privy/Starknet embedded wallet flow.
     * If omitted, it will be resolved from env and sensible defaults.
     */
    starkzap?: {
        rpcUrl?: string;
        network?: "mainnet" | "sepolia";
        ethereumRpcUrl?: string;
        layerZeroApiKey?: string;
        bridgePrivateKey?: string;
    };
    /**
     * UI feature flags. Defaults preserve existing behavior.
     */
    ui?: {
        enableEvmMode?: boolean;
    };
    /**
     * Mixpanel project token for bridge analytics.
     * When provided, bridge lifecycle events are tracked automatically.
     */
    mixpanelToken?: string;
}

const WALLET_CONNECT_DEFAULT_PROJECT_ID = "242405a2808ac6e90831cb540f36617f"; // akira@unwraplabs.com wallet connect account

// Create a default QueryClient instance for React Query (required by Wagmi v2)
const defaultQueryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1
        }
    }
});

export function defaultEasyleapConfig(): {
    wagmiConfig: WagmiConfig;
    starknetConfig: StarknetConfigProps;
} {
    return {
        wagmiConfig: createConfig({
            chains: [mainnetEVM, sepoliaEVM],
            transports: {
                [mainnetEVM.id]: http(
                    `https://eth-mainnet.g.alchemy.com/v2/vwxBDYHrRCl3C5uuzZqj1`
                ),
                [sepoliaEVM.id]: http(
                    `https://eth-sepolia.g.alchemy.com/v2/vwxBDYHrRCl3C5uuzZqj1`
                )
            },
            connectors: [
               walletConnect({
                    projectId: WALLET_CONNECT_DEFAULT_PROJECT_ID,
                    // TODO: putting on endur, will make dynamic later on
                    metadata: {
                        name: "Endur",
                        description: "Bridge funds to Starknet dApps in a single click",
                        url: "https://endur.fi",
                        icons: ["https://endur.fi/logo.png"]
                    },
                    showQrModal: true,
                }),
                coinbaseWallet({
                    appName: "Endur",
                    appLogoUrl: "https://endur.fi/logo.png",
                }),
            ],
            ssr: true,
            storage: createStorage({ storage: cookieStorage }),
        }),
        starknetConfig: {
            chains: [mainnet, sepolia],
            provider: publicProvider(),
            explorer: voyager
        }
    };
}

export function EasyleapProvider(
    props: EasyleapConfig = {
        starknetConfig: defaultEasyleapConfig().starknetConfig,
        wagmiConfig: defaultEasyleapConfig().wagmiConfig,
        children: null,
        theme: {}
    }
) {
    const wagmiConfig = React.useMemo(() => {
        if (!props.wagmiConfig) {
            return defaultEasyleapConfig().wagmiConfig;
        }
        return props.wagmiConfig;
    }, [props.wagmiConfig]);

    const starknetConfig: StarknetConfigProps = React.useMemo(() => {
        if (!props.starknetConfig) {
            return defaultEasyleapConfig().starknetConfig;
        }
        return props.starknetConfig;
    }, [props.starknetConfig]);

    const queryClient = React.useMemo(() => {
        return props.queryClient || defaultQueryClient;
    }, [props.queryClient]);

    const privyAppId = React.useMemo(() => {
        const fromProps =
            typeof props.privyAppId === "string"
                ? props.privyAppId.trim()
                : null;
        if (fromProps) return fromProps;

        const fromEnv =
            readEnv("NEXT_PUBLIC_PRIVY_APP_ID") ?? readEnv("VITE_PRIVY_APP_ID");
        if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim();

        throw new Error(
            "EasyleapProvider: Missing Privy app id. Provide `privyAppId` or set NEXT_PUBLIC_PRIVY_APP_ID / VITE_PRIVY_APP_ID."
        );
    }, [props.privyAppId]);

    const starkzapRpcUrl = React.useMemo(() => {
        const fromProps =
            typeof props.starkzap?.rpcUrl === "string"
                ? props.starkzap.rpcUrl.trim()
                : null;
        if (fromProps) return fromProps;

        const fromEnv = readEnv("NEXT_PUBLIC_RPC_URL") ?? readEnv("VITE_RPC_URL");
        if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim();

        throw new Error(
            "EasyleapProvider: Missing Starknet RPC url. Provide `starkzap.rpcUrl` or set NEXT_PUBLIC_RPC_URL / VITE_RPC_URL."
        );
    }, [props.starkzap?.rpcUrl]);

    const starkzapNetwork = React.useMemo(() => {
        return (
            props.starkzap?.network ??
            ((readEnv("NEXT_PUBLIC_CHAIN_ID") ?? readEnv("VITE_CHAIN_ID")) ===
            "SN_MAIN"
                ? "mainnet"
                : "sepolia")
        );
    }, [props.starkzap?.network]);

    const ethereumRpcUrl = React.useMemo(() => {
        const fromProps =
            typeof props.starkzap?.ethereumRpcUrl === "string"
                ? props.starkzap.ethereumRpcUrl.trim()
                : null;
        if (fromProps) return fromProps;

        const fromEnv =
            readEnv("NEXT_PUBLIC_ETHEREUM_RPC_URL") ??
            readEnv("VITE_ETHEREUM_RPC_URL");
        if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim();

        throw new Error(
            "EasyleapProvider: Missing Ethereum RPC url. Provide `starkzap.ethereumRpcUrl` or set NEXT_PUBLIC_ETHEREUM_RPC_URL / VITE_ETHEREUM_RPC_URL."
        );
    }, [props.starkzap?.ethereumRpcUrl]);

    const layerZeroApiKey = React.useMemo(() => {
        const fromProps =
            typeof props.starkzap?.layerZeroApiKey === "string"
                ? props.starkzap.layerZeroApiKey.trim()
                : null;
        if (fromProps) return fromProps;

        const fromEnv =
            readEnv("NEXT_PUBLIC_LAYERZERO_API_KEY") ??
            readEnv("VITE_LAYERZERO_API_KEY");
        if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim();

        throw new Error(
            "EasyleapProvider: Missing LayerZero API key. Provide `starkzap.layerZeroApiKey` or set NEXT_PUBLIC_LAYERZERO_API_KEY / VITE_LAYERZERO_API_KEY."
        );
    }, [props.starkzap?.layerZeroApiKey]);

    const bridgePrivateKey = React.useMemo(() => {
        const fromProps =
            typeof props.starkzap?.bridgePrivateKey === "string"
                ? props.starkzap.bridgePrivateKey.trim()
                : null;
        if (fromProps) return fromProps;

        const fromEnv =
            readEnv("NEXT_PUBLIC_BRIDGE_PRIVATE_KEY") ??
            readEnv("VITE_BRIDGE_PRIVATE_KEY");
        if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim();

        throw new Error(
            "EasyleapProvider: Missing bridge private key. Provide `starkzap.bridgePrivateKey` or set NEXT_PUBLIC_BRIDGE_PRIVATE_KEY / VITE_BRIDGE_PRIVATE_KEY."
        );
    }, [props.starkzap?.bridgePrivateKey]);

    const mixpanelToken = React.useMemo(() => {
        const fromProps =
            typeof props.mixpanelToken === "string"
                ? props.mixpanelToken.trim()
                : null;
        if (fromProps) return fromProps;

        const fromEnv =
            readEnv("NEXT_PUBLIC_MIXPANEL_TOKEN") ??
            readEnv("VITE_MIXPANEL_TOKEN");
        if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim();

        // Mixpanel is optional, so return undefined if not provided
        return undefined;
    }, [props.mixpanelToken]);

    return (
        <SharedStateProvider ui={props.ui}>
            <ThemeProvider theme={props.theme}>
                <QueryClientProvider client={queryClient}>
                    <PrivyProvider
                        appId={privyAppId}
                        config={props.privyConfig}
                    >
                        <PrivyContextProvider
                            config={{
                                rpcUrl: starkzapRpcUrl,
                                network: starkzapNetwork,
                            }}
                        >
                            <BridgeStarkzapContextProvider
                                config={{
                                    rpcUrl: starkzapRpcUrl,
                                    network: starkzapNetwork,
                                    ethereumRpcUrl,
                                    layerZeroApiKey,
                                    privateKey: bridgePrivateKey,
                                }}
                            >
                                <WagmiProvider config={wagmiConfig}>
                                    <StarknetConfig
                                        chains={starknetConfig.chains || [mainnet]}
                                        provider={starknetConfig.provider}
                                        explorer={starknetConfig.explorer}
                                        connectors={
                                            starknetConfig?.connectors || []
                                        }
                                    >
                                        <AnalyticsProvider token={mixpanelToken}>
                                            {props.children}
                                            <Toaster />
                                        </AnalyticsProvider>
                                    </StarknetConfig>
                                </WagmiProvider>
                            </BridgeStarkzapContextProvider>
                        </PrivyContextProvider>
                    </PrivyProvider>
                </QueryClientProvider>
            </ThemeProvider>
        </SharedStateProvider>
    );
}
