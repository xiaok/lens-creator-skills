# Lens Architecture Reference

## 1. Defaults-First Decision Tree

Use this decision tree before proposing any contract creation:

1. Does the user only need a social MVP, blog, or X-like app?
Use Lens globals first.

2. Does the user need a branded production surface with its own app identity, admins, or sponsorship?
Create an `App`, but keep `globalGraph`, `globalFeed`, and `globalNamespace` unless there is a concrete reason not to.

3. Does the user need isolated posting rules, moderation, or a dedicated content pool?
Create a custom `Feed`.

4. Does the user need an isolated follow network or graph-level rules?
Create a custom `Graph`.

5. Does the user need a branded or gated username space?
Use a custom namespace.

If the answer is no, stay on Lens globals.

## 2. Primitive Boundaries

### App

Treat the app as the product-level configuration and governance primitive.

An app can define:

- app metadata and branding,
- admins,
- which graph it uses,
- which feed is the default,
- which namespace registry it uses,
- sponsorship configuration.

Do not describe the app as the place where posts or follow edges live.

### Account

Treat the account as the end-user social identity.

An account is a smart contract with:

- ownership,
- optional delegated managers,
- metadata,
- username association,
- social actions such as posting and following.

Use account managers when a user or organization needs delegated social operations without giving up account ownership.

### Username

Treat the username as a namespace-scoped identifier assigned to an account.

Use the global Lens namespace by default. Only switch to a custom namespace for branding, gating, or fee logic.

### Graph

Treat the graph as the follow-relationship layer.

Graphs answer questions like:

- who follows whom,
- what relationships power timelines,
- whether graph-level follow rules apply.

Global graph is the default social graph. Custom graphs are for isolated networks or graph-specific rules.

### Feed

Treat the feed as the posting and moderation layer.

Feeds answer questions like:

- where posts are published,
- which rules control posting,
- how content is grouped and moderated.

Global feed is the shared public content surface. Custom feeds are for isolated or governed content channels.

### Post

Treat the post as the onchain social record pointing to metadata.

Common post relationships:

- `root`: the root thread item,
- `commentOn`: parent post for comments,
- `quoteOf`: quoted post.

Posts commonly expose:

- author,
- app,
- metadata,
- stats,
- logged-in operations.

## 3. Product Mapping

### X-like app

Start with:

- one app or official test app for experimentation,
- global graph,
- global/default feed,
- account onboarding,
- text and image posts,
- follow/unfollow,
- account timeline.

Do not create a custom graph just because the app has its own brand.

### Blog

Start with:

- account pages,
- article or text/image post metadata,
- global graph,
- global/default feed,
- optional branded app.

If the user wants a publication-specific content rail with moderation, then consider a custom feed.

### Forum

Start with:

- app identity,
- account onboarding,
- feed-based content slices,
- thread and comment UX.

Add:

- custom feed when the forum needs isolated posting permissions or moderation,
- group when membership boundaries matter,
- custom graph only if follow relationships themselves must be isolated.

## 4. Authentication Model

Use the correct role:

- `Builder`: app/feed/graph/sponsorship creation and management.
- `Onboarding User`: account creation flows before the user has a Lens account.
- `Account Owner`: owned-account operations.
- `Account Manager`: delegated account operations.

Important detail:

- end-user auth requires an app address,
- builder auth does not.

Official quick-start app addresses from the docs:

- Mainnet test app: `0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE`
- Testnet test app: `0xC75A89145d765c396fd75CbD16380Eb184Bd2ca7`

Use those for prototypes instead of forcing app creation up front.

## 5. Entity Shapes to Keep in Mind

### Account

Common fields:

```graphql
fragment Account on Account {
  address
  username {
    value
  }
  metadata {
    name
    picture
  }
}
```

Operationally useful fields:

- `operations.canFollow`
- `operations.isFollowedByMe`

Account data also includes identity, metadata, score, and operational flags.

### Post

Common fields:

```graphql
fragment Post on Post {
  id
  author {
    ...Account
  }
  timestamp
  app {
    address
    metadata {
      name
      logo
    }
  }
  metadata {
    ...PostMetadata
  }
  root {
    ...ReferencedPost
  }
  quoteOf {
    ...ReferencedPost
  }
  commentOn {
    ...ReferencedPost
  }
  stats {
    ...PostStats
  }
}
```

Operationally useful fields:

- `operations.canEdit`
- `operations.canDelete`

### Timeline

Timeline queries return `TimelineItem` records with a `primary` post and timeline context.

### Follow Relationships

Follower and following lists return relationship records instead of bare accounts:

- `Follower = { follower: Account, followedOn: DateTime }`
- `Following = { following: Account, followedOn: DateTime }`

## 6. CRUD Mental Model

### Create account

1. Log in as onboarding user.
2. Check username availability and rule satisfaction.
3. Upload account metadata.
4. Create account with username.
5. Fetch the created account and switch auth to account owner.

### Read account/post/follow data

1. Define fragments.
2. Fetch only the fields the feature needs.
3. Use pagination-aware actions when listing entities.

### Update account or post

1. Build the full new metadata object.
2. Copy forward fields that must remain.
3. Upload to a public URI.
4. Update the onchain URI reference.

### Delete post

1. Check `post.operations.canDelete`.
2. Submit `deletePost`.
3. Explain that blockchain history still preserves the post’s existence trail.

## 7. Rule Handling

Treat validation results conservatively.

For follows, edits, deletes, and namespace operations:

- proceed on `...ValidationPassed`,
- stop on `...ValidationFailed`,
- treat `...ValidationUnknown` as blocked unless the task explicitly requires custom-rule support.

## 8. Transaction Model

Lens writes use a tiered transaction model:

1. signless sponsored execution,
2. sponsored transaction request,
3. self-funded transaction request.

This means the same SDK action can return different write paths depending on eligibility.

Do not oversimplify every operation to “sign and send a normal transaction”.
