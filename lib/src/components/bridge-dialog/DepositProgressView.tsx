import React from "react";

import { CheckCircle2, Circle, ExternalLink, Info, Loader2 } from "lucide-react";
import { BridgeTransferStatus, DepositState } from "starkzap";

import { Button } from "@lib/components/ui/button";
import { cn } from "@lib/utils";

import { DepositInfo, DepositProgress } from "./types";
import { getStepStatus } from "./utils";

interface DepositStep {
  title: string;
  description: string;
  statuses: BridgeTransferStatus[];
  link?: string;
  estimatedTime?: string;
}

const buildDepositSteps = (externalTxHash: string, starknetTxHash?: string): DepositStep[] => [
  {
    title: "Execution on Ethereum",
    description: "The transaction is pending inclusion in a block.",
    statuses: [BridgeTransferStatus.SUBMITTED_ON_L1],
    link: `https://etherscan.io/tx/${externalTxHash}`,
  },
  {
    title: "Confirmation on Ethereum",
    description:
      "As soon as Ethereum has confirmed its next 10 blocks, the deposit will be sent to Starknet.",
    statuses: [BridgeTransferStatus.CONFIRMED_ON_L1],
    estimatedTime: "~3 minutes",
  },
  {
    title: "Execution on Starknet",
    description: "The deposit is being processed on Starknet.",
    statuses: [BridgeTransferStatus.SUBMITTED_ON_STARKNET],
    link: starknetTxHash ? `https://starkscan.co/tx/${starknetTxHash}` : undefined,
  },
  {
    title: "Completed",
    description: "Your tokens have been successfully bridged to Starknet.",
    statuses: [
      BridgeTransferStatus.CONFIRMED_ON_STARKNET,
      BridgeTransferStatus.COMPLETED_ON_STARKNET,
    ],
  },
];

interface DepositProgressViewProps {
  depositProgress: DepositProgress;
  amount: string;
  depositInfo: DepositInfo;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cd?: Record<string, any>;
  onClose: () => void;
}

export const DepositProgressView: React.FC<DepositProgressViewProps> = ({
  depositProgress,
  amount,
  depositInfo,
  cd,
  onClose,
}) => {
  const steps = buildDepositSteps(depositProgress.externalTxHash, depositProgress.starknetTxHash);

  return (
    <div className="easyleap-space-y-4">
      <div
        className="easyleap-p-4 easyleap-rounded-lg easyleap-space-y-2"
        style={{ backgroundColor: cd?.rowHoverBackground || "#f5f5f5" }}
      >
        <div className="easyleap-flex easyleap-items-center easyleap-justify-between">
          <p className="easyleap-text-sm easyleap-font-medium">Amount to deposit</p>
          <p className="easyleap-text-sm easyleap-font-mono">{amount} STRK</p>
        </div>
        {depositInfo.estimatedFees && (
          <div className="easyleap-flex easyleap-items-center easyleap-justify-between">
            <p
              className="easyleap-text-xs easyleap-flex easyleap-items-center easyleap-gap-1"
              style={{ color: cd?.mutedTextColor || "#666" }}
            >
              <Info className="easyleap-size-3" /> Estimated fees
            </p>
            <div className="easyleap-text-right">
              <p className="easyleap-text-xs easyleap-font-mono">
                {depositInfo.estimatedFees.amount} ETH
              </p>
              <p className="easyleap-text-xs" style={{ color: cd?.mutedTextColor || "#666" }}>
                {depositInfo.estimatedFees.usdValue}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="easyleap-space-y-0">
        {steps.map((step, index) => {
          const status = getStepStatus(depositProgress.status, step.statuses);
          const isLast = index === steps.length - 1;

          return (
            <div key={index} className="easyleap-flex easyleap-gap-3">
              <div className="easyleap-flex easyleap-flex-col easyleap-items-center">
                <div
                  className={cn(
                    "easyleap-rounded-full easyleap-p-1",
                    status === "completed" && "easyleap-text-green-500 easyleap-bg-green-50",
                    status === "current" && "easyleap-text-blue-500 easyleap-bg-blue-50",
                    status === "pending" && "easyleap-text-gray-400 easyleap-bg-gray-50",
                  )}
                >
                  {status === "completed" ? (
                    <CheckCircle2 className="easyleap-size-5" />
                  ) : status === "current" ? (
                    <Loader2 className="easyleap-size-5 easyleap-animate-spin" />
                  ) : (
                    <Circle className="easyleap-size-5" />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "easyleap-w-0.5 easyleap-flex-1 easyleap-min-h-[60px]",
                      status === "completed" ? "easyleap-bg-green-500" : "easyleap-bg-gray-200",
                    )}
                  />
                )}
              </div>

              <div className="easyleap-flex-1 easyleap-pb-6">
                <div className="easyleap-flex easyleap-items-start easyleap-justify-between">
                  <h4 className="easyleap-text-sm easyleap-font-semibold">{step.title}</h4>
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="easyleap-text-blue-500 hover:easyleap-text-blue-600 easyleap-flex easyleap-items-center easyleap-gap-1 easyleap-text-xs"
                    >
                      View
                      <ExternalLink className="easyleap-size-3" />
                    </a>
                  )}
                </div>
                <p
                  className="easyleap-text-xs easyleap-mt-1"
                  style={{ color: cd?.mutedTextColor || "#666" }}
                >
                  {step.description}
                </p>
                {step.estimatedTime && status === "current" && (
                  <p
                    className="easyleap-text-xs easyleap-mt-1 easyleap-font-medium"
                    style={{ color: cd?.mutedTextColor || "#666" }}
                  >
                    {step.estimatedTime}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {depositProgress.depositState === DepositState.ERROR && (
        <div
          className="easyleap-p-4 easyleap-rounded-lg easyleap-text-center easyleap-text-sm easyleap-text-red-500"
          style={{ backgroundColor: "#fee" }}
        >
          Transaction failed. Please try again.
        </div>
      )}

      {depositProgress.depositState === DepositState.COMPLETED && (
        <Button
          onClick={onClose}
          className="easyleap-w-full easyleap-font-semibold"
          style={{
            backgroundColor: cd?.accent || "#0ea5e9",
            color: cd?.accentForeground || "#fff",
          }}
        >
          Close
        </Button>
      )}
    </div>
  );
};
