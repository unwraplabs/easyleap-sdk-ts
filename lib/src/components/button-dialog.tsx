import {
    useAccount as useAccountSn,
    useConnect as useConnectSN,
    useDisconnect as useDisconnectSN
} from "@starknet-react/core";
import { Loader2, MailIcon, X } from "lucide-react";
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
import { usePrivyContext } from "@lib/contexts/PrivyContext";

type ChainFilter = "all" | "starknet" | "ethereum";

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
    const { user, connectPrivy, disconnectPrivy, isLoadingWallet } =
        usePrivyContext();

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

    const showSn = chainFilter === "all" || chainFilter === "starknet";
    const showEvm = chainFilter === "all" || chainFilter === "ethereum";

    const walletLabel = (name: string) =>
        name.toLowerCase().includes("wallet") ? name : `${name} wallet`;

    const panelRowBase: React.CSSProperties = {
        border: cd.rowBorder,
        color: cd.rowTextColor,
        backgroundColor: "transparent"
    };

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
            className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-text-xs easyleap-px-[15px] easyleap-py-[5px] my-button"
            style={panelRowBase}
        >
            {label}
            <span className="easyleap-rounded-full easyleap-border easyleap-border-[#DBDBDB] easyleap-p-1">
                {icon}
            </span>
        </button>
    );

    return (
        <div className="easyleap-flex easyleap-flex-col easyleap-gap-4">
            {showSn && (
                <div className="easyleap-mt-1 easyleap-w-full">
                    <h5 className="easyleap-text-xs easyleap-font-semibold easyleap-text-[#8E8E8E] easyleap-mb-2">
                        Starknet Wallet
                    </h5>

                    {!starknetAddress ? (
                        <div className="easyleap-space-y-2.5">
                            <button
                                type="button"
                                onClick={async () => {
                                    await connectPrivy();
                                    onConnectStarknet?.();
                                }}
                                disabled={isLoadingWallet}
                                className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-px-[15px] easyleap-py-[5px] my-button"
                                style={panelRowBase}
                            >
                                {isLoadingWallet
                                    ? "Setting up wallet..."
                                    : "Email and Social"}
                                <span
                                    className={cn(
                                        "easyleap-rounded-full easyleap-border-2 easyleap-border-[#F4F4F4] easyleap-bg-transparent",
                                        "easyleap-p-1.5"
                                    )}
                                >
                                    {isLoadingWallet ? (
                                        <Loader2 className="easyleap-size-5 easyleap-animate-spin" />
                                    ) : (
                                        <MailIcon className="easyleap-size-5" />
                                    )}
                                </span>
                            </button>

                            {uniqueSn.map((connector) => (
                                <ConnectRow
                                    key={connector.id}
                                    label={walletLabel(connector.name)}
                                    icon={getWalletIcon(connector.id)}
                                    onClick={async () => {
                                        if (user) {
                                            await disconnectPrivy();
                                        }
                                        connectSN({ connector });
                                        onConnectStarknet?.();
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="easyleap-flex easyleap-flex-col easyleap-items-start easyleap-gap-2">
                            <p className="easyleap-text-xs easyleap-font-medium easyleap-text-[#8E8E8E]">
                                Connected to{" "}
                                {user
                                    ? "Email and Social"
                                    : starknetConnectorName ??
                                      starknetConnectorId ??
                                      "Starknet"}
                            </p>

                            <Button className="easyleap-flex easyleap-w-[98.2%] easyleap-items-center easyleap-font-firaCode easyleap-font-semibold easyleap-w-full easyleap-justify-between [&_svg]:easyleap-pointer-events-auto my-active-button">
                                <div className="easyleap-flex easyleap-items-center easyleap-justify-start easyleap-gap-3">
                                    <span
                                        className={cn(
                                            "easyleap-rounded-full easyleap-p-1",
                                            {
                                                "easyleap-p-0":
                                                    starknetConnectorId ===
                                                        "argentX" && !user
                                            }
                                        )}
                                    >
                                        {user ? (
                                            <MailIcon className="easyleap-size-5" />
                                        ) : (
                                            getWalletIcon(
                                                starknetConnectorId ?? "braavos"
                                            )
                                        )}
                                    </span>
                                    {shortAddress(starknetAddress, 8, 8)}
                                </div>

                                <X
                                    className="easyleap-size-4 inner-theme-text"
                                    onClick={async () => {
                                        if (user) {
                                            await disconnectPrivy();
                                        } else {
                                            disconnectSN();
                                        }
                                        onDisconnectStarknet?.();
                                    }}
                                />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {showEvm && (
                <div className="easyleap-mt-1 easyleap-w-full">
                    <h5 className="easyleap-text-xs easyleap-font-semibold easyleap-text-[#8E8E8E] easyleap-mb-2">
                        EVM Wallet
                    </h5>

                    {!evmAddress ? (
                        <div className="easyleap-space-y-2.5">
                            {uniqueEvm.map((connector) => (
                                <ConnectRow
                                    key={connector.name}
                                    label={walletLabel(connector.name)}
                                    icon={getWalletIcon(
                                        connector.name.toLowerCase()
                                    )}
                                    onClick={() => {
                                        connectEVM({ connector });
                                        onConnectEVM?.();
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div
                            className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-rounded-xl easyleap-px-3 easyleap-py-3"
                            style={{
                                ...panelRowBase,
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
                                        {walletLabel(
                                            String(evmConnectorName ?? "EVM")
                                        )}
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
                    )}
                </div>
            )}

            {showSn && uniqueSn.length === 0 && !starknetAddress && (
                <p
                    className="easyleap-py-2 easyleap-text-center easyleap-text-sm"
                    style={{ color: cd.mutedTextColor }}
                >
                    No Starknet wallets available.
                </p>
            )}
            {showEvm && uniqueEvm.length === 0 && !evmAddress && (
                <p
                    className="easyleap-py-2 easyleap-text-center easyleap-text-sm"
                    style={{ color: cd.mutedTextColor }}
                >
                    No EVM wallets available.
                </p>
            )}
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
                        className="easyleap-flex easyleap-w-full easyleap-flex-col easyleap-gap-3 easyleap-overflow-hidden easyleap-rounded-[10px]"
                        style={{
                            borderRadius: tabRadius,
                            boxShadow: `inset 0 0 0 1px ${cd.accent ?? "#B4A7D6"}`
                        }}
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
