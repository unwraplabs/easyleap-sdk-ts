/**
 * Connect-dialog wallet list: device detection, install / open-in-app links, ordering and the
 * "last used" wallet. Kept free of React so the rules are easy to follow and test.
 */

export type DeviceOs = "ios" | "android" | "desktop";
export type DeviceBrowser = "chrome" | "firefox" | "edge" | "safari" | "other";

export interface DeviceEnv {
  isMobile: boolean;
  os: DeviceOs;
  browser: DeviceBrowser;
}

export type WalletDownloads = Partial<
  Record<"chrome" | "firefox" | "edge" | "safari" | "ios" | "android", string>
>;

export interface KnownWallet {
  id: string;
  name: string;
  /** One-line hint under the name */
  note?: string;
  downloads?: WalletDownloads;
}

export type WalletListItem<T> =
  | { kind: "installed"; id: string; name: string; note?: string; wallet: T; isLastUsed: boolean }
  | {
      kind: "install" | "open-in-app";
      id: string;
      name: string;
      note?: string;
      href: string;
      isLastUsed: boolean;
    };

const braavosDappLink = () =>
  typeof window === "undefined"
    ? undefined
    : `https://link.braavos.app/dapp/${window.location.host}`;

/**
 * Wallets the dialog offers even when they aren't installed, in display order. Links come from
 * @starknet-io/get-starknet-wallets (Ready, Braavos, MetaMask, OKX, Keplr; 6.1.1 for Bramble) and
 * starknetkit@3.4.3 (Xverse). Bitget has no published entry, so it links to a Chrome Web Store
 * search rather than a guessed extension id.
 */
export const KNOWN_WALLETS: KnownWallet[] = [
  {
    id: "argentX",
    name: "Ready X Wallet",
    note: "Formerly Argent X",
    downloads: {
      chrome:
        "https://chrome.google.com/webstore/detail/argent-x-starknet-wallet/dlcobpjiigpikoobohmabehhmhfoodbb",
      firefox: "https://addons.mozilla.org/en-US/firefox/addon/argent-x",
      edge: "https://microsoftedge.microsoft.com/addons/detail/argent-x/ajcicjlkibolbeaaagejfhnofogocgcj"
    }
  },
  {
    id: "braavos",
    name: "Braavos",
    get downloads(): WalletDownloads {
      return {
        chrome:
          "https://chrome.google.com/webstore/detail/braavos-wallet/jnlgamecbpmbajjfhmmmlhejkemejdma",
        firefox: "https://addons.mozilla.org/en-US/firefox/addon/braavos-wallet",
        edge: "https://microsoftedge.microsoft.com/addons/detail/braavos-wallet/hkkpjehhcnhgefhbdcgfkeegglpjchdc",
        ios: braavosDappLink(),
        android: braavosDappLink()
      };
    }
  },
  {
    id: "xverse",
    name: "Xverse",
    note: "Bitcoin and Starknet in one wallet",
    downloads: {
      chrome:
        "https://chrome.google.com/webstore/detail/xverse-wallet/idnnbdplmphpflfnlkomgpfbpcgelopg",
      ios: "https://apps.apple.com/us/app/xverse-bitcoin-web3-wallet/id1552272513",
      android: "https://play.google.com/store/apps/details?id=com.secretkeylabs.xverse"
    }
  },
  {
    id: "bramble",
    name: "Bramble",
    downloads: {
      chrome:
        "https://chrome.google.com/webstore/detail/bramble-starknet-wallet/jcfafpefcpcejehepoednnollpeenpop"
    }
  },
  {
    id: "metamask",
    name: "MetaMask",
    note: "Via Starknet Snap",
    downloads: {
      chrome: "https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn",
      firefox: "https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/",
      edge: "https://microsoftedge.microsoft.com/addons/detail/metamask/ejbalbakoplchlghecdalmeeeajnimhm?hl=en-US"
    }
  },
  {
    id: "keplr",
    name: "Keplr",
    downloads: {
      chrome: "https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap",
      firefox: "https://addons.mozilla.org/en-US/firefox/addon/keplr",
      edge: "https://microsoftedge.microsoft.com/addons/detail/keplr/ocodgmmffbkkeecmadcijjhkmeohinei"
    }
  },
  {
    id: "okxwallet",
    name: "OKX Wallet",
    downloads: {
      chrome: "https://chrome.google.com/webstore/detail/mcohilncbfahbmgdjkbpemcciiolgcge",
      firefox: "https://addons.mozilla.org/en-US/firefox/addon/okexwallet",
      safari: "https://apps.apple.com/us/app/okx-wallet/id6463797825"
    }
  },
  {
    id: "bitget",
    name: "Bitget Wallet",
    downloads: { chrome: "https://chromewebstore.google.com/search/Bitget%20Wallet" }
  }
];

/** Shown first in the dialog; the rest go under "More wallets" */
export const PRIMARY_WALLET_IDS = ["argentX", "braavos", "xverse", "bramble"];

/** Kept under "More wallets" even when installed, unless last used (mostly used for other chains) */
export const SECONDARY_WALLET_IDS = ["keplr", "okxwallet"];

export function detectDevice(userAgent: string): DeviceEnv {
  const ua = userAgent.toLowerCase();
  const os: DeviceOs = /iphone|ipad|ipod/.test(ua)
    ? "ios"
    : /android/.test(ua)
      ? "android"
      : "desktop";
  const browser: DeviceBrowser = /edg\//.test(ua)
    ? "edge"
    : /firefox|fxios/.test(ua)
      ? "firefox"
      : /chrome|crios|chromium/.test(ua)
        ? "chrome"
        : /safari/.test(ua)
          ? "safari"
          : "other";
  return { isMobile: os !== "desktop", os, browser };
}

const isAppStoreLink = (url: string) => /apps\.apple\.com|play\.google\.com/.test(url);
const isDeepLink = (url: string) => !isAppStoreLink(url) && /\/dapp\//.test(url);

/**
 * Link for a wallet that isn't installed: its app (or a deep link into its in-app browser) on
 * mobile, the browser's extension store on desktop (Chrome's for Chromium browsers without their
 * own). Desktop Safari has no Starknet extensions, so it gets none.
 */
export function pickWalletLink(
  downloads: WalletDownloads | undefined,
  env: DeviceEnv
): { href: string; kind: "install" | "open-in-app" } | null {
  if (!downloads) return null;
  if (env.isMobile) {
    const mobile = downloads[env.os as "ios" | "android"];
    if (mobile) return { href: mobile, kind: isDeepLink(mobile) ? "open-in-app" : "install" };
    // OKX lists its iOS App Store page under "safari"
    if (env.os === "ios" && downloads.safari && isAppStoreLink(downloads.safari)) {
      return { href: downloads.safari, kind: "install" };
    }
    return null;
  }
  if (env.browser === "safari") return null;
  const href = (env.browser !== "other" ? downloads[env.browser] : undefined) ?? downloads.chrome;
  return href ? { href, kind: "install" } : null;
}

/** "Bitget Wallet" / "bitget" -> "bitget": an injected id can differ from the listed one */
const nameKey = (name: string) =>
  name
    .toLowerCase()
    .replace(/\bwallet\b/g, "")
    .replace(/[^a-z0-9]/g, "");

/**
 * Installed wallets (last used first, then `KNOWN_WALLETS` order, then by name) followed by
 * known wallets that aren't installed but can be installed or opened on this device.
 */
export function buildWalletList<T>({
  installed,
  lastUsedId,
  env,
  known = KNOWN_WALLETS
}: {
  installed: { id: string; name: string; wallet: T }[];
  lastUsedId: string | null;
  env: DeviceEnv;
  known?: KnownWallet[];
}): WalletListItem<T>[] {
  const order = known.map((w) => w.id);
  const rank = (id: string) => {
    if (lastUsedId && id === lastUsedId) return -1;
    const index = order.indexOf(id);
    return index === -1 ? order.length : index;
  };
  const byRank = (a: { id: string; name: string }, b: { id: string; name: string }) =>
    rank(a.id) - rank(b.id) || a.name.localeCompare(b.name);
  const info = (id: string) => known.find((w) => w.id === id);

  const installedIds = new Set(installed.map((w) => w.id));
  const installedNames = new Set(installed.map((w) => nameKey(w.name)));

  const installedItems: WalletListItem<T>[] = [...installed].sort(byRank).map((w) => ({
    kind: "installed",
    id: w.id,
    // Known wallets keep their current name (e.g. Ready, not the legacy "Argent X")
    name: info(w.id)?.name ?? w.name,
    note: info(w.id)?.note,
    wallet: w.wallet,
    isLastUsed: w.id === lastUsedId
  }));

  const linkItems = known
    .filter((w) => !installedIds.has(w.id) && !installedNames.has(nameKey(w.name)))
    .flatMap((w): WalletListItem<T>[] => {
      const link = pickWalletLink(w.downloads, env);
      return link
        ? [
            {
              kind: link.kind,
              id: w.id,
              name: w.name,
              note: w.note,
              href: link.href,
              isLastUsed: w.id === lastUsedId
            }
          ]
        : [];
    })
    .sort(byRank);

  return [...installedItems, ...linkItems];
}

/** Stable wallet id: the wallet API id (e.g. "argentX", "braavos", "cartridge"), else the name */
export function getWalletId(wallet: {
  name: string;
  features: Record<string, { id?: string } | unknown>;
}): string {
  const walletApi = wallet.features["starknet:walletApi"];
  if (walletApi && typeof walletApi === "object" && "id" in walletApi && typeof walletApi.id === "string") {
    return walletApi.id;
  }
  return wallet.name;
}

const LAST_USED_WALLET_KEY = "get-starknet.last-connected-wallet";

/** The wallet get-starknet saved on the last successful connect (never cleared) */
export function getLastUsedWalletId(): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(LAST_USED_WALLET_KEY);
  } catch {
    return null;
  }
}

/** Wallet rejections arrive in many shapes; match the common ones */
export function isUserRejection(error: unknown): boolean {
  // 113: the Starknet wallet API's USER_REFUSED_OP
  if ((error as { code?: unknown } | null)?.code === 113) return true;
  const text = (() => {
    try {
      return JSON.stringify(error, Object.getOwnPropertyNames(error ?? {})).toLowerCase();
    } catch {
      return String(error).toLowerCase();
    }
  })();
  return /user rejected|user_refused|userrejected|rejected by user|user denied/.test(text);
}
