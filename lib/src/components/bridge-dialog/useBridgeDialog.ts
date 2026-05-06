import React, { useEffect, useState } from "react";

import {
  useAccount as useAccountWagmi,
  useConnect as useConnectWagmi,
  useDisconnect as useDisconnectWagmi,
} from "wagmi";
import {
  Amount,
  BridgeTransferStatus,
  ConnectedEthereumWallet,
  DepositState,
  ExternalChain,
  Protocol,
} from "starkzap";

import { useBridgeStarkzapContext } from "@lib/contexts/BridgeStarkzapContext";
import { useTheme } from "@lib/contexts/ThemeContext";
import { useAccount } from "@lib/hooks/useAccount";
import { toast } from "@lib/hooks/use-toast";

import { DepositInfo, DepositProgress, LSTAssetConfig } from "./types";

// TODO: TESTING ONLY (Storybook) - remove this mock override before production release.
// TODO: Revert by deleting this constant and using `starknetAddress` directly.
const MOCK_STARKNET_ADDRESS_FOR_STORYBOOK =
  "0x009b2b57f59f93915900eb074fc334661acdade0bc018edf7145e94a64764758" as const;

interface UseBridgeDialogOptions {
  lstConfig: LSTAssetConfig[];
  onBridgeSuccess?: (txHash: string) => void;
  onBridgeError?: (error: Error) => void;
}

const TROVES_PRICE_API_ENDPOINT = "https://proxy.api.troves.fi";

export function useBridgeDialog({
  lstConfig,
  onBridgeSuccess,
  onBridgeError,
}: UseBridgeDialogOptions) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isBridging, setIsBridging] = useState(false);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [evmWalletForBridge, setEvmWalletForBridge] = useState<ConnectedEthereumWallet | null>(
    null,
  );
  const [depositInfo, setDepositInfo] = useState<DepositInfo>({});
  const [depositProgress, setDepositProgress] = useState<DepositProgress | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [selectedAsset, setSelectedAsset] = useState<LSTAssetConfig>(lstConfig[0]);
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);
  const [assetPriceUsd, setAssetPriceUsd] = useState<number | null>(null);

  const { starkzapBridgeWallet, starkzapBridgeSDK } = useBridgeStarkzapContext();
  const theme = useTheme();
  const cd = theme?.connectDialog;

  const {
    connectors: evmConnectors,
    connect: connectEVM,
    isPending: isConnectingEVM,
  } = useConnectWagmi();
  const { disconnect: disconnectWagmi } = useDisconnectWagmi();
  const { address: evmAddress, connector: evmConnector } = useAccountWagmi();
  const { starknetAddress } = useAccount();
  // TODO: TESTING ONLY (Storybook) - remove fallback and use `starknetAddress` directly.
  const effectiveStarknetAddress = starknetAddress ?? MOCK_STARKNET_ADDRESS_FOR_STORYBOOK;

  const uniqueEvm = React.useMemo(
    () => evmConnectors.filter((c, i, self) => i === self.findIndex((x) => x.name === c.name)),
    [evmConnectors],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchDepositInfo = React.useCallback(async (token: any) => {
    if (!evmWalletForBridge || !starkzapBridgeWallet) return;

    setIsLoadingInfo(true);
    try {
      const balance = await starkzapBridgeWallet.getDepositBalance(token, evmWalletForBridge);
      const allowance = await starkzapBridgeWallet.getAllowance(token, evmWalletForBridge);
      const fees = await starkzapBridgeWallet.getDepositFeeEstimate(token, evmWalletForBridge, {
        fastTransfer: true,
      });

      let totalFeeAmount: Amount;
      if ("l1Fee" in fees && "l2Fee" in fees) {
        totalFeeAmount = fees.l1Fee.add(fees.l2Fee);
      } else if ("localFee" in fees && "interchainFee" in fees) {
        totalFeeAmount = fees.localFee.add(fees.interchainFee);
      } else {
        totalFeeAmount = Amount.parse("0", 18, "ETH");
      }

      setDepositInfo({
        balance: balance.toFormatted(),
        allowance: allowance?.toFormatted() || null,
        estimatedFees: {
          amount: totalFeeAmount.toUnit(),
          usdValue: "$0.34", // TODO: Calculate USD value from fees
        },
      });
    } catch (error) {
      console.error("Failed to fetch deposit info:", error);
    } finally {
      setIsLoadingInfo(false);
    }
  }, [evmWalletForBridge, starkzapBridgeWallet]);

  const handleQuickAmount = (percentage: number) => {
    if (!depositInfo.balance) return;

    const balanceMatch = depositInfo.balance.match(/[\d,]+\.?\d*/);
    if (!balanceMatch) return;

    const balanceStr = balanceMatch[0].replace(/,/g, "");
    const balanceNum = parseFloat(balanceStr);
    if (isNaN(balanceNum)) return;

    const raw = (balanceNum * percentage) / 100;
    const clamped = Number(raw.toFixed(8));
    setAmount(Number.isFinite(clamped) ? clamped.toString() : "0");
  };

  const amountUsd = React.useMemo(() => {
    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0 || !assetPriceUsd) return null;
    return amountNumber * assetPriceUsd;
  }, [amount, assetPriceUsd]);

  useEffect(() => {
    let isCancelled = false;

    const fetchAssetPrice = async () => {
      try {
        const tokenSymbol = selectedAsset?.SYMBOL;
        if (!tokenSymbol) {
          if (!isCancelled) setAssetPriceUsd(null);
          return;
        }

        const url = `${TROVES_PRICE_API_ENDPOINT}/api/price/${encodeURIComponent(tokenSymbol)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Price API error: ${response.status}`);

        const payload: unknown = await response.json();
        const parsedPrice = extractPriceFromPayload(payload);

        if (!isCancelled) {
          setAssetPriceUsd(Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : null);
        }
      } catch (error) {
        console.error("Failed to fetch asset price:", error);
        if (!isCancelled) setAssetPriceUsd(null);
      }
    };

    fetchAssetPrice();

    return () => {
      isCancelled = true;
    };
  }, [selectedAsset]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monitorDepositProgress = async (externalTxHash: string, token: any) => {
    if (!starkzapBridgeWallet) return;

    try {
      const pollInterval = setInterval(async () => {
        try {
          const result = await starkzapBridgeWallet.monitorDeposit(token, externalTxHash);
          const state = await starkzapBridgeWallet.getDepositState(token, result);

          setDepositProgress({
            externalTxHash,
            starknetTxHash: result.starknetTxHash,
            status: result.status,
            depositState: state,
          });

          if (state === DepositState.COMPLETED || state === DepositState.ERROR) {
            clearInterval(pollInterval);
            if (state === DepositState.COMPLETED) {
              toast({ description: "Bridge completed successfully!" });
            }
          }
        } catch (error) {
          console.error("Monitor error:", error);
        }
      }, 5000);

      return () => clearInterval(pollInterval);
    } catch (error) {
      console.error("Failed to start monitoring:", error);
    }
  };

  // Create ConnectedEthereumWallet when EVM wallet connects
  React.useEffect(() => {
    const setupEvmWallet = async () => {
      if (!evmAddress || !evmConnector || !starkzapBridgeWallet) {
        setEvmWalletForBridge(null);
        return;
      }

      try {
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
          starkzapBridgeWallet.getChainId(),
        );

        setEvmWalletForBridge(ethWallet);

        if (starkzapBridgeSDK && !selectedToken && selectedAsset) {
          const ethereumTokens = await starkzapBridgeSDK.getBridgingTokens(ExternalChain.ETHEREUM);
          const assetTokens = ethereumTokens.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (t: any) => t.symbol.toLowerCase() === selectedAsset.SYMBOL.toLowerCase(),
          );
          const assetToken =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            assetTokens.find((t: any) => t.protocol === Protocol.CANONICAL) || assetTokens[0];
          if (assetToken) setSelectedToken(assetToken);
        }
      } catch (error) {
        console.error("Failed to create ConnectedEthereumWallet:", error);
        toast({
          description: "Failed to setup Ethereum wallet for bridging",
          variant: "destructive",
        });
      }
    };

    setupEvmWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evmAddress, evmConnector, starkzapBridgeWallet, starkzapBridgeSDK, selectedAsset.SYMBOL]);

  // Close dialog and reset state when Starknet wallet disconnects
  useEffect(() => {
    if (!effectiveStarknetAddress && open) {
      setOpen(false);
      setAmount("");
      setDepositProgress(null);
      setIsBridging(false);
      setDepositInfo({});
    }
  }, [effectiveStarknetAddress, open]);

  // Fetch deposit info when token changes
  useEffect(() => {
    if (selectedToken && evmWalletForBridge && starkzapBridgeWallet && selectedAsset) {
      fetchDepositInfo(selectedToken);
    }
  }, [selectedToken, evmWalletForBridge, starkzapBridgeWallet, selectedAsset, fetchDepositInfo]);

  // Load bridging token when asset selection changes
  useEffect(() => {
    const loadTokenForAsset = async () => {
      if (!starkzapBridgeSDK || !evmWalletForBridge || !selectedAsset) return;

      try {
        const ethereumTokens = await starkzapBridgeSDK.getBridgingTokens(ExternalChain.ETHEREUM);
        const assetTokens = ethereumTokens.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (t: any) => t.symbol.toLowerCase() === selectedAsset.SYMBOL.toLowerCase(),
        );
        const assetToken =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          assetTokens.find((t: any) => t.protocol === Protocol.CANONICAL) || assetTokens[0];
        if (assetToken) setSelectedToken(assetToken);
      } catch (error) {
        console.error("Failed to load token for asset:", error);
      }
    };

    loadTokenForAsset();
  }, [selectedAsset, starkzapBridgeSDK, evmWalletForBridge]);

  const handleDisconnectEvm = () => {
    disconnectWagmi();
    setEvmWalletForBridge(null);
  };

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && depositProgress?.depositState === DepositState.COMPLETED) {
      setAmount("");
      setDepositProgress(null);
      setIsBridging(false);
    }
  };

  const handleBridge = async () => {
    if (!starkzapBridgeWallet || !effectiveStarknetAddress || !evmWalletForBridge || !amount) {
      toast({
        description: "Please connect wallets and enter an amount",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({ description: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    // Check if amount exceeds balance
    if (depositInfo.balance) {
      const balanceMatch = depositInfo.balance.match(/[\d,]+\.?\d*/);
      if (balanceMatch) {
        const balanceStr = balanceMatch[0].replace(/,/g, "");
        const balanceNum = parseFloat(balanceStr);
        if (!isNaN(balanceNum) && amountNum > balanceNum) {
          toast({
            description: `Insufficient balance: ${amountNum} > Available ${balanceNum}`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    setIsBridging(true);

    try {
      if (!starkzapBridgeSDK) throw new Error("StarkZap SDK not available");

      const ethereumTokens = await starkzapBridgeSDK.getBridgingTokens(ExternalChain.ETHEREUM);
      const assetTokens = ethereumTokens.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t: any) => t.symbol.toLowerCase() === selectedAsset.SYMBOL.toLowerCase(),
      );
      const assetToken =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        assetTokens.find((t: any) => t.protocol === Protocol.CANONICAL) || assetTokens[0];

      if (!assetToken) {
        throw new Error(`${selectedAsset.SYMBOL} token not found in bridging tokens`);
      }

      const depositAmount = Amount.parse(amount, assetToken.decimals, assetToken.symbol);
      // `useAccount` returns a hex string type; StarkZap expects branded address type.
      const recipientAddress =
        effectiveStarknetAddress as unknown as typeof starkzapBridgeWallet.address;

      toast({ description: "Please sign the transaction in your wallet..." });

      const tx = await starkzapBridgeWallet.deposit(
        recipientAddress,
        depositAmount,
        assetToken,
        evmWalletForBridge,
      );

      toast({ description: "Transaction submitted! Monitoring progress..." });
      onBridgeSuccess?.(tx.hash);

      setDepositProgress({
        externalTxHash: tx.hash,
        status: BridgeTransferStatus.SUBMITTED_ON_L1,
        depositState: DepositState.PENDING,
      });

      monitorDepositProgress(tx.hash, assetToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Bridge error:", error);
      toast({ description: error.message || "Bridge transaction failed", variant: "destructive" });
      onBridgeError?.(error);
      setIsBridging(false);
    }
  };

  return {
    // Dialog state
    open,
    handleDialogClose,
    // Form state
    amount,
    setAmount,
    isBridging,
    isLoadingInfo,
    depositInfo,
    amountUsd,
    assetPriceUsd,
    depositProgress,
    selectedAsset,
    setSelectedAsset,
    isAssetSelectorOpen,
    setIsAssetSelectorOpen,
    // EVM wallet
    evmAddress,
    starknetAddress: effectiveStarknetAddress,
    evmConnector,
    uniqueEvm,
    isConnectingEVM,
    connectEVM,
    handleDisconnectEvm,
    // Starknet
    starkzapBridgeWallet,
    // Theme
    cd,
    // Handlers
    handleBridge,
    handleQuickAmount,
  };
}

function extractPriceFromPayload(payload: unknown): number {
  if (typeof payload === "number") return payload;

  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    const candidates = [data.price, data.usd, data.value, data.result];
    for (const candidate of candidates) {
      const numeric = typeof candidate === "string" ? Number(candidate) : Number(candidate);
      if (Number.isFinite(numeric) && numeric > 0) return numeric;
    }
  }

  return NaN;
}
