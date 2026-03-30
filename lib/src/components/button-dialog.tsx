import {
    useAccount as useAccountSn,
    useConnect as useConnectSN,
    useDisconnect as useDisconnectSN
} from "@starknet-react/core";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import React from "react";
import {
    useConnect as useConnectWagmi,
    useDisconnect as useDisconnectWagmi
} from "wagmi";
import { getAccount } from "@wagmi/core";

import { Icons } from "@lib/components/Icons";
import { Button } from "@lib/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@lib/components/ui/dialog";
import { InteractionMode, useSharedState } from "@lib/contexts/SharedState";
import { useTheme } from "@lib/contexts/ThemeContext";
import { useAccount, evmConfig } from "@lib/hooks/useAccount";
import { useMode } from "@lib/hooks/useMode";
import { cn, shortAddress } from "@lib/utils";

import { ModeSwitcher, type ConnectButtonProps } from ".";

type ChainFilter = "all" | "starknet" | "ethereum";

function isMetaMaskSnConnector(id: string | undefined) {
    return (id ?? "").toLowerCase() === "metamask";
}

function isMetaMaskEvmConnector(name: string | undefined) {
    return (name ?? "").toLowerCase() === "metamask";
}

/** Calls starknet + wagmi connect hooks; must render under StarknetConfig + WagmiProvider. */
const WalletConnectPanel: React.FC<{
    chainFilter: ChainFilter;
    cd: NonNullable<ReturnType<typeof useTheme>["connectDialog"]>;
    onConnectStarknet?: () => void;
    onConnectEVM?: () => void;
    starknetAddress: `0x${string}` | undefined;
    evmAddress: `0x${string}` | undefined;
    starknetConnectorId: string | undefined;
    starknetConnectorName: string | undefined;
    evmConnectorName: string | undefined;
    disconnectSN: () => void;
    disconnectWagmi: () => void;
    onDisconnectStarknet?: () => void;
    onDisconnectEVM?: () => void;
    onDisconnectEvmSideEffects: () => void;
    getWalletIcon: (walletId: string) => React.ReactNode;
}> = ({
    chainFilter,
    cd,
    onConnectStarknet,
    onConnectEVM,
    starknetAddress,
    evmAddress,
    starknetConnectorId,
    starknetConnectorName,
    evmConnectorName,
    disconnectSN,
    disconnectWagmi,
    onDisconnectStarknet,
    onDisconnectEVM,
    onDisconnectEvmSideEffects,
    getWalletIcon
}) => {
    const { connectors: snConnectors, connect: connectSN } = useConnectSN();
    const { connectors: evmConnectors, connect: connectEVM } =
        useConnectWagmi();
    const [metaMaskExpanded, setMetaMaskExpanded] = React.useState(false);

    const uniqueSn = React.useMemo(
        () =>
            snConnectors.filter(
                (c, i, self) => i === self.findIndex((x) => x.id === c.id)
            ),
        [snConnectors]
    );

    const uniqueEvm = React.useMemo(
        () =>
            evmConnectors.filter(
                (c, i, self) => i === self.findIndex((x) => x.name === c.name)
            ),
        [evmConnectors]
    );

    const snMetaMask = uniqueSn.find((c) => isMetaMaskSnConnector(c.id));
    const evmMetaMask = uniqueEvm.find((c) => isMetaMaskEvmConnector(c.name));

    const showMultichainMetaMask =
        chainFilter === "all" &&
        Boolean(snMetaMask && evmMetaMask) &&
        !starknetAddress &&
        !evmAddress;

    const showSnMetaMaskRow =
        Boolean(snMetaMask) &&
        !starknetAddress &&
        (chainFilter === "starknet" ||
            (chainFilter === "all" && !showMultichainMetaMask));

    const showEvmMetaMaskRow =
        Boolean(evmMetaMask) &&
        !evmAddress &&
        (chainFilter === "ethereum" ||
            (chainFilter === "all" && !showMultichainMetaMask));

    const otherSn = uniqueSn.filter((c) => !isMetaMaskSnConnector(c.id));
    const otherEvm = uniqueEvm.filter((c) => !isMetaMaskEvmConnector(c.name));

    const showOtherSn =
        !starknetAddress &&
        (chainFilter === "starknet" || chainFilter === "all");
    const showOtherEvm =
        !evmAddress && (chainFilter === "ethereum" || chainFilter === "all");

    React.useEffect(() => {
        setMetaMaskExpanded(false);
    }, [chainFilter]);

    const rowBase: React.CSSProperties = {
        border: cd.rowBorder,
        color: cd.rowTextColor,
        backgroundColor: "transparent"
    };

    const subRow = (label: string, onClick: () => void) => (
        <button
            key={label}
            type="button"
            onClick={onClick}
            className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-rounded-lg easyleap-px-3 easyleap-py-2.5 easyleap-text-left easyleap-text-sm easyleap-transition-colors"
            style={{
                ...rowBase,
                marginTop: "6px",
                backgroundColor:
                    cd.tabInactiveBackground ?? "rgba(255,255,255,0.04)"
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                    cd.rowHoverBackground ?? "";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                    cd.tabInactiveBackground ?? "rgba(255,255,255,0.04)";
            }}
        >
            <span>{label}</span>
            <ChevronRight className="easyleap-size-4 easyleap-opacity-60" />
        </button>
    );

    const walletLabel = (name: string) =>
        name.toLowerCase().includes("wallet") ? name : `${name} wallet`;

    const rows: React.ReactNode[] = [];

    if (starknetAddress) {
        rows.push(
            <div
                key="connected-sn"
                className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-rounded-xl easyleap-px-3 easyleap-py-3"
                style={{
                    ...rowBase,
                    backgroundColor: cd.rowHoverBackground
                }}
            >
                <div className="easyleap-flex easyleap-items-center easyleap-gap-3">
                    <span
                        className={cn(
                            "easyleap-flex easyleap-items-center easyleap-justify-center easyleap-rounded-full easyleap-p-1",
                            {
                                "easyleap-p-0":
                                    starknetConnectorId === "argentX"
                            }
                        )}
                    >
                        {getWalletIcon(starknetConnectorId ?? "braavos")}
                    </span>
                    <div className="easyleap-flex easyleap-flex-col easyleap-gap-0.5">
                        <span className="easyleap-text-sm easyleap-font-medium">
                            {walletLabel(
                                String(
                                    starknetConnectorName ??
                                        starknetConnectorId ??
                                        "Starknet"
                                )
                            )}
                        </span>
                        <span
                            className="easyleap-font-mono easyleap-text-xs"
                            style={{ color: cd.mutedTextColor }}
                        >
                            {shortAddress(starknetAddress, 6, 6)}
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    aria-label="Disconnect Starknet"
                    className="easyleap-rounded-md easyleap-p-1 easyleap-transition-opacity hover:easyleap-opacity-80"
                    style={{ color: cd.mutedTextColor }}
                    onClick={() => {
                        disconnectSN();
                        onDisconnectStarknet?.();
                    }}
                >
                    <X className="easyleap-size-4" />
                </button>
            </div>
        );
    }

    if (evmAddress) {
        rows.push(
            <div
                key="connected-evm"
                className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-rounded-xl easyleap-px-3 easyleap-py-3"
                style={{
                    ...rowBase,
                    backgroundColor: cd.rowHoverBackground
                }}
            >
                <div className="easyleap-flex easyleap-items-center easyleap-gap-3">
                    <span className="easyleap-flex easyleap-items-center easyleap-rounded-full easyleap-p-1">
                        {getWalletIcon(
                            (evmConnectorName ?? "metamask").toLowerCase()
                        )}
                    </span>
                    <div className="easyleap-flex easyleap-flex-col easyleap-gap-0.5">
                        <span className="easyleap-text-sm easyleap-font-medium">
                            {walletLabel(String(evmConnectorName ?? "EVM"))}
                        </span>
                        <span
                            className="easyleap-font-mono easyleap-text-xs"
                            style={{ color: cd.mutedTextColor }}
                        >
                            {shortAddress(evmAddress, 6, 6)}
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    aria-label="Disconnect EVM"
                    className="easyleap-rounded-md easyleap-p-1 easyleap-transition-opacity hover:easyleap-opacity-80"
                    style={{ color: cd.mutedTextColor }}
                    onClick={() => {
                        onDisconnectEvmSideEffects();
                        disconnectWagmi();
                        onDisconnectEVM?.();
                    }}
                >
                    <X className="easyleap-size-4" />
                </button>
            </div>
        );
    }

    if (showMultichainMetaMask && snMetaMask && evmMetaMask) {
        rows.push(
            <div key="mm-multi" className="easyleap-w-full">
                <button
                    type="button"
                    onClick={() => setMetaMaskExpanded((e) => !e)}
                    className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-rounded-xl easyleap-px-3 easyleap-py-3 easyleap-text-left easyleap-transition-colors"
                    style={rowBase}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                            cd.rowHoverBackground ?? "";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                >
                    <div className="easyleap-flex easyleap-items-center easyleap-gap-3">
                        <Icons.metamask className="easyleap-size-8 easyleap-shrink-0" />
                        <span className="easyleap-text-sm easyleap-font-medium">
                            Metamask wallet
                        </span>
                    </div>
                    <div className="easyleap-flex easyleap-items-center easyleap-gap-2">
                        <span
                            className="easyleap-inline-flex easyleap-items-center easyleap-gap-1.5 easyleap-rounded-full easyleap-px-2 easyleap-py-0.5 easyleap-text-[11px] easyleap-font-medium"
                            style={{
                                color: cd.mutedTextColor,
                                border: cd.rowBorder
                            }}
                        >
                            <span
                                className="easyleap-size-1.5 easyleap-rounded-full"
                                style={{
                                    backgroundColor: cd.accent ?? "#4F8FFF"
                                }}
                            />
                            Multichain
                        </span>
                        <ChevronDown
                            className={cn(
                                "easyleap-size-4 easyleap-transition-transform easyleap-opacity-70",
                                metaMaskExpanded && "easyleap-rotate-180"
                            )}
                        />
                    </div>
                </button>
                {metaMaskExpanded && (
                    <div className="easyleap-pl-1 easyleap-pr-1">
                        {subRow("Starknet", () => {
                            connectSN({ connector: snMetaMask });
                            onConnectStarknet?.();
                            setMetaMaskExpanded(false);
                        })}
                        {subRow("Ethereum", () => {
                            connectEVM({ connector: evmMetaMask });
                            onConnectEVM?.();
                            setMetaMaskExpanded(false);
                        })}
                    </div>
                )}
            </div>
        );
    } else {
        if (showSnMetaMaskRow && snMetaMask) {
            rows.push(
                <button
                    key="mm-sn"
                    type="button"
                    onClick={() => {
                        connectSN({ connector: snMetaMask });
                        onConnectStarknet?.();
                    }}
                    className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-rounded-xl easyleap-px-3 easyleap-py-3 easyleap-text-left easyleap-transition-colors"
                    style={rowBase}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                            cd.rowHoverBackground ?? "";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                >
                    <div className="easyleap-flex easyleap-items-center easyleap-gap-3">
                        <Icons.metamask className="easyleap-size-8 easyleap-shrink-0" />
                        <span className="easyleap-text-sm easyleap-font-medium">
                            Metamask wallet
                        </span>
                    </div>
                    <ChevronRight className="easyleap-size-4 easyleap-opacity-60" />
                </button>
            );
        }

        if (showEvmMetaMaskRow && evmMetaMask) {
            rows.push(
                <button
                    key="mm-evm"
                    type="button"
                    onClick={() => {
                        connectEVM({ connector: evmMetaMask });
                        onConnectEVM?.();
                    }}
                    className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-rounded-xl easyleap-px-3 easyleap-py-3 easyleap-text-left easyleap-transition-colors"
                    style={rowBase}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                            cd.rowHoverBackground ?? "";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                >
                    <div className="easyleap-flex easyleap-items-center easyleap-gap-3">
                        <Icons.metamask className="easyleap-size-8 easyleap-shrink-0" />
                        <span className="easyleap-text-sm easyleap-font-medium">
                            Metamask wallet
                        </span>
                    </div>
                    <ChevronRight className="easyleap-size-4 easyleap-opacity-60" />
                </button>
            );
        }
    }

    if (showOtherSn) {
        for (const c of otherSn) {
            rows.push(
                <button
                    key={`sn-${c.id}`}
                    type="button"
                    onClick={() => {
                        connectSN({ connector: c });
                        onConnectStarknet?.();
                    }}
                    className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-rounded-xl easyleap-px-3 easyleap-py-3 easyleap-text-left easyleap-transition-colors"
                    style={rowBase}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                            cd.rowHoverBackground ?? "";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                >
                    <div className="easyleap-flex easyleap-items-center easyleap-gap-3">
                        <span
                            className={cn(
                                "easyleap-flex easyleap-size-8 easyleap-items-center easyleap-justify-center easyleap-shrink-0",
                                { "easyleap-p-0": c.id === "argentX" }
                            )}
                        >
                            {getWalletIcon(c.id)}
                        </span>
                        <span className="easyleap-text-sm easyleap-font-medium">
                            {walletLabel(c.name)}
                        </span>
                    </div>
                    <ChevronRight className="easyleap-size-4 easyleap-opacity-60" />
                </button>
            );
        }
    }

    if (showOtherEvm) {
        for (const c of otherEvm) {
            rows.push(
                <button
                    key={`evm-${c.name}`}
                    type="button"
                    onClick={() => {
                        connectEVM({ connector: c });
                        onConnectEVM?.();
                    }}
                    className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-rounded-xl easyleap-px-3 easyleap-py-3 easyleap-text-left easyleap-transition-colors"
                    style={rowBase}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                            cd.rowHoverBackground ?? "";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                >
                    <div className="easyleap-flex easyleap-items-center easyleap-gap-3">
                        <span className="easyleap-flex easyleap-size-8 easyleap-items-center easyleap-justify-center easyleap-shrink-0 easyleap-rounded-full easyleap-p-1">
                            {getWalletIcon(c.name.toLowerCase())}
                        </span>
                        <span className="easyleap-text-sm easyleap-font-medium">
                            {walletLabel(c.name)}
                        </span>
                    </div>
                    <ChevronRight className="easyleap-size-4 easyleap-opacity-60" />
                </button>
            );
        }
    }

    if (rows.length === 0) {
        return (
            <p
                className="easyleap-py-6 easyleap-text-center easyleap-text-sm"
                style={{ color: cd.mutedTextColor }}
            >
                No wallets available for this network.
            </p>
        );
    }

    return (
        <div className="easyleap-flex easyleap-max-h-[min(60vh,420px)] easyleap-flex-col easyleap-gap-2 easyleap-overflow-y-auto easyleap-pr-1">
            {rows}
        </div>
    );
};

export const ButtonDialog: React.FC<ConnectButtonProps> = ({
    onConnectStarknet,
    onDisconnectStarknet,
    onConnectEVM,
    onDisconnectEVM,
    style,
    className
}) => {
    const mode = useMode();
    const sharedState = useSharedState();
    const { evmAddress, starknetAddress } = useAccount();

    const { disconnect: disconnectSN } = useDisconnectSN();
    const { disconnect: disconnectWagmi } = useDisconnectWagmi();

    const { connector: connectedSnConnector } = useAccountSn();
    const { connector: connectorEVM } = getAccount(evmConfig);

    const theme = useTheme();
    const cd = theme.connectDialog!;
    const [chainFilter, setChainFilter] = React.useState<ChainFilter>("all");

    const walletIconMap: Record<
        string,
        { Icon: React.ElementType; size?: string }
    > = {
        braavos: { Icon: Icons.braavos, size: "easyleap-size-5" },
        argentX: { Icon: Icons.argentX, size: "easyleap-size-15" },
        argentWebWallet: { Icon: Icons.wallet, size: "easyleap-size-5" },
        keplr: { Icon: Icons.keplr, size: "easyleap-size-5" },
        "argent-mobile": { Icon: Icons.argentMobile, size: "easyleap-size-5" },
        metamask: { Icon: Icons.metamask, size: "easyleap-size-5" },
        "coinbase wallet": { Icon: Icons.coinbase, size: "easyleap-size-5" },
        subwallet: { Icon: Icons.subwallet, size: "easyleap-size-5" },
        trust: { Icon: Icons.trust, size: "easyleap-size-5" },
        rainbow: { Icon: Icons.rainbow, size: "easyleap-size-5" },
        phantom: { Icon: Icons.phantom, size: "easyleap-size-5" },
        walletconnect: { Icon: Icons.wallet, size: "easyleap-size-5" },
        fordefi: { Icon: Icons.wallet, size: "easyleap-size-5" },
        okxwallet: { Icon: Icons.wallet, size: "easyleap-size-5" },
        xverse: { Icon: Icons.wallet, size: "easyleap-size-5" },
        starknet: { Icon: Icons.wallet, size: "easyleap-size-5" },
        "argent web wallet": { Icon: Icons.wallet, size: "easyleap-size-5" }
    };

    const getWalletIcon = (walletId: string) => {
        const key = walletId.toLowerCase();
        const wallet = walletIconMap[key];

        return wallet ? (
            <wallet.Icon
                key={walletId}
                className={wallet.size || "easyleap-size-5"}
            />
        ) : (
            <Icons.wallet className="easyleap-size-5" />
        );
    };

    const starknetConnectorId = connectedSnConnector?.id;
    const starknetConnectorName = connectedSnConnector?.name;

    const onDisconnectEvmSideEffects = () => {
        if (!starknetAddress) {
            sharedState.setMode(InteractionMode.None);
        } else {
            sharedState.setMode(InteractionMode.Starknet);
        }
    };

    const modalShellStyle: React.CSSProperties = {
        backgroundColor: cd.modalBackground,
        border: cd.modalBorder,
        borderRadius: cd.modalBorderRadius,
        color: cd.rowTextColor,
        boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        ...style?.modalStyles
    };

    const tabRadius = "10px";
    /** Match vertical dividers to active segment fill (`tabBtn` uses `cd.accent` when selected). */
    const tabSegmentBorder = `1px solid ${cd.accent ?? "#B4A7D6"}`;

    const tabBtn = (active: boolean): React.CSSProperties => ({
        border: "none",
        cursor: "pointer",
        padding: "8px 14px",
        fontSize: "13px",
        fontWeight: 500,
        transition: "background 0.15s, color 0.15s",
        ...(active
            ? {
                  backgroundColor: cd.accent,
                  color: cd.accentForeground ?? "#1A1528"
              }
            : {
                  backgroundColor: cd.tabInactiveBackground ?? "transparent",
                  color: cd.rowTextColor
              })
    });

    return (
        <div
            className={cn(
                "easyleap-w-full easyleap-z-10 easyleap-flex easyleap-items-center easyleap-gap-4 md:easyleap-flex-row easyleap-rounded-[50px]",
                {
                    "easyleap-bg-white easyleap-px-2 easyleap-pt-1 easyleap-pb-1":
                        evmAddress || starknetAddress
                }
            )}
            style={{
                backgroundColor:
                    evmAddress || starknetAddress
                        ? mode === InteractionMode.EVM
                            ? theme?.evmMode?.mainBgColor
                            : theme?.starknetMode?.mainBgColor
                        : undefined
            }}
        >
            <Dialog
                open={sharedState.connectWalletModalOpen}
                onOpenChange={(open) => {
                    sharedState.setConnectWalletModalOpen(open);
                    if (!open) setChainFilter("all");
                }}
            >
                <div className="easyleap-w-full easyleap-flex md:easyleap-flex-row gap-2">
                    <DialogTrigger asChild>
                        <div className="easyleap-w-full easyleap-font-firaCode easylea-items-center easyleap-flex">
                            {!evmAddress && !starknetAddress && (
                                <Button
                                    variant="outline"
                                    style={{
                                        color:
                                            style?.buttonStyles?.color ||
                                            theme?.noneMode?.color,
                                        backgroundColor:
                                            style?.buttonStyles
                                                ?.backgroundColor ||
                                            theme?.noneMode?.backgroundColor,
                                        border:
                                            style?.buttonStyles?.border ||
                                            theme?.noneMode?.border,
                                        ...style?.buttonStyles
                                    }}
                                    className={cn(
                                        "easyleap-rounded-[50px] easyleap-text-center easyleap-text-white easyleap-h-full",
                                        className
                                    )}
                                >
                                    Connect wallet
                                </Button>
                            )}

                            {mode === InteractionMode.Starknet &&
                                starknetAddress && (
                                    <Button
                                        style={{
                                            color: theme?.starknetMode?.button
                                                ?.color,
                                            backgroundColor:
                                                theme?.starknetMode?.button
                                                    ?.backgroundColor,
                                            border: theme?.starknetMode?.button
                                                ?.border,
                                            borderRadius:
                                                theme?.starknetMode?.button
                                                    ?.borderRadius
                                        }}
                                        className={cn(
                                            "easyleap-mx-auto easyleap-flex easyleap-w-fit easyleap-items-center easyleap-justify-start easyleap-gap-3 easyleap-font-medium hover:easyleap-bg-transparent easyleap-rounded-[50px]",
                                            className
                                        )}
                                    >
                                        <span className="easyleap-rounded-full easyleap-bg-[#fff] easyleap-p-1 easyleap--ml-[15px]">
                                            {getWalletIcon(
                                                connectedSnConnector?.id ??
                                                    "braavos"
                                            )}
                                        </span>
                                        {shortAddress(
                                            starknetAddress || "",
                                            4,
                                            4
                                        )}
                                    </Button>
                                )}

                            {mode === InteractionMode.EVM && evmAddress && (
                                <Button
                                    style={{
                                        color: theme?.evmMode?.button?.color,
                                        backgroundColor:
                                            theme?.evmMode?.button
                                                ?.backgroundColor,
                                        border: theme?.evmMode?.button?.border,
                                        borderRadius:
                                            theme?.evmMode?.button?.borderRadius
                                    }}
                                    className={cn(
                                        "easyleap-mx-auto easyleap-flex easyleap-w-fit easyleap-items-center easyleap-justify-start easyleap-gap-3 easyleap-font-medium hover:easyleap-bg-transparent easyleap-rounded-[50px]",
                                        className
                                    )}
                                >
                                    <span className="easyleap-rounded-full easyleap-bg-white easyleap-p-1 easyleap--ml-[15px]">
                                        {getWalletIcon(
                                            connectorEVM?.name.toLocaleLowerCase() ??
                                                "metamask"
                                        )}
                                    </span>
                                    {shortAddress(evmAddress, 4, 4)}
                                </Button>
                            )}
                        </div>
                    </DialogTrigger>

                    <ModeSwitcher />
                </div>

                <DialogContent
                    className="easyleap-max-h-[100vh] easyleap-gap-5 easyleap-p-4 easyleap-font-dmSans md:easyleap-p-6 lg:easyleap-max-h-none"
                    style={modalShellStyle}
                    closeClassName="easyleap-opacity-90 hover:easyleap-opacity-100"
                    closeStyle={
                        cd.closeButtonColor
                            ? { color: cd.closeButtonColor }
                            : undefined
                    }
                >
                    <DialogHeader className="easyleap-space-y-0 easyleap-text-left sm:easyleap-text-center">
                        <DialogTitle
                            className="easyleap-text-xl easyleap-font-medium md:easyleap-text-2xl"
                            style={{ color: cd.titleColor }}
                        >
                            Connect wallet to
                        </DialogTitle>
                    </DialogHeader>

                    <div
                        className="easyleap-flex easyleap-w-full easyleap-flex-col easyleap-gap-3 easyleap-overflow-hidden easyleap-rounded-[10px] easyleap-p-0"
                        style={{ border: tabSegmentBorder }}
                    >
                        <div className="easyleap-flex easyleap-w-full easyleap-items-stretch easyleap-gap-0">
                            <button
                                type="button"
                                onClick={() => setChainFilter("all")}
                                className="easyleap-min-w-0 easyleap-flex-1"
                                style={{
                                    ...tabBtn(chainFilter === "all"),
                                    borderTopLeftRadius: tabRadius,
                                    borderBottomLeftRadius: tabRadius,
                                    borderTopRightRadius: 0,
                                    borderBottomRightRadius: 0,
                                    borderRight: tabSegmentBorder
                                }}
                            >
                                All chains
                            </button>
                            <button
                                type="button"
                                aria-label="Starknet"
                                onClick={() => setChainFilter("starknet")}
                                className="easyleap-flex easyleap-min-h-[40px] easyleap-min-w-[56px] easyleap-items-center easyleap-justify-center easyleap-shrink-0"
                                style={{
                                    ...tabBtn(chainFilter === "starknet"),
                                    padding: "8px",
                                    borderRadius: 0,
                                    borderRight: tabSegmentBorder
                                }}
                            >
                                <Icons.starknetLogo className="easyleap-size-6" />
                            </button>
                            <button
                                type="button"
                                aria-label="Ethereum"
                                onClick={() => setChainFilter("ethereum")}
                                className="easyleap-flex easyleap-min-h-[40px] easyleap-min-w-[56px] easyleap-items-center easyleap-justify-center easyleap-shrink-0"
                                style={{
                                    ...tabBtn(chainFilter === "ethereum"),
                                    padding: "8px",
                                    borderTopLeftRadius: 0,
                                    borderBottomLeftRadius: 0,
                                    borderTopRightRadius: tabRadius,
                                    borderBottomRightRadius: tabRadius
                                }}
                            >
                                <Icons.ethereumLogo className="easyleap-size-6" />
                            </button>
                        </div>
                    </div>

                    <WalletConnectPanel
                        chainFilter={chainFilter}
                        cd={cd}
                        onConnectStarknet={onConnectStarknet}
                        onConnectEVM={onConnectEVM}
                        starknetAddress={starknetAddress}
                        evmAddress={evmAddress}
                        starknetConnectorId={starknetConnectorId}
                        starknetConnectorName={starknetConnectorName}
                        evmConnectorName={connectorEVM?.name}
                        disconnectSN={disconnectSN}
                        disconnectWagmi={disconnectWagmi}
                        onDisconnectStarknet={onDisconnectStarknet}
                        onDisconnectEVM={onDisconnectEVM}
                        onDisconnectEvmSideEffects={onDisconnectEvmSideEffects}
                        getWalletIcon={getWalletIcon}
                    />

                    {(evmAddress || starknetAddress) && (
                        <DialogTrigger asChild>
                            <Button
                                className="easyleap-mt-1 easyleap-w-full easyleap-rounded-xl easyleap-py-3 easyleap-font-firaCode easyleap-font-semibold"
                                style={{
                                    backgroundColor: cd.rowHoverBackground,
                                    color: cd.rowTextColor,
                                    border: cd.rowBorder
                                }}
                            >
                                Done
                            </Button>
                        </DialogTrigger>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
