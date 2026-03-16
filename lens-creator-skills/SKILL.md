---
name: lens-creator-skills
description: Build Lens apps on top of the Lens ecosystem, including blogs, forums, X-like social apps, community products, and other social experiences. Use when Codex needs to explain Lens architecture and data structures, set up Lens SDK or GraphQL clients, create or manage accounts, usernames, apps, feeds, graphs, sponsorships, or implement read/write flows such as account onboarding, posting, editing, deleting, following, timelines, and related CRUD. Prefer the default global graph, default/global feed, and default/global namespace unless the user explicitly needs custom app, feed, graph, namespace, or rule logic.
---

# Lens Creator Skills

## Overview

Build Lens apps with a defaults-first approach.

Treat Lens as a set of composable primitives:

- `App` defines app identity, defaults, and management boundaries.
- `Account` is the user-owned smart-contract identity.
- `Username` is assigned to an account through a namespace.
- `Graph` defines follow relationships.
- `Feed` defines where posts are published and moderated.
- `Post` stores content by pointing to metadata at a public URI.
- `Sponsorship` optionally pays gas for users.

Start with Lens globals unless the product requirements clearly need custom contracts.

## Default-First Rules

Apply these rules before designing custom infrastructure:

1. Prefer the global graph for nearly every MVP.
The global graph already gives follow relationships and personalized timelines. Do not propose a custom graph unless the app needs an isolated social network or graph-specific rules.

2. Prefer the global feed or an app using global feed defaults.
For blogs, X-like apps, and simple social products, posting to Lens without a custom feed is the right starting point. Only create a custom feed when the product needs isolated posting surfaces, feed-specific moderation, or feed rules.

3. Prefer the global namespace for usernames.
Use free usernames in the Lens global namespace unless the user explicitly needs a branded/custom namespace, gated username creation, or paid username rules.

4. Do not require creating an app for quick experiments.
Lens end-user authentication needs an app address, but official test app addresses exist for experimentation. Create a dedicated app only when the product needs branded identity, app-level admins, sponsorship, app-specific feeds/graphs/namespaces, or production ownership boundaries.

5. Create custom contracts only for product reasons, not for ceremony.
If the same product can be shipped with Lens globals and application-side filtering, pick the simpler path.

## Choose the Right Lens Surface

Map product ideas to Lens primitives like this:

- `X-like app`: global graph, global/default feed, free usernames, text/image posts, follows, timelines.
- `Blog`: global graph, global/default feed, article/text/image posts, account pages, optional app branding.
- `Forum`: start with an app plus feed-based filtering; add a custom feed or group only if the forum needs isolated moderation, membership, or posting rules.
- `Community app`: start with global graph plus app identity; add custom feed, group, or sponsorship only when community boundaries require it.

Keep this distinction sharp:

- Graphs are for who-follows-whom.
- Feeds are for where content is published.
- Apps bind together identity, defaults, admins, and optional sponsorship.
- Accounts own social activity.

Do not blur these boundaries in explanations or code.

## Pick the SDK Layer

Choose the highest-level interface that matches the task:

- Use `@lens-protocol/react` for frontend apps, hooks, and account/post screens.
- Use `@lens-protocol/client` for server actions, custom workflows, and explicit operation handling.
- Use raw GraphQL only when the user explicitly needs direct queries, custom tooling, or SDK-independent integration.

If the implementation uses `@lens-protocol/client/viem`, also install `@lens-chain/sdk`. The current viem adapter depends on Lens chain definitions from that package.

Define GraphQL fragments early so fetches stay narrow and the returned entity shapes are obvious.

## Use the Correct Authentication Role

Use Lens roles precisely:

- `Builder`: create/manage apps, feeds, graphs, sponsorships, and other builder-side configuration.
- `Onboarding User`: create a new Lens account before the user owns one.
- `Account Owner`: perform account-owned operations.
- `Account Manager`: perform delegated social operations on behalf of an account.

Remember:

- End-user login requires an app address.
- Builder login does not require an app address.
- Official test apps exist for quick experimentation, so do not block prototypes on app creation.

## Implement the Core Flows

Follow this order unless the task clearly calls for a narrower slice:

1. Initialize a Lens client.
2. Define fragments for `Account`, `Post`, and any app-specific metadata shape.
3. Authenticate with the correct Lens role.
4. Onboard a user account only if the user does not already have one.
5. Implement read flows before mutations when the UI needs operational checks.
6. Check `operations` fields before follow, edit, delete, or other guarded actions.
7. Handle operation results through Lens wallet adapters and wait for indexing.

Use these references as needed:

- Read [references/lens-architecture.md](./references/lens-architecture.md) for the architecture and data model.
- Read [references/lens-code-patterns.md](./references/lens-code-patterns.md) for concrete TypeScript patterns.

## Explain Lens Data Structures Correctly

Anchor explanations in the actual entity model:

- `Account` commonly includes identity, username, metadata, score, and logged-in operations.
- `Post` commonly includes author, app, metadata, references such as `root` or `commentOn`, stats, and logged-in operations.
- `TimelineItem` wraps a primary post plus timeline context.
- `Follower` and `Following` records pair an account with a follow timestamp.

When reasoning about write permissions:

- Use `account.operations.canFollow` for follow checks.
- Use `post.operations.canEdit` for edit checks.
- Use `post.operations.canDelete` for delete checks.
- Treat `...ValidationUnknown` as blocked unless the task explicitly supports those custom rules.

## Build CRUD Flows the Lens Way

Use this CRUD framing:

- `Create account`: log in as onboarding user, validate username, upload account metadata, create the account, switch to account owner.
- `Read account/post/feed/graph`: fetch narrow shapes with fragments and explicit filters.
- `Update account/post`: upload new metadata, then update the URI onchain.
- `Delete post`: submit a delete transaction; explain that chain history still preserves existence.

Posts are content-addressed by metadata URI. Updating content usually means uploading new metadata and pointing the post or account to the new URI.

For blog-style apps:

- prefer `article(...)` metadata instead of `textOnly(...)`,
- tag blog posts explicitly, for example with `blog`,
- fetch one author’s posts and filter by `metadata.tags` if a dedicated tag filter is not already part of the chosen query shape,
- do not assume article metadata supports a custom `slug` field in the current SDK,
- use `post.slug` or `post.id` from Lens read responses for detail routes.

## Handle Transactions Properly

Treat Lens writes as tiered operations:

- Best case: signless sponsored execution.
- Fallback: sponsored transaction request.
- Final fallback: self-funded transaction request.

Prefer the official wallet adapters such as `handleOperationWith(...)`, then wait for indexing with `sessionClient.waitForTransaction(...)`.

Do not present every write as a plain self-funded transaction when Lens can sponsor it.

## Use Sponsorship Deliberately

Suggest sponsorship when the user wants a gasless UX, especially for onboarding-heavy consumer apps.

Do not make sponsorship a prerequisite for building the app. Add it when the product requirements justify operational complexity.

## Avoid Common Mistakes

Do not:

- recommend a custom graph for a simple social app MVP,
- recommend a custom feed when client-side filtering is enough,
- conflate app identity with account identity,
- claim posts live in graphs,
- ignore `operations` guards before mutations,
- forget that metadata updates require copying forward fields that should be retained,
- force GraphQL when the React or TypeScript SDK already covers the task.

## Deliverables

When implementing or explaining a Lens app, produce:

- the chosen Lens architecture and why it is minimal,
- the exact roles involved,
- the entity/data shapes used by the feature,
- the read/write path for each feature,
- TypeScript or React examples that match the chosen architecture,
- custom app/feed/graph/namespace creation only if the requirement truly needs it.
