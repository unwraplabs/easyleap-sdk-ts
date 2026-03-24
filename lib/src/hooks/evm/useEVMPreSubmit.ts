// BRIDGE MODE - this hook is entirely bridge-specific.
// It handled ERC-20 approval for the EasyLeap bridge manager contract before a bridge transaction.
// The entire implementation is commented out; the hook always returns undefined.

// import { encodeFunctionData } from "viem";
import { SourceBridgeInfo } from "../useSourceBridgeInfo";
// import {
//   useReadContract,
//   useSendTransaction,
//   useWaitForTransactionReceipt,
// } from "wagmi";
// import { useMemo } from "react";
import { Address } from "@starknet-react/chains";
// import { logger } from "@lib/utils/logger";
// import { ADDRESSES } from "@lib/utils";

export interface PreSubmitHook {
  buttonText: string;
  onClick: () => void;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string;
  isDisabled: boolean;
  reset: () => void;
}

export type PreSubmitHookResult = PreSubmitHook | undefined;

export interface PreSubmitHookProps {
  sourceTokenInfo?: SourceBridgeInfo;
  amount: bigint;
  address: Address;
}

/**
 * BRIDGE MODE - implementation commented out.
 * Previously handled ERC-20 token approval for the EasyLeap bridge manager before bridging.
 * Always returns undefined now; re-enable when bridge mode is restored.
 */
export const useEVMPreSubmit = (_props: PreSubmitHookProps): PreSubmitHookResult => {
  // BRIDGE MODE - approval logic commented out
  // const { sourceTokenInfo, amount, address } = props;
  // const { sendTransaction, error: errorEVM, isPending: isPendingEVM, isSuccess: isSuccessEVM,
  //   isError: isErrorEVM, data: dataEVM, reset: resetEVM } = useSendTransaction();

  // const { data: allowance, isLoading: allowanceLoading } = useReadContract({
  //   address: sourceTokenInfo?.l1_token_address || '0x0',
  //   abi: [{ "constant": true, "inputs": [{ "name": "", "type": "address" }, { "name": "", "type": "address" }],
  //     "name": "allowance", "outputs": [{ "name": "", "type": "uint256" }],
  //     "payable": false, "stateMutability": "view", "type": "function" }],
  //   functionName: 'allowance',
  //   args: [address, ADDRESSES.ETH_MAINNET.BRIDGE_MANAGER as `0x${string}`],
  // });

  // const isApprovalRequired = useMemo(() => {
  //   logger.verbose("useEVMPreSubmit::isApprovalRequired", sourceTokenInfo, allowance, amount);
  //   if (!sourceTokenInfo || !sourceTokenInfo.requireApproval) return false;
  //   if (allowance && allowance >= amount) return false;
  //   return true;
  // }, [allowance, amount, sourceTokenInfo]);

  // const output = useMemo(() => {
  //   if (!sourceTokenInfo || !isApprovalRequired) return;
  //   const errorMessage = isErrorEVM ? parseWagmiError(errorEVM) : "";
  //   return {
  //     buttonText: isPendingEVM ? "Approving..." : "Approve",
  //     onClick: () => {
  //       sendTransaction({
  //         to: sourceTokenInfo.l1_token_address as `0x${string}`,
  //         data: encodeFunctionData({
  //           abi: [{ type: "function", name: "approve",
  //             inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
  //             outputs: [{ type: "bool" }], stateMutability: "nonpayable" }],
  //           functionName: "approve",
  //           args: [ADDRESSES.ETH_MAINNET.BRIDGE_MANAGER as `0x${string}`, amount]
  //         })
  //       });
  //     },
  //     isLoading: isPendingEVM, isSuccess: isSuccessEVM, isError: isErrorEVM,
  //     errorMessage, isDisabled: isPendingEVM || isSuccessEVM || isErrorEVM, reset: resetEVM,
  //   };
  // }, [amount, isPendingEVM, isSuccessEVM, isErrorEVM, errorEVM, sourceTokenInfo, isApprovalRequired, address]);

  // const txHashState = useWaitForTransactionReceipt({ hash: dataEVM });

  // const isLoading = useMemo(() => {
  //   if (!output) return false;
  //   if (sourceTokenInfo?.requireApproval) return output.isLoading || allowanceLoading || txHashState.isLoading;
  //   return false;
  // }, [output, isApprovalRequired, allowanceLoading, txHashState]);

  // return output ? { ...output, isLoading } : undefined;

  return undefined;
};

// BRIDGE MODE - wagmi error parser commented out (used by approval hook above)
// export function parseWagmiError(error: unknown): string {
//   if (!error) return "";
//   if (typeof error !== "object") return "Unknown error";
//   const err = error as any;
//   if (err.code === 4001 || err.message?.includes("User rejected")) { return "Transaction rejected by user."; }
//   if (err?.error?.data?.message) { return err.error.data.message; }
//   if (err?.cause?.reason) { return err.cause.reason; }
//   if (err?.reason) { return err.reason; }
//   if (err?.error?.message) { return err.error.message; }
//   if (err?.message) { return err.message; }
//   return "An unexpected error occurred.";
// }
