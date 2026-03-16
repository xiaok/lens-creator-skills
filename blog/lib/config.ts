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
export const lensAccountAddress = process.env.LENS_ACCOUNT_ADDRESS || "";
export const blogAccountAddress = process.env.BLOG_ACCOUNT_ADDRESS || lensAccountAddress;
export const blogTag = process.env.BLOG_TAG || "blog";
export const blogOrigin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const publisherDisplayName = process.env.BLOG_AUTHOR_NAME || "Lens Blog Author";
export const publisherBio = process.env.BLOG_AUTHOR_BIO || "Publishing articles from a Lens-powered blog.";
