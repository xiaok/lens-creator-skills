"use client";

import dynamic from "next/dynamic";
import type { ForumNode } from "../lib/types";

const ForumAuthShell = dynamic(() => import("./forum-auth-shell").then((mod) => mod.ForumAuthShell), {
  ssr: false,
  loading: () => (
    <section className="panel auth-panel">
      <h2>Loading auth</h2>
      <p>Preparing wallet and email login...</p>
    </section>
  ),
});

type Props = {
  nodes: ForumNode[];
};

export function LazyForumAuthShell({ nodes }: Props) {
  return <ForumAuthShell nodes={nodes} />;
}
