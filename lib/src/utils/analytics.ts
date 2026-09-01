import mixpanel, { type Mixpanel } from "mixpanel-browser";

const INSTANCE_NAME = "easyleap";

let instance: Mixpanel | null = null;

export function initAnalytics(token: string) {
  if (instance || !token) return;

  try {
    instance = mixpanel.init(token, { persistence: "localStorage" }, INSTANCE_NAME);
  } catch (e) {
    console.warn("EL::analytics – failed to initialize Mixpanel", e);
  }
}

export function trackEvent(
  event: string,
  props?: Record<string, unknown>,
) {
  if (!instance) return;

  try {
    instance.track(event, props);
  } catch (e) {
    console.warn("EL::analytics – failed to track event", e);
  }
}

export function identifyUser(distinctId: string) {
  if (!instance || !distinctId) return;

  try {
    instance.identify(distinctId);
  } catch (e) {
    console.warn("EL::analytics – failed to identify user", e);
  }
}

export const PrivyEvents = {
  WALLET_CONNECT_CLICKED: "privy_wallet_connect_clicked",
  WALLET_CONNECTED: "privy_wallet_connected",
} as const;

export const BridgeEvents = {
  BUTTON_CLICKED: "bridge_button_clicked",
  WALLETS_CONNECTED: "bridge_wallets_connected",
  ASSET_SELECTED: "bridge_asset_selected",
  AMOUNT_ENTERED: "bridge_amount_entered",
  PROVIDER_SELECTED: "bridge_provider_selected",
  INITIATED: "bridge_initiated",
  TX_SUBMITTED: "bridge_tx_submitted",
  // Granular bridge state events
  SUBMITTED_ON_L1: "bridge_submitted_on_l1",
  CONFIRMED_ON_L1: "bridge_confirmed_on_l1",
  SUBMITTED_ON_STARKNET: "bridge_submitted_on_starknet",
  CONFIRMED_ON_STARKNET: "bridge_confirmed_on_starknet",
  COMPLETED_ON_STARKNET: "bridge_completed_on_starknet",
  COMPLETED: "bridge_completed",
  FAILED: "bridge_failed",
} as const;
