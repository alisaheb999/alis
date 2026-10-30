import { createFileRoute } from "@tanstack/react-router";
import { GhostShell, PageTitle, Card } from "../components/ghost/Shell";

const TITLE = "Terms & Conditions — Ghostae";
const DESC =
  "Ghostae terms of service: licence rules, fair use, payment and verification, account responsibility and support for video editors.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ghostae.com/terms" }],
  }),
  component: TermsPage,
});

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. About Ghostae",
    body: [
      "Ghostae provides digital products for video editors: free resources, extensions for Adobe After Effects and Premiere Pro, a WhatsApp AI agent and a desktop agent.",
      "By downloading, buying or using any Ghostae product you accept these terms.",
    ],
  },
  {
    title: "2. Licence",
    body: [
      "A purchase gives you a personal licence to use the product. Some products are sold as a lifetime licence, others as a time-based plan — the product page states which.",
      "One licence key is bound to your account and to a limited number of devices shown in your dashboard.",
      "You may not resell, share, rent, publish or redistribute a key, an installer or any included asset.",
    ],
  },
  {
    title: "3. Account and security",
    body: [
      "You are responsible for your account, password and licence key.",
      "Keys found shared publicly or used on more devices than allowed may be suspended without refund.",
      "You can switch off your own licence at any time from your dashboard.",
    ],
  },
  {
    title: "4. Payment and verification",
    body: [
      "We accept bKash, Nagad and Rocket. You send the amount and submit the transaction ID.",
      "Your licence is delivered after the payment is verified. Verification is usually quick but can take longer outside working hours.",
      "A wrong or unverifiable transaction ID delays delivery until it is corrected.",
    ],
  },
  {
    title: "5. Free products",
    body: [
      "Free downloads and free resources are provided as they are, with no guarantee of features or uptime.",
      "Free plans may include daily or monthly usage limits, which can change.",
    ],
  },
  {
    title: "6. Updates and availability",
    body: [
      "Products are improved over time. Features may be added, changed or removed.",
      "A product may be placed under maintenance temporarily; we announce this on the product page and in the WhatsApp community.",
      "Adobe, Windows and macOS updates can affect compatibility. We support current versions, not every older release.",
    ],
  },
  {
    title: "7. Acceptable use",
    body: [
      "Do not attempt to bypass licence checks, reverse engineer, repackage or clone any Ghostae product.",
      "Do not use our products for unlawful content or to harass others.",
      "Breaking these rules ends your licence immediately.",
    ],
  },
  {
    title: "8. Liability",
    body: [
      "Ghostae is not liable for lost projects, lost renders or lost earnings. Always keep backups of your work.",
      "Our total liability is limited to the amount you paid for the product in question.",
    ],
  },
  {
    title: "9. Contact",
    body: [
      "WhatsApp / call: +880 1345 407572",
      "Email: support@ghostae.com",
    ],
  },
];

function TermsPage() {
  return (
    <GhostShell>
      <div className="mx-auto w-full min-w-0 max-w-3xl py-6 sm:py-10">
        <PageTitle
          eyebrow="LEGAL"
          title="Terms & Conditions"
          subtitle="The rules that apply when you download, buy or use a Ghostae product."
        />
        <div className="grid gap-3">
          {SECTIONS.map((s) => (
            <Card key={s.title}>
              <h2 className="text-[14px] font-bold text-slate-900 dark:text-white">{s.title}</h2>
              <ul className="mt-2.5 space-y-2">
                {s.body.map((b) => (
                  <li
                    key={b}
                    className="text-[12.5px] font-light leading-relaxed text-slate-600 dark:text-slate-400"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </GhostShell>
  );
}
