// Renders demo.html frame by frame and muxes it with the voiceover.
// Usage: node render.js <audio.mp3> [seconds] [fps]
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [audio, secs = '5', fpsArg = '30'] = process.argv.slice(2);
const fps = Number(fpsArg), total = Math.round(Number(secs) * fps);
const framesDir = path.join(__dirname, 'frames');
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto('file://' + path.join(__dirname, 'demo.html'));
  await page.evaluate(() => document.fonts.ready);
  for (let i = 0; i < total; i++) {
    await page.evaluate(t => window.render(t), i / fps);
    await page.screenshot({ path: path.join(framesDir, `f${String(i).padStart(4, '0')}.png`) });
  }
  await browser.close();

  const out = path.join(__dirname, 'demo.mp4');
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(fps), '-i', path.join(framesDir, 'f%04d.png'),
    '-i', audio, '-t', secs, '-af', `afade=t=out:st=${Number(secs) - 0.35}:d=0.35`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-c:a', 'aac', '-b:a', '192k',
    '-shortest', out], { stdio: 'inherit' });
  console.log('wrote', out);
})();
