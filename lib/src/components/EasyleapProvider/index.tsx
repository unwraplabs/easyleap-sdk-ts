import { mainnet, sepolia } from "@starknet-react/chains";
import {
    publicProvider,
    StarknetConfig,
    StarknetConfigProps,
    voyager
} from "@starknet-react/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig } from "connectkit";
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
import { PrivyProvider } from "@privy-io/react-auth";

import { Toaster } from "@lib/components/ui/toaster";
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
     * StarkZap config used by the SDK’s Privy/Starknet embedded wallet flow.
     * If omitted, it will be resolved from env and sensible defaults.
     */
    starkzap?: {
        rpcUrl?: string;
        network?: "mainnet" | "sepolia";
    };
    /**
     * UI feature flags. Defaults preserve existing behavior.
     */
    ui?: {
        enableEvmMode?: boolean;
    };
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

export function defaultEasyleapConfig() {
    return {
        wagmiConfig: createConfig(
            getDefaultConfig({
                // Your dApps chains
                chains: [mainnetEVM, sepoliaEVM],
                transports: {
                    // RPC URL for each chain
                    [mainnetEVM.id]: http(
                        `https://eth-mainnet.g.alchemy.com/v2/vwxBDYHrRCl3C5uuzZqj1`
                    ),
                    [sepoliaEVM.id]: http(
                        `https://eth-sepolia.g.alchemy.com/v2/vwxBDYHrRCl3C5uuzZqj1`
                    )
                },

                // Server Side Rendering
                ssr: true,

                // Enable persistence
                storage: createStorage({ storage: cookieStorage }),

                // Required API Keys
                walletConnectProjectId: WALLET_CONNECT_DEFAULT_PROJECT_ID,

                // Required App Info
                appName: "Easyleap",

                // Optional App Info
                appDescription:
                    "Bridge funds to Starknet dApps in a single click",
                appUrl: "https://easyleap.com", // your app's url
                appIcon: "https://easyleap.com/logo.png" // your app's icon, no bigger than 1024x1024px (max. 1MB)
            })
        ),
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
        if (typeof props.privyAppId === "string") return props.privyAppId;
        return (
            readEnv("NEXT_PUBLIC_PRIVY_APP_ID") ??
            readEnv("VITE_PRIVY_APP_ID") ??
            ""
        );
    }, [props.privyAppId]);

    return (
        <SharedStateProvider>
            <ThemeProvider theme={props.theme}>
                <QueryClientProvider client={queryClient}>
                    <PrivyProvider appId={privyAppId}>
                        <PrivyContextProvider
                            config={{
                                rpcUrl:
                                    props.starkzap?.rpcUrl ??
                                    readEnv("NEXT_PUBLIC_RPC_URL") ??
                                    readEnv("VITE_RPC_URL") ??
                                    "",
                                network:
                                    props.starkzap?.network ??
                                    ((readEnv("NEXT_PUBLIC_CHAIN_ID") ??
                                        readEnv("VITE_CHAIN_ID")) === "SN_MAIN"
                                        ? "mainnet"
                                        : "sepolia"),
                                ui: {
                                    enableEvmMode:
                                        props.ui?.enableEvmMode ?? true
                                }
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
                                    {props.children}
                                    <Toaster />
                                </StarknetConfig>
                            </WagmiProvider>
                        </PrivyContextProvider>
                    </PrivyProvider>
                </QueryClientProvider>
            </ThemeProvider>
        </SharedStateProvider>
    );
}
