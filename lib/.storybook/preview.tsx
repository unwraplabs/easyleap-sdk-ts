import type { Preview } from "@storybook/react";
import React from "react";
import { InjectedConnector } from "@starknet-react/core";
import { WebWalletConnector } from "starknetkit/webwallet";

import "../src/styles.css";

import {
  defaultEasyleapConfig,
  EasyleapProvider,
  EasyleapConfig
} from "../src/components/EasyleapProvider";

const easyleapConfig: EasyleapConfig = {
  theme: {}
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  },
  decorators: [
    (Story) => (
      <EasyleapProvider
        starknetConfig={{
          chains: defaultEasyleapConfig().starknetConfig.chains,
          provider: defaultEasyleapConfig().starknetConfig.provider,
          explorer: defaultEasyleapConfig().starknetConfig.explorer,
          connectors: [
            new WebWalletConnector(),
            new InjectedConnector({ options: { id: "argentX" } }),
            new InjectedConnector({ options: { id: "braavos" } }),
            new InjectedConnector({
              options: { id: "metamask", name: "MetaMask" }
            })
          ]
        }}
        theme={easyleapConfig.theme}
      >
        <Story />
      </EasyleapProvider>
    )
  ]
};

export default preview;
