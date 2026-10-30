import { Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import launchVideo from "../../assets/text/ghostae-text-coming-soon.webm.asset.json";
import launchPoster from "../../assets/text/ghostae-text-v2-preview.webp.asset.json";

export default function TextLaunchDialog({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (!video) return;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, []);

  const close = () => {
    window.sessionStorage.setItem("ghostae-text-v2-preview-dismissed", "true");
    onClose();
  };

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted) void video.play();
  };

  const iconBtn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-media-foreground/20 bg-media-surface/60 text-media-foreground transition hover:bg-primary";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-media-surface/60 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="text-launch-title"
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/90 via-media-surface to-media-surface p-5 text-center shadow-2xl shadow-primary/40 sm:p-6"
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/50 blur-3xl" />

        <button type="button" onClick={close} aria-label="Close" className={`${iconBtn} absolute right-4 top-4 z-10`}>
          <X size={16} aria-hidden="true" />
        </button>

        <span className="relative inline-flex items-center gap-2 rounded-full border border-media-foreground/20 bg-media-surface/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-media-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Coming Soon · Version 2
        </span>

        <div className="relative mx-auto mt-5 aspect-video w-full overflow-hidden rounded-xl border border-media-foreground/15 bg-media-surface shadow-[0_0_60px_-10px] shadow-primary">
          <video
            ref={videoRef}
            className="h-full w-full object-contain"
            src={launchVideo.url}
            poster={launchPoster.url}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="Ghostae Text Version 2 preview"
          />
          <button type="button" onClick={toggleSound} aria-label={muted ? "Sound on" : "Mute"} className={`${iconBtn} absolute bottom-3 left-1/2 -translate-x-1/2`}>
            {muted ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
          </button>
        </div>

        <h2 id="text-launch-title" className="relative mt-5 text-xl font-bold text-media-foreground">
          Ghostae Text Version 2
        </h2>
        <p className="relative mt-1 text-sm text-media-foreground/70">
          নতুন update-এর একটি preview — শীঘ্রই আসছে।
        </p>
        <button
          type="button"
          onClick={close}
          className="relative mt-5 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          ঠিক আছে
        </button>
      </div>
    </div>
  );
}
