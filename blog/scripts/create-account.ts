import "dotenv/config";
import { createLensAccount } from "../lib/lens-write";
import { upsertEnvValues } from "../lib/env-file";

function readOption(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const username = readOption("username") || process.env.LENS_USERNAME_LOCAL_NAME;

  if (!username) {
    throw new Error("Provide --username <local-name> or set LENS_USERNAME_LOCAL_NAME in .env");
  }

  const created = await createLensAccount(username);

  upsertEnvValues({
    LENS_ACCOUNT_ADDRESS: created.accountAddress,
    BLOG_ACCOUNT_ADDRESS: created.accountAddress,
    LENS_USERNAME_LOCAL_NAME: username,
  });

  console.log(`Created Lens account ${created.accountAddress}`);
  console.log(`Owner wallet ${created.ownerAddress}`);
  console.log(`Username ${created.username}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
