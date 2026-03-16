import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const envPath = join(process.cwd(), ".env");

export function upsertEnvValues(values: Record<string, string>) {
  const existing = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const lines = existing ? existing.split("\n") : [];
  const seen = new Set<string>();

  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);

    if (!match) {
      return line;
    }

    const key = match[1];

    if (!(key in values)) {
      return line;
    }

    seen.add(key);
    return `${key}=${values[key]}`;
  });

  for (const [key, value] of Object.entries(values)) {
    if (!seen.has(key)) {
      nextLines.push(`${key}=${value}`);
    }
  }

  writeFileSync(envPath, `${nextLines.filter(Boolean).join("\n")}\n`, "utf8");
}
