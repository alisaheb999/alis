import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Download, KeyRound, LockKeyhole, MessageCircle, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GhostShell } from "../components/ghost/Shell";

const SUPPORT_URL = "https://wa.me/8801345407572";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security — How Ghostae Protects Your Purchase | Ghostae" },
      {
        name: "description",
        content:
          "How Ghostae keeps your payment, account, licence and downloads safe — verified payments, private licences and protected download links.",
      },
      { property: "og:title", content: "Security — How Ghostae Protects Your Purchase" },
      {
        property: "og:description",
        content: "Verified payments, a licence tied to your own account and protected downloads.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ghostae.com/security" }],
  }),
  component: SecurityPage,
});

const ITEMS = [
  {
    icon: BadgeCheck,
    title: "Every payment is verified",
    body: "Your licence is activated only after your bKash, Nagad, Rocket or Upay transaction is confirmed. Each transaction ID can be used once.",
  },
  {
    icon: UserCheck,
    title: "Your licence belongs to your account",
    body: "Purchases are linked to your verified email. Only you can see your products, licence keys and invoices after signing in.",
  },
  {
    icon: Download,
    title: "Protected downloads",
    body: "Paid extension files are never public. Download links are created for your licence and expire after a short time.",
  },
  {
    icon: KeyRound,
    title: "Safe account recovery",
    body: "Forgot your password? A reset link is sent only to your verified email — nobody else can take over your account.",
  },
  {
    icon: LockKeyhole,
    title: "We never ask for your PIN",
    body: "Ghostae never asks for your mobile banking PIN or OTP. Only share the transaction ID shown after you pay.",
  },
];

function SecurityPage() {
  return (
    <GhostShell>
      <section className="mx-auto max-w-5xl pb-8 pt-12 font-sans sm:pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Security</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Your purchase is safe with us
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-fg">
            Here is how we protect your payment, your account and your licence.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {ITEMS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-fg">{body}</p>
            </div>
          ))}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Something looks wrong?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-fg">Message our support team directly on WhatsApp.</p>
            </div>
            <Button asChild className="mt-4 w-full sm:w-auto">
              <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="!text-white">
                <MessageCircle className="size-4" />
                Contact support
              </a>
            </Button>
          </div>
        </div>
      </section>
    </GhostShell>
  );
}
