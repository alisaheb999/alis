import { useEffect, useRef } from "react";
import * as homeUi from "../../content/home-page/page";
import { initHomePage } from "../../content/home-page/behavior";

/**
 * The same Ask Ghostae AI launcher/card used on the homepage, extracted so every
 * other page gets the identical widget (markup, CSS and behaviour unchanged).
 */
const MARK = "<!-- FLOATING COMPACT AI ASSISTANT LAUNCHER";
const CANVAS =
  '<canvas id="dataVacuumCanvas" class="fixed inset-0 pointer-events-none z-[48] hidden"></canvas>';

const index = homeUi.html.indexOf(MARK);
const assistantHtml = index > -1 ? CANVAS + homeUi.html.slice(index) : "";

export function GhostAssistant() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    return initHomePage(rootRef.current);
  }, []);

  if (!assistantHtml) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: homeUi.css }} />
      <div
        ref={rootRef}
        className="gh2 tx-raw"
        dangerouslySetInnerHTML={{ __html: assistantHtml }}
      />
    </>
  );
}
