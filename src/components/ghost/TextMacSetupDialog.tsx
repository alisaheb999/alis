import { useState } from "react";
import { Check, Copy, Download, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { TEXT_RELEASE_BASE } from "@/lib/text-downloads";
const RELEASE = TEXT_RELEASE_BASE;
const INSTALL = `bash -c 'DEST="$HOME/Library/Application Support/Adobe/CEP/extensions"; DESK="$HOME/Desktop"; ERR=0; mkdir -p "$DEST" || exit 1; for NAME in com.ghostae.text.aftereffects com.ghostae.text.premiere; do SRC="$DESK/$NAME"; if [ -f "$SRC/CSXS/manifest.xml" ]; then echo "Installing $NAME..."; rm -rf "$DEST/$NAME"; if ditto "$SRC" "$DEST/$NAME"; then echo "SUCCESS: $NAME"; else echo "ERROR: Failed to copy $NAME"; ERR=1; fi; else echo "MISSING: $NAME — Desktop folder or CSXS/manifest.xml not found"; ERR=1; fi; done; defaults write com.adobe.CSXS.11 PlayerDebugMode 1; defaults write com.adobe.CSXS.12 PlayerDebugMode 1; echo ""; if [ "$ERR" -eq 0 ]; then echo "Ghostae Text installation completed successfully."; else echo "Installation incomplete. Check the missing folders above."; fi; echo "Restart After Effects and Premiere Pro before opening the extensions.";'`;

function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setFailed(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { setFailed(true); }
  };
  return (
    <div className="mt-3 space-y-2">
      <Button onClick={copy} className="h-10 gap-2 font-medium">
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "কপি হয়েছে" : "কমান্ড কপি করুন"}
      </Button>
      <details open={failed || undefined} className="text-xs text-muted-foreground">
        <summary className="w-fit cursor-pointer py-1">কোড দেখুন</summary>
        <pre className="mt-2 max-h-36 overflow-y-auto whitespace-pre-wrap break-all rounded-md border border-border bg-muted p-3 font-mono text-xs leading-relaxed text-foreground">{command}</pre>
      </details>
      {failed && <p role="alert" className="text-xs text-muted-foreground">কপি হয়নি — কোড খুলে সিলেক্ট করে কপি করুন।</p>}
    </div>
  );
}

export default function TextMacSetupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="account-typography max-h-[90svh] w-[calc(100%-2rem)] max-w-xl gap-5 overflow-y-auto rounded-lg bg-background p-5 text-foreground sm:p-6">
        <DialogHeader className="pr-6 text-left">
          <DialogTitle className="text-xl font-semibold">Ghostae Text · Mac</DialogTitle>
          <DialogDescription className="text-sm">আপনার Adobe অ্যাপের ZIP নিন। তারপর নিচের ৩টি ধাপ।</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button asChild className="h-11 font-medium"><a href={`${RELEASE}Ghostae_Text_V2_AE_Release.zip`}><Download className="size-4" />After Effects</a></Button>
          <Button asChild variant="outline" className="h-11 font-medium"><a href={`${RELEASE}Ghostae_Text_Premiere_v2.1.1_Final.zip`}><Download className="size-4" />Premiere Pro</a></Button>
        </div>
        <ol className="space-y-5 text-sm leading-relaxed">
          <li className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">১</span>
            <div><h3 className="font-semibold">Adobe বন্ধ করে ZIP খুলুন</h3>
              <p className="mt-1 text-muted-foreground">এই ফোল্ডারগুলো Desktop-এ রাখুন:</p>
              <div className="mt-2 space-y-1 font-mono text-xs text-foreground"><p className="break-all">com.ghostae.text.aftereffects</p><p className="break-all">com.ghostae.text.premiere</p></div>
              <p className="mt-2 text-xs text-muted-foreground">ZIP নয়। প্রতিটি ফোল্ডারের সরাসরি ভেতরে <code className="font-mono">CSXS/manifest.xml</code> থাকতে হবে।</p>
            </div>
          </li>
          <li className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">২</span>
            <div><h3 className="font-semibold">Terminal-এ পেস্ট করুন</h3><p className="mt-1 text-muted-foreground">কমান্ড কপি করে Terminal-এ পেস্ট করুন, Enter চাপুন।</p><CopyCommand command={INSTALL} /></div>
          </li>
          <li className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">৩</span>
            <div><h3 className="font-semibold">Adobe খুলে Ghostae Text চালু করুন</h3><p className="mt-1 text-xs text-muted-foreground">Window → Extensions / Extensions (Legacy) → Ghostae Text</p><p className="mt-1 text-muted-foreground">প্রিমিয়াম ব্যবহার করতে লাইসেন্স কী দিন।</p></div>
          </li>
        </ol>
        <div className="border-t border-border pt-3">
          <details className="text-xs text-muted-foreground">
            <summary className="w-fit cursor-pointer py-1">প্যানেল না দেখালে</summary>
            <div className="mt-2 space-y-2">
              <p>ফোল্ডারের নাম ও ভেতরের ফাইল মিলিয়ে Adobe আবার খুলুন। কমান্ডটি CEP 11 ও 12-এর জন্য।</p>
              <p>শুধু উপরের Ghostae ZIP নিরাপত্তাজনিত বাধায় আটকে গেলে সংশ্লিষ্ট ফোল্ডারের কমান্ড দিন। Mac-এর পুরো নিরাপত্তা বন্ধ করবেন না।</p>
              <CopyCommand command={'xattr -dr com.apple.quarantine "$HOME/Library/Application Support/Adobe/CEP/extensions/com.ghostae.text.aftereffects"'} />
              <CopyCommand command={'xattr -dr com.apple.quarantine "$HOME/Library/Application Support/Adobe/CEP/extensions/com.ghostae.text.premiere"'} />
            </div>
          </details>
          <Button asChild variant="link" className="mt-2 h-auto gap-1.5 p-0 text-xs font-medium"><a href="https://wa.me/8801345407572" target="_blank" rel="noopener noreferrer"><MessageCircle className="size-3.5" />সেটআপে সাহায্য নিন</a></Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
