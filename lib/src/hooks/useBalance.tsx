import {
  UseBalanceResult,
  useBalance as useBalanceSN
} from "@starknet-react/core";
import { useEffect, useMemo } from "react";
import { useBalance as useBalanceWagmi } from "wagmi";
import { InteractionMode } from "../contexts/SharedState";
import { useAccount } from "./useAccount";
// BRIDGE MODE - Chains import commented out (bridge-specific source chain check)
// import { Chains } from "./useAccount";
import { useMode } from "./useMode";
import { logger } from "@lib/utils/logger";

// BRIDGE MODE - useSourceBridgeInfo import commented out (bridge-specific)
// import { useSourceBridgeInfo } from "./useSourceBridgeInfo";


export interface UseBalanceProps {
  l2TokenAddress: `0x${string}`;
  // EVM mode: optionally pass an L1 token address to fetch EVM balance
  l1TokenAddress?: `0x${string}`;
}

export function useBalance(props: UseBalanceProps): UseBalanceResult {
  const { l2TokenAddress, l1TokenAddress } = props;
  const mode = useMode();
  const { source, addressSource, addressDestination } = useAccount();

  const resultSN = useBalanceSN({
    token: l2TokenAddress,
    address: addressDestination,
  });

  // BRIDGE MODE - source token lookup for bridge commented out
  // const sourceTokenInfo = useSourceBridgeInfo({ l2TokenAddress });

  const resultWagmi = useBalanceWagmi({
    address: addressSource,
    // In EVM mode, the consumer passes l1TokenAddress directly (no bridge token mapping needed)
    token: l1TokenAddress,
  });

  const result = useMemo(() => {
    // Starknet mode or no wallet: use Starknet balance
    if (mode === InteractionMode.Starknet || mode === InteractionMode.None) {
      return resultSN;
    }

    // EVM mode: return the wagmi (L1) balance
    if (mode === InteractionMode.EVM) {
      return resultWagmi;
    }

    // BRIDGE MODE - bridge balance selection commented out
    // if (mode == InteractionMode.Bridge && source == Chains.ETH_MAINNET) {
    //   if (!sourceTokenInfo) {
    //     logger.warn("EasyLeap::useBalance", `Source token info not found for L2 token address ${l2TokenAddress}`);
    //     throw new Error("Source token info not found");
    //   }
    //   return resultWagmi;
    // }
    // throw new Error("In Bridge mode, only ETH network is supported");

    return resultSN;
  }, [mode, source, l1TokenAddress, resultSN, resultWagmi]);

  useEffect(() => {
    logger.verbose("useBalance", {
      result,
      mode,
      addressDestination,
      source,
      resultWagmi,
      addressSource,
      l2TokenAddress,
      error: result.error,
      l1TokenAddress
    });
  }, [result]);

  return result;
}
