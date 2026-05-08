import { BridgeTransferStatus, DepositState } from "starkzap";

export interface BridgeDialogProps {
  onBridgeSuccess?: (txHash: string) => void;
  onBridgeError?: (error: Error) => void;
  style?: {
    buttonStyles?: React.CSSProperties;
    modalStyles?: React.CSSProperties;
  };
  className?: string;
  lstConfig?: LSTAssetConfig[];
}

export interface LSTAssetConfig {
  SYMBOL: string;
  ASSET_ADDRESS: string;
  LST_SYMBOL: string;
  DECIMALS: number;
  CATEGORY: "STRK" | "BTC";
  DISPLAY_NAME?: string;
  DESCRIPTION?: string;
  LST_ADDRESS?: string;
  WITHDRAWAL_QUEUE_ADDRESS?: string;
}

export interface DepositInfo {
  balance?: string;
  allowance?: string | null;
  estimatedFees?: {
    amount: string;
    usdValue: string;
  };
}

export interface DepositProgress {
  externalTxHash: string;
  starknetTxHash?: string;
  status: BridgeTransferStatus;
  depositState: DepositState;
}
