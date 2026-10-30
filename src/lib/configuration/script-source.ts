/**
 * Pure source-text rewriting of a NSPanel configuration script (javascript adapter, TypeScript) after
 * parts of it were converted to the admin configuration, plus the planning of the script backups.
 *
 * No I/O, no adapter instance: strings in, strings out. The scanner never "understands" the script - it
 * only knows strings, comments, template literals and regex literals (so their content is never treated as
 * code) and matches brackets on the rest. Everything that is not found unambiguously is left untouched and
 * reported in `notes`.
 */

export type ScriptRewriteResult = {
    /** the rewritten source (identical to the input when nothing changed) */
    source: string;
    changed: boolean;
    /** human readable remarks: what was not found or was deliberately left untouched */
    notes: string[];
};

export type RemovePagesResult = ScriptRewriteResult & {
    /** uniqueNames whose entries were removed from `pages`/`subPages` */
    removed: string[];
    /** uniqueNames that have no entry in `pages`/`subPages` of the config object */
    notFound: string[];
    /** uniqueNames whose entry was removed but whose page definition stays active in the script */
    definitionKept: string[];
};

export type ClearScreensaverResult = ScriptRewriteResult & {
    /** config properties that were emptied (e.g. `favoritScreensaverEntity`, `advancedOptions.screensaverSwipe`) */
    cleared: string[];
};

export type ScriptArrayEntry = {
    /** the code of the array element (identifier or an object literal) */
    text: string;
    /** the `uniqueName` of the page the element stands for, when it could be resolved */
    uniqueName?: string;
};

export type ScriptConfigSummary = {
    /** false when the config object was not found - the other fields are empty then */
    found: boolean;
    pages: ScriptArrayEntry[];
    subPages: ScriptArrayEntry[];
};

export type BackupPlan = {
    /** id of the new backup object */
    backupId: string;
    /** renames of the existing backups, highest number first (execute after `deletes`, before creating `backupId`) */
    renames: { from: string; to: string }[];
    /** backups that would exceed the limit - delete them before the renames */
    deletes: string[];
};

/** number of backups kept per script (`_1_backup` … `_4_backup`) */
export const MAX_SCRIPT_BACKUPS = 4;

const SCREENSAVER_ARRAY_PROPS = [
    'favoritScreensaverEntity',
    'alternateScreensaverEntity',
    'leftScreensaverEntity',
    'bottomScreensaverEntity',
    'indicatorScreensaverEntity',
    'notifyScreensaverEntity',
] as const;
const SCREENSAVER_MR_PROPS = ['mrIcon1ScreensaverEntity', 'mrIcon2ScreensaverEntity'] as const;
const SCREENSAVER_ADVANCED_PROPS = new Set<string>(['screensaverSwipe', 'screensaverIndicatorButtons']);

// ---------------------------------------------------------------------------------------------------------
// tokenizer: classifies every character of the source
// ---------------------------------------------------------------------------------------------------------

const KIND_CODE = 0;
const KIND_COMMENT = 1;
const KIND_STRING = 2;
const KIND_TEMPLATE = 3;
const KIND_REGEX = 4;

type ScannedSource = {
    src: string;
    /** the source with every non-code character replaced by a space (newlines are kept, positions match `src`) */
    blank: string;
    /** KIND_* per character */
    kind: Uint8Array;
};

/** a `/` after one of these words starts a regex literal, not a division */
const REGEX_KEYWORDS = new Set([
    'return',
    'typeof',
    'case',
    'do',
    'else',
    'in',
    'of',
    'instanceof',
    'new',
    'delete',
    'void',
    'throw',
    'yield',
    'await',
]);

function isIdentChar(c: string): boolean {
    return c !== '' && /[A-Za-z0-9_$]/.test(c);
}

function isSpace(c: string): boolean {
    return c !== '' && /\s/.test(c);
}

/**
 * Classifies the characters of the source: code, comment, string, template literal or regex literal.
 *
 * @param src the script source
 */
function scanSource(src: string): ScannedSource {
    const n = src.length;
    const kind = new Uint8Array(n);
    const blankChars: string[] = new Array<string>(n);
    let lastSig = '';
    let lastWord = '';

    function mark(from: number, to: number, k: number): void {
        for (let p = from; p < to && p < n; p++) {
            kind[p] = k;
            blankChars[p] = src[p] === '\n' || src[p] === '\r' ? src[p] : ' ';
        }
    }

    /**
     * end of the regex literal starting at `start` (incl. flags), -1 when it is not one
     *
     * @param start position of the opening slash
     */
    function scanRegex(start: number): number {
        let i = start + 1;
        let inClass = false;
        while (i < n) {
            const c = src[i];
            if (c === '\n' || c === '\r') {
                return -1;
            }
            if (c === '\\') {
                i += 2;
                continue;
            }
            if (inClass) {
                if (c === ']') {
                    inClass = false;
                }
                i++;
                continue;
            }
            if (c === '[') {
                inClass = true;
                i++;
                continue;
            }
            if (c === '/') {
                i++;
                while (i < n && /[a-z]/i.test(src[i])) {
                    i++;
                }
                return i;
            }
            i++;
        }
        return -1;
    }

    /**
     * end of the template literal starting at `start`; `${ … }` expressions are scanned as code
     *
     * @param start position of the opening backtick
     */
    function scanTemplate(start: number): number {
        mark(start, start + 1, KIND_TEMPLATE);
        let i = start + 1;
        while (i < n) {
            const c = src[i];
            if (c === '\\') {
                mark(i, i + 2, KIND_TEMPLATE);
                i += 2;
                continue;
            }
            if (c === '`') {
                mark(i, i + 1, KIND_TEMPLATE);
                return i + 1;
            }
            if (c === '$' && src[i + 1] === '{') {
                mark(i, i + 2, KIND_TEMPLATE);
                i = scanCode(i + 2, true);
                if (i < n) {
                    mark(i, i + 1, KIND_TEMPLATE);
                    i++;
                }
                continue;
            }
            mark(i, i + 1, KIND_TEMPLATE);
            i++;
        }
        return n;
    }

    /**
     * scans code from `start`; with `stopAtBrace` it returns at the `}` closing a `${` of a template literal
     *
     * @param start position
     * @param stopAtBrace inside a template expression
     */
    function scanCode(start: number, stopAtBrace: boolean): number {
        let i = start;
        let depth = 0;
        while (i < n) {
            const c = src[i];
            if (c === '/' && src[i + 1] === '/') {
                let j = i;
                while (j < n && src[j] !== '\n') {
                    j++;
                }
                mark(i, j, KIND_COMMENT);
                i = j;
                continue;
            }
            if (c === '/' && src[i + 1] === '*') {
                const found = src.indexOf('*/', i + 2);
                const j = found < 0 ? n : found + 2;
                mark(i, j, KIND_COMMENT);
                i = j;
                continue;
            }
            if (c === "'" || c === '"') {
                let j = i + 1;
                while (j < n) {
                    const d = src[j];
                    if (d === '\\') {
                        j += 2;
                        continue;
                    }
                    if (d === c) {
                        j++;
                        break;
                    }
                    if (d === '\n') {
                        break;
                    }
                    j++;
                }
                mark(i, j, KIND_STRING);
                i = Math.min(j, n);
                lastSig = c;
                lastWord = '';
                continue;
            }
            if (c === '`') {
                i = scanTemplate(i);
                lastSig = '`';
                lastWord = '';
                continue;
            }
            if (c === '/') {
                const isRegex =
                    lastSig === '' ||
                    '(,=:[!&|?{};+-*%<>~^'.includes(lastSig) ||
                    (isIdentChar(lastSig) && REGEX_KEYWORDS.has(lastWord));
                if (isRegex) {
                    const j = scanRegex(i);
                    if (j > 0) {
                        mark(i, j, KIND_REGEX);
                        i = j;
                        lastSig = '/';
                        lastWord = '';
                        continue;
                    }
                }
            }
            if (isIdentChar(c)) {
                let j = i;
                while (j < n && isIdentChar(src[j])) {
                    blankChars[j] = src[j];
                    j++;
                }
                lastWord = src.slice(i, j);
                lastSig = src[j - 1];
                i = j;
                continue;
            }
            blankChars[i] = c;
            if (stopAtBrace) {
                if (c === '{') {
                    depth++;
                } else if (c === '}') {
                    if (depth === 0) {
                        return i;
                    }
                    depth--;
                }
            }
            if (!isSpace(c)) {
                lastSig = c;
                lastWord = '';
            }
            i++;
        }
        return n;
    }

    scanCode(0, false);
    return { src, blank: blankChars.join(''), kind };
}

// ---------------------------------------------------------------------------------------------------------
// bracket matching and structural helpers (all positions refer to the original source)
// ---------------------------------------------------------------------------------------------------------

const OPENERS = '{[(';
const CLOSERS = '}])';

/**
 * Position of the bracket closing the one at `open`, -1 when unbalanced.
 *
 * @param blank the blanked source
 * @param open position of `{`, `[` or `(`
 */
function findMatching(blank: string, open: number): number {
    const stack: string[] = [];
    for (let i = open; i < blank.length; i++) {
        const c = blank[i];
        const oi = OPENERS.indexOf(c);
        if (oi >= 0) {
            stack.push(CLOSERS[oi]);
            continue;
        }
        if (CLOSERS.includes(c)) {
            if (stack.pop() !== c) {
                return -1;
            }
            if (stack.length === 0) {
                return i;
            }
        }
    }
    return -1;
}

/**
 * Position of the `{` of the innermost object literal containing `pos`, -1 when there is none.
 *
 * @param blank the blanked source
 * @param pos position inside the object
 */
function enclosingBrace(blank: string, pos: number): number {
    let depth = 0;
    for (let i = pos - 1; i >= 0; i--) {
        const c = blank[i];
        if (CLOSERS.includes(c)) {
            depth++;
        } else if (OPENERS.includes(c)) {
            if (depth === 0) {
                return c === '{' ? i : -1;
            }
            depth--;
        }
    }
    return -1;
}

/**
 * skips whitespace and comments
 *
 * @param s scanned source
 * @param pos start position
 * @param limit exclusive end
 */
function skipTrivia(s: ScannedSource, pos: number, limit: number): number {
    let i = pos;
    while (i < limit && (s.kind[i] === KIND_COMMENT || (s.kind[i] === KIND_CODE && isSpace(s.src[i])))) {
        i++;
    }
    return i;
}

/**
 * steps back over whitespace and comments; returns the exclusive end of the significant text
 *
 * @param s scanned source
 * @param pos exclusive end to step back from
 * @param min lower bound
 */
function trimTrivia(s: ScannedSource, pos: number, min: number): number {
    let i = pos;
    while (i > min && (s.kind[i - 1] === KIND_COMMENT || (s.kind[i - 1] === KIND_CODE && isSpace(s.src[i - 1])))) {
        i--;
    }
    return i;
}

function lineStart(src: string, pos: number): number {
    const nl = src.lastIndexOf('\n', pos - 1);
    return nl < 0 ? 0 : nl + 1;
}

/**
 * position of the `\n` ending the line (or the source length)
 *
 * @param src the source
 * @param pos position on the line
 */
function lineEnd(src: string, pos: number): number {
    const nl = src.indexOf('\n', pos);
    return nl < 0 ? src.length : nl;
}

/**
 * Reads the quoted string literal starting at `pos`; undefined when there is none.
 *
 * @param s scanned source
 * @param pos position of the opening quote
 */
function readStringLiteral(s: ScannedSource, pos: number): { value: string; end: number } | undefined {
    if (s.kind[pos] !== KIND_STRING) {
        return undefined;
    }
    let end = pos;
    while (end < s.src.length && s.kind[end] === KIND_STRING) {
        end++;
    }
    const raw = s.src.slice(pos, end);
    if (raw.length < 2 || raw[0] !== raw[raw.length - 1]) {
        return undefined;
    }
    return { value: raw.slice(1, -1).replace(/\\(.)/g, '$1'), end };
}

type ObjectProperty = {
    key: string;
    keyStart: number;
    /** start of the value (after `:` and trivia) */
    valueStart: number;
    /** exclusive end of the value without trailing trivia */
    valueEnd: number;
    /** position of the separating `,`, -1 for the last property without one */
    comma: number;
};

/**
 * Top-level properties of the object literal `{ … }` spanning [open, close].
 * Spread, computed keys, shorthand and method properties are skipped.
 *
 * @param s scanned source
 * @param open position of `{`
 * @param close position of the matching `}`
 */
function parseObjectProperties(s: ScannedSource, open: number, close: number): ObjectProperty[] {
    const result: ObjectProperty[] = [];
    const nextComma = (from: number): number => {
        let j = from;
        while (j < close) {
            const ch = s.blank[j];
            if (OPENERS.includes(ch)) {
                const m = findMatching(s.blank, j);
                if (m < 0 || m > close) {
                    return -1;
                }
                j = m + 1;
                continue;
            }
            if (ch === ',') {
                return j;
            }
            j++;
        }
        return -1;
    };
    let i = open + 1;
    while (i < close) {
        i = skipTrivia(s, i, close);
        if (i >= close) {
            break;
        }
        const keyStart = i;
        let key: string | undefined;
        if (isIdentChar(s.blank[i])) {
            let j = i;
            while (j < close && isIdentChar(s.blank[j])) {
                j++;
            }
            key = s.src.slice(i, j);
            i = j;
        } else if (s.kind[i] === KIND_STRING) {
            const str = readStringLiteral(s, i);
            if (str) {
                key = str.value;
                i = str.end;
            }
        }
        i = skipTrivia(s, i, close);
        if (key === undefined || s.blank[i] !== ':') {
            // spread, computed key, shorthand, method or something unexpected: skip to the next property
            const c = nextComma(i);
            if (c < 0) {
                break;
            }
            i = c + 1;
            continue;
        }
        const valueStart = skipTrivia(s, i + 1, close);
        const comma = nextComma(valueStart);
        const rawEnd = comma < 0 ? close : comma;
        const valueEnd = trimTrivia(s, rawEnd, valueStart);
        result.push({ key, keyStart, valueStart, valueEnd, comma });
        i = comma < 0 ? close : comma + 1;
    }
    return result;
}

type ArrayElement = {
    start: number;
    /** exclusive end without trailing trivia */
    end: number;
    /** position of the separating `,`, -1 for the last element without one */
    comma: number;
};

/**
 * Top-level elements of the array literal `[ … ]` spanning [open, close].
 *
 * @param s scanned source
 * @param open position of `[`
 * @param close position of the matching `]`
 */
function parseArrayElements(s: ScannedSource, open: number, close: number): ArrayElement[] {
    const result: ArrayElement[] = [];
    let i = open + 1;
    while (i < close) {
        const start = skipTrivia(s, i, close);
        let j = start;
        while (j < close) {
            const ch = s.blank[j];
            if (OPENERS.includes(ch)) {
                const m = findMatching(s.blank, j);
                if (m < 0 || m > close) {
                    return result;
                }
                j = m + 1;
                continue;
            }
            if (ch === ',') {
                break;
            }
            j++;
        }
        const comma = j < close ? j : -1;
        const end = trimTrivia(s, j, start);
        if (end > start) {
            result.push({ start, end, comma });
        }
        i = comma < 0 ? close : comma + 1;
    }
    return result;
}

type Range = { open: number; close: number };

/**
 * The `config` object literal of the script: `const config(: Type)? = { … }` or, as a fallback, the object
 * that has both `panelTopic` and `pages` as top-level properties.
 *
 * @param s scanned source
 */
function findConfigObject(s: ScannedSource): Range | undefined {
    const re = /\b(?:const|let|var)\s+config\s*(?::[^=;{}()]*)?=\s*\{/g;
    for (const m of s.blank.matchAll(re)) {
        const open = m.index + m[0].length - 1;
        const close = findMatching(s.blank, open);
        if (close > open) {
            return { open, close };
        }
    }
    for (const m of s.blank.matchAll(/\bpanelTopic\s*:/g)) {
        const open = enclosingBrace(s.blank, m.index);
        if (open < 0) {
            continue;
        }
        const close = findMatching(s.blank, open);
        if (close < 0) {
            continue;
        }
        const props = parseObjectProperties(s, open, close);
        if (props.some(p => p.key === 'pages') && props.some(p => p.key === 'panelTopic')) {
            return { open, close };
        }
    }
    return undefined;
}

/**
 * the property value must be an array literal that spans the whole value
 *
 * @param s scanned source
 * @param prop the property
 */
function arrayLiteralOf(s: ScannedSource, prop: ObjectProperty): Range | undefined {
    if (s.src[prop.valueStart] !== '[') {
        return undefined;
    }
    const close = findMatching(s.blank, prop.valueStart);
    return close === prop.valueEnd - 1 ? { open: prop.valueStart, close } : undefined;
}

/**
 * the property value must be an object literal that spans the whole value
 *
 * @param s scanned source
 * @param prop the property
 */
function objectLiteralOf(s: ScannedSource, prop: ObjectProperty): Range | undefined {
    if (s.src[prop.valueStart] !== '{') {
        return undefined;
    }
    const close = findMatching(s.blank, prop.valueStart);
    return close === prop.valueEnd - 1 ? { open: prop.valueStart, close } : undefined;
}

/**
 * The string value of the top-level property `uniqueName` of the object literal, undefined when it is
 * missing or not a plain string literal.
 *
 * @param s scanned source
 * @param obj the object literal
 */
function uniqueNameOf(s: ScannedSource, obj: Range): string | undefined {
    const prop = parseObjectProperties(s, obj.open, obj.close).find(p => p.key === 'uniqueName');
    if (!prop) {
        return undefined;
    }
    const str = readStringLiteral(s, prop.valueStart);
    return str && str.end === prop.valueEnd ? str.value : undefined;
}

type Definition = {
    /** position of `const`/`let`/`var` */
    stmtStart: number;
    /** exclusive end of the statement (after `;` or the last code on the line) */
    stmtEnd: number;
    body: Range;
};

function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * All `const|let|var <id>(: Type)? = { … }` statements of the script.
 *
 * @param s scanned source
 * @param id the identifier
 */
function findDefinitions(s: ScannedSource, id: string): Definition[] {
    const result: Definition[] = [];
    const re = new RegExp(`\\b(?:const|let|var)\\s+${escapeRegExp(id)}\\s*(?::[^=;{}()]*)?=\\s*\\{`, 'g');
    for (const m of s.blank.matchAll(re)) {
        const open = m.index + m[0].length - 1;
        const close = findMatching(s.blank, open);
        if (close < 0) {
            continue;
        }
        // the rest of the statement: `;`, `as Type`, trailing same-line comments; a `,` means a
        // multi-declarator statement, which is not supported
        let p = close + 1;
        let valid = true;
        for (;;) {
            while (p < s.src.length && (s.src[p] === ' ' || s.src[p] === '\t')) {
                p++;
            }
            if (p >= s.src.length || s.src[p] === '\n' || s.src[p] === '\r') {
                break;
            }
            if (s.kind[p] === KIND_COMMENT) {
                let q = p;
                while (q < s.src.length && s.kind[q] === KIND_COMMENT) {
                    q++;
                }
                if (s.src.slice(p, q).includes('\n')) {
                    break;
                }
                p = q;
                continue;
            }
            if (s.src[p] === ';') {
                p++;
                break;
            }
            if (s.src[p] === ',') {
                valid = false;
                break;
            }
            if (OPENERS.includes(s.blank[p])) {
                const mm = findMatching(s.blank, p);
                if (mm < 0) {
                    valid = false;
                    break;
                }
                p = mm + 1;
                continue;
            }
            p++;
        }
        if (valid) {
            result.push({ stmtStart: m.index, stmtEnd: trimTrivia(s, p, close + 1), body: { open, close } });
        }
    }
    return result;
}

/**
 * Whether the identifier occurs in the code (outside strings/comments) anywhere except the given statement.
 *
 * @param s scanned source
 * @param id identifier
 * @param exclude the statement defining it
 */
function isReferencedOutside(s: ScannedSource, id: string, exclude: Definition): boolean {
    const re = new RegExp(`(^|[^A-Za-z0-9_$.])${escapeRegExp(id)}(?![A-Za-z0-9_$])`, 'g');
    for (const m of s.blank.matchAll(re)) {
        const pos = m.index + m[1].length;
        if (pos < exclude.stmtStart || pos >= exclude.stmtEnd) {
            return true;
        }
    }
    return false;
}

// ---------------------------------------------------------------------------------------------------------
// edits
// ---------------------------------------------------------------------------------------------------------

type Edit = { start: number; end: number; text: string };

/**
 * Applies the edits; overlapping or touching deletions are merged, insertions are kept as they are.
 *
 * @param src the source
 * @param edits the edits
 */
function applyEdits(src: string, edits: Edit[]): string {
    const deletions = edits
        .filter(e => e.text === '' && e.end > e.start)
        .sort((a, b) => a.start - b.start)
        .reduce<Edit[]>((acc, e) => {
            const last = acc[acc.length - 1];
            if (last && e.start <= last.end) {
                last.end = Math.max(last.end, e.end);
            } else {
                acc.push({ ...e });
            }
            return acc;
        }, []);
    const all = [...deletions, ...edits.filter(e => e.text !== '')].sort((a, b) => b.start - a.start);
    let out = src;
    for (const e of all) {
        out = out.slice(0, e.start) + e.text + out.slice(e.end);
    }
    return out;
}

/**
 * Deletions removing an array element or an object property together with its separating comma and a
 * line comment on the same line; a line that becomes empty is removed completely.
 *
 * @param s scanned source
 * @param el the element (start/end of the code, position of the trailing comma or -1)
 * @param el.start start of the code
 * @param el.end exclusive end of the code
 */
function removalEdits(s: ScannedSource, el: { start: number; end: number }): Edit[] {
    const { src, kind } = s;
    let start = el.start;
    let end = el.end;
    let hasComma = false;
    for (;;) {
        let p = end;
        while (p < src.length && (src[p] === ' ' || src[p] === '\t')) {
            p++;
        }
        if (!hasComma && src[p] === ',' && kind[p] === KIND_CODE) {
            hasComma = true;
            end = p + 1;
            continue;
        }
        if (kind[p] === KIND_COMMENT) {
            let q = p;
            while (q < src.length && kind[q] === KIND_COMMENT) {
                q++;
            }
            if (!src.slice(p, q).includes('\n')) {
                end = q;
                continue;
            }
        }
        break;
    }
    const edits: Edit[] = [];
    if (hasComma) {
        while (end < src.length && (src[end] === ' ' || src[end] === '\t')) {
            end++;
        }
    } else {
        let k = start - 1;
        while (k >= 0 && (kind[k] === KIND_COMMENT || (kind[k] === KIND_CODE && isSpace(src[k])))) {
            k--;
        }
        if (k >= 0 && src[k] === ',' && kind[k] === KIND_CODE) {
            const sameLine = !src.slice(k + 1, start).includes('\n');
            edits.push({ start: k, end: sameLine ? start : k + 1, text: '' });
        }
    }
    const ls = lineStart(src, start);
    const le = lineEnd(src, end);
    if (/^[ \t]*$/.test(src.slice(ls, start)) && /^[ \t\r]*$/.test(src.slice(end, le))) {
        start = ls;
        end = le < src.length ? le + 1 : le;
    }
    edits.push({ start, end, text: '' });
    return edits;
}

/**
 * The marker comment for a position: a line comment when nothing but whitespace or a line comment follows
 * on that line, a block comment otherwise.
 *
 * @param src the source
 * @param pos position where the marker is inserted
 * @param text the marker text
 */
function markerEdit(src: string, pos: number, text: string): Edit {
    const rest = src.slice(pos, lineEnd(src, pos));
    const asLine = /^[ \t\r]*$/.test(rest) || /^[ \t]*\/\//.test(rest);
    return { start: pos, end: pos, text: asLine ? ` // ${text}` : ` /* ${text} */` };
}

/**
 * replaces the value of the property and appends the marker after the separating comma
 *
 * @param s scanned source
 * @param prop the property
 * @param value the new value text
 * @param marker the marker text
 */
function replaceValueEdits(s: ScannedSource, prop: ObjectProperty, value: string, marker: string): Edit[] {
    const markerPos = prop.comma >= 0 ? prop.comma + 1 : prop.valueEnd;
    return [{ start: prop.valueStart, end: prop.valueEnd, text: value }, markerEdit(s.src, markerPos, marker)];
}

/**
 * Comments the statement out with a block comment, or with line comments when the statement contains the
 * end-of-block-comment sequence.
 *
 * @param src the source
 * @param def the statement
 * @param marker the marker text (first line of the comment)
 */
function commentOut(src: string, def: Definition, marker: string): string {
    const ls = lineStart(src, def.stmtStart);
    const prefix = src.slice(ls, def.stmtStart);
    const indent = /^[ \t]*$/.test(prefix) ? prefix : '';
    const text = src.slice(def.stmtStart, def.stmtEnd);
    // a script written under Windows sits in the object with CRLF - the inserted lines keep its line ending
    const eol = src.includes('\r\n') ? '\r\n' : '\n';
    let replaced: string;
    if (text.includes('*/')) {
        const lines = text
            .split(eol)
            .map((line, i) =>
                i === 0
                    ? `// ${line}`
                    : line.startsWith(indent)
                      ? `${indent}// ${line.slice(indent.length)}`
                      : `// ${line}`,
            );
        replaced = `// ${marker}${eol}${indent}${lines.join(eol)}`;
    } else {
        replaced = `/* ${marker}${eol}${indent}${text}${eol}${indent}*/`;
    }
    return src.slice(0, def.stmtStart) + replaced + src.slice(def.stmtEnd);
}

// ---------------------------------------------------------------------------------------------------------
// public API
// ---------------------------------------------------------------------------------------------------------

type ResolvedElement = { uniqueName?: string; identifier?: string };

function resolveElement(s: ScannedSource, el: ArrayElement): ResolvedElement {
    const text = s.blank.slice(el.start, el.end).trim();
    if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(text)) {
        for (const def of findDefinitions(s, text)) {
            const uniqueName = uniqueNameOf(s, def.body);
            if (uniqueName !== undefined) {
                return { uniqueName, identifier: text };
            }
        }
        return { identifier: text };
    }
    if (s.src[el.start] === '{' && findMatching(s.blank, el.start) === el.end - 1) {
        return { uniqueName: uniqueNameOf(s, { open: el.start, close: el.end - 1 }) };
    }
    return {};
}

/**
 * The entries of `pages` and `subPages` of the config object, with the uniqueName each one resolves to.
 *
 * @param source the script source
 */
export function scanScriptConfig(source: string): ScriptConfigSummary {
    const s = scanSource(source);
    const cfg = findConfigObject(s);
    if (!cfg) {
        return { found: false, pages: [], subPages: [] };
    }
    const props = parseObjectProperties(s, cfg.open, cfg.close);
    const entries = (key: string): ScriptArrayEntry[] => {
        const prop = props.find(p => p.key === key);
        const arr = prop && arrayLiteralOf(s, prop);
        if (!arr) {
            return [];
        }
        return parseArrayElements(s, arr.open, arr.close).map(el => {
            const text = s.src.slice(el.start, el.end);
            const resolved = resolveElement(s, el);
            return resolved.uniqueName !== undefined ? { text, uniqueName: resolved.uniqueName } : { text };
        });
    };
    return { found: true, pages: entries('pages'), subPages: entries('subPages') };
}

/**
 * Removes the pages with the given uniqueNames from `pages`/`subPages` of the config object and comments
 * their definitions out (only when the identifier is not referenced anywhere else in the code).
 *
 * @param source the script source
 * @param uniqueNames the pages to remove
 * @param today date for the marker comment (YYYY-MM-DD)
 */
export function removePagesFromScript(source: string, uniqueNames: string[], today: string): RemovePagesResult {
    const notes: string[] = [];
    const removed: string[] = [];
    const definitionKept: string[] = [];
    const wanted = [...new Set(uniqueNames)];
    let s = scanSource(source);
    const cfg = findConfigObject(s);
    if (!cfg) {
        notes.push('config object not found - script left unchanged');
        return { source, changed: false, notes, removed, notFound: wanted, definitionKept };
    }
    const props = parseObjectProperties(s, cfg.open, cfg.close);
    const edits: Edit[] = [];
    const found = new Set<string>();
    /** identifier -> uniqueName of the removed entries that reference a definition */
    const identifiers = new Map<string, string>();
    for (const key of ['pages', 'subPages']) {
        const prop = props.find(p => p.key === key);
        if (!prop) {
            notes.push(`${key} not found in the config object`);
            continue;
        }
        const arr = arrayLiteralOf(s, prop);
        if (!arr) {
            notes.push(`${key} is not an array literal - left unchanged`);
            continue;
        }
        for (const el of parseArrayElements(s, arr.open, arr.close)) {
            const resolved = resolveElement(s, el);
            if (resolved.uniqueName === undefined || !wanted.includes(resolved.uniqueName)) {
                continue;
            }
            found.add(resolved.uniqueName);
            edits.push(...removalEdits(s, el));
            if (resolved.identifier) {
                identifiers.set(resolved.identifier, resolved.uniqueName);
            }
        }
    }
    const notFound = wanted.filter(name => !found.has(name));
    removed.push(...wanted.filter(name => found.has(name)));
    for (const name of notFound) {
        notes.push(`page "${name}" not found in pages/subPages - nothing removed`);
    }
    let out = applyEdits(source, edits);

    const marker = `NSPanel: converted to the admin page configuration on ${today}`;
    for (const [id, name] of identifiers) {
        s = scanSource(out);
        const def = findDefinitions(s, id).find(d => uniqueNameOf(s, d.body) === name);
        if (!def) {
            definitionKept.push(name);
            notes.push(`definition of "${id}" (page "${name}") not found - left unchanged`);
            continue;
        }
        if (isReferencedOutside(s, id, def)) {
            definitionKept.push(name);
            notes.push(`"${id}" (page "${name}") is still referenced in the script - definition kept`);
            continue;
        }
        out = commentOut(out, def, marker);
    }
    return { source: out, changed: out !== source, notes, removed, notFound, definitionKept };
}

/**
 * Empties the screensaver configuration of the config object: the element arrays become `[]`, the mrIcon
 * objects `undefined`, and `advancedOptions.screensaverSwipe`/`screensaverIndicatorButtons` are removed
 * (adapter default). Already empty values are left untouched.
 *
 * @param source the script source
 * @param today date for the marker comment (YYYY-MM-DD)
 */
export function clearScreensaverInScript(source: string, today: string): ClearScreensaverResult {
    const notes: string[] = [];
    const cleared: string[] = [];
    const s = scanSource(source);
    const cfg = findConfigObject(s);
    if (!cfg) {
        notes.push('config object not found - script left unchanged');
        return { source, changed: false, notes, cleared };
    }
    const marker = `NSPanel: moved to the admin screensaver on ${today}`;
    const props = parseObjectProperties(s, cfg.open, cfg.close);
    const edits: Edit[] = [];
    const valueText = (prop: ObjectProperty): string => s.blank.slice(prop.valueStart, prop.valueEnd).trim();

    for (const key of SCREENSAVER_ARRAY_PROPS) {
        const prop = props.find(p => p.key === key);
        if (!prop) {
            continue;
        }
        const arr = arrayLiteralOf(s, prop);
        if (!arr) {
            if (valueText(prop) !== 'undefined') {
                notes.push(`${key} is not an array literal - left unchanged`);
            }
            continue;
        }
        if (parseArrayElements(s, arr.open, arr.close).length === 0) {
            continue;
        }
        edits.push(...replaceValueEdits(s, prop, '[]', marker));
        cleared.push(key);
    }
    for (const key of SCREENSAVER_MR_PROPS) {
        const prop = props.find(p => p.key === key);
        if (!prop) {
            continue;
        }
        const text = valueText(prop);
        if (text === 'undefined' || text === 'null') {
            continue;
        }
        edits.push(...replaceValueEdits(s, prop, 'undefined', marker));
        cleared.push(key);
    }
    const advanced = props.find(p => p.key === 'advancedOptions');
    if (advanced) {
        const obj = objectLiteralOf(s, advanced);
        if (!obj) {
            if (valueText(advanced) !== 'undefined') {
                notes.push('advancedOptions is not an object literal - left unchanged');
            }
        } else {
            let any = false;
            for (const sub of parseObjectProperties(s, obj.open, obj.close)) {
                if (SCREENSAVER_ADVANCED_PROPS.has(sub.key)) {
                    edits.push(...removalEdits(s, { start: sub.keyStart, end: sub.valueEnd }));
                    cleared.push(`advancedOptions.${sub.key}`);
                    any = true;
                }
            }
            if (any) {
                edits.push(markerEdit(s.src, advanced.comma >= 0 ? advanced.comma + 1 : advanced.valueEnd, marker));
            }
        }
    }
    const out = applyEdits(source, edits);
    return { source: out, changed: out !== source, notes, cleared };
}

/**
 * Sets `buttonLeft`/`buttonRight` of the config object to `null`.
 *
 * @param source the script source
 * @param sides which buttons
 * @param today date for the marker comment (YYYY-MM-DD)
 */
export function clearButtonsInScript(source: string, sides: ('left' | 'right')[], today: string): ScriptRewriteResult {
    const notes: string[] = [];
    const s = scanSource(source);
    const cfg = findConfigObject(s);
    if (!cfg) {
        notes.push('config object not found - script left unchanged');
        return { source, changed: false, notes };
    }
    const marker = `NSPanel: moved to the admin panel configuration on ${today}`;
    const props = parseObjectProperties(s, cfg.open, cfg.close);
    const edits: Edit[] = [];
    for (const side of new Set(sides)) {
        const key = side === 'left' ? 'buttonLeft' : 'buttonRight';
        const prop = props.find(p => p.key === key);
        if (!prop) {
            notes.push(`${key} not found in the config object`);
            continue;
        }
        if (s.blank.slice(prop.valueStart, prop.valueEnd).trim() === 'null') {
            continue;
        }
        edits.push(...replaceValueEdits(s, prop, 'null', marker));
    }
    const out = applyEdits(source, edits);
    return { source: out, changed: out !== source, notes };
}

/**
 * Plans the backup rotation: the new backup becomes `<scriptId>_1_backup`, existing backups move one number
 * up, and everything that would end at a number above MAX_SCRIPT_BACKUPS is deleted. Only ids matching
 * `<scriptId>_<n>_backup` are considered. Execute `deletes` first, then `renames` in order, then create
 * `backupId`.
 *
 * @param scriptId id of the script object (`script.js.…`)
 * @param existingIds all object ids that may be backups of it (other ids are ignored)
 */
export function planScriptBackup(scriptId: string, existingIds: string[]): BackupPlan {
    const re = new RegExp(`^${escapeRegExp(scriptId)}_([1-9]\\d*)_backup$`);
    const existing: { id: string; n: number }[] = [];
    for (const id of new Set(existingIds)) {
        const m = re.exec(id);
        if (m) {
            existing.push({ id, n: Number(m[1]) });
        }
    }
    existing.sort((a, b) => b.n - a.n);
    return {
        backupId: `${scriptId}_1_backup`,
        renames: existing
            .filter(e => e.n < MAX_SCRIPT_BACKUPS)
            .map(e => ({ from: e.id, to: `${scriptId}_${e.n + 1}_backup` })),
        deletes: existing.filter(e => e.n >= MAX_SCRIPT_BACKUPS).map(e => e.id),
    };
}

/**
 * `common.name` of a backup: `<name> backup <n>`; an existing ` backup <n>` suffix is replaced.
 *
 * @param scriptName name of the script (or of a backup of it)
 * @param n backup number
 */
export function backupName(scriptName: string, n: number): string {
    return `${scriptName.replace(/\s+backup\s+\d+$/, '')} backup ${n}`;
}
