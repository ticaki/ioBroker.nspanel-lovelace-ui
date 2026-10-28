/**
 * Updates the icon data of the adapter from the Material Design Icons package `@mdi/svg`.
 *
 * Source of truth is `script/icons.json`: every icon has a fixed glyph (`hex`) in the icon fonts
 * of the panel (HMI). A glyph is never moved, otherwise configurations would show another icon.
 * Panel glyph = MDI codepoint - 0xF0001 + 0xE000 (the panel only knows 16 bit characters).
 *
 *  - existing icons: the svg path is the one `@mdi/svg` has on the codepoint of the glyph, if it is the
 *    same icon (MDI renamed some); icons removed by MDI keep their old path
 *  - renamed icons: the MDI name of the codepoint is added as alias with the same glyph
 *  - new icons: added with the glyph of their MDI codepoint; if MDI gave that codepoint to a new icon
 *    while the panel still has the removed one there, the new icon gets a reserved glyph
 *
 * Writes:
 *  - script/icons.json                  (name, data, hex, version, base64)
 *  - src-admin/src/icons.json           (name, base64) - icon selection of the admin
 *  - src/lib/const/icon_mapping.ts      (the `iconMap` entries, logo entries are kept)
 *  - src/lib/types/icon-mapping.d.ts    (type `AllIcons`)
 *  - script/example_sendTo_script_iobroker.ts (type `ScriptConfig.AllIcons`)
 *
 * The web panel picks the change up with `npm run gen:icons` in src-web (runs in its prebuild).
 * New glyphs need a TFT with the new icon fonts (HMI 6.0), older TFTs show nothing for them.
 *
 * Usage: `npx tsx script/update-icons.ts` (needs `npm ci` in src-web for `@mdi/svg`)
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

interface IconEntry {
    name: string;
    data: string;
    hex: string;
    version: string;
    base64: string;
}

interface MdiMeta {
    name: string;
    codepoint: string;
    version: string;
    aliases?: string[];
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const iconsFile = path.join(root, 'script', 'icons.json');
const adminIconsFile = path.join(root, 'src-admin', 'src', 'icons.json');
const mappingFile = path.join(root, 'src', 'lib', 'const', 'icon_mapping.ts');
const typesFile = path.join(root, 'src', 'lib', 'types', 'icon-mapping.d.ts');
const scriptFile = path.join(root, 'script', 'example_sendTo_script_iobroker.ts');
const mdiDir = path.join(root, 'src-web', 'node_modules', '@mdi', 'svg');

/**
 * Glyphs U+FD80..U+FDFF are reserved for MDI icons whose codepoint is taken by another icon of the panel
 * (MDI reused codepoints of removed brand icons). They are assigned from the top down.
 * MDI codepoints from there on are not used. U+FE00.. are variation selectors and specials.
 */
const FIRST_RESERVED = 0xfd80;
const LAST_GLYPH = 0xfdff;

function toGlyph(mdiCodepoint: string): number {
    return parseInt(mdiCodepoint, 16) - 0xf0001 + 0xe000;
}

function hexOf(glyph: number): string {
    return glyph.toString(16).toUpperCase().padStart(4, '0');
}

function svgPath(name: string): string | undefined {
    const file = path.join(mdiDir, 'svg', `${name}.svg`);
    if (!fs.existsSync(file)) {
        return undefined;
    }
    return /<path[^>]*\sd="([^"]+)"/.exec(fs.readFileSync(file, 'utf8'))?.[1];
}

function entry(name: string, data: string, hex: string, version: string): IconEntry {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${data}"/></svg>`;
    return { name, data, hex, version, base64: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}` };
}

function main(): void {
    if (!fs.existsSync(path.join(mdiDir, 'meta.json'))) {
        throw new Error(`${mdiDir} not found - run "npm ci" in src-web first`);
    }
    const mdiVersion = (JSON.parse(fs.readFileSync(path.join(mdiDir, 'package.json'), 'utf8')) as { version: string })
        .version;
    const meta = JSON.parse(fs.readFileSync(path.join(mdiDir, 'meta.json'), 'utf8')) as MdiMeta[];
    const icons = JSON.parse(fs.readFileSync(iconsFile, 'utf8')) as IconEntry[];

    const byName = new Map(icons.map(i => [i.name, i]));
    const byGlyph = new Map(icons.map(i => [parseInt(i.hex, 16), i]));
    const mdiByName = new Map(meta.map(m => [m.name, m]));
    const mdiByGlyph = new Map(meta.map(m => [toGlyph(m.codepoint), m]));
    const result = new Map<string, IconEntry>();
    let updated = 0;
    let kept = 0;
    let aliases = 0;
    let added = 0;
    let moved = 0;

    /**
     * The MDI icon on the codepoint of a panel glyph - if it is the same icon as the one of the panel.
     * MDI renamed icons (the old name is an alias or lives on under another codepoint), but it also
     * gave codepoints of removed icons to new ones (google-home -> receipt).
     *
     * @param icon the icon of the panel
     * @returns the MDI icon, undefined if MDI has none or another one on this codepoint
     */
    const sameIcon = (icon: IconEntry): MdiMeta | undefined => {
        const glyph = parseInt(icon.hex, 16);
        const m = glyph < FIRST_RESERVED ? mdiByGlyph.get(glyph) : undefined;
        if (!m) {
            return undefined;
        }
        return m.name === icon.name || mdiByName.has(icon.name) || m.aliases?.includes(icon.name) ? m : undefined;
    };

    // existing icons - the drawing of a glyph follows MDI, it is the same for all names of the glyph
    for (const icon of icons) {
        const m = sameIcon(icon);
        const data = (m && svgPath(m.name)) || icon.data;
        if (!m) {
            kept++;
        } else if (data !== icon.data) {
            updated++;
        }
        result.set(icon.name, entry(icon.name, data, icon.hex, icon.version));
    }

    // renamed and new icons
    const used = new Set(icons.map(i => parseInt(i.hex, 16)));
    let nextReserved = LAST_GLYPH;
    for (const m of meta) {
        if (byName.has(m.name)) {
            continue;
        }
        const data = svgPath(m.name);
        if (!data) {
            console.error(`skipped ${m.name}: no svg`);
            continue;
        }
        const glyph = toGlyph(m.codepoint);
        if (glyph < 0xe000 || glyph >= FIRST_RESERVED) {
            console.error(`skipped ${m.name}: glyph U+${hexOf(glyph)} out of range`);
            continue;
        }
        const old = byGlyph.get(glyph);
        if (!old) {
            result.set(m.name, entry(m.name, data, hexOf(glyph), m.version));
            used.add(glyph);
            added++;
        } else if (sameIcon(old)) {
            // MDI name of a codepoint the panel knows under another name
            result.set(m.name, entry(m.name, data, old.hex, old.version));
            aliases++;
        } else {
            // codepoint taken by another icon of the panel
            while (used.has(nextReserved)) {
                nextReserved--;
            }
            if (nextReserved < FIRST_RESERVED) {
                throw new Error(`no reserved glyph left for ${m.name}`);
            }
            used.add(nextReserved);
            result.set(m.name, entry(m.name, data, hexOf(nextReserved), m.version));
            console.log(`${m.name}: U+${hexOf(glyph)} is ${old.name} on the panel, moved to U+${hexOf(nextReserved)}`);
            moved++;
        }
    }

    const list = [...result.values()].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    fs.writeFileSync(iconsFile, `${JSON.stringify(list, null, 4)}\n`);
    fs.writeFileSync(
        adminIconsFile,
        `${JSON.stringify(
            list.map(i => ({ name: i.name, base64: i.base64 })),
            null,
            4,
        )}\n`,
    );

    // icon_mapping.ts: replace the generated entries, keep everything after the first logo entry
    const source = fs.readFileSync(mappingFile, 'utf8');
    const start = source.indexOf('static iconMap = new Map([\n');
    const logos = source.indexOf("        ['logo-", start);
    if (start < 0 || logos < 0) {
        throw new Error(`unexpected structure of ${mappingFile}`);
    }
    const head = source.slice(0, start + 'static iconMap = new Map([\n'.length);
    const entries = list.map(i => `        ['${i.name}', '${String.fromCharCode(parseInt(i.hex, 16))}'],\n`).join('');
    fs.writeFileSync(mappingFile, head + entries + source.slice(logos));

    fs.writeFileSync(typesFile, `type AllIcons =\n${list.map(i => `    | '${i.name}'\n`).join('')}    | '';\n`);

    // the example script has its own copy of AllIcons (namespace ScriptConfig)
    const script = fs.readFileSync(scriptFile, 'utf8');
    const union = /( {4}export type AllIcons =\n)(?: {8}\| '[^']*'\n)+/.exec(script);
    if (!union) {
        throw new Error(`AllIcons not found in ${scriptFile}`);
    }
    fs.writeFileSync(
        scriptFile,
        script.slice(0, union.index) +
            union[1] +
            list.map(i => `        | '${i.name}'\n`).join('') +
            `        | '';\n` +
            script.slice(union.index + union[0].length).replace(/^ {8}\| '';\n/, ''),
    );

    console.log(
        `icons (@mdi/svg ${mdiVersion}): ${list.length} total - ${updated} paths updated, ${kept} kept (not in MDI), ${aliases} aliases, ${added} new, ${moved} on reserved glyphs`,
    );
}

main();
