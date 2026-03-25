import {
  UseBalanceResult,
  useBalance as useBalanceSN,
} from "@starknet-react/core";
import { useEffect, useMemo } from "react";
import { useBalance as useBalanceWagmi } from "wagmi";
import { InteractionMode } from "../contexts/SharedState";
import { useAccount } from "./useAccount";
import { useMode } from "./useMode";
import { logger } from "@lib/utils/logger";

/**
 * EasyLeap balance hook.
 *
 * Callers pass only a single token address. Internally, we pick the correct
 * underlying balance query based on the active interaction mode.
 *
 * Notes:
 * - Starknet mode uses the passed token address as the L2 token address.
 * - EVM mode uses the passed token address as the EVM token address.
 */
export function useBalance(tokenAddress: `0x${string}`): UseBalanceResult {
  const mode = useMode();
  const { evmAddress, starknetAddress } = useAccount();

  const starknetBalance = useBalanceSN({
    token: tokenAddress,
    // Disable query when in EVM mode
    address: mode === InteractionMode.EVM ? undefined : starknetAddress,
  });

  const evmBalance = useBalanceWagmi({
    // Disable query when in Starknet mode
    address: mode === InteractionMode.EVM ? evmAddress : undefined,
    token: tokenAddress,
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
      error: result.error,
      tokenAddress,
      formatted: result?.data?.formatted,
    });
  }, [result, mode, starknetAddress, evmAddress, tokenAddress]);

  return result;
}
