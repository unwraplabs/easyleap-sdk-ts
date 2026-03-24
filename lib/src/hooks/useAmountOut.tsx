import { UseReadContractResult } from "@starknet-react/core";
import { useMemo } from "react";

// BRIDGE MODE - mode check no longer needed since fee logic is disabled
// import { useMode } from "./useMode";
// import { InteractionMode } from "@lib/contexts";

// todo should define a proper output type

export type UseReadContractResult_EasyLeap = Omit<UseReadContractResult<any, any>, 'refetch'> & {
  amountOut: bigint;
  fee: bigint;
}

/**
 * Returns the amount out after fees.
 * BRIDGE MODE: fee calculation was 0.05% of the input amount when bridging.
 * Currently, no fees are applied in Starknet or EVM mode.
 *
 * @param amount_raw In full decimal string format (e.g. "1000000000000000000" for 1 ETH)
 */
export function useAmountOut(amount_raw: bigint): UseReadContractResult_EasyLeap {
  // BRIDGE MODE - mode-based fee calculation commented out
  // const mode = useMode();
  // const output = useMemo(() => {
  //   if (mode != InteractionMode.Bridge) {
  //     return { fee: 0n, amountOut: amount_raw };
  //   }
  //   const fee = amount_raw * 5n / 10000n; // 0.05% fee
  //   const amountOut = amount_raw - fee;
  //   return { fee, amountOut };
  // }, [amount_raw]);

  // No fees in Starknet/EVM mode
  const output = useMemo(() => {
    return {
      fee: 0n,
      amountOut: amount_raw
    };
  }, [amount_raw]);

  return {
    amountOut: output.amountOut,
    fee: output.fee,
    isLoading: false,
    isSuccess: true,
    isError: false,
    isPending: false,
    isFetching: false,
    status: "success",
    error: null,
    fetchStatus: "idle",
    data: null,
  };
}
