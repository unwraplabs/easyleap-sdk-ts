import React from "react";

import { ChevronRight, ExternalLink } from "lucide-react";
import { Icons } from "@lib/components/Icons";
import { useAnalytics } from "@lib/contexts/AnalyticsContext";
import { useSharedState } from "@lib/contexts/SharedState";
import { useTheme } from "@lib/contexts/ThemeContext";
import { LSTAssetConfig } from "@lib/types";
import { BridgeEvents } from "@lib/utils/analytics";

interface BridgeOptionsViewProps {
  lstConfig: LSTAssetConfig[];
  selectedAsset: LSTAssetConfig;
  onAssetChange: (asset: LSTAssetConfig) => void;
  onStarkgateSelect: () => void;
  /** "Stake X →" after picking a bridge; the card shows no button when unset */
  onStakeAsset?: (symbol: string) => void;
}

interface BridgeProvider {
  name: string;
  iconKey:
    | "bridgeAtomiq"
    | "bridgeGardenFinance"
    | "bridgeRhino"
    | "bridgeLayerswap";
  url: string;
  supportedAssets: string[];
}

const STARKGATE_ASSETS = ["STRK", "WBTC", "tBTC", "LBTC", "solvBTC"];

const supports = (assets: string[], symbol: string) =>
  assets.some((a) => a.toLowerCase() === symbol.toLowerCase());

// Partner bridge links per asset (where a provider supports deep links)
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

export const BridgeOptionsView: React.FC<BridgeOptionsViewProps> = ({
  lstConfig,
  selectedAsset,
  onAssetChange,
  onStarkgateSelect,
  onStakeAsset,
}) => {
  const { track } = useAnalytics();
  const bd = useTheme().bridgeDialog!;
  const { appName } = useSharedState().ui;

  const symbol = selectedAsset.SYMBOL;
  const providers: BridgeProvider[] = [
    { name: "Atomiq", iconKey: "bridgeAtomiq", url: getBridgeUrl("Atomiq", symbol), supportedAssets: ["WBTC", "strkBTC"] },
    { name: "Garden Finance", iconKey: "bridgeGardenFinance", url: getBridgeUrl("Garden Finance", symbol), supportedAssets: ["WBTC", "strkBTC"] },
    { name: "Rhino.fi", iconKey: "bridgeRhino", url: getBridgeUrl("Rhino.fi", symbol), supportedAssets: ["WBTC"] },
    { name: "Layerswap", iconKey: "bridgeLayerswap", url: getBridgeUrl("Layerswap", symbol), supportedAssets: ["STRK", "WBTC", "tBTC", "LBTC"] },
  ].filter((p) => supports(p.supportedAssets, symbol)) as BridgeProvider[];
  const hasStarkgate = supports(STARKGATE_ASSETS, symbol);

  const ink = bd.gray1200;
  const muted = bd.gray900;
  const line = `1px solid ${bd.gray300}`;
  const stepLabel: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: muted,
  };

  const trackProvider = (name: string, isExternal: boolean) =>
    track(BridgeEvents.PROVIDER_SELECTED, { provider: name, asset: symbol, isExternal });

  return (
    <div className="easyleap-flex easyleap-flex-col easyleap-gap-6" style={{ fontFamily: bd.fontFamily, color: ink }}>
      <div className="easyleap-flex easyleap-flex-col easyleap-gap-3">
        <span style={stepLabel}>1 · What do you want to bring?</span>
        <div role="group" aria-label="Asset to bridge" className="easyleap-flex easyleap-flex-wrap easyleap-gap-2">
          {lstConfig.map((asset) => {
            const isSelected = asset.SYMBOL === symbol;
            const dot = asset.SYMBOL === "STRK" ? bd.brandGreen : (bd.btcAccent ?? "#E39A45");
            return (
              <button
                key={asset.SYMBOL}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  track(BridgeEvents.ASSET_SELECTED, { asset: asset.SYMBOL, context: "bridge_options" });
                  onAssetChange(asset);
                }}
                className="easyleap-flex easyleap-h-11 easyleap-items-center easyleap-gap-2 easyleap-rounded-full easyleap-pl-3 easyleap-pr-4 easyleap-transition-colors"
                style={{
                  fontSize: 15,
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? ink : muted,
                  backgroundColor: isSelected ? bd.brandGreenLight : "transparent",
                  border: isSelected ? `1.5px solid ${dot}` : line,
                  cursor: "pointer",
                }}
              >
                <span aria-hidden="true" className="easyleap-size-2.5 easyleap-rounded-full" style={{ backgroundColor: dot }} />
                {asset.SYMBOL}
              </button>
            );
          })}
        </div>
      </div>

      <div className="easyleap-flex easyleap-flex-col easyleap-gap-3">
        <span style={stepLabel}>2 · Choose a bridge</span>
        {hasStarkgate && (
          <button
            type="button"
            onClick={() => {
              trackProvider("Starkgate", false);
              onStarkgateSelect();
            }}
            className="easyleap-flex easyleap-min-h-[76px] easyleap-w-full easyleap-items-center easyleap-gap-[14px] easyleap-rounded-[18px] easyleap-px-4 easyleap-py-[14px] easyleap-text-left"
            style={{ border: `2px solid ${bd.brandGreen}`, backgroundColor: bd.brandGreenLight, color: ink, cursor: "pointer" }}
          >
            <span aria-hidden="true" className="easyleap-flex easyleap-size-10 easyleap-shrink-0 easyleap-items-center easyleap-justify-center easyleap-rounded-xl" style={{ backgroundColor: bd.white, border: line }}>
              <Icons.bridgeStarkgate className="easyleap-size-6" />
            </span>
            <span className="easyleap-flex easyleap-min-w-0 easyleap-flex-1 easyleap-flex-col easyleap-gap-[3px]">
              <span className="easyleap-flex easyleap-flex-wrap easyleap-items-center easyleap-gap-2" style={{ fontSize: 17, fontWeight: 600 }}>
                Starkgate
                <span className="easyleap-rounded-full easyleap-px-2 easyleap-py-0.5" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: bd.brandGreen, border: `1px solid ${bd.gray400}` }}>
                  IN-APP
                </span>
              </span>
              <span style={{ fontSize: 14, color: muted }}>
                Best for Ethereum wallets. Stay on {appName ?? "this app"} the whole way.
              </span>
            </span>
            <ChevronRight aria-hidden="true" className="easyleap-size-[18px] easyleap-shrink-0" color={bd.brandGreen} strokeWidth={2.2} />
          </button>
        )}

        {providers.length > 0 && (
          <>
            <span style={{ fontSize: 13, color: muted, paddingTop: hasStarkgate ? 4 : 0 }}>
              {hasStarkgate ? "Or use a partner bridge (opens in a new tab)" : "Partner bridges (open in a new tab)"}
            </span>
            <div className="easyleap-grid easyleap-grid-cols-1 easyleap-gap-2 sm:easyleap-grid-cols-2">
              {providers.map((provider) => (
                <a
                  key={provider.name}
                  href={provider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackProvider(provider.name, true)}
                  className="easyleap-flex easyleap-min-h-[60px] easyleap-items-center easyleap-gap-3 easyleap-rounded-[14px] easyleap-px-[14px] easyleap-py-[10px] easyleap-no-underline easyleap-transition-colors hover:easyleap-bg-[var(--el-provider-hover)]"
                  style={{ border: line, color: ink, "--el-provider-hover": bd.cardHoverBackground } as React.CSSProperties}
                >
                  <span aria-hidden="true" className="easyleap-flex easyleap-size-9 easyleap-shrink-0 easyleap-items-center easyleap-justify-center easyleap-rounded-[10px]" style={{ border: line, backgroundColor: bd.white }}>
                    {React.createElement(Icons[provider.iconKey], { className: "easyleap-size-6" })}
                  </span>
                  <span className="easyleap-flex-1" style={{ fontSize: 16, fontWeight: 600 }}>
                    {provider.name}
                  </span>
                  <ExternalLink aria-hidden="true" className="easyleap-size-[18px]" color={muted} strokeWidth={2} />
                </a>
              ))}
            </div>
          </>
        )}
      </div>

      <div
        className="easyleap-flex easyleap-flex-wrap easyleap-items-center easyleap-justify-between easyleap-gap-[10px] easyleap-rounded-2xl easyleap-px-4 easyleap-py-[14px]"
        style={{ border: line, backgroundColor: bd.gray50 }}
      >
        <span style={{ fontSize: 14, lineHeight: 1.45, color: muted }}>
          Once your {symbol} lands on Starknet, come back and stake it — it starts earning straight away.
        </span>
        {onStakeAsset && (
          <button
            type="button"
            onClick={() => onStakeAsset(symbol)}
            className="easyleap-min-h-11 easyleap-rounded-xl easyleap-px-4"
            style={{ border: 0, backgroundColor: ink, color: bd.white, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
          >
            Stake {symbol} →
          </button>
        )}
      </div>
      {providers.length > 0 && (
        <p style={{ margin: 0, fontSize: 13, color: muted }}>
          Partner bridges are third-party services{appName ? `, not run by ${appName}` : ""}.
        </p>
      )}
    </div>
  );
};
