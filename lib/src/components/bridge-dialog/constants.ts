import { BridgeTransferStatus } from "starkzap";

import { LSTAssetConfig } from "./types";

export const DEFAULT_LST_CONFIGS: LSTAssetConfig[] = [
  {
    SYMBOL: "STRK",
    ASSET_ADDRESS:
      "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    LST_SYMBOL: "xSTRK",
    DECIMALS: 18,
    CATEGORY: "STRK",
    DISPLAY_NAME: "Starknet Token",
  },
  {
    SYMBOL: "WBTC",
    ASSET_ADDRESS: "0x3fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac",
    LST_SYMBOL: "xWBTC",
    DECIMALS: 8,
    CATEGORY: "BTC",
    DISPLAY_NAME: "Wrapped Bitcoin",
  },
  {
    SYMBOL: "tBTC",
    ASSET_ADDRESS: "0x4daa17763b286d1e59b97c283c0b8c949994c361e426a28f743c67bdfe9a32f",
    LST_SYMBOL: "xtBTC",
    DECIMALS: 18,
    CATEGORY: "BTC",
    DISPLAY_NAME: "Threshold Bitcoin",
  },
  {
    SYMBOL: "LBTC",
    ASSET_ADDRESS: "0x036834a40984312f7f7de8d31e3f6305b325389eaeea5b1c0664b2fb936461a4",
    LST_SYMBOL: "xLBTC",
    DECIMALS: 8,
    CATEGORY: "BTC",
    DISPLAY_NAME: "Lightning Bitcoin",
  },
  {
    SYMBOL: "solvBTC",
    ASSET_ADDRESS: "0x0593e034dda23eea82d2ba9a30960ed42cf4a01502cc2351dc9b9881f9931a68",
    LST_SYMBOL: "xsBTC",
    DECIMALS: 18,
    CATEGORY: "BTC",
    DISPLAY_NAME: "Solv Bitcoin",
  },
];

export const BRIDGE_STATUS_ORDER: BridgeTransferStatus[] = [
  BridgeTransferStatus.SUBMITTED_ON_L1,
  BridgeTransferStatus.CONFIRMED_ON_L1,
  BridgeTransferStatus.SUBMITTED_ON_STARKNET,
  BridgeTransferStatus.CONFIRMED_ON_STARKNET,
  BridgeTransferStatus.COMPLETED_ON_STARKNET,
];

export const PERCENTAGE_BUTTONS = [
  { label: "25%", value: 25 },
  { label: "50%", value: 50 },
  { label: "75%", value: 75 },
  { label: "Max", value: 100 },
] as const;
