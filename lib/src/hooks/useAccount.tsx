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
    if (starknetAddress && chainIdSN != chain.id) {
      result.switchChain();
    }
    if (result.error) console.error("switching", result.error);
  }, [starknetAddress, chainIdSN, chain]);

  useEffect(() => {
    // Mode logic:
    // - Only SN wallet → Starknet mode
    // - Only EVM wallet → EVM mode
    // - Both connected → Starknet mode (unless manually switched to EVM)
    // - Neither → None mode
    if (evmAddress && starknetAddress) {
      if (!sharedState.isModeSwitchedManually) {
        sharedState.setMode(InteractionMode.Starknet);
      }
    } else if (starknetAddress && !evmAddress) {
      sharedState.setMode(InteractionMode.Starknet);
    } else if (evmAddress && !starknetAddress) {
      sharedState.setMode(InteractionMode.EVM);
    } else {
      sharedState.setMode(InteractionMode.None);
    }
  }, [evmAddress, starknetAddress]);

  return {
    evmAddress,
    starknetAddress,
    chainIdEVM,
    chainIdSN,
  };
}
