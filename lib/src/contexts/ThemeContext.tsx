import React from "react";

export interface GlobalTheme {
  noneMode?: {
    backgroundColor?: string;
    color?: string;
    border?: string;
  };
  starknetMode?: {
    mainBgColor?: string;

    button?: {
      backgroundColor?: string;
      color?: string;
      border?: string;
      borderRadius?: string;
    };

    switchButton?: {
      backgroundColor?: string;
      color?: string;
      border?: string;
      borderRadius?: string;
    };

    historyButton?: {
      backgroundColor?: string;
      color?: string;
      border?: string;
    };
  };
  evmMode?: {
    mainBgColor?: string;

    button?: {
      backgroundColor?: string;
      color?: string;
      border?: string;
      borderRadius?: string;
    };

    switchButton?: {
      backgroundColor?: string;
      color?: string;
      border?: string;
      borderRadius?: string;
    };

    historyButton?: {
      backgroundColor?: string;
      color?: string;
      border?: string;
    };
  };

  // BRIDGE MODE - bridgeMode theme commented out (reserved for future use)
  // bridgeMode?: {
  //   mainBgColor?: string;
  //   starknetButton?: {
  //     backgroundColor?: string;
  //     color?: string;
  //     border?: string;
  //     borderRadius?: string;
  //   };
  //   evmButton?: {
  //     backgroundColor?: string;
  //     color?: string;
  //     border?: string;
  //     borderRadius?: string;
  //   };
  //   switchButton?: {
  //     backgroundColor?: string;
  //     color?: string;
  //     border?: string;
  //     borderRadius?: string;
  //   };
  //   historyButton?: {
  //     backgroundColor?: string;
  //     color?: string;
  //     border?: string;
  //   };
  // };

  /** Connect wallet modal (dark dialog); override `accent` per brand (e.g. green / purple). */
  connectDialog?: {
    modalBackground?: string;
    modalBorder?: string;
    modalBorderRadius?: string;
    titleColor?: string;
    mutedTextColor?: string;
    /** Active “All chains” tab pill, row hover emphasis, multichain dot */
    accent?: string;
    /** Active tab pill label color (often dark on light accent) */
    accentForeground?: string;
    tabBarBorder?: string;
    tabInactiveBackground?: string;
    rowBorder?: string;
    rowHoverBackground?: string;
    rowTextColor?: string;
    closeButtonColor?: string;
    moreOptionsBackground?: string;
    moreOptionsTextColor?: string;
  };

  /** Bridge dialog colors */
  bridgeDialog?: {
    modalBackground?: string;
    modalBorder?: string;
    modalBorderRadius?: string;
    titleColor?: string;
    infoBackgroundColor?: string;
    infoTextColor?: string;
    mutedTextColor?: string;
    primaryTextColor?: string;
    darkTextColor?: string;
    borderColor?: string;
    borderHoverColor?: string;
    focusBorderColor?: string;
    primaryButtonBackground?: string;
    primaryButtonHoverBackground?: string;
    primaryButtonActiveBackground?: string;
    disabledButtonBackground?: string;
    percentageButtonBackground?: string;
    percentageButtonHoverBackground?: string;
    percentageButtonTextColor?: string;
    percentageButtonHoverTextColor?: string;
    dropdownBackground?: string;
    dropdownBorder?: string;
    dropdownHoverBackground?: string;
    dropdownHoverTextColor?: string;
    summaryLabelColor?: string;
    walletConnectRowBorder?: string;
    walletConnectRowBackground?: string;
    walletConnectRowTextColor?: string;
    iconBorderColor?: string;
    inputPlaceholderColor?: string;
  };
}

const defaultTheme: GlobalTheme = {
  noneMode: {
    backgroundColor: "none",
    color: "#FFFFFF",
    border: "2px solid #423F52"
  },
  starknetMode: {
    mainBgColor: "#1B182B",

    button: {
      backgroundColor: "#1B182B",
      color: "#FFFFFF",
      border: "2px solid #423F52",
      borderRadius: "40px"
    },

    switchButton: {
      backgroundColor: "#1B182B",
      color: "#FFFFFF",
      border: "2px solid #423F52"
    },

    historyButton: {
      backgroundColor: "#423F52",
      color: "#FFFFFF",
      border: "2px solid #423F52"
    }
  },
  evmMode: {
    mainBgColor: "#1B182B",

    button: {
      backgroundColor: "#1B182B",
      color: "#FFFFFF",
      border: "2px solid #423F52",
      borderRadius: "40px"
    },

    switchButton: {
      backgroundColor: "#1B182B",
      color: "#FFFFFF",
      border: "2px solid #423F52"
    },

    historyButton: {
      backgroundColor: "#423F52",
      color: "#FFFFFF",
      border: "2px solid #423F52"
    }
  },

  connectDialog: {
    modalBackground: "#1A1A2E",
    modalBorder: "1px solid #3F3F5F",
    modalBorderRadius: "16px",
    titleColor: "#E8E8F0",
    mutedTextColor: "#9898B0",
    accent: "#B4A7D6",
    accentForeground: "#1A1528",
    tabBarBorder: "1px solid #3F3F5F",
    tabInactiveBackground: "transparent",
    rowBorder: "1px solid #3F3F5F",
    rowHoverBackground: "#2A2A45",
    rowTextColor: "#E8E8F0",
    closeButtonColor: "#B4A7D6"
  },

  bridgeDialog: {
    modalBackground: "#fff",
    modalBorder: "1px solid #e5e8eb",
    modalBorderRadius: "10px",
    titleColor: "#03624c",
    infoBackgroundColor: "#e8f5f1",
    infoTextColor: "#03624c",
    mutedTextColor: "#6b7780",
    primaryTextColor: "#101828",
    darkTextColor: "#1a1f24",
    borderColor: "#e5e8eb",
    borderHoverColor: "#cbd0d5",
    focusBorderColor: "#17876d",
    primaryButtonBackground: "#17876d",
    primaryButtonHoverBackground: "#14755f",
    primaryButtonActiveBackground: "#116652",
    disabledButtonBackground: "#C9D1D6",
    percentageButtonBackground: "#f5f7f8",
    percentageButtonHoverBackground: "#ebeef0",
    percentageButtonTextColor: "#6b7780",
    percentageButtonHoverTextColor: "#4a5565",
    dropdownBackground: "#fff",
    dropdownBorder: "#e5e8eb",
    dropdownHoverBackground: "#ebeef0",
    dropdownHoverTextColor: "#1a1f24",
    summaryLabelColor: "#0d5f4e",
    walletConnectRowBorder: "1px solid #e5e8eb",
    walletConnectRowBackground: "#fff",
    walletConnectRowTextColor: "#000",
    iconBorderColor: "#DBDBDB",
    inputPlaceholderColor: "#8D9C9C"
  },

  // BRIDGE MODE - bridgeMode default theme commented out
  // bridgeMode: {
  //   mainBgColor: "#1B182B",
  //   starknetButton: { backgroundColor: "#35314F", color: "#FFFFFF" },
  //   evmButton: { backgroundColor: "#1B182B", color: "#FFFFFF", border: "2px solid #423F52" },
  //   switchButton: { backgroundColor: "#1B182B", color: "#FFFFFF", border: "2px solid #423F52" },
  //   historyButton: { backgroundColor: "#423F52", color: "#FFFFFF", border: "2px solid #423F52" }
  // }
};

const ThemeContext = React.createContext<GlobalTheme>(defaultTheme);

export const ThemeProvider = ({
  theme,
  children
}: {
  theme?: GlobalTheme;
  children: React.ReactNode;
}) => {
  const mergedTheme: GlobalTheme = {
    ...defaultTheme,
    ...theme,
    connectDialog: {
      ...defaultTheme.connectDialog,
      ...theme?.connectDialog
    },
    bridgeDialog: {
      ...defaultTheme.bridgeDialog,
      ...theme?.bridgeDialog
    }
  };

  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => React.useContext(ThemeContext);
