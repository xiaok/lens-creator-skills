import { PublicClient, evmAddress } from "@lens-protocol/client";
import { fetchPosts } from "@lens-protocol/client/actions";
import { blogAccountAddress, blogOrigin, blogTag, lensEnvironment } from "./config";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  authorAddress: string;
  authorName: string;
  authorUsername: string | null;
  publishedAt: string;
  publishedLabel: string;
};

const client = PublicClient.create({
  environment: lensEnvironment,
  origin: blogOrigin,
});

function hasBlogTag(tags: string[]) {
  return tags.some((tag) => tag.toLowerCase() === blogTag.toLowerCase());
}

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

  return firstLine || "Untitled Lens post";
}

function normalizePost(post: any): BlogPost | null {
  if (!post || post.__typename !== "Post" || post.isDeleted) {
    return null;
  }

  const metadata = post.metadata ?? {};
  const tags = Array.isArray(metadata.tags) ? metadata.tags.map(String) : [];

  if (!hasBlogTag(tags)) {
    return null;
  }

  const content = typeof metadata.content === "string" ? metadata.content.trim() : "";
  const title = typeof metadata.title === "string" && metadata.title.trim() ? metadata.title.trim() : fallbackTitle(content);
  const publishedAt = typeof post.timestamp === "string" ? post.timestamp : new Date(0).toISOString();

  return {
    id: String(post.id),
    slug: typeof post.slug === "string" && post.slug ? post.slug : String(post.id),
    title,
    summary: excerpt(content),
    content,
    tags,
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
  };
}

export async function listBlogPosts() {
  if (!blogAccountAddress) {
    return [];
  }

  const result = await fetchPosts(client, {
    filter: {
      authors: [evmAddress(blogAccountAddress)],
    },
  });

  if (result.isErr()) {
    throw result.error;
  }

  return result.value.items
    .map((post) => normalizePost(post))
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export async function getBlogPostBySlug(slug: string) {
  const posts = await listBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}
