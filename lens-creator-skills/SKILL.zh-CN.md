# Lens Creator Skills（中文简版）

这个文件是英文 `SKILL.md` 的简化中文说明，方便快速理解和调整。发布时以英文版为准。

## 核心原则

先用 Lens 默认能力，再决定是否需要自定义能力。

- 默认优先用 `global graph`
- 默认优先用 `global/default feed`
- 默认优先用 `global namespace`
- 非必要不要要求用户先创建自己的 `app`、`graph`、`feed`、`group`、`namespace`

只有当产品确实需要隔离网络、独立内容池、品牌用户名、规则控制、赞助 gas、管理员治理时，才切到自定义合约层。

## Lens 架构要点

- `App`：应用身份、默认配置、管理员、赞助能力的边界
- `Account`：用户链上身份，实质上是智能合约账户
- `Username`：通过 namespace 分配给 account
- `Graph`：关注关系网络
- `Feed`：内容发布和分发的频道
- `Post`：内容本体，实际内容通过 metadata URI 指向外部 JSON
- `Sponsorship`：为用户代付 gas

要一直说明白：

- 图谱不存帖子，图谱只管 follow 关系
- Feed 不等于 App
- App 不等于 Account

## 产品映射

- 做 `X-like app`：通常直接用默认 graph + 默认 feed + username + post + timeline
- 做 `blog`：通常还是先用默认 graph/feed，重点是 account 页面和 article/text/image post
- 做 `forum`：如果“node”本身就是一个社区/版块，优先把每个 node 做成 `group`。group 自带成员/治理边界，并且内部有 feed 可发帖。只有在只是做轻量内容分栏、并不需要真实社区边界时，才先用 feed 或标签过滤。

## 认证角色

- `Builder`：创建和管理 app、feed、group、graph、sponsorship
- 创建 group/feed 这类 metadata 时，不要把 `name` 当成任意展示文案；如果命中 `lens.name` 校验，优先用 ASCII 的标识名，比如 `share-discoveries`、`slay-the-spire-2`，前端再单独显示中文名称。
- 如果产品需要“钱包连接 + email 登录”这类消费级登录体验，要额外接 Privy 之类的钱包/身份 provider。Lens 负责社交账户层，不直接替代应用自己的 email 登录接入层。
- `Onboarding User`：用户还没有 Lens account 时，用来开户
- `Account Owner`：账户拥有者
- `Account Manager`：被授权代管账户的人或服务

注意：

- 终端用户登录通常需要 `app address`
- `Builder` 登录不需要 `app address`
- 快速实验时可以先用官方测试 app，不要一开始就阻塞在创建自有 app 上

## CRUD 理解方式

- `Create account`：onboarding login -> 检查 username -> 上传 account metadata -> 创建 account -> 切换为 account owner
- `Read`：优先按 fragment 精确读取 account、post、timeline、followers
- `Update`：先生成并上传新 metadata，再更新 URI
- `Delete post`：删除的是可用状态，不是擦除链上历史

做博客时再补两条：

- 发文优先用 `article(...)` metadata，不要默认用 `textOnly(...)`
- 当前 SDK 下不要假设 `article` 可以直接写自定义 `slug`，详情页路由优先用 Lens 返回的 `post.slug` 或 `post.id`

## 实现时必须注意

- 用 `@lens-protocol/client/viem` 时，要额外安装 `@lens-chain/sdk`
- 变更前先检查 `operations`
- `canFollow`、`canEdit`、`canDelete` 都要判断
- `ValidationUnknown` 默认当作不可执行，除非任务明确要求支持自定义规则
- metadata 更新时要保留旧字段，不能只写增量
- Lens 写操作要按 sponsorship / signless / self-funded 三层结果处理

## 参考文件

- 看 `references/lens-architecture.md` 理解架构和数据模型
- 看 `references/lens-code-patterns.md` 直接拿 TypeScript 模式
