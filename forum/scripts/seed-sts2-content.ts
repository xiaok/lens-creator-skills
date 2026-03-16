import "dotenv/config";
import { StorageClient, immutable } from "@lens-chain/storage-client";
import { PublicClient, evmAddress, uri } from "@lens-protocol/client";
import { fetchAccountsAvailable, fetchPosts, joinGroup, post as createPost } from "@lens-protocol/client/actions";
import { handleOperationWith, signMessageWith } from "@lens-protocol/client/viem";
import { article } from "@lens-protocol/metadata";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { lensAppAddress, lensChain, lensChainId, lensEnvironment, siteUrl } from "../lib/config";
import { loadNodes } from "../lib/node-store";

const storageClient = StorageClient.create();

function requirePosterKey() {
  const key = process.env.FORUM_POSTER_PRIVATE_KEY || process.env.FORUM_BUILDER_PRIVATE_KEY || "";

  if (!key) {
    throw new Error("Missing FORUM_POSTER_PRIVATE_KEY or FORUM_BUILDER_PRIVATE_KEY in forum/.env");
  }

  return key.startsWith("0x") ? key : `0x${key}`;
}

async function uploadMetadata(metadata: unknown, name: string) {
  const uploaded = await storageClient.uploadAsJson(metadata, {
    acl: immutable(lensChainId),
    name,
  });

  return uri(uploaded.uri);
}

async function resolvePostId(params: {
  publicClient: ReturnType<typeof PublicClient.create>;
  feedAddress: string;
  authorAddress: string;
  title: string;
}) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const posts = await fetchPosts(params.publicClient, {
      filter: {
        feeds: [{ feed: evmAddress(params.feedAddress) }],
      },
    });

    if (posts.isErr()) {
      throw posts.error;
    }

    const match = posts.value.items.find((item) => {
      if (!item || item.__typename !== "Post") {
        return false;
      }

      const metadata = item.metadata as { title?: string } | null | undefined;

      return (
        String(item.author?.address ?? "").toLowerCase() === params.authorAddress.toLowerCase() &&
        String(metadata?.title ?? "") === params.title
      );
    });

    if (match && match.__typename === "Post") {
      return String(match.id);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(`Could not resolve created post id for "${params.title}".`);
}

async function main() {
  const node = loadNodes().find((item) => item.slug === "slay-the-spire-2");

  if (!node) {
    throw new Error('Missing node "slay-the-spire-2". Run npm run seed:nodes first.');
  }

  const walletAccount = privateKeyToAccount(requirePosterKey() as `0x${string}`);
  const walletClient = createWalletClient({
    account: walletAccount,
    chain: lensChain,
    transport: http(),
  });
  const publicClient = PublicClient.create({
    environment: lensEnvironment,
    origin: siteUrl,
  });

  const available = await fetchAccountsAvailable(publicClient, {
    managedBy: evmAddress(walletAccount.address),
  });

  if (available.isErr()) {
    throw available.error;
  }

  const ownedAccount = available.value.items[0]?.account?.address;

  if (!ownedAccount) {
    throw new Error(`No Lens account is available for wallet ${walletAccount.address}.`);
  }

  const authenticated = await publicClient.login({
    accountOwner: {
      owner: evmAddress(walletAccount.address),
      account: evmAddress(ownedAccount),
      app: evmAddress(lensAppAddress),
    },
    signMessage: signMessageWith(walletClient),
  });

  if (authenticated.isErr()) {
    throw authenticated.error;
  }

  const sessionClient = authenticated.value;
  const joined = await joinGroup(sessionClient, {
    group: evmAddress(node.groupAddress),
  })
    .andThen(handleOperationWith(walletClient))
    .andThen(sessionClient.waitForTransaction);

  if (joined.isErr()) {
    const message = joined.error instanceof Error ? joined.error.message : String(joined.error);
    if (!message.includes("already a member")) {
      throw joined.error;
    }
  }

  const runLabel = new Date().toISOString().slice(11, 16).replace(":", "");
  const threads = [
    {
      title: `杀戮尖塔2 Demo ${runLabel}：先玩 Ironclad 还是 Silent？`,
      content:
        "先随便开个讨论串。现在如果只打前几十小时，你们更推荐先拿哪个角色熟悉新版节奏？我目前感觉资源压缩更严，前两层路线选择比一代更重要。",
      replies: [
        "我会先玩 Ironclad。容错高一点，更适合先理解新版敌人和事件节奏。",
        "Silent 也不错，但更吃卡序和前期路线。等你熟悉新遗物池以后再切过去会更顺。",
      ],
    },
    {
      title: `杀戮尖塔2 Demo ${runLabel}：这版前期路线是不是比一代更贪不起来？`,
      content:
        "我连续几把都在 Act 1 贪精英，结果被中段普通战直接打崩。感觉现在更应该优先找稳定升级点和商店，而不是无脑冲两精英开局。",
      replies: [
        "同感。除非开局送了很强的公共牌或者爆发遗物，不然一层双精英风险很高。",
        "我现在的经验是先看首个篝火前能不能稳定提升输出，不行就宁可保守一点。",
      ],
    },
    {
      title: `杀戮尖塔2 Demo ${runLabel}：随手记录一个有趣 build`,
      content:
        "今天打到一个很有意思的构筑，整套几乎只留高质量格挡和少量反击牌。成型后虽然出牌数不多，但每回合都很稳定，适合打长线 Boss。",
      replies: [
        "这种思路很适合论坛里继续展开，尤其想看你后面怎么补终局伤害。",
        "如果能再挂一个核心遗物截图就更好了，不过单看思路已经很像能上分的稳定套路。",
      ],
    },
  ];

  for (const [index, thread] of threads.entries()) {
    const threadUri = await uploadMetadata(
      article({
        title: thread.title,
        content: thread.content,
        tags: ["forum", "replyable", `node:${node.slug}`],
      }),
      `sts2-thread-${index + 1}.json`,
    );

    const createdThread = await createPost(sessionClient, {
      feed: evmAddress(node.feedAddress),
      contentUri: threadUri,
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction);

    if (createdThread.isErr()) {
      throw createdThread.error;
    }

    const createdThreadId = await resolvePostId({
      publicClient,
      feedAddress: node.feedAddress,
      authorAddress: ownedAccount,
      title: thread.title,
    });

    console.log(`thread: ${thread.title} -> tx ${createdThread.value} / post ${createdThreadId}`);

    for (const [replyIndex, reply] of thread.replies.entries()) {
      const replyUri = await uploadMetadata(
        article({
          title: `Re: ${thread.title}`,
          content: reply,
          tags: ["forum-reply", `node:${node.slug}`],
        }),
        `sts2-thread-${index + 1}-reply-${replyIndex + 1}.json`,
      );

      const createdReply = await createPost(sessionClient, {
        feed: evmAddress(node.feedAddress),
        contentUri: replyUri,
        commentOn: {
          post: createdThreadId,
        },
      })
        .andThen(handleOperationWith(walletClient))
        .andThen(sessionClient.waitForTransaction);

      if (createdReply.isErr()) {
        throw createdReply.error;
      }

      console.log(`reply: ${thread.title} #${replyIndex + 1} -> tx ${createdReply.value}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
