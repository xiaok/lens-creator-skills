import Link from "next/link";
import { notFound } from "next/navigation";
import { getNodeMeta, listThreadsForNode } from "../../../lib/lens-public";

export const dynamic = "force-dynamic";

const SPIRE_ICONS = ["⚔️", "🛡️", "🧪", "💀", "👑", "🔥", "❄️", "⚡"];

export default async function NodePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = await getNodeMeta(slug);

  if (!meta) {
    notFound();
  }

  const threads = await listThreadsForNode(slug);

  return (
    <main className="main">
      <div className="content">
        <Link className="back-link" href="/">
          ← 返回首页
        </Link>

        <div className="panel">
          <div className="breadcrumb">
            <Link href="/">首页</Link>
            <span> / </span>
            <span>{meta.node.name}</span>
          </div>
          <div className="panel-header">
            <span>{meta.node.name}</span>
            <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>
              {meta.group.metadata?.description || meta.node.description}
            </span>
          </div>
          <div className="panel-content">
            {threads.length === 0 ? (
              <div className="status-line">暂无主题</div>
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
      </div>

      <aside className="sidebar">
        <div className="sidebar-panel">
          <div className="sidebar-title">📖 节点信息</div>
          <div className="sidebar-content">
            <p style={{ margin: "0 0 8px", fontSize: 13 }}>
              <strong>{meta.node.name}</strong>
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>
              {meta.group.metadata?.description || meta.node.description}
            </p>
          </div>
        </div>

        <div className="sidebar-panel">
          <div className="sidebar-title">🎮 相关主题</div>
          <div className="sidebar-content">
            <Link href="/" className="sidebar-item">• 热门主题</Link>
            <Link href="/" className="sidebar-item">• 最新回复</Link>
            <Link href="/" className="sidebar-item">• 精华帖</Link>
          </div>
        </div>
      </aside>
    </main>
  );
}
