import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import poster from "@/assets/text/full-feature-video.jpg.asset.json";

export function TextFeatureVideo() {
  const [playing, setPlaying] = useState(false);
  return (
    <section data-surface className="px-4 py-24 sm:px-6 sm:py-32" aria-labelledby="text-feature-video-heading">
      <div className="mx-auto max-w-5xl">
        <h2 id="text-feature-video-heading" className="mb-10 text-center text-2xl font-bold text-foreground sm:text-3xl">এক্সটেনশনের বিস্তারিত ভিডিও</h2>
        <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
          {playing ? (
            <iframe
              src="https://www.youtube-nocookie.com/embed/TeGPNolfHgs?autoplay=1&rel=0"
              title="Ghostae Text full-feature video"
              className="absolute inset-0 h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <>
              <img src={poster.url} alt="Ghostae Text full-feature video" width={480} height={360} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
              <Button aria-label="বিস্তারিত ভিডিও চালান" onClick={() => setPlaying(true)} size="icon" className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg [&_svg]:size-7">
                <Play fill="currentColor" aria-hidden="true" />
              </Button>
            </>
          )}
        </div>
        <div className="mt-4 flex justify-center">
          <Button asChild variant="link" className="text-xs">
            <a href="https://youtu.be/TeGPNolfHgs" target="_blank" rel="noreferrer">ইউটিউবে দেখুন ↗</a>
          </Button>
        </div>
      </div>
    </section>
  );
}