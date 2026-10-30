export const css = `
.tx-raw { letter-spacing: 0; }
.tx-raw h1, .tx-raw h2, .tx-raw h3 { text-wrap: balance; letter-spacing: 0; }
.tx-raw p { text-wrap: pretty; }
.tx-raw .tx-benefit { padding: 32px 0; border-radius: 0; border-width: 0 0 1px; background: transparent; box-shadow: none; }
.tx-raw .tx-benefit:last-child { border-bottom: 0; }
.tx-raw .tx-price-card { min-width: 0; border-radius: 8px; padding: 24px; }
.tx-raw .tx-price-header { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px; }
.tx-raw .tx-price-header h3, .tx-raw [data-offer-price], .tx-raw [data-list-price] { white-space: nowrap; }
.tx-raw .tx-hero { padding: 28px 20px 40px; background: var(--background); color: var(--foreground); }
.tx-raw .tx-intro { display: flex; flex-direction: column; align-items: stretch; gap: 22px; text-align: left; min-width: 0; }
.tx-raw .tx-intro p { margin: 0; }
.tx-raw .tx-heading-group { display: flex; flex-direction: column; gap: 10px; position: relative; padding: 0 0 0 14px; border-left: 2px solid var(--primary); }
.tx-raw .tx-name-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.tx-raw .tx-title { font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; font-size: 48px; font-weight: 600; line-height: 1.12; letter-spacing: 0; color: var(--foreground); }
.tx-raw .tx-title-accent, .tx-raw .tx-hl { color: var(--primary); }
.tx-raw .tx-v2 { border: 1px solid var(--border); border-radius: 5px; padding: 3px 7px; font: 500 11px/16px -apple-system, system-ui, sans-serif; color: var(--muted-fg); background: var(--surface); }
.tx-raw .tx-animation-line { font-family: "Ghostae Payment Bangla", system-ui, sans-serif; font-size: 18px; font-weight: 300; line-height: 1.5; color: var(--muted-fg); max-width: 400px; }
.tx-raw .tx-adobe-icon { position: absolute; width: 34px; height: 34px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font: 600 17px/1 -apple-system, system-ui, sans-serif; }
.tx-raw .tx-icon-ae { background: var(--text-ae-surface); color: var(--text-ae-ink); top: -10px; right: -6px; transform: rotate(12deg); }
.tx-raw .tx-icon-pr { background: var(--text-pr-surface); color: var(--text-pr-ink); bottom: -10px; left: -6px; transform: rotate(-12deg); }
.tx-raw .tx-actions { display: flex; flex-direction: column; align-items: stretch; gap: 12px; }
.tx-raw #text-coupon-controls:empty { display: none; }
.tx-raw .tx-download-button, .tx-raw .tx-download-button * { color: var(--media-foreground) !important; }
.tx-raw .tx-download-button { background: var(--primary-hover); }
.tx-raw .tx-purchase-row { display: flex; flex-direction: column; gap: 12px; width: 100%; }
.tx-raw .tx-offer-meta { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; min-height: 26px; }
.tx-raw .tx-buy-badge { border-radius: 4px; padding: 3px 8px; font-size: 12px; font-weight: 400; color: var(--primary-hover); background: var(--text-offer-surface); }
.tx-raw #text-hero-countdown { position: absolute; left: 18px; bottom: 12px; pointer-events: none; }
.tx-raw #text-hero-countdown * { color: var(--media-foreground); font-weight: 400; }
.tx-raw .tx-buy { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 94px; width: 100%; padding: 16px 18px 38px; border-radius: 8px; background: var(--text-purchase-gradient); box-shadow: var(--text-purchase-shadow); transition: opacity .2s ease; }
.tx-raw .tx-buy:hover { opacity: .92; }
.tx-raw .tx-buy, .tx-raw .tx-buy * { color: var(--media-foreground) !important; }
.tx-raw .tx-buy-label { font-family: "Ghostae Payment Bangla", system-ui, sans-serif; font-size: 18px; font-weight: 300; }
.tx-raw .tx-buy-price { font-family: "Ghostae Payment Bangla", system-ui, sans-serif; font-size: 30px; font-weight: 300; font-variant-numeric: tabular-nums; }
.tx-raw .tx-buy-arrow { width: 20px; height: 20px; flex-shrink: 0; }
.tx-raw .tx-preview-wrap { position: relative; margin: 8px 0 10px; }
.tx-raw .tx-adobe-icon { z-index: 2; pointer-events: none; border: 1px solid var(--border); }
.tx-raw .tx-purchase-row { position: relative; }
.tx-raw .tx-purchase-row .tx-buy-badge { position: absolute; right: 18px; bottom: 11px; pointer-events: none; }
.tx-raw .tx-showcase-frame { aspect-ratio: 16 / 9; overflow: hidden; border-radius: 8px; border: 1px solid var(--border); background: var(--media-surface); }
@media (min-width: 640px) { .tx-raw .tx-price-card { padding: 32px; } .tx-raw .tx-benefit { padding: 48px 0; } .tx-raw .tx-hero { padding: 44px 32px; } }
@media (max-width: 639px) {
  .tx-raw .tx-intro { justify-content: flex-start; gap: 20px; }
  .tx-raw .tx-title { font-size: 32px; }
  .tx-raw .tx-animation-line { font-size: 18px; }
}
`;

export const html = `
  <div class="w-full max-w-xl mx-auto">
    <div class="tx-intro text-left">
      <div class="tx-heading-group">
        <div class="tx-name-row">
          <h1 class="tx-title">Ghostae <span class="tx-title-accent">Text</span></h1>
          <span class="tx-v2">V2</span>
        </div>
        <p class="tx-animation-line">এক ক্লিকে টেক্সট অ্যানিমেশন</p>
      </div>
      <div class="tx-preview-wrap">
        <div class="tx-showcase-frame"><!--HERO_SHOWCASE--></div>
        <span class="tx-adobe-icon tx-icon-ae" role="img" aria-label="After Effects সমর্থিত" title="After Effects সমর্থিত">Ae</span>
        <span class="tx-adobe-icon tx-icon-pr" role="img" aria-label="Premiere Pro 2023+ সমর্থিত" title="Premiere Pro 2023+ সমর্থিত">Pr</span>
      </div>
      <div class="tx-actions">
        <div class="tx-purchase-row">
          <div id="text-hero-purchase" class="w-full"></div>
          <span id="text-hero-countdown"></span>
          <!--TEXT_OFFER_BADGE-->
        </div>
        <!--TEXT_DOWNLOAD_CONTROLS-->
        <div id="text-coupon-controls" class="w-full"></div>
      </div>
    </div>
  </div>
`;
