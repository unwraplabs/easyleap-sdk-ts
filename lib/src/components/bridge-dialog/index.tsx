import React from "react";

import { ArrowLeft, ChevronDown, Info, Loader2, Wallet, X } from "lucide-react";
import { DepositState } from "starkzap";

import { Button } from "@lib/components/ui/button";
import { Input } from "@lib/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@lib/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@lib/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@lib/components/ui/tooltip";
import { cn, shortAddress } from "@lib/utils";
import { useTheme } from "@lib/contexts/ThemeContext";

import { DEFAULT_LST_CONFIGS, PERCENTAGE_BUTTONS } from "./constants";
import { DepositProgressView } from "./DepositProgressView";
import { BridgeOptionsView } from "./BridgeOptionsView";
import { BridgeDialogProps } from "./types";
import { useBridgeDialog } from "./useBridgeDialog";
import { getAssetIcon, getWalletIcon, walletLabel } from "./utils";

export type { BridgeDialogProps, LSTAssetConfig } from "./types";

const ConnectRow: React.FC<{
  label: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  bd: NonNullable<ReturnType<typeof useTheme>["bridgeDialog"]>;
}> = ({ label, icon, onClick, disabled, bd }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-gap-5 easyleap-text-sm md:easyleap-text-[16px] easyleap-px-[15px] easyleap-py-[8px] my-button disabled:easyleap-opacity-50"
    style={{
      border: `1px solid ${bd.gray300}`,
      backgroundColor: bd.white,
      color: bd.black,
    }}
  >
    <span
      className="easyleap-rounded-full easyleap-border easyleap-p-1"
      style={{ borderColor: bd.iconBorderColor }}
    >
      {icon}
    </span>
    {label}
  </button>
);

export const BridgeDialog: React.FC<BridgeDialogProps> = ({
  onBridgeSuccess,
  onBridgeError,
  style = {},
  className = "",
  lstConfig = DEFAULT_LST_CONFIGS,
}) => {
  const theme = useTheme();
  const bd = theme.bridgeDialog!;

  const [showOptionsView, setShowOptionsView] = React.useState(true);

  const {
    open,
    handleDialogClose,
    amount,
    setAmount,
    isBridging,
    isLoadingInfo,
    depositInfo,
    amountUsd,
    assetPriceUsd,
    depositProgress,
    selectedAsset,
    setSelectedAsset,
    isAssetSelectorOpen,
    setIsAssetSelectorOpen,
    evmAddress,
    starknetAddress,
    evmConnector,
    uniqueEvm,
    isConnectingEVM,
    connectEVM,
    handleDisconnectEvm,
    cd,
    handleBridge,
    handleQuickAmount,
  } = useBridgeDialog({ lstConfig, onBridgeSuccess, onBridgeError });

  const isBridgeDisabled = !starknetAddress;
  const isDepositInProgress =
    !!depositProgress &&
    depositProgress.depositState !== DepositState.COMPLETED &&
    depositProgress.depositState !== DepositState.ERROR;

  // Reset to options view when dialog opens
  React.useEffect(() => {
    if (open) {
      setShowOptionsView(true);
    }
  }, [open]);

  const handleStarkgateSelect = () => {
    setShowOptionsView(false);
  };

  const handleBackToOptions = () => {
    setShowOptionsView(true);
  };

  return (
    <>
      <style>
        {`
          .easyleap-bridge-input::placeholder {
            color: ${bd.gray800} !important;
          }
          .easyleap-bridge-trigger-button {
            background-color: ${bd.brandGreenDark} !important;
            color: #ffffff !important;
          }
        `}
      </style>
      <Dialog open={open} onOpenChange={handleDialogClose}>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="easyleap-inline-block">
              <DialogTrigger asChild>
                <Button
                  className={cn(
                    className,
                    "easyleap-bridge-trigger-button !easyleap-cursor-pointer !easyleap-border-none !easyleap-font-inter !easyleap-rounded-[8px] !easyleap-h-[40px] !easyleap-max-h-[40px]",
                  )}
                  style={{
                    ...style?.buttonStyles,
                  }}
                  disabled={isBridgeDisabled}
                >
                  Bridge
                </Button>
              </DialogTrigger>
            </span>
          </TooltipTrigger>
          {isBridgeDisabled && (
            <TooltipContent
              className="easyleap-max-w-[240px] easyleap-border easyleap-px-3 easyleap-py-2 easyleap-text-[11px] md:easyleap-text-xs"
              style={{
                backgroundColor: bd.white,
                color: bd.gray1100,
              }}
            >
              Please connect your wallet to bridge funds
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <DialogContent
        className="!easyleap-w-[350px] md:!easyleap-w-full !easyleap-max-w-[576px] !easyleap-max-h-[90vh] md:!easyleap-max-h-[734px] !easyleap-overflow-y-auto easyleap-rounded-[10px] easyleap-border easyleap-p-3 md:easyleap-p-[16px_13px]"
        style={{
          backgroundColor: bd.white,
          border: bd.modalBorder,
          boxShadow: "0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.1)",
          ...style?.modalStyles,
        }}
      >
        {/* Header */}
        <DialogHeader className="easyleap-mb-0 !easyleap-flex-row !easyleap-items-center !easyleap-space-y-0 easyleap-gap-2 md:easyleap-gap-3 easyleap-p-0">
          {!showOptionsView && (
            <button
              onClick={handleBackToOptions}
              className="easyleap-flex easyleap-size-6 easyleap-shrink-0 easyleap-items-center easyleap-justify-center easyleap-transition-opacity hover:easyleap-opacity-60"
              aria-label="Go back"
            >
              <ArrowLeft
                className="easyleap-size-[18px]"
                style={{ color: bd.gray1200 }}
                strokeWidth={1.8}
              />
            </button>
          )}
          <DialogTitle
            className="easyleap-flex-1 easyleap-text-left easyleap-text-lg md:easyleap-text-2xl easyleap-font-semibold easyleap-leading-6 md:easyleap-leading-8"
            style={{
              color: bd.brandGreenDark,
              fontFamily: "Inter, sans-serif",
              letterSpacing: "0.07px",
            }}
          >
            {showOptionsView ? "Bridge Assets" : `Bridge ${selectedAsset.SYMBOL} to Starknet`}
          </DialogTitle>
        </DialogHeader>

        {/* Description for options view */}
        {showOptionsView && (
          <p
            className="easyleap-text-sm easyleap-leading-5"
            style={{
              color: bd.brandGreenDark,
              fontFamily: "Inter, sans-serif",
              letterSpacing: "-0.15px",
            }}
          >
            Select the asset you want to bridge and choose a provider to get started
          </p>
        )}

        {/* Content */}
        {showOptionsView ? (
          <BridgeOptionsView
            lstConfig={lstConfig}
            selectedAsset={selectedAsset}
            onAssetChange={setSelectedAsset}
            onStarkgateSelect={handleStarkgateSelect}
          />
        ) : (
          <div className="easyleap-flex easyleap-flex-col easyleap-gap-2.5 md:easyleap-gap-3.5">
            {/* Starknet receiving address */}
            <div
              className="easyleap-flex easyleap-items-center easyleap-justify-between easyleap-rounded-2xl easyleap-px-3 md:easyleap-px-4 easyleap-py-3 md:easyleap-py-4"
              style={{ backgroundColor: bd.brandGreenLight }}
            >
            <span
              className="easyleap-text-xs md:easyleap-text-sm"
              style={{
                color: bd.brandGreenDark,
                fontFamily: "Inter, sans-serif",
                letterSpacing: "-0.15px",
              }}
            >
              Receiving on Starknet wallet
            </span>
            <span
              className="!easyleap-text-sm md:!easyleap-text-lg easyleap-font-inter"
              style={{ color: bd.gray1200, letterSpacing: "-0.44px" }}
            >
              {starknetAddress
                ? shortAddress(starknetAddress.toString(), 8, 8)
                : "Not connected"}
            </span>
          </div>

          {/* ETH Wallet Connection */}
          <div className="easyleap-flex easyleap-flex-col easyleap-gap-1">
            <span
              className="easyleap-text-[11px] md:easyleap-text-[13px]"
              style={{ color: bd.gray900, letterSpacing: "-0.08px" }}
            >
              Fund your starknet wallet by connecting your ETH wallet
            </span>

            {!evmAddress ? (
              <div className="easyleap-flex easyleap-flex-col easyleap-gap-2.5">
                {uniqueEvm.map((connector) => (
                  <ConnectRow
                    key={connector.name}
                    label={walletLabel(connector.name)}
                    icon={getWalletIcon(connector.name.toLowerCase())}
                    onClick={() => connectEVM({ connector })}
                    disabled={isConnectingEVM}
                    bd={bd}
                  />
                ))}
              </div>
            ) : (
              <div
                className="easyleap-flex easyleap-items-center easyleap-justify-between easyleap-rounded-2xl easyleap-px-3 md:easyleap-px-4 easyleap-py-3 md:easyleap-py-4"
                style={{ backgroundColor: bd.brandGreenLight }}
              >
                <div className="easyleap-flex easyleap-items-center easyleap-gap-2 md:easyleap-gap-3">
                  <div className="easyleap-flex easyleap-size-7 md:easyleap-size-8 easyleap-shrink-0 easyleap-items-center easyleap-justify-center easyleap-rounded-[10px]">
                    {getWalletIcon(
                      (evmConnector?.name ?? "metamask").toLowerCase(),
                    )}
                  </div>
                  <div className="easyleap-flex easyleap-flex-col">
                    <span
                      className="easyleap-text-xs md:easyleap-text-sm"
                      style={{
                        color: bd.brandGreenDark,
                        letterSpacing: "-0.15px",
                      }}
                    >
                      {walletLabel(String(evmConnector?.name ?? "EVM"))}
                    </span>
                    <span
                      className="!easyleap-text-sm md:!easyleap-text-lg easyleap-font-inter"
                      style={{
                        color: bd.gray1200,
                        letterSpacing: "-0.44px",
                      }}
                    >
                      {shortAddress(evmAddress, 6, 6)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Disconnect wallet"
                  className={cn(
                    "easyleap-flex easyleap-size-5 easyleap-items-center easyleap-justify-center easyleap-opacity-50 easyleap-transition-opacity",
                    isDepositInProgress
                      ? "easyleap-cursor-not-allowed"
                      : "hover:easyleap-opacity-85",
                  )}
                  disabled={isDepositInProgress}
                  onClick={handleDisconnectEvm}
                >
                  <X className="easyleap-size-4" strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>

          {depositProgress ? (
            <DepositProgressView
              depositProgress={depositProgress}
              amount={amount}
              depositInfo={depositInfo}
              cd={cd as Record<string, string> | undefined}
              onClose={() => handleDialogClose(false)}
              selectedAssetSymbol={selectedAsset.SYMBOL}
              starknetAddress={starknetAddress?.toString()}
            />
          ) : (
            <>
              {/* Asset Selector & Amount Input — only shown when both wallets connected */}
              {evmAddress && starknetAddress && (
                <div className="easyleap-flex easyleap-flex-col easyleap-gap-2.5 md:easyleap-gap-3">
                  {/* Asset Selector */}
                  <div className="easyleap-flex easyleap-flex-col easyleap-gap-1">
                    <label
                      className="easyleap-text-[11px] md:easyleap-text-[13px]"
                      style={{ color: bd.gray900, letterSpacing: "-0.08px" }}
                    >
                      Select Asset
                    </label>
                    <DropdownMenu
                      open={isAssetSelectorOpen}
                      onOpenChange={setIsAssetSelectorOpen}
                    >
                      <DropdownMenuTrigger asChild>
                        <button
                          className="easyleap-flex easyleap-items-center easyleap-justify-between easyleap-rounded-[14px] easyleap-border easyleap-px-3 md:easyleap-px-4 easyleap-py-3 md:easyleap-py-[21px] easyleap-transition-colors"
                          style={{ borderColor: bd.gray300 }}
                        >
                          <div className="easyleap-flex easyleap-items-center easyleap-gap-2">
                            {getAssetIcon(selectedAsset.SYMBOL)}
                            <span
                              className="easyleap-text-sm md:easyleap-text-base easyleap-font-medium"
                              style={{ letterSpacing: "-0.31px" }}
                            >
                              {selectedAsset.SYMBOL}
                            </span>
                          </div>
                          <ChevronDown className="easyleap-size-5 md:easyleap-size-6" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="easyleap-w-[var(--radix-dropdown-menu-trigger-width)]"
                        align="start"
                        style={{
                          backgroundColor: bd.white,
                          border: `1px solid ${bd.gray300}`,
                        }}
                      >
                        {lstConfig
                          .filter(
                            (asset) => asset.SYMBOL.toUpperCase() !== "STRKBTC",
                          )
                          .map((asset) => (
                          <DropdownMenuItem
                            key={asset.SYMBOL}
                            onClick={() => {
                              setSelectedAsset(asset);
                              setIsAssetSelectorOpen(false);
                              setAmount("");
                            }}
                            className="easyleap-flex easyleap-w-full easyleap-cursor-pointer easyleap-items-center easyleap-gap-2 easyleap-bg-[var(--easyleap-dropdown-item-bg)] easyleap-transition-colors data-[highlighted]:easyleap-bg-[var(--easyleap-dropdown-item-hover-bg)] data-[highlighted]:easyleap-text-[var(--easyleap-dropdown-item-hover-text)] focus:easyleap-bg-[var(--easyleap-dropdown-item-hover-bg)] focus:easyleap-text-[var(--easyleap-dropdown-item-hover-text)]"
                            style={
                              {
                                "--easyleap-dropdown-item-bg":
                                  bd.white,
                                "--easyleap-dropdown-item-hover-bg":
                                  bd.gray200,
                                "--easyleap-dropdown-item-hover-text":
                                  bd.gray1100,
                              } as React.CSSProperties
                            }
                          >
                            {getAssetIcon(asset.SYMBOL)}
                            <span>{asset.SYMBOL}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Amount Input */}
                  <div className="easyleap-flex easyleap-flex-col easyleap-gap-1">
                    <div className="easyleap-flex easyleap-items-center easyleap-justify-between easyleap-gap-3">
                      <label
                        className="easyleap-text-[11px] md:easyleap-text-[13px]"
                        style={{ color: bd.gray900, letterSpacing: "-0.08px" }}
                      >
                        Enter Amount
                      </label>
                      {depositInfo.balance && (
                        <div className="easyleap-flex easyleap-items-center easyleap-gap-1">
                          <Wallet
                            className="easyleap-size-3"
                            style={{ color: bd.gray900 }}
                          />
                          <span
                            className="easyleap-hidden md:easyleap-block easyleap-text-xs"
                            style={{ color: bd.gray900 }}
                          >
                            Balance:
                          </span>
                          <span
                            className="easyleap-text-xs"
                            style={{ color: bd.gray1100 }}
                          >
                            {(() => {
                              const balanceNum = parseFloat(depositInfo.balance);
                              if (isNaN(balanceNum)) return "0.00000000";
                              return `${balanceNum.toFixed(8)} ${selectedAsset.SYMBOL}`;
                            })()}
                          </span>
                          {assetPriceUsd !== null && (
                            <span
                              className="easyleap-text-xs"
                              style={{ color: bd.gray900 }}
                            >
                              {(() => {
                                const balanceNum = parseFloat(depositInfo.balance);
                                if (isNaN(balanceNum)) return null;
                                return `| $${(balanceNum * assetPriceUsd).toFixed(2)}`;
                              })()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div
                      className="easyleap-flex easyleap-flex-col easyleap-gap-1 easyleap-rounded-[14px] easyleap-border easyleap-px-3 md:easyleap-px-4 easyleap-py-3 md:easyleap-py-4 easyleap-transition-colors"
                      style={{ 
                        borderColor: bd.gray300,
                      }}
                    >
                      <div className="easyleap-flex easyleap-items-center easyleap-justify-between">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          disabled={isBridging || isLoadingInfo}
                          className="easyleap-bridge-input !easyleap-h-[24px] md:!easyleap-h-[29px] !easyleap-py-0 easyleap-text-xl md:!easyleap-text-2xl easyleap-flex-1 !easyleap-border-0 !easyleap-bg-transparent easyleap-p-0 easyleap-pr-1 !easyleap-shadow-none !easyleap-outline-none focus-visible:!easyleap-ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:easyleap-appearance-none [&::-webkit-outer-spin-button]:easyleap-appearance-none"
                          style={{
                            fontFamily: "Inter, sans-serif",
                            letterSpacing: "0.07px",
                            // @ts-expect-error - CSS custom property for placeholder color
                            "--placeholder-color": bd.gray800,
                          }}
                          step="0.00000001"
                          min="0"
                        />
                        <div className="easyleap-flex easyleap-items-center easyleap-gap-2">
                          <span
                            className="easyleap-text-sm md:easyleap-text-base md:!easyleap-text-lg"
                            style={{
                              color: bd.gray900,
                              letterSpacing: "-0.31px",
                            }}
                          >
                            {selectedAsset.SYMBOL}
                          </span>
                        </div>
                      </div>
                      <span
                        className="easyleap-text-xs"
                        style={{ color: bd.gray900, letterSpacing: "0.07px" }}
                      >
                        {amountUsd !== null
                          ? `≈ $${amountUsd.toFixed(2)}`
                          : "≈ $0.00"}
                      </span>
                    </div>
                  </div>

                  {/* Percentage Buttons */}
                  <div className="easyleap-flex easyleap-gap-2">
                    {PERCENTAGE_BUTTONS.map(({ label, value }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handleQuickAmount(value)}
                        disabled={!depositInfo.balance || isLoadingInfo}
                        className="easyleap-flex-1 easyleap-rounded-[10px] easyleap-py-[3px] md:easyleap-py-[4px] easyleap-text-center easyleap-text-[11px] md:easyleap-text-[13px] easyleap-font-medium easyleap-transition-all disabled:easyleap-opacity-50"
                        style={{
                          backgroundColor: bd.gray100,
                          color: bd.gray900,
                          letterSpacing: "-0.08px",
                        }}
                        onMouseEnter={(e) => {
                          if (!depositInfo.balance || isLoadingInfo) return;
                          e.currentTarget.style.backgroundColor = bd.gray200 || "";
                          e.currentTarget.style.color = bd.gray1000 || "";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = bd.gray100 || "";
                          e.currentTarget.style.color = bd.gray900 || "";
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Transaction Summary */}
                  <div className="easyleap-flex easyleap-flex-col easyleap-gap-2 md:easyleap-gap-3">
                    <p
                      className="easyleap-text-[11px] md:easyleap-text-[13px] easyleap-font-medium easyleap-uppercase"
                      style={{ color: bd.gray900, letterSpacing: "0.25px" }}
                    >
                      Transaction Summary
                    </p>

                    <div className="easyleap-flex easyleap-flex-col easyleap-gap-2">
                      <div className="easyleap-flex easyleap-items-start easyleap-justify-between">
                        <div className="easyleap-flex easyleap-items-center easyleap-gap-1">
                          <span
                            className="easyleap-text-[10px] md:easyleap-text-[11px] easyleap-font-semibold"
                            style={{
                              color: bd.brandGreenDarker,
                              letterSpacing: "0.06px",
                            }}
                          >
                            You will receive
                          </span>
                        </div>
                        <div className="easyleap-flex easyleap-flex-col easyleap-items-end easyleap-gap-1">
                          <span
                            className="easyleap-text-sm md:easyleap-text-base easyleap-font-medium"
                            style={{
                              color: bd.brandGreenDarker,
                              letterSpacing: "-0.45px",
                            }}
                          >
                            {amount || "0.00000000"} {selectedAsset.SYMBOL}
                          </span>
                          <span
                            className="easyleap-text-[10px] md:easyleap-text-xs"
                            style={{ color: bd.gray900 }}
                          >
                            {amountUsd !== null
                              ? `≈ $${amountUsd.toFixed(2)}`
                              : "≈ $0.00"}
                          </span>
                        </div>
                      </div>

                      {[
                        {
                          label: "Gas fees",
                          value: depositInfo.estimatedFees?.usdValue || "$0.06",
                          tooltipText:
                            "This is an estimated fees, actual fees may differ when you sign the transaction",
                        },
                        {
                          label: "Est. time",
                          value: "~3 minutes",
                          tooltipText:
                            "This is the estimate time required to bridge your funds, it may vary",
                        },
                      ].map(({ label, value, tooltipText }) => (
                        <div
                          key={label}
                          className="easyleap-flex easyleap-h-[17px] md:easyleap-h-[19.5px] easyleap-items-center easyleap-justify-between"
                        >
                          <div className="easyleap-flex easyleap-items-center easyleap-gap-1">
                            <span
                              className="easyleap-text-[10px] md:easyleap-text-[11px] easyleap-font-medium"
                              style={{
                                color: bd.gray900,
                                letterSpacing: "0.06px",
                              }}
                            >
                              {label}
                            </span>
                            <TooltipProvider delayDuration={0}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    aria-label={`${label} info`}
                                    className="easyleap-inline-flex easyleap-items-center easyleap-justify-center"
                                  >
                                    <Info 
                                      className="easyleap-size-3 md:easyleap-size-4"
                                      style={{ color: bd.gray900 }}
                                    />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent 
                                  className="easyleap-max-w-[220px] easyleap-border easyleap-px-3 easyleap-py-2 easyleap-text-[11px] md:easyleap-text-xs"
                                  style={{
                                    backgroundColor: bd.white,
                                    color: bd.gray1100,
                                  }}
                                >
                                  {tooltipText}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <span
                            className="easyleap-text-right easyleap-text-[11px] md:easyleap-text-[13px] easyleap-font-medium"
                            style={{
                              color: bd.gray1100,
                              letterSpacing: "-0.08px",
                            }}
                          >
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bridge Button */}
              {evmAddress && starknetAddress && (
                <Button
                  onClick={handleBridge}
                  disabled={
                    isBridging ||
                    isLoadingInfo ||
                    !amount ||
                    parseFloat(amount) <= 0
                  }
                  className="!easyleap-border-none easyleap-flex !easyleap-h-[48px] md:!easyleap-h-[56px] !easyleap-max-h-[48px] md:!easyleap-max-h-[56px] easyleap-w-full !easyleap-text-white easyleap-items-center easyleap-justify-center !easyleap-rounded-[14px] easyleap-px-4 easyleap-py-0 easyleap-text-sm md:easyleap-text-base easyleap-font-semibold easyleap-text-white easyleap-shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] easyleap-transition-colors disabled:easyleap-opacity-50"
                  style={{
                    backgroundColor:
                      !amount || parseFloat(amount) <= 0
                        ? bd.gray600
                        : bd.brandGreen,
                    letterSpacing: "-0.31px",
                    cursor:
                      !amount || parseFloat(amount) <= 0
                        ? "default"
                        : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!amount || parseFloat(amount) <= 0 || isBridging || isLoadingInfo) return;
                    e.currentTarget.style.backgroundColor = bd.brandGreenHover || "";
                  }}
                  onMouseLeave={(e) => {
                    if (!amount || parseFloat(amount) <= 0) {
                      e.currentTarget.style.backgroundColor = bd.gray600 || "";
                    } else {
                      e.currentTarget.style.backgroundColor = bd.brandGreen || "";
                    }
                  }}
                  onMouseDown={(e) => {
                    if (!amount || parseFloat(amount) <= 0 || isBridging || isLoadingInfo) return;
                    e.currentTarget.style.backgroundColor = bd.brandGreenActive || "";
                  }}
                  onMouseUp={(e) => {
                    if (!amount || parseFloat(amount) <= 0 || isBridging || isLoadingInfo) return;
                    e.currentTarget.style.backgroundColor = bd.brandGreenHover || "";
                  }}
                >
                  {isBridging ? (
                    <>
                      <Loader2 className="easyleap-mr-2 easyleap-size-4 easyleap-animate-spin" />
                      Processing...
                    </>
                  ) : isLoadingInfo ? (
                    <>
                      <Loader2 className="easyleap-mr-2 easyleap-size-4 easyleap-animate-spin" />
                      Loading...
                    </>
                  ) : !amount || parseFloat(amount) <= 0 ? (
                    "Enter Amount"
                  ) : (
                    "Transfer amount"
                  )}
                </Button>
              )}
            </>
          )}
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};
