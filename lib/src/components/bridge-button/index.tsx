import { BridgeDialog } from "@lib/components/bridge-dialog";

export interface BridgeButtonProps {
    onBridgeSuccess?: (txHash: string) => void;
    onBridgeError?: (error: Error) => void;
    style?: {
        buttonStyles?: React.CSSProperties;
        modalStyles?: React.CSSProperties;
    };
    className?: string;
}

export const BridgeButton: React.FC<BridgeButtonProps> = ({
    onBridgeSuccess,
    onBridgeError,
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
                style={style}
                className={className}
            />
        </div>
    );
};
