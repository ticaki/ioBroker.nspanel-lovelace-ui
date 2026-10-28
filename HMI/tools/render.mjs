// usage: node render.mjs job.json out.bin
/* global OffscreenCanvas, Path2D -- they run inside the browser page (page.evaluate) */
// job: {W,H,variants:[{s,dx,dy}], paths:[d,...]} -> out: for each variant, for each path W*H alpha bytes (0..255)
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(process.env.PUPPETEER_PATH ?? import.meta.url);
const puppeteer = require('puppeteer');
const job = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const out = fs.openSync(process.argv[3], 'w');
const B = 200;
for (const v of job.variants) {
    for (let i = 0; i < job.paths.length; i += B) {
        const b64 = await page.evaluate(
            (W, H, v, paths) => {
                const c = new OffscreenCanvas(W, H),
                    ctx = c.getContext('2d', { willReadFrequently: true });
                const res = new Uint8Array(W * H * paths.length);
                paths.forEach((d, k) => {
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.clearRect(0, 0, W, H);
                    ctx.setTransform(v.sx ?? v.s, 0, 0, v.sy ?? v.s, v.dx, v.dy);
                    const path = new Path2D(d);
                    ctx.fill(path);
                    if (v.smear) {
                        for (let k = 1; k <= 8; k++) {
                            ctx.setTransform(v.sx ?? v.s, 0, 0, v.sy ?? v.s, v.dx + (v.smear * k) / 8, v.dy);
                            ctx.fill(path);
                        }
                    }
                    if (v.stroke) {
                        ctx.lineWidth = v.stroke / (v.sx ?? v.s);
                        ctx.lineJoin = 'round';
                        ctx.stroke(path);
                    }
                    const img = ctx.getImageData(0, 0, W, H).data;
                    for (let p = 0; p < W * H; p++) {
                        res[k * W * H + p] = img[p * 4 + 3];
                    }
                });
                let s = '';
                for (let p = 0; p < res.length; p += 8192) {
                    s += String.fromCharCode(...res.subarray(p, p + 8192));
                }
                return btoa(s);
            },
            job.W,
            job.H,
            v,
            job.paths.slice(i, i + B),
        );
        fs.writeSync(out, Buffer.from(b64, 'base64'));
    }
}
fs.closeSync(out);
await browser.close();
