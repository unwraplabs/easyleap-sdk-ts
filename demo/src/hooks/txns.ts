import { RpcProvider } from "starknet";

declare enum TransactionExecutionStatus {
  REJECTED = "REJECTED",
  REVERTED = "REVERTED",
  SUCCEEDED = "SUCCEEDED",
}

export function getProvider() {
  const rpcUrl =
    import.meta.env.VITE_RPC_URL || "https://starknet-sepolia.public.blastapi.io";

  return new RpcProvider({
    nodeUrl: rpcUrl,
    blockIdentifier: "pending",
  });
}

export async function isTxAccepted(txHash: string) {
  const provider = getProvider();

  let keepChecking = true;
  const maxRetries = 30;
  let retry = 0;

  while (keepChecking) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let txInfo: any;

    try {
      txInfo = await provider.getTransactionStatus(txHash);
    } catch (error) {
      console.error("isTxAccepted error", error);
      retry++;
      if (retry > maxRetries) {
        throw new Error("Transaction status unknown");
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
      continue;
    }

    console.debug("isTxAccepted", txInfo);
    if (!txInfo.finality_status || txInfo.finality_status === "RECEIVED") {
      // do nothing
      await new Promise((resolve) => setTimeout(resolve, 2000));
      continue;
    }
    if (txInfo.finality_status === "ACCEPTED_ON_L2") {
      if (txInfo.execution_status === TransactionExecutionStatus.SUCCEEDED) {
        keepChecking = false;
        return true;
      }
      throw new Error("Transaction reverted");
    } else if (txInfo.finality_status === "REJECTED") {
      throw new Error("Transaction rejected");
    } else {
      throw new Error("Transaction status unknown");
    }
  }
}
