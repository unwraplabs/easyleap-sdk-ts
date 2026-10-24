import { BridgeDialog } from "@lib/components/bridge-dialog";

export interface BridgeButtonProps {
    onBridgeSuccess?: (txHash: string) => void;
    onBridgeError?: (error: Error) => void;
    /** See BridgeDialogProps.onStakeAsset */
    onStakeAsset?: (symbol: string) => void;
    style?: {
        buttonStyles?: React.CSSProperties;
        modalStyles?: React.CSSProperties;
    };
    className?: string;
}

export const BridgeButton: React.FC<BridgeButtonProps> = ({
    onBridgeSuccess,
    onBridgeError,
    onStakeAsset,
    style = {
        buttonStyles: {},
        modalStyles: {}
    },
    className = ""
}) => {
    return (
        <div>
            <BridgeDialog
                onBridgeSuccess={onBridgeSuccess}
                onBridgeError={onBridgeError}
                onStakeAsset={onStakeAsset}
                style={style}
                className={className}
            />
        </div>
    );
};
