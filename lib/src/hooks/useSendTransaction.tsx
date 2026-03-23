// https://nonlevel-arletha-interchangeably.ngrok-free.dev/

import {
  Address,
  UseSendTransactionProps,
  UseSendTransactionResult,
  useSendTransaction as useSendTransactionSN,
} from "@starknet-react/core";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Call, hash, num } from "starknet";
import { encodeFunctionData } from "viem";
import {
  Config,
  useSendTransaction as useSendTransactionEVM,
  UseSendTransactionReturnType,
} from "wagmi";

import {
  DestinationDapp,
  PreTxHookProps,
  TokenTransfer,
} from "@lib/components/review-modal";
import {
  ADDRESSES,
  MESSAGE_FEE_ETH,
  SOURCE_FEE_ETH,
  ZERO_ADDRESS_EVM,
} from "@lib/utils/constants";

import {
  InteractionMode,
  SharedContext,
  useSharedState,
} from "../contexts/SharedState";
import { useAccount } from "./useAccount";
import { useMode } from "./useMode";
import { mergeSortArrays } from "./useTransactionHistory";
import { SourceBridgeInfo, useSourceBridgeInfo } from "./useSourceBridgeInfo";
import { useAmountOut } from "./useAmountOut";
import { toast } from "./use-toast";
import { logger } from "@lib/utils/logger";
import { usePrivyContext } from "../contexts/PrivyContext";
import { usePrivy } from "@privy-io/react-auth";

interface BridgeConfig {
  /**
   * The address of the L2 token in hexadecimal format.
   * Must be a string prefixed with `0x`.
   */
  l2_token_address: `0x${string}`;

  /**
   * The amount input by the user.
   * Represented as a bigint.
   */
  userInputAmount: bigint;

  /**
   * The amount remaining after fees have been deducted.
   * Represented as a bigint. (Output of useAmountOut(userInputAmount))
   * - Its required to ensure the consumer app is building calls on correct amount
   */
  postFeeAmount: bigint;
}

/**
 * Interface for the arguments required by the `useSendTransaction` hook.
 */
export interface EUseSendTransactionArgs_EasyLeap
  extends UseSendTransactionProps {
  bridgeConfig: BridgeConfig;
}

/**
 * Utility function to calculate the source and message fees.
 *
 * @returns An object containing the source fee and message fee as BigInt values.
 */
function getFees() {
  const sourceFee = BigInt((SOURCE_FEE_ETH * 10 ** 18).toString());
  const msgFee = BigInt((MESSAGE_FEE_ETH * 10 ** 18).toString());
  return { sourceFee, msgFee };
}

/**
 * Calculates the total ETH value required for a transaction.
 *
 * @param sourceTokenInfo - Information about the source token.
 * @param bridgeConfig - Configuration for the bridge, including the amount to be transferred.
 * @returns The total ETH value required for the transaction.
 */
function calculateEthValue(
  sourceTokenInfo: SourceBridgeInfo,
  bridgeConfig: BridgeConfig,
) {
  const { sourceFee, msgFee } = getFees();

  // If the token is ETH (ZERO_ADDRESS_EVM), include the transfer amount in the total.
  if (
    sourceTokenInfo &&
    sourceTokenInfo.l1_token_address === ZERO_ADDRESS_EVM
  ) {
    return bridgeConfig.userInputAmount + sourceFee + msgFee;
  }

  // Otherwise, only include the fees.
  return sourceFee + msgFee;
}

/**
 * Generates EVM calldata for the transaction.
 *
 * @param calls - An array of SN calls to be included in the transaction, used to execute tx on SN post bridge
 * @param bridgeConfig - Configuration for the bridge, including the L2 token address and amount.
 * @param addressDestination - The destination address on L2.
 * @param sourceTokenInfo - Information about the source token.
 * @returns The encoded calldata as a string.
 */
function generateCalldata(
  calls: Call[],
  bridgeConfig: BridgeConfig,
  addressDestination: Address,
  sourceTokenInfo: SourceBridgeInfo,
) {
  // Flatten the calls into a single array of BigInt values.
  const flat_calls = calls.map((call) => [
    BigInt(num.getDecimalString(call.contractAddress)), // Contract address
    BigInt(num.getDecimalString(hash.getSelectorFromName(call.entrypoint))), // Function selector
    call.calldata ? BigInt(call.calldata.length.toString()) : 0n, // Calldata length
    ...((call.calldata as Array<bigint>) || []), // Calldata
  ]);

  const flat_calls_final = flat_calls ? flat_calls.flat() : [];

  // Construct the full calldata array.
  const fullCalldata = [
    0n, // Some ID (placeholder)
    BigInt(num.getDecimalString(bridgeConfig.l2_token_address.toString())), // L2 token address
    bridgeConfig.userInputAmount, // Amount to transfer
    BigInt(num.getDecimalString(addressDestination || "0")), // L2 user address (destination)
    BigInt(flat_calls_final.length.toString()) + 1n, // Total calldata length
    BigInt(calls?.length.toString() || 0), // Number of calls
    ...flat_calls_final, // Flattened calls
  ];

  // Encode the calldata using the ABI and function signature.
  return encodeFunctionData({
    abi: [
      {
        type: "function",
        name: "push",
        inputs: [
          {
            name: "tokenConfig",
            type: "tuple",
            internalType: "struct L1Manager.TokenConfig",
            components: [
              {
                name: "l1_token_address",
                type: "address",
                internalType: "address",
              },
              {
                name: "l2_token_address",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "bridge_address",
                type: "address",
                internalType: "address",
              },
            ],
          },
          { name: "amount", type: "uint256", internalType: "uint256" },
          { name: "_calldata", type: "uint256[]", internalType: "uint256[]" },
        ],
        outputs: [],
        stateMutability: "payable",
      },
    ],
    functionName: "push",
    args: [
      {
        l1_token_address: sourceTokenInfo.l1_token_address, // L1 token address
        l2_token_address: BigInt(
          num.getDecimalString(bridgeConfig.l2_token_address.toString()),
        ), // L2 token address
        bridge_address: sourceTokenInfo.l1_bridge_address, // Bridge address
      },
      bridgeConfig.userInputAmount, // Amount to transfer
      fullCalldata, // Full calldata array
    ],
  });
}

function getSendTransactionCallback(
  mode: InteractionMode,
  context: SharedContext,
  snOutput: UseSendTransactionResult,
  evmOutput: UseSendTransactionReturnType<Config, unknown>,
  sourceAmount: bigint,
  sourceCalldata: `0x${string}`,
  isValidAmountProps: boolean,
  _calls: Call[] | undefined,
  hookProps: PreTxHookProps,
  isPrivyWallet: boolean,
  privySendTransaction: (calls: Call[]) => Promise<void>,
) {
  return async function openReviewModal(
    tokensIn: TokenTransfer[],
    tokensOut: TokenTransfer[],
    destinationDapp: DestinationDapp,
    calls?: Call[],
  ): Promise<void> {
    logger.verbose("EL::useSendTransaction::send1");
    if (!isValidAmountProps) {
      logger.verbose("EL::useSendTransaction::send2");
      toast({
        title: "Invalid bridge amounts",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    if ((!_calls || !_calls.length) && (!calls || !calls.length)) {
      logger.verbose("EL::useSendTransaction::send21");
      toast({
        title: "No calldata received",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    if (mode == InteractionMode.Bridge) {
      logger.verbose("EL::useSendTransaction::send3");
      context.setReviewModalProps({
        isOpen: true,
        tokensIn,
        tokensOut,
        destinationDapp,
        hookProps,
        onContinue: async () => {
          await evmOutput.sendTransactionAsync({
            to: ADDRESSES.ETH_MAINNET.BRIDGE_MANAGER as `0x${string}`,
            value: sourceAmount,
            data: sourceCalldata,
          });
          context.setReviewModalProps({
            ...context.reviewModalProps,
            isOpen: false,
          });
        },
      });
    } else {
      logger.verbose("EL::useSendTransaction::send4", calls?.length);
      try {
        // Use the calls passed to sendAsync, or fallback to the ones from hook init
        const callsToExecute = calls || _calls || [];

        // Use Privy API if Privy wallet is connected, otherwise use standard Starknet
        if (isPrivyWallet) {
          logger.verbose("EL::useSendTransaction::sendPrivy", callsToExecute);
          await privySendTransaction(callsToExecute);
        } else {
          logger.verbose(
            "EL::useSendTransaction::sendStarknet",
            callsToExecute,
          );
          // Use send() with calls parameter instead of sendAsync()
          snOutput.send(callsToExecute);
        }
        logger.verbose("EL::useSendTransaction::send5");
      } catch (e) {
        logger.verbose("EL::useSendTransaction::send6", e);
        console.error("EL::useSendTransaction::send7", e);
      }
    }
  };
}

export interface UseSendTransactionResult_EasyLeap {
  send: (
    tokensIn: TokenTransfer[],
    tokensOut: TokenTransfer[],
    destinationDapp: DestinationDapp,
    calls?: Call[],
  ) => void;
  sendAsync: (
    tokensIn: TokenTransfer[],
    tokensOut: TokenTransfer[],
    destinationDapp: DestinationDapp,
    calls?: Call[],
  ) => Promise<void>;
  isPaused: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  data?: `0x${string}`; // tx hash
  isPending: boolean;
  isIdle: boolean;
  status?: string;
  reset: () => void;
}

/**
 * A custom hook that provides functionality for sending transactions in different modes (e.g., Bridge mode).
 * It handles transaction preparation, submission, and state management for both StarkNet and EVM environments.
 *
 * @param props - The arguments required for sending a transaction, including bridge configuration and call data.
 *
 * @returns An object containing:
 * - `send`: A callback function to send the transaction.
 * - `sendAsync`: An Async alias for the `send` function.
 * - `isPaused`: A boolean indicating whether the transaction process is paused.
 * - `isSuccess`: A boolean indicating whether the transaction was successful.
 * - `isError`: A boolean indicating whether there was an error during the transaction.
 * - `error`: The error object, if any, encountered during the transaction.
 * - `data`: The transaction hash
 * - `isPending`: A boolean indicating whether the transaction is currently pending.
 * - `isIdle`: A boolean indicating whether the transaction process is idle.
 * - `status`: The current status of the transaction.
 * - `reset`: A function to reset the transaction state.
 *
 * @remarks
 * - The hook determines the mode of operation (e.g., Bridge mode) and adjusts its behavior accordingly.
 * - It uses memoization and side effects to manage transaction state and ensure efficient updates.
 * - The `context.setSourceTransactions` function is used to update the shared state with new transaction details.
 *
 * @example
 * ```tsx
 * const { send, isSuccess, isError, reset } = useSendTransaction({
 *   bridgeConfig: {
 *     l2_token_address: "0x123...",
 *     amount: BigInt(1000),
 *   },
 *   calls: [...],
 * });
 *
 * send();
 * if (isSuccess) {
 *   console.log("Transaction successful!");
 * }
 * if (isError) {
 *   console.error("Transaction failed!");
 * }
 * reset();
 * ```
 */
export function useSendTransaction(
  props: EUseSendTransactionArgs_EasyLeap,
): UseSendTransactionResult_EasyLeap {
  const mode = useMode(); // Determine the current interaction mode (e.g., Bridge mode).
  const context = useSharedState(); // Access the shared state context.
  const { addressDestination, addressSource } = useAccount(); // Retrieve the source and destination addresses.
  const sourceTokenInfo = useSourceBridgeInfo({
    l2TokenAddress: props.bridgeConfig.l2_token_address,
  }); // Fetch information about the source token.

  // Privy integration
  const { privyWallet } = usePrivyContext();
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

        // const response = await fetch("/api/privy/execute-transaction", {
        const response = await fetch(
          "https://nonlevel-arletha-interchangeably.ngrok-free.dev/api/privy/execute-transaction",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "any",
              Authorization: `Bearer ${userJwt}`,
            },
            body: JSON.stringify({
              walletId: privyWallet.walletId,
              calls,
            }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData?.error || "Failed to execute transaction");
        }

        const data = await response.json();
        logger.verbose("EL::useSendTransaction::privyTxSuccess", data);

        setPrivyTxState({
          isPending: false,
          isSuccess: true,
          isError: false,
          error: null,
          data: data.transactionHash as `0x${string}`,
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
    [privyWallet, getAccessToken],
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

  // sanity check on amounts
  const postFeeAmount = useAmountOut(props.bridgeConfig.userInputAmount);
  const isValidAmountProps = useMemo(() => {
    // if loading, wait sometime to valid, till then, its not valid
    if (postFeeAmount.isLoading || postFeeAmount.isError) return false;
    if (!(postFeeAmount.fee > 0) && mode == InteractionMode.Bridge)
      return false;
    // if computation is done, check if the amount is valid
    return postFeeAmount.amountOut == props.bridgeConfig.postFeeAmount;
  }, [
    postFeeAmount.isLoading,
    postFeeAmount.amountOut,
    props.bridgeConfig.postFeeAmount,
  ]);

  // Check if the current mode is Bridge mode.
  const isBridgeMode = useMemo(() => {
    return mode == InteractionMode.Bridge;
  }, [mode]);

  // Generate the calldata for the source transaction.
  const sourceCalldata = React.useMemo(() => {
    if (!addressDestination || !props.calls || !sourceTokenInfo) return `0x0`;
    return generateCalldata(
      props.calls || [],
      props.bridgeConfig,
      addressDestination,
      sourceTokenInfo,
    );
  }, [props.calls, props.bridgeConfig, addressDestination, sourceTokenInfo]);

  // Calculate the total ETH value required for the transaction.
  const sourceAmount = React.useMemo(() => {
    if (!sourceTokenInfo) return BigInt(0);
    return calculateEthValue(sourceTokenInfo, props.bridgeConfig);
  }, [sourceTokenInfo, props.bridgeConfig]);

  // Initialize the StarkNet transaction hook without calls
  // Calls will be passed dynamically when send() is called
  const snOutput = useSendTransactionSN({});

  // Initialize the EVM transaction hook.
  const evmOutput = useSendTransactionEVM();

  // Update the shared state with the source transaction details when in Bridge mode.
  useEffect(() => {
    if (!isBridgeMode || !evmOutput.isSuccess) {
      return;
    }
    context.setSourceTransactions(
      mergeSortArrays(context.sourceTransactions, [
        {
          amount_raw: props.bridgeConfig.userInputAmount.toString(),
          receiver: addressDestination,
          block_number: 0,
          chain: "ethereum",
          cursor: 0,
          eventIndex: 0,
          request_id: 0,
          sender: addressSource,
          status: "confirmed",
          timestamp: Math.round(new Date().getTime() / 1000),
          token: props.bridgeConfig.l2_token_address,
          txHash: evmOutput.data,
          txIndex: 0,
        },
      ]),
    );
  }, [
    evmOutput.isSuccess,
    evmOutput.data,
    isBridgeMode,
    addressSource,
    addressDestination,
    props.bridgeConfig.l2_token_address,
  ]);

  // Create the callback function for sending transactions.
  const sendCallback = useCallback(
    getSendTransactionCallback(
      mode,
      context,
      snOutput,
      evmOutput,
      sourceAmount,
      sourceCalldata,
      isValidAmountProps,
      props.calls,
      {
        sourceTokenInfo,
        amount: props.bridgeConfig.userInputAmount,
        address: addressSource || "0x0",
      },
      isPrivyWallet,
      privySendTransaction,
    ),
    [
      mode,
      sourceTokenInfo,
      context,
      snOutput,
      evmOutput,
      props.bridgeConfig.userInputAmount,
      addressSource,
      isPrivyWallet,
      privySendTransaction,
    ],
  );

  useEffect(() => {
    logger.verbose("EL::useSendTransaction", {
      snOutput,
      evmOutput,
      privyTxState,
    });
  }, [snOutput, evmOutput, privyTxState]);

  // Determine which output to use based on mode and wallet type
  const getStarknetOutput = () => {
    if (isPrivyWallet && !isBridgeMode) {
      return privyTxState;
    }
    return {
      isPending: snOutput.isPending,
      isSuccess: snOutput.isSuccess,
      isError: snOutput.isError,
      error: snOutput.error,
      data: snOutput.data
        ? (snOutput.data.transaction_hash as Address)
        : undefined,
    };
  };

  const starknetOutput = getStarknetOutput();

  // Return the transaction-related state and functions.
  return {
    send: sendCallback, // Function to send the transaction.
    sendAsync: sendCallback, // Alias for the send function.
    isPaused: !isValidAmountProps
      ? true
      : isBridgeMode
        ? evmOutput.isPaused
        : false, // Indicates if the transaction is paused.
    isSuccess: isBridgeMode ? evmOutput.isSuccess : starknetOutput.isSuccess, // Indicates if the transaction was successful.
    isError: isBridgeMode ? evmOutput.isError : starknetOutput.isError, // Indicates if there was an error.
    error: isBridgeMode ? evmOutput.error : starknetOutput.error, // The error object, if any.
    data: isBridgeMode ? evmOutput.data : starknetOutput.data, // The transaction data or result.
    isPending: isBridgeMode ? evmOutput.isPending : starknetOutput.isPending, // Indicates if the transaction is pending.
    isIdle: isBridgeMode
      ? evmOutput.isIdle
      : !starknetOutput.isPending &&
        !starknetOutput.isSuccess &&
        !starknetOutput.isError, // Indicates if the transaction process is idle.
    status: isBridgeMode
      ? evmOutput.status
      : starknetOutput.isPending
        ? "pending"
        : starknetOutput.isSuccess
          ? "success"
          : starknetOutput.isError
            ? "error"
            : "idle", // The current status of the transaction.
    reset: () => {
      evmOutput.reset(); // Reset the EVM transaction state.
      snOutput.reset(); // Reset the StarkNet transaction state.
      resetPrivyTx(); // Reset the Privy transaction state.
    },
  };
}
