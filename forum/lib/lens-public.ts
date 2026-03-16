import { PublicClient, evmAddress, postId } from "@lens-protocol/client";
import { fetchGroup, fetchPost, fetchPostReferences, fetchPosts } from "@lens-protocol/client/actions";
import { lensEnvironment, siteUrl } from "./config";
import { loadNodes } from "./node-store";
import type { ForumNode, ForumReply, ForumThread } from "./types";

const publicClient = PublicClient.create({
  environment: lensEnvironment,
  origin: siteUrl,
});

function excerpt(input: string) {
  const normalized = input.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "No summary available.";
  }
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

function fallbackTitle(content: string) {
  const firstLine = content
    .split("\n")
    .map((line) => line.replace(/^#+\s*/, "").trim())
    .find(Boolean);

  return firstLine || "Untitled thread";
}

function normalizeThread(post: any, node: ForumNode): ForumThread | null {
  if (!post || post.__typename !== "Post" || post.isDeleted || post.commentOn) {
    return null;
  }

  const metadata = post.metadata ?? {};
  const content = typeof metadata.content === "string" ? metadata.content.trim() : "";
  const title =
    typeof metadata.title === "string" && metadata.title.trim()
      ? metadata.title.trim()
      : fallbackTitle(content);
  const publishedAt = typeof post.timestamp === "string" ? post.timestamp : new Date(0).toISOString();
  const tags = Array.isArray(metadata.tags) ? metadata.tags.map(String) : [];

  return {
    id: String(post.id),
    slug: typeof post.slug === "string" && post.slug ? post.slug : String(post.id),
    title,
    content,
    summary: excerpt(content),
    authorAddress: String(post.author?.address ?? ""),
    authorName:
      typeof post.author?.metadata?.name === "string" && post.author.metadata.name
        ? post.author.metadata.name
        : typeof post.author?.username?.localName === "string" && post.author.username.localName
          ? post.author.username.localName
          : String(post.author?.address ?? "Unknown author"),
    authorUsername:
      typeof post.author?.username?.value === "string" ? String(post.author.username.value) : null,
    publishedAt,
    publishedLabel: new Date(publishedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    nodeSlug: node.slug,
    nodeName: node.name,
    tags,
  };
}

function normalizeReply(post: any): ForumReply | null {
  if (!post || post.__typename !== "Post" || post.isDeleted) {
    return null;
  }

  const metadata = post.metadata ?? {};
  const content = typeof metadata.content === "string" ? metadata.content.trim() : "";
  const publishedAt = typeof post.timestamp === "string" ? post.timestamp : new Date(0).toISOString();
  const tags = Array.isArray(metadata.tags) ? metadata.tags.map(String) : [];

  return {
    id: String(post.id),
    slug: typeof post.slug === "string" && post.slug ? post.slug : String(post.id),
    content,
    authorAddress: String(post.author?.address ?? ""),
    authorName:
      typeof post.author?.metadata?.name === "string" && post.author.metadata.name
        ? post.author.metadata.name
        : typeof post.author?.username?.localName === "string" && post.author.username.localName
          ? post.author.username.localName
          : String(post.author?.address ?? "Unknown author"),
    authorUsername:
      typeof post.author?.username?.value === "string" ? String(post.author.username.value) : null,
    publishedAt,
    publishedLabel: new Date(publishedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    tags,
  };
}

export function getForumNodes() {
  return loadNodes();
}

export async function getForumNode(slug: string) {
  return loadNodes().find((node) => node.slug === slug) ?? null;
}

export async function getNodeMeta(slug: string) {
  const node = await getForumNode(slug);

  if (!node) {
    return null;
  }

  const result = await fetchGroup(publicClient, {
    group: evmAddress(node.groupAddress),
  });

  if (result.isErr()) {
    throw result.error;
  }
  if (!result.value) {
    return null;
  }

  return {
    node,
    group: result.value,
  };
}

export async function listThreadsForNode(slug: string) {
  const node = await getForumNode(slug);

  if (!node) {
    return [];
  }

  const result = await fetchPosts(publicClient, {
    filter: {
      feeds: [{ feed: evmAddress(node.feedAddress) }],
    },
  });

  if (result.isErr()) {
    throw result.error;
  }

  return result.value.items
    .map((post) => normalizeThread(post, node))
    .filter((post): post is ForumThread => post !== null)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export async function listLatestThreads() {
  const nodes = loadNodes();
  const all = await Promise.all(nodes.map((node) => listThreadsForNode(node.slug)));

  return all
    .flat()
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .slice(0, 30);
}

export async function getThreadById(id: string) {
  const result = await fetchPost(publicClient, {
    post: postId(id),
  });

  if (result.isErr()) {
    throw result.error;
  }
  if (!result.value || result.value.__typename !== "Post") {
    return null;
  }

  const nodes = loadNodes();
  const feedAddress = String(result.value.feed?.address ?? "").toLowerCase();
  const node = nodes.find((item) => item.feedAddress.toLowerCase() === feedAddress);

  if (!node) {
    return null;
  }

  return normalizeThread(result.value, node);
}

export async function listRepliesForThread(id: string) {
  const result = await fetchPostReferences(publicClient, {
    referencedPost: postId(id),
    referenceTypes: ["COMMENT_ON"],
  });

  if (result.isErr()) {
    throw result.error;
  }

  return result.value.items
    .map((post) => normalizeReply(post))
    .filter((post): post is ForumReply => post !== null)
    .sort((a, b) => (a.publishedAt > b.publishedAt ? 1 : -1));
}
