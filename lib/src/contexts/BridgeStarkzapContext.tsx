/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { ArgentXV050Preset, StarkSigner, StarkZap, type WalletInterface } from "starkzap";

export interface BridgeStarkzapConfig {
  rpcUrl: string;
  network: "mainnet" | "sepolia";
  ethereumRpcUrl: string;
  layerZeroApiKey?: string;
  privateKey: string;
}

export interface BridgeStarkzapContextValue {
  starkzapBridgeSDK: StarkZap | null;
  starkzapBridgeWallet: WalletInterface | null;
  isInitializing: boolean;
  error: Error | null;
  config?: BridgeStarkzapConfig;
}

const BridgeStarkzapContext = createContext<BridgeStarkzapContextValue | null>(null);

export const BridgeStarkzapContextProvider: React.FC<{
  children: React.ReactNode;
  config?: BridgeStarkzapConfig;
}> = ({ children, config }) => {
  const [starkzapBridgeSDK, setStarkzapBridgeSDK] = useState<StarkZap | null>(null);
  const [starkzapBridgeWallet, setStarkzapBridgeWallet] = useState<WalletInterface | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    const initialize = async () => {
      if (hasInitializedRef.current) return;
      if (!config) {
        setError(new Error("Bridge StarkZap config is not provided"));
        return;
      }

      hasInitializedRef.current = true;
      setIsInitializing(true);

      try {
        const sdk = new StarkZap({
          network: config.network ?? "mainnet",
          rpcUrl: config.rpcUrl,
          bridging: {
            ethereumRpcUrl: config.ethereumRpcUrl,
            layerZeroApiKey: config.layerZeroApiKey,
          },
        });

        const signer = new StarkSigner(config.privateKey);
        const onboard = await sdk.onboard({
          strategy: "signer",
          deploy: "never",
          account: { signer },
          accountPreset: ArgentXV050Preset,
        });

        setStarkzapBridgeSDK(sdk);
        setStarkzapBridgeWallet(onboard.wallet);
        setError(null);
      } catch (err) {
        setStarkzapBridgeSDK(null);
        setStarkzapBridgeWallet(null);
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to initialize Bridge StarkZap wallet"),
        );
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [config]);

  const value: BridgeStarkzapContextValue = {
    starkzapBridgeSDK,
    starkzapBridgeWallet,
    isInitializing,
    error,
    config,
  };

  return (
    <BridgeStarkzapContext.Provider value={value}>
      {children}
    </BridgeStarkzapContext.Provider>
  );
};

export const useBridgeStarkzapContext = (): BridgeStarkzapContextValue => {
  const context = useContext(BridgeStarkzapContext);
  if (!context) {
    return {
      starkzapBridgeSDK: null,
      starkzapBridgeWallet: null,
      isInitializing: false,
      error: new Error("BridgeStarkzapContext is not available"),
    };
  }
  return context;
};
