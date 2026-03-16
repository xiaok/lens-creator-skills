"use client";

import { StorageClient, immutable } from "@lens-chain/storage-client";
import { PublicClient, evmAddress, uri } from "@lens-protocol/client";
import {
  canCreateUsername,
  createAccountWithUsername,
  fetchAccountsAvailable,
  joinGroup,
  post as createPost,
} from "@lens-protocol/client/actions";
import { handleOperationWith, signMessageWith } from "@lens-protocol/client/viem";
import { account as createAccountMetadata, article } from "@lens-protocol/metadata";
import { createWalletClient, custom, toHex } from "viem";
import type { ConnectedWallet } from "@privy-io/react-auth";
import { lensAppAddress, lensChain, lensChainId, lensEnvironment, siteUrl } from "./config";
import type { ForumNode } from "./types";

const storageClient = StorageClient.create();
const publicClient = PublicClient.create({
  environment: lensEnvironment,
  origin: siteUrl,
});

async function ensureLensChain(provider: any) {
  const chainIdHex = toHex(lensChain.id);

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainIdHex,
          chainName: lensChain.name,
          nativeCurrency: lensChain.nativeCurrency,
          rpcUrls: lensChain.rpcUrls.default.http,
          blockExplorerUrls: lensChain.blockExplorers?.default?.url
            ? [lensChain.blockExplorers.default.url]
            : [],
        },
      ],
    });
  }
}

async function createLensWalletClient(wallet: ConnectedWallet) {
  const provider = await wallet.getEthereumProvider();
  await ensureLensChain(provider);

  return createWalletClient({
    account: wallet.address as `0x${string}`,
    chain: lensChain,
    transport: custom(provider),
  });
}

async function uploadMetadata(metadata: unknown, name: string) {
  const uploaded = await storageClient.uploadAsJson(metadata, {
    acl: immutable(lensChainId),
    name,
  });

  return uri(uploaded.uri);
}

export async function fetchManagedAccounts(walletAddress: string) {
  const result = await fetchAccountsAvailable(publicClient, {
    managedBy: evmAddress(walletAddress),
  });

  if (result.isErr()) {
    throw result.error;
  }

  return result.value.items;
}

async function createAccountOwnerSession(params: {
  wallet: ConnectedWallet;
  accountAddress: string;
}) {
  const walletClient = await createLensWalletClient(params.wallet);
  const authenticated = await publicClient.login({
    accountOwner: {
      owner: evmAddress(params.wallet.address),
      account: evmAddress(params.accountAddress),
      app: evmAddress(lensAppAddress),
    },
    signMessage: signMessageWith(walletClient),
  });

  if (authenticated.isErr()) {
    throw authenticated.error;
  }

  return {
    walletClient,
    sessionClient: authenticated.value,
  };
}

async function ensureNodeMembership(params: {
  walletClient: any;
  sessionClient: any;
  groupAddress: string;
}) {
  const membership = await joinGroup(params.sessionClient, {
    group: evmAddress(params.groupAddress),
  })
    .andThen(handleOperationWith(params.walletClient))
    .andThen(params.sessionClient.waitForTransaction);

  if (membership.isErr()) {
    const message = membership.error instanceof Error ? membership.error.message : String(membership.error);

    if (!message.includes("already a member")) {
      throw membership.error;
    }
  }
}

export async function registerLensAccount(params: {
  wallet: ConnectedWallet;
  localName: string;
  displayName: string;
}) {
  const walletClient = await createLensWalletClient(params.wallet);
  const authenticated = await publicClient.login({
    onboardingUser: {
      wallet: evmAddress(params.wallet.address),
      app: evmAddress(lensAppAddress),
    },
    signMessage: signMessageWith(walletClient),
  });

  if (authenticated.isErr()) {
    throw authenticated.error;
  }

  const sessionClient = authenticated.value;
  const usernameCheck = await canCreateUsername(sessionClient, {
    localName: params.localName,
  });

  if (usernameCheck.isErr()) {
    throw usernameCheck.error;
  }

  switch (usernameCheck.value.__typename) {
    case "NamespaceOperationValidationPassed":
      break;
    case "NamespaceOperationValidationFailed":
      throw new Error(usernameCheck.value.reason);
    case "NamespaceOperationValidationUnknown":
      throw new Error("Username validation requires custom namespace support.");
    case "UsernameTaken":
      throw new Error(`Username "${params.localName}" is already taken.`);
  }

  const metadataUri = await uploadMetadata(
    createAccountMetadata({
      name: params.displayName,
      bio: "Forum participant on a Lens-powered node-based forum.",
    }),
    "account.json",
  );

  const created = await createAccountWithUsername(sessionClient, {
    username: { localName: params.localName },
    metadataUri,
  })
    .andThen(handleOperationWith(walletClient))
    .andThen(sessionClient.waitForTransaction);

  if (created.isErr()) {
    throw created.error;
  }

  return fetchManagedAccounts(params.wallet.address);
}

export async function publishThread(params: {
  wallet: ConnectedWallet;
  node: ForumNode;
  accountAddress: string;
  title: string;
  content: string;
}) {
  const { walletClient, sessionClient } = await createAccountOwnerSession({
    wallet: params.wallet,
    accountAddress: params.accountAddress,
  });

  await ensureNodeMembership({
    walletClient,
    sessionClient,
    groupAddress: params.node.groupAddress,
  });

  const contentUri = await uploadMetadata(
    article({
      title: params.title,
      content: params.content,
      tags: ["forum", `node:${params.node.slug}`],
    }),
    "thread.json",
  );

  const published = await createPost(sessionClient, {
    feed: evmAddress(params.node.feedAddress),
    contentUri,
  })
    .andThen(handleOperationWith(walletClient))
    .andThen(sessionClient.waitForTransaction);

  if (published.isErr()) {
    throw published.error;
  }

  return published.value;
}

export async function publishReply(params: {
  wallet: ConnectedWallet;
  node: ForumNode;
  accountAddress: string;
  threadId: string;
  threadTitle: string;
  content: string;
}) {
  const { walletClient, sessionClient } = await createAccountOwnerSession({
    wallet: params.wallet,
    accountAddress: params.accountAddress,
  });

  await ensureNodeMembership({
    walletClient,
    sessionClient,
    groupAddress: params.node.groupAddress,
  });

  const contentUri = await uploadMetadata(
    article({
      title: `Re: ${params.threadTitle}`,
      content: params.content,
      tags: ["forum-reply", `node:${params.node.slug}`],
    }),
    "reply.json",
  );

  const published = await createPost(sessionClient, {
    feed: evmAddress(params.node.feedAddress),
    contentUri,
    commentOn: {
      post: params.threadId,
    },
  })
    .andThen(handleOperationWith(walletClient))
    .andThen(sessionClient.waitForTransaction);

  if (published.isErr()) {
    throw published.error;
  }

  return published.value;
}
