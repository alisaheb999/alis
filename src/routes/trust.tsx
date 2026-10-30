import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GhostShell } from "../components/ghost/Shell";
import { ProofCarousel } from "../components/ghost/ProofCarousel";

const COMMUNITY_URL = "https://chat.whatsapp.com/BdoH5Xpn4iFEGEbn4j5WLf";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Trust — Real Payment Proofs & Community | Ghostae" },
      {
        name: "description",
        content:
          "See real Ghostae payment proofs and join a trusted WhatsApp community of nearly 500 video editors.",
      },
      { property: "og:title", content: "Trust — Real Payment Proofs & Community | Ghostae" },
      {
        property: "og:description",
        content: "Real payment proofs, delivered licences and a direct community of nearly 500 video editors.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ghostae.com/trust" }],
  }),
  component: TrustPage,
});

function TrustPage() {
  return (
    <GhostShell>
      <section className="mx-auto max-w-6xl pb-8 pt-12 font-sans sm:pb-12 sm:pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            See the proof, then decide
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-fg">
            Once your payment is verified, your licence and download appear in your account. Every proof below
            comes from a real order — and you can talk to us directly in our community.
          </p>
        </div>
      </section>

      <ProofCarousel title="Real payment proofs" language="en" previewCount={6} compact />

      <section className="mx-auto max-w-6xl pb-12 pt-8 font-sans sm:pb-20 sm:pt-12">
        <div className="grid gap-6 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-success/10 text-success">
              <Users className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-success">Ghostae Community</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Nearly 500 video editors</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-fg">
                Updates, support and real experiences from other users — all in one place.
              </p>
            </div>
          </div>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <a href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer" className="!text-white">
              <MessageCircle className="size-4" />
              Join the community
            </a>
          </Button>
        </div>
      </section>
    </GhostShell>
  );
}
