/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useRef } from "react";

import { useAccount } from "@lib/hooks/useAccount";
import { initAnalytics, trackEvent, identifyUser } from "@lib/utils/analytics";

interface AnalyticsContextValue {
  track: (event: string, props?: Record<string, unknown>) => void;
}

const noop: AnalyticsContextValue = { track: () => {} };

const AnalyticsContext = createContext<AnalyticsContextValue>(noop);

export const AnalyticsProvider: React.FC<{
  token?: string;
  children: React.ReactNode;
}> = ({ token, children }) => {
  const hasInitRef = useRef(false);
  const { starknetAddress } = useAccount();

  useEffect(() => {
    if (!token || hasInitRef.current) return;
    initAnalytics(token);
    hasInitRef.current = true;
  }, [token]);

  useEffect(() => {
    if (!hasInitRef.current || !starknetAddress) return;
    identifyUser(starknetAddress.toString());
  }, [starknetAddress]);

  const track = useCallback(
    (event: string, props?: Record<string, unknown>) => {
      if (!hasInitRef.current) return;
      trackEvent(event, props);
    },
    [],
  );

  const value = React.useMemo(() => ({ track }), [track]);

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = (): AnalyticsContextValue => {
  return useContext(AnalyticsContext);
};
