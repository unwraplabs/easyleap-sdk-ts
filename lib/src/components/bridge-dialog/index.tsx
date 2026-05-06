import React from "react";

import { ArrowLeft, ChevronDown, Info, Loader2, Wallet, X } from "lucide-react";

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
import { cn, shortAddress } from "@lib/utils";

import { DEFAULT_LST_CONFIGS, PERCENTAGE_BUTTONS } from "./constants";
import { DepositProgressView } from "./DepositProgressView";
import { BridgeDialogProps } from "./types";
import { useBridgeDialog } from "./useBridgeDialog";
import { getAssetIcon, getWalletIcon, walletLabel } from "./utils";

export type { BridgeDialogProps, LSTAssetConfig } from "./types";

const ConnectRow: React.FC<{
  label: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}> = ({ label, icon, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-rounded-[14px] easyleap-border easyleap-px-4 easyleap-py-4 easyleap-transition-colors hover:easyleap-border-[#cbd0d5] disabled:easyleap-opacity-50"
    style={{ borderColor: "#e5e8eb", backgroundColor: "#fff" }}
  >
    <span
      className="easyleap-text-sm easyleap-font-medium"
      style={{ color: "#000", letterSpacing: "-0.31px" }}
    >
      {label}
    </span>
    <span className="easyleap-flex easyleap-items-center easyleap-rounded-full easyleap-border easyleap-border-[#DBDBDB] easyleap-p-1">
      {icon}
    </span>
  </button>
);

export const BridgeDialog: React.FC<BridgeDialogProps> = ({
  onBridgeSuccess,
  onBridgeError,
  style = {},
  className = "",
  lstConfig = DEFAULT_LST_CONFIGS,
}) => {
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

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button
          className={cn("easyleap-font-firaCode", className)}
          style={style?.buttonStyles}
          disabled={isBridgeDisabled}
          title={isBridgeDisabled ? "Connect Starknet wallet first" : undefined}
        >
          Bridge
        </Button>
      </DialogTrigger>

      <DialogContent
        className="!easyleap-w-[350px] md:!easyleap-w-full !easyleap-max-w-[576px] !easyleap-max-h-[734px] !easyleap-overflow-y-auto easyleap-rounded-[10px] easyleap-border easyleap-p-[16px_13px]"
        style={{
          backgroundColor: "#fff",
          border: "1px solid rgba(0,0,0,0.1)",
          boxShadow: "0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.1)",
          ...style?.modalStyles,
        }}
      >
        {/* Header */}
        <DialogHeader className="easyleap-mb-0 !easyleap-flex-row !easyleap-items-center !easyleap-space-y-0 easyleap-gap-3 easyleap-p-0">
          {/* Later on use it to go back to starkgate screen */}
          <button
            onClick={() => handleDialogClose(false)}
            className="easyleap-flex easyleap-size-6 easyleap-shrink-0 easyleap-items-center easyleap-justify-center easyleap-transition-opacity hover:easyleap-opacity-60"
            aria-label="Go back"
          >
            <ArrowLeft
              className="easyleap-size-[18px] easyleap-text-[#101828]"
              strokeWidth={1.8}
            />
          </button>
          <DialogTitle
            className="easyleap-flex-1 easyleap-text-left easyleap-text-2xl easyleap-font-semibold easyleap-leading-8"
            style={{
              color: "#03624c",
              fontFamily: "Inter, sans-serif",
              letterSpacing: "0.07px",
            }}
          >
            Bridge {selectedAsset.SYMBOL} to Starknet
          </DialogTitle>
        </DialogHeader>

        <div className="easyleap-flex easyleap-flex-col easyleap-gap-3.5">
          {depositProgress ? (
            <DepositProgressView
              depositProgress={depositProgress}
              amount={amount}
              depositInfo={depositInfo}
              cd={cd as Record<string, string> | undefined}
              onClose={() => handleDialogClose(false)}
            />
          ) : (
            <>
              {/* Starknet receiving address */}
              <div
                className="easyleap-flex easyleap-items-center easyleap-justify-between easyleap-rounded-2xl easyleap-px-4 easyleap-py-4"
                style={{ backgroundColor: "#e8f5f1" }}
              >
                <span
                  className="easyleap-text-sm"
                  style={{
                    // TODO: make color dynamic
                    color: "#03624c",
                    fontFamily: "Inter, sans-serif",
                    letterSpacing: "-0.15px",
                  }}
                >
                  Receiving on Starknet wallet
                </span>
                <span
                  className="easyleap-text-md easyleap-font-inter"
                  style={{ color: "#101828", letterSpacing: "-0.44px" }}
                >
                  {starknetAddress
                    ? shortAddress(starknetAddress.toString(), 8, 8)
                    : "Not connected"}
                </span>
              </div>

              {/* ETH Wallet Connection */}
              <div className="easyleap-flex easyleap-flex-col easyleap-gap-1">
                <span
                  className="easyleap-text-[13px] "
                  style={{ color: "#6b7780", letterSpacing: "-0.08px" }}
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
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="easyleap-flex easyleap-items-center easyleap-justify-between easyleap-rounded-2xl easyleap-px-4 easyleap-py-4"
                    style={{ backgroundColor: "#e8f5f1" }}
                  >
                    <div className="easyleap-flex easyleap-items-center easyleap-gap-3">
                      <div className="easyleap-flex easyleap-size-8 easyleap-shrink-0 easyleap-items-center easyleap-justify-center easyleap-rounded-[10px]">
                        {/* TODO: fix wallet icon over here and icon sizing*/}
                        {getWalletIcon(
                          (evmConnector?.name ?? "metamask").toLowerCase(),
                        )}
                      </div>
                      <div className="easyleap-flex easyleap-flex-col">
                        <span
                          className="easyleap-text-sm"
                          style={{
                            // TODO: make this color dynamic
                            color: "#03624c",
                            letterSpacing: "-0.15px",
                          }}
                        >
                          {walletLabel(String(evmConnector?.name ?? "EVM"))}
                        </span>
                        <span
                          className="easyleap-text-md easyleap-font-inter"
                          style={{
                            // TODO: make color dynamic
                            color: "#101828",
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
                      className="easyleap-flex easyleap-size-5 easyleap-items-center easyleap-justify-center easyleap-opacity-50 easyleap-transition-opacity hover:easyleap-opacity-85"
                      onClick={handleDisconnectEvm}
                    >
                      <X className="easyleap-size-3" strokeWidth={1.5} />
                    </button>
                  </div>
                )}
              </div>

              {/* Asset Selector & Amount Input — only shown when both wallets connected */}
              {evmAddress && starknetAddress && (
                <div className="easyleap-flex easyleap-flex-col easyleap-gap-3">
                  {/* Asset Selector */}
                  <div className="easyleap-flex easyleap-flex-col easyleap-gap-1">
                    <label
                      className="easyleap-text-[13px]"
                      style={{ color: "#6b7780", letterSpacing: "-0.08px" }}
                    >
                      Select BTC wrapper
                    </label>
                    <DropdownMenu
                      open={isAssetSelectorOpen}
                      onOpenChange={setIsAssetSelectorOpen}
                    >
                      <DropdownMenuTrigger asChild>
                        <button
                          className="easyleap-flex easyleap-items-center easyleap-justify-between easyleap-rounded-[14px] easyleap-border easyleap-px-4 easyleap-py-[21px] easyleap-transition-colors hover:easyleap-border-[#cbd0d5]"
                          style={{ borderColor: "#e5e8eb" }}
                        >
                          <div className="easyleap-flex easyleap-items-center easyleap-gap-2">
                            {getAssetIcon(selectedAsset.SYMBOL)}
                            <span
                              className="easyleap-text-base easyleap-font-medium"
                              style={{ letterSpacing: "-0.31px" }}
                            >
                              {selectedAsset.SYMBOL}
                            </span>
                          </div>
                          <ChevronDown className="easyleap-size-6" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="easyleap-min-w-[220px]"
                        align="start"
                        style={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e8eb",
                        }}
                      >
                        {lstConfig.map((asset) => (
                          <DropdownMenuItem
                            key={asset.SYMBOL}
                            onClick={() => {
                              setSelectedAsset(asset);
                              setIsAssetSelectorOpen(false);
                              setAmount("");
                            }}
                            className="easyleap-flex easyleap-cursor-pointer easyleap-items-center easyleap-gap-2 easyleap-bg-white easyleap-transition-colors data-[highlighted]:easyleap-bg-[#ebeef0] data-[highlighted]:easyleap-text-[#1a1f24] focus:easyleap-bg-[#ebeef0] focus:easyleap-text-[#1a1f24]"
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
                        className="easyleap-text-[13px]"
                        style={{ color: "#6b7780", letterSpacing: "-0.08px" }}
                      >
                        Enter Amount
                      </label>
                      {depositInfo.balance && (
                        <div className="easyleap-flex easyleap-items-center easyleap-gap-1">
                          <Wallet
                            className="easyleap-size-3"
                            style={{ color: "#6b7780" }}
                          />
                          <span
                            className="easyleap-hidden md:easyleap-block easyleap-text-xs"
                            style={{ color: "#6b7780" }}
                          >
                            Balance:
                          </span>
                          <span
                            className="easyleap-text-xs"
                            style={{ color: "#1a1f24" }}
                          >
                            {(() => {
                              const balanceMatch =
                                depositInfo.balance.match(/[\d,]+\.?\d*/);
                              if (!balanceMatch) return depositInfo.balance;
                              const balanceStr = balanceMatch[0].replace(
                                /,/g,
                                "",
                              );
                              const balanceNum = parseFloat(balanceStr);
                              if (isNaN(balanceNum)) return depositInfo.balance;
                              return `${balanceNum.toFixed(8)} ${selectedAsset.SYMBOL}`;
                            })()}
                          </span>
                          {assetPriceUsd !== null && (
                            <span
                              className="easyleap-text-xs"
                              style={{ color: "#6b7780" }}
                            >
                              {(() => {
                                const balanceMatch =
                                  depositInfo.balance.match(/[\d,]+\.?\d*/);
                                if (!balanceMatch) return null;
                                const balanceStr = balanceMatch[0].replace(
                                  /,/g,
                                  "",
                                );
                                const balanceNum = parseFloat(balanceStr);
                                if (isNaN(balanceNum)) return null;
                                return `| $${(balanceNum * assetPriceUsd).toFixed(2)}`;
                              })()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div
                      className="easyleap-flex easyleap-flex-col easyleap-gap-1 easyleap-rounded-[14px] easyleap-border easyleap-px-4 easyleap-py-4 easyleap-transition-colors focus-within:easyleap-border-[#17876d]"
                      style={{ borderColor: "#e5e8eb" }}
                    >
                      <div className="easyleap-flex easyleap-items-center easyleap-justify-between">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          disabled={isBridging || isLoadingInfo}
                          className="!easyleap-h-[29px] !easyleap-py-0 md:!easyleap-text-2xl easyleap-flex-1 !easyleap-border-0 !easyleap-bg-transparent easyleap-p-0 easyleap-pr-1 easyleap-text-2xl !easyleap-shadow-none !easyleap-outline-none placeholder:easyleap-text-[#8D9C9C] focus-visible:!easyleap-ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:easyleap-appearance-none [&::-webkit-outer-spin-button]:easyleap-appearance-none"
                          style={{
                            fontFamily: "Inter, sans-serif",
                            letterSpacing: "0.07px",
                          }}
                          step="0.00000001"
                          min="0"
                        />
                        <div className="easyleap-flex easyleap-items-center easyleap-gap-2">
                          <span
                            className="easyleap-text-base md:!easyleap-text-lg"
                            style={{
                              color: "#6b7780",
                              letterSpacing: "-0.31px",
                            }}
                          >
                            {selectedAsset.SYMBOL}
                          </span>
                        </div>
                      </div>
                      <span
                        className="easyleap-text-xs"
                        style={{ color: "#6b7780", letterSpacing: "0.07px" }}
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
                        className="easyleap-flex-1 easyleap-rounded-[10px] easyleap-py-[4px] easyleap-text-center easyleap-text-[13px] easyleap-font-medium easyleap-transition-all hover:easyleap-bg-[#ebeef0] hover:easyleap-text-[#4a5565] disabled:easyleap-opacity-50"
                        style={{
                          backgroundColor: "#f5f7f8",
                          color: "#6b7780",
                          letterSpacing: "-0.08px",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Transaction Summary */}
                  <div className="easyleap-flex easyleap-flex-col easyleap-gap-3">
                    <p
                      className="easyleap-text-[13px] easyleap-font-medium easyleap-uppercase"
                      style={{ color: "#6b7780", letterSpacing: "0.25px" }}
                    >
                      Transaction Summary
                    </p>

                    <div className="easyleap-flex easyleap-flex-col easyleap-gap-2">
                      <div className="easyleap-flex easyleap-items-start easyleap-justify-between">
                        <div className="easyleap-flex easyleap-items-center easyleap-gap-1">
                          <span
                            className="easyleap-text-[11px] easyleap-font-semibold"
                            style={{
                              color: "#0d5f4e",
                              letterSpacing: "0.06px",
                            }}
                          >
                            You will receive
                          </span>
                          <Info className="easyleap-size-4 easyleap-text-[#6b7780]" />
                        </div>
                        <div className="easyleap-flex easyleap-flex-col easyleap-items-end easyleap-gap-1">
                          <span
                            className="easyleap-text-base easyleap-font-medium"
                            style={{
                              color: "#0d5f4e",
                              letterSpacing: "-0.45px",
                            }}
                          >
                            {amount || "0.00000000"} {selectedAsset.SYMBOL}
                          </span>
                          <span
                            className="easyleap-text-xs"
                            style={{ color: "#6b7780" }}
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
                        },
                        { label: "Est. time", value: "~3 minutes" },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="easyleap-flex easyleap-h-[19.5px] easyleap-items-center easyleap-justify-between"
                        >
                          <div className="easyleap-flex easyleap-items-center easyleap-gap-1">
                            <span
                              className="easyleap-text-[11px] easyleap-font-medium"
                              style={{
                                color: "#6b7780",
                                letterSpacing: "0.06px",
                              }}
                            >
                              {label}
                            </span>
                            <Info className="easyleap-size-4 easyleap-text-[#6b7780]" />
                          </div>
                          <span
                            className="easyleap-text-right easyleap-text-[13px] easyleap-font-medium"
                            style={{
                              color: "#1a1f24",
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
                  className="!easyleap-border-none easyleap-flex !easyleap-h-[56px] !easyleap-max-h-[56px] easyleap-w-full !easyleap-text-white easyleap-items-center easyleap-justify-center !easyleap-rounded-[14px] easyleap-px-4 easyleap-py-0 easyleap-font-semibold easyleap-text-white easyleap-shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] easyleap-transition-colors hover:easyleap-bg-[#14755f] active:easyleap-bg-[#116652] disabled:easyleap-opacity-50"
                  style={{
                    backgroundColor:
                      !amount || parseFloat(amount) <= 0
                        ? "#C9D1D6"
                        : "#17876d",
                    letterSpacing: "-0.31px",
                    cursor:
                      !amount || parseFloat(amount) <= 0
                        ? "default"
                        : "pointer",
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
      </DialogContent>
    </Dialog>
  );
};
