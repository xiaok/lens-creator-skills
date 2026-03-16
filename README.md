# Lens Creator Skills

[English](./README.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [日本語](./README.ja.md)

![Lens Creator Skills banner](./assets/image.png)

Build Lens apps with an agent.

This repository contains an agent skill that helps users create [Lens](https://lens.xyz/) apps such as blogs, forums, X-like social apps, anonymous social apps, and private-community social apps. It is designed around a defaults-first Lens architecture so an agent can help you ship faster with less infrastructure.

## What This Skill Does

`lens-creator-skills` helps an agent:

- explain Lens architecture in practical terms,
- choose the right Lens setup for a real product,
- build Lens apps with the right primitives such as `App`, `Account`, `Username`, `Feed`, `Graph`, `Group`, and `Post`,
- implement common read and write flows such as onboarding, posting, replying, following, timelines, and profile pages,
- avoid unnecessary custom backend and database work.

The main skill file is [`lens-creator-skills/SKILL.md`](./lens-creator-skills/SKILL.md).

## What Is Lens?

[Lens](https://lens.xyz/) is a social protocol and developer ecosystem for building user-owned social applications.

In Lens:

- users own their identity through accounts and usernames,
- social relationships and content are modeled as open, composable primitives,
- apps can share the same social graph instead of rebuilding a network from scratch,
- content and social actions can be integrated into many product shapes, not just one app.

If you want the technical background, see the official [Lens Docs](https://docs.lens.xyz/) and this repository's architecture notes in [`lens-creator-skills/references/lens-architecture.md`](./lens-creator-skills/references/lens-architecture.md).

## Why Build a Social App with Lens?

Lens is a strong fit for agent-built social products because:

- simple login path: a keypair-based flow is enough to get started quickly,
- less infrastructure: you mainly manage frontend and business logic instead of building and operating a full backend and database stack,
- lower operating overhead: many real products can be built with Lens defaults and without paying for custom protocol infrastructure,
- flexible product surface: you can create a blog, forum, X-like app, anonymous social app, or private-community app from the same underlying primitives,
- faster iteration: an agent can focus on UI, features, and product logic instead of reinventing social infrastructure.

## Install This Skill for an Agent

The simplest way is to tell your agent:

```text
Install this skill: https://github.com/xiaok/lens-creator-skills/tree/main/lens-creator-skills
```

For agents that load skills from a local folder, install the directory that contains `SKILL.md` into your skills directory:

```bash
git clone git@github.com:xiaok/lens-creator-skills.git
mkdir -p "$CODEX_HOME/skills"
cp -R lens-creator-skills/lens-creator-skills "$CODEX_HOME/skills/lens-creator-skills"
```

After installation, ask your agent to use the skill explicitly:

```text
Use $lens-creator-skills to build a Lens app.
```

Any agent that supports local or repo-based skills can use this skill as long as the folder containing [`SKILL.md`](./lens-creator-skills/SKILL.md) is installed under the name `lens-creator-skills`.

## Example

[lens-forum-five.vercel.app](https://lens-forum-five.vercel.app/) is a Slay the Spire 2 game forum created with this skill.

According to the project note, it was built with a single prompt and only about 5% of the weekly quota from a $20 Codex subscription.

This repository also includes local examples:

- [`/forum`](./forum) for a Lens forum app
- [`/blog`](./blog) for a Lens blog app

## References

- [Skill definition](./lens-creator-skills/SKILL.md)
- [Lens architecture notes](./lens-creator-skills/references/lens-architecture.md)
- [Lens code patterns](./lens-creator-skills/references/lens-code-patterns.md)
