import {
  UseStrk20BalancesProps,
  useStrk20Balances as useStrk20BalancesSN,
} from "@starknetfoundation/starknet-start-react";
import { formatUnits } from "ethers";
import { useMemo } from "react";
import { InteractionMode } from "../contexts/SharedState";
import { useMode } from "./useMode";

export type Strk20Balance = {
  token: `0x${string}`;
  /** Raw balance in smallest unit (hex felt from wallet). */
  balance: string;
  value: bigint;
  /** Present when `decimals` is passed to the hook. */
  formatted?: string;
};

type UseStrk20BalanceOptions = Omit<UseStrk20BalancesProps, "tokens"> & {
  /** Token decimals used to populate `data.formatted`. */
  decimals?: number;
};

export type UseStrk20BalanceResult = Omit<
  ReturnType<typeof useStrk20BalancesSN>,
  "data" | "getBalances" | "getBalancesAsync"
> & {
  data: Strk20Balance | undefined;
  getBalance: () => void;
  getBalanceAsync: ReturnType<typeof useStrk20BalancesSN>["getBalancesAsync"];
};

/**
 * EasyLeap shielded (STRK20) balance hook.
 *
 * Callers pass a single token address. Internally this wraps Starknet Start's
 * `useStrk20Balances` and returns the matching private balance entry.
 *
 * Shielded balances are Starknet-only; the query is disabled in EVM mode.
 */
export function useStrk20Balance(
  tokenAddress: `0x${string}`,
  options: UseStrk20BalanceOptions = {},
): UseStrk20BalanceResult {
  const mode = useMode();
  const { decimals, ...strk20Options } = options;
  const isEnabled = mode !== InteractionMode.EVM;

  const strk20Balances = useStrk20BalancesSN({
    ...strk20Options,
    tokens: isEnabled ? [tokenAddress] : [],
  });

  const data = useMemo(() => {
    if (!isEnabled || !strk20Balances.data) return undefined;

    const entry = strk20Balances.data.find(
      (balance) => balance.token.toLowerCase() === tokenAddress.toLowerCase(),
    );

    if (!entry) return undefined;

    const value = BigInt(entry.balance);

    return {
      token: tokenAddress,
      balance: entry.balance,
      value,
      ...(decimals !== undefined
        ? { formatted: formatUnits(value, decimals) }
        : {}),
    };
  }, [decimals, isEnabled, strk20Balances.data, tokenAddress]);

  const getBalance = () => {
    if (!isEnabled) return;
    strk20Balances.getBalances([tokenAddress]);
  };

  const getBalanceAsync = () => {
    if (!isEnabled) {
      return Promise.reject(
        new Error("Shielded balances are unavailable in EVM mode"),
      );
    }

    return strk20Balances.getBalancesAsync([tokenAddress]);
  };

  return {
    ...strk20Balances,
    data,
    getBalance,
    getBalanceAsync,
  };
}
