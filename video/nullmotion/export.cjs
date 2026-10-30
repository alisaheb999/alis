// Drives Null Motion's own "Download → Whole preview" export in headless Chromium.
const { chromium } = require('playwright');
const [url, out] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ channel: 'chromium' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  page.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
  // Chromium here has no AAC encoder: skip the audio track, it is added afterwards with ffmpeg.
  await page.route('**/*.aac', r => r.fulfill({ status: 404, body: '' }));
  await page.goto(url);
  await page.waitForFunction(() => document.querySelectorAll('.seg').length > 0);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'nm-page.png' });
  await page.click('#download');
  const download = page.waitForEvent('download', { timeout: 300000 });
  await page.click('#download-all');
  const timer = setInterval(async () => console.log(await page.textContent('#download-label').catch(() => '')), 5000);
  const file = await download; clearInterval(timer);
  await file.saveAs(out);
  console.log('saved', out);
  await browser.close();
})();
