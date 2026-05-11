import React from "react";

import { ChevronRight, ExternalLink } from "lucide-react";
import { Icons } from "@lib/components/Icons";
import { useTheme } from "@lib/contexts/ThemeContext";
import { LSTAssetConfig } from "@lib/types";
import { cn } from "@lib/utils";

interface BridgeOptionsViewProps {
  lstConfig: LSTAssetConfig[];
  selectedAsset: LSTAssetConfig;
  onAssetChange: (asset: LSTAssetConfig) => void;
  onStarkgateSelect: () => void;
}

interface BridgeProvider {
  name: string;
  iconKey:
    | "bridgeStarkgate"
    | "bridgeAtomiq"
    | "bridgeGardenFinance"
    | "bridgeRhino"
    | "bridgeLayerswap";
  url?: string;
  isStarkgate?: boolean;
  supportedAssets: "all" | string[];
}

export const BridgeOptionsView: React.FC<BridgeOptionsViewProps> = ({
  lstConfig,
  selectedAsset,
  onAssetChange,
  onStarkgateSelect,
}) => {
  const theme = useTheme();
  const bd = theme.bridgeDialog!;

  const assetOptions = lstConfig.map((asset) => ({
    symbol: asset.SYMBOL,
  }));

  // Helper function to generate dynamic URLs based on provider and asset
  const getBridgeUrl = (providerName: string, asset: string): string => {
    const assetUpper = asset.toUpperCase();

    switch (providerName) {
      case "Garden Finance":
        // Garden Finance: WBTC and strkBTC both use WBTC for now, will change later on
        return "https://app.garden.finance/bridge/starknet?input-chain=bitcoin&input-asset=BTC&output-asset=WBTC";

      case "Rhino.fi":
        // Rhino.fi: Only WBTC is supported and that too on Ethereum Chain
        return "https://app.rhino.fi/bridge?mode=pay&chainIn=ETHEREUM&chainOut=STARKNET&token=WBTC&tokenOut=WBTC";

      case "Layerswap":
        // Layerswap: Dynamic URLs for all supported assets
        return `https://layerswap.io/app?from=BITCOIN_MAINNET&to=STARKNET_MAINNET&fromAsset=BTC&toAsset=${assetUpper}`;

      case "Atomiq":
        // Atomiq: Static URL (doesn't support dynamic links)
        return "https://app.atomiq.exchange";

      default:
        return "";
    }
  };

  const bridgeProviders: BridgeProvider[] = [
    {
      name: "Starkgate",
      iconKey: "bridgeStarkgate",
      isStarkgate: true,
      supportedAssets: ["STRK", "WBTC", "tBTC", "LBTC", "solvBTC"],
    },
    {
      name: "Atomiq",
      iconKey: "bridgeAtomiq",
      url: getBridgeUrl("Atomiq", selectedAsset.SYMBOL),
      supportedAssets: ["WBTC","strkBTC"],
    },
    {
      name: "Garden Finance",
      iconKey: "bridgeGardenFinance",
      url: getBridgeUrl("Garden Finance", selectedAsset.SYMBOL),
      supportedAssets: ["WBTC","strkBTC"],
    },
    {
      name: "Rhino.fi",
      iconKey: "bridgeRhino",
      url: getBridgeUrl("Rhino.fi", selectedAsset.SYMBOL),
      supportedAssets: ["WBTC"],
    },
    {
      name: "Layerswap",
      iconKey: "bridgeLayerswap",
      url: getBridgeUrl("Layerswap", selectedAsset.SYMBOL),
      supportedAssets: ["STRK", "WBTC", "tBTC", "LBTC"],
    },
  ];

  const selectedSymbol = selectedAsset.SYMBOL.toLowerCase();
  const visibleProviders = bridgeProviders.filter((provider) => {
    if (provider.supportedAssets === "all") return true;
    return provider.supportedAssets.some(
      (assetSymbol) => assetSymbol.toLowerCase() === selectedSymbol,
    );
  });

  const handleProviderClick = (provider: BridgeProvider) => {
    if (provider.isStarkgate) {
      onStarkgateSelect();
    } else if (provider.url) {
      window.open(provider.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      className="easyleap-flex easyleap-flex-col easyleap-gap-6"
      style={{ fontFamily: bd.fontFamily }}
    >
      {/* Select Asset Section */}
      <div className="easyleap-flex easyleap-flex-col easyleap-gap-3">
        <p
          className="easyleap-text-sm easyleap-font-medium"
          style={{
            color: bd.gray1100,
            letterSpacing: "-0.15px",
          }}
        >
          Select Asset
        </p>
        <div className="easyleap-flex easyleap-flex-wrap easyleap-gap-2">
          {assetOptions.map((asset) => {
            const isSelected = asset.symbol === selectedAsset.SYMBOL;
            const lstAsset = lstConfig.find((a) => a.SYMBOL === asset.symbol);

            return (
              <button
                key={asset.symbol}
                type="button"
                onClick={() => {
                  if (lstAsset) {
                    onAssetChange(lstAsset);
                  }
                }}
                disabled={!lstAsset}
                className={cn(
                  "easyleap-h-[34px] easyleap-inline-flex easyleap-items-center easyleap-justify-center easyleap-rounded-full easyleap-border easyleap-px-[17px] easyleap-py-[9px] easyleap-text-xs easyleap-font-medium easyleap-transition-all",
                  isSelected
                    ? "easyleap-border-transparent easyleap-bg-[var(--easyleap-bridge-asset-chip-selected-bg)] easyleap-text-[var(--easyleap-bridge-asset-chip-selected-text)]"
                    : "easyleap-bg-[var(--easyleap-bridge-asset-chip-bg)] easyleap-border-[var(--easyleap-bridge-asset-chip-border)] easyleap-text-[var(--easyleap-bridge-asset-chip-text)] enabled:hover:easyleap-bg-[var(--easyleap-bridge-asset-chip-hover-bg)] enabled:hover:easyleap-border-[var(--easyleap-bridge-asset-chip-hover-border)] disabled:easyleap-cursor-not-allowed disabled:easyleap-opacity-50",
                )}
                style={{
                  "--easyleap-bridge-asset-chip-selected-bg":
                    bd.brandGreen,
                  "--easyleap-bridge-asset-chip-selected-text":
                    bd.white,
                  "--easyleap-bridge-asset-chip-bg":
                    bd.white,
                  "--easyleap-bridge-asset-chip-border":
                    bd.gray400,
                  "--easyleap-bridge-asset-chip-text":
                    bd.gray1100,
                  "--easyleap-bridge-asset-chip-hover-bg":
                    bd.gray50,
                  "--easyleap-bridge-asset-chip-hover-border":
                    bd.gray700,
                  letterSpacing: "-0.15px",
                } as React.CSSProperties}
              >
                {asset.symbol}
              </button>
            );
          })}
        </div>
      </div>

      {/* Choose Bridge Provider Section */}
      <div className="easyleap-flex easyleap-flex-col easyleap-gap-3">
        <p
          className="easyleap-text-sm easyleap-font-medium"
          style={{
            color: bd.gray1100,
            letterSpacing: "-0.15px",
          }}
        >
          Choose Bridge Provider
        </p>
        <div className="easyleap-flex easyleap-flex-col easyleap-gap-2">
          {visibleProviders.map((provider) => (
            <button
              key={provider.name}
              type="button"
              onClick={() => handleProviderClick(provider)}
              className="group easyleap-flex easyleap-items-center easyleap-justify-between easyleap-h-[58px] easyleap-rounded-[10px] easyleap-border easyleap-px-[17px] easyleap-py-[17px] easyleap-transition-all easyleap-border-[var(--easyleap-bridge-provider-border)] easyleap-bg-[var(--easyleap-bridge-provider-bg)] hover:easyleap-border-[var(--easyleap-bridge-provider-hover-border)] hover:easyleap-bg-[var(--easyleap-bridge-provider-hover-bg)]"
              style={{
                "--easyleap-bridge-provider-border":
                  bd.gray350,
                "--easyleap-bridge-provider-hover-border":
                  bd.gray400,
                "--easyleap-bridge-provider-bg": provider.isStarkgate
                  ? bd.brandGreenLight
                  : bd.white,
                "--easyleap-bridge-provider-hover-bg": provider.isStarkgate
                  ? bd.brandGreenLight
                  : bd.cardHoverBackground,
              } as React.CSSProperties}
            >
              <div className="easyleap-flex easyleap-items-center easyleap-gap-[10px]">
                <div className="easyleap-flex easyleap-size-6 easyleap-shrink-0 easyleap-items-center easyleap-justify-center">
                  {React.createElement(Icons[provider.iconKey], {
                    className: "easyleap-size-6",
                  })}
                </div>
                <div className="easyleap-flex easyleap-flex-col easyleap-items-start easyleap-gap-0.5 md:easyleap-flex-row md:easyleap-items-center md:easyleap-gap-2">
                  <span
                    className="easyleap-text-base easyleap-font-medium"
                    style={{
                      color: bd.gray1200,
                      letterSpacing: "-0.31px",
                    }}
                  >
                    {provider.name}
                  </span>
                  {provider.isStarkgate && (
                    <span
                      className="easyleap-text-[10px] md:easyleap-text-xs"
                      style={{ color: bd.gray900 }}
                    >
                      ( In-app support for eth wallets )
                    </span>
                  )}
                </div>
              </div>
              {!provider.isStarkgate && (
                <div
                  className="external-icon easyleap-transition-opacity easyleap-opacity-[var(--easyleap-bridge-external-icon-opacity)] group-hover:easyleap-opacity-[var(--easyleap-bridge-external-icon-hover-opacity)]"
                  style={
                    {
                      "--easyleap-bridge-external-icon-opacity":
                        bd.providerExternalIconOpacity ?? 0.4,
                      "--easyleap-bridge-external-icon-hover-opacity":
                        bd.providerExternalIconHoverOpacity ?? 0.7,
                    } as React.CSSProperties
                  }
                >
                  <ExternalLink
                    className="easyleap-size-4"
                    color={bd.gray900}
                    strokeWidth={2}
                  />
                </div>
              )}
              {provider.isStarkgate && (
                <div className="easyleap-flex easyleap-items-center">
                  <ChevronRight
                    className="easyleap-size-4"
                    color={bd.gray900}
                    strokeWidth={2.2}
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
