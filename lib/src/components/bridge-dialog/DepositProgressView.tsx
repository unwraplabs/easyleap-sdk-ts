import React from "react";

import { Check, ExternalLink, Loader2 } from "lucide-react";
import { BridgeTransferStatus, DepositState } from "starkzap";

import { Button } from "@lib/components/ui/button";

import { DepositInfo, DepositProgress } from "./types";
import { BRIDGE_STATUS_ORDER } from "./constants";

interface DepositProgressViewProps {
  depositProgress: DepositProgress;
  amount: string;
  depositInfo: DepositInfo;
  selectedAssetSymbol: string;
  starknetAddress?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cd?: Record<string, any>;
  onClose: () => void;
}

export const DepositProgressView: React.FC<DepositProgressViewProps> = ({
  depositProgress,
  amount,
  depositInfo,
  selectedAssetSymbol,
  cd,
  onClose,
}) => {
  const currentStatusIndex = BRIDGE_STATUS_ORDER.indexOf(
    depositProgress.status,
  );
  const steps: Array<{
    title: string;
    statuses: BridgeTransferStatus[];
    link?: string;
  }> = [
    {
      title: "Execution on Ethereum",
      statuses: [BridgeTransferStatus.SUBMITTED_ON_L1],
      link: depositProgress.externalTxHash
        ? `https://etherscan.io/tx/${depositProgress.externalTxHash}`
        : undefined,
    },
    {
      title: "Confirmation on Ethereum",
      statuses: [BridgeTransferStatus.CONFIRMED_ON_L1],
    },
    {
      title: `Execution on Starknet (${selectedAssetSymbol})`,
      statuses: [BridgeTransferStatus.SUBMITTED_ON_STARKNET],
      link: depositProgress.starknetTxHash
        ? `https://starkscan.co/tx/${depositProgress.starknetTxHash}`
        : undefined,
    },
    {
      title: "Completed",
      statuses: [
        BridgeTransferStatus.CONFIRMED_ON_STARKNET,
        BridgeTransferStatus.COMPLETED_ON_STARKNET,
      ],
    },
  ];

  const getStepStatus = (
    stepStatuses: BridgeTransferStatus[],
    index: number,
  ): "completed" | "current" | "pending" => {
    if (depositProgress.depositState === DepositState.ERROR) {
      return currentStatusIndex >
        Math.max(...stepStatuses.map((s) => BRIDGE_STATUS_ORDER.indexOf(s)))
        ? "completed"
        : "pending";
    }

    if (
      depositProgress.depositState === DepositState.COMPLETED &&
      index === steps.length - 1
    ) {
      return "completed";
    }

    const stepIndex = Math.max(
      ...stepStatuses.map((s) => BRIDGE_STATUS_ORDER.indexOf(s)),
    );
    if (currentStatusIndex > stepIndex) return "completed";
    if (currentStatusIndex === stepIndex) return "current";
    return "pending";
  };

  return (
    <div>
      <div className="easyleap-hidden" aria-hidden="true">
        {amount} {depositInfo.estimatedFees?.usdValue ?? ""}
      </div>
      <div className="easyleap-space-y-1">
        <div
          className="easyleap-rounded-2xl easyleap-border-2 easyleap-p-4 md:easyleap-p-[20px] easyleap-space-y-1"
          style={{ borderColor: "#e8f5f1" }}
        >
          <div className="easyleap-flex easyleap-justify-center">
            <div className="easyleap-size-8 easyleap-rounded-full easyleap-border-[3.5px] easyleap-border-[#e8f5f1] easyleap-border-t-[#03624c] easyleap-animate-spin" />
          </div>

          <div className="easyleap-text-center easyleap-space-y-1">
            <p
              className="easyleap-text-lg easyleap-font-medium"
              style={{
                color: "#101828",
                fontFamily: "Inter, sans-serif",
                letterSpacing: "-0.45px",
              }}
            >
              {depositProgress.depositState === DepositState.COMPLETED
                ? "Transfer completed"
                : depositProgress.depositState === DepositState.ERROR
                  ? "Transfer failed"
                  : "Transfer in progress"}
            </p>
            <p
              className="easyleap-text-xs"
              style={{
                color: "#6a7282",
                fontFamily: "Inter, sans-serif",
                letterSpacing: "-0.15px",
              }}
            >
              {depositProgress.depositState === DepositState.COMPLETED
                ? "Funds have been sent to your Starknet wallet"
                : depositProgress.depositState === DepositState.ERROR
                  ? "Transaction could not be completed"
                  : "Transaction is publishing"}
            </p>
          </div>

          <hr
            className="easyleap-border-0 easyleap-border-t easyleap-border-dashed"
            style={{ borderColor: "#d1d5dc" }}
          />

          <div className="easyleap-space-y-1">
            {steps.map((step, index) => {
              const status = getStepStatus(step.statuses, index);
              const isLast = index === steps.length - 1;

              return (
                <React.Fragment key={step.title}>
                  <div className="easyleap-flex easyleap-items-center easyleap-gap-4">
                    <div className="easyleap-size-8 easyleap-shrink-0 easyleap-flex easyleap-items-center easyleap-justify-center">
                      {status === "completed" ? (
                        <div className="easyleap-size-8 easyleap-rounded-full easyleap-border easyleap-border-[#03624c] easyleap-flex easyleap-items-center easyleap-justify-center">
                          <Check
                            className="easyleap-size-4"
                            style={{ color: "#03624c" }}
                            strokeWidth={2.2}
                          />
                        </div>
                      ) : status === "current" ? (
                        <Loader2
                          className="easyleap-size-8 easyleap-animate-spin"
                          style={{ color: "#03624c" }}
                        />
                      ) : (
                        <div className="easyleap-size-8 easyleap-rounded-full easyleap-border easyleap-border-[#d1d5dc]" />
                      )}
                    </div>
                    <div className="easyleap-flex-1 easyleap-pt-1">
                      <p
                        className="easyleap-text-base easyleap-font-medium"
                        style={{ color: "#03624c" }}
                      >
                        {step.title}
                      </p>
                      {index === 2 && status === "current" && (
                        <p
                          className="easyleap-text-[11px]"
                          style={{ color: "#6a7282" }}
                        >
                          (This can take a while, you can close the dialog if
                          you wish to)
                        </p>
                      )}
                      {step.link && (
                        <a
                          href={step.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="easyleap-inline-flex easyleap-items-center easyleap-gap-1 easyleap-text-sm easyleap-underline"
                          style={{ color: "#6a7282" }}
                        >
                          View in explorer
                          <ExternalLink className="easyleap-size-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {!isLast && (
                    <div className="easyleap-flex easyleap-pl-[15px]">
                      <div
                        className="easyleap-w-0.5 easyleap-h-9 easyleap-rounded"
                        style={{ backgroundColor: "#e8f5f1" }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {depositProgress.depositState === DepositState.ERROR && (
        <div
          className="easyleap-p-3 md:easyleap-p-4 easyleap-rounded-lg easyleap-text-center easyleap-text-xs md:easyleap-text-sm easyleap-text-red-500"
          style={{ backgroundColor: "#fee" }}
        >
          Transaction failed. Please try again.
        </div>
      )}

      {depositProgress.depositState === DepositState.COMPLETED && (
        <Button
          onClick={onClose}
          className="easyleap-w-full easyleap-h-[48px] md:easyleap-h-[56px] easyleap-text-sm md:easyleap-text-base easyleap-font-semibold"
          style={{
            backgroundColor: cd?.accent || "#17876d",
            color: cd?.accentForeground || "#fff",
          }}
        >
          Close
        </Button>
      )}
    </div>
  );
};
