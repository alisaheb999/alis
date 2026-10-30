import { createFileRoute, Link } from '@tanstack/react-router'
import { GhostShell, PageTitle } from '../../components/ghost/Shell'
import { POSTS, type BlogPost } from '../../lib/blog-data'
import { ArrowRight, CalendarDays } from 'lucide-react'

export const Route = createFileRoute('/blog/')({
  component: BlogIndex,
  head: () => ({
    meta: [
      { title: 'Ghostae Blog — After Effects Workflow & Motion Design Notes' },
      {
        name: 'description',
        content:
          'Release notes, workflow breakdowns and motion design tips from the team building Ghostae, the After Effects extension for asset, AI and text automation.',
      },
      { property: 'og:title', content: 'Ghostae Blog' },
      {
        property: 'og:description',
        content: 'Workflow breakdowns, release notes and motion design tips for After Effects artists.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { property: "og:image", content: "https://ghostae.com/og-ghostae-world.jpg" },
      { name: "twitter:image", content: "https://ghostae.com/og-ghostae-world.jpg" },
    ],
    links: [{ rel: 'canonical', href: 'https://ghostae.com/blog' }],
  }),
})

function BlogIndex() {
  return (
    <GhostShell>
      <div className="mx-auto w-full min-w-0 max-w-5xl py-6 sm:py-10 md:py-16">
        <PageTitle
          eyebrow="BLOG"
          title="Notes from the panel"
          subtitle="Short, practical writing about After Effects workflow, asset management and the AI tooling inside Ghostae."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {POSTS.map((p: BlogPost) => (
            <Link
              key={p.slug}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,.06)] transition-all hover:border-blue-500/50 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none"
            >
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
                {p.tag}
              </span>
              <h2 className="mt-3 text-lg font-bold leading-snug text-[#0b1020] dark:text-white">
                {p.title}
              </h2>
              <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-400">
                {p.excerpt}
              </p>
              <div className="mt-5 flex items-center justify-between text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={13} /> {p.date} · {p.readingTime}
                </span>
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </GhostShell>
  )
}
