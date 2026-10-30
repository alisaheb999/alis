export interface Competitor {
  slug: string
  name: string
  vendor: string
  keyword: string
  summary: string
  whatItDoes: string[]
  whereGhostaeDiffers: string[]
}

// Competitor descriptions stay general and public-fact based; never claim their prices or limits.
export const COMPETITORS: Competitor[] = [
  {
    slug: 'animation-composer-alternative',
    name: 'Animation Composer',
    vendor: 'Mister Horse',
    keyword: 'Animation Composer alternative',
    summary:
      'Animation Composer is a well-known free After Effects and Premiere Pro plugin for browsing presets, transitions and project assets. Ghostae Text focuses deeper on kinetic typography, captions and multilingual titles.',
    whatItDoes: [
      'Browses presets, transitions, MOGRTs, footage and audio from one panel',
      'Includes motion tools such as keyframe easing and anchor point helpers',
      'Offers additional preset packs that can be added to the library',
    ],
    whereGhostaeDiffers: [
      '300+ ready text animations focused on titles, words and captions',
      'Native Bangla and multilingual text handling for non-Latin scripts',
      'SRT import and auto caption workflow that builds styled text layers',
      'Save your own looks as FFX presets straight from the panel',
      'One lifetime licence for the full Text library',
    ],
  },
  {
    slug: 'motion-bro-alternative',
    name: 'Motion Bro',
    vendor: 'Motion Bro',
    keyword: 'Motion Bro alternative',
    summary:
      'Motion Bro is a preset manager extension for After Effects and Premiere Pro that installs and organises preset packs. Ghostae bundles its text animations and tools directly into dedicated panels.',
    whatItDoes: [
      'Manages and previews installed preset packs',
      'Imports packs with transitions, titles and effects into the timeline',
    ],
    whereGhostaeDiffers: [
      'Text animations ship inside the panel — no separate pack hunting',
      'Bangla and multilingual typography support',
      'Caption and SRT automation built in',
      'Asset library, AI and text panels in one Ghostae ecosystem',
    ],
  },
  {
    slug: 'aejuice-alternative',
    name: 'AEJuice',
    vendor: 'AEJuice',
    keyword: 'AEJuice alternative',
    summary:
      'AEJuice offers plugins and animation packs with a Pack Manager for After Effects and Premiere Pro. Ghostae Text targets editors who need a large text animation set with multilingual and caption support.',
    whatItDoes: [
      'Provides animation packs, plugins and a pack manager panel',
      'Covers elements such as transitions, shapes and titles',
    ],
    whereGhostaeDiffers: [
      'Focused kinetic typography library with 300+ text animations',
      'Native Bangla and multilingual text',
      'Auto captions and SRT to styled layers',
      'Direct human support through our WhatsApp community',
    ],
  },
]

export const getCompetitor = (slug: string) => COMPETITORS.find((c) => c.slug === slug)
