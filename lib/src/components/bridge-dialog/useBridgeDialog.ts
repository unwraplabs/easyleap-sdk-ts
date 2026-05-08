import React, { useEffect, useRef, useState } from "react";
import { num, validateAndParseAddress } from "starknet";
import {
  useAccount as useAccountWagmi,
  useConnect as useConnectWagmi,
  useDisconnect as useDisconnectWagmi,
} from "wagmi";
import {
  Address,
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

interface UseBridgeDialogOptions {
  lstConfig: LSTAssetConfig[];
  onBridgeSuccess?: (txHash: string) => void;
  onBridgeError?: (error: Error) => void;
}

const TROVES_PRICE_API_ENDPOINT = "https://proxy.api.troves.fi";

async function fetchEthSpotPrice(): Promise<number | null> {
  try {
    const ethPriceUrl = `${TROVES_PRICE_API_ENDPOINT}/api/price/ETH`;
    const ethPriceResponse = await fetch(ethPriceUrl);
    if (!ethPriceResponse.ok) return null;
    const ethPricePayload: unknown = await ethPriceResponse.json();
    const ethPrice = extractPriceFromPayload(ethPricePayload);
    return Number.isFinite(ethPrice) && ethPrice > 0 ? ethPrice : null;
  } catch {
    return null;
  }
}

function pickBridgeTokenForAsset(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ethereumTokens: any[],
  assetSymbol: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any | null {
  const assetTokens = ethereumTokens.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- StarkZap BridgeToken shape
    (t: any) => t.symbol.toLowerCase() === assetSymbol.toLowerCase(),
  );
  if (assetTokens.length === 0) return null;
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- StarkZap BridgeToken shape
    assetTokens.find((t: any) => t.protocol === Protocol.CANONICAL) ||
    assetTokens[0] ||
    null
  );
}

export function useBridgeDialog({
  lstConfig,
  onBridgeSuccess,
  onBridgeError,
}: UseBridgeDialogOptions) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isBridging, setIsBridging] = useState(false);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [evmWalletForBridge, setEvmWalletForBridge] =
    useState<ConnectedEthereumWallet | null>(null);
  const [depositInfo, setDepositInfo] = useState<DepositInfo>({});
  const [depositProgress, setDepositProgress] =
    useState<DepositProgress | null>(null);
  const [ethereumBridgeTokens, setEthereumBridgeTokens] = useState<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any[] | null
  >(null);
  const getDefaultSelectedAsset = React.useCallback((): LSTAssetConfig => {
    return (
      lstConfig.find(
        (asset) => asset.SYMBOL.toLowerCase() === "wbtc".toLowerCase(),
      ) ?? lstConfig[0]
    );
  }, [lstConfig]);

  const [selectedAsset, setSelectedAsset] = useState<LSTAssetConfig>(
    getDefaultSelectedAsset,
  );
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);
  const [assetPriceUsd, setAssetPriceUsd] = useState<number | null>(null);
  const depositInfoRequestIdRef = useRef(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Derived synchronously when the cached list or asset changes — avoids stale-token fetches.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Bridge token type comes from SDK
  const selectedToken: any | null = React.useMemo(() => {
    if (!ethereumBridgeTokens?.length) return null;
    return pickBridgeTokenForAsset(ethereumBridgeTokens, selectedAsset.SYMBOL);
  }, [ethereumBridgeTokens, selectedAsset]);

  const { starkzapBridgeWallet, starkzapBridgeSDK } =
    useBridgeStarkzapContext();
  const theme = useTheme();
  const cd = theme?.connectDialog;

  const {
    connectors: evmConnectors,
    connect: connectEVM,
    isPending: isConnectingEVM,
  } = useConnectWagmi();
  const { disconnect: disconnectWagmi } = useDisconnectWagmi();
  // using a seperate useAccount wagmi for sep of concern ( since before our plan was a L1 mode)
  const { address: evmAddress, connector: evmConnector } = useAccountWagmi();
  const { starknetAddress } = useAccount();

  const uniqueEvm = React.useMemo(
    () =>
      evmConnectors.filter(
        (c, i, self) => i === self.findIndex((x) => x.name === c.name),
      ),
    [evmConnectors],
  );

  const fetchDepositInfo = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Bridge token type comes from SDK
    async (token: any) => {
      if (!evmWalletForBridge || !starkzapBridgeWallet) return;

      // maintaining a requestId to avoid race conditions and stale data updation
      const requestId = ++depositInfoRequestIdRef.current;
      setIsLoadingInfo(true);
      try {
        const [balance, allowance, fees, ethPrice] = await Promise.all([
          starkzapBridgeWallet.getDepositBalance(token, evmWalletForBridge),
          starkzapBridgeWallet.getAllowance(token, evmWalletForBridge),
          starkzapBridgeWallet.getDepositFeeEstimate(
            token,
            evmWalletForBridge,
            // this altough is only needed for cctp bridge but keeping it for now
            {
              fastTransfer: true,
            },
          ),
          fetchEthSpotPrice(),
        ]);

        if (requestId !== depositInfoRequestIdRef.current) return;

        let totalFeeAmount: Amount;
        if ("l1Fee" in fees && "l2Fee" in fees) {
          totalFeeAmount = fees.l1Fee.add(fees.l2Fee);
        } else if ("localFee" in fees && "interchainFee" in fees) {
          totalFeeAmount = fees.localFee.add(fees.interchainFee);
        } else {
          totalFeeAmount = Amount.parse("0", 18, "ETH");
        }

        let feeUsdValue = "$0.00";
        if (ethPrice !== null) {
          const feeInEth = parseFloat(totalFeeAmount.toUnit());
          if (Number.isFinite(feeInEth)) {
            feeUsdValue = `$${(feeInEth * ethPrice).toFixed(2)}`;
          }
        }

        setDepositInfo({
          balance: balance.toUnit(),
          allowance: allowance?.toUnit() || null,
          estimatedFees: {
            amount: totalFeeAmount.toUnit(),
            usdValue: feeUsdValue,
          },
        });
      } catch (error) {
        console.error("Failed to fetch deposit info:", error);
      } finally {
        if (requestId === depositInfoRequestIdRef.current) {
          setIsLoadingInfo(false);
        }
      }
    },
    [evmWalletForBridge, starkzapBridgeWallet],
  );

  const handleQuickAmount = (percentage: number) => {
    if (!depositInfo.balance) return;

    const balanceNum = parseFloat(depositInfo.balance);
    if (isNaN(balanceNum)) return;

    const raw = (balanceNum * percentage) / 100;
    const clamped = Number(raw.toFixed(8));
    setAmount(Number.isFinite(clamped) ? clamped.toString() : "0");
  };

  const amountUsd = React.useMemo(() => {
    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0 || !assetPriceUsd)
      return null;
    return amountNumber * assetPriceUsd;
  }, [amount, assetPriceUsd]);

  React.useEffect(() => {
    const defaultAsset = getDefaultSelectedAsset();
    setSelectedAsset((currentAsset) => {
      if (
        currentAsset &&
        lstConfig.some(
          (asset) =>
            asset.SYMBOL.toLowerCase() === currentAsset.SYMBOL.toLowerCase(),
        )
      ) {
        return currentAsset;
      }
      return defaultAsset;
    });
  }, [getDefaultSelectedAsset, lstConfig]);

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
        if (!response.ok)
          throw new Error(`Price API error: ${response.status}`);

        const payload: unknown = await response.json();
        const parsedPrice = extractPriceFromPayload(payload);

        if (!isCancelled) {
          setAssetPriceUsd(
            Number.isFinite(parsedPrice) && parsedPrice > 0
              ? parsedPrice
              : null,
          );
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

  const monitorDepositProgress = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Bridge token type comes from SDK
    async (externalTxHash: string, token: any) => {
      if (!starkzapBridgeWallet) return;

      // Clear any existing interval before starting a new one
      if (pollIntervalRef.current) {
        console.log("Clearing existing poll interval");
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      try {
        pollIntervalRef.current = setInterval(async () => {
          try {
            console.log("monitoring deposit progress.....");
            const result = await starkzapBridgeWallet.monitorDeposit(
              token,
              externalTxHash,
            );
            const state = await starkzapBridgeWallet.getDepositState(
              token,
              result,
            );

            setDepositProgress({
              externalTxHash,
              starknetTxHash: result.starknetTxHash,
              status: result.status,
              depositState: state,
            });

            if (
              state === DepositState.COMPLETED ||
              state === DepositState.ERROR
            ) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              if (state === DepositState.COMPLETED) {
                toast({ description: "Bridge completed successfully!" });
              }
            }
          } catch (error) {
            console.error("Monitor error:", error);
          }
        }, 5000);
      } catch (error) {
        console.error("Failed to start monitoring:", error);
      }
    },
    [starkzapBridgeWallet],
  );

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
      } catch (error) {
        console.error("Failed to create ConnectedEthereumWallet:", error);
        toast({
          description: "Failed to setup Ethereum wallet for bridging",
          variant: "destructive",
        });
      }
    };

    setupEvmWallet();
  }, [evmAddress, evmConnector, starkzapBridgeWallet]);

  // Close dialog and reset state when no Starknet recipient address is available.
  useEffect(() => {
    if (!starknetAddress && open) {
      setOpen(false);
      setAmount("");
      setDepositProgress(null);
      setIsBridging(false);
      setDepositInfo({});
    }
  }, [starknetAddress, open]);

  // Cache Ethereum bridge tokens once per SDK + EVM wallet; asset switches only re-pick from this list.
  useEffect(() => {
    if (!starkzapBridgeSDK || !evmWalletForBridge) {
      setEthereumBridgeTokens(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const list = await starkzapBridgeSDK.getBridgingTokens(
          ExternalChain.ETHEREUM,
        );
        if (!cancelled) setEthereumBridgeTokens(list);
      } catch (error) {
        console.error("Failed to load Ethereum bridge tokens:", error);
        if (!cancelled) setEthereumBridgeTokens(null);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [starkzapBridgeSDK, evmWalletForBridge]);

  // Fetch deposit info when the resolved token or wallet changes (not on selectedAsset alone).
  useEffect(() => {
    if (!selectedToken || !evmWalletForBridge || !starkzapBridgeWallet) {
      setDepositInfo({});
      setIsLoadingInfo(false);
      return;
    }
    void fetchDepositInfo(selectedToken);
  }, [
    selectedToken,
    evmWalletForBridge,
    starkzapBridgeWallet,
    fetchDepositInfo,
  ]);

  // Cleanup poll interval on unmount or when dialog closes
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        console.log("Cleaning up poll interval on unmount");
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  const handleDisconnectEvm = () => {
    disconnectWagmi();
    setEvmWalletForBridge(null);
  };

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    // Don't clear the interval here - transaction might still be processing
    // The interval will only clear when transaction completes/errors or component unmounts
    if (!isOpen && depositProgress?.depositState === DepositState.COMPLETED) {
      setAmount("");
      setDepositProgress(null);
      setIsBridging(false);
    }
  };

  const handleBridge = async () => {
    if (
      !starkzapBridgeWallet ||
      !starknetAddress ||
      !evmWalletForBridge ||
      !amount
    ) {
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

    // Check if amount exceeds balance
    if (depositInfo.balance) {
      // Using this parseFloat for now later on will do bignumber and more robust handling if needed
      const balanceNum = parseFloat(depositInfo.balance);
      if (!isNaN(balanceNum) && amountNum > balanceNum) {
        toast({
          description: `Insufficient balance: ${amountNum} > Available ${balanceNum}`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsBridging(true);

    try {
      if (!selectedToken) {
        throw new Error(
          `${selectedAsset.SYMBOL} token not ready — try reconnecting your ETH wallet`,
        );
      }

      const assetToken = selectedToken;

      const depositAmount = Amount.parse(
        amount,
        assetToken.decimals,
        assetToken.symbol,
      );

      if (!starknetAddress) {
        throw new Error("Starknet recipient address is not connected");
      }

      // Could use ContractAddr from our strkfarm/sdk but sdk isnt being used anywhere else
      // so thought might not be a great idea
      // Validate + normalize the Starknet address (handles padding, casing, hex format).
      let normalizedRecipient: string;
      try {
        normalizedRecipient = validateAndParseAddress(starknetAddress);
      } catch {
        throw new Error("Invalid Starknet recipient address format");
      }
      if (num.toBigInt(normalizedRecipient) === 0n) {
        throw new Error("Invalid Starknet recipient address (zero address)");
      }

      // `useAccount` returns a hex string type; StarkZap expects branded address type.
      const recipientAddress = normalizedRecipient as Address;

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
      toast({
        description: error.message || "Bridge transaction failed",
        variant: "destructive",
      });
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
    starknetAddress,
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
      const numeric =
        typeof candidate === "string" ? Number(candidate) : Number(candidate);
      if (Number.isFinite(numeric) && numeric > 0) return numeric;
    }
  }

  return NaN;
}
