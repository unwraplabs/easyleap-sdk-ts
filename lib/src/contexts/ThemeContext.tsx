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
    }
  };

  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => React.useContext(ThemeContext);
