import {
  useConnect as useConnectSN,
  useDisconnect as useDisconnectSN
} from "@starknet-react/core";
import { format } from "date-fns";
import { Loader2, MailIcon, X } from "lucide-react";
import React from "react";
import {
  useConnect as useConnectWagmi,
  useDisconnect as useDisconnectWagmi
} from "wagmi";
import { getAccount } from "@wagmi/core";

import { Icons } from "@lib/components/Icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@lib/components/ui/accordion";
import { Button } from "@lib/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@lib/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@lib/components/ui/popover";
import { ScrollArea } from "@lib/components/ui/scroll-area";
import { InteractionMode, useSharedState } from "@lib/contexts/SharedState";
import { useTheme } from "@lib/contexts/ThemeContext";
import { toast, useToast } from "@lib/hooks/use-toast";
import { useAccount, evmConfig } from "@lib/hooks/useAccount";
import { useMode } from "@lib/hooks/useMode";
import { cn, EASYLEAP_EXPLORER, shortAddress, standariseAddress } from "@lib/utils";

import { ModeSwitcher, type ConnectButtonProps } from ".";
import { useSupportedTokens } from "@lib/hooks/useSupportedTokens";
import ProgressBar from "./ui/progress-bar";
import { usePrivyContext } from "@lib/contexts/PrivyContext";

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
  const { addressSource, addressDestination } = useAccount();

  const { disconnect: disconnectSN } = useDisconnectSN();
  const { disconnect: disconnectWagmi } = useDisconnectWagmi();

  const { dismiss } = useToast();

  const { connector } = useConnectSN();
  const { connector: connectorEVM } = getAccount(evmConfig);
  const { user, disconnectPrivy } = usePrivyContext();

  const theme = useTheme();

  const supportedTokens = useSupportedTokens();
  
  function getTokenInfo(l2Addr: string) {
    const tokenInfo = supportedTokens.find((token) => standariseAddress(token.l2_token_address) == standariseAddress(l2Addr));
    return tokenInfo?.symbol || "Unknown";
  }

  const walletIconMap: Record<
    string,
    { Icon: React.ElementType; size?: string }
  > = {
    // Starknet wallets
    braavos: { Icon: Icons.braavos, size: "easyleap-size-5" },
    argentX: { Icon: Icons.argentX, size: "easyleap-size-15" },
    argentWebWallet: { Icon: MailIcon, size: "easyleap-size-5" },
    keplr: { Icon: Icons.keplr, size: "easyleap-size-5" },
    "argent-mobile": { Icon: Icons.argentMobile, size: "easyleap-size-5" },

    // EVM wallets
    metamask: { Icon: Icons.metamask, size: "easyleap-size-5" },
    "coinbase wallet": { Icon: Icons.coinbase, size: "easyleap-size-5" },
    subwallet: { Icon: Icons.subwallet, size: "easyleap-size-5" },
    trust: { Icon: Icons.trust, size: "easyleap-size-5" },
    rainbow: { Icon: Icons.rainbow, size: "easyleap-size-5" },
    phantom: { Icon: Icons.phantom, size: "easyleap-size-5" },
    walletconnect: { Icon: Icons.wallet, size: "easyleap-size-5" }
  };

  const getWalletIcon = (walletId: string) => {
    const wallet = walletIconMap[walletId];

    return wallet ? (
      <wallet.Icon
        key={walletId}
        className={wallet.size || "easyleap-size-5"}
      />
    ) : null;
  };

  function EVMWalletOptions() {
    const { connectors, connect } = useConnectWagmi();

    const uniqueConnectors = connectors.filter(
      (connector, index, self) =>
        index === self.findIndex((c) => c.name === connector.name)
    );

    return (
      <div className="easyleap-space-y-2">
        {uniqueConnectors.map((connector) => (
          <button
            onClick={() => {
              if (!addressDestination)
                return toast({
                  title: "Connect Starknet wallet first",
                  duration: 3000
                });
              connect({ connector });
              onConnectEVM?.();
            }}
            className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-text-xs easyleap-px-[15px] easyleap-py-[5px] my-button"
          >
            {connector.name}
            <span className="easyleap-rounded-full easyleap-border easyleap-border-[#DBDBDB] easyleap-p-1">
              {getWalletIcon(connector.name.toLowerCase())}
            </span>
          </button>
        ))}
      </div>
    );
  }

  function SNWalletOptions() {
    const { connectors, connect } = useConnectSN();
    const { disconnectAsync } = useDisconnectSN();
    const { connectPrivy, user, disconnectPrivy, isLoadingWallet } = usePrivyContext();

    const uniqueConnectors = connectors.filter(
      (connector, index, self) =>
        index === self.findIndex((c) => c.name === connector.name)
    );

    const handlePrivyConnect = async () => {
      // Disconnect any existing Starknet wallet first
      try {
        await disconnectAsync();
      } catch (e) {
        // Ignore if not connected
      }
      await connectPrivy();
      onConnectStarknet?.();
    };

    return (
      <div className="easyleap-space-y-2.5">
        {/* Email and Social Button */}
        <button
          onClick={handlePrivyConnect}
          disabled={isLoadingWallet}
          className={"easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-px-[15px] easyleap-py-[5px] my-button"}
        >
          {isLoadingWallet ? "Setting up wallet..." : "Email and Social"}
          <div
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
          </div>
        </button>

        {/* Existing connectors */}
        {uniqueConnectors.map((connector) => (
          <button
            key={connector.id}
            onClick={async () => {
              // Disconnect Privy if connected
              if (user) {
                await disconnectPrivy();
              }
              connect({ connector });
              onConnectStarknet?.();
            }}
            className={"easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-px-[15px] easyleap-py-[5px] my-button"}
          >
            {connector.name}
            <div
              className={cn(
                "easyleap-rounded-full easyleap-border-2 easyleap-border-[#F4F4F4] easyleap-bg-transparent",
                "easyleap-p-1.5"
              )}
            >
              {getWalletIcon(connector.id)}
            </div>
          </button>
        ))}
      </div>
    );
  }

  const getDestinationTxn = (srcTxn: any) => {
    const txn = sharedState.destinationTransactions.find(
      (destTxn: any) => destTxn.request_id === srcTxn.request_id
    );

    if (!txn) {
      return {
        status: "pending"
      };
    }

    return txn as any;
  };

  const getPendingTxnCount = () => {
    const requestIdsSet = new Set(
      sharedState.destinationTransactions.map((item) => item.request_id)
    );
    const pendingTxns = sharedState.sourceTransactions.filter(
      (item) => !requestIdsSet.has(item.request_id)
    );

    return pendingTxns.length;
  };

  React.useEffect(() => {
    if (addressSource && addressDestination) {
      toast({
        title: "Wallets Connected!",
        description:
          "Starknet and EVM wallets are linked. move L1 funds to this dApp.",
          duration: 3000
      });
    }

    if (addressSource && !addressDestination) {
      disconnectWagmi();
      onDisconnectEVM?.();
    }

    if (mode === InteractionMode.Bridge) {
      dismiss();
      toast({
        title: "Bridge mode is enabled",
        duration: 3000
      });
    } else {
      dismiss();
    }
  }, [addressSource, addressDestination, mode]);

  return (
    <div
      className={cn(
        "easyleap-w-full easyleap-z-10 easyleap-flex easyleap-items-center easyleap-gap-4 md:easyleap-flex-row easyleap-rounded-[50px]",
        {
          "easyleap-bg-white easyleap-px-2 easyleap-pt-1 easyleap-pb-1":
            addressSource || addressDestination
        }
      )}
      style={{
        backgroundColor:
          addressSource || addressDestination
            ? mode === InteractionMode.Starknet
              ? theme?.starknetMode?.mainBgColor
              : theme?.bridgeMode?.mainBgColor
            : undefined
      }}
    >
      <Dialog
        open={sharedState.connectWalletModalOpen}
        onOpenChange={sharedState.setConnectWalletModalOpen}
      >
        <div className="easyleap-w-full easyleap-flex md:easyleap-flex-row gap-2">
          <DialogTrigger asChild>
            <div className="easyleap-w-full easyleap-font-firaCode easylea-items-center easyleap-flex">
              {!addressSource && !addressDestination && (
                <Button
                  variant="outline"
                  style={{
                    color: style?.buttonStyles?.color || theme?.noneMode?.color,
                    backgroundColor:
                      style?.buttonStyles?.backgroundColor ||
                      theme?.noneMode?.backgroundColor,
                    border:
                      style?.buttonStyles?.border || theme?.noneMode?.border,
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

              {mode == InteractionMode.Starknet && (
                <Button
                  style={{
                    color: theme?.starknetMode?.button?.color,
                    backgroundColor:
                      theme?.starknetMode?.button?.backgroundColor,
                    border: theme?.starknetMode?.button?.border,
                    borderRadius: theme?.starknetMode?.button?.borderRadius
                  }}
                  className={cn(
                    "easyleap-mx-auto easyleap-flex easyleap-w-fit easyleap-items-center easyleap-justify-start easyleap-gap-3 easyleap-font-medium hover:easyleap-bg-transparent easyleap-rounded-[50px]",
                    className
                  )}
                >
                  <span className="easyleap-rounded-full easyleap-bg-[#fff] easyleap-p-1 easyleap--ml-[15px]">
                    {getWalletIcon(connector?.id ?? "braavos")}
                  </span>
                  {shortAddress(addressDestination || "", 4, 4)}
                </Button>
              )}

              {mode == InteractionMode.Bridge && (
                <div
                  className={cn(
                    "easyleap-mx-auto easyleap-px-1 easyleap-flex easyleap-cursor-pointer easyleap-items-center easyleap-justify-center easyleap--space-x-[3rem]",
                    className
                  )}
                >
                  <Button
                    style={{
                      color: theme?.bridgeMode?.evmButton?.color,
                      backgroundColor:
                        theme?.bridgeMode?.evmButton?.backgroundColor,
                      border: theme?.bridgeMode?.evmButton?.border,
                      borderRadius: theme?.bridgeMode?.evmButton?.borderRadius
                    }}
                    className="easyleap-z-20 easyleap-flex easyleap-scale-105 easyleap-items-center easyleap-justify-start easyleap-gap-3 easyleap-rounded-[50px] hover:easyleap-bg-[#1B182B] easyleap-text-white easyleap-border-[1.5px] easyleap-border-[#DBDBDB]/60"
                  >
                    <span className="easyleap-rounded-full easyleap-bg-white easyleap-p-1 easyleap--ml-[15px]">
                      {getWalletIcon(
                        connectorEVM?.name.toLocaleLowerCase() ?? "metamask"
                      )}
                    </span>
                    {shortAddress(addressSource, 4, 4)}
                  </Button>

                  <Button
                    style={{
                      color: theme?.bridgeMode?.starknetButton?.color,
                      backgroundColor:
                        theme?.bridgeMode?.starknetButton?.backgroundColor,
                      border: theme?.bridgeMode?.starknetButton?.border,
                      borderRadius:
                        theme?.bridgeMode?.starknetButton?.borderRadius
                    }}
                    className={cn(
                      "easyleap-z-0 easyleap-flex easyleap-w-fit easyleap-items-center easyleap-justify-start easyleap-gap-3 easyleap-rounded-[50px] easyleap-font-semibold hover:easyleap-bg-[#35314F] easyleap-text-white",
                      className
                    )}
                  >
                    {shortAddress(addressDestination, 4, 4)}
                    <span className="easyleap-rounded-full easyleap-bg-[#fff] easyleap-p-1 easyleap--mr-[13px]">
                      {getWalletIcon(connector?.id ?? "braavos")}
                    </span>
                  </Button>
                </div>
              )}
            </div>
          </DialogTrigger>

          <ModeSwitcher />

          {(addressDestination || addressDestination) && (
            <Popover
              open={sharedState.isTxnPopoverOpen}
              onOpenChange={sharedState.setIsTxnPopoverOpen}
            >
              <PopoverTrigger className="easyleap-relative">
                <>
                  {getPendingTxnCount() > 0 && (
                    <div className="easyleap-absolute easyleap--right-0 easyleap--top-1.5 easyleap-flex easyleap-size-4 easyleap-items-center easyleap-justify-center easyleap-rounded-full easyleap-bg-red-500 easyleap-p-1 easyleap-text-[9px] easyleap-font-semibold easyleap-text-white">
                      {getPendingTxnCount()}
                    </div>
                  )}

                  {!sharedState.isSuccessEVM && (
                    <div
                      style={{
                        backgroundColor:
                          mode === InteractionMode.Starknet
                            ? theme?.starknetMode?.historyButton?.backgroundColor
                            : theme?.bridgeMode?.historyButton?.backgroundColor
                      }}
                      className="easyleap-rounded-full easyleap-p-2"
                    >
                      <Icons.historyIcon className="easyleap-shrink-0" />
                    </div>
                  )}

                  {sharedState.isSuccessEVM &&
                    getDestinationTxn(sharedState.sourceTransactions[0]).status !==
                      "pending" &&
                    getDestinationTxn(sharedState.sourceTransactions[0]).status !==
                      "confirmed" && (
                      <div
                        className={cn("easyleap-rounded-full", {
                          "easyleap-animate-pulse easyleap-bg-green-500 easyleap-p-2":
                            sharedState.isSuccessEVM
                        })}
                      >
                        <div className="easyleap-rounded-full easyleap-bg-[#35314F] easyleap-p-2">
                          <Icons.historyIcon className="easyleap-shrink-0" />
                        </div>
                      </div>
                    )}

                  {sharedState.isSuccessEVM &&
                    getDestinationTxn(sharedState.sourceTransactions[0]).status ===
                      "pending" && (
                      <div className="easyleap-rounded-full easyleap-bg-[#35314F] easyleap-p-2">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8.25 21.6399C6.25 20.8399 4.49999 19.3899 3.33999 17.3799C2.19999 15.4099 1.81999 13.2199 2.08999 11.1299"
                            stroke="#1C182B"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M5.8501 4.47986C7.5501 3.14986 9.68009 2.35986 12.0001 2.35986C14.2701 2.35986 16.3601 3.12985 18.0401 4.40985"
                            stroke="#B9AFF1"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M15.75 21.6399C17.75 20.8399 19.5 19.3899 20.66 17.3799C21.8 15.4099 22.18 13.2199 21.91 11.1299"
                            stroke="#1C182B"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M8.25 21.6399C6.25 20.8399 4.49999 19.3899 3.33999 17.3799C2.19999 15.4099 1.81999 13.2199 2.08999 11.1299"
                            stroke="#1C182B"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M5.8501 4.47986C7.5501 3.14986 9.68009 2.35986 12.0001 2.35986C14.2701 2.35986 16.3601 3.12985 18.0401 4.40985"
                            stroke="#38EF7D"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M15.75 21.6399C17.75 20.8399 19.5 19.3899 20.66 17.3799C21.8 15.4099 22.18 13.2199 21.91 11.1299"
                            stroke="#38EF7D"
                            stroke-opacity="0.5"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 17C14.75 17 17 14.75 17 12C17 9.25 14.75 7 12 7C9.25 7 7 9.25 7 12C7 14.75 9.25 17 12 17Z"
                            stroke="#1C182B"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M9.875 12L11.29 13.415L14.125 10.585"
                            stroke="#1C182B"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}

                  {sharedState.isSuccessEVM &&
                    getDestinationTxn(sharedState.sourceTransactions[0]).status ===
                      "confirmed" && (
                      <div className="easyleap-rounded-full easyleap-bg-[#35314F] easyleap-p-2">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8.25 21.6399C6.25 20.8399 4.49999 19.3899 3.33999 17.3799C2.19999 15.4099 1.81999 13.2199 2.08999 11.1299"
                            stroke="#38EF7D"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M5.84961 4.47986C7.54961 3.14986 9.6796 2.35986 11.9996 2.35986C14.2696 2.35986 16.3596 3.12985 18.0396 4.40985"
                            stroke="#38EF7D"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M15.75 21.6399C17.75 20.8399 19.5 19.3899 20.66 17.3799C21.8 15.4099 22.18 13.2199 21.91 11.1299"
                            stroke="#38EF7D"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 17C14.75 17 17 14.75 17 12C17 9.25 14.75 7 12 7C9.25 7 7 9.25 7 12C7 14.75 9.25 17 12 17Z"
                            stroke="#38EF7D"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M9.875 12L11.29 13.415L14.125 10.585"
                            stroke="#38EF7D"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                </>
              </PopoverTrigger>
              <PopoverContent className="easyleap-mr-[5.37rem] easyleap-mt-4 easyleap-w-[484px] easyleap-max-w-[100vw] easyleap-border easyleap-border-[#675E99] easyleap-bg-white easyleap-px-8 easyleap-py-6 easyleap-font-dmSans">
                <h4 className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-text-lg easyleap-font-bold easyleap-text-black">
                  Bridge transaction history
                  <Icons.crossIcon
                    className="easyleap-cursor-pointer"
                    onClick={() => sharedState.setIsTxnPopoverOpen(false)}
                  />
                </h4>

                <ScrollArea className="easyleap-mt-5 easyleap-h-[40vh]">
                  <Accordion type="single" collapsible>
                    {sharedState.sourceTransactions.map((txn: any, i: any) => (
                      <div className="easyleap-w-full easyleap-bg-[#E6E6E6] easyleap-rounded-xl">
                        {getDestinationTxn(txn)?.status === "pending" && <div className="easyleap-w-full">
                          <ProgressBar fromTime={new Date(txn?.timestamp * 1000).getTime()}
                              toTime={new Date(txn?.timestamp * 1000).getTime() + 3 * 60 * 1000} // 3 minutes later
                              isCompleted={!(getDestinationTxn(txn)?.status === "pending")}
                          />
                        </div>}
                        <AccordionItem
                          key={i}
                          value={`txn-${i + 1}`}
                          className="easyleap-mb-2 easyleap-rounded-xl easyleap-border-0 easyleap-px-4 easyleap-py-2 easyleap-text-[#B9AFF1]"
                        >
                          <AccordionTrigger
                            className="easyleap-w-full easyleap-items-start easyleap-px-2.5 easyleap-py-1 hover:easyleap-no-underline"
                            customChevron={
                              <Icons.chevronIcon className="easyleap-size-5" />
                            }
                          >
                            <div className="easyleap-flex easyleap-w-full easyleap-flex-col easyleap-items-center easyleap-gap-6">
                              <div className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-gap-8">
                                <div className="easyleap-flex easyleap-flex-col easyleap-items-start easyleap-gap-0.5">
                                  <p className="easyleap-flex easyleap-items-center easyleap-gap-1 easyleap-text-base easyleap-text-black">
                                    <Icons.ethereumLogo className="easyleap-size-5 easyleap-shrink-0" />
                                    Ethereum
                                  </p>
                                  <span className="easyleap-text-xs easyleap-text-black/60">
                                    Sepolia
                                  </span>
                                </div>

                                <Icons.arrowRight className="!easyleap-rotate-0" />

                                <div className="easyleap-flex easyleap-flex-col easyleap-items-start easyleap-gap-0.5">
                                  <p className="easyleap-flex easyleap-items-center easyleap-gap-1 easyleap-text-base easyleap-text-black">
                                    <Icons.starknetLogo className="easyleap-size-5 easyleap-shrink-0" />
                                    Starknet
                                  </p>
                                  <span className="easyleap-text-xs easyleap-text-black/60">
                                    Sepolia
                                  </span>
                                </div>
                              </div>

                              <div className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-text-xs easyleap-text-black/60">
                                {format(
                                  new Date(txn?.timestamp * 1000),
                                  "dd MMM, yyyy h:mm a"
                                )}

                                <div className="easyleap--mr-5 easyleap-flex easyleap-items-center easyleap-gap-2 easyleap-flex-wrap">
                                  <div>#{txn.request_id}</div>
                                  {getDestinationTxn(txn)?.status === "pending" && <div className="font-bold easyleap-text-nowrap easyleap-rounded-full easyleap-bg-[white] easyleap-p-1 easyleap-px-2 easyleap-text-[10px] easyleap-text-black/60">
                                    Pending
                                  </div>}
                                  {getDestinationTxn(txn)?.status === "confirmed" && <div className="font-bold easyleap-text-nowrap easyleap-rounded-full easyleap-bg-[#38EF7D80] easyleap-p-1 easyleap-px-2 easyleap-text-[10px] easyleap-text-[#000]">
                                    Success
                                  </div>}
                                  {getDestinationTxn(txn)?.status === "failed" && <div className="font-bold easyleap-text-nowrap easyleap-rounded-full easyleap-bg-[#ef383880] easyleap-p-1 easyleap-px-2 easyleap-text-[10px] easyleap-text-[#000]">
                                    Refunded
                                  </div>}
                                  <a
                                    href={EASYLEAP_EXPLORER}
                                    target="_blank"
                                    className="easyleap-rounded-3xl easyleap-bg-[#35314F] easyleap-p-1"
                                  >
                                    <Icons.externalLinkIcon className="easyleap-size-4" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="easyleap-mx-5 easyleap-mt-4 easyleap-border-t easyleap-border-[#675E9933]">
                            <div className="easyleap-mt-5 easyleap-flex easyleap-items-center easyleap-justify-start easyleap-gap-3">
                              <div className="easyleap-flex easyleap-flex-col easyleap-items-center easyleap-justify-center easyleap-gap-3">
                                {txn?.status === "pending" && (
                                  <Loader2 className="easyleap-size-6 easyleap-animate-spin" />
                                )}
                                {txn?.status === "confirmed" && (
                                  <Icons.checkIcon className="easyleap-size-6" />
                                )}

                                {getDestinationTxn(txn)?.status === "pending" && (
                                  <>
                                    <div className="easyleap-h-6 easyleap-w-px easyleap-rounded-full easyleap-bg-[#675E9933]" />
                                    <Loader2 className="easyleap-size-6 easyleap-animate-spin" />
                                    <div className="easyleap-h-6 easyleap-w-px easyleap-rounded-full easyleap-bg-[#675E9933]" />
                                    <Loader2 className="easyleap-size-6 easyleap-animate-spin" />
                                  </>
                                )}

                                {(getDestinationTxn(txn)?.status === "confirmed" || getDestinationTxn(txn)?.status === "failed") && (
                                  <>
                                    <div className="easyleap-h-6 easyleap-w-px easyleap-rounded-full easyleap-bg-[#675E9933]" />
                                    <Icons.checkIcon className="easyleap-size-6" />
                                    <div className="easyleap-h-6 easyleap-w-px easyleap-rounded-full easyleap-bg-[#675E9933]" />
                                    <Icons.checkIcon className="easyleap-size-6" />
                                  </>
                                )}
                              </div>

                              <div className="easyleap-flex easyleap-flex-col easyleap-items-start easyleap-gap-6">
                                <a
                                  href={`https://sepolia.etherscan.io/tx/${txn?.txHash}`}
                                  target="_blank"
                                  className="easyleap-group easyleap-flex easyleap-cursor-pointer easyleap-flex-col easyleap-items-start easyleap-gap-1"
                                >
                                  <p
                                    className={cn(
                                      "easyleap-flex easyleap-items-center easyleap-gap-2 easyleap-text-base easyleap-text-[#B9AFF1]",
                                      {
                                        "easyleap-font-bold easyleap-text-black":
                                          txn?.status === "confirmed" || txn?.status === "failed"
                                      }
                                    )}
                                  >
                                    Initiated transfer from EVM wallet{" "}
                                  </p>
                                  <span className="easyleap-text-xs easyleap-text-black/60">
                                    The deposit was submitted on Ethereum.
                                  </span>
                                </a>

                                <div className="easyleap-group easyleap-flex easyleap-flex-col easyleap-items-start easyleap-gap-1">
                                  <p
                                    className={cn(
                                      "easyleap-flex easyleap-items-center easyleap-gap-2 easyleap-text-base easyleap-text-black",
                                      {
                                        "easyleap-font-bold easyleap-text-black":
                                          getDestinationTxn(txn)?.status ===
                                          "confirmed" || getDestinationTxn(txn)?.status === "failed"
                                      }
                                    )}
                                  >
                                    Bridging to Starknet
                                  </p>
                                  <span className="easyleap-flex easyleap-items-center easyleap-gap-2 easyleap-text-xs easyleap-text-black/60">
                                    Bridged {(txn?.amount_raw / 10 ** 18).toFixed(5)} {getTokenInfo(getDestinationTxn(txn)?.token)} 
                                    <Icons.ethereumLogo className="easyleap-size-4" />
                                  </span>
                                </div>

                                <a
                                  href={`https://sepolia.voyager.online/tx/${getDestinationTxn(txn)?.txHash}`}
                                  target="_blank"
                                  className="easyleap-group easyleap-mt-2 easyleap-flex easyleap-cursor-pointer easyleap-flex-col easyleap-items-start easyleap-gap-1"
                                >
                                  <p
                                    className={cn(
                                      "easyleap-flex easyleap-items-center easyleap-gap-2 easyleap-text-base easyleap-text-black",
                                      {
                                        "easyleap-font-bold easyleap-text-black":
                                          getDestinationTxn(txn)?.status ===
                                          "confirmed" || getDestinationTxn(txn)?.status === "failed"
                                      }
                                    )}
                                  >
                                    {getDestinationTxn(txn)?.status === "failed" ? "Refunded" : "Deposited"}
                                  </p>
                                </a>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </div>
                    ))}

                    {sharedState.sourceTransactions.length === 0 && (
                      <div className="easyleap-flex easyleap-h-40 easyleap-w-full easyleap-items-center easyleap-justify-center">
                        <p className="easyleap-text-[#B9AFF1]">
                          No transactions yet
                        </p>
                      </div>
                    )}
                  </Accordion>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <DialogContent
          className="easyleap-max-h-[100vh] easyleap-bg-white easyleap-p-2 easyleap-font-dmSans md:easyleap-p-6 lg:easyleap-max-h-none"
          closeClassName="easyleap-text-[#B9AFF1]"
        >
          <DialogHeader>
            <DialogTitle className="easyleap-text-center easyleap-text-2xl easyleap-font-normal easyleap-text-[#575757]">
              Connect To
              <br />{" "}
              <span className="easyleap-font-bold easyleap-text-[#2F2F2F]">
                EVM and Starknet
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="easyleap-flex easyleap-w-full easyleap-flex-col easyleap-items-start easyleap-justify-center easyleap-gap-6">
            <div className="easyleap-mt-1 easyleap-w-full">
              {!addressDestination ? (
                <SNWalletOptions />
              ) : (
                <div className="easyleap-mt-5 easyleap-flex easyleap-flex-col easyleap-items-start easyleap-gap-2">
                  <p className="easyleap-text-xs easyleap-font-medium easyleap-text-[#8E8E8E]">
                    Connected to {user ? "Email and Social" : connector?.name}
                  </p>
                  <Button className="easyleap-flex easyleap-w-[98.2%] easyleap-items-center easyleap-font-firaCode easyleap-font-semibold easyleap-w-full easyleap-justify-between [&_svg]:easyleap-pointer-events-auto my-active-button">
                    <div className="easyleap-flex easyleap-items-center easyleap-justify-start easyleap-gap-3">
                      <span
                        className={cn("easyleap-rounded-full easyleap-p-1", {
                          "easyleap-p-0": connector?.id === "argentX" && !user
                        })}
                      >
                        {user ? (
                          <MailIcon className="easyleap-size-5" />
                        ) : (
                          getWalletIcon(connector?.id ?? "braavos")
                        )}
                      </span>
                      {shortAddress(addressDestination, 8, 8)}
                    </div>

                    <X
                      className="easyleap-size-4 inner-theme-text"
                      onClick={async () => {
                        if (user) {
                          await disconnectPrivy();
                        } else {
                          disconnectSN();
                          disconnectWagmi();
                        }
                        onDisconnectEVM?.();
                        onDisconnectStarknet?.();
                      }}
                    />
                  </Button>
                </div>
              )}
            </div>

            <div className="easyleap-mt-3 easyleap-w-full">
              <h5 className="easyleap-text-center easyleap-text-base easyleap-font-medium easyleap-text-[#2F2F2F]">
                Optional
              </h5>
              <p className="easyleap-mt-1 easyleap-text-center easyleap-text-sm easyleap-font-normal easyleap-text-[#8E8E8E] wrap-anywhere">
                Link your EVM wallet to transfer L1 tokens seamlessly into the DApp!
              </p>

              {!addressSource ? (
                <Accordion
                  type="single"
                  collapsible
                  className="easyleap-mt-5 easyleap-w-full"
                >
                  <AccordionItem
                    value="evm-wallets"
                    className="easyleap-mt-2 easyleap-rounded-xl easyleap-border-[1.5px] easyleap-border-[#DBDBDB] easyleap-bg-transparent easyleap-pt-2 easyleap-text-[#B1B1B1] hover:easyleap-bg-[#E8E8E8] hover:easyleap-text-[#2f2f2f]"
                  >
                    <AccordionTrigger
                      hideChevron
                      className="easyleap-w-full easyleap-py-0 easyleap-px-4 easyleap-pb-2"
                    >
                      <div className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-text-[#2f2f2f]">
                        EVM Wallets
                        <div className="easyleap-flex easyleap-items-center easyleap--space-x-[0.8rem]">
                          <div className="easyleap-rounded-full easyleap-border easyleap-border-[#B9AFF11A] easyleap-bg-[#211D31] easyleap-p-1">
                            <Icons.phantom className="easyleap-size-5" />
                          </div>
                          <div className="easyleap-rounded-full easyleap-border easyleap-border-[#B9AFF11A] easyleap-bg-[#211D31] easyleap-p-1">
                            <Icons.rainbow className="easyleap-size-5" />
                          </div>
                          <div className="easyleap-rounded-full easyleap-border easyleap-border-[#B9AFF11A] easyleap-bg-[#211D31] easyleap-p-1">
                            <Icons.trust className="easyleap-size-5" />
                          </div>
                          <div className="easyleap-rounded-full easyleap-border easyleap-border-[#B9AFF11A] easyleap-bg-[#211D31] easyleap-p-1">
                            <Icons.metamask className="easyleap-size-5" />
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="easyleap-pt-2 easyleap-pb-0 easyleap-px-4 easyleap-bg-white">
                      <EVMWalletOptions />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <div className="easyleap-mt-7 easyleap-flex easyleap-flex-col easyleap-items-start easyleap-gap-2">
                  <p className="easyleap-text-xs easyleap-font-medium easyleap-text-[#8E8E8E]">
                    Connected to {connectorEVM?.name}
                  </p>

                  <Button className="easyleap-flex easyleap-w-[98.2%] easyleap-items-center easyleap-font-firaCode easyleap-font-semibold easyleap-w-full easyleap-justify-between [&_svg]:easyleap-pointer-events-auto my-active-button">
                    <div className="easyleap-flex easyleap-items-center easyleap-justify-start easyleap-gap-3">
                      <span className="easyleap-flex easyleap-items-center easyleap-justify-start easyleap-gap-3">
                        {getWalletIcon(
                          connectorEVM?.name.toLocaleLowerCase() ?? "metamask"
                        )}
                      </span>
                      {shortAddress(addressSource, 8, 8)}
                    </div>

                    <X
                      className="easyleap-size-4 inner-theme-text"
                      onClick={() => {
                        sharedState.setMode(InteractionMode.Starknet);
                        disconnectWagmi();
                        onDisconnectEVM?.();
                      }}
                    />
                  </Button>
                </div>
              )}

              {(addressSource || addressDestination) && (
                <DialogTrigger className="easyleap-mt-8 easyleap-w-full md:easyleap-w-full">
                  <Button className="easyleap-flex easyleap-w-[98.2%] easyleap-items-center easyleap-font-firaCode easyleap-font-semibold easyleap-w-full easyleap-justify-center [&_svg]:easyleap-pointer-events-auto my-active-button">
                    Done
                  </Button>
                </DialogTrigger>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

    
    </div>
  );
};
