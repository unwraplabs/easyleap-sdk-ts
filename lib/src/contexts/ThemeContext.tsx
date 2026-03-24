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
  const mergedTheme = { ...defaultTheme, ...theme };

  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => React.useContext(ThemeContext);
