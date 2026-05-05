import { ButtonDialog } from "@lib/components/button-dialog";

export interface ConnectButtonProps {
    onConnectStarknet?: () => void;
    onDisconnectStarknet?: () => void;
    onConnectEVM?: () => void;
    onDisconnectEVM?: () => void;
    style?: {
        buttonStyles?: React.CSSProperties;
        modalStyles?: React.CSSProperties;
    };
    className?: string;
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({
    onConnectStarknet,
    onDisconnectStarknet,
    onConnectEVM,
    onDisconnectEVM,
    style = {
        buttonStyles: {},
        modalStyles: {}
    },
    className = ""
}) => {
    return (
        <div>
            <ButtonDialog
                onConnectStarknet={onConnectStarknet}
                onDisconnectStarknet={onDisconnectStarknet}
                onConnectEVM={onConnectEVM}
                onDisconnectEVM={onDisconnectEVM}
                style={style}
                className={className}
            />
        </div>
    );
};
