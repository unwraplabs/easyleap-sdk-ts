import React from "react";

import { Check, ExternalLink, Loader2 } from "lucide-react";
import { BridgeTransferStatus, DepositState } from "starkzap";

import { Button } from "@lib/components/ui/button";
import { useTheme } from "@lib/contexts/ThemeContext";

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
  const theme = useTheme();
  const bd = theme.bridgeDialog!;
  const currentStatusIndex = BRIDGE_STATUS_ORDER.indexOf(
    depositProgress.status,
  );

  React.useEffect(() => {
    console.log("[Bridge Progress]", {
      depositState: depositProgress.depositState,
      bridgeTransferStatus: depositProgress.status,
      externalTxHash: depositProgress.externalTxHash,
      starknetTxHash: depositProgress.starknetTxHash,
    });
  }, [
    depositProgress.depositState,
    depositProgress.status,
    depositProgress.externalTxHash,
    depositProgress.starknetTxHash,
  ]);

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
  ): "completed" | "current" | "pending" => {
    // When completed, all steps should show as completed
    if (depositProgress.depositState === DepositState.COMPLETED) {
      return "completed";
    }

    // On error, mark completed steps as completed, rest as pending (no "current")
    if (depositProgress.depositState === DepositState.ERROR) {
      return currentStatusIndex >
        Math.max(...stepStatuses.map((s) => BRIDGE_STATUS_ORDER.indexOf(s)))
        ? "completed"
        : "pending";
    }

    const stepIndex = Math.max(
      ...stepStatuses.map((s) => BRIDGE_STATUS_ORDER.indexOf(s)),
    );
    
    // Check if current status matches any status in this step
    const isCurrentStep = stepStatuses.some(
      (status) => BRIDGE_STATUS_ORDER.indexOf(status) === currentStatusIndex
    );
    
    // If current status matches this step, it's currently loading
    if (isCurrentStep) return "current";
    
    // If we've passed this step's status, mark it as completed
    if (currentStatusIndex > stepIndex) return "completed";
    
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
          style={{ borderColor: bd.brandGreenLight }}
        >
          {depositProgress.depositState !== DepositState.COMPLETED &&
            depositProgress.depositState !== DepositState.ERROR && (
              <div className="easyleap-flex easyleap-justify-center">
                <div 
                  className="easyleap-size-8 easyleap-rounded-full easyleap-border-[3.5px] easyleap-animate-spin"
                  style={{
                    borderColor: bd.brandGreenLight,
                    borderTopColor: bd.brandGreenDark,
                  }}
                />
              </div>
            )}

          <div className="easyleap-text-center easyleap-space-y-1">
            <p
              className="easyleap-text-lg easyleap-font-medium"
              style={{
                color: bd.gray1200,
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
                color: bd.gray900,
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
            style={{ borderColor: bd.gray400 }}
          />

          <div className="easyleap-space-y-1">
            {steps.map((step, index) => {
              const status = getStepStatus(step.statuses);
              const isLast = index === steps.length - 1;

              return (
                <React.Fragment key={step.title}>
                  <div className="easyleap-flex easyleap-items-center easyleap-gap-4">
                    <div className="easyleap-size-8 easyleap-shrink-0 easyleap-flex easyleap-items-center easyleap-justify-center">
                      {status === "completed" ? (
                        <div 
                          className="easyleap-size-8 easyleap-rounded-full easyleap-border easyleap-flex easyleap-items-center easyleap-justify-center"
                          style={{ borderColor: bd.brandGreenDark }}
                        >
                          <Check
                            className="easyleap-size-4"
                            style={{ color: bd.brandGreenDark }}
                            strokeWidth={2.2}
                          />
                        </div>
                      ) : status === "current" ? (
                        <Loader2
                          className="easyleap-size-8 easyleap-animate-spin"
                          style={{ color: bd.brandGreenDark }}
                        />
                      ) : (
                        <div 
                          className="easyleap-size-8 easyleap-rounded-full easyleap-border"
                          style={{ borderColor: bd.gray400 }}
                        />
                      )}
                    </div>
                    <div className="easyleap-flex-1 easyleap-pt-1">
                      <p
                        className="easyleap-text-base easyleap-font-medium"
                        style={{ color: bd.brandGreenDark }}
                      >
                        {step.title}
                      </p>
                      {index === 2 && status === "current" && (
                        <p
                          className="easyleap-text-[11px]"
                          style={{ color: bd.gray900 }}
                        >
                          (This can take a while, you can close the dialog if
                          you wish to)
                        </p>
                      )}
                      {step.link && status !== "pending" && (
                        <a
                          href={step.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="easyleap-inline-flex easyleap-items-center easyleap-gap-1 easyleap-text-sm easyleap-underline"
                          style={{ color: bd.gray900 }}
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
                        style={{ backgroundColor: bd.brandGreenLight }}
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
          className="easyleap-w-full easyleap-border-none easyleap-mt-2 easyleap-h-[30px] md:easyleap-h-[40px] easyleap-text-sm md:easyleap-text-base easyleap-font-semibold"
          style={{
            backgroundColor: cd?.accent || bd.brandGreen,
            color: cd?.accentForeground || bd.white,
          }}
        >
          Close
        </Button>
      )}
    </div>
  );
};
