import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";

import { BridgeButton } from "./index";

const meta = {
  title: "Components/BridgeButton",
  component: BridgeButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    style: { control: { type: "object" } },
    className: { control: { type: "text" } },
  },
  args: {
    onBridgeSuccess: fn(),
    onBridgeError: fn(),
  },
  decorators: [(Story) => <Story />],
} satisfies Meta<typeof BridgeButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    style: {
      buttonStyles: {
        color: "#03624C",
        backgroundColor: "#AACBC433",
        border: "1px solid #ECECED80",
      },
      modalStyles: {
        borderRadius: "10px",
      },
    },
    className:
      "flex h-8 items-center justify-center gap-2 rounded-lg border border-[#ECECED80] bg-[#AACBC433] text-xs font-bold text-[#03624C] focus-visible:outline-[#03624C] md:h-10 md:text-sm",
  },
};
