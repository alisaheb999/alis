// Renders frames [from, to) of a page into frames/. Usage: node render-range.cjs page.html from to [fps]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const [pageFile, from, to, fps = '30'] = process.argv.slice(2);
const framesDir = path.join(__dirname, 'frames');
fs.mkdirSync(framesDir, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto('file://' + path.join(__dirname, pageFile));
  await page.evaluate(() => document.fonts.ready);
  for (let i = Number(from); i < Number(to); i++) {
    const file = path.join(framesDir, `f${String(i).padStart(4, '0')}.png`);
    if (fs.existsSync(file)) continue;
    await page.evaluate(t => window.render(t), i / Number(fps));
    await page.screenshot({ path: file });
  }
  await browser.close();
})();
