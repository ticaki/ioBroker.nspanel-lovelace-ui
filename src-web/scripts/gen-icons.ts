/**
 * Generates the icon data of the web panel:
 *  - src/icons/glyph-map.json : HMI font glyph -> MDI icon name (from src/lib/const/icon_mapping.ts)
 *  - public/icons/mdi-paths.json : MDI icon name -> svg path (from @mdi/svg), only the names of the map,
 *    served as /icons/mdi-paths.json and fetched by src/icons/iconData.ts at startup. Names that MDI
 *    removed take the drawing of the HMI font from script/icons.json
 *
 * Runs in `prebuild`. Names without an MDI icon are listed on stderr.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(scriptDir, '..');
const mappingFile = path.join(webRoot, '..', 'src', 'lib', 'const', 'icon_mapping.ts');
const mdiSvgDir = path.join(webRoot, 'node_modules', '@mdi', 'svg', 'svg');
const hmiIconsFile = path.join(webRoot, '..', 'script', 'icons.json');
const outDir = path.join(webRoot, 'src', 'icons');
// the svg paths are big (~2.4 MB) and fetched at runtime from /icons/mdi-paths.json
const publicDir = path.join(webRoot, 'public', 'icons');

function main(): void {
    const source = fs.readFileSync(mappingFile, 'utf8');
    const glyphMap: Record<string, string> = {};
    const names = new Set<string>();
    // entries look like: ['account', '\uXXXX'],  - glyphs may be 1 or more code units
    const entry = /\['([^']+)',\s*'([^']*)'\]/g;
    let m: RegExpExecArray | null;
    while ((m = entry.exec(source)) !== null) {
        const [, name, glyph] = m;
        names.add(name);
        if (glyph !== '' && !(glyph in glyphMap)) {
            glyphMap[glyph] = name;
        }
    }

    const hmiPaths = new Map(
        (JSON.parse(fs.readFileSync(hmiIconsFile, 'utf8')) as { name: string; data: string }[]).map(i => [
            i.name,
            i.data,
        ]),
    );
    const paths: Record<string, string> = {};
    const missing: string[] = [];
    for (const name of [...names].sort()) {
        const file = path.join(mdiSvgDir, `${name}.svg`);
        if (!fs.existsSync(file)) {
            const data = hmiPaths.get(name);
            if (data) {
                paths[name] = data;
            } else {
                missing.push(name);
            }
            continue;
        }
        const svg = fs.readFileSync(file, 'utf8');
        const d = /<path[^>]*\sd="([^"]+)"/.exec(svg);
        if (!d) {
            missing.push(name);
            continue;
        }
        paths[name] = d[1];
    }

    fs.mkdirSync(outDir, { recursive: true });
    fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'glyph-map.json'), JSON.stringify(glyphMap));
    fs.writeFileSync(path.join(publicDir, 'mdi-paths.json'), JSON.stringify(paths));
    fs.writeFileSync(path.join(outDir, 'missing.json'), JSON.stringify(missing, null, 2));
    console.log(
        `icons: ${Object.keys(glyphMap).length} glyphs, ${Object.keys(paths).length} svg paths, ${missing.length} names without icon`,
    );
    if (missing.length) {
        console.error(`names without icon: ${missing.join(', ')}`);
    }
}

main();
