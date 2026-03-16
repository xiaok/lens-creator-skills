import Link from "next/link";
import { notFound } from "next/navigation";
import { getNodeMeta, listThreadsForNode } from "../../../lib/lens-public";

export const dynamic = "force-dynamic";

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
    <main className="shell">
      <Link className="back-link" href="/">
        Back to forum
      </Link>

      <section className="hero">
        <p className="eyebrow">Node</p>
        <h1>{meta.node.name}</h1>
        <p>{meta.group.metadata?.description || meta.node.description}</p>
      </section>

      <section className="panel">
        <h2 className="section-title">Threads</h2>
        <div className="thread-list">
          {threads.length === 0 ? (
            <p className="section-copy">No threads in this node yet.</p>
          ) : (
            threads.map((thread) => (
              <article key={thread.id} className="thread-card">
                <div className="meta-line">
                  {thread.authorName} · {thread.publishedLabel}
                </div>
                <h3>
                  <Link href={`/t/${thread.id}`}>{thread.title}</Link>
                </h3>
                <p>{thread.summary}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
