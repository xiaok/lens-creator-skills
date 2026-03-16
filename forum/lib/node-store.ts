import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ForumNode } from "./types";

const dataFile = join(process.cwd(), "data", "nodes.json");

export function loadNodes(): ForumNode[] {
  if (!existsSync(dataFile)) {
    return [];
  }

  return JSON.parse(readFileSync(dataFile, "utf8")) as ForumNode[];
}

export function saveNodes(nodes: ForumNode[]) {
  mkdirSync(dirname(dataFile), { recursive: true });
  writeFileSync(dataFile, `${JSON.stringify(nodes, null, 2)}\n`, "utf8");
}
