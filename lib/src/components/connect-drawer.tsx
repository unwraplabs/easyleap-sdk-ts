import { useConnect as useConnectSN } from "@starknetfoundation/starknet-start-react";
import { ChevronRight, ExternalLink, MailIcon, X } from "lucide-react";
import React from "react";
import { useConnect as useConnectWagmi } from "wagmi";

import { DialogDescription, DialogTitle } from "@lib/components/ui/dialog";
import { useAnalytics } from "@lib/contexts/AnalyticsContext";
import { usePrivyContext } from "@lib/contexts/PrivyContext";
import { useSharedState } from "@lib/contexts/SharedState";
import { useTheme } from "@lib/contexts/ThemeContext";
import { toast } from "@lib/hooks/use-toast";
import { PrivyEvents } from "@lib/utils/analytics";
import { shortAddress } from "@lib/utils";
import { announceLateInjectedWallets } from "@lib/utils/late-wallet-discovery";
import {
    buildWalletList,
    detectDevice,
    getLastUsedWalletId,
    getWalletId,
    isUserRejection,
    KNOWN_WALLETS,
    PRIMARY_WALLET_IDS,
    type WalletListItem
} from "@lib/utils/wallet-list";

type StarknetConnector = ReturnType<typeof useConnectSN>["connectors"][number];
type ConnectDialogTheme = NonNullable<ReturnType<typeof useTheme>["connectDialog"]>;

// Cartridge registers itself as "controller" too; the first one found is listed
const CARTRIDGE_WALLET_IDS = ["cartridge", "cartridge controller", "controller"];

const sectionLabel = (cd: ConnectDialogTheme): React.CSSProperties => ({
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: cd.mutedTextColor
});

const outlineButton = (cd: ConnectDialogTheme): React.CSSProperties => ({
    minHeight: 48,
    borderRadius: 12,
    border: cd.rowBorder,
    background: "transparent",
    color: cd.rowTextColor,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer"
});

/** Rounded wallet tile: the wallet's icon, else its initial */
const WalletTile: React.FC<{
    cd: ConnectDialogTheme;
    size: number;
    name: string;
    icon: React.ReactNode | null;
}> = ({ cd, size, name, icon }) => (
    <span
        aria-hidden="true"
        className="easyleap-flex easyleap-shrink-0 easyleap-items-center easyleap-justify-center easyleap-overflow-hidden"
        style={{
            width: size,
            height: size,
            borderRadius: Math.round(size / 3.3),
            border: cd.rowBorder,
            backgroundColor: cd.modalBackground,
            color: cd.rowTextColor,
            fontWeight: 700,
            fontSize: Math.round(size / 2.4)
        }}
    >
        {icon ?? name.slice(0, 1).toUpperCase()}
    </span>
);

const WalletRow: React.FC<{
    cd: ConnectDialogTheme;
    name: string;
    note?: string;
    tile: React.ReactNode;
    status?: React.ReactNode;
    onClick?: () => void;
    href?: string;
    newTab?: boolean;
    disabled?: boolean;
}> = ({ cd, name, note, tile, status, onClick, href, newTab, disabled }) => {
    const className =
        "easyleap-flex easyleap-w-full easyleap-min-h-[60px] easyleap-items-center easyleap-gap-[14px] easyleap-rounded-[14px] easyleap-px-3 easyleap-py-[10px] easyleap-text-left easyleap-no-underline easyleap-transition-colors hover:easyleap-bg-[var(--el-row-hover)] disabled:easyleap-cursor-not-allowed disabled:easyleap-opacity-50";
    const style = {
        border: cd.rowBorder,
        backgroundColor: cd.modalBackground,
        color: cd.rowTextColor,
        cursor: "pointer",
        "--el-row-hover": cd.rowHoverBackground
    } as React.CSSProperties;
    const content = (
        <>
            {tile}
            <span className="easyleap-flex easyleap-min-w-0 easyleap-flex-1 easyleap-flex-col easyleap-gap-0.5">
                <span style={{ fontSize: 16, fontWeight: 600 }}>{name}</span>
                {note && (
                    <span style={{ fontSize: 13, color: cd.mutedTextColor }}>{note}</span>
                )}
            </span>
            <span
                className="easyleap-flex easyleap-shrink-0 easyleap-items-center easyleap-gap-1"
                style={{ fontSize: 13, fontWeight: 600, color: cd.mutedTextColor }}
            >
                {status ?? <ChevronRight className="easyleap-size-[18px]" strokeWidth={2.2} />}
            </span>
        </>
    );
    if (href) {
        return (
            <a
                href={href}
                className={className}
                style={style}
                {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
                {content}
            </a>
        );
    }
    return (
        <button type="button" onClick={onClick} disabled={disabled} className={className} style={style}>
            {content}
        </button>
    );
};

async function connectStarknetWallet(
    connector: StarknetConnector,
    connectSN: ReturnType<typeof useConnectSN>["connect"],
    connectSNAsync: ReturnType<typeof useConnectSN>["connectAsync"]
) {
    if (connectSNAsync) {
        await connectSNAsync({ connector });
        return;
    }
    connectSN({ connector });
}

export interface ConnectDrawerProps {
    onClose: () => void;
    onConnectStarknet?: () => void;
    onConnectEVM?: () => void;
    onDisconnectStarknet?: () => void;
    onDisconnectEVM?: () => void;
    starknetAddress: `0x${string}` | undefined;
    evmAddress: `0x${string}` | undefined;
    starknetConnectorId: string | undefined;
    starknetConnectorName: string | undefined;
    starknetConnectorIcon: string | undefined;
    evmConnectorName: string | undefined;
    disconnectSN: () => void;
    disconnectWagmi: () => void;
    /** The wallet's own icon if we have one, else null (the tile shows its initial) */
    renderWalletIcon: (walletId: string, iconUrl?: string) => React.ReactNode | null;
}

/**
 * Body of the connect drawer: pick a wallet, the "connecting" state, and the connected account.
 * Mounted only while the drawer is open, so its state starts fresh each time.
 */
export const ConnectDrawer: React.FC<ConnectDrawerProps> = ({
    onClose,
    onConnectStarknet,
    onConnectEVM,
    onDisconnectStarknet,
    onDisconnectEVM,
    starknetAddress,
    evmAddress,
    starknetConnectorId,
    starknetConnectorName,
    starknetConnectorIcon,
    evmConnectorName,
    disconnectSN,
    disconnectWagmi,
    renderWalletIcon
}) => {
    const cd = useTheme().connectDialog!;
    const { ui } = useSharedState();
    const { connectors, connect: connectSN, connectAsync: connectSNAsync } = useConnectSN();
    const { connectors: evmConnectors, connect: connectEVM } = useConnectWagmi();
    const { user, privyWallet, connectPrivy, disconnectPrivy, isLoadingWallet } =
        usePrivyContext();
    const { track } = useAnalytics();

    const [env] = React.useState(() =>
        detectDevice(typeof navigator === "undefined" ? "" : navigator.userAgent)
    );
    const [lastUsedId] = React.useState(getLastUsedWalletId);
    const [showMore, setShowMore] = React.useState(false);
    const [busy, setBusy] = React.useState<{ id: string; name: string; icon?: string } | null>(
        null
    );
    const [error, setError] = React.useState<string | null>(null);
    // A cancelled attempt may still settle later; only the latest one updates the drawer
    const attempt = React.useRef(0);

    React.useEffect(() => {
        // Wallets that inject after get-starknet's first scan (e.g. Ready on Android)
        announceLateInjectedWallets();
    }, []);

    const isPrivyConnected = !!user || !!privyWallet?.address;
    const appName = ui.appName;
    const tile = (size: number, id: string, name: string, iconUrl?: string) => (
        <WalletTile cd={cd} size={size} name={name} icon={renderWalletIcon(id, iconUrl)} />
    );

    const unique = React.useMemo(
        () =>
            connectors.filter(
                (c, i, all) => i === all.findIndex((x) => getWalletId(x) === getWalletId(c))
            ),
        [connectors]
    );
    const cartridge = React.useMemo(
        () =>
            CARTRIDGE_WALLET_IDS.map((id) => unique.find((c) => getWalletId(c) === id)).find(
                Boolean
            ),
        [unique]
    );
    const items = React.useMemo(
        () =>
            buildWalletList({
                installed: unique
                    .filter((c) => !CARTRIDGE_WALLET_IDS.includes(getWalletId(c)))
                    .map((c) => ({ id: getWalletId(c), name: c.name, wallet: c })),
                lastUsedId,
                env
            }),
        [unique, lastUsedId, env]
    );
    // Installed wallets and the main ones are always listed; the rest sit under "More wallets"
    const shown = items.filter((i) => i.kind === "installed" || PRIMARY_WALLET_IDS.includes(i.id));
    const more = items.filter((i) => !shown.includes(i));

    const uniqueEvm = React.useMemo(
        () => evmConnectors.filter((c, i, all) => i === all.findIndex((x) => x.name === c.name)),
        [evmConnectors]
    );

    const connectWallet = async (connector: StarknetConnector, id: string, name: string) => {
        const mine = ++attempt.current;
        setError(null);
        setBusy({ id, name, icon: connector.icon as string | undefined });
        try {
            if (isPrivyConnected) await disconnectPrivy();
            await connectStarknetWallet(connector, connectSN, connectSNAsync);
            if (mine !== attempt.current) return;
            setBusy(null);
            onClose();
        } catch (err) {
            console.error("Failed to connect Starknet wallet:", err);
            if (mine !== attempt.current) return;
            setBusy(null);
            setError(
                isUserRejection(err)
                    ? `You rejected the connection in ${name}.`
                    : `Couldn't connect to ${name}. Make sure it's unlocked and on Starknet, then try again.`
            );
        } finally {
            onConnectStarknet?.();
        }
    };

    const cancelConnect = () => {
        attempt.current++;
        setBusy(null);
    };

    const copyAddress = async (address: string) => {
        try {
            await navigator.clipboard.writeText(address);
            toast({ description: "Address copied" });
        } catch {
            toast({ description: "Failed to copy address", variant: "destructive" });
        }
    };

    const disconnect = async () => {
        if (isPrivyConnected) {
            await disconnectPrivy();
        } else {
            disconnectSN();
        }
        // The bridge's EVM wallet goes with it
        if (evmAddress) {
            disconnectWagmi();
            onDisconnectEVM?.();
        }
        onDisconnectStarknet?.();
    };

    const itemStatus = (item: WalletListItem<StarknetConnector>) =>
        item.kind === "install" ? (
            <>
                Install <ExternalLink className="easyleap-size-[14px]" />
            </>
        ) : item.kind === "open-in-app" ? (
            "Open in app"
        ) : item.isLastUsed ? (
            <span
                className="easyleap-rounded-full easyleap-px-2 easyleap-py-0.5"
                style={{ fontSize: 12, color: cd.accent, backgroundColor: cd.rowHoverBackground }}
            >
                Last used
            </span>
        ) : undefined;

    const renderItem = (item: WalletListItem<StarknetConnector>) =>
        item.kind === "installed" ? (
            <WalletRow
                key={item.id}
                cd={cd}
                name={item.name}
                note={item.note}
                tile={tile(40, item.id, item.name, item.wallet.icon as string | undefined)}
                status={itemStatus(item)}
                onClick={() => connectWallet(item.wallet, item.id, item.name)}
            />
        ) : (
            <WalletRow
                key={item.id}
                cd={cd}
                name={item.name}
                note={item.note}
                tile={tile(40, item.id, item.name)}
                status={itemStatus(item)}
                href={item.href}
                // "Open in app" hands this page to the wallet's in-app browser, so it navigates in place
                newTab={item.kind === "install"}
            />
        );

    const connected = !!starknetAddress;
    const title = connected ? "Your wallet" : "Connect a wallet";
    const subtitle = connected
        ? appName
            ? `Signed in to ${appName}.`
            : "Your wallet is connected."
        : `Pick the Starknet wallet you use.${appName ? ` ${appName} never holds your funds.` : ""}`;
    const connectedName = isPrivyConnected
        ? "Email or Google"
        : (KNOWN_WALLETS.find((w) => w.id === starknetConnectorId)?.name ??
          starknetConnectorName ??
          starknetConnectorId ??
          "Starknet");

    return (
        <div
            className="easyleap-flex easyleap-min-h-full easyleap-flex-col easyleap-gap-[22px] easyleap-px-5 easyleap-py-6 sm:easyleap-px-7"
            style={{ color: cd.rowTextColor, ...(cd.fontFamily ? { fontFamily: cd.fontFamily } : {}) }}
        >
            <div className="easyleap-flex easyleap-items-start easyleap-justify-between easyleap-gap-4">
                <div className="easyleap-flex easyleap-flex-col easyleap-gap-2">
                    <DialogTitle
                        style={{
                            margin: 0,
                            fontSize: 32,
                            lineHeight: 1,
                            fontWeight: 700,
                            letterSpacing: "-0.04em",
                            color: cd.titleColor
                        }}
                    >
                        {title}
                    </DialogTitle>
                    <DialogDescription style={{ fontSize: 15, lineHeight: 1.45, color: cd.mutedTextColor }}>
                        {subtitle}
                    </DialogDescription>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="easyleap-flex easyleap-size-11 easyleap-shrink-0 easyleap-items-center easyleap-justify-center easyleap-rounded-xl"
                    style={{ border: cd.rowBorder, background: "transparent", color: cd.closeButtonColor ?? cd.rowTextColor, cursor: "pointer" }}
                >
                    <X className="easyleap-size-[18px]" strokeWidth={2} />
                </button>
            </div>

            {busy ? (
                <div className="easyleap-flex easyleap-flex-1 easyleap-flex-col easyleap-items-center easyleap-justify-center easyleap-gap-4 easyleap-py-10 easyleap-text-center">
                    {tile(56, busy.id, busy.name, busy.icon)}
                    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true" className="easyleap-animate-spin">
                        <circle cx="20" cy="20" r="16" fill="none" stroke={cd.rowHoverBackground} strokeWidth="4" />
                        <path d="M20 4a16 16 0 0 1 16 16" fill="none" stroke={cd.accent} strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    <span role="status" style={{ fontSize: 20, fontWeight: 600 }}>
                        Opening {busy.name}…
                    </span>
                    <span style={{ fontSize: 15, color: cd.mutedTextColor, maxWidth: 300 }}>
                        Approve the connection in your wallet to continue.
                    </span>
                    <button type="button" onClick={cancelConnect} style={{ ...outlineButton(cd), minHeight: 44, padding: "0 18px" }}>
                        Cancel
                    </button>
                </div>
            ) : connected ? (
                <>
                    <div
                        className="easyleap-flex easyleap-items-center easyleap-gap-[14px] easyleap-rounded-[18px] easyleap-p-[18px]"
                        style={{ border: cd.rowBorder, backgroundColor: cd.cardBackground ?? cd.rowHoverBackground }}
                    >
                        {isPrivyConnected ? (
                            <WalletTile cd={cd} size={56} name="@" icon={<MailIcon className="easyleap-size-6" />} />
                        ) : (
                            tile(56, starknetConnectorId ?? "starknet", connectedName, starknetConnectorIcon)
                        )}
                        <span className="easyleap-flex easyleap-min-w-0 easyleap-flex-col easyleap-gap-0.5">
                            <span style={{ fontSize: 13, color: cd.mutedTextColor }}>Connected with {connectedName}</span>
                            <span style={{ font: "600 17px ui-monospace, 'SF Mono', Menlo, monospace" }}>
                                {shortAddress(starknetAddress, 4, 4)}
                            </span>
                        </span>
                    </div>
                    <div className="easyleap-grid easyleap-grid-cols-2 easyleap-gap-2">
                        <button type="button" onClick={() => copyAddress(starknetAddress)} style={outlineButton(cd)}>
                            Copy address
                        </button>
                        <button type="button" onClick={disconnect} style={outlineButton(cd)}>
                            Disconnect
                        </button>
                    </div>
                </>
            ) : (
                <>
                    {error && (
                        <div
                            role="alert"
                            className="easyleap-rounded-[14px] easyleap-px-4 easyleap-py-3"
                            style={{ fontSize: 14, border: cd.rowBorder, backgroundColor: cd.cardBackground ?? cd.rowHoverBackground }}
                        >
                            {error}
                        </div>
                    )}
                    <div className="easyleap-flex easyleap-flex-col easyleap-gap-2">
                        <span style={sectionLabel(cd)}>Starknet wallets</span>
                        {shown.map(renderItem)}
                        {showMore && more.map(renderItem)}
                        {more.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowMore((v) => !v)}
                                aria-expanded={showMore}
                                className="easyleap-text-left"
                                style={{ minHeight: 44, border: 0, background: "transparent", color: cd.accent, fontSize: 15, fontWeight: 600, cursor: "pointer", padding: "0 4px" }}
                            >
                                {showMore ? "Fewer options" : "More wallets"}
                            </button>
                        )}
                        {shown.length === 0 && more.length === 0 && (
                            <span style={{ fontSize: 14, color: cd.mutedTextColor }}>
                                {!env.isMobile && env.browser === "safari"
                                    ? "Starknet wallet extensions aren't available in Safari. Open this page in Chrome, Brave, Firefox or Edge."
                                    : "No Starknet wallets found. Install one, then reload this page."}
                            </span>
                        )}
                    </div>

                    {(cartridge || ui.enableEmailLogin) && (
                        <div className="easyleap-flex easyleap-flex-col easyleap-gap-2">
                            <span style={sectionLabel(cd)}>No wallet? Sign in instead</span>
                            {ui.enableEmailLogin && (
                                <WalletRow
                                    cd={cd}
                                    name={isLoadingWallet ? "Setting up wallet…" : "Email or Google"}
                                    note="We create a Starknet account for you"
                                    tile={<WalletTile cd={cd} size={40} name="@" icon={<MailIcon className="easyleap-size-5" />} />}
                                    disabled={isLoadingWallet}
                                    onClick={async () => {
                                        track(PrivyEvents.WALLET_CONNECT_CLICKED);
                                        await connectPrivy();
                                        onConnectStarknet?.();
                                        onClose();
                                    }}
                                />
                            )}
                            {cartridge && (
                                <WalletRow
                                    cd={cd}
                                    name="Cartridge"
                                    note="Passkey-based account"
                                    tile={tile(40, "cartridge", "Cartridge", cartridge.icon as string | undefined)}
                                    onClick={() => connectWallet(cartridge, getWalletId(cartridge), "Cartridge")}
                                />
                            )}
                        </div>
                    )}

                    <div
                        className="easyleap-mt-auto easyleap-flex easyleap-flex-col easyleap-gap-1.5 easyleap-rounded-2xl easyleap-px-4 easyleap-py-[14px]"
                        style={{ border: cd.rowBorder, backgroundColor: cd.cardBackground ?? cd.rowHoverBackground }}
                    >
                        <span style={{ fontSize: 15, fontWeight: 600 }}>Your keys, your assets.</span>
                        <span style={{ fontSize: 14, lineHeight: 1.45, color: cd.mutedTextColor }}>
                            Connecting only lets {appName ?? "this app"} read your balances and ask you to
                            sign. Nothing moves without your approval.
                        </span>
                        {ui.walletHelpUrl && (
                            <a
                                href={ui.walletHelpUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: 14, fontWeight: 600, color: cd.accent, textDecoration: "none" }}
                            >
                                New to Starknet wallets? →
                            </a>
                        )}
                    </div>
                </>
            )}

            {ui.enableEvmMode && !busy && (
                <div className="easyleap-flex easyleap-flex-col easyleap-gap-2">
                    <span style={sectionLabel(cd)}>EVM wallet</span>
                    {evmAddress ? (
                        <WalletRow
                            cd={cd}
                            name={evmConnectorName ?? "EVM wallet"}
                            note={shortAddress(evmAddress, 6, 6)}
                            tile={tile(40, (evmConnectorName ?? "metamask").toLowerCase(), evmConnectorName ?? "EVM")}
                            status="Disconnect"
                            onClick={() => {
                                disconnectWagmi();
                                onDisconnectEVM?.();
                            }}
                        />
                    ) : (
                        uniqueEvm.map((connector) => (
                            <WalletRow
                                key={connector.name}
                                cd={cd}
                                name={connector.name}
                                tile={tile(40, connector.name.toLowerCase(), connector.name)}
                                onClick={() => {
                                    connectEVM({ connector });
                                    onConnectEVM?.();
                                }}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
