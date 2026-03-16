import Link from "next/link";
import { notFound } from "next/navigation";
import { LazyThreadReplyShell } from "../../../components/lazy-thread-reply-shell";
import { getForumNode, getThreadById, listRepliesForThread } from "../../../lib/lens-public";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thread = await getThreadById(id);

  if (!thread) {
    notFound();
  }

  const node = await getForumNode(thread.nodeSlug);
  const replies = await listRepliesForThread(id);

  if (!node) {
    notFound();
  }

  return (
    <main className="main">
      <div className="content">
        <Link className="back-link" href={`/nodes/${thread.nodeSlug}`}>
          ← 返回 {thread.nodeName}
        </Link>

        <div className="panel">
          <div className="breadcrumb">
            <Link href="/">首页</Link>
            <span> / </span>
            <Link href={`/nodes/${thread.nodeSlug}`}>{thread.nodeName}</Link>
            <span> / </span>
            <span>主题详情</span>
          </div>
          <div className="thread-detail">
            <div className="thread-header">
              <h1>{thread.title}</h1>
              <div className="thread-meta">
                <Link href={`/nodes/${thread.nodeSlug}`} className="thread-node">
                  {thread.nodeName}
                </Link>
                <span> · </span>
                <Link href="/">{thread.authorName}</Link>
                <span> · </span>
                <span>{thread.publishedLabel}</span>
              </div>
              {thread.tags.length > 0 && (
                <div className="tag-row">
                  {thread.tags.map((tag) => (
                    <span key={tag} className="tag">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="reply-content" style={{ marginTop: 16 }}>
              {thread.content}
            </div>
          </div>
        </div>

        <LazyThreadReplyShell node={node} thread={thread} />

        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <span>回复 ({replies.length})</span>
          </div>
          <div className="panel-content">
            {replies.length === 0 ? (
              <div className="status-line">暂无回复</div>
            ) : (
              replies.map((reply, idx) => (
                <article key={reply.id} className="reply-item">
                  <div className="reply-header">
                    <div className="reply-avatar">
                      {reply.authorName[0].toUpperCase()}
                    </div>
                    <Link href="/" className="reply-author">{reply.authorName}</Link>
                    <span>·</span>
                    <span>{reply.publishedLabel}</span>
                    <span style={{ marginLeft: "auto" }}>#{idx + 1}</span>
                  </div>
                  <div className="reply-content">
                    {reply.content}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      <aside className="sidebar">
        <div className="sidebar-panel">
          <div className="sidebar-title">⚔️ 杀戮尖塔</div>
          <div className="sidebar-content">
            <Link href="/" className="sidebar-item">🏠 返回首页</Link>
            <Link href={`/nodes/${thread.nodeSlug}`} className="sidebar-item">
              📁 {thread.nodeName}
            </Link>
            <Link href="/" className="sidebar-item">🔥 热门主题</Link>
          </div>
        </div>

        <div className="sidebar-panel">
          <div className="sidebar-title">💡 快速链接</div>
          <div className="sidebar-content">
            <Link href="/" className="sidebar-item">卡牌图鉴</Link>
            <Link href="/" className="sidebar-item">遗物大全</Link>
            <Link href="/" className="sidebar-item">Boss 攻略</Link>
          </div>
        </div>
      </aside>
    </main>
  );
}
