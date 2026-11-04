// usage: node clockfont_render.mjs job.json out.json
// job: {font, height, chars, size?, baseline?, fit?: {chars: {char: {w, px}}}} -> alpha (0..7) of each character, with the
// font rendered in Chrome canvas. With `fit` the size and baseline are searched against given glyphs first.
/* global document, FontFace, OffscreenCanvas -- they run inside the browser page (page.evaluate) */
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(process.env.PUPPETEER_PATH ?? import.meta.url);
const puppeteer = require('puppeteer');
const job = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const b64 = fs.readFileSync(job.font).toString('base64');
const result = await page.evaluate(
    async (b64, job) => {
        const face = new FontFace('F', `url(data:font/woff;base64,${b64})`, { weight: '700' });
        document.fonts.add(await face.load());
        const glyph = (ch, w, h, size, base, dx = 0) => {
            const c = new OffscreenCanvas(w, h);
            const ctx = c.getContext('2d', { willReadFrequently: true });
            ctx.font = `700 ${size}px F`;
            ctx.fillText(ch, dx, base);
            const d = ctx.getImageData(0, 0, w, h).data;
            const out = new Array(w * h);
            for (let i = 0; i < w * h; i++) {
                out[i] = Math.round((d[i * 4 + 3] / 255) * 7);
            }
            return out;
        };
        const advance = (ch, size) => {
            const c = new OffscreenCanvas(4, 4).getContext('2d');
            c.font = `700 ${size}px F`;
            return c.measureText(ch).width;
        };
        let { size, baseline } = job;
        const info = {};
        if (job.fit) {
            let best = Infinity;
            const fit = Object.entries(job.fit.chars);
            for (let s = job.fit.from; s <= job.fit.to; s += job.fit.step) {
                for (let b = job.fit.bfrom; b <= job.fit.bto; b += 0.5) {
                    let err = 0;
                    for (const [ch, g] of fit) {
                        const px = glyph(ch, g.w, job.height, s, b);
                        for (let i = 0; i < px.length; i++) {
                            err += Math.abs(px[i] - g.px[i]);
                        }
                    }
                    if (err < best) {
                        best = err;
                        size = s;
                        baseline = b;
                    }
                }
            }
            info.error = best;
            info.perPixel = best / fit.reduce((n, [, g]) => n + g.px.length, 0);
        }
        const chars = {};
        for (const ch of job.chars) {
            const w = Math.round(advance(ch, size));
            chars[ch] = { w, adv: advance(ch, size), px: glyph(ch, w, job.height, size, baseline) };
        }
        return { size, baseline, info, chars };
    },
    b64,
    job,
);
fs.writeFileSync(process.argv[3], JSON.stringify(result));
await browser.close();
