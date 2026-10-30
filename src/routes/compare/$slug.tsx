import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { GhostShell, PageTitle } from '../../components/ghost/Shell'
import { getCompetitor } from '../../lib/compare-data'
import { Check } from 'lucide-react'

export const Route = createFileRoute('/compare/$slug')({
  loader: ({ params }) => {
    const c = getCompetitor(params.slug)
    if (!c) throw notFound()
    return { c }
  },
  head: ({ loaderData }) => {
    const c = loaderData?.c
    if (!c) return { meta: [{ title: 'Not found' }, { name: 'robots', content: 'noindex' }] }
    const title = `${c.keyword}: Ghostae Text vs ${c.name} for After Effects`
    const description = `Looking for a ${c.keyword.toLowerCase()}? Compare ${c.name} with Ghostae Text — 300+ text animations, Bangla support and auto captions.`
    const url = `https://ghostae.com/compare/${c.slug}`
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: url },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      links: [{ rel: 'canonical', href: url }],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Compare', item: 'https://ghostae.com/compare' },
              { '@type': 'ListItem', position: 2, name: `Ghostae vs ${c.name}`, item: url },
            ],
          }),
        },
      ],
    }
  },
  component: ComparePage,
})

function ComparePage() {
  const { c } = Route.useLoaderData()
  return (
    <GhostShell>
      <article className="mx-auto w-full min-w-0 max-w-4xl py-6 sm:py-10 md:py-16">
        <PageTitle eyebrow="COMPARE" title={`Ghostae Text vs ${c.name}`} subtitle={c.summary} />
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 p-6 dark:border-white/10">
            <h2 className="font-bold text-[#0b1020] dark:text-white">What {c.name} does</h2>
            <p className="mt-1 text-xs text-slate-500">by {c.vendor}</p>
            <ul className="mt-4 space-y-2 text-[14px] text-slate-600 dark:text-slate-300">
              {c.whatItDoes.map((t) => <li key={t}>• {t}</li>)}
            </ul>
          </section>
          <section className="rounded-2xl border border-blue-500/40 p-6">
            <h2 className="font-bold text-[#0b1020] dark:text-white">What Ghostae Text adds</h2>
            <ul className="mt-4 space-y-2 text-[14px] text-slate-600 dark:text-slate-300">
              {c.whereGhostaeDiffers.map((t) => (
                <li key={t} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-blue-500" />{t}</li>
              ))}
            </ul>
          </section>
        </div>
        <p className="mt-8 text-xs text-slate-500">
          {c.name} is a trademark of {c.vendor}. Ghostae is not affiliated with {c.vendor}; details are based on public information.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/products/text" className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">See Ghostae Text</Link>
          <Link to="/compare" className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold dark:border-white/20 dark:text-white">All comparisons</Link>
        </div>
      </article>
    </GhostShell>
  )
}
