import { useMemo } from "react";
import { hash, CallData } from "starknet";
import { useSignMessage } from "wagmi";
import { parseSignature, recoverAddress, hashMessage } from "viem";

import { useAccount } from "../useAccount";
import {
  DEFAULT_ACCOUNT_FACTORY_ADDRESS,
  DEFAULT_OWNERSHIP_MESSAGE,
  DEFAULT_PRIMER_CLASS_HASH,
} from "@lib/utils";

export type OwnershipSignature = {
  r: `0x${string}`;
  s: `0x${string}`;
  v: number;
};

export type OwnershipVerificationResult = {
  ethAddress: `0x${string}`;
  recoveredEthAddress: `0x${string}`;
  isVerified: boolean;
  signature: OwnershipSignature;
  signature5Felts: string[]; // [r_high, r_low, s_high, s_low, v]
};

export function predictStarknetAddress(
  ethAddress: `0x${string}`,
): `0x${string}` {
  const salt = ethAddress.toLowerCase();
  const constructorCalldata = CallData.compile([]);

  const primerClassHash = DEFAULT_PRIMER_CLASS_HASH;
  const accountFactoryAddress = DEFAULT_ACCOUNT_FACTORY_ADDRESS;

  // Deterministic: no RPC call needed.
  return hash.calculateContractAddressFromHash(
    salt,
    primerClassHash,
    constructorCalldata,
    accountFactoryAddress,
  ) as `0x${string}`;
}

function splitU256ToHighLow(hex32: `0x${string}`): {
  high: string;
  low: string;
} {
  const clean = hex32.replace("0x", "").padStart(64, "0");
  return {
    high: "0x" + clean.slice(0, 32), // upper 128 bits
    low: "0x" + clean.slice(32, 64), // lower 128 bits
  };
}

/**
 * Encode an ECDSA signature into the 5-felt array expected by the bridge message.
 * Layout: [r_high, r_low, s_high, s_low, v]
 */
export function encodeSignatureTo5Felts(sig: OwnershipSignature): string[] {
  const r = splitU256ToHighLow(sig.r);
  const s = splitU256ToHighLow(sig.s);

  return [
    r.high, // felt[0]
    r.low, // felt[1]
    s.high, // felt[2]
    s.low, // felt[3]
    "0x" + sig.v.toString(16), // felt[4]
  ];
}

/**
 * React hook that:
 * 1) predicts the Starknet account address for the connected EVM wallet
 * 2) requests the MetaMask ownership signature (no gas)
 * 3) encodes the signature to the 5-felt format expected by the bridge/init flow
 * 4) optionally verifies the signature off-chain by recovering the signer address
 */
export function useEVMVerifyOwnership(): {
  ethAddress: `0x${string}` | undefined;
  predictedStarknetAddress: `0x${string}` | undefined;
  signAndVerifyOwnership: () => Promise<OwnershipVerificationResult>;
  isSigning: boolean;
  signError: Error | null;
} {
  const { evmAddress } = useAccount();
  // const {
  //   accountFactoryAddress,
  //   ownershipMessage = DEFAULT_OWNERSHIP_MESSAGE,
  //   primerClassHash,
  // } = props;

  const ownershipMessage = DEFAULT_OWNERSHIP_MESSAGE;

  const predictedStarknetAddress = useMemo(() => {
    if (!evmAddress) return undefined;
    return predictStarknetAddress(evmAddress);
  }, [evmAddress]);

  const { signMessageAsync, isPending, error } = useSignMessage();

  const signOwnershipMessage = async () => {
    // wagmi uses EIP-191 (`personal_sign`) for `useSignMessage`, matching the integration-guide.
    const rawSignature = await signMessageAsync({ message: ownershipMessage });

    const { r, s, v } = parseSignature(rawSignature);

    const signature: OwnershipSignature = {
      r,
      s,
      v: Number(v), // 27 or 28
    };

    return { rawSignature, signature };
  };

  const signAndVerifyOwnership =
    async (): Promise<OwnershipVerificationResult> => {
      if (!evmAddress) {
        throw new Error("EVM wallet not connected");
      }

      const { rawSignature, signature } = await signOwnershipMessage();

      // Verify by recovering the signer from the signed EIP-191 message hash.
      const msgHash = hashMessage(ownershipMessage);
      const recovered = await recoverAddress({
        hash: msgHash,
        signature: rawSignature,
      });

      const ethAddressNorm = evmAddress.toLowerCase();
      const recoveredNorm = recovered.toLowerCase();

      return {
        ethAddress: evmAddress,
        recoveredEthAddress: recovered,
        isVerified: recoveredNorm === ethAddressNorm,
        signature,
        signature5Felts: encodeSignatureTo5Felts(signature),
      };
    };

  return {
    ethAddress: evmAddress,
    predictedStarknetAddress,
    signAndVerifyOwnership,
    isSigning: isPending,
    signError: error instanceof Error ? error : null,
  };
}
