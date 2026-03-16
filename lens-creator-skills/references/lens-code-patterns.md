# Lens Code Patterns

Use these patterns as the default TypeScript reference. Adjust imports only if the upstream SDK changes.

## 0. Install the Viem Peer Dependency

If the implementation imports `@lens-protocol/client/viem`, also install `@lens-chain/sdk`.

```bash
npm install @lens-protocol/client @lens-protocol/metadata @lens-chain/storage-client @lens-chain/sdk viem
```

## 1. Create a Public Client

```ts
import { PublicClient, mainnet } from "@lens-protocol/client";

export const client = PublicClient.create({
  environment: mainnet,
});
```

Use `@lens-protocol/react` for React apps and keep the same fragments/data model.

## 2. Log In as an Onboarding User

Use this when the user does not yet have a Lens account.

```ts
import { evmAddress } from "@lens-protocol/client";
import { signMessageWith } from "@lens-protocol/client/viem";

const authenticated = await client.login({
  onboardingUser: {
    app: evmAddress("0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE"),
    wallet: signer.address,
  },
  signMessage: signMessageWith(walletClient),
});

if (authenticated.isErr()) {
  throw authenticated.error;
}

const sessionClient = authenticated.value;
```

For quick experiments, use the official test app address instead of forcing app creation.

## 3. Check Username Availability

```ts
import { canCreateUsername } from "@lens-protocol/client/actions";

const result = await canCreateUsername(sessionClient, {
  localName: "wagmi",
});

if (result.isErr()) {
  throw result.error;
}

switch (result.value.__typename) {
  case "NamespaceOperationValidationPassed":
    break;
  case "NamespaceOperationValidationFailed":
    throw new Error(result.value.reason);
  case "NamespaceOperationValidationUnknown":
    throw new Error("Namespace rules need custom support");
  case "UsernameTaken":
    throw new Error("Username is already taken");
}
```

## 4. Create Account Metadata

Prefer Grove in examples because it matches the official docs, but any valid public metadata URI is acceptable.

```ts
import { account } from "@lens-protocol/metadata";
import { storageClient } from "./storage-client";

const metadata = account({
  name: "Jane Doe",
  bio: "Lens builder",
  picture: "lens://...",
});

const { uri } = await storageClient.uploadAsJson(metadata);
```

## 5. Create a Lens Account with a Free Username

```ts
import { uri } from "@lens-protocol/client";
import { createAccountWithUsername, fetchAccount } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { nonNullable } from "@lens-protocol/client";

const created = await createAccountWithUsername(sessionClient, {
  username: { localName: "wagmi" },
  metadataUri: uri("lens://4f91ca..."),
})
  .andThen(handleOperationWith(walletClient))
  .andThen(sessionClient.waitForTransaction)
  .andThen((txHash) => fetchAccount(sessionClient, { txHash }).map(nonNullable))
  .andThen((account) =>
    sessionClient.switchAccount({
      account: account.address,
    }),
  );

if (created.isErr()) {
  throw created.error;
}
```

## 6. Fetch an Account

Use React hooks in UI code and TS actions in service code. Keep fragments narrow.

```ts
import { evmAddress } from "@lens-protocol/client";
import { fetchAccount } from "@lens-protocol/client/actions";

const result = await fetchAccount(client, {
  address: evmAddress("0x1234..."),
});

if (result.isErr()) {
  throw result.error;
}

const account = result.value;
```

## 7. Update Account Metadata

Remember to carry forward fields that should remain.

```ts
import { account } from "@lens-protocol/metadata";
import { uri } from "@lens-protocol/client";
import { setAccountMetadata } from "@lens-protocol/client/actions";

const metadata = account({
  name: "Jane Doe",
  bio: "Updated bio",
  picture: "lens://existing-or-new-picture",
});

const uploaded = await storageClient.uploadAsJson(metadata);

const result = await setAccountMetadata(sessionClient, {
  metadataUri: uri(uploaded.uri),
});

if (result.isErr()) {
  throw result.error;
}
```

## 8. Create a Post

```ts
import { textOnly } from "@lens-protocol/metadata";
import { uri } from "@lens-protocol/client";
import { post } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";

const metadata = textOnly({
  content: "GM! GM!",
});

const uploaded = await storageClient.uploadAsJson(metadata);

const result = await post(sessionClient, {
  contentUri: uri(uploaded.uri),
})
  .andThen(handleOperationWith(walletClient))
  .andThen(sessionClient.waitForTransaction);

if (result.isErr()) {
  throw result.error;
}
```

## 8.1 Create a Blog Article Post

Use `article(...)` for a blog instead of `textOnly(...)`.

```ts
import { article } from "@lens-protocol/metadata";

const metadata = article({
  title: "Lens Blog Post",
  content: "# Hello Lens\n\nThis is a blog post.",
  tags: ["blog"],
});
```

Important:

- inject the blog tag yourself,
- do not assume the current `article(...)` helper supports a custom `slug`,
- use the `post.slug` value returned by Lens, or fall back to `post.id`, when building detail routes.

## 9. Fetch Posts

```ts
import { evmAddress } from "@lens-protocol/client";
import { fetchPosts } from "@lens-protocol/client/actions";

const result = await fetchPosts(client, {
  filter: {
    authors: [evmAddress("0x1234...")],
  },
});

if (result.isErr()) {
  throw result.error;
}

const { items, pageInfo } = result.value;
```

If the exact action name or filter shape changes upstream, align to the current Lens SDK docs and preserve the same account/post/filter model.

For a simple blog, a practical default is:

1. fetch posts for one author,
2. inspect `post.metadata.tags`,
3. keep only posts tagged with `blog`.

## 10. Edit a Post

Check `post.operations.canEdit` before editing.

```ts
import { textOnly } from "@lens-protocol/metadata";
import { postId, uri } from "@lens-protocol/client";
import { editPost } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";

const metadata = textOnly({
  content: "Edited content",
});

const uploaded = await storageClient.uploadAsJson(metadata);

const result = await editPost(sessionClient, {
  post: postId("01234..."),
  contentUri: uri(uploaded.uri),
})
  .andThen(handleOperationWith(walletClient))
  .andThen(sessionClient.waitForTransaction);

if (result.isErr()) {
  throw result.error;
}
```

## 11. Delete a Post

Check `post.operations.canDelete` first.

```ts
import { postId } from "@lens-protocol/client";
import { deletePost } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";

const result = await deletePost(sessionClient, {
  post: postId("01234..."),
})
  .andThen(handleOperationWith(walletClient))
  .andThen(sessionClient.waitForTransaction);

if (result.isErr()) {
  throw result.error;
}
```

## 12. Follow an Account

Check `account.operations.canFollow` before following.

```ts
import { evmAddress } from "@lens-protocol/client";
import { follow } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";

const result = await follow(sessionClient, {
  account: evmAddress("0x1234..."),
})
  .andThen(handleOperationWith(walletClient))
  .andThen(sessionClient.waitForTransaction);

if (result.isErr()) {
  throw result.error;
}
```

## 13. Fetch a Timeline

Use timelines for personalized “for you / following” surfaces backed by a social graph.

```ts
import { evmAddress } from "@lens-protocol/client";
import { fetchTimeline } from "@lens-protocol/client/actions";

const result = await fetchTimeline(sessionClient, {
  account: evmAddress("0x1234..."),
});

if (result.isErr()) {
  throw result.error;
}

const { items, pageInfo } = result.value;
```

## 14. Create an App with Lens Defaults

Use this only when the product actually needs its own app identity.

```ts
import { app } from "@lens-protocol/metadata";
import { uri } from "@lens-protocol/client";
import { createApp } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";

const metadata = app({
  name: "XYZ",
  tagline: "The next big thing",
  description: "An app on Lens",
  url: "https://example.com",
  platforms: ["web"],
});

const uploaded = await storageClient.uploadAsJson(metadata);

const result = await createApp(sessionClient, {
  metadataUri: uri(uploaded.uri),
  defaultFeed: {
    globalFeed: true,
  },
  graph: {
    globalGraph: true,
  },
  namespace: {
    globalNamespace: true,
  },
})
  .andThen(handleOperationWith(walletClient))
  .andThen(sessionClient.waitForTransaction);

if (result.isErr()) {
  throw result.error;
}
```

This is the canonical “defaults-first” app pattern.

## 15. Create a Custom Feed

Only use this for isolated posting surfaces or feed rules. For forum nodes or community sections, prefer `group(...)` plus the group's attached feed instead of modeling the node as a standalone feed.

When you create `group(...)` or `feed(...)`, keep the metadata `name` ASCII-safe. In practice that means using identifiers like `share-discoveries` instead of localized UI labels if the metadata validator enforces `lens.name`.

```ts
import { feed } from "@lens-protocol/metadata";
import { uri } from "@lens-protocol/client";
import { createFeed } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";

const metadata = feed({
  name: "Forum Feed",
  description: "Posts for a moderated forum",
});

const uploaded = await storageClient.uploadAsJson(metadata);

const result = await createFeed(sessionClient, {
  metadataUri: uri(uploaded.uri),
})
  .andThen(handleOperationWith(walletClient))
  .andThen(sessionClient.waitForTransaction);

if (result.isErr()) {
  throw result.error;
}
```

## 16. Create a Custom Graph

Only use this when the follow network must be isolated from the global Lens graph.

```ts
import { graph } from "@lens-protocol/metadata";
import { uri } from "@lens-protocol/client";
import { createGraph } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";

const metadata = graph({
  name: "Private Graph",
  description: "An isolated relationship graph",
});

const uploaded = await storageClient.uploadAsJson(metadata);

const result = await createGraph(sessionClient, {
  metadataUri: uri(uploaded.uri),
})
  .andThen(handleOperationWith(walletClient))
  .andThen(sessionClient.waitForTransaction);

if (result.isErr()) {
  throw result.error;
}
```

## 17. Add Sponsorship Later

Use sponsorship to offer a gasless UX, not as a prerequisite to app creation.

```ts
import { sponsorship } from "@lens-protocol/metadata";
import { uri } from "@lens-protocol/client";
import { createSponsorship } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";

const metadata = sponsorship({
  name: "GasPal",
});

const uploaded = await storageClient.uploadAsJson(metadata);

const result = await createSponsorship(sessionClient, {
  metadataUri: uri(uploaded.uri),
  allowLensAccess: true,
})
  .andThen(handleOperationWith(walletClient))
  .andThen(sessionClient.waitForTransaction);

if (result.isErr()) {
  throw result.error;
}
```

## 18. Handle Lens Operation Results

Prefer the official wallet adapter and wait for indexing.

```ts
import { handleOperationWith } from "@lens-protocol/client/viem";

const result = await post(sessionClient, {
  contentUri: uri("lens://..."),
})
  .andThen(handleOperationWith(walletClient))
  .andThen(sessionClient.waitForTransaction);

if (result.isErr()) {
  throw result.error;
}
```

Remember that Lens writes can resolve into:

- signless sponsored execution,
- sponsored transaction request,
- self-funded transaction request.

Write code that accepts the Lens transaction model instead of assuming a single wallet-send path.
