export type ForumNode = {
  slug: string;
  name: string;
  description: string;
  groupAddress: string;
  feedAddress: string;
};

export type ForumThread = {
  id: string;
  slug: string;
  title: string;
  content: string;
  summary: string;
  authorName: string;
  authorUsername: string | null;
  authorAddress: string;
  publishedAt: string;
  publishedLabel: string;
  nodeSlug: string;
  nodeName: string;
  tags: string[];
};

export type ForumReply = {
  id: string;
  slug: string;
  content: string;
  authorName: string;
  authorUsername: string | null;
  authorAddress: string;
  publishedAt: string;
  publishedLabel: string;
  tags: string[];
};
