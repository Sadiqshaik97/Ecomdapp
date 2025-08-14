import { PetraWallet } from "petra-plugin-wallet-adapter";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { useMemo } from "react";

export const WalletConnectionProvider = ({ children }) => {
  // Memoize the wallet plugin array
  const wallets = useMemo(() => [new PetraWallet()], []);

  return (
    <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
      {children}
    </AptosWalletAdapterProvider>
  );
};
