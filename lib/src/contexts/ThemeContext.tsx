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
    /**
     * Primary font stack for connect trigger, modal, and mode switch (e.g. `"Figtree", sans-serif`).
     * Host apps using `next/font` can pass `font.style.fontFamily` here for optimized loading.
     */
    fontFamily?: string;
  };

  /** Bridge dialog colors */
  bridgeDialog?: {
    // Base colors
    // TODO: when doing for Troves we will rename to brandMain or use brandPurple for Troves
    white?: string;
    black?: string;
    brandGreen?: string;
    brandGreenHover?: string;
    brandGreenActive?: string;
    brandGreenDark?: string;
    brandGreenDarker?: string;
    brandGreenDarkest?:string;
    brandGreenLight?: string;
    
    // Gray scale
    gray50?: string;
    gray100?: string;
    gray200?: string;
    gray300?: string;
    gray350?: string;
    gray400?: string;
    gray500?: string;
    gray600?: string;
    gray700?: string;
    gray800?: string;
    gray900?: string;
    gray1000?: string;
    gray1100?: string;
    gray1200?: string;
    
    // Border colors
    iconBorderColor?: string;
    cardHoverBackground?: string;
    modalBorder?: string;
    modalBorderRadius?: string;
    providerExternalIconOpacity?: number;
    providerExternalIconHoverOpacity?: number;
    /**
     * Primary font stack for bridge dialog (trigger, modal, options, progress).
     * Host apps using `next/font` can pass `font.style.fontFamily` here.
     */
    fontFamily?: string;

    
    // Component-specific aliases (currently unused in bridge-dialog views)
    // modalBackground?: string;
    // modalBorder?: string;
    // modalBorderRadius?: string;
    // titleColor?: string;
    // infoBackgroundColor?: string;
    // infoTextColor?: string;
    // mutedTextColor?: string;
    // primaryTextColor?: string;
    // darkTextColor?: string;
    // borderColor?: string;
    // borderHoverColor?: string;
    // focusBorderColor?: string;
    // primaryButtonBackground?: string;
    // primaryButtonHoverBackground?: string;
    // primaryButtonActiveBackground?: string;
    // disabledButtonBackground?: string;
    // percentageButtonBackground?: string;
    // percentageButtonHoverBackground?: string;
    // percentageButtonTextColor?: string;
    // percentageButtonHoverTextColor?: string;
    // dropdownBackground?: string;
    // dropdownBorder?: string;
    // dropdownItemBackground?: string;
    // dropdownItemHoverBackground?: string;
    // dropdownItemHoverTextColor?: string;
    // dropdownHoverBackground?: string;
    // dropdownHoverTextColor?: string;
    // summaryLabelColor?: string;
    // walletConnectRowBorder?: string;
    // walletConnectRowBackground?: string;
    // walletConnectRowTextColor?: string;
    // inputPlaceholderColor?: string;
    // assetChipBackground?: string;
    // assetChipBorderColor?: string;
    // assetChipTextColor?: string;
    // assetChipHoverBackground?: string;
    // assetChipHoverBorderColor?: string;
    // assetChipSelectedBackground?: string;
    // assetChipSelectedTextColor?: string;
    // providerCardBorderColor?: string;
    // providerCardHoverBorderColor?: string;
    // providerCardBackground?: string;
    // providerCardHoverBackground?: string;
    // providerCardStarkgateBackground?: string;
    // providerCardStarkgateHoverBackground?: string;
    // providerNameColor?: string;
    // providerExternalIconOpacity?: number;
    // providerExternalIconHoverOpacity?: number;
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
    closeButtonColor: "#B4A7D6",
    fontFamily: '__Figtree_ea4a8b,__Figtree_Fallback_ea4a8b, Figtree, sans-serif'
  },

  bridgeDialog: {
    // Base colors
    white: "#FFFFFF",
    black: "#000000",
    brandGreen: "#17876D",
    brandGreenHover: "#14755F",
    brandGreenActive: "#116652",
    brandGreenDark: "#03624C",
    brandGreenDarker: "#0D5F4E",
    brandGreenDarkest: "#135638",
    brandGreenLight: "#E8F5F1",
    
    // Gray scale
    gray50: "#F9FAFB",
    gray100: "#F5F7F8",
    gray200: "#EBEEF0",
    gray300: "#E5E8EB",
    gray350: "#E5E7EB",
    gray400: "#D1D5DC",
    gray500: "#CBD0D5",
    gray600: "#C9D1D6",
    gray700: "#9CA3AF",
    gray800: "#8D9C9C",
    gray900: "#6B7780",
    gray1000: "#4A5565",
    gray1100: "#1A1F24",
    gray1200: "#101828",
    
    // Border colors
    iconBorderColor: "#DBDBDB",
    cardHoverBackground: "#FAFBFC",
    
    modalBorder: "1px solid #ECECED80",
    modalBorderRadius: "10px",
    providerExternalIconOpacity: 0.4,
    providerExternalIconHoverOpacity: 0.7,
    fontFamily: '__Figtree_ea4a8b,__Figtree_Fallback_ea4a8b, Figtree, sans-serif',

    // Component-specific aliases using base colors (currently unused in bridge-dialog views)
    // modalBackground: "#FFFFFF", // white
    // titleColor: "#03624C", // brandGreenDark
    // infoBackgroundColor: "#E8F5F1", // brandGreenLight
    // infoTextColor: "#03624C", // brandGreenDark
    // mutedTextColor: "#6B7780", // gray900
    // primaryTextColor: "#101828", // gray1200
    // darkTextColor: "#1A1F24", // gray1100
    // borderColor: "#E5E8EB", // gray300
    // borderHoverColor: "#CBD0D5", // gray500
    // focusBorderColor: "#17876D", // brandGreen
    // primaryButtonBackground: "#17876D", // brandGreen
    // primaryButtonHoverBackground: "#14755F", // brandGreenHover
    // primaryButtonActiveBackground: "#116652", // brandGreenActive
    // disabledButtonBackground: "#C9D1D6", // gray600
    // percentageButtonBackground: "#F5F7F8", // gray100
    // percentageButtonHoverBackground: "#EBEEF0", // gray200
    // percentageButtonTextColor: "#6B7780", // gray900
    // percentageButtonHoverTextColor: "#4A5565", // gray1000
    // dropdownBackground: "#FFFFFF", // white
    // dropdownBorder: "#E5E8EB", // gray300
    // dropdownItemBackground: "#FFFFFF", // white
    // dropdownItemHoverBackground: "#EBEEF0", // gray200
    // dropdownItemHoverTextColor: "#1A1F24", // gray1100
    // dropdownHoverBackground: "#EBEEF0", // gray200
    // dropdownHoverTextColor: "#1A1F24", // gray1100
    // summaryLabelColor: "#0D5F4E", // brandGreenDarker
    // walletConnectRowBorder: "1px solid #E5E8EB", // gray300
    // walletConnectRowBackground: "#FFFFFF", // white
    // walletConnectRowTextColor: "#000000", // black
    // inputPlaceholderColor: "#8D9C9C", // gray800
    // assetChipBackground: "#FFFFFF", // white
    // assetChipBorderColor: "#D1D5DC", // gray400
    // assetChipTextColor: "#1A1F24", // gray1100
    // assetChipHoverBackground: "#F9FAFB", // gray50
    // assetChipHoverBorderColor: "#9CA3AF", // gray700
    // assetChipSelectedBackground: "#17876D", // brandGreen
    // assetChipSelectedTextColor: "#FFFFFF", // white
    // providerCardBorderColor: "#E5E7EB", // gray350
    // providerCardHoverBorderColor: "#D1D5DC", // gray400
    // providerCardBackground: "#FFFFFF", // white
    // providerCardHoverBackground: "#FAFBFC", // cardHoverBackground
    // providerCardStarkgateBackground: "#E8F5F1", // brandGreenLight
    // providerCardStarkgateHoverBackground: "#E8F5F1", // brandGreenLight
    // providerNameColor: "#101828", // gray1200
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
