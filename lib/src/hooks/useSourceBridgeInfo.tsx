// BRIDGE MODE - this hook is entirely bridge-specific.
// It maps L2 token addresses to their corresponding L1 bridge/token addresses.
// The implementation is commented out; the hook always returns undefined.

// import { useMemo } from "react";
// import { standardise } from "@lib/utils";
// import { ZERO_ADDRESS_EVM } from "@lib/utils/constants";
import { Address } from "@starknet-react/chains";
// import { useSupportedTokens } from "./useSupportedTokens";

export interface useSourceBridgeInfoProps {
  l2TokenAddress: Address;
}

export interface SourceBridgeInfo {
  l1_bridge_address: Address;
  l1_token_address: Address;
  requireApproval: boolean;
}

export type useSourceBridgeInfoResult = SourceBridgeInfo | undefined;

/**
 * BRIDGE MODE - implementation commented out.
 * Previously retrieved the L1 bridge and token information for a given L2 token address.
 * Always returns undefined now; re-enable when bridge mode is restored.
 */
export function useSourceBridgeInfo(
  { l2TokenAddress: _l2TokenAddress }: useSourceBridgeInfoProps
): useSourceBridgeInfoResult {
  // BRIDGE MODE - token lookup commented out
  // const supportedTokens = useSupportedTokens();
  // const sourceToken: useSourceBridgeInfoResult = useMemo(() => {
  //   const tokensInfo = supportedTokens.filter((token) => {
  //     return standardise(token.l2_token_address) === standardise(l2TokenAddress);
  //   });
  //   const tokenInfo = tokensInfo.length ? tokensInfo[0] : undefined;
  //   let requireApproval = true;
  //   if (tokenInfo && tokenInfo.id === "eth") {
  //     tokenInfo.l1_token_address = ZERO_ADDRESS_EVM;
  //     requireApproval = false;
  //   }
  //   return tokenInfo ? {
  //     l1_bridge_address: tokenInfo.l1_bridge_address,
  //     l1_token_address: tokenInfo.l1_token_address,
  //     requireApproval: requireApproval,
  //   } : undefined;
  // }, [supportedTokens, l2TokenAddress]);
  // return sourceToken;

  return undefined;
}
