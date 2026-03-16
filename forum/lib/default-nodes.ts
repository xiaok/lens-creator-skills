export type DefaultNode = {
  slug: string;
  name: string;
  metadataName: string;
  description: string;
};

export const defaultNodes: DefaultNode[] = [
  {
    slug: "share",
    name: "分享发现",
    metadataName: "share-discoveries",
    description: "Share links, tools, articles, and interesting discoveries from the Lens ecosystem and beyond.",
  },
  {
    slug: "pointless",
    name: "pointless",
    metadataName: "pointless",
    description: "Low-stakes chat, odd thoughts, jokes, and the kind of threads that make a forum feel alive.",
  },
  {
    slug: "slay-the-spire-2",
    name: "杀戮尖塔2",
    metadataName: "slay-the-spire-2",
    description: "A focused node for Slay the Spire 2 discussion, builds, patch talk, and community theorycrafting.",
  },
];
