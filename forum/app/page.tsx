import Link from "next/link";
import { LazyForumAuthShell } from "../components/lazy-forum-auth-shell";
import { getForumNodes, listLatestThreads } from "../lib/lens-public";

export const dynamic = "force-dynamic";

const SPIRE_ICONS = ["⚔️", "🛡️", "🧪", "💀", "👑", "🔥", "❄️", "⚡"];

function getNodeColor(index: number) {
  const colors = ["#8b0000", "#1a1a1a", "#4a1a6b", "#0d5c8b", "#6b8e23", "#d4a017"];
  return colors[index % colors.length];
}

export default async function HomePage() {
  const nodes = getForumNodes();
  const threads = await listLatestThreads();

  return (
    <main className="main">
      <div className="content">
        <div className="panel">
          <div className="panel-header">
            <span>全部主题</span>
            <Link href="/">热门</Link>
          </div>
          <div className="panel-content">
            {threads.length === 0 ? (
              <div className="status-line">
                暂无主题，请运行 <code>npm run seed:nodes</code> 初始化数据
              </div>
            ) : (
              threads.map((thread, idx) => (
                <article key={thread.id} className="thread-item">
                  <div className="thread-avatar">
                    {SPIRE_ICONS[idx % SPIRE_ICONS.length]}
                  </div>
                  <div className="thread-main">
                    <div className="thread-title">
                      <Link href={`/t/${thread.id}`}>{thread.title}</Link>
                    </div>
                    <div className="thread-meta">
                      <Link href={`/nodes/${thread.nodeSlug}`} className="thread-node">
                        {thread.nodeName}
                      </Link>
                      <span> · </span>
                      <Link href="/">{thread.authorName}</Link>
                      <span> · </span>
                      <span>{thread.publishedLabel}</span>
                      {thread.tags.length > 0 && (
                        <>
                          <span> · </span>
                          {thread.tags.map((tag) => (
                            <span key={tag} className="tag">#{tag}</span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <LazyForumAuthShell nodes={nodes} />

        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <span>节点分类</span>
          </div>
          <div className="panel-content">
            {nodes.length === 0 ? (
              <div className="status-line">暂无节点</div>
            ) : (
              nodes.map((node, idx) => (
                <article key={node.slug} className="node-card">
                  <h3>
                    <Link href={`/nodes/${node.slug}`}>{node.name}</Link>
                  </h3>
                  <p>{node.description}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      <aside className="sidebar">
        <div className="sidebar-panel">
          <div className="sidebar-title">🎮 杀戮尖塔</div>
          <div className="sidebar-content">
            <Link href="/" className="sidebar-item">游戏讨论</Link>
            <Link href="/" className="sidebar-item">卡组构建</Link>
            <Link href="/" className="sidebar-item">Boss 攻略</Link>
            <Link href="/" className="sidebar-item">角色选择</Link>
            <Link href="/" className="sidebar-item">遗物评测</Link>
          </div>
        </div>

        <div className="sidebar-panel">
          <div className="sidebar-title">📁 节点</div>
          <div className="sidebar-content">
            {nodes.map((node, idx) => (
              <Link key={node.slug} href={`/nodes/${node.slug}`} className="node-item-sidebar">
                <span
                  className="node-icon"
                  style={{ background: getNodeColor(idx) }}
                >
                  {node.name[0]}
                </span>
                {node.name}
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
