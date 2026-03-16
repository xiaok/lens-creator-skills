"use client";

import { Providers } from "../app/providers";
import { ForumAuthPanel } from "./forum-auth-panel";
import type { ForumNode } from "../lib/types";

type Props = {
  nodes: ForumNode[];
};

export function ForumAuthShell({ nodes }: Props) {
  return (
    <Providers>
      <ForumAuthPanel nodes={nodes} />
    </Providers>
  );
}
