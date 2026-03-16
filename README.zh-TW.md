# Lens Creator Skills

[English](./README.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [日本語](./README.ja.md)

使用 agent 建立 Lens 應用。

這個倉庫提供一個 agent skill，用來幫助使用者建立基於 [Lens](https://lens.xyz/) 的應用，例如部落格、論壇、X-like 社交產品、陌生人社交產品與熟人社群產品。它採用 Lens 的預設優先架構，讓 agent 能用更少的基礎設施完成真實可用的產品。

## 這個 Skill 是做什麼的

`lens-creator-skills` 可以幫助 agent：

- 用實務方式解釋 Lens 架構，
- 為真實產品選擇合適的 Lens 架構方案，
- 使用 `App`、`Account`、`Username`、`Feed`、`Graph`、`Group`、`Post` 等原語建立應用，
- 實作開戶、發文、回覆、追蹤、時間軸、個人頁等常見讀寫流程，
- 避免不必要的自訂後端與資料庫工作。

主要的 skill 檔案見 [`lens-creator-skills/SKILL.md`](./lens-creator-skills/SKILL.md)。

## 什麼是 Lens？

[Lens](https://lens.xyz/) 是一個面向開發者的社交協議與生態，用來建立由使用者擁有身份與關係的社交應用。

在 Lens 中：

- 使用者透過 account 與 username 擁有自己的身份，
- 社交關係與內容被建模為可組合的開放原語，
- 不同應用可以共享同一套社交圖譜，而不是每次都從零開始冷啟動，
- 同一套底層能力可以支援多種產品形態，而不只是一個單一社交應用。

如果你想看更技術導向的說明，可以參考官方 [Lens Docs](https://docs.lens.xyz/) 與倉庫中的 [`lens-creator-skills/references/lens-architecture.md`](./lens-creator-skills/references/lens-architecture.md)。

## 為什麼適合用 Lens 建立社交 App？

Lens 很適合用 agent 快速建立社交產品，原因包括：

- 登入簡單：可以用 keypair 快速完成啟動與登入流程，
- 基礎設施負擔小：你主要管理前端與商業邏輯，不需要自己維護完整後端與資料庫，
- 成本低：很多真實產品可以直接使用 Lens 預設能力完成，不需要額外搭建複雜的協議基礎設施，
- 產品形態彈性高：你可以建立 blog、論壇、X-like app、陌生人社交、熟人社交等多種應用，
- 迭代更快：agent 可以把重點放在 UI、功能與產品邏輯，而不是重複搭建社交底層。

## 如何為 Agent 安裝這個 Skill

最簡單的方式，是直接對 agent 說：

```text
Install this skill: https://github.com/xiaok/lens-creator-skills/tree/main/lens-creator-skills
```

如果你的 agent 支援從本地目錄載入 skill，也可以把包含 `SKILL.md` 的目錄安裝到 skills 目錄：

```bash
git clone git@github.com:xiaok/lens-creator-skills.git
mkdir -p "$CODEX_HOME/skills"
cp -R lens-creator-skills/lens-creator-skills "$CODEX_HOME/skills/lens-creator-skills"
```

安裝後，直接在提示詞中明確呼叫：

```text
Use $lens-creator-skills to build a Lens app.
```

只要 agent 支援本地 skill 或倉庫 skill，就可以使用這個 skill。核心要求是把包含 [`SKILL.md`](./lens-creator-skills/SKILL.md) 的目錄以 `lens-creator-skills` 這個名稱接入。

## 範例

[lens-forum-five.vercel.app](https://lens-forum-five.vercel.app/) 是一個使用這個 skill 建立的《殺戮尖塔 2》遊戲論壇。

根據專案說明，它只用了單一提示詞，以及一個 20 美元 Codex 訂閱大約 5% 的每週額度。

這個倉庫也包含本地範例：

- [`/forum`](./forum)：Lens 論壇應用
- [`/blog`](./blog)：Lens 部落格應用

## 參考連結

- [Skill 定義](./lens-creator-skills/SKILL.md)
- [Lens 架構說明](./lens-creator-skills/references/lens-architecture.md)
- [Lens 程式碼模式](./lens-creator-skills/references/lens-code-patterns.md)
