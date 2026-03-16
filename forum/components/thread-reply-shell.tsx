"use client";

import { Providers } from "../app/providers";
import { ThreadReplyPanel } from "./thread-reply-panel";
import type { ForumNode, ForumThread } from "../lib/types";

type Props = {
  node: ForumNode;
  thread: ForumThread;
};

export function ThreadReplyShell({ node, thread }: Props) {
  return (
    <Providers>
      <ThreadReplyPanel node={node} thread={thread} />
    </Providers>
  );
}
