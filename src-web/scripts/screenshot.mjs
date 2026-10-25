#!/usr/bin/env node
/* eslint-env browser, node */
/* global window, document, PointerEvent */
/**
 * Renders a list of CustomSend payloads in the web panel (mock mode) and saves a
 * screenshot of the 480x320 stage at 2x.
 *
 *   node scripts/screenshot.mjs --in commands.txt --out shot.png [--port 4174] [--wait 300] [--model eu|us-l|us-p]
 *
 * Needs a running `npm start` (vite dev server) or `vite preview` on the port and the
 * globally installed puppeteer (`npm i -g puppeteer`). One payload per line, empty lines
 * and lines starting with # are skipped. A line `@sleep <ms>` waits, `@touch` triggers a
 * touch on the stage (resets the screensaver timeout, enables audio), `@click <selector>`
 * taps the first element matching the css selector inside the stage (e.g. a tile or the
 * icon of an entity row - the frontend then opens the popup itself with the entity colour,
 * the payload lines after it play the answer of the adapter). `\r` and `\n` in a payload
 * stand for the line breaks the adapter sends (e.g. in `notify~…`).
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

function arg(name, fallback) {
    const i = process.argv.indexOf(`--${name}`);
    return i !== -1 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}

const input = arg('in');
const output = arg('out', 'shot.png');
const port = Number(arg('port', '4174'));
const waitMs = Number(arg('wait', '700'));
const scale = Number(arg('scale', '2'));
const model = arg('model', 'eu');
// viewport = stage in native size + hardware buttons below, so the stage renders at 1x
const stage = model === 'us-p' ? { width: 320, height: 480 } : { width: 480, height: 320 };
const HARDWARE_BUTTONS_HEIGHT = 48;
if (!input) {
    console.error('usage: node scripts/screenshot.mjs --in commands.txt --out shot.png [--port 4174]');
    process.exit(2);
}

const globalRoot = execSync('npm root -g').toString().trim();
const require = createRequire(path.join(globalRoot, 'x.js'));
let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (e) {
    console.error(`puppeteer not found in ${globalRoot}: ${e.message}`);
    process.exit(2);
}

const lines = readFileSync(input, 'utf8')
    .split(/\r?\n/)
    .map(l => l.replace(/\s+$/, ''))
    .filter(l => l !== '' && !l.startsWith('#'));

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
try {
    const page = await browser.newPage();
    await page.setViewport({
        width: stage.width,
        height: stage.height + HARDWARE_BUTTONS_HEIGHT,
        deviceScaleFactor: scale,
    });
    page.on('pageerror', err => console.error(`page error: ${err.message}`));
    await page.goto(`http://localhost:${port}/demo?mock=1&model=${model}`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.__panel !== undefined, { timeout: 10_000 });
    // icons are fetched after mount - wait until the page renders
    await page.waitForSelector('[data-stage] [data-page]', { timeout: 10_000 });

    for (const line of lines) {
        if (line.startsWith('@sleep')) {
            await new Promise(r => setTimeout(r, Number(line.split(/\s+/)[1] ?? '100')));
        } else if (line.startsWith('@click ')) {
            const selector = line.slice('@click '.length).trim();
            const handle = await page.$(`[data-stage] ${selector}`);
            if (!handle) {
                throw new Error(`@click: no element for ${selector}`);
            }
            // a real pointer sequence: Pressable listens to pointerdown/pointerup
            await handle.click();
            await new Promise(r => setTimeout(r, 100));
        } else if (line === '@touch') {
            await page.evaluate(() => {
                document
                    .querySelector('[data-stage]')
                    ?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
            });
        } else {
            await page.evaluate(raw => window.__panel.dispatch(raw), line.replace(/\\r/g, '\r').replace(/\\n/g, '\n'));
        }
    }
    await new Promise(r => setTimeout(r, waitMs));

    const box = await page.evaluate(() => {
        const el = document.querySelector('[data-stage]');
        if (!el) {
            return null;
        }
        const r = el.getBoundingClientRect();
        return { x: r.left, y: r.top, width: r.width, height: r.height };
    });
    if (!box) {
        throw new Error('stage not found');
    }
    await page.screenshot({ path: output, clip: box });
    const sent = await page.evaluate(() => window.__panel.sent);
    console.log(`saved ${output} (${Math.round(box.width * scale)}x${Math.round(box.height * scale)})`);
    console.log(`frontend sent: ${JSON.stringify(sent)}`);
} finally {
    await browser.close();
}
