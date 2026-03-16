import { StorageClient, immutable } from "@lens-chain/storage-client";
import { PublicClient, evmAddress, uri } from "@lens-protocol/client";
import { createGroup, fetchGroups } from "@lens-protocol/client/actions";
import { handleOperationWith, signMessageWith } from "@lens-protocol/client/viem";
import { feed, group } from "@lens-protocol/metadata";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { builderPrivateKey, lensChain, lensChainId, lensEnvironment, siteUrl } from "./config";
import { defaultNodes } from "./default-nodes";
import { loadNodes, saveNodes } from "./node-store";
import type { ForumNode } from "./types";

const storageClient = StorageClient.create();

function requireBuilderKey() {
  if (!builderPrivateKey) {
    throw new Error("Missing FORUM_BUILDER_PRIVATE_KEY in forum/.env");
  }

  return builderPrivateKey.startsWith("0x") ? builderPrivateKey : `0x${builderPrivateKey}`;
}

function createBuilderContext() {
  const builder = privateKeyToAccount(requireBuilderKey() as `0x${string}`);
  const walletClient = createWalletClient({
    account: builder,
    chain: lensChain,
    transport: http(),
  });
  const publicClient = PublicClient.create({
    environment: lensEnvironment,
    origin: siteUrl,
  });

  return {
    builder,
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

async function lookupNodeByMetadataName(metadataName: string, builderAddress: string) {
  const client = PublicClient.create({
    environment: lensEnvironment,
    origin: siteUrl,
  });
  const result = await fetchGroups(client, {
    filter: {
      searchQuery: metadataName,
      managedBy: {
        address: evmAddress(builderAddress),
      },
    },
  });

  if (result.isErr()) {
    throw result.error;
  }

  return result.value.items.find((item) => item.metadata?.name === metadataName) ?? null;
}

export async function seedDefaultNodes() {
  const existing = loadNodes();
  const nodesBySlug = new Map(existing.map((node) => [node.slug, node]));
  const { builder, publicClient, walletClient } = createBuilderContext();

  const authenticated = await publicClient.login({
    builder: {
      address: evmAddress(builder.address),
    },
    signMessage: signMessageWith(walletClient),
  });

  if (authenticated.isErr()) {
    throw authenticated.error;
  }

  const sessionClient = authenticated.value;
  const createdOrLoaded: ForumNode[] = [];

  for (const definition of defaultNodes) {
    const existingNode = nodesBySlug.get(definition.slug);
    if (existingNode) {
      createdOrLoaded.push(existingNode);
      continue;
    }

    const groupMetadataUri = await uploadMetadata(
      group({
        name: definition.metadataName,
        description: definition.description,
      }),
      `${definition.slug}-group.json`,
    );

    const feedMetadataUri = await uploadMetadata(
      feed({
        name: `${definition.metadataName}-feed`,
        description: `Posting surface for ${definition.name}.`,
      }),
      `${definition.slug}-feed.json`,
    );

    const created = await createGroup(sessionClient, {
      metadataUri: groupMetadataUri,
      feed: {
        metadataUri: feedMetadataUri,
        repliesRestricted: false,
      },
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction);

    if (created.isErr()) {
      throw created.error;
    }

    const groupRecord = await lookupNodeByMetadataName(definition.metadataName, builder.address);

    if (!groupRecord) {
      throw new Error(`Created group "${definition.name}" but could not fetch it back.`);
    }
    if (!groupRecord.feed?.address) {
      throw new Error(`Group "${definition.name}" was created without a readable group feed.`);
    }

    createdOrLoaded.push({
      slug: definition.slug,
      name: definition.name,
      description: definition.description,
      groupAddress: groupRecord.address,
      feedAddress: groupRecord.feed.address,
    });
  }

  saveNodes(createdOrLoaded);
  return createdOrLoaded;
}
