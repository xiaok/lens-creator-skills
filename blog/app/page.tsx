import Link from "next/link";
import { blogAccountAddress, blogTag, lensEnvironmentName } from "../lib/config";
import { listBlogPosts } from "../lib/lens-public";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await listBlogPosts();

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Lens Blog Demo</p>
        <h1>Simple blog pages backed by Lens posts.</h1>
        <p className="hero-copy">
          The page reads one Lens account, filters posts by the <code>{blogTag}</code> tag, and
          renders them as a minimal blog.
        </p>
        <dl className="meta-grid">
          <div>
            <dt>Environment</dt>
            <dd>{lensEnvironmentName}</dd>
          </div>
          <div>
            <dt>Source account</dt>
            <dd>{blogAccountAddress || "Missing BLOG_ACCOUNT_ADDRESS / LENS_ACCOUNT_ADDRESS"}</dd>
          </div>
          <div>
            <dt>Publish command</dt>
            <dd>
              <code>npm run publish -- --title "..." --content "..."</code>
            </dd>
          </div>
        </dl>
      </section>

      <section className="content-section">
        <div className="section-header">
          <h2>Posts</h2>
          <p>{posts.length ? `${posts.length} tagged posts found.` : "No tagged posts found yet."}</p>
        </div>

        {posts.length === 0 ? (
          <div className="empty-state">
            <p>No Lens posts with the required tag are available for this account yet.</p>
            <p>
              Create an account if needed, then publish with the CLI script. The post will appear here
              after Lens indexes it.
            </p>
          </div>
        ) : (
          <div className="post-grid">
            {posts.map((post) => (
              <article key={post.id} className="post-card">
                <div className="post-meta">
                  <span>{post.authorName}</span>
                  <span>{post.publishedLabel}</span>
                </div>
                <h3>
                  <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                </h3>
                <p>{post.summary}</p>
                <div className="tag-row">
                  {post.tags.map((tag) => (
                    <span key={tag} className="tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
