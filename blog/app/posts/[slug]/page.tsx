import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "../../../lib/lens-public";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="page-shell detail-shell">
      <div className="detail-nav">
        <Link href="/">Back to posts</Link>
      </div>

      <article className="detail-card">
        <div className="post-meta">
          <span>{post.authorName}</span>
          <span>{post.publishedLabel}</span>
        </div>
        <h1>{post.title}</h1>
        <p className="detail-summary">{post.summary}</p>
        <div className="tag-row">
          {post.tags.map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>
        <div className="detail-content">{post.content}</div>
      </article>
    </main>
  );
}
