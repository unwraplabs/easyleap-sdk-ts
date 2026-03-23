import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArgentXV050Preset, StarkZap } from "starkzap";
import { useLogin, useLogout, usePrivy, useUser } from "@privy-io/react-auth";
import { toast } from "@lib/hooks/use-toast";

// Logging utility
const log = (message: string, data?: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[PrivyContext] ${message}`, data || "");
  }
};

export interface PrivyWalletData {
  walletId: string;
  address: string;
  publicKey: string;
  isDeployed: boolean;
}

export interface PrivyContextValue {
  privyWallet: PrivyWalletData | null;
  walletSetupStep: "idle" | "creating" | "deploying" | "complete";
  isLoadingWallet: boolean;
  connectPrivy: () => Promise<void>;
  disconnectPrivy: () => Promise<void>;
  user: any;
}

const PrivyContext = createContext<PrivyContextValue | null>(null);

const API = "http://localhost:3000/api";

export const PrivyContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { login } = useLogin();
  const { logout } = useLogout();
  const { user } = useUser();
  const { getAccessToken } = usePrivy();

  const [privyWallet, setPrivyWallet] = useState<PrivyWalletData | null>(null);
  const [walletSetupStep, setWalletSetupStep] = useState<
    "idle" | "creating" | "deploying" | "complete"
  >("idle");
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);

  // Ref to track if wallet setup is in progress
  const setupInProgressRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  // Deploy wallet function
  // const deployWallet = async (walletId: string, userJwt: string) => {
  //   log("Deploying wallet...", { walletId });
  //   setWalletSetupStep("deploying");

  //   try {
  //     const deployRes = await fetch("/api/privy/deploy-wallet", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${userJwt}`,
  //       },
  //       body: JSON.stringify({ walletId }),
  //     });

  //     if (!deployRes.ok) {
  //       const errorData = await deployRes.json().catch(() => ({}));
  //       throw new Error(errorData?.error || "Failed to deploy wallet");
  //     }

  //     const deployData = await deployRes.json();
  //     log("Wallet deployed", { transactionHash: deployData.transactionHash });

  //     // Update state with deployed wallet
  //     setPrivyWallet((prev) =>
  //       prev
  //         ? {
  //             ...prev,
  //             isDeployed: true,
  //           }
  //         : null,
  //     );

  //     setWalletSetupStep("complete");
  //     toast({
  //       description: "Wallet created and deployed successfully!",
  //     });
  //   } catch (error: any) {
  //     log("Error deploying wallet", error);
  //     throw error;
  //   }
  // };

  // Create and deploy wallet function
  // const createAndDeployWallet = async (userJwt: string) => {
  //   log("Creating wallet...");
  //   setWalletSetupStep("creating");

  //   try {
  //     const createRes = await fetch("/api/privy/create-wallet", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${userJwt}`,
  //       },
  //     });

  //     if (!createRes.ok) {
  //       const errorData = await createRes.json().catch(() => ({}));
  //       throw new Error(errorData?.error || "Failed to create wallet");
  //     }

  //     const createData = await createRes.json();
  //     log("Wallet created", { walletId: createData.walletId });

  //     // Update state with created wallet
  //     const newWallet: PrivyWalletData = {
  //       walletId: createData.walletId,
  //       address: createData.address,
  //       publicKey: createData.publicKey,
  //       isDeployed: false,
  //     };
  //     setPrivyWallet(newWallet);

  //     // Deploy wallet
  //     await deployWallet(createData.walletId, userJwt);
  //   } catch (error: any) {
  //     log("Error creating wallet", error);
  //     throw error;
  //   }
  // };

  async function createWallet(token: string) {
    log("Creating wallet...");
    setWalletSetupStep("creating");

    try {
      const response = await fetch(`${API}/wallet/create`, {
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
      log("Wallet created", { walletId: data.wallet.walletId });

      // Update state with created wallet
      const newWallet: PrivyWalletData = {
        walletId: data.wallet.walletId,
        address: data.wallet.address,
        publicKey: data.wallet.publicKey,
        isDeployed: false,
      };
      setPrivyWallet(newWallet);

      return data.wallet;
    } catch (error: unknown) {
      console.error("Unable to set up wallet", error);
    }
  }

  // Setup wallet function
  const setupWallet = async (userJwt: string) => {
    if (setupInProgressRef.current) {
      log("Wallet setup already in progress, skipping");
      return;
    }

    let wallet: PrivyWalletData | null = null;

    setupInProgressRef.current = true;
    setIsLoadingWallet(true);

    try {
      log("Fetching wallet from database...");

      // Check database for existing wallet
      const getWalletRes = await fetch(`${API}/privy/get-wallet`, {
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
        log("No wallet found, creating new wallet...");
        wallet = await createWallet(userJwt);
      } else {
        log("Wallet found in database", {
          walletId: wallet.walletId,
          isDeployed: wallet.isDeployed,
        });
      }

      setPrivyWallet(wallet);

      console.log(">>>>>> Before starkzap init <<<<<<");

      // Initialize Starkzap
      const sdk = new StarkZap({
        network: "mainnet",
        // network: "mainnet",
        rpcUrl:
          "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/dC6tFhuox73F7S8TLlTId",
        paymaster: {
          nodeUrl: `${API}/paymaster`,
        },
      });

      console.log(">>>>>> After starkzap init <<<<<<");

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

            return {
              walletId: wallet.walletId,
              publicKey: wallet.publicKey,
              serverUrl: `${API}/wallet/sign`,
            };
          },
        },
      });

      console.log(">>>>>> After calling onboard <<<<<<");

      setWalletSetupStep("complete");

      // The following wallet is to be used
      const connectedWallet = onboard.wallet;
      console.log(
        "===================== Connected wallet: ",
        { connectedWallet },
        "===========================",
      );

      // if (wallet) {
      //   log("Wallet found in database", {
      //     walletId: wallet.walletId,
      //     isDeployed: wallet.isDeployed,
      //   });

      //   // Wallet exists in DB
      //   const walletData: PrivyWalletData = {
      //     walletId: wallet.walletId,
      //     address: wallet.address,
      //     publicKey: wallet.publicKey,
      //     isDeployed: wallet.isDeployed,
      //   };
      //   setPrivyWallet(walletData);

      //   if (wallet.isDeployed) {
      //     // Wallet is ready
      //     log("Wallet is already deployed");
      //     setWalletSetupStep("complete");
      //   } else {
      //     // Wallet exists but not deployed - deploy it
      //     log("Wallet exists but not deployed, deploying...");
      //     await deployWallet(wallet.walletId, userJwt);
      //   }
      // } else {
      //   // No wallet exists - create and deploy
      //   log("No wallet found, creating new wallet...");
      //   await createAndDeployWallet(userJwt);
      // }
    } catch (error: any) {
      log("Error setting up wallet", error);
      toast({
        description:
          error?.message || "Failed to setup wallet. Please try again.",
        variant: "destructive",
      });
      setWalletSetupStep("idle");
      console.log(">>>>> set privy wallet set to null, line: 304 <<<<<");
      setPrivyWallet(null);
    } finally {
      setIsLoadingWallet(false);
      setupInProgressRef.current = false;
    }
  };

  // Minimal useEffect - only runs when user changes
  useEffect(() => {
    if (!user || typeof window === "undefined") {
      log("User logged out, clearing wallet state");
      console.log(">>>>> set privy wallet set to null, line: 316 <<<<<");
      setPrivyWallet(null);
      setWalletSetupStep("idle");
      lastUserIdRef.current = null;
      setupInProgressRef.current = false;
      return;
    }

    // Only setup if user changed
    const currentUserId = user.id;
    if (lastUserIdRef.current === currentUserId) {
      log("Same user, skipping wallet setup");
      return;
    }

    lastUserIdRef.current = currentUserId;
    log("User changed, setting up wallet", { userId: currentUserId });

    // Get JWT and setup wallet
    getAccessToken()
      .then((userJwt: string | null) => {
        if (!userJwt) {
          log("Failed to get user JWT");
          return;
        }
        setupWallet(userJwt);
      })
      .catch((error: any) => {
        log("Error getting access token", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const connectPrivy = async () => {
    try {
      login();
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
      console.log(">>>>> set privy wallet set to null, line: 364 <<<<<");
      setPrivyWallet(null);
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
    walletSetupStep,
    isLoadingWallet,
    connectPrivy,
    disconnectPrivy,
    user,
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
