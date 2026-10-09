import type { Preview } from "@storybook/react";
import React from "react";

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
        starknetConfig={defaultEasyleapConfig().starknetConfig}
        theme={easyleapConfig.theme}
      >
        <Story />
      </EasyleapProvider>
    )
  ]
};

export default preview;
