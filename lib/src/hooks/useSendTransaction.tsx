import { Address, UseSendTransactionProps, UseSendTransactionResult, useSendTransaction as useSendTransactionSN } from "@starknet-react/core";
import { useCallback, useEffect, useMemo } from "react";
import { Call } from "starknet";
import {
  useSendTransaction as useSendTransactionEVM,
} from "wagmi";

import {
  DestinationDapp,
  TokenTransfer
} from "@lib/components/review-modal";

// BRIDGE MODE - bridge-specific imports commented out
// import { ADDRESSES, MESSAGE_FEE_ETH, SOURCE_FEE_ETH, ZERO_ADDRESS_EVM } from "@lib/utils/constants";
// import { hash, num } from "starknet";
// import { encodeFunctionData } from "viem";
// import { SourceBridgeInfo, useSourceBridgeInfo } from "./useSourceBridgeInfo";
// import { useAmountOut } from "./useAmountOut";
// import { mergeSortArrays } from "./useTransactionHistory";

import { InteractionMode } from "../contexts/SharedState";
import { useMode } from "./useMode";
import { toast } from "./use-toast";
import { logger } from "@lib/utils/logger";


// BRIDGE MODE - BridgeConfig interface commented out (bridge-specific)
// interface BridgeConfig {
//   /**
//    * The address of the L2 token in hexadecimal format.
//    * Must be a string prefixed with `0x`.
//    */
//   l2_token_address: `0x${string}`;
//
//   /**
//    * The amount input by the user.
//    * Represented as a bigint.
//    */
//   userInputAmount: bigint;
//
//   /**
//    * The amount remaining after fees have been deducted.
//    * Represented as a bigint. (Output of useAmountOut(userInputAmount))
//    * - Its required to ensure the consumer app is building calls on correct amount
//    */
//   postFeeAmount: bigint;
// }

/**
 * Interface for the arguments required by the `useSendTransaction` hook.
 * BRIDGE MODE: bridgeConfig removed. In Starknet mode use `calls`. In EVM mode the consumer
 * drives the transaction params via `evmTxParams`.
 */
export interface EUseSendTransactionArgs_EasyLeap extends UseSendTransactionProps {
  // BRIDGE MODE - bridgeConfig commented out
  // bridgeConfig: BridgeConfig;
}

// BRIDGE MODE - fee utility functions commented out
// function getFees() {
//   const sourceFee = BigInt((SOURCE_FEE_ETH * 10 ** 18).toString());
//   const msgFee = BigInt((MESSAGE_FEE_ETH * 10 ** 18).toString());
//   return { sourceFee, msgFee };
// }

// BRIDGE MODE - ETH value calculation commented out
// function calculateEthValue(sourceTokenInfo: SourceBridgeInfo, bridgeConfig: BridgeConfig) {
//   const { sourceFee, msgFee } = getFees();
//   if (sourceTokenInfo && sourceTokenInfo.l1_token_address === ZERO_ADDRESS_EVM) {
//     return bridgeConfig.userInputAmount + sourceFee + msgFee;
//   }
//   return sourceFee + msgFee;
// }

// BRIDGE MODE - calldata encoding commented out
// function generateCalldata(
//   calls: Call[],
//   bridgeConfig: BridgeConfig,
//   addressDestination: Address,
//   sourceTokenInfo: SourceBridgeInfo
// ) {
//   const flat_calls = calls.map((call) => [
//     BigInt(num.getDecimalString(call.contractAddress)),
//     BigInt(num.getDecimalString(hash.getSelectorFromName(call.entrypoint))),
//     call.calldata ? BigInt(call.calldata.length.toString()) : 0n,
//     ...((call.calldata as Array<bigint>) || [])
//   ]);
//   const flat_calls_final = flat_calls ? flat_calls.flat() : [];
//   const fullCalldata = [
//     0n,
//     BigInt(num.getDecimalString(bridgeConfig.l2_token_address.toString())),
//     bridgeConfig.userInputAmount,
//     BigInt(num.getDecimalString(addressDestination || "0")),
//     BigInt(flat_calls_final.length.toString()) + 1n,
//     BigInt(calls?.length.toString() || 0),
//     ...flat_calls_final
//   ];
//   return encodeFunctionData({
//     abi: [
//       {
//         type: "function",
//         name: "push",
//         inputs: [
//           {
//             name: "tokenConfig",
//             type: "tuple",
//             internalType: "struct L1Manager.TokenConfig",
//             components: [
//               { name: "l1_token_address", type: "address", internalType: "address" },
//               { name: "l2_token_address", type: "uint256", internalType: "uint256" },
//               { name: "bridge_address", type: "address", internalType: "address" }
//             ]
//           },
//           { name: "amount", type: "uint256", internalType: "uint256" },
//           { name: "_calldata", type: "uint256[]", internalType: "uint256[]" }
//         ],
//         outputs: [],
//         stateMutability: "payable"
//       }
//     ],
//     functionName: "push",
//     args: [
//       {
//         l1_token_address: sourceTokenInfo.l1_token_address,
//         l2_token_address: BigInt(num.getDecimalString(bridgeConfig.l2_token_address.toString())),
//         bridge_address: sourceTokenInfo.l1_bridge_address,
//       },
//       bridgeConfig.userInputAmount,
//       fullCalldata
//     ]
//   });
// }

function getSendTransactionCallback(
  mode: InteractionMode,
  snOutput: UseSendTransactionResult,
  // BRIDGE MODE - bridge params commented out
  // sourceAmount: bigint,
  // sourceCalldata: `0x${string}`,
  // isValidAmountProps: boolean,
  _calls: Call[] | undefined,
  // hookProps: PreTxHookProps
) {
  return async function sendTransaction(
    _tokensIn: TokenTransfer[],
    _tokensOut: TokenTransfer[],
    _destinationDapp: DestinationDapp,
    calls?: Call[],
  ): Promise<void> {
    logger.verbose("EL::useSendTransaction::send1");

    // BRIDGE MODE - bridge amount validation commented out
    // if (!isValidAmountProps) {
    //   logger.verbose("EL::useSendTransaction::send2");
    //   toast({
    //     title: "Invalid bridge amounts",
    //     variant: "destructive",
    //     duration: 5000,
    //   })
    //   return;
    // }

    if ((!_calls || !_calls.length) && (!calls || !calls.length) && mode === InteractionMode.Starknet) {
      logger.verbose("EL::useSendTransaction::send21");
      toast({
        title: "No calldata received",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    // BRIDGE MODE - bridge modal/EVM bridge tx commented out
    // if (mode == InteractionMode.Bridge) {
    //   logger.verbose("EL::useSendTransaction::send3");
    //   context.setReviewModalProps({
    //     isOpen: true,
    //     tokensIn,
    //     tokensOut,
    //     destinationDapp,
    //     hookProps,
    //     onContinue: async () => {
    //       await evmOutput.sendTransactionAsync({
    //         to: ADDRESSES.ETH_MAINNET.BRIDGE_MANAGER as `0x${string}`,
    //         value: sourceAmount,
    //         data: sourceCalldata
    //       });
    //       context.setReviewModalProps({
    //         ...context.reviewModalProps,
    //         isOpen: false
    //       });
    //     },
    //   });
    // }

    if (mode === InteractionMode.EVM) {
      // EVM mode: the consumer is expected to drive EVM transactions directly
      // via the exposed evmOutput. This callback is a no-op for EVM mode
      // since there's no SN calldata to send.
      logger.verbose("EL::useSendTransaction::send-evm-mode - use evmOutput directly");
      return;
    }

    // Starknet mode
    if (mode === InteractionMode.Starknet) {
      logger.verbose("EL::useSendTransaction::send4", calls?.length);
      try {
        await snOutput.sendAsync();
        logger.verbose("EL::useSendTransaction::send5");
      } catch (e) {
        logger.verbose("EL::useSendTransaction::send6", e);
        console.error("EL::useSendTransaction::send7", e);
      }
    }
  };
}

export interface UseSendTransactionResult_EasyLeap {
  send: (tokensIn: TokenTransfer[], tokensOut: TokenTransfer[], destinationDapp: DestinationDapp, calls?: Call[]) => void,
  sendAsync: (tokensIn: TokenTransfer[], tokensOut: TokenTransfer[], destinationDapp: DestinationDapp, calls?: Call[]) => Promise<void>,
  isPaused: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  data?: `0x${string}`, // tx hash
  isPending: boolean;
  isIdle: boolean;
  status?: string;
  reset: () => void;
}

/**
 * A custom hook that provides functionality for sending transactions in different modes.
 * - Starknet mode: sends transactions directly on Starknet via connected Starknet wallet
 * - EVM mode: exposes wagmi send transaction for direct EVM transactions
 *
 * BRIDGE MODE (commented out): previously handled bridging from L1 to Starknet via
 * the EasyLeap bridge manager contract.
 *
 * @param props - The arguments required for sending a transaction.
 * @returns An object containing send/status/reset helpers.
 */
export function useSendTransaction(
  props: EUseSendTransactionArgs_EasyLeap
): UseSendTransactionResult_EasyLeap {
  const mode = useMode();

  // BRIDGE MODE - source token / amount-out / calldata computation commented out
  // const sourceTokenInfo = useSourceBridgeInfo({ l2TokenAddress: props.bridgeConfig.l2_token_address });
  // const postFeeAmount = useAmountOut(props.bridgeConfig.userInputAmount);
  // const isValidAmountProps = useMemo(() => {
  //   if (postFeeAmount.isLoading || postFeeAmount.isError) return false;
  //   if (!(postFeeAmount.fee > 0) && mode == InteractionMode.Bridge) return false;
  //   return postFeeAmount.amountOut == props.bridgeConfig.postFeeAmount;
  // }, [postFeeAmount.isLoading, postFeeAmount.amountOut, props.bridgeConfig.postFeeAmount]);

  // BRIDGE MODE - isBridgeMode flag renamed to isEVMMode
  const isEVMMode = useMemo(() => {
    return mode === InteractionMode.EVM;
  }, [mode]);

  // BRIDGE MODE - source calldata/amount commented out
  // const sourceCalldata = React.useMemo(() => {
  //   if (!addressDestination || !props.calls || !sourceTokenInfo) return `0x0`;
  //   return generateCalldata(props.calls || [], props.bridgeConfig, addressDestination, sourceTokenInfo);
  // }, [props.calls, props.bridgeConfig, addressDestination, sourceTokenInfo]);

  // const sourceAmount = React.useMemo(() => {
  //   if (!sourceTokenInfo) return BigInt(0);
  //   return calculateEthValue(sourceTokenInfo, props.bridgeConfig);
  // }, [sourceTokenInfo, props.bridgeConfig]);

  // Initialize the StarkNet transaction hook.
  const snOutput = useSendTransactionSN({
    calls: props.calls,
  });

  // Initialize the EVM transaction hook.
  const evmOutput = useSendTransactionEVM();

  // BRIDGE MODE - source transaction tracking useEffect commented out
  // useEffect(() => {
  //   if (!isBridgeMode || !evmOutput.isSuccess) { return; }
  //   context.setSourceTransactions(
  //     mergeSortArrays(context.sourceTransactions, [
  //       {
  //         amount_raw: props.bridgeConfig.userInputAmount.toString(),
  //         receiver: addressDestination,
  //         block_number: 0,
  //         chain: "ethereum",
  //         cursor: 0,
  //         eventIndex: 0,
  //         request_id: 0,
  //         sender: addressSource,
  //         status: "confirmed",
  //         timestamp: Math.round(new Date().getTime() / 1000),
  //         token: props.bridgeConfig.l2_token_address,
  //         txHash: evmOutput.data,
  //         txIndex: 0
  //       }
  //     ])
  //   );
  // }, [evmOutput.isSuccess, evmOutput.data, isBridgeMode, addressSource, addressDestination, props.bridgeConfig.l2_token_address]);

  const sendCallback = useCallback(getSendTransactionCallback(
    mode,
    snOutput,
    // BRIDGE MODE - commented out params
    // sourceAmount,
    // sourceCalldata,
    // isValidAmountProps,
    props.calls,
    // { sourceTokenInfo, amount: props.bridgeConfig.userInputAmount, address: addressSource || '0x0' }
  ), [mode, snOutput, props.calls]);

  useEffect(() => {
    logger.verbose("EL::useSendTransaction", { snOutput, evmOutput });
  }, [snOutput, evmOutput]);

  return {
    send: sendCallback,
    sendAsync: sendCallback,
    // BRIDGE MODE - isPaused previously also guarded by isValidAmountProps for bridge
    isPaused: isEVMMode ? evmOutput.isPaused : snOutput.isPaused,
    isSuccess: isEVMMode ? evmOutput.isSuccess : snOutput.isSuccess,
    isError: isEVMMode ? evmOutput.isError : snOutput.isError,
    error: isEVMMode ? evmOutput.error : snOutput.error,
    data: (isEVMMode ? evmOutput.data : snOutput.data ? snOutput.data.transaction_hash as Address : undefined),
    isPending: isEVMMode ? evmOutput.isPending : snOutput.isPending,
    isIdle: isEVMMode ? evmOutput.isIdle : snOutput.isIdle,
    status: isEVMMode ? evmOutput.status : snOutput.status,
    reset: () => {
      evmOutput.reset();
      snOutput.reset();
    },
  };
}
