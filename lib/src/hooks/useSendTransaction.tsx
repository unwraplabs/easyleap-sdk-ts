import {
  Address,
  useSendTransaction as useSendTransactionSN,
} from "@starknet-react/core";
import { useCallback, useMemo, useState } from "react";
import { Call } from "starknet";
import {
  useSendTransaction as useSendTransactionEVM,
} from "wagmi";
import { ArgentXV050Preset, StarkZap } from "starkzap";

import { InteractionMode } from "../contexts/SharedState";
import { useMode } from "./useMode";
import { toast } from "./use-toast";
import { logger } from "@lib/utils/logger";

import { usePrivyContext } from "../contexts/PrivyContext";
import { usePrivy } from "@privy-io/react-auth";

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

function normalizeCalls(input: any): Call[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((c: any) => {
      const contractAddress = c?.contractAddress ?? c?.to;
      const entrypoint = c?.entrypoint ?? c?.selector;
      const calldata = c?.calldata ?? [];
      if (
        typeof contractAddress !== "string" ||
        typeof entrypoint !== "string" ||
        !Array.isArray(calldata)
      ) {
        return null;
      }
      return { contractAddress, entrypoint, calldata } as Call;
    })
    .filter(Boolean) as Call[];
}

function getSendTransactionCallback(
  mode: InteractionMode,
  snSendAsync: (args?: Call[]) => Promise<unknown>,
  evmSendAsync: (params: {
    to: `0x${string}`;
    value?: bigint;
    data?: `0x${string}`;
  }) => Promise<`0x${string}`>,
  isPrivyWallet: boolean,
  privySendTransaction: (calls: Call[]) => Promise<void>,
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
        if (isPrivyWallet) {
          await privySendTransaction(params.calls);
        } else {
          await snSendAsync(params.calls);
        }
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

  // Privy integration
  const { privyWallet, config } = usePrivyContext();
  const { getAccessToken } = usePrivy();
  const [privyTxState, setPrivyTxState] = useState<{
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    error: Error | null;
    data?: `0x${string}`;
  }>({
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
  });

  // Check if using Privy wallet
  const isPrivyWallet = useMemo(() => {
    return !!privyWallet?.address;
  }, [privyWallet?.address]);

  // Function to send transaction via Privy API
  const privySendTransaction = useCallback(
    async (calls: Call[]) => {
      if (!privyWallet) {
        throw new Error("Privy wallet not connected");
      }

      if (!config?.rpcUrl) {
        throw new Error(
          "Missing rpcUrl for Privy/StarkZap. Provide `starkzap.rpcUrl` to EasyleapProvider or set NEXT_PUBLIC_RPC_URL.",
        );
      }

      setPrivyTxState({
        isPending: true,
        isSuccess: false,
        isError: false,
        error: null,
        data: undefined,
      });

      try {
        const userJwt = await getAccessToken();
        if (!userJwt) {
          throw new Error("Failed to get access token");
        }

        const normalizedCalls = normalizeCalls(calls);
        if (normalizedCalls.length === 0) {
          throw new Error("No calldata received");
        }

        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        const serverUrl = origin ? `${origin}/api/wallet/sign` : "/api/wallet/sign";

        const sdk = new StarkZap({
          network: config.network ?? "sepolia",
          rpcUrl: config.rpcUrl,
          paymaster: {
            nodeUrl: "/api/paymaster",
            headers: {
              Authorization: `Bearer ${userJwt}`,
            },
          } as any,
        });

        const onboard = await sdk.onboard({
          strategy: "privy",
          accountPreset: ArgentXV050Preset,
          feeMode: "sponsored",
          deploy: "if_needed",
          privy: {
            resolve: async () => ({
              walletId: privyWallet.walletId,
              publicKey: privyWallet.publicKey,
              serverUrl,
              headers: { Authorization: `Bearer ${userJwt}` },
            }),
          },
        });

        const tx = await onboard.wallet.execute(normalizedCalls, {
          feeMode: "sponsored",
        });
        const txHash = (tx as any)?.hash as `0x${string}` | undefined;
        logger.verbose("EL::useSendTransaction::privyTxSuccess", {
          transactionHash: txHash,
        });

        setPrivyTxState({
          isPending: false,
          isSuccess: true,
          isError: false,
          error: null,
          data: txHash,
        });
      } catch (error: any) {
        logger.verbose("EL::useSendTransaction::privyTxError", error);
        setPrivyTxState({
          isPending: false,
          isSuccess: false,
          isError: true,
          error: error,
          data: undefined,
        });
        throw error;
      }
    },
    [privyWallet, config?.rpcUrl, config?.network, getAccessToken],
  );

  // Reset Privy transaction state
  const resetPrivyTx = useCallback(() => {
    setPrivyTxState({
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      data: undefined,
    });
  }, []);

  const isEVMMode = useMemo(() => {
    return mode === InteractionMode.EVM;
  }, [mode]);

  // Initialize the StarkNet transaction hook (calls are passed at send time).
  const snOutput = useSendTransactionSN({});

  // Initialize the EVM transaction hook.
  const evmOutput = useSendTransactionEVM();

  // Create the callback function for sending transactions.
  const sendCallback = useCallback(
    getSendTransactionCallback(
      mode,
      snOutput.sendAsync,
      evmOutput.sendTransactionAsync,
      isPrivyWallet,
      privySendTransaction,
    ),
    [mode, snOutput.sendAsync, evmOutput.sendTransactionAsync, isPrivyWallet, privySendTransaction],
  );

  const activeIsSuccess = isEVMMode
    ? evmOutput.isSuccess
    : isPrivyWallet
      ? privyTxState.isSuccess
      : snOutput.isSuccess;

  const activeIsError = isEVMMode
    ? evmOutput.isError
    : isPrivyWallet
      ? privyTxState.isError
      : snOutput.isError;

  const activeError = isEVMMode
    ? evmOutput.error
    : isPrivyWallet
      ? privyTxState.error
      : snOutput.error;

  const activeIsPending = isEVMMode
    ? evmOutput.isPending
    : isPrivyWallet
      ? privyTxState.isPending
      : snOutput.isPending;

  const activeData: `0x${string}` | undefined = isEVMMode
    ? evmOutput.data
    : isPrivyWallet
      ? privyTxState.data
      : snOutput.data
        ? (snOutput.data.transaction_hash as Address)
        : undefined;

  return {
    send: sendCallback,
    sendAsync: sendCallback,
    isPaused: isEVMMode ? (evmOutput.isPaused ?? false) : (snOutput.isPaused ?? false),
    isSuccess: activeIsSuccess,
    isError: activeIsError,
    error: activeError,
    data: activeData,
    isPending: activeIsPending,
    isIdle: isEVMMode ? (evmOutput.isIdle ?? false) : (isPrivyWallet ? (!privyTxState.isPending && !privyTxState.isSuccess && !privyTxState.isError) : (snOutput.isIdle ?? false)),
    status: isEVMMode ? evmOutput.status : snOutput.status,
    reset: () => {
      evmOutput.reset();
      snOutput.reset();
      resetPrivyTx();
    },
  };
}
