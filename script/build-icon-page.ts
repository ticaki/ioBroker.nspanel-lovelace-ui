/**
 * Builds the icon overview for GitHub Pages: all icons of the panel with name and glyph.
 *
 * Reads `script/icons.json` and `script/custom-icons.json`, writes into the output directory:
 *  - index.html  (copy of `pages/icons.html`)
 *  - icons.json  (compact: name, hex, svg path, MDI version, own icon)
 *
 * Usage: `npx tsx script/build-icon-page.ts [outDir]` (default `_site`)
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

interface IconEntry {
    name: string;
    data: string;
    hex: string;
    version: string;
}

interface CustomIcon {
    name: string;
    hex: string;
}

interface PageIcon {
    n: string;
    h: string;
    d: string;
    v?: string;
    c?: 1;
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(root, process.argv[2] ?? '_site');

const icons = JSON.parse(fs.readFileSync(path.join(root, 'script', 'icons.json'), 'utf8')) as IconEntry[];
const custom = JSON.parse(fs.readFileSync(path.join(root, 'script', 'custom-icons.json'), 'utf8')) as CustomIcon[];
const customNames = new Set(custom.map(c => c.name));

const pageIcons: PageIcon[] = icons
    .map((i): PageIcon => {
        const entry: PageIcon = { n: i.name, h: i.hex.toUpperCase(), d: i.data };
        if (customNames.has(i.name)) {
            entry.c = 1;
        } else if (i.version) {
            entry.v = i.version;
        }
        return entry;
    })
    .sort((a, b) => a.n.localeCompare(b.n));

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'icons.json'), JSON.stringify(pageIcons));
fs.copyFileSync(path.join(root, 'pages', 'icons.html'), path.join(outDir, 'index.html'));
console.log(`${pageIcons.length} icons written to ${outDir}`);
