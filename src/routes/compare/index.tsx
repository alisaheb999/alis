import { createFileRoute, Link } from '@tanstack/react-router'
import { GhostShell, PageTitle } from '../../components/ghost/Shell'
import { COMPETITORS } from '../../lib/compare-data'
import { ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/compare/')({
  component: CompareIndex,
  head: () => ({
    meta: [
      { title: 'Ghostae vs Animation Composer, Motion Bro & AEJuice — Comparisons' },
      {
        name: 'description',
        content:
          'Compare Ghostae Text with Animation Composer, Motion Bro and AEJuice. 300+ After Effects text animations, Bangla support and auto captions.',
      },
      { property: 'og:title', content: 'Ghostae alternatives & comparisons' },
      { property: 'og:description', content: 'How Ghostae Text compares with popular After Effects preset tools.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://ghostae.com/compare' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: 'https://ghostae.com/compare' }],
  }),
})

function CompareIndex() {
  return (
    <GhostShell>
      <div className="mx-auto w-full min-w-0 max-w-5xl py-6 sm:py-10 md:py-16">
        <PageTitle
          eyebrow="COMPARE"
          title="Ghostae vs popular motion tools"
          subtitle="Honest comparisons for editors looking for an After Effects text animation alternative."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {COMPETITORS.map((c) => (
            <Link
              key={c.slug}
              to="/compare/$slug"
              params={{ slug: c.slug }}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-blue-500/50 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <h2 className="text-lg font-bold text-[#0b1020] dark:text-white">Ghostae vs {c.name}</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-400">{c.summary}</p>
              <ArrowRight size={15} className="mt-4 text-blue-500 transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </div>
    </GhostShell>
  )
}
