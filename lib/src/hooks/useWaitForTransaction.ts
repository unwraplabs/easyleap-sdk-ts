import { Address, UseTransactionReceiptResult } from "@starknet-react/core"
import { useTransactionReceipt as useTransactionReceiptEVM } from "wagmi"
import { useTransactionReceipt as useTransactionReceiptSN } from "@starknet-react/core";
import { useMemo } from "react";
import { useMode } from "./useMode";
import { InteractionMode } from "@lib/contexts";
import { logger } from "@lib/utils/logger";

export interface WaitForTransactionProps {
  hash?: Address
}

export type TransactionReceipt = Omit<UseTransactionReceiptResult, 'data' | 'refetch'> 

export const useWaitForTransaction = (waitForTransactionProps: WaitForTransactionProps): TransactionReceipt => {
  const mode = useMode();
  const snTx = useTransactionReceiptSN({
    hash: waitForTransactionProps.hash,
    refetchInterval: 5000,
  })
  const evmTx = useTransactionReceiptEVM({
    hash: waitForTransactionProps.hash,
  })

  const output: TransactionReceipt = useMemo(() => {
    logger.verbose("waitForTransactionProps", {
      mode, snTx, evmTx, inputProps: waitForTransactionProps
    })
    if (mode === InteractionMode.EVM) {
      return {
        isLoading: evmTx.isLoading,
        isSuccess: evmTx.isSuccess,
        isError: evmTx.isError,
        isPending: evmTx.isPending,
        isFetching: evmTx.isFetching,
        status: evmTx.status,
        error: evmTx.error,
        fetchStatus: evmTx.fetchStatus,
      }
    } else {
      return {
        isLoading: snTx.isLoading,
        isSuccess: snTx.isSuccess,
        isError: snTx.isError,
        isPending: snTx.isPending,
        isFetching: snTx.isFetching,
        status: snTx.status,
        error: snTx.error,
        fetchStatus: snTx.fetchStatus,
      }
    }
  }, [mode, waitForTransactionProps.hash, snTx, evmTx])

  return output;
}