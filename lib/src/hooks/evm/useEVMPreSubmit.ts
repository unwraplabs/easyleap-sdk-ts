import { encodeFunctionData } from "viem";
import {
  useReadContract,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useMemo } from "react";
import { logger } from "@lib/utils/logger";

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

export interface EVMPreSubmitProps {
  tokenAddress: `0x${string}`;
  spenderAddress: `0x${string}`;
  amount: bigint;
  ownerAddress?: `0x${string}`;
  enabled?: boolean;
}

const erc20AllowanceAbi = [
  {
    type: "function" as const,
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view" as const,
  },
] as const;

const erc20ApproveAbi = [
  {
    type: "function" as const,
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable" as const,
  },
] as const;

/**
 * Generalized ERC-20 approval hook for EVM mode.
 * Checks the current allowance and returns a PreSubmitHook when approval is needed.
 * Returns `undefined` when the allowance is already sufficient (no pre-step required).
 */
export const useEVMPreSubmit = (props: EVMPreSubmitProps): PreSubmitHookResult => {
  const { tokenAddress, spenderAddress, amount, ownerAddress, enabled = true } = props;

  const isActive = enabled && !!ownerAddress && amount > 0n;

  const {
    data: allowance,
    isLoading: allowanceLoading,
  } = useReadContract({
    address: tokenAddress,
    abi: erc20AllowanceAbi,
    functionName: "allowance",
    args: ownerAddress ? [ownerAddress, spenderAddress] : undefined,
    query: { enabled: isActive },
  });

  const {
    sendTransaction,
    error: errorEVM,
    isPending: isPendingEVM,
    isSuccess: isSuccessEVM,
    isError: isErrorEVM,
    data: dataEVM,
    reset: resetEVM,
  } = useSendTransaction();

  const txReceipt = useWaitForTransactionReceipt({ hash: dataEVM });

  const isApprovalRequired = useMemo(() => {
    if (!isActive) return false;
    logger.verbose("useEVMPreSubmit::isApprovalRequired", { allowance, amount });
    if (allowance !== undefined && allowance >= amount) return false;
    return true;
  }, [allowance, amount, isActive]);

  const output = useMemo((): PreSubmitHookResult => {
    if (!isApprovalRequired) return undefined;

    const errorMessage = isErrorEVM ? parseWagmiError(errorEVM) : "";

    return {
      buttonText: isPendingEVM || txReceipt.isLoading ? "Approving..." : "Approve",
      onClick: () => {
        sendTransaction({
          to: tokenAddress,
          data: encodeFunctionData({
            abi: erc20ApproveAbi,
            functionName: "approve",
            args: [spenderAddress, amount],
          }),
        });
      },
      isLoading: isPendingEVM || allowanceLoading || txReceipt.isLoading,
      isSuccess: isSuccessEVM && txReceipt.isSuccess,
      isError: isErrorEVM || txReceipt.isError,
      errorMessage: txReceipt.isError
        ? parseWagmiError(txReceipt.error)
        : errorMessage,
      isDisabled: isPendingEVM || (isSuccessEVM && txReceipt.isSuccess) || isErrorEVM,
      reset: resetEVM,
    };
  }, [
    isApprovalRequired,
    amount,
    tokenAddress,
    spenderAddress,
    isPendingEVM,
    isSuccessEVM,
    isErrorEVM,
    errorEVM,
    allowanceLoading,
    txReceipt.isLoading,
    txReceipt.isSuccess,
    txReceipt.isError,
    txReceipt.error,
    sendTransaction,
    resetEVM,
  ]);

  return output;
};

export function parseWagmiError(error: unknown): string {
  if (!error) return "";
  if (typeof error !== "object") return "Unknown error";
  const err = error as Record<string, unknown>;
  if (
    (err as { code?: number }).code === 4001 ||
    (err as { message?: string }).message?.includes("User rejected")
  ) {
    return "Transaction rejected by user.";
  }
  const nested = err as Record<string, Record<string, unknown>>;
  if (nested?.error?.data && (nested.error.data as { message?: string }).message)
    return (nested.error.data as { message: string }).message;
  if ((err as { cause?: { reason?: string } })?.cause?.reason)
    return (err as { cause: { reason: string } }).cause.reason;
  if ((err as { reason?: string })?.reason)
    return (err as { reason: string }).reason;
  if (nested?.error?.message)
    return nested.error.message as string;
  if ((err as { message?: string })?.message)
    return (err as { message: string }).message;
  return "An unexpected error occurred.";
}
