import { createFileRoute } from "@tanstack/react-router";
import { GhostShell, PageTitle, Card } from "../components/ghost/Shell";

const TITLE = "Refund Policy — Ghostae";
const DESC =
  "Ghostae refund policy for digital licences: when a refund applies, when it does not, and how to request one via bKash, Nagad or Rocket.";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ghostae.com/refund" }],
  }),
  component: RefundPage,
});

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Try before you pay",
    body: [
      "Every paid product has a free download or a free plan. Please install it and confirm it runs on your computer before buying.",
      "This is the safest way to avoid a refund request.",
    ],
  },
  {
    title: "2. When we refund",
    body: [
      "You paid twice for the same product by mistake.",
      "You paid but no licence key was delivered and we cannot deliver one.",
      "The product does not work on a supported setup and we cannot fix it for you.",
      "All refund requests must be made within 1 day (24 hours) of purchase. After that, no refund is possible.",
    ],
  },
  {
    title: "3. When we do not refund",
    body: [
      "The request is made more than 1 day (24 hours) after purchase.",
      "You changed your mind after the key was delivered and activated.",
      "Your computer or Adobe version is outside the supported list shown on the product page.",
      "The key was shared, resold or used on more devices than allowed.",
      "A time-based plan that has already been used, or free-plan usage.",
    ],
  },
  {
    title: "4. How to request a refund",
    body: [
      "Message us on WhatsApp +880 1345 407572 or email support@ghostae.com within 7 days of payment.",
      "Include the account email, the product name and the payment transaction ID.",
      "Tell us what went wrong — most issues are solved the same day without a refund.",
    ],
  },
  {
    title: "5. How the money is returned",
    body: [
      "Approved refunds are sent back to the same bKash, Nagad or Rocket number you paid from.",
      "It usually takes 3–7 working days after approval.",
      "Mobile-wallet transfer charges, if any, are deducted from the refunded amount.",
    ],
  },
  {
    title: "6. After a refund",
    body: [
      "The licence key is cancelled and the panel stops working on your devices.",
      "You can buy the product again at any time.",
    ],
  },
];

function RefundPage() {
  return (
    <GhostShell>
      <div className="mx-auto w-full min-w-0 max-w-3xl py-6 sm:py-10">
        <PageTitle
          eyebrow="LEGAL"
          title="Refund Policy"
          subtitle="How refunds work for Ghostae digital licences paid with bKash, Nagad or Rocket."
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
