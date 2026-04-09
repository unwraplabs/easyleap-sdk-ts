import {
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
import { InteractionMode, useSharedState } from "@lib/contexts/SharedState";
import { useTheme } from "@lib/contexts/ThemeContext";
import { useAccount, evmConfig } from "@lib/hooks/useAccount";
import { useMode } from "@lib/hooks/useMode";
import { cn, shortAddress } from "@lib/utils";

// BRIDGE MODE - removed bridge-specific imports
// import { format } from "date-fns";
// import { Loader2, MailIcon } from "lucide-react";
// import { Popover, PopoverContent, PopoverTrigger } from "@lib/components/ui/popover";
// import { ScrollArea } from "@lib/components/ui/scroll-area";
// import { EASYLEAP_EXPLORER, standariseAddress } from "@lib/utils";
// import { useSupportedTokens } from "@lib/hooks/useSupportedTokens";
// import ProgressBar from "./ui/progress-bar";

import { ModeSwitcher, type ConnectButtonProps } from ".";
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
  const { evmAddress, starknetAddress } = useAccount();

  const { disconnect: disconnectSN } = useDisconnectSN();
  const { disconnect: disconnectWagmi } = useDisconnectWagmi();

  const { connector } = useConnectSN();
  const { connector: connectorEVM } = getAccount(evmConfig);
  const { user, disconnectPrivy } = usePrivyContext();

  const theme = useTheme();

  // BRIDGE MODE - supported tokens for history panel commented out
  // const supportedTokens = useSupportedTokens();
  // function getTokenInfo(l2Addr: string) {
  //   const tokenInfo = supportedTokens.find((token) => standariseAddress(token.l2_token_address) == standariseAddress(l2Addr));
  //   return tokenInfo?.symbol || "Unknown";
  // }

  const walletIconMap: Record<
    string,
    { Icon: React.ElementType; size?: string }
  > = {
    // Starknet wallets
    braavos: { Icon: Icons.braavos, size: "easyleap-size-5" },
    argentX: { Icon: Icons.argentX, size: "easyleap-size-15" },
    argentWebWallet: { Icon: Icons.wallet, size: "easyleap-size-5" },
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
            key={connector.name}
            onClick={() => {
              // BRIDGE MODE - removed guard requiring SN wallet first
              // if (!addressDestination)
              //   return toast({ title: "Connect Starknet wallet first", duration: 3000 });
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

  // BRIDGE MODE - bridge transaction helpers commented out
  // const getDestinationTxn = (srcTxn: any) => {
  //   const txn = sharedState.destinationTransactions.find(
  //     (destTxn: any) => destTxn.request_id === srcTxn.request_id
  //   );
  //   if (!txn) { return { status: "pending" }; }
  //   return txn as any;
  // };

  // const getPendingTxnCount = () => {
  //   const requestIdsSet = new Set(sharedState.destinationTransactions.map((item) => item.request_id));
  //   const pendingTxns = sharedState.sourceTransactions.filter((item) => !requestIdsSet.has(item.request_id));
  //   return pendingTxns.length;
  // };

  React.useEffect(() => {
    // BRIDGE MODE - dual-wallet connected toast commented out
    // if (addressSource && addressDestination) {
    //   toast({
    //     title: "Wallets Connected!",
    //     description: "Starknet and EVM wallets are linked. move L1 funds to this dApp.",
    //     duration: 3000
    //   });
    // }

    // BRIDGE MODE - force-disconnect EVM when SN not connected removed.
    // Each wallet is now independent; EVM can be connected without SN.
    // if (addressSource && !addressDestination) {
    //   disconnectWagmi();
    //   onDisconnectEVM?.();
    // }

    // BRIDGE MODE - bridge mode toast commented out
    // if (mode === InteractionMode.Bridge) {
    //   dismiss();
    //   toast({ title: "Bridge mode is enabled", duration: 3000 });
    // } else {
    //   dismiss();
    // }
  }, [evmAddress, starknetAddress, mode]);

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
            : undefined,

        // BRIDGE MODE - bridge bg color commented out
        // backgroundColor: addressSource || addressDestination
        //   ? mode === InteractionMode.Starknet
        //     ? theme?.starknetMode?.mainBgColor
        //     : theme?.bridgeMode?.mainBgColor
        //   : undefined,
      }}
    >
      <Dialog
        open={sharedState.connectWalletModalOpen}
        onOpenChange={sharedState.setConnectWalletModalOpen}
      >
        <div className="easyleap-w-full easyleap-flex md:easyleap-flex-row gap-2">
          <DialogTrigger asChild>
            <div className="easyleap-w-full easyleap-font-firaCode easylea-items-center easyleap-flex">
              {/* No wallet connected */}
              {!evmAddress && !starknetAddress && (
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

              {/* Starknet mode: show SN address */}
              {mode === InteractionMode.Starknet && (
                <Button
                  style={{
                    color: theme?.starknetMode?.button?.color,
                    backgroundColor: theme?.starknetMode?.button?.backgroundColor,
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
                  {shortAddress(starknetAddress || "", 4, 4)}
                </Button>
              )}

              {/* EVM mode: show EVM address */}
              {mode === InteractionMode.EVM && (
                <Button
                  style={{
                    color: theme?.evmMode?.button?.color,
                    backgroundColor: theme?.evmMode?.button?.backgroundColor,
                    border: theme?.evmMode?.button?.border,
                    borderRadius: theme?.evmMode?.button?.borderRadius
                  }}
                  className={cn(
                    "easyleap-mx-auto easyleap-flex easyleap-w-fit easyleap-items-center easyleap-justify-start easyleap-gap-3 easyleap-font-medium hover:easyleap-bg-transparent easyleap-rounded-[50px]",
                    className
                  )}
                >
                  <span className="easyleap-rounded-full easyleap-bg-white easyleap-p-1 easyleap--ml-[15px]">
                    {getWalletIcon(connectorEVM?.name.toLocaleLowerCase() ?? "metamask")}
                  </span>
                  {shortAddress(evmAddress, 4, 4)}
                </Button>
              )}

              {/* BRIDGE MODE - double-button overlay UI commented out */}
              {/* {mode == InteractionMode.Bridge && (
                <div className={cn("easyleap-mx-auto easyleap-px-1 easyleap-flex easyleap-cursor-pointer easyleap-items-center easyleap-justify-center easyleap--space-x-[3rem]", className)}>
                  <Button style={{ color: theme?.bridgeMode?.evmButton?.color, backgroundColor: theme?.bridgeMode?.evmButton?.backgroundColor, border: theme?.bridgeMode?.evmButton?.border, borderRadius: theme?.bridgeMode?.evmButton?.borderRadius }}
                    className="easyleap-z-20 easyleap-flex easyleap-scale-105 easyleap-items-center easyleap-justify-start easyleap-gap-3 easyleap-rounded-[50px] hover:easyleap-bg-[#1B182B] easyleap-text-white easyleap-border-[1.5px] easyleap-border-[#DBDBDB]/60">
                    <span className="easyleap-rounded-full easyleap-bg-white easyleap-p-1 easyleap--ml-[15px]">
                      {getWalletIcon(connectorEVM?.name.toLocaleLowerCase() ?? "metamask")}
                    </span>
                    {shortAddress(evmAddress, 4, 4)}
                  </Button>
                  <Button style={{ color: theme?.bridgeMode?.starknetButton?.color, backgroundColor: theme?.bridgeMode?.starknetButton?.backgroundColor, border: theme?.bridgeMode?.starknetButton?.border, borderRadius: theme?.bridgeMode?.starknetButton?.borderRadius }}
                    className={cn("easyleap-z-0 easyleap-flex easyleap-w-fit easyleap-items-center easyleap-justify-start easyleap-gap-3 easyleap-rounded-[50px] easyleap-font-semibold hover:easyleap-bg-[#35314F] easyleap-text-white", className)}>
                    {shortAddress(addressDestination, 4, 4)}
                    <span className="easyleap-rounded-full easyleap-bg-[#fff] easyleap-p-1 easyleap--mr-[13px]">
                      {getWalletIcon(connector?.id ?? "braavos")}
                    </span>
                  </Button>
                </div>
              )} */}
            </div>
          </DialogTrigger>

          <ModeSwitcher />

          {/* BRIDGE MODE - transaction history popover commented out */}
          {/* {(addressDestination || addressDestination) && (
            <Popover open={sharedState.isTxnPopoverOpen} onOpenChange={sharedState.setIsTxnPopoverOpen}>
              <PopoverTrigger className="easyleap-relative">
                <>
                  {getPendingTxnCount() > 0 && (
                    <div className="easyleap-absolute easyleap--right-0 easyleap--top-1.5 easyleap-flex easyleap-size-4 easyleap-items-center easyleap-justify-center easyleap-rounded-full easyleap-bg-red-500 easyleap-p-1 easyleap-text-[9px] easyleap-font-semibold easyleap-text-white">
                      {getPendingTxnCount()}
                    </div>
                  )}
                  {!sharedState.isSuccessEVM && (
                    <div style={{ backgroundColor: mode === InteractionMode.Starknet ? theme?.starknetMode?.historyButton?.backgroundColor : theme?.bridgeMode?.historyButton?.backgroundColor }}
                      className="easyleap-rounded-full easyleap-p-2">
                      <Icons.historyIcon className="easyleap-shrink-0" />
                    </div>
                  )}
                  ... (full bridge history UI omitted for brevity)
                </>
              </PopoverTrigger>
              <PopoverContent>
                <h4>Bridge transaction history</h4>
                ...
              </PopoverContent>
            </Popover>
          )} */}
        </div>

        <DialogContent
          className="easyleap-max-h-[100vh] easyleap-bg-white easyleap-p-2 easyleap-font-dmSans md:easyleap-p-6 lg:easyleap-max-h-none"
          closeClassName="easyleap-text-[#B9AFF1]"
        >
          <DialogHeader>
            <DialogTitle className="easyleap-text-center easyleap-text-2xl easyleap-font-normal easyleap-text-[#575757]">
              Connect Wallet

              {/* BRIDGE MODE - old title commented out */}
              {/* Connect To <br />{" "}<span className="easyleap-font-bold easyleap-text-[#2F2F2F]">EVM and Starknet</span> */}
            </DialogTitle>
          </DialogHeader>

          <div className="easyleap-flex easyleap-w-full easyleap-flex-col easyleap-items-start easyleap-justify-center easyleap-gap-6">

            {/* Starknet wallet section */}
            <div className="easyleap-mt-1 easyleap-w-full">
              <h5 className="easyleap-text-xs easyleap-font-semibold easyleap-text-[#8E8E8E] easyleap-mb-2">
                Starknet Wallet
              </h5>
              {!starknetAddress ? (
                <SNWalletOptions />
              ) : (
                <div className="easyleap-flex easyleap-flex-col easyleap-items-start easyleap-gap-2">
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
                        // BRIDGE MODE - disconnecting SN no longer also disconnects EVM.
                        // Each wallet is independent.
                        // disconnectWagmi();
                        // onDisconnectEVM?.();
                      }}
                    />
                  </Button>
                </div>
              )}
            </div>

            {/* EVM wallet section */}
            <div className="easyleap-mt-3 easyleap-w-full">
              <h5 className="easyleap-text-xs easyleap-font-semibold easyleap-text-[#8E8E8E] easyleap-mb-2">
                EVM Wallet
              </h5>

              {/* BRIDGE MODE - "Optional" label and description commented out */}
              {/* <h5 className="easyleap-text-center easyleap-text-base easyleap-font-medium easyleap-text-[#2F2F2F]">Optional</h5>
              <p className="easyleap-mt-1 easyleap-text-center easyleap-text-sm easyleap-font-normal easyleap-text-[#8E8E8E] wrap-anywhere">
                Link your EVM wallet to transfer L1 tokens seamlessly into the DApp!
              </p> */}

              {!evmAddress ? (
                <Accordion
                  type="single"
                  collapsible
                  className="easyleap-w-full"
                >
                  <AccordionItem
                    value="evm-wallets"
                    className="easyleap-rounded-xl easyleap-border-[1.5px] easyleap-border-[#DBDBDB] easyleap-bg-transparent easyleap-pt-2 easyleap-text-[#B1B1B1] hover:easyleap-bg-[#E8E8E8] hover:easyleap-text-[#2f2f2f]"
                  >
                    <AccordionTrigger
                      hideChevron
                      className="easyleap-w-full easyleap-py-0 easyleap-px-4 easyleap-pb-2"
                    >
                      <div className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-text-[#2f2f2f]">
                        Connect EVM Wallet
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
                <div className="easyleap-flex easyleap-flex-col easyleap-items-start easyleap-gap-2">
                  <p className="easyleap-text-xs easyleap-font-medium easyleap-text-[#8E8E8E]">
                    Connected to {connectorEVM?.name}
                  </p>

                  <Button className="easyleap-flex easyleap-w-[98.2%] easyleap-items-center easyleap-font-firaCode easyleap-font-semibold easyleap-w-full easyleap-justify-between [&_svg]:easyleap-pointer-events-auto my-active-button">
                    <div className="easyleap-flex easyleap-items-center easyleap-justify-start easyleap-gap-3">
                      <span className="easyleap-flex easyleap-items-center easyleap-justify-start easyleap-gap-3">
                        {getWalletIcon(connectorEVM?.name.toLocaleLowerCase() ?? "metamask")}
                      </span>
                      {shortAddress(evmAddress, 8, 8)}
                    </div>

                    <X
                      className="easyleap-size-4 inner-theme-text"
                      onClick={() => {
                        if (!starknetAddress) {
                          sharedState.setMode(InteractionMode.None);
                        } else {
                          sharedState.setMode(InteractionMode.Starknet);
                        }
                        disconnectWagmi();
                        onDisconnectEVM?.();
                      }}
                    />
                  </Button>
                </div>
              )}

              {(evmAddress || starknetAddress) && (
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
