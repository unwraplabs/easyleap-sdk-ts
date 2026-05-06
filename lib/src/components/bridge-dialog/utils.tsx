import React from "react";

import { BridgeTransferStatus } from "starkzap";

import { Icons } from "@lib/components/Icons";

import { BRIDGE_STATUS_ORDER } from "./constants";

export const walletLabel = (name: string) =>
  name.toLowerCase().includes("wallet") ? name : `${name} wallet`;

export const getWalletIcon = (walletId: string): React.ReactNode => {
  const id = walletId.toLowerCase();
  if (id.includes("metamask")) return <Icons.metamask className="easyleap-size-5" />;
  if (id.includes("coinbase")) return <Icons.coinbase className="easyleap-size-5" />;
  if (id.includes("walletconnect")) return <Icons.walletConnect className="easyleap-size-5" />;
  return <Icons.metamask className="easyleap-size-5" />;
};

const ASSET_ICON_PATHS: Record<string, string> = {
  WBTC: "/wbtc.svg",
  TBTC: "/tbtc.svg",
  TBTC1: "/tbtc.svg",
  TBTC2: "/tbtc.svg",
  LBTC: "/lbtc.svg",
  SOLVBTC: "/solvbtc.svg",
};

export const getAssetIcon = (symbol: string): React.ReactNode => {
  const normalizedSymbol = symbol.toUpperCase();
  const iconPath = ASSET_ICON_PATHS[normalizedSymbol];

  if (iconPath) {
    return (
      <img
        src={iconPath}
        alt={`${symbol} icon`}
        className="easyleap-size-6 easyleap-rounded-full"
      />
    );
  }

  return (
    <div className="easyleap-flex easyleap-size-6 easyleap-items-center easyleap-justify-center easyleap-rounded-full easyleap-bg-orange-500 easyleap-text-white easyleap-text-xs easyleap-font-bold">
      {symbol.charAt(0)}
    </div>
  );
};

export const getStepStatus = (
  currentStatus: BridgeTransferStatus,
  stepStatuses: BridgeTransferStatus[],
): "completed" | "current" | "pending" => {
  const currentIndex = BRIDGE_STATUS_ORDER.indexOf(currentStatus);
  const stepIndex = Math.max(...stepStatuses.map((s) => BRIDGE_STATUS_ORDER.indexOf(s)));

  if (currentIndex > stepIndex) return "completed";
  if (currentIndex === stepIndex) return "current";
  return "pending";
};
