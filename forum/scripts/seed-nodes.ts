import "dotenv/config";
import { seedDefaultNodes } from "../lib/lens-builder";

async function main() {
  const nodes = await seedDefaultNodes();

  for (const node of nodes) {
    console.log(`${node.name} -> group ${node.groupAddress} / feed ${node.feedAddress}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
