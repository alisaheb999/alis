import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PROOF_SHOTS } from "../../data/proof-shots";

type Props = {
  title?: string;
  language?: "bn" | "en";
  previewCount?: number;
  compact?: boolean;
};

const PREVIEW_COUNT = 8;

function ProofGrid({ images, eager = false }: { images: string[]; eager?: boolean }) {
  return (
    <div className="columns-2 gap-2 sm:columns-3 sm:gap-3 lg:columns-4">
      {images.map((src, index) => (
        <figure
          key={src}
          className="mb-2 break-inside-avoid overflow-hidden rounded-md border border-border bg-card sm:mb-3"
          style={{ contentVisibility: "auto", containIntrinsicSize: "auto 320px" }}
        >
          <img
            src={src}
            alt={`পেমেন্ট প্রুফ ${index + 1}`}
            loading={eager && index < 2 ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={eager && index < 2 ? "auto" : "low"}
            className="block h-auto w-full"
          />
        </figure>
      ))}
    </div>
  );
}

export function ProofCarousel({
  title,
  language = "bn",
  previewCount = PREVIEW_COUNT,
  compact = false,
}: Props) {
  const heading = title ?? (language === "en" ? "Payment proofs" : "পেমেন্ট প্রুফ");
  const previewImages = PROOF_SHOTS.slice(0, previewCount);

  return (
    <section
      className={compact ? "bg-background py-8 sm:py-12" : "bg-background py-14 sm:py-20"}
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 900px" }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">{heading}</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">{language === "en" ? "View all" : "সব দেখুন"}</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] w-[calc(100%-1.5rem)] max-w-6xl overflow-y-auto p-4 sm:p-6">
              <DialogHeader className="pr-10">
                <DialogTitle className="text-left text-xl">{heading}</DialogTitle>
              </DialogHeader>
              <ProofGrid images={PROOF_SHOTS} />
            </DialogContent>
          </Dialog>
        </div>
        <ProofGrid images={previewImages} eager />
      </div>
    </section>
  );
}