import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { GhostShell } from '../../components/ghost/Shell'
import { getPost, POSTS, type BlogPost } from '../../lib/blog-data'
import { ArrowLeft, CalendarDays } from 'lucide-react'

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => {
    const post = getPost(params.slug)
    if (!post) throw notFound()
    return { post }
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post
    const title = post ? `${post.title} — Ghostae Blog` : 'Ghostae Blog'
    const description = post?.excerpt ?? 'Workflow notes from the Ghostae team.'
    const image = 'https://ghostae.com/og-ghostae-world.jpg'
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: post ? `https://ghostae.com/blog/${post.slug}` : 'https://ghostae.com/blog' },
        { property: 'og:image', content: image },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: image },
      ],
      links: post ? [{ rel: 'canonical', href: `https://ghostae.com/blog/${post.slug}` }] : [],
      scripts: post
        ? [
            {
              type: 'application/ld+json',
              children: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Article',
                headline: post.title,
                description: post.excerpt,
                image: [image],
                url: `https://ghostae.com/blog/${post.slug}`,
                publisher: { '@type': 'Organization', name: 'Ghostae' },
              }),
            },
          ]
        : [],
    }
  },
  component: BlogPostPage,
})

function BlogPostPage() {
  const { post } = Route.useLoaderData()
  const others = POSTS.filter((p: BlogPost) => p.slug !== post.slug).slice(0, 2)

  return (
    <GhostShell>
      <article className="mx-auto w-full min-w-0 max-w-3xl py-6 sm:py-10 md:py-16">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-[12px] font-bold text-blue-600 hover:underline dark:text-blue-400"
        >
          <ArrowLeft size={14} /> All posts
        </Link>

        <p className="mt-8 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
          {post.tag}
        </p>
        <h1 className="mt-3 text-3xl font-black leading-[1.15] tracking-tight text-[#0b1020] sm:text-4xl dark:text-white">
          {post.title}
        </h1>
        <p className="mt-4 flex items-center gap-2 text-[12.5px] font-semibold text-slate-500 dark:text-slate-400">
          <CalendarDays size={14} /> {post.date} · {post.readingTime}
        </p>

        <div className="mt-10 space-y-5">
          {post.body.map((para: string, i: number) => (
            <p key={i} className="text-[15px] leading-[1.75] text-slate-700 dark:text-slate-300">
              {para}
            </p>
          ))}
        </div>

        <div className="mt-16 grid gap-3 border-t border-slate-200 pt-10 sm:grid-cols-2 dark:border-white/10">
          {others.map((p: BlogPost) => (
            <Link
              key={p.slug}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-500/50 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
                {p.tag}
              </span>
              <h2 className="mt-2 text-[15px] font-bold leading-snug text-[#0b1020] dark:text-white">
                {p.title}
              </h2>
            </Link>
          ))}
        </div>
      </article>
    </GhostShell>
  )
}
