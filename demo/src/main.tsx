import { InjectedConnector, jsonRpcProvider } from "@starknet-react/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WebWalletConnector } from "starknetkit/webwallet";

import { Toaster } from "@/components/ui/toaster.tsx";

import { defaultEasyleapConfig, EasyleapProvider } from "@easyleap/sdk";

import App from "./App.tsx";

import "@easyleap/sdk/styles.css";
import "./index.css";

const provider = jsonRpcProvider({
  rpc: () => {
    return {
      nodeUrl:
        "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/dC6tFhuox73F7S8TLlTId",
    };
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <EasyleapProvider
      starknetConfig={{
        chains: defaultEasyleapConfig().starknetConfig.chains,
        provider,
        explorer: defaultEasyleapConfig().starknetConfig.explorer,
        connectors: [
          new WebWalletConnector(),
          new InjectedConnector({ options: { id: "argentX" } }),
          new InjectedConnector({ options: { id: "braavos" } }),
        ],
      }}
    >
      <App />
      <Toaster />
    </EasyleapProvider>
  </StrictMode>,
);
