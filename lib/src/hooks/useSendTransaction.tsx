import {
  Address,
  useSendTransaction as useSendTransactionSN,
} from "@starknet-react/core";
import { useCallback, useMemo } from "react";
import { Call } from "starknet";
import {
  useSendTransaction as useSendTransactionEVM,
} from "wagmi";

import { InteractionMode } from "../contexts/SharedState";
import { useMode } from "./useMode";
import { toast } from "./use-toast";
import { logger } from "@lib/utils/logger";

export interface EvmTxParams {
  to: `0x${string}`;
  value?: bigint;
  data?: `0x${string}`;
}

export interface SendTransactionParams {
  calls?: Call[];
  evmTxParams?: EvmTxParams;
}

export interface UseSendTransactionResult_EasyLeap {
  send: (params: SendTransactionParams) => void;
  sendAsync: (params: SendTransactionParams) => Promise<void>;
  isPaused: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  data?: `0x${string}`;
  isPending: boolean;
  isIdle: boolean;
  status?: string;
  reset: () => void;
}

function getSendTransactionCallback(
  mode: InteractionMode,
  snSendAsync: (args?: Call[]) => Promise<unknown>,
  evmSendAsync: (params: {
    to: `0x${string}`;
    value?: bigint;
    data?: `0x${string}`;
  }) => Promise<`0x${string}`>,
) {
  return async function sendTransaction(
    params: SendTransactionParams,
  ): Promise<void> {
    logger.verbose("EL::useSendTransaction::send", { mode });

    if (mode === InteractionMode.EVM) {
      if (!params.evmTxParams) {
        toast({
          title: "No EVM transaction params provided",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
      try {
        await evmSendAsync(params.evmTxParams);
      } catch (e) {
        logger.verbose("EL::useSendTransaction::send-evm-error", e);
        console.error("EL::useSendTransaction::send-evm-error", e);
      }
      return;
    }

    if (mode === InteractionMode.Starknet) {
      if (!params.calls || !params.calls.length) {
        toast({
          title: "No calldata received",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
      try {
        await snSendAsync(params.calls);
      } catch (e) {
        logger.verbose("EL::useSendTransaction::send-sn-error", e);
        console.error("EL::useSendTransaction::send-sn-error", e);
      }
    }
  };
}

/**
 * Hook for sending transactions in Starknet or EVM mode.
 *
 * Both Starknet `calls` and EVM `evmTxParams` are passed at call time
 * via `send()` / `sendAsync()`. The active mode (from `useMode()`) determines
 * which set of params is used.
 *
 * @example
 * ```ts
 * const { send, isPending, isSuccess } = useSendTransaction();
 *
 * // Starknet mode
 * send({ calls: [{ contractAddress: '0x...', entrypoint: 'transfer', calldata: [...] }] });
 *
 * // EVM mode
 * send({ evmTxParams: { to: '0x...', value: 1000n, data: '0x...' } });
 * ```
 */
export function useSendTransaction(): UseSendTransactionResult_EasyLeap {
  const mode = useMode();

  const isEVMMode = useMemo(() => {
    return mode === InteractionMode.EVM;
  }, [mode]);

  const snOutput = useSendTransactionSN({});
  const evmOutput = useSendTransactionEVM();

  const sendCallback = useCallback(
    getSendTransactionCallback(
      mode,
      snOutput.sendAsync,
      evmOutput.sendTransactionAsync,
    ),
    [mode, snOutput.sendAsync, evmOutput.sendTransactionAsync],
  );

  return {
    send: sendCallback,
    sendAsync: sendCallback,
    isPaused: isEVMMode ? evmOutput.isPaused : snOutput.isPaused,
    isSuccess: isEVMMode ? evmOutput.isSuccess : snOutput.isSuccess,
    isError: isEVMMode ? evmOutput.isError : snOutput.isError,
    error: isEVMMode ? evmOutput.error : snOutput.error,
    data: isEVMMode
      ? evmOutput.data
      : snOutput.data
        ? (snOutput.data.transaction_hash as Address)
        : undefined,
    isPending: isEVMMode ? evmOutput.isPending : snOutput.isPending,
    isIdle: isEVMMode ? evmOutput.isIdle : snOutput.isIdle,
    status: isEVMMode ? evmOutput.status : snOutput.status,
    reset: () => {
      evmOutput.reset();
      snOutput.reset();
    },
  };
}
