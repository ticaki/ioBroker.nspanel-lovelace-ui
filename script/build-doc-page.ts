/**
 * Builds the user documentation for GitHub Pages: every page of `doc/de` and `doc/en`
 * as static HTML, with navigation from `_Sidebar.md`, a language switch and a search box.
 *
 * Writes into the output directory:
 *  - index.html            start page with language choice and a link to the icon overview
 *  - de/*.html, en/*.html  one page per markdown file
 *  - Pictures/**           copied unchanged, so the relative `../Pictures/...` paths keep working
 *  - <Page>.html           language-neutral redirect, follows the browser language
 *  - assets/doc.css, assets/doc.js
 *  - de/search.json, en/search.json
 *
 * Placeholders: `{{version:<key>}}` in any markdown file is filled from `json/version.json`,
 * e.g. `{{version:tft}}` for the current TFT release, so the pages never carry a stale version.
 *
 * Usage: `npx tsx script/build-doc-page.ts [outDir] [--strict]` (default `_site`).
 * With `--strict` a dead internal link or anchor ends the build with exit code 1.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const outDir = path.resolve(root, args.find(a => !a.startsWith('--')) ?? '_site');
const docDir = path.join(root, 'doc');
/** Versions of tft, tasmota and berry - the single source for every version in the pages. */
const versions = JSON.parse(fs.readFileSync(path.join(root, 'json', 'version.json'), 'utf8')) as Record<string, string>;
const REPO = 'https://github.com/ticaki/ioBroker.nspanel-lovelace-ui';

interface Lang {
    code: string;
    htmlLang: string;
    label: string;
    /** texts of the surrounding frame */
    ui: {
        docs: string;
        search: string;
        searchHint: string;
        noHits: string;
        icons: string;
        iconsHint: string;
        start: string;
        source: string;
        repo: string;
        other: string;
        menu: string;
    };
}

const LANGS: Lang[] = [
    {
        code: 'de',
        htmlLang: 'de',
        label: 'Deutsch',
        ui: {
            docs: 'Dokumentation',
            search: 'Suchen',
            searchHint: 'Suchbegriff eingeben',
            noHits: 'Kein Treffer',
            icons: 'Icon-Übersicht',
            iconsHint: 'Alle Symbole des Panels mit Namen',
            start: 'Startseite',
            source: 'Quelle dieser Seite',
            repo: 'Projekt auf GitHub',
            other: 'English',
            menu: 'Inhalt',
        },
    },
    {
        code: 'en',
        htmlLang: 'en',
        label: 'English',
        ui: {
            docs: 'Documentation',
            search: 'Search',
            searchHint: 'Enter a search term',
            noHits: 'No match',
            icons: 'Icon overview',
            iconsHint: 'Every panel icon with its name',
            start: 'Start page',
            source: 'Source of this page',
            repo: 'Project on GitHub',
            other: 'Deutsch',
            menu: 'Contents',
        },
    },
];

const md = new MarkdownIt({ html: true, linkify: true, typographer: false });

/** Resolves the entities markdown-it writes, so they do not end up inside an id. */
function decodeEntities(text: string): string {
    return text
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;|&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, (_m, dec: string) => String.fromCodePoint(Number(dec)))
        .replace(/&amp;/g, '&');
}

/** Header ids the way GitHub builds them, so the anchors of the wiki-style links keep working:
 *  lower case, punctuation dropped, every single blank turned into a hyphen (two blanks around a
 *  dash therefore give two hyphens), letters with diacritics and underscores kept. */
function slug(text: string): string {
    return decodeEntities(text.replace(/<[^>]*>/g, ''))
        .trim()
        .toLowerCase()
        .replace(/[`*]/g, '')
        .replace(/[^\p{L}\p{N} _\-]/gu, '')
        .replace(/ /g, '-');
}

interface Page {
    /** file name without extension, e.g. `pageMenu` */
    name: string;
    title: string;
    srcFile: string;
    html: string;
    anchors: Set<string>;
    text: string;
    headings: string[];
}

const warnings: string[] = [];

/**
 * Fills `{{version:<key>}}` from `json/version.json`. An unknown key stays in the text and is
 * reported, so a typo shows up in the build instead of on the page.
 *
 * @param src Markdown source.
 * @param where File the source came from, for the warning.
 * @returns The source with the versions filled in.
 */
function fillPlaceholders(src: string, where: string): string {
    return src.replace(/\{\{version:([a-z0-9-]+)\}\}/gi, (all, key: string) => {
        const value = versions[key];
        if (value === undefined) {
            warnings.push(`${where}: unknown version key -> ${key}`);
            return all;
        }
        return value;
    });
}

function readPages(lang: Lang): Page[] {
    const dir = path.join(docDir, lang.code);
    const files = fs
        .readdirSync(dir)
        .filter(f => f.endsWith('.md') && !f.startsWith('_'))
        .sort();
    const pages: Page[] = [];
    for (const file of files) {
        const src = fillPlaceholders(fs.readFileSync(path.join(dir, file), 'utf8'), `doc/${lang.code}/${file}`);
        const name = file.replace(/\.md$/, '');
        const anchors = new Set<string>();
        const headings: string[] = [];
        const used = new Map<string, number>();
        let title = name;
        // collect the headings first: the renderer needs the ids, the search needs the texts
        for (const m of src.matchAll(/^(#{1,6})[ \t]+(.+?)[ \t]*#*$/gm)) {
            const plain = m[2].replace(/[`*_]/g, '').trim();
            let id = slug(m[2]);
            const seen = used.get(id);
            if (seen !== undefined) {
                used.set(id, seen + 1);
                id = `${id}-${seen + 1}`;
            } else {
                used.set(id, 0);
            }
            anchors.add(id);
            headings.push(plain);
            if (m[1] === '#' && title === name) {
                title = plain;
            }
        }
        pages.push({
            name,
            title,
            srcFile: `doc/${lang.code}/${file}`,
            html: render(src, name),
            anchors,
            text: src
                .replace(/```[\s\S]*?```/g, ' ')
                .replace(/<[^>]*>/g, ' ')
                .replace(/[#>*_`|]/g, ' ')
                .replace(/\s+/g, ' ')
                .slice(0, 4000),
            headings,
        });
    }
    return pages;
}

/** Renders one markdown file and gives the headings their ids. */
function render(src: string, _name: string): string {
    let html = md.render(src);
    const used = new Map<string, number>();
    html = html.replace(/<h([1-6])>(.*?)<\/h\1>/gs, (_all, level: string, inner: string) => {
        let id = slug(inner);
        const seen = used.get(id);
        if (seen !== undefined) {
            used.set(id, seen + 1);
            id = `${id}-${seen + 1}`;
        } else {
            used.set(id, 0);
        }
        return `<h${level} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${inner}</h${level}>`;
    });
    // GitHub alerts: > [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION]
    html = html.replace(
        /<blockquote>\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(?:<br\s*\/?>)?\s*/g,
        (_all, kind: string) =>
            `<blockquote class="callout ${kind.toLowerCase()}"><p class="callout-title">${kind}</p><p>`,
    );
    return html;
}

/** Turns the wiki-style links (`[text](pageMenu)`) into links of the generated site. */
function rewriteLinks(html: string, pages: Map<string, Page>, where: string): string {
    return html.replace(/(href|src)="([^"]*)"/g, (all, attr: string, value: string) => {
        if (attr === 'src' || /^(https?:|mailto:|#|\/|\.\.\/)/.test(value) || value === '') {
            return all;
        }
        const [rawTarget, anchor] = value.split('#');
        const target = decodeURIComponent(rawTarget).replace(/\.md$/, '');
        if (!target) {
            return all;
        }
        if (/\.(png|jpe?g|gif|svg|webp)$/i.test(target)) {
            return all;
        }
        const page = pages.get(target);
        if (!page) {
            warnings.push(`${where}: link target is missing -> ${target}`);
        } else if (
            anchor &&
            anchor.toLowerCase() !== 'top' &&
            !page.anchors.has(decodeURIComponent(anchor).toLowerCase())
        ) {
            warnings.push(`${where}: anchor is missing -> ${target}#${anchor}`);
        }
        return `${attr}="${encodeURI(target)}.html${anchor ? `#${anchor}` : ''}"`;
    });
}

function sidebar(lang: Lang, pages: Map<string, Page>): string {
    const file = path.join(docDir, lang.code, '_Sidebar.md');
    let html = fs.existsSync(file)
        ? md.render(fillPlaceholders(fs.readFileSync(file, 'utf8'), `doc/${lang.code}/_Sidebar.md`))
        : '';
    html = rewriteLinks(html, pages, `doc/${lang.code}/_Sidebar.md`);
    return html;
}

function footer(lang: Lang, pages: Map<string, Page>): string {
    const file = path.join(docDir, lang.code, '_Footer.md');
    if (!fs.existsSync(file)) {
        return '';
    }
    const src = fillPlaceholders(fs.readFileSync(file, 'utf8'), `doc/${lang.code}/_Footer.md`);
    return rewriteLinks(md.render(src), pages, `doc/${lang.code}/_Footer.md`);
}

function esc(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function pageHtml(lang: Lang, page: Page, nav: string, foot: string, hasOther: boolean): string {
    const other = LANGS.find(l => l.code !== lang.code)!;
    const otherHref = hasOther ? `../${other.code}/${encodeURI(page.name)}.html` : `../${other.code}/Home.html`;
    return `<!doctype html>
<html lang="${lang.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)} · NSPanel ${lang.ui.docs}</title>
<link rel="stylesheet" href="../assets/doc.css">
</head>
<body>
<a class="skip" href="#content">${esc(lang.ui.menu)}</a>
<header>
  <button id="navToggle" class="iconbtn" aria-label="${esc(lang.ui.menu)}">☰</button>
  <a class="brand" href="../index.html">NSPanel <span>${esc(lang.ui.docs)}</span></a>
  <div class="searchbox">
    <input type="search" id="q" placeholder="${esc(lang.ui.search)}" aria-label="${esc(lang.ui.search)}" autocomplete="off">
    <div id="results" hidden></div>
  </div>
  <a class="headlink" href="../icons/" title="${esc(lang.ui.iconsHint)}">◆ ${esc(lang.ui.icons)}</a>
  <a class="headlink" href="${otherHref}">${esc(lang.ui.other)}</a>
</header>
<div class="layout">
  <nav id="sidebar">${nav}</nav>
  <main id="content">
${page.html}
    <hr>
    <p class="meta">
      <a href="${REPO}/blob/main/${page.srcFile}">${esc(lang.ui.source)}: ${page.srcFile}</a> ·
      <a href="${REPO}">${esc(lang.ui.repo)}</a>
    </p>
    ${foot}
  </main>
</div>
<script>window.DOC_LANG=${JSON.stringify(lang.code)};window.DOC_TEXT=${JSON.stringify({ noHits: lang.ui.noHits, hint: lang.ui.searchHint })};</script>
<script src="../assets/doc.js"></script>
</body>
</html>
`;
}

/**
 * One redirect per page name at the top level, so a link can be handed out without a language:
 * `…/Adapter-Installation` lands on `de/` or `en/`, whichever the browser asks for.
 * The admin and the readme link to these.
 */
function redirectPage(name: string, available: string[]): string {
    const fallback = available.includes('en') ? 'en' : available[0];
    const links = available
        .map(code => `<a href="${code}/${encodeURI(name)}.html">${LANGS.find(l => l.code === code)!.label}</a>`)
        .join(' &middot; ');
    const target = encodeURI(name);
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(name)}</title>
<link rel="stylesheet" href="assets/doc.css">
<script>
(function () {
    var langs = ${JSON.stringify(available)};
    var want = (navigator.language || "en").toLowerCase().slice(0, 2);
    var code = langs.indexOf(want) >= 0 ? want : ${JSON.stringify(fallback)};
    location.replace(code + "/" + ${JSON.stringify(target)} + ".html" + location.hash);
})();
</script>
</head>
<body class="start">
<main>
  <h1>${esc(name)}</h1>
  <p class="lead">${links}</p>
</main>
</body>
</html>
`;
}

function startPage(byLang: Map<string, Page[]>): string {
    const cards = LANGS.map(l => {
        const count = byLang.get(l.code)!.length;
        return `    <a class="card" href="${l.code}/Home.html" lang="${l.htmlLang}">
      <h2>${esc(l.label)}</h2>
      <p>${l.code === 'de' ? `${count} Seiten der Nutzerdokumentation` : `${count} pages of user documentation`}</p>
    </a>`;
    }).join('\n');
    return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ioBroker.nspanel-lovelace-ui · Dokumentation / Documentation</title>
<link rel="stylesheet" href="assets/doc.css">
</head>
<body class="start">
<main>
  <h1>ioBroker.nspanel-lovelace-ui</h1>
  <p class="lead">Dokumentation &middot; Documentation</p>
  <div class="cards">
${cards}
    <a class="card icons" href="icons/">
      <h2>◆ Icons</h2>
      <p>Alle Symbole des Panels mit Namen<br><span lang="en">Every panel icon with its name</span></p>
    </a>
    <a class="card" href="${REPO}">
      <h2>GitHub</h2>
      <p>Quellcode, Issues, Releases</p>
    </a>
  </div>
</main>
</body>
</html>
`;
}

// ---------------------------------------------------------------- build

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const byLang = new Map<string, Page[]>();
for (const lang of LANGS) {
    byLang.set(lang.code, readPages(lang));
}

for (const lang of LANGS) {
    const pages = byLang.get(lang.code)!;
    const map = new Map(pages.map(p => [p.name, p]));
    const otherMap = new Map(byLang.get(LANGS.find(l => l.code !== lang.code)!.code)!.map(p => [p.name, p]));
    const nav = sidebar(lang, map);
    const foot = footer(lang, map);
    const dir = path.join(outDir, lang.code);
    fs.mkdirSync(dir, { recursive: true });
    for (const page of pages) {
        page.html = rewriteLinks(page.html, map, page.srcFile);
        fs.writeFileSync(path.join(dir, `${page.name}.html`), pageHtml(lang, page, nav, foot, otherMap.has(page.name)));
    }
    fs.writeFileSync(
        path.join(dir, 'search.json'),
        JSON.stringify(pages.map(p => ({ t: p.title, u: `${p.name}.html`, h: p.headings, x: p.text }))),
    );
    // index of the language folder -> the start page of that language
    fs.writeFileSync(
        path.join(dir, 'index.html'),
        `<!doctype html><html lang="${lang.htmlLang}"><head><meta charset="utf-8">` +
            `<meta http-equiv="refresh" content="0; url=Home.html"></head>` +
            `<body><a href="Home.html">${esc(lang.ui.start)}</a></body></html>\n`,
    );
}

fs.writeFileSync(path.join(outDir, 'index.html'), startPage(byLang));

// language-neutral redirects for every page name that exists in at least one language
const names = new Map<string, string[]>();
for (const lang of LANGS) {
    for (const page of byLang.get(lang.code)!) {
        const list = names.get(page.name) ?? [];
        list.push(lang.code);
        names.set(page.name, list);
    }
}
for (const [name, available] of names) {
    fs.writeFileSync(path.join(outDir, `${name}.html`), redirectPage(name, available));
}

fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });
fs.copyFileSync(path.join(root, 'pages', 'doc.css'), path.join(outDir, 'assets', 'doc.css'));
fs.copyFileSync(path.join(root, 'pages', 'doc.js'), path.join(outDir, 'assets', 'doc.js'));
fs.cpSync(path.join(docDir, 'Pictures'), path.join(outDir, 'Pictures'), { recursive: true });
fs.writeFileSync(path.join(outDir, '.nojekyll'), '');

const total = LANGS.map(l => `${l.code} ${byLang.get(l.code)!.length}`).join(' / ');
console.log(`documentation written to ${outDir}: ${total} pages, ${names.size} language-neutral redirects`);
if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const w of [...new Set(warnings)]) {
        console.log(`  ${w}`);
    }
    if (strict) {
        process.exit(1);
    }
} else {
    console.log('no dead internal links or anchors');
}
