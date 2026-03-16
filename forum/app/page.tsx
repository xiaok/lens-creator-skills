import Link from "next/link";
import { LazyForumAuthShell } from "../components/lazy-forum-auth-shell";
import { getForumNodes, listLatestThreads } from "../lib/lens-public";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const nodes = getForumNodes();
  const threads = await listLatestThreads();

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Lens Forum Demo</p>
        <h1>V2EX-style forum, built on Lens groups.</h1>
        <p>
          Each forum node is a Lens <code>group</code>. That gives every node a real community boundary,
          room for moderation and membership rules later, and a dedicated posting surface without forcing us
          to invent a parallel category model offchain.
        </p>
      </section>

      <div className="dashboard">
        <section className="panel">
          <h2 className="section-title">Nodes</h2>
          <div className="node-grid">
            {nodes.length === 0 ? (
              <p className="section-copy">
                No nodes are seeded yet. Run <code>npm run seed:nodes</code> first.
              </p>
            ) : (
              nodes.map((node) => (
                <article key={node.slug} className="node-card">
                  <div className="meta-chip-row">
                    <span className="meta-chip">group node</span>
                  </div>
                  <h3>
                    <Link href={`/nodes/${node.slug}`}>{node.name}</Link>
                  </h3>
                  <p>{node.description}</p>
                </article>
              ))
            )}
          </div>
        </section>

        <LazyForumAuthShell nodes={nodes} />
      </div>

      <section className="panel" style={{ marginTop: 24 }}>
        <h2 className="section-title">Latest threads</h2>
        <div className="thread-list">
          {threads.length === 0 ? (
            <p className="section-copy">No threads yet. Seed nodes, log in, and publish the first one.</p>
          ) : (
            threads.map((thread) => (
              <article key={thread.id} className="thread-card">
                <div className="thread-header">
                  <div>
                    <div className="meta-line">
                      {thread.nodeName} · {thread.authorName} · {thread.publishedLabel}
                    </div>
                    <h3>
                      <Link href={`/t/${thread.id}`}>{thread.title}</Link>
                    </h3>
                  </div>
                  <div className="tag-row">
                    {thread.tags.map((tag) => (
                      <span key={tag} className="tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <p>{thread.summary}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
