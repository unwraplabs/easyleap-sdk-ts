import { StarknetInjectedWallet } from "@starknet-io/get-starknet-wallet-standard";

const REGISTER_WALLET_EVENT = "wallet-standard:register-wallet";

const LATE_INJECTING_WALLET_KEYS = [
  "starknet_argentX",
  "starknet_ready",
] as const;

const STARKNET_WINDOW_OBJECT_KEYS = [
  "id",
  "name",
  "version",
  "icon",
  "request",
  "on",
  "off",
] as const;

type RegisterWalletCallback = (api: {
  register: (wallet: unknown) => void;
}) => void;

const announced = new Set<string>();

function isStarknetWindowObject(value: unknown) {
  if (typeof value !== "object" || value === null) return false;
  return STARKNET_WINDOW_OBJECT_KEYS.every((key) => key in value);
}

export function announceLateInjectedWallets() {
  if (typeof window === "undefined") return;

  for (const key of LATE_INJECTING_WALLET_KEYS) {
    if (announced.has(key)) continue;

    const wallet = (window as unknown as Record<string, unknown>)[key];
    if (!isStarknetWindowObject(wallet)) continue;

    announced.add(key);

    const detail: RegisterWalletCallback = ({ register }) =>
      register(new StarknetInjectedWallet(wallet as never));
    window.dispatchEvent(new CustomEvent(REGISTER_WALLET_EVENT, { detail }));
  }
}
