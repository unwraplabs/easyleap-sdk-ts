import {
    useAccount as useAccountSn,
    useDisconnect as useDisconnectSN
} from "@starknetfoundation/starknet-start-react";
import { MailIcon } from "lucide-react";
import React from "react";
import { useDisconnect as useDisconnectWagmi } from "wagmi";
import { getAccount } from "@wagmi/core";

import { Icons } from "@lib/components/Icons";
import { Button } from "@lib/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@lib/components/ui/dialog";
import { InteractionMode, useSharedState } from "@lib/contexts/SharedState";
import { useTheme } from "@lib/contexts/ThemeContext";
import { useAccount, evmConfig } from "@lib/hooks/useAccount";
import { useMode } from "@lib/hooks/useMode";
import { cn, shortAddress } from "@lib/utils";
import { toast } from "@lib/hooks/use-toast";

import { ModeSwitcher, type ConnectButtonProps } from ".";
import { ConnectDrawer } from "@lib/components/connect-drawer";
import { getWalletId } from "@lib/utils/wallet-list";
import { usePrivyContext } from "@lib/contexts/PrivyContext";

/**
 * Every ConnectButton shares one open flag, so without this each would mount its own drawer and
 * they'd stack (and each run its own connect). The button that was clicked owns the drawer; when
 * it's opened from code, the first mounted button does.
 */
const dialogOwners = {
    mounted: [] as string[],
    clicked: null as string | null,
    listeners: new Set<() => void>()
};
const notifyOwners = () => dialogOwners.listeners.forEach((l) => l());
const currentOwner = () =>
    dialogOwners.clicked && dialogOwners.mounted.includes(dialogOwners.clicked)
        ? dialogOwners.clicked
        : (dialogOwners.mounted[0] ?? null);

function useConnectDialogOwner() {
    const id = React.useId();
    React.useEffect(() => {
        dialogOwners.mounted.push(id);
        notifyOwners();
        return () => {
            dialogOwners.mounted = dialogOwners.mounted.filter((m) => m !== id);
            notifyOwners();
        };
    }, [id]);
    const isOwner = React.useSyncExternalStore(
        (listener) => {
            dialogOwners.listeners.add(listener);
            return () => dialogOwners.listeners.delete(listener);
        },
        () => currentOwner() === id,
        () => false
    );
    const claim = React.useCallback(() => {
        dialogOwners.clicked = id;
        notifyOwners();
    }, [id]);
    return { isOwner, claim };
}

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
    const { isOwner, claim } = useConnectDialogOwner();
    const { evmAddress, starknetAddress } = useAccount();

    const { disconnect: disconnectSN } = useDisconnectSN();
    const { disconnect: disconnectWagmi } = useDisconnectWagmi();

    const { connector: connectedSnConnector } = useAccountSn();
    const { connector: connectorEVM } = getAccount(evmConfig);

    const theme = useTheme();
    const cd = theme.connectDialog!;
    const { user, privyWallet } = usePrivyContext();
    const enableEvmMode = sharedState.ui.enableEvmMode;
    const isPrivyConnected = React.useMemo(() => {
        return !!user || !!privyWallet?.address;
    }, [user, privyWallet?.address]);

    const walletIconMap: Record<
        string,
        { Icon: React.ElementType; size?: string }
    > = {
        braavos: { Icon: Icons.braavos, size: "easyleap-size-8" },
        braavosmobile: { Icon: Icons.braavos, size: "easyleap-size-7" },
        argentx: { Icon: Icons.argentX, size: "easyleap-size-9" },
        argentwebwallet: { Icon: Icons.wallet, size: "easyleap-size-7" },
        keplr: { Icon: Icons.keplr, size: "easyleap-size-8" },
        argentmobile: { Icon: Icons.argentMobile, size: "easyleap-size-8" },
        metamask: { Icon: Icons.metamask, size: "easyleap-size-8" },
        "coinbase wallet": { Icon: Icons.coinbase, size: "easyleap-size-7" },
        subwallet: { Icon: Icons.subwallet, size: "easyleap-size-7" },
        trust: { Icon: Icons.trust, size: "easyleap-size-8" },
        rainbow: { Icon: Icons.rainbow, size: "easyleap-size-7" },
        phantom: { Icon: Icons.phantom, size: "easyleap-size-7" },
        walletconnect: { Icon: Icons.wallet, size: "easyleap-size-7" },
        fordefi: { Icon: Icons.fordefi, size: "easyleap-size-6" },
        okxwallet: { Icon: Icons.okxwallet, size: "easyleap-size-7" },
        xverse: { Icon: Icons.xverse, size: "easyleap-size-5" },
        // Cartridge Controller connector IDs vary by implementation; cover common cases.
        cartridge: { Icon: Icons.cartridge, size: "easyleap-size-7" },
        controller: { Icon: Icons.cartridge, size: "easyleap-size-7" },
        "cartridge controller": { Icon: Icons.cartridge, size: "easyleap-size-7" },
        starknet: { Icon: Icons.wallet, size: "easyleap-size-7" },
        "argent web wallet": { Icon: Icons.wallet, size: "easyleap-size-7" }
    };

    // Falls back to the icon the wallet injects itself (data URI), then to a generic icon
    const getWalletIcon = (walletId: string, iconUrl?: string) => {
        const key = walletId.toLowerCase();
        const wallet = walletIconMap[key];
        const padding = key === "argentx" ? "easyleap-p-0.5" : "easyleap-p-1";

        if (wallet) {
            return (
                <wallet.Icon
                    key={walletId}
                    className={cn(wallet.size || "easyleap-size-7", padding)}
                />
            );
        }

        if (iconUrl) {
            return (
                <img
                    key={walletId}
                    src={iconUrl}
                    alt={walletId}
                    className="easyleap-size-7 easyleap-p-1 easyleap-object-contain"
                />
            );
        }

        return <Icons.wallet className="easyleap-size-7 easyleap-p-1" />;
    };

    // For the drawer's wallet tiles: no generic icon, so a wallet without one shows its initial
    const renderWalletIcon = (walletId: string, iconUrl?: string) =>
        walletIconMap[walletId.toLowerCase()] || iconUrl
            ? getWalletIcon(walletId, iconUrl)
            : null;

    const starknetConnectorId = connectedSnConnector
        ? getWalletId(connectedSnConnector)
        : undefined;
    const starknetConnectorName = connectedSnConnector?.name;
    const starknetConnectorIcon = connectedSnConnector?.icon;

    const copyToClipboard = async (
        e: React.MouseEvent,
        fullAddress: string
    ) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(fullAddress);
            toast({ description: "Address copied" });
        } catch {
            toast({ description: "Failed to copy address", variant: "destructive" });
        }
    };

    return (
        <div
            // TODO:  Dont need and outer div classing as of now, will look again if needed in future
            //
            // className={cn(
            //     "easyleap-w-full easyleap-z-10 easyleap-flex easyleap-items-center easyleap-gap-4 md:easyleap-flex-row easyleap-rounded-[50px]",
            //     {
            //         "easyleap-bg-white easyleap-px-2 easyleap-pt-1 easyleap-pb-1":
            //             evmAddress || starknetAddress
            //     }
            // )}
            // style={{
            //     backgroundColor:
            //         evmAddress || starknetAddress
            //             ? mode === InteractionMode.EVM
            //                 ? theme?.evmMode?.mainBgColor
            //                 : theme?.starknetMode?.mainBgColor
            //             : undefined
            // }}
        >
            <Dialog
                open={isOwner && sharedState.connectWalletModalOpen}
                onOpenChange={(open) => sharedState.setConnectWalletModalOpen(open)}
            >
                <div className="easyleap-w-full easyleap-flex md:easyleap-flex-row gap-2">
                    <DialogTrigger asChild>
                        <div
                            onClickCapture={claim}
                            className="easyleap-w-full easyleap-items-center easyleap-flex"
                            style={
                                cd.fontFamily
                                    ? { fontFamily: cd.fontFamily }
                                    : undefined
                            }
                        >
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
                                        "easyleap-text-center easyleap-w-[150px] md:easyleap-w-[172px] easyleap-text-white !easyleap-font-bold !easyleap-h-[40px] !easyleap-max-h-[40px]",
                                        className
                                    )}
                                >
                                    Connect Wallet
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
                                            "easyleap-mx-auto easyleap-flex easyleap-w-[150px] md:easyleap-w-[172px] easyleap-items-center easyleap-justify-start easyleap-gap-3 !easyleap-font-bold hover:easyleap-bg-transparent easyleap-rounded-[60px] !easyleap-px-6 !easyleap-py-5 !easyleap-h-[40px] !easyleap-max-h-[40px]",
                                            className
                                        )}
                                    >
                                        <span className="easyleap-rounded-full easyleap-size-7 easyleap-flex easyleap-items-center easyleap-justify-center easyleap-bg-[#fff] easyleap-p-1 easyleap--ml-[15px]">
                                            {isPrivyConnected ? (
                                                <MailIcon className="!easyleap-size-5" />
                                            ) : (
                                                getWalletIcon(
                                                    connectedSnConnector
                                                        ? getWalletId(connectedSnConnector)
                                                        : "braavos",
                                                    starknetConnectorIcon
                                                )
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
                                    <button
                                        type="button"
                                        className="easyleap-cursor-pointer"
                                        title="Copy address"
                                        onClick={(e) =>
                                            copyToClipboard(e, evmAddress)
                                        }
                                    >
                                        {shortAddress(evmAddress, 4, 4)}
                                    </button>
                                </Button>
                            )}

                            {/* // TODO: this technically will not happen -> but keeping in case of fallback */}
                            {mode === InteractionMode.None && evmAddress && !starknetAddress && (
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
                        </div>
                    </DialogTrigger>

                    {enableEvmMode && <ModeSwitcher />}
                </div>

                <DialogContent
                    variant="drawer"
                    hideClose
                    overlayStyle={
                        cd.overlayBackground
                            ? { backgroundColor: cd.overlayBackground }
                            : undefined
                    }
                    style={{
                        backgroundColor: cd.modalBackground,
                        borderLeft: cd.modalBorder,
                        boxShadow: "-30px 0 80px -30px rgba(0,0,0,0.45)",
                        ...style?.modalStyles
                    }}
                >
                    <ConnectDrawer
                        onClose={() => sharedState.setConnectWalletModalOpen(false)}
                        onConnectStarknet={onConnectStarknet}
                        onConnectEVM={onConnectEVM}
                        onDisconnectStarknet={onDisconnectStarknet}
                        onDisconnectEVM={onDisconnectEVM}
                        starknetAddress={starknetAddress}
                        evmAddress={evmAddress}
                        starknetConnectorId={starknetConnectorId}
                        starknetConnectorName={starknetConnectorName}
                        starknetConnectorIcon={starknetConnectorIcon}
                        evmConnectorName={connectorEVM?.name}
                        disconnectSN={disconnectSN}
                        disconnectWagmi={disconnectWagmi}
                        renderWalletIcon={renderWalletIcon}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};
