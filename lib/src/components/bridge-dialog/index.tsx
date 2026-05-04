import React, { useState } from "react";
import {
  useConnect as useConnectWagmi,
  useDisconnect as useDisconnectWagmi,
  useAccount as useAccountWagmi,
} from "wagmi";
import { Loader2, X } from "lucide-react";
import {
  ConnectedEthereumWallet,
  ExternalChain,
  Amount,
  Protocol,
} from "starkzap";

import { Icons } from "@lib/components/Icons";
import { Button } from "@lib/components/ui/button";
import { Input } from "@lib/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@lib/components/ui/dialog";
import { useTheme } from "@lib/contexts/ThemeContext";
import { cn, shortAddress } from "@lib/utils";
import { toast } from "@lib/hooks/use-toast";
import { usePrivyContext } from "@lib/contexts/PrivyContext";

export interface BridgeDialogProps {
  onBridgeSuccess?: (txHash: string) => void;
  onBridgeError?: (error: Error) => void;
  style?: {
    buttonStyles?: React.CSSProperties;
    modalStyles?: React.CSSProperties;
  };
  className?: string;
}

export const BridgeDialog: React.FC<BridgeDialogProps> = ({
  onBridgeSuccess,
  onBridgeError,
  style = {},
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isBridging, setIsBridging] = useState(false);
  const [evmWalletForBridge, setEvmWalletForBridge] =
    useState<ConnectedEthereumWallet | null>(null);

  const { starkzapWallet, starkzapSdk } = usePrivyContext();
  const theme = useTheme();
  const cd = theme?.connectDialog;

  const {
    connectors: evmConnectors,
    connect: connectEVM,
    isPending: isConnectingEVM,
  } = useConnectWagmi();
  const { disconnect: disconnectWagmi } = useDisconnectWagmi();
  const { address: evmAddress, connector: evmConnector } = useAccountWagmi();

  const uniqueEvm = React.useMemo(
    () =>
      evmConnectors.filter(
        (c, i, self) => i === self.findIndex((x) => x.name === c.name),
      ),
    [evmConnectors],
  );

  const walletLabel = (name: string) =>
    name.toLowerCase().includes("wallet") ? name : `${name} wallet`;

  const getWalletIcon = (walletId: string): React.ReactNode => {
    const id = walletId.toLowerCase();
    if (id.includes("metamask"))
      return <Icons.metamask className="easyleap-size-5" />;
    if (id.includes("coinbase"))
      return <Icons.coinbase className="easyleap-size-5" />;
    if (id.includes("walletconnect"))
      return <Icons.walletConnect className="easyleap-size-5" />;
    return <Icons.metamask className="easyleap-size-5" />;
  };

  const copyToClipboard = async (e: React.MouseEvent, fullAddress: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(fullAddress);
      toast({ description: "Address copied" });
    } catch {
      toast({ description: "Failed to copy address", variant: "destructive" });
    }
  };

  // Create ConnectedEthereumWallet when EVM wallet connects
  React.useEffect(() => {
    const setupEvmWallet = async () => {
      if (!evmAddress || !evmConnector || !starkzapWallet) {
        setEvmWalletForBridge(null);
        return;
      }

      try {
        // Get the EIP-1193 provider from wagmi
        const provider = await evmConnector.getProvider();
        // @ts-expect-error - wagmi provider types compatibility
        const chainId = await provider.request({ method: "eth_chainId" });

        const ethWallet = await ConnectedEthereumWallet.from(
          {
            chain: ExternalChain.ETHEREUM,
            // @ts-expect-error - wagmi provider types compatibility
            provider: provider,
            address: evmAddress,
            chainId: chainId as string,
          },
          starkzapWallet.getChainId(),
        );

        setEvmWalletForBridge(ethWallet);
      } catch (error) {
        console.error("Failed to create ConnectedEthereumWallet:", error);
        toast({
          description: "Failed to setup Ethereum wallet for bridging",
          variant: "destructive",
        });
      }
    };

    setupEvmWallet();
  }, [evmAddress, evmConnector, starkzapWallet]);

  const handleDisconnectEvm = () => {
    disconnectWagmi();
    setEvmWalletForBridge(null);
  };

  const handleBridge = async () => {
    if (!starkzapWallet || !evmWalletForBridge || !amount) {
      toast({
        description: "Please connect wallets and enter an amount",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setIsBridging(true);

    try {
      // Get bridging tokens
      if (!starkzapSdk) {
        throw new Error("StarkZap SDK not available");
      }

      console.log("hi");

      const ethereumTokens = await starkzapSdk.getBridgingTokens(
        ExternalChain.ETHEREUM,
      );

      console.log("ethTokensss : ", ethereumTokens);

      // TODO: for testing we are changing to strk ow will do wbtc and other tokens
      // Find strk - prefer CANONICAL protocol over OFT to avoid LayerZero requirement
      const strkTokens = ethereumTokens.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t: any) => t.symbol.toLowerCase() === "strk",
      );

      console.log(
        "Available STRK tokens:",

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        strkTokens.map((t: any) => ({
          symbol: t.symbol,
          protocol: t.protocol,
        })),
      );

      // Prefer canonical bridge (StarkGate) over OFT (LayerZero)
      // Protocol.CANONICAL = "canonical", Protocol.OFT = "oft"
      const strkToken =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        strkTokens.find((t: any) => t.protocol === Protocol.CANONICAL) ||
        strkTokens[0];

      if (strkToken) {
        console.log("Selected STRK token protocol:", strkToken.protocol);
      }

      if (!strkToken) {
        throw new Error("WBTC token not found in bridging tokens");
      }

      // Create the deposit
      const depositAmount = Amount.parse(
        amount,
        strkToken.decimals,
        strkToken.symbol,
      );

      const tx = await starkzapWallet.deposit(
        // TODO: check
        // This addy should be same as privyWallet.address
        starkzapWallet.address,
        depositAmount,
        strkToken,
        evmWalletForBridge,
      );

      toast({
        description: `Bridge transaction submitted! Hash: ${tx.hash.slice(0, 10)}...`,
      });

      onBridgeSuccess?.(tx.hash);
      setAmount("");
      setOpen(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Bridge error:", error);
      toast({
        description: error.message || "Bridge transaction failed",
        variant: "destructive",
      });
      onBridgeError?.(error);
    } finally {
      setIsBridging(false);
    }
  };

  const panelRowBase: React.CSSProperties = {
    border: cd?.rowBorder || "1px solid #e5e5e5",
    color: cd?.rowTextColor || "#000",
    backgroundColor: "transparent",
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn("easyleap-font-firaCode", className)}
          style={style?.buttonStyles}
        >
          Bridge
        </Button>
      </DialogTrigger>

      <DialogContent
        className="easyleap-max-w-md easyleap-rounded-3xl easyleap-border easyleap-p-0"
        style={{
          backgroundColor: cd?.modalBackground || "#fff",
          border: cd?.modalBorder || "1px solid #e5e5e5",
          borderRadius: cd?.modalBorderRadius || "24px",
          ...style?.modalStyles,
        }}
      >
        <DialogHeader className="easyleap-p-6 easyleap-pb-4">
          <DialogTitle
            className="easyleap-text-center easyleap-text-xl easyleap-font-bold"
            style={{ color: cd?.titleColor || "#000" }}
          >
            Bridge to Starknet
          </DialogTitle>
        </DialogHeader>

        <div className="easyleap-px-6 easyleap-pb-6 easyleap-space-y-4">
          {/* Starknet Wallet Info */}
          {!starkzapWallet ? (
            <div
              className="easyleap-p-4 easyleap-rounded-lg easyleap-text-center"
              style={{
                backgroundColor: cd?.rowHoverBackground || "#f5f5f5",
                color: cd?.mutedTextColor || "#666",
              }}
            >
              <p className="easyleap-text-sm">
                Please connect your Starknet wallet first
              </p>
            </div>
          ) : (
            <div
              className="easyleap-p-4 easyleap-rounded-lg"
              style={{
                backgroundColor: cd?.rowHoverBackground || "#f5f5f5",
              }}
            >
              <p
                className="easyleap-text-xs easyleap-mb-2"
                style={{ color: cd?.mutedTextColor || "#666" }}
              >
                Receiving on Starknet
              </p>
              <p className="easyleap-font-mono easyleap-text-sm easyleap-font-medium">
                {shortAddress(starkzapWallet.address.toString(), 8, 8)}
              </p>
            </div>
          )}

          {/* EVM Wallet Connection */}
          <div className="easyleap-space-y-2">
            <h5
              className="easyleap-text-xs easyleap-font-semibold"
              style={{ color: cd?.mutedTextColor || "#8E8E8E" }}
            >
              Connect Ethereum Wallet
            </h5>

            {!evmAddress ? (
              <div className="easyleap-space-y-2.5">
                {uniqueEvm.map((connector) => (
                  <ConnectRow
                    key={connector.name}
                    label={walletLabel(connector.name)}
                    icon={getWalletIcon(connector.name.toLowerCase())}
                    onClick={() => connectEVM({ connector })}
                    disabled={isConnectingEVM}
                  />
                ))}
              </div>
            ) : (
              <div
                className="easyleap-flex easyleap-w-full easyleap-items-center easyleap-justify-between easyleap-rounded-xl easyleap-px-3 easyleap-py-3"
                style={{
                  ...panelRowBase,
                  backgroundColor: cd?.rowHoverBackground || "#f5f5f5",
                }}
              >
                <div className="easyleap-flex easyleap-items-center easyleap-gap-3">
                  <span className="easyleap-flex easyleap-items-center easyleap-rounded-full easyleap-p-1">
                    {getWalletIcon(
                      (evmConnector?.name ?? "metamask").toLowerCase(),
                    )}
                  </span>
                  <div className="easyleap-flex easyleap-flex-col easyleap-gap-0.5">
                    <span className="easyleap-text-sm easyleap-font-medium">
                      {walletLabel(String(evmConnector?.name ?? "EVM"))}
                    </span>
                    <span
                      className="easyleap-font-mono easyleap-text-xs"
                      style={{ color: cd?.mutedTextColor || "#666" }}
                    >
                      <button
                        type="button"
                        className="easyleap-cursor-pointer"
                        title="Copy address"
                        onClick={(e) => copyToClipboard(e, evmAddress)}
                      >
                        {shortAddress(evmAddress, 6, 6)}
                      </button>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Disconnect EVM"
                  className="easyleap-rounded-md easyleap-p-1 easyleap-transition-opacity hover:easyleap-opacity-80"
                  style={{ color: cd?.mutedTextColor || "#666" }}
                  onClick={handleDisconnectEvm}
                >
                  <X className="easyleap-size-4" />
                </button>
              </div>
            )}
          </div>

          {/* Amount Input */}
          {evmAddress && starkzapWallet && (
            <div className="easyleap-space-y-2">
              <h5
                className="easyleap-text-xs easyleap-font-semibold"
                style={{ color: cd?.mutedTextColor || "#8E8E8E" }}
              >
                Amount (WBTC)
              </h5>
              <Input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isBridging}
                className="easyleap-font-mono"
                step="0.00000001"
                min="0"
              />
            </div>
          )}

          {/* Bridge Button */}
          {evmAddress && starkzapWallet && (
            <Button
              onClick={handleBridge}
              disabled={isBridging || !amount || parseFloat(amount) <= 0}
              className="easyleap-w-full easyleap-font-semibold"
              style={{
                backgroundColor: cd?.accent || "#0ea5e9",
                color: cd?.accentForeground || "#fff",
              }}
            >
              {isBridging ? (
                <>
                  <Loader2 className="easyleap-mr-2 easyleap-h-4 easyleap-w-4 easyleap-animate-spin" />
                  Bridging...
                </>
              ) : (
                "Bridge to Starknet"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
