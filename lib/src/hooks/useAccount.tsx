import {
  useAccount as useAccountSn,
  useNetwork,
  useSwitchChain,
} from "@starknet-react/core";
import { createConfig, http, switchChain as switchChainEVM } from "@wagmi/core";
import { mainnet, sepolia } from "@wagmi/core/chains";
import { useEffect } from "react";
import { num } from "starknet";
import { useAccount as useAccountWagmi, useConfig } from "wagmi";
import { InteractionMode, useSharedState } from "../contexts/SharedState";
import { usePrivyContext } from "../contexts/PrivyContext";

export enum Chains {
  ETH_MAINNET = "ETH_MAINNET",
  STARKNET = "STARKNET",
}

/** Return type of useAccount */
export interface useAccountResult {
  evmAddress: `0x${string}` | undefined;
  starknetAddress: `0x${string}` | undefined;
  chainIdEVM: number | undefined;
  chainIdSN: bigint | undefined;
}

export const evmConfig = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

/**
 * This hook provides the account information and the mode of interaction with the DApp.
 * Starknet mode: when a Starknet wallet is connected
 * EVM mode: when an EVM wallet is connected
 * @returns useAccountResult
 */
export function useAccount(): useAccountResult {
  const config = useConfig();
  const { address: evmAddress, chainId: chainIdEVM } = useAccountWagmi();
  const { address: starknetAddressSN, chainId: chainIdSN } = useAccountSn();
  const { chain } = useNetwork();
  const { privyWallet } = usePrivyContext();
  const sharedState = useSharedState();
  const enableEvmMode = sharedState.ui.enableEvmMode;

  // EVM chain switching
  if (evmAddress && chainIdEVM != config.chains[0].id) {
    console.log("Switching to mainnet");
    switchChainEVM(evmConfig, { chainId: config.chains[0].id as 1 | 11155111 });
  }

  // Prioritize Privy wallet address if connected
  const starknetAddress = privyWallet?.address
    ? (privyWallet.address as `0x${string}`)
    : starknetAddressSN;

  const result = useSwitchChain({
    params: {
      chainId: num.getHexString(chain.id.toString()),
    },
  });

  useEffect(() => {
    // Only attempt to switch chains if we have a connected Starknet wallet
    if (starknetAddress && chainIdSN && chainIdSN != chain.id) {
      result.switchChain();
    }
    // Only log errors if we have a connected Starknet wallet
    if (result.error && starknetAddress) {
      console.error("switching", result.error);
    }
  }, [starknetAddress, chainIdSN, chain, result]);

  useEffect(() => {
    // Mode logic:
    // - Only SN wallet → Starknet mode
    // - Only EVM wallet → None mode (EVM is only for bridging, not main interaction)
    // - Both connected → Starknet mode (unless manually switched to EVM)
    // - Neither → None mode
    if (!enableEvmMode) {
      if (starknetAddress) {
        sharedState.setMode(InteractionMode.Starknet);
      } else {
        sharedState.setMode(InteractionMode.None);
      }
      return;
    }

    if (evmAddress && starknetAddress) {
      // Both wallets connected - default to Starknet unless manually switched
      if (!sharedState.isModeSwitchedManually) {
        sharedState.setMode(InteractionMode.Starknet);
      }
    } else if (starknetAddress && !evmAddress) {
      // Only Starknet wallet connected
      sharedState.setMode(InteractionMode.Starknet);
    } else if (evmAddress && !starknetAddress) {
      // Only EVM wallet connected (from bridge dialog) - set to None
      // EVM wallet is only for bridging, not for main interaction mode
      sharedState.setMode(InteractionMode.None);
      // Reset manual switch flag since there's no Starknet wallet
      if (sharedState.isModeSwitchedManually) {
        sharedState.setModeSwitchedManually(false);
      }
    } else {
      // Neither wallet connected
      sharedState.setMode(InteractionMode.None);
      // Reset manual switch flag
      if (sharedState.isModeSwitchedManually) {
        sharedState.setModeSwitchedManually(false);
      }
    }
  }, [enableEvmMode, evmAddress, starknetAddress, sharedState]);

  return {
    evmAddress,
    starknetAddress,
    chainIdEVM,
    chainIdSN,
  };
}
