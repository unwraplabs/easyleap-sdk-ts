// BRIDGE MODE - ReviewModal is bridge-specific.
// The dialog body (Ethereum → Starknet flow, fees, timers, EVM pre-submit hook) is commented out.
// The component is kept exported and renders nothing so existing call sites don't break.

// import { Clock } from "lucide-react";
// import { Icons } from "@lib/components/Icons";
// import { Button } from "@lib/components/ui/button";
// import { Dialog, DialogContent, DialogTrigger } from "@lib/components/ui/dialog";
// import { useSharedState } from "@lib/main";
// import { useMemo } from "react";
// import { useEVMPreSubmit } from "@lib/hooks/evm/useEVMPreSubmit";

import { SourceBridgeInfo } from "@lib/hooks/useSourceBridgeInfo";
import { Address } from "viem";

export interface TokenTransfer {
  name: string;
  amount: string;
  logo: string;
}

export interface DestinationDapp {
  name: string;
  logo: string;
}

export interface PreTxHookProps {
  sourceTokenInfo?: SourceBridgeInfo,
  amount: bigint;
  address: Address;
}

export interface ReviewModalProps {
  isOpen: boolean;
  onClose?: () => void;
  tokensIn: TokenTransfer[];
  tokensOut: TokenTransfer[];
  destinationDapp: DestinationDapp;
  onContinue: () => void;
  hookProps: PreTxHookProps;
}

/**
 * BRIDGE MODE - ReviewModal body commented out.
 * Previously rendered a confirmation dialog for bridge transactions (ETH → Starknet flow,
 * fee breakdown, ERC-20 approval pre-hook, and continue button).
 * Renders nothing until bridge mode is restored.
 */
export function ReviewModal() {
  // BRIDGE MODE - entire modal implementation commented out
  // const context = useSharedState();
  // const preSubmitTxHook = useEVMPreSubmit(context.reviewModalProps.hookProps);
  // const isPreHookExecution = useMemo(() => {
  //   if (!preSubmitTxHook) return false;
  //   return preSubmitTxHook.isLoading || (!preSubmitTxHook.isSuccess && !preSubmitTxHook.isError);
  // }, [preSubmitTxHook]);

  // function getTokenItem(token: TokenTransfer, index: number, isIn: boolean) {
  //   return (
  //     <li key={index} className="flex w-full items-center gap-1">
  //       <span>{isIn ? "+" : "-"}{token.amount} {token.name}</span>
  //       <img src={token.logo} alt={token.name} style={{ width: "20px", height: "20px", marginLeft: "5px" }} className="size-6 shrink-0" />
  //     </li>
  //   );
  // }

  // return (
  //   <Dialog open={context.reviewModalProps.isOpen}>
  //     <DialogTrigger className=""></DialogTrigger>
  //     <DialogContent
  //       className="easyleap-max-h-[100vh] easyleap-border easyleap-border-[#675E99] easyleap-bg-white easyleap-font-dmSans easyleap-sm:easyleap-max-w-screen easyleap-lg:easyleap-max-h-none"
  //       closeClassName="text-[#B9AFF1]"
  //       onClickClose={() => {
  //         context.setReviewModalProps({ ...context.reviewModalProps, isOpen: false });
  //         preSubmitTxHook?.reset();
  //       }}
  //     >
  //       <h4 className="easyleap-text-center easyleap-text-2xl easyleap-font-normal easyleap-text-black">Confirmation</h4>
  //       <p className="easyleap-mt-[-2px] easyleap-text-center easyleap-text-sm easyleap-font-normal easyleap-text-black">
  //         You are about to perform the deposit with bridge mode.{" "}
  //         Funds are automatically bridged from L1 to Starknet and sent to{" "}
  //         <b>{context.reviewModalProps.destinationDapp.name}</b> on your behalf.
  //       </p>
  //       ...
  //       (full bridge confirmation UI omitted)
  //       ...
  //       <Button onClick={isPreHookExecution ? preSubmitTxHook?.onClick : context.reviewModalProps.onContinue}
  //         className="easyleap-mt-5 easyleap-h-11 easyleap-w-full easyleap-rounded-[40px] easyleap-bg-[white] easyleap-px-6 easyleap-text-black easyleap-border-2 easyleap-border-black"
  //         disabled={isPreHookExecution && preSubmitTxHook?.isDisabled}>
  //         {preSubmitTxHook?.isLoading ? (...) : isPreHookExecution ? preSubmitTxHook?.buttonText : "Continue"}
  //       </Button>
  //     </DialogContent>
  //   </Dialog>
  // );

  return null;
}
