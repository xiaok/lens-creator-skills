# Lens Creator Skills

[English](./README.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [日本語](./README.ja.md)

![Lens Creator Skills banner](./assets/image.png)

agent を使って Lens アプリを作るための skill です。

このリポジトリには、[Lens](https://lens.xyz/) ベースのアプリを作るための agent skill が含まれています。ブログ、フォーラム、X-like なソーシャルアプリ、匿名 SNS、クローズドコミュニティ向けアプリなどを対象にしており、Lens の defaults-first アーキテクチャを前提として、少ないインフラで実運用できるプロダクトを素早く実装できるように設計されています。

## この Skill でできること

`lens-creator-skills` は agent が次のことを行うのを助けます。

- Lens のアーキテクチャを実務的に説明する
- 実際のプロダクトに合った Lens 設計を選ぶ
- `App`、`Account`、`Username`、`Feed`、`Graph`、`Group`、`Post` などのプリミティブを使ってアプリを構築する
- アカウント作成、投稿、返信、フォロー、タイムライン、プロフィール画面などの基本フローを実装する
- 不要な独自バックエンドやデータベース構築を避ける

メインの skill ファイルは [`lens-creator-skills/SKILL.md`](./lens-creator-skills/SKILL.md) です。

## Lens とは？

[Lens](https://lens.xyz/) は、ユーザーが自分のアイデンティティと関係性を保持できるソーシャルアプリを構築するための、開発者向けソーシャルプロトコルおよびエコシステムです。

Lens では：

- ユーザーは account と username を通じて自分のアイデンティティを持つ
- ソーシャル関係とコンテンツは、再利用可能なオープンなプリミティブとして表現される
- 複数のアプリが同じソーシャルグラフを共有できるため、毎回ゼロからネットワークを作り直す必要がない
- 同じ基盤から、さまざまなソーシャルプロダクトを構築できる

技術的な背景は、公式の [Lens Docs](https://docs.lens.xyz/) と、このリポジトリ内の [`lens-creator-skills/references/lens-architecture.md`](./lens-creator-skills/references/lens-architecture.md) を参照してください。

## なぜ Lens でソーシャルアプリを作るのか？

Lens は agent 主導でソーシャルプロダクトを作るのに向いています。

- ログインがシンプル：keypair ベースで素早く始められる
- インフラ負担が小さい：主にフロントエンドと業務ロジックを管理すればよく、完全なバックエンドやデータベースを自前で運用しなくてよい
- 低コストで運用しやすい：多くの実サービスは Lens のデフォルト機能だけで作れ、複雑な独自インフラを追加しなくてよい
- プロダクト形態が広い：blog、フォーラム、X-like app、匿名 SNS、クローズドコミュニティアプリなどを作れる
- 反復が速い：agent が UI、機能、プロダクトロジックに集中できる

## Agent へのインストール方法

もっとも簡単なのは、agent に次のように伝える方法です。

```text
Install this skill: https://github.com/xiaok/lens-creator-skills/tree/main/lens-creator-skills
```

ローカルフォルダから skill を読み込む agent の場合は、`SKILL.md` を含むディレクトリを skills ディレクトリに配置します。

```bash
git clone git@github.com:xiaok/lens-creator-skills.git
mkdir -p "$CODEX_HOME/skills"
cp -R lens-creator-skills/lens-creator-skills "$CODEX_HOME/skills/lens-creator-skills"
```

インストール後は、プロンプトで明示的に呼び出します。

```text
Use $lens-creator-skills to build a Lens app.
```

ローカル skill またはリポジトリベースの skill をサポートする agent であれば、この skill を利用できます。必要なのは、[`SKILL.md`](./lens-creator-skills/SKILL.md) を含むディレクトリを `lens-creator-skills` という名前で登録することです。

## 例

[lens-forum-five.vercel.app](https://lens-forum-five.vercel.app/) は、この skill を使って作られた Slay the Spire 2 のゲームフォーラムです。

プロジェクトノートによると、単一のプロンプトと、20 ドルの Codex サブスクリプションの週次クォータの約 5% だけで作られました。

このリポジトリにはローカル例も含まれています。

- [`/forum`](./forum)：Lens フォーラムアプリ
- [`/blog`](./blog)：Lens ブログアプリ

## 参考リンク

- [Skill definition](./lens-creator-skills/SKILL.md)
- [Lens architecture notes](./lens-creator-skills/references/lens-architecture.md)
- [Lens code patterns](./lens-creator-skills/references/lens-code-patterns.md)
