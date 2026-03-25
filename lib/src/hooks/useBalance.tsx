import {
  UseBalanceResult,
  useBalance as useBalanceSN
} from "@starknet-react/core";
import { useEffect, useMemo } from "react";
import { useBalance as useBalanceWagmi } from "wagmi";
import { InteractionMode } from "../contexts/SharedState";
import { useAccount } from "./useAccount";
import { useMode } from "./useMode";
import { logger } from "@lib/utils/logger";

export interface UseBalanceProps {
  l2TokenAddress: `0x${string}`;
  // EVM mode: optionally pass an L1 token address to fetch EVM balance
  l1TokenAddress?: `0x${string}`;
}

export function useBalance(props: UseBalanceProps): UseBalanceResult {
  const { l2TokenAddress, l1TokenAddress } = props;
  const mode = useMode();
  const { evmAddress, starknetAddress } = useAccount();

  const starknetBalance = useBalanceSN({
    token: l2TokenAddress,
    address: starknetAddress,
  });

  const evmBalance = useBalanceWagmi({
    address: evmAddress,
    token: l1TokenAddress,
  });

  const result = useMemo(() => {
    // Starknet mode (and "None" when no wallet is connected): use Starknet balance
    if (mode !== InteractionMode.EVM) return starknetBalance;

    // EVM mode: use EVM balance
    return evmBalance;
  }, [mode, starknetBalance, evmBalance]);

  useEffect(() => {
    logger.verbose("useBalance", {
      result,
      mode,
      starknetAddress,
      evmAddress,
      l2TokenAddress,
      error: result.error,
      l1TokenAddress,
      formatted: result?.data?.formatted
    });
  }, [result, mode, starknetAddress, evmAddress, l2TokenAddress, l1TokenAddress]);

  return result;
}
