"use client";

import dynamic from "next/dynamic";
import type { ForumNode, ForumThread } from "../lib/types";

const ThreadReplyShell = dynamic(() => import("./thread-reply-shell").then((mod) => mod.ThreadReplyShell), {
  ssr: false,
  loading: () => (
    <section className="panel auth-panel">
      <h2>Loading reply box</h2>
      <p>Preparing wallet and email login...</p>
    </section>
  ),
});

type Props = {
  node: ForumNode;
  thread: ForumThread;
};

export function LazyThreadReplyShell({ node, thread }: Props) {
  return <ThreadReplyShell node={node} thread={thread} />;
}
