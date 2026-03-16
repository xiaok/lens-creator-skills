import { mainnet, testnet } from "@lens-protocol/client";
import { chains } from "@lens-chain/sdk/viem";

const MAINNET_TEST_APP = "0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE";
const TESTNET_TEST_APP = "0xC75A89145d765c396fd75CbD16380Eb184Bd2ca7";

export const lensEnvironmentName = process.env.LENS_ENV === "mainnet" ? "mainnet" : "testnet";
export const lensEnvironment = lensEnvironmentName === "mainnet" ? mainnet : testnet;
export const lensChain = lensEnvironmentName === "mainnet" ? chains.mainnet : chains.testnet;
export const lensChainId = lensChain.id;
export const lensAppAddress =
  process.env.LENS_APP_ADDRESS ||
  (lensEnvironmentName === "mainnet" ? MAINNET_TEST_APP : TESTNET_TEST_APP);
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
export const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";
export const builderPrivateKey = process.env.FORUM_BUILDER_PRIVATE_KEY || "";
