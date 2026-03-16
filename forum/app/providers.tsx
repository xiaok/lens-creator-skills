"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { lensChain, privyAppId } from "../lib/config";

export function Providers({ children }: { children: React.ReactNode }) {
  if (!privyAppId) {
    return <>{children}</>;
  }

  const privyLensChain = {
    id: lensChain.id,
    name: lensChain.name,
    nativeCurrency: lensChain.nativeCurrency,
    rpcUrls: {
      default: {
        http: lensChain.rpcUrls.default.http,
      },
    },
    blockExplorers: lensChain.blockExplorers
      ? {
          default: lensChain.blockExplorers.default,
        }
      : undefined,
    testnet: lensChain.testnet,
  };

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#a04d2b",
        },
        loginMethods: ["email", "wallet"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        supportedChains: [privyLensChain],
        defaultChain: privyLensChain,
      }}
    >
      {children}
    </PrivyProvider>
  );
}
