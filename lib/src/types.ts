import { BridgeTransferStatus, DepositState } from "starkzap";

export interface BridgeDialogProps {
  onBridgeSuccess?: (txHash: string) => void;
  onBridgeError?: (error: Error) => void;
  /**
   * Shows "Stake <asset> →" on the bridge options; called with the asset symbol after the dialog
   * closes, so the app can take the user to that asset's staking form
   */
  onStakeAsset?: (symbol: string) => void;
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
