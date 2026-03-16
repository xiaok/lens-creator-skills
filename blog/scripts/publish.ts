import "dotenv/config";
import { publishBlogPost } from "../lib/lens-write";

function readOption(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const title = readOption("title");
  const content = readOption("content");

  if (!title || !content) {
    throw new Error('Usage: npm run publish -- --title "My Post" --content "Post body"');
  }

  const published = await publishBlogPost({
    title,
    content,
  });

  console.log(`Published Lens blog post for ${published.accountAddress}`);
  console.log(`Transaction hash: ${published.txHash}`);
  console.log("Refresh the blog list after indexing and open the new post from the list page.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
