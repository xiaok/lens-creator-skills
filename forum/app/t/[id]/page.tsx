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
    <main className="shell">
      <Link className="back-link" href={`/nodes/${thread.nodeSlug}`}>
        Back to {thread.nodeName}
      </Link>

      <article className="thread-detail">
        <div className="meta-line">
          {thread.nodeName} · {thread.authorName} · {thread.publishedLabel}
        </div>
        <h1>{thread.title}</h1>
        <div className="tag-row" style={{ marginTop: 18 }}>
          {thread.tags.map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>
        <div className="body">{thread.content}</div>
      </article>

      <LazyThreadReplyShell node={node} thread={thread} />

      <section className="panel">
        <h2 className="section-title">Replies</h2>
        <div className="thread-list">
          {replies.length === 0 ? (
            <p className="section-copy">No replies yet.</p>
          ) : (
            replies.map((reply) => (
              <article key={reply.id} className="thread-card">
                <div className="meta-line">
                  {reply.authorName} · {reply.publishedLabel}
                </div>
                <div className="body">{reply.content}</div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
