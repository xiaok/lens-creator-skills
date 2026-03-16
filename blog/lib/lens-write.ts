import { StorageClient, immutable } from "@lens-chain/storage-client";
import { PublicClient, evmAddress, uri } from "@lens-protocol/client";
import {
  canCreateUsername,
  createAccountWithUsername,
  fetchAccount,
  post as createPost,
} from "@lens-protocol/client/actions";
import { handleOperationWith, signMessageWith } from "@lens-protocol/client/viem";
import { account as createAccountMetadata, article } from "@lens-protocol/metadata";
import { nonNullable } from "@lens-protocol/client";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  blogOrigin,
  blogTag,
  lensAccountAddress,
  lensAppAddress,
  lensChain,
  lensChainId,
  lensEnvironment,
  publisherBio,
  publisherDisplayName,
} from "./config";

const storageClient = StorageClient.create();

type PublishInput = {
  title: string;
  content: string;
};

function requirePrivateKey() {
  const value = process.env.PUBLISHER_PRIVATE_KEY;

  if (!value) {
    throw new Error("Missing PUBLISHER_PRIVATE_KEY in .env");
  }

  return value.startsWith("0x") ? value : `0x${value}`;
}

function createWalletContext() {
  const owner = privateKeyToAccount(requirePrivateKey() as `0x${string}`);
  const walletClient = createWalletClient({
    account: owner,
    chain: lensChain,
    transport: http(),
  });

  const publicClient = PublicClient.create({
    environment: lensEnvironment,
    origin: blogOrigin,
  });

  return {
    owner,
    walletClient,
    publicClient,
  };
}

async function uploadMetadata(metadata: unknown, name: string) {
  const uploaded = await storageClient.uploadAsJson(metadata, {
    acl: immutable(lensChainId),
    name,
  });

  return uri(uploaded.uri);
}

export async function createLensAccount(localName: string) {
  const { owner, publicClient, walletClient } = createWalletContext();

  const authenticated = await publicClient.login({
    onboardingUser: {
      wallet: evmAddress(owner.address),
      app: evmAddress(lensAppAddress),
    },
    signMessage: signMessageWith(walletClient),
  });

  if (authenticated.isErr()) {
    throw authenticated.error;
  }

  const sessionClient = authenticated.value;

  const usernameCheck = await canCreateUsername(sessionClient, {
    localName,
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
      throw new Error("Username validation is unknown; custom namespace rules need support.");
    case "UsernameTaken":
      throw new Error(`Username "${localName}" is already taken.`);
  }

  const metadataUri = await uploadMetadata(
    createAccountMetadata({
      name: publisherDisplayName,
      bio: publisherBio,
    }),
    "account.json",
  );

  const created = await createAccountWithUsername(sessionClient, {
    username: { localName },
    metadataUri,
  })
    .andThen(handleOperationWith(walletClient))
    .andThen(sessionClient.waitForTransaction)
    .andThen((txHash) => fetchAccount(sessionClient, { txHash }).map(nonNullable));

  if (created.isErr()) {
    throw created.error;
  }

  return {
    accountAddress: created.value.address,
    ownerAddress: owner.address,
    username: created.value.username?.value ?? localName,
  };
}

export async function publishBlogPost(input: PublishInput) {
  if (!lensAccountAddress) {
    throw new Error("Missing LENS_ACCOUNT_ADDRESS in .env. Run npm run create-account first.");
  }

  const { owner, publicClient, walletClient } = createWalletContext();

  const authenticated = await publicClient.login({
    accountOwner: {
      account: evmAddress(lensAccountAddress),
      owner: evmAddress(owner.address),
      app: evmAddress(lensAppAddress),
    },
    signMessage: signMessageWith(walletClient),
  });

  if (authenticated.isErr()) {
    throw authenticated.error;
  }

  const sessionClient = authenticated.value;
  const metadataUri = await uploadMetadata(
    article({
      title: input.title,
      content: input.content,
      tags: [blogTag],
    }),
    "post.json",
  );

  const result = await createPost(sessionClient, {
    contentUri: metadataUri,
  })
    .andThen(handleOperationWith(walletClient))
    .andThen(sessionClient.waitForTransaction);

  if (result.isErr()) {
    throw result.error;
  }

  return {
    txHash: result.value,
    accountAddress: lensAccountAddress,
  };
}
