import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArgentXV050Preset, StarkZap, type WalletInterface } from "starkzap";
import { useLogin, useLogout, usePrivy, useUser } from "@privy-io/react-auth";
import { toast } from "@lib/hooks/use-toast";
import { logger } from "@lib/utils/logger";

export interface PrivyProviderConfig {
  rpcUrl: string;
  network: "mainnet" | "sepolia";
}

export interface PrivyWalletData {
  walletId: string;
  address: string;
  publicKey: string;
}

export interface PrivyContextValue {
  privyWallet: PrivyWalletData | null;
  starkzapWallet: WalletInterface | null;
  walletSetupStep: "idle" | "creating" | "deploying" | "complete";
  isLoadingWallet: boolean;
  connectPrivy: () => Promise<void>;
  disconnectPrivy: () => Promise<void>;
  user: any;
  config?: PrivyProviderConfig;
}

const PrivyContext = createContext<PrivyContextValue | null>(null);

export const PrivyContextProvider: React.FC<{
  children: React.ReactNode;
  config?: PrivyProviderConfig;
}> = ({ children, config }) => {
  const { login } = useLogin();
  const { logout } = useLogout();
  const { user } = useUser();
  const { getAccessToken } = usePrivy();

  const [privyWallet, setPrivyWallet] = useState<PrivyWalletData | null>(null);
  const [starkzapWallet, setStarkzapWallet] = useState<WalletInterface | null>(
    null,
  );
  const [walletSetupStep, setWalletSetupStep] = useState<
    "idle" | "creating" | "deploying" | "complete"
  >("idle");
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);

  // Ref to track if wallet setup is in progress
  const setupInProgressRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  async function createWallet(token: string): Promise<PrivyWalletData> {
    logger.verbose("[PrivyContext] Creating wallet...");
    setWalletSetupStep("creating");

    const response = await fetch(`/api/wallet/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to create wallet");
    }

    const data = await response.json();

    if (!data.wallet) {
      throw new Error("Wallet creation returned empty result");
    }

    logger.verbose("[PrivyContext] Wallet created", {
      walletId: data.wallet.walletId,
    });

    const newWallet: PrivyWalletData = {
      walletId: data.wallet.walletId,
      address: data.wallet.address,
      publicKey: data.wallet.publicKey,
    };
    setPrivyWallet(newWallet);

    return newWallet;
  }

  // Setup wallet function
  const setupWallet = async (userJwt: string) => {
    if (setupInProgressRef.current) {
      logger.verbose(
        "[PrivyContext] Wallet setup already in progress, skipping",
      );
      return;
    }

    let wallet: PrivyWalletData | null = null;

    setupInProgressRef.current = true;
    setIsLoadingWallet(true);

    try {
      logger.verbose("[PrivyContext] Fetching wallet from database...");

      // Check database for existing wallet
      const getWalletRes = await fetch(`/api/wallet`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${userJwt}`,
        },
      });

      if (!getWalletRes.ok) {
        throw new Error("Failed to fetch wallet");
      }

      const data = await getWalletRes.json();
      wallet = data.wallet;

      if (!wallet) {
        logger.verbose(
          "[PrivyContext] No wallet found, creating new wallet...",
        );
        wallet = await createWallet(userJwt);
      } else {
        logger.verbose("[PrivyContext] Wallet found in database", {
          walletId: wallet.walletId,
        });
      }

      if (!wallet) {
        throw new Error("Wallet unavailable after fetch/create");
      }

      setPrivyWallet(wallet);

      // Initialize Starkzap
      if (!config?.rpcUrl) {
        throw new Error(
          "Missing rpcUrl for Privy/StarkZap. Provide `starkzap.rpcUrl` to EasyleapProvider or set NEXT_PUBLIC_RPC_URL.",
        );
      }

      const sdk = new StarkZap({
        network: config.network ?? "mainnet",
        rpcUrl: config.rpcUrl,
        paymaster: {
          nodeUrl: `/api/paymaster`,
          headers: {
            Authorization: `Bearer ${userJwt}`,
          },
        },
      });

      const onboard = await sdk.onboard({
        strategy: "privy",
        accountPreset: ArgentXV050Preset,
        feeMode: "sponsored",
        deploy: "if_needed",
        privy: {
          resolve: async () => {
            // This will never happen: it is ensured above
            if (!wallet) {
              return {
                walletId: "",
                publicKey: "",
                serverUrl: "",
              };
            }

            const serverUrl =
              typeof window !== "undefined"
                ? `${window.location.origin}/api/wallet/sign`
                : `/api/wallet/sign`;

            return {
              walletId: wallet.walletId,
              publicKey: wallet.publicKey,
              serverUrl,
              headers: async () => {
                const token = await getAccessToken();
                if (!token) {
                  throw new Error(
                    "Failed to get access token for wallet signing",
                  );
                }
                return { Authorization: `Bearer ${token}` };
              },
            };
          },
        },
      });

      setWalletSetupStep("complete");

      // The following wallet is to be used
      const connectedWallet = onboard.wallet;
      setStarkzapWallet(connectedWallet);
      logger.verbose("[PrivyContext] Wallet connected", { connectedWallet });
    } catch (error: any) {
      logger.error("[PrivyContext] Error setting up wallet", error);
      toast({
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setWalletSetupStep("idle");
      setPrivyWallet(null);
      setStarkzapWallet(null);
      lastUserIdRef.current = null;

      // Clear Privy session so the user can re-login
      try {
        await logout();
      } catch (error: any) {
        logger.error("[PrivyContext] logout failed.. check asap ", error);
        // Logout may fail if session is already invalid; clear storage manually
        // TODO: very rare occurence but can do it later on
        // Can add backoff based logout. or clearning manually
      }

      // Safety net: remove known Privy localStorage keys
      const privyKeys = [
        "privy:token",
        "privy:pat",
        "privy:refresh_token",
        "privy:state_code",
        "privy:code_verifier",
        "privy:connections",
      ];
      for (const k of privyKeys) {
        try {
          localStorage.removeItem(k);
        } catch {
          // ignore (SSR or storage unavailable)
        }
      }
    } finally {
      setIsLoadingWallet(false);
      setupInProgressRef.current = false;
    }
  };

  // Minimal useEffect - only runs when user changes
  useEffect(() => {
    if (!user || typeof window === "undefined") {
      logger.verbose("[PrivyContext] User logged out, clearing wallet state");
      setPrivyWallet(null);
      setStarkzapWallet(null);
      setWalletSetupStep("idle");
      lastUserIdRef.current = null;
      setupInProgressRef.current = false;
      return;
    }

    // Only setup if user changed
    const currentUserId = user.id;
    if (lastUserIdRef.current === currentUserId) {
      logger.verbose("[PrivyContext] Same user, skipping wallet setup");
      return;
    }

    lastUserIdRef.current = currentUserId;
    logger.verbose("[PrivyContext] User changed, setting up wallet", {
      userId: currentUserId,
    });

    // Get JWT and setup wallet
    getAccessToken()
      .then((userJwt: string | null) => {
        if (!userJwt) {
          logger.warn("[PrivyContext] Failed to get user JWT");
          return;
        }
        setupWallet(userJwt);
      })
      .catch((error: any) => {
        logger.error("[PrivyContext] Error getting access token", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const connectPrivy = async () => {
    try {
      login({ loginMethods: ["google", "email"] });
    } catch (error) {
      console.error("Failed to login with Privy:", error);
      toast({
        description: "Failed to connect with Privy",
        variant: "destructive",
      });
    }
  };

  const disconnectPrivy = async () => {
    try {
      await logout();
      setPrivyWallet(null);
      setStarkzapWallet(null);
      setWalletSetupStep("idle");
      lastUserIdRef.current = null;
      setupInProgressRef.current = false;
    } catch (error) {
      console.error("Failed to disconnect Privy:", error);
      throw error;
    }
  };

  const value: PrivyContextValue = {
    privyWallet,
    starkzapWallet,
    walletSetupStep,
    isLoadingWallet,
    connectPrivy,
    disconnectPrivy,
    user,
    config,
  };

  return (
    <PrivyContext.Provider value={value}>{children}</PrivyContext.Provider>
  );
};

export const usePrivyContext = (): PrivyContextValue => {
  const context = useContext(PrivyContext);

  if (!context) {
    // Return default values when Privy is not configured
    return {
      privyWallet: null,
      starkzapWallet: null,
      walletSetupStep: "idle",
      isLoadingWallet: false,
      connectPrivy: async () => {
        console.warn(
          "Privy is not configured. Please set NEXT_PUBLIC_PRIVY_APP_ID environment variable.",
        );
      },
      disconnectPrivy: async () => {},
      user: null,
    };
  }

  return context;
};
