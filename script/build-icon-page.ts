/**
 * Builds the icon overview for GitHub Pages: all icons of the panel with name and glyph.
 *
 * Reads `script/icons.json`, `script/custom-icons.json` and `templates/popup-notify3-icons.json`, writes into the
 * output directory:
 *  - index.html  (copy of `pages/icons.html`)
 *  - icons.json  (compact: name, hex, svg path, MDI version, own icon, icon of the large notification popupNotify3)
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
    /** icon of the big icon font of popupNotify3 (large notification) */
    l?: 1;
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(root, process.argv[2] ?? '_site');

const icons = JSON.parse(fs.readFileSync(path.join(root, 'script', 'icons.json'), 'utf8')) as IconEntry[];
const custom = JSON.parse(fs.readFileSync(path.join(root, 'script', 'custom-icons.json'), 'utf8')) as CustomIcon[];
const customNames = new Set(custom.map(c => c.name));
const notify3Names = new Set(
    JSON.parse(fs.readFileSync(path.join(root, 'templates', 'popup-notify3-icons.json'), 'utf8')) as string[],
);

const pageIcons: PageIcon[] = icons
    .map((i): PageIcon => {
        const entry: PageIcon = { n: i.name, h: i.hex.toUpperCase(), d: i.data };
        if (customNames.has(i.name)) {
            entry.c = 1;
        } else if (i.version) {
            entry.v = i.version;
        }
        if (notify3Names.has(i.name)) {
            entry.l = 1;
        }
        return entry;
    })
    .sort((a, b) => a.n.localeCompare(b.n));

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'icons.json'), JSON.stringify(pageIcons));
fs.copyFileSync(path.join(root, 'pages', 'icons.html'), path.join(outDir, 'index.html'));
console.log(`${pageIcons.length} icons written to ${outDir}`);
