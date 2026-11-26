/**
 * Conversion of the configuration of the old standalone script "NSPanelTs.ts" (javascript adapter) into a
 * configuration script of this adapter (format of `script/example_sendTo_script_iobroker.ts`).
 *
 * Pure: source text in, source text out - no adapter, no states. The configuration part of the old script
 * (everything up to the end of `export const config: Config = { … };`) is cut out, its types are stripped
 * (`node:module` `stripTypeScriptTypes`) and it is evaluated in `node:vm` with a few stubs. The page objects
 * are matched to their variable names (the old script navigates by variable name), and the result is written
 * as readable TypeScript. Whatever cannot be mapped 1:1 is not guessed: it is kept as `// TODO` comment with the
 * original value at the place it belongs to.
 */
import * as nodeModule from 'node:module';
import * as vm from 'node:vm';
import { locateConfigObject } from './script-source';
import type { NsPanelTsUnsupportedReason } from './nspanelts-import-types';

// ---------------------------------------------------------------------------------------------------------
// version check
// ---------------------------------------------------------------------------------------------------------

/**
 * Oldest supported script version (inclusive). Compared part by part, missing parts count as 0.
 * The configuration format has only been extended since v4.4.
 */
export const NSPANELTS_MIN_VERSION = 'v4.4';
/** Newest supported script version: every `v5.1.1.x` */
export const NSPANELTS_MAX_VERSION = 'v5.1.1';

const SCRIPT_VERSION_RE = /\bconst\s+scriptVersion\s*(?::\s*string\s*)?=\s*(['"])([^'"\n]*)\1/;
const RECEIVE_TOPIC_RE = /\bconst\s+NSPanelReceiveTopic\s*(?::\s*string\s*)?=\s*(['"])([^'"\n]*)\1/;
const SEND_TOPIC_RE = /\bconst\s+NSPanelSendTopic\s*(?::\s*string\s*)?=\s*(['"])([^'"\n]*)\1/;

/**
 * Numeric parts of a version string like `v5.1.1.10`, undefined when it is no such version.
 *
 * @param version the version string
 * @returns the parts
 */
function versionParts(version: string): number[] | undefined {
    const m = /^v?(\d+(?:\.\d+)*)$/.exec(version.trim());
    return m ? m[1].split('.').map(p => parseInt(p, 10)) : undefined;
}

/**
 * Compares the first `length` parts (all when undefined) of two versions.
 *
 * @param a version a
 * @param b version b
 * @param length number of parts to compare
 * @returns <0, 0 or >0
 */
function compareParts(a: number[], b: number[], length?: number): number {
    const n = length ?? Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
        const d = (a[i] ?? 0) - (b[i] ?? 0);
        if (d !== 0) {
            return d;
        }
    }
    return 0;
}

/**
 * Whether the conversion supports this script version ({@link NSPANELTS_MIN_VERSION} …
 * {@link NSPANELTS_MAX_VERSION}`.x`).
 *
 * @param version value of `scriptVersion` in the old script
 * @returns true when supported
 */
export function isSupportedNsPanelTsVersion(version: string): boolean {
    const v = versionParts(version);
    const min = versionParts(NSPANELTS_MIN_VERSION);
    const max = versionParts(NSPANELTS_MAX_VERSION);
    if (!v || !min || !max) {
        return false;
    }
    return compareParts(v, min) >= 0 && compareParts(v, max, max.length) <= 0;
}

export type { NsPanelTsUnsupportedReason } from './nspanelts-import-types';

export type NsPanelTsInfo = {
    /** the source looks like the old NSPanelTs script */
    isNsPanelTs: boolean;
    /** value of `scriptVersion` */
    version?: string;
    supported: boolean;
    reason?: NsPanelTsUnsupportedReason;
    /** panel topic derived from `NSPanelReceiveTopic` / `NSPanelSendTopic` (mqtt state → topic), when it is a plain string */
    topic?: string;
};

/**
 * Turns the mqtt state of the old script (`mqtt.0.SmartHome.NSPanel_1.tele.RESULT`) into the topic of the
 * panel (`SmartHome/NSPanel_1`).
 *
 * @param state mqtt state id
 * @returns the topic, undefined when the id has another form
 */
export function topicFromMqttState(state: string): string | undefined {
    const m = /^mqtt\.\d+\.(.+)\.(?:tele\.RESULT|cmnd\.CustomSend)$/.exec(state.trim());
    return m ? m[1].replace(/\./g, '/') : undefined;
}

/**
 * Recognizes the old NSPanelTs script and checks whether it can be converted.
 *
 * @param source source of a script object
 * @returns the result of the check
 */
export function inspectNsPanelTs(source: string): NsPanelTsInfo {
    const versionMatch = SCRIPT_VERSION_RE.exec(source);
    const isNsPanelTs =
        /\bNSPanelReceiveTopic\b/.test(source) ||
        (versionMatch !== null && /zur Steuerung des SONOFF NSPanel/.test(source));
    if (!isNsPanelTs) {
        return { isNsPanelTs: false, supported: false };
    }
    const receive = RECEIVE_TOPIC_RE.exec(source);
    const send = SEND_TOPIC_RE.exec(source);
    const topic =
        (receive ? topicFromMqttState(receive[2]) : undefined) ?? (send ? topicFromMqttState(send[2]) : undefined);
    const base: NsPanelTsInfo = { isNsPanelTs: true, supported: false, ...(topic ? { topic } : {}) };
    if (!versionMatch) {
        return { ...base, reason: 'noVersion' };
    }
    const version = versionMatch[2];
    if (!isSupportedNsPanelTsVersion(version)) {
        return { ...base, version, reason: 'version' };
    }
    if (!locateConfigObject(source)) {
        return { ...base, version, reason: 'noConfig' };
    }
    return { ...base, version, supported: true };
}

// ---------------------------------------------------------------------------------------------------------
// evaluation of the configuration part
// ---------------------------------------------------------------------------------------------------------

/** variable names of the service pages of the old script - they are created by the script itself and dropped */
export const NSPANELTS_SERVICE_PAGES: readonly string[] = [
    'Unlock_Service',
    'NSPanel_Service',
    'NSPanel_Service_SubPage',
    'NSPanel_Infos',
    'NSPanel_Wifi_Info_1',
    'NSPanel_Wifi_Info_2',
    'NSPanel_Sensoren',
    'NSPanel_Hardware',
    'NSPanel_IoBroker',
    'NSPanel_Einstellungen',
    'NSPanel_Screensaver',
    'NSPanel_ScreensaverDimmode',
    'NSPanel_ScreensaverBrightness',
    'NSPanel_ScreensaverLayout',
    'NSPanel_ScreensaverWeather',
    'NSPanel_ScreensaverDateformat',
    'NSPanel_ScreensaverIndicators',
    'NSPanel_ScreensaverOther',
    'NSPanel_Relays',
    'NSPanel_Script',
    'NSPanel_Firmware',
    'NSPanel_FirmwareTasmota',
    'NSPanel_FirmwareBerry',
    'NSPanel_FirmwareNextion',
];

type Rec = Record<string, unknown>;

function isRecord(v: unknown): v is Rec {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** the parts of the evaluated configuration the conversion works on */
type Evaluated = {
    config: Rec;
    /** every top-level variable of the configuration part with its value */
    vars: Map<string, unknown>;
};

type StripFunction = (code: string, options?: { mode?: 'strip' | 'transform' }) => string;

/**
 * `stripTypeScriptTypes` of `node:module` (Node >= 22.13), undefined when this Node version has none.
 *
 * @returns the function
 */
function getStripFunction(): StripFunction | undefined {
    const mod: Rec = { ...nodeModule };
    const fn = mod.stripTypeScriptTypes;
    if (typeof fn !== 'function') {
        return undefined;
    }
    return (code: string, options?: { mode?: 'strip' | 'transform' }): string => {
        const r: unknown = Reflect.apply(fn, nodeModule, [code, options]);
        return typeof r === 'string' ? r : '';
    };
}

/**
 * Strips the TypeScript types; the "experimental feature" warning of Node is swallowed.
 *
 * @param code TypeScript
 * @returns JavaScript
 */
export function stripTypes(code: string): string {
    const strip = getStripFunction();
    if (!strip) {
        throw new Error(
            `This Node.js version (${process.version}) cannot strip TypeScript types (node:module stripTypeScriptTypes is missing, Node.js >= 22.13 needed)`,
        );
    }
    const original = process.emitWarning;
    process.emitWarning = (warning: string | Error, ...rest: unknown[]): void => {
        const text = typeof warning === 'string' ? warning : warning.message;
        const kind = typeof rest[0] === 'string' ? rest[0] : isRecord(rest[0]) ? rest[0].type : undefined;
        if (kind === 'ExperimentalWarning' && /strip|typescript/i.test(text)) {
            return;
        }
        Reflect.apply(original, process, [warning, ...rest]);
    };
    try {
        return strip(code, { mode: 'strip' });
    } finally {
        process.emitWarning = original;
    }
}

/**
 * The configuration part of the old script: source up to the end of the `config` statement, `export` removed.
 *
 * @param source the whole script
 * @returns the part and the names of its top-level variables, undefined without a `config` object
 */
function configPart(source: string): { code: string; names: string[] } | undefined {
    const loc = locateConfigObject(source);
    if (!loc) {
        return undefined;
    }
    let end = loc.close + 1;
    const semi = /^\s*;/.exec(loc.blank.slice(end));
    if (semi) {
        end += semi[0].length;
    }
    const code = source.slice(0, end).replace(/^(\s*)export\s+(?=(?:const|let|var)\s)/gm, '$1');
    const blank = loc.blank.slice(0, end);
    // only declarations at the top level (depth 0) - the scanner keeps the brackets of the code
    const names = new Set<string>();
    let depth = 0;
    const re = /[{}()[\]]|\b(?:let|const|var)\s+([A-Za-z_$][\w$]*)/g;
    for (const m of blank.matchAll(re)) {
        const t = m[0];
        if (t === '{' || t === '(' || t === '[') {
            depth++;
        } else if (t === '}' || t === ')' || t === ']') {
            depth--;
        } else if (depth === 0 && m[1]) {
            names.add(m[1]);
        }
    }
    return { code, names: [...names] };
}

/**
 * Evaluates the configuration part. No require, no states, no timers - only the stubs the configuration
 * part of the script needs. Not a security boundary (node:vm), but nothing of the adapter is handed in.
 *
 * @param source the whole script
 * @returns the configuration and the variables
 */
function evaluate(source: string): Evaluated {
    const part = configPart(source);
    if (!part) {
        throw new Error('no `config` object found');
    }
    const js = stripTypes(part.code);
    const collect = part.names
        .filter(n => n !== 'config')
        .map(n => `${JSON.stringify(n)}: typeof ${n} === 'undefined' ? undefined : ${n}`)
        .join(',\n');
    const code = `${js}\n;globalThis.__nspanelts = { config: typeof config === 'undefined' ? undefined : config, vars: {\n${collect}\n} };`;
    const sandbox: Rec = {
        findLocaleServMenu: (key: unknown): unknown => key,
        getState: (): Rec => ({ val: null, ack: true, ts: 0, lc: 0 }),
        existsState: (): boolean => false,
        existsObject: (): boolean => false,
        getObject: (): null => null,
        log: (): void => undefined,
    };
    const ctx = vm.createContext(sandbox, { codeGeneration: { strings: false, wasm: false } });
    vm.runInContext(code, ctx, { timeout: 2000, filename: 'NSPanelTs-config.js' });
    const out = sandbox.__nspanelts;
    if (!isRecord(out) || !isRecord(out.config)) {
        throw new Error('the configuration part did not produce a `config` object');
    }
    const vars = new Map<string, unknown>();
    if (isRecord(out.vars)) {
        for (const [k, v] of Object.entries(out.vars)) {
            vars.set(k, v);
        }
    }
    return { config: out.config, vars };
}

// ---------------------------------------------------------------------------------------------------------
// output model and rendering
// ---------------------------------------------------------------------------------------------------------

type Node =
    | { t: 'lit'; s: string }
    | { t: 'obj'; e: Entry[] }
    | { t: 'arr'; e: Entry[] }
    /** a bare identifier (page variable) */
    | { t: 'ref'; s: string };
type Entry = { k?: string; v?: Node; c: string[] };

function quote(s: string): string {
    return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r/g, '\\r').replace(/\n/g, '\\n')}'`;
}

function keyText(k: string): string {
    return /^[A-Za-z_$][\w$]*$/.test(k) ? k : quote(k);
}

/**
 * Plain value → output node. Functions and other non-data values become `undefined` (caller reports them).
 *
 * @param v the value
 * @returns the node, undefined for undefined / non-data values
 */
function toNode(v: unknown): Node | undefined {
    if (v === null) {
        return { t: 'lit', s: 'null' };
    }
    if (typeof v === 'string') {
        return { t: 'lit', s: quote(v) };
    }
    if (typeof v === 'number') {
        return { t: 'lit', s: Number.isFinite(v) ? String(v) : 'null' };
    }
    if (typeof v === 'boolean') {
        return { t: 'lit', s: String(v) };
    }
    if (Array.isArray(v)) {
        return { t: 'arr', e: v.map(x => ({ v: toNode(x) ?? { t: 'lit', s: 'null' }, c: [] })) };
    }
    if (isRecord(v)) {
        const e: Entry[] = [];
        for (const [k, x] of Object.entries(v)) {
            const n = toNode(x);
            if (n) {
                e.push({ k, v: n, c: [] });
            }
        }
        return { t: 'obj', e };
    }
    return undefined;
}

function hasComments(n: Node): boolean {
    return (n.t === 'obj' || n.t === 'arr') && n.e.some(x => x.c.length > 0 || (x.v !== undefined && hasComments(x.v)));
}

function inline(n: Node): string {
    switch (n.t) {
        case 'lit':
        case 'ref':
            return n.s;
        case 'arr':
            return `[${n.e.map(x => (x.v ? inline(x.v) : 'null')).join(', ')}]`;
        case 'obj':
            return n.e.length === 0
                ? '{}'
                : `{ ${n.e
                      .filter(x => x.v)
                      .map(x => `${keyText(x.k ?? '')}: ${x.v ? inline(x.v) : ''}`)
                      .join(', ')} }`;
    }
}

const MAX_LINE = 120;

/**
 * Renders a node; short nodes without comments on one line.
 *
 * @param n the node
 * @param indent indentation of the line the node starts on
 * @returns the text
 */
function render(n: Node, indent: string): string {
    if (n.t === 'lit' || n.t === 'ref') {
        return n.s;
    }
    const one = inline(n);
    if (!hasComments(n) && indent.length + one.length <= MAX_LINE) {
        return one;
    }
    const inner = `${indent}    `;
    const lines: string[] = [];
    for (const x of n.e) {
        for (const c of x.c) {
            lines.push(`${inner}${c}`);
        }
        if (x.v) {
            const value = render(x.v, inner);
            lines.push(n.t === 'obj' ? `${inner}${keyText(x.k ?? '')}: ${value},` : `${inner}${value},`);
        }
    }
    const [open, close] = n.t === 'obj' ? ['{', '}'] : ['[', ']'];
    return lines.length === 0 ? `${open}${close}` : `${open}\n${lines.join('\n')}\n${indent}${close}`;
}

/**
 * The value on one line for a TODO comment.
 *
 * @param v the value
 * @returns text
 */
function show(v: unknown): string {
    const n = toNode(v);
    return n ? inline(n) : String(v);
}

// ---------------------------------------------------------------------------------------------------------
// conversion
// ---------------------------------------------------------------------------------------------------------

export type NsPanelTsTodo = {
    /** uniqueName of the page, undefined for the general part of the configuration */
    page?: string;
    text: string;
};

export type NsPanelTsConvertInput = {
    /** source of the old script */
    source: string;
    /** source of `script/example_sendTo_script_iobroker.ts` - the part from the END STOP block on is taken over */
    template: string;
    /** the end token of the configuration part of the template (`SCRIPT_END_STOP_TOKEN`) */
    endToken: string;
    /** topic of the target panel */
    panelTopic: string;
    /** namespace of the adapter instance, for the sendTo of the template */
    namespace: string;
    /** id of the old script object, for the header */
    sourceScriptId: string;
    /** date for the header (YYYY-MM-DD) */
    today: string;
};

export type NsPanelTsConvertResult = {
    /** the new script, undefined on errors */
    scriptSource?: string;
    todos: NsPanelTsTodo[];
    /** uniqueNames of the pages written as pages of the script */
    pages: string[];
    /** uniqueNames of the pages kept only as TODO block (card types the script configuration cannot define) */
    todoPages: string[];
    /** variable names of the dropped service pages */
    discarded: string[];
    errors: string[];
    version?: string;
};

const CARD_TYPES: Record<string, string> = {
    cardEntities: 'PageEntities',
    cardSchedule: 'PageSchedule',
    cardGrid: 'PageGrid',
    cardGrid2: 'PageGrid2',
    cardGrid3: 'PageGrid3',
    cardThermo: 'PageThermo',
    cardMedia: 'PageMedia',
};

/** card types of the old script the script configuration of the adapter cannot define (admin only) */
const ADMIN_ONLY_CARDS: Record<string, string> = {
    cardAlarm: 'create it in the admin (tab PageConfig, type alarm)',
    cardUnlock: 'create it in the admin (tab PageConfig, type unlock)',
    cardQR: 'create it in the admin (tab PageConfig, type QR)',
    cardPower: 'create it in the admin (tab PageConfig, type power)',
    cardChart: 'create it in the admin (tab PageConfig, type chart)',
    cardLChart: 'create it in the admin (tab PageConfig, type chart)',
    cardThermo2:
        'the thermostat list (thermoItems) of the old script has no unambiguous form in the adapter - create it in the admin (tab PageConfig, type thermostat 2) or as script page with thermoItems',
};

/** item fields taken over as they are */
const ITEM_COPY = new Set([
    'id',
    'icon',
    'icon2',
    'icon3',
    'onColor',
    'offColor',
    'minValueBrightness',
    'maxValueBrightness',
    'minValueColorTemp',
    'maxValueColorTemp',
    'minValueLevel',
    'maxValueLevel',
    'minValueTilt',
    'maxValueTilt',
    'minValue',
    'maxValue',
    'stepValue',
    'prefixName',
    'suffixName',
    'name',
    'secondRow',
    'buttonText',
    'unit',
    'colormode',
    'modeList',
    'useValue',
    'shutterIcons',
    'sliderItems',
    'fontSize',
    'alwaysOnDisplay',
    'role',
    'uniqueName',
    'popupVersion',
    'autoCreateALias',
    // in the script configuration, but not evaluated by the adapter - copied plus TODO
    'iconArray',
    'customIcons',
    'actionStringArray',
    'inSel_ChoiceState',
    'hidePassword',
    'monobutton',
    'shutterType',
    'yAxis',
    'yAxisTicks',
    'xAxisDecorationId',
]);
/** thermostat item fields (cardThermo) */
const THERMO_ITEM_COPY = new Set(['popupThermoMode1', 'popupThermoMode2', 'popupThermoMode3', 'setThermoAlias']);
const ITEM_NOT_EVALUATED = new Set([
    'iconArray',
    'customIcons',
    'actionStringArray',
    'inSel_ChoiceState',
    'hidePassword',
    'monobutton',
    'shutterType',
    'yAxis',
    'yAxisTicks',
    'xAxisDecorationId',
    'popUpThermoName',
    'setThermoDestTemp2',
]);

const PAGE_COPY = new Set([
    'heading',
    'subPage',
    'parentIcon',
    'parentIconColor',
    'prevIcon',
    'prevIconColor',
    'nextIcon',
    'nextIconColor',
    'homeIcon',
    'homeIconColor',
    'hiddenByTrigger',
    'alwaysOnDisplay',
]);
const PAGE_NAV = ['parent', 'prev', 'next', 'home'] as const;

const MEDIA_COPY = new Set([
    'name',
    'colorMediaIcon',
    'colorMediaArtist',
    'colorMediaTitle',
    'speakerList',
    'playList',
    'equalizerList',
    'repeatList',
    'globalTracklist',
    'minValue',
    'maxValue',
]);

const SCREENSAVER_COPY = new Set([
    'ScreensaverEntity',
    'ScreensaverEntityText',
    'ScreensaverEntityFactor',
    'ScreensaverEntityDecimalPlaces',
    'ScreensaverEntityDateFormat',
    'ScreensaverEntityIconOn',
    'ScreensaverEntityIconOff',
    'ScreensaverEntityUnitText',
    'ScreensaverEntityIconColor',
    'ScreensaverEntityOnColor',
    'ScreensaverEntityOffColor',
    'ScreensaverEntityOnText',
    'ScreensaverEntityOffText',
    'ScreensaverEntityIconSelect',
]);
const MR_COPY = new Set([
    'ScreensaverEntity',
    'ScreensaverEntityIconOn',
    'ScreensaverEntityIconSelect',
    'ScreensaverEntityIconOff',
    'ScreensaverEntityValue',
    'ScreensaverEntityValueDecimalPlace',
    'ScreensaverEntityValueUnit',
    'ScreensaverEntityOnColor',
    'ScreensaverEntityOffColor',
]);
/** sub folders of `AliasPath` the old script creates its aliases in */
const OWN_ALIAS_FOLDERS = [
    'autoUpdate',
    'Berry_Driver',
    'Config',
    'Dimmode',
    'Display',
    'Display_Firmware',
    'IoBroker',
    'ipAddress',
    'Relay',
    'ScreensaverInfo',
    'Sensor',
    'Tasmota',
    'Tasmota_Firmware',
];
/** weather adapters the screensaver of the adapter knows */
const WEATHER_ADAPTERS = ['accuweather', 'brightsky', 'openweathermap', 'pirate-weather'];

const CONFIG_KNOWN = new Set([
    'pages',
    'subPages',
    'leftScreensaverEntity',
    'bottomScreensaverEntity',
    'indicatorScreensaverEntity',
    'mrIcon1ScreensaverEntity',
    'mrIcon2ScreensaverEntity',
    'button1',
    'button2',
    'panelRecvTopic',
    'panelSendTopic',
    'weatherEntity',
    'defaultOffColor',
    'defaultOnColor',
    'defaultColor',
    'defaultBackgroundColor',
]);

/** a page of the old script with the name it gets */
type PageInfo = {
    varName: string;
    uniqueName: string;
    page: Rec;
    /** listed in `pages` of the old configuration */
    main: boolean;
    /** neither in `pages` nor in `subPages`, only reached by a reference */
    referencedOnly: boolean;
};

class Converter {
    readonly todos: NsPanelTsTodo[] = [];
    readonly errors: string[] = [];
    readonly discarded: string[] = [];
    private readonly byObject = new Map<unknown, string>();
    private readonly pageVars = new Map<string, Rec>();
    private readonly pages = new Map<string, PageInfo>();
    private readonly order: PageInfo[] = [];
    /** folder of the states of the old script (`NSPanel_Path`) */
    private readonly ownPath: string | undefined;
    /** alias folder of the old script (`AliasPath`) - only its own sub folders count, `usr` etc. belong to the user */
    private readonly aliasPath: string | undefined;

    constructor(private readonly ev: Evaluated) {
        for (const [name, v] of ev.vars) {
            if (isRecord(v) && typeof v.type === 'string' && v.type.startsWith('card')) {
                this.pageVars.set(name, v);
                if (!this.byObject.has(v)) {
                    this.byObject.set(v, name);
                }
            }
        }
        const path = ev.vars.get('NSPanel_Path');
        this.ownPath = typeof path === 'string' && path.length > 8 ? path : undefined;
        const alias = ev.vars.get('AliasPath');
        this.aliasPath = typeof alias === 'string' && alias.length > 8 ? alias : undefined;
    }

    private todo(page: string | undefined, text: string): string {
        this.todos.push(page ? { page, text } : { text });
        return `// TODO: ${text}`;
    }

    /**
     * Collects the pages: `pages`, `subPages` and the pages only reached by references; service pages dropped.
     */
    collectPages(): void {
        const add = (v: unknown, main: boolean, referencedOnly: boolean): void => {
            const varName = this.byObject.get(v);
            if (!varName || !isRecord(v)) {
                this.errors.push(`a page in ${main ? 'pages' : 'subPages'} is no page variable: ${show(v)}`);
                return;
            }
            if (NSPANELTS_SERVICE_PAGES.includes(varName)) {
                if (!this.discarded.includes(varName)) {
                    this.discarded.push(varName);
                }
                return;
            }
            if (this.pages.has(varName)) {
                return;
            }
            const info: PageInfo = { varName, uniqueName: varName, page: v, main, referencedOnly };
            this.pages.set(varName, info);
            this.order.push(info);
        };
        const list = (key: string): unknown[] => {
            const v = this.ev.config[key];
            return Array.isArray(v) ? v.filter(x => x != null) : [];
        };
        for (const p of list('pages')) {
            add(p, true, false);
        }
        for (const p of list('subPages')) {
            add(p, false, false);
        }
        // pages the old script reached via eval(variable name) without being listed
        for (let i = 0; i < this.order.length; i++) {
            for (const name of this.referencedNames(this.order[i].page)) {
                const v = this.pageVars.get(name);
                if (v && !this.pages.has(name) && !NSPANELTS_SERVICE_PAGES.includes(name)) {
                    add(v, false, true);
                }
            }
        }
        for (const ss of ['leftScreensaverEntity', 'bottomScreensaverEntity', 'indicatorScreensaverEntity']) {
            for (const e of list(ss)) {
                if (isRecord(e) && e.ScreensaverEntityNaviToPage) {
                    const name = this.byObject.get(e.ScreensaverEntityNaviToPage);
                    if (name && !this.pages.has(name) && !NSPANELTS_SERVICE_PAGES.includes(name)) {
                        add(e.ScreensaverEntityNaviToPage, false, true);
                    }
                }
            }
        }
        for (const b of ['button1', 'button2']) {
            const btn = this.ev.config[b];
            if (isRecord(btn) && btn.mode === 'page' && btn.page) {
                const name = this.byObject.get(btn.page);
                if (name && !this.pages.has(name) && !NSPANELTS_SERVICE_PAGES.includes(name)) {
                    add(btn.page, false, true);
                }
            }
        }
        // the first page of the old script is the start page - in the adapter it is called 'main'
        const first = this.order.find(p => p.main && this.isScriptCard(p.page));
        const clash = this.order.find(p => p.varName === 'main' && p !== first);
        if (clash) {
            clash.uniqueName = 'main_page';
            this.todo(
                clash.uniqueName,
                `page variable 'main' renamed to uniqueName 'main_page' (main is the start page)`,
            );
        }
        if (first) {
            first.uniqueName = 'main';
        }
    }

    private referencedNames(page: Rec): string[] {
        const out: string[] = [];
        for (const k of PAGE_NAV) {
            const v = page[k];
            if (typeof v === 'string') {
                out.push(v);
            } else if (v) {
                const n = this.byObject.get(v);
                if (n) {
                    out.push(n);
                }
            }
        }
        if (Array.isArray(page.items)) {
            for (const it of page.items) {
                if (isRecord(it)) {
                    if (typeof it.targetPage === 'string') {
                        out.push(it.targetPage);
                    }
                    if (it.navigate === true && typeof it.id === 'string' && it.targetPage === undefined) {
                        out.push(it.id);
                    }
                }
            }
        }
        return out;
    }

    private isScriptCard(page: Rec): boolean {
        return typeof page.type === 'string' && page.type in CARD_TYPES && this.mediaId(page) !== undefined;
    }

    /**
     * Name of a page reference (variable name or page object) in the new script.
     *
     * @param ref the reference
     * @param page page the reference is in
     * @param what field for the TODO text
     * @param comments comments of the place
     * @returns the uniqueName, undefined when the reference is dropped
     */
    private pageRef(ref: unknown, page: string | undefined, what: string, comments: string[]): string | undefined {
        let name: string | undefined;
        if (typeof ref === 'string') {
            name = ref;
        } else if (ref) {
            name = this.byObject.get(ref);
            if (!name) {
                comments.push(this.todo(page, `${what}: no page variable found for ${show(ref)}`));
                return undefined;
            }
        } else {
            return undefined;
        }
        if (NSPANELTS_SERVICE_PAGES.includes(name)) {
            comments.push(this.todo(page, `${what} '${name}' pointed to a service page of the old script - dropped`));
            return undefined;
        }
        const info = this.pages.get(name);
        if (info) {
            return info.uniqueName;
        }
        if (this.pageVars.has(name)) {
            return name;
        }
        comments.push(
            this.todo(page, `${what} '${name}': no page with this name in the old script - check the target`),
        );
        return name;
    }

    /**
     * Whether the id is one of the states / aliases the old script creates itself.
     *
     * @param id state id
     * @returns true for `NSPanel_Path…` and the own sub folders of `AliasPath`
     */
    private isOwnState(id: unknown): boolean {
        if (typeof id !== 'string') {
            return false;
        }
        if (this.ownPath && id.startsWith(this.ownPath)) {
            return true;
        }
        if (this.aliasPath && id.startsWith(this.aliasPath)) {
            const rest = id.slice(this.aliasPath.length);
            return OWN_ALIAS_FOLDERS.some(f => rest === f || rest.startsWith(`${f}.`));
        }
        return false;
    }

    /**
     * a page item
     *
     * @param item the item of the old script
     * @param page uniqueName of the page
     * @param thermo item of a cardThermo
     * @returns the entry
     */
    private item(item: unknown, page: string, thermo: boolean): Entry {
        const c: string[] = [];
        if (!isRecord(item)) {
            return { v: toNode(item) ?? { t: 'lit', s: 'null' }, c };
        }
        const e: Entry[] = [];
        const navigateById = item.navigate === true && item.targetPage === undefined && typeof item.id === 'string';
        for (const [k, v] of Object.entries(item)) {
            if (v === undefined) {
                continue;
            }
            const ec: string[] = [];
            if (k === 'navigate') {
                e.push({ k, v: toNode(v), c: ec });
                continue;
            }
            if (k === 'id' && navigateById) {
                continue;
            }
            if (k === 'targetPage') {
                const t = this.pageRef(v, page, 'targetPage', c);
                if (t !== undefined) {
                    e.push({ k, v: toNode(t), c: ec });
                }
                continue;
            }
            if (k === 'colorScale') {
                ec.push(
                    this.todo(
                        page,
                        `colorScale: the old script used its own 11-step palette green → red, the adapter scales between onColor and offColor (or colorScale.mode) - check the colors`,
                    ),
                );
                e.push({ k, v: toNode(v), c: ec });
                continue;
            }
            if (k === 'useColor' || k === 'interpolateColor') {
                if ((k === 'useColor' && v !== true) || (k === 'interpolateColor' && v === true)) {
                    e.push({ c: [this.todo(page, `${k}: ${show(v)} - not evaluated by the adapter`)] });
                }
                continue;
            }
            if (ITEM_COPY.has(k) || (thermo && THERMO_ITEM_COPY.has(k)) || (thermo && ITEM_NOT_EVALUATED.has(k))) {
                if (ITEM_NOT_EVALUATED.has(k)) {
                    ec.push(this.todo(page, `${k} is not evaluated by the adapter`));
                }
                if (k === 'id' && this.isOwnState(v)) {
                    ec.push(
                        this.todo(
                            page,
                            `id ${show(v)} is a state the old script created itself - the adapter does not update it, choose another state`,
                        ),
                    );
                }
                const n = toNode(v);
                if (!n) {
                    ec.push(this.todo(page, `${k} is no plain value and was dropped`));
                    e.push({ c: ec });
                    continue;
                }
                e.push({ k, v: n, c: ec });
                continue;
            }
            e.push({ c: [this.todo(page, `${k}: ${show(v)} - no counterpart in the adapter`)] });
        }
        if (navigateById && typeof item.id === 'string') {
            const t = this.pageRef(item.id, page, 'navigation target (id)', c);
            if (t !== undefined) {
                e.push({ k: 'targetPage', v: toNode(t), c: [] });
            }
        }
        return { v: { t: 'obj', e }, c };
    }

    /**
     * id of the media device for the adapter, undefined when the player cannot be mapped
     *
     * @param page media page
     * @returns the id, or the page itself is no media page: ''
     */
    private mediaId(page: Rec): string | undefined {
        if (page.type !== 'cardMedia') {
            return '';
        }
        const item = Array.isArray(page.items) ? page.items[0] : undefined;
        if (!isRecord(item) || typeof item.adapterPlayerInstance !== 'string') {
            return undefined;
        }
        const instance = item.adapterPlayerInstance.replace(/\.+$/, '');
        const adapter = instance.split('.')[0];
        const device = typeof item.mediaDevice === 'string' ? item.mediaDevice : '';
        const folder: Record<string, string> = { alexa2: 'Echo-Devices', sonos: 'root', squeezeboxrpc: 'Players' };
        if (adapter in folder) {
            return device ? `${instance}.${folder[adapter]}.${device}` : undefined;
        }
        if (adapter === 'mpd' || adapter === 'spotify-premium') {
            return instance;
        }
        return undefined;
    }

    private media(page: Rec, name: string): Entry {
        const c: string[] = [];
        const item = Array.isArray(page.items) && isRecord(page.items[0]) ? page.items[0] : {};
        const e: Entry[] = [{ k: 'id', v: toNode(this.mediaId(page) ?? ''), c: [] }];
        if (typeof item.id === 'string') {
            c.push(`// alias of the old script ${quote(item.id)} is not needed any more`);
        }
        for (const [k, v] of Object.entries(item)) {
            if (
                v === undefined ||
                ['id', 'adapterPlayerInstance', 'mediaDevice', 'autoCreateALias', 'alwaysOnDisplay'].includes(k)
            ) {
                continue;
            }
            if (MEDIA_COPY.has(k)) {
                e.push({ k, v: toNode(v), c: [] });
                continue;
            }
            c.push(this.todo(name, `media ${k}: ${show(v)} - no counterpart in the adapter`));
        }
        return { k: 'media', v: { t: 'obj', e }, c };
    }

    /**
     * a page as `const <var>: ScriptConfig.<Type> = { … };` or as TODO block
     *
     * @param info the page
     * @returns source text
     */
    pageSource(info: PageInfo): string {
        const { page, uniqueName } = info;
        const type = typeof page.type === 'string' ? page.type : '';
        const head: string[] = [];
        if (info.referencedOnly) {
            head.push(
                this.todo(
                    uniqueName,
                    `page '${info.varName}' was not listed in pages/subPages of the old script, only referenced - added to subPages, check it`,
                ),
            );
        }
        if (typeof page.uniqueName === 'string' && page.uniqueName !== uniqueName) {
            head.push(
                this.todo(
                    uniqueName,
                    `uniqueName of the old script ${quote(page.uniqueName)} replaced by ${quote(uniqueName)}`,
                ),
            );
        }
        const mediaId = this.mediaId(page);
        if (!(type in CARD_TYPES) || mediaId === undefined) {
            const reason =
                ADMIN_ONLY_CARDS[type] ??
                (type === 'cardMedia'
                    ? 'the player of this media page (adapterPlayerInstance / mediaDevice) is not supported by the adapter - only alexa2, sonos, squeezeboxrpc, mpd and spotify-premium'
                    : `card type ${quote(type)} is unknown`);
            head.push(this.todo(uniqueName, `${type} page '${uniqueName}': ${reason}. Original of the old script:`));
            const orig = this.pageEntries(info, true);
            const text = render({ t: 'obj', e: orig }, '');
            const block = `const ${info.varName} = ${text};`.split('\n').map(l => `    // ${l}`);
            return [...head.map(l => `    ${l}`), ...block].join('\n');
        }
        const e = this.pageEntries(info, false);
        const text = render({ t: 'obj', e }, '    ');
        return [
            ...head.map(l => `    ${l}`),
            `    const ${info.varName}: ScriptConfig.${CARD_TYPES[type]} = ${text};`,
        ].join('\n');
    }

    private pageEntries(info: PageInfo, original: boolean): Entry[] {
        const { page, uniqueName } = info;
        const type = typeof page.type === 'string' ? page.type : '';
        const e: Entry[] = [
            { k: 'type', v: toNode(type), c: [] },
            { k: 'uniqueName', v: toNode(uniqueName), c: [] },
        ];
        // inside a TODO block the comments of the fields are not needed again
        const sink = (list: string[]): string[] => (original ? [] : list);
        for (const [k, v] of Object.entries(page)) {
            if (v === undefined || k === 'type' || k === 'uniqueName' || k === 'items') {
                continue;
            }
            const c: string[] = [];
            if ((PAGE_NAV as readonly string[]).includes(k)) {
                const before = this.todos.length;
                const name = this.pageRef(v, uniqueName, k, c);
                if (original) {
                    this.todos.length = before;
                }
                if (name !== undefined) {
                    e.push({ k, v: toNode(name), c: sink(c) });
                } else {
                    e.push({ c: sink(c) });
                }
                continue;
            }
            if (original) {
                const n = toNode(v);
                if (n) {
                    e.push({ k, v: n, c: [] });
                }
                continue;
            }
            if (PAGE_COPY.has(k)) {
                e.push({ k, v: toNode(v), c });
                continue;
            }
            if (k === 'useColor') {
                if (v !== true && type !== 'cardThermo' && type !== 'cardMedia') {
                    c.push(this.todo(uniqueName, `useColor: ${show(v)} - the adapter always uses the colors`));
                    e.push({ c });
                }
                continue;
            }
            if (k === 'showOnlyPlayerHeadline') {
                c.push(
                    this.todo(
                        uniqueName,
                        `showOnlyPlayerHeadline: ${show(v)} - in the adapter the headline of a media page is set in the admin (headline mode)`,
                    ),
                );
                e.push({ c });
                continue;
            }
            c.push(this.todo(uniqueName, `${k}: ${show(v)} - no counterpart in the adapter`));
            e.push({ c });
        }
        const items = Array.isArray(page.items) ? page.items : [];
        if (original) {
            // the items as they are in the old script
            e.push({ k: 'items', v: toNode(items) ?? { t: 'arr', e: [] }, c: [] });
            return e;
        }
        // cardThermo / cardMedia: the old script read alwaysOnDisplay of the first item, the adapter that of the page
        const first = items[0];
        if (
            (type === 'cardThermo' || type === 'cardMedia') &&
            isRecord(first) &&
            first.alwaysOnDisplay !== undefined &&
            page.alwaysOnDisplay === undefined
        ) {
            e.push({ k: 'alwaysOnDisplay', v: toNode(first.alwaysOnDisplay), c: [] });
        }
        if (type === 'cardMedia') {
            e.push(this.media(page, uniqueName));
            if (items.length > 1) {
                e.push({
                    c: [
                        this.todo(
                            uniqueName,
                            `items after the player of the old media page dropped: ${show(items.slice(1))}`,
                        ),
                    ],
                });
            }
            e.push({ k: 'items', v: { t: 'arr', e: [] }, c: [] });
            return e;
        }
        e.push({
            k: 'items',
            v: {
                t: 'arr',
                e: items.filter(it => it != null).map(it => this.item(it, uniqueName, type === 'cardThermo')),
            },
            c: [],
        });
        return e;
    }

    /**
     * a screensaver element
     *
     * @param el the element
     * @param where name of the list
     * @param mr mrIcon element
     * @returns the entry
     */
    private screensaver(el: unknown, where: string, mr: boolean): Entry {
        if (el == null) {
            return { v: { t: 'lit', s: 'null' }, c: [] };
        }
        const c: string[] = [];
        if (!isRecord(el)) {
            c.push(this.todo(undefined, `${where}: ${show(el)} is no screensaver element - dropped`));
            return { c };
        }
        const e: Entry[] = [{ k: 'type', v: toNode('script'), c: [] }];
        const copy = mr ? MR_COPY : SCREENSAVER_COPY;
        for (const [k, v] of Object.entries(el)) {
            if (v === undefined) {
                continue;
            }
            const ec: string[] = [];
            if (k === 'ScreensaverEntityNaviToPage' && !mr) {
                const name = this.pageRef(v, undefined, `${where} ScreensaverEntityNaviToPage`, ec);
                if (name !== undefined) {
                    e.push({ k, v: toNode(name), c: ec });
                } else {
                    e.push({ c: ec });
                }
                continue;
            }
            if (!copy.has(k)) {
                c.push(this.todo(undefined, `${where} ${k}: ${show(v)} - no counterpart in the adapter`));
                continue;
            }
            let value = v;
            if (k === 'ScreensaverEntity' && typeof v === 'string') {
                const relay = /\.(Relay\.[12])$/.exec(v);
                if (mr && relay && this.isOwnState(v)) {
                    value = relay[1];
                } else if (this.isOwnState(v)) {
                    ec.push(
                        this.todo(
                            undefined,
                            `${where}: ${show(v)} is a state the old script created itself - the adapter does not update it, choose another state`,
                        ),
                    );
                }
            }
            e.push({ k, v: toNode(value), c: ec });
        }
        return { v: { t: 'obj', e }, c };
    }

    private screensaverList(key: string, keepEmpty: boolean): Entry {
        const v = this.ev.config[key];
        const list = Array.isArray(v) ? v : [];
        const entries = list
            .map((x, i) => this.screensaver(x, `${key}[${i}]`, false))
            .filter(x => keepEmpty || x.v?.t !== 'lit');
        return { k: key, v: { t: 'arr', e: entries }, c: [] };
    }

    private button(key: 'button1' | 'button2', target: string): Entry {
        const b = this.ev.config[key];
        const c: string[] = [];
        if (!isRecord(b) || b.mode == null) {
            return { k: target, v: { t: 'lit', s: 'null' }, c };
        }
        if (b.mode === 'page') {
            const name = this.pageRef(b.page, undefined, `${key} page`, c);
            if (name !== undefined) {
                return { k: target, v: toNode({ mode: 'page', page: name }), c };
            }
        } else if (b.mode === 'toggle' && typeof b.entity === 'string' && b.entity) {
            return { k: target, v: toNode({ mode: 'switch', state: b.entity }), c };
        } else {
            c.push(
                this.todo(
                    undefined,
                    `${key} of the old script ${show({ mode: b.mode, entity: b.entity, setValue: b.setValue })} has no counterpart - configure the button in the admin`,
                ),
            );
        }
        return { k: target, v: { t: 'lit', s: 'null' }, c };
    }

    /**
     * the configuration object and the pages
     *
     * @param panelTopic topic of the target panel
     * @returns source text of the configuration part (inside `configuration()`)
     */
    body(panelTopic: string): string {
        const cfg = this.ev.config;
        const pageTexts = this.order.map(p => this.pageSource(p));
        const scriptPages = this.order.filter(p => this.isScriptCard(p.page));
        const ref = (p: PageInfo): Entry => ({ v: { t: 'ref', s: p.varName }, c: [] });

        const e: Entry[] = [];
        const topicComments: string[] = [];
        if (typeof cfg.panelRecvTopic === 'string') {
            topicComments.push(`// old script: panelRecvTopic ${quote(cfg.panelRecvTopic)}`);
        }
        e.push({ k: 'panelTopic', v: toNode(panelTopic), c: topicComments });

        const weatherInstance = this.ev.vars.get('weatherAdapterInstance');
        const wc: string[] = [];
        if (typeof cfg.weatherEntity === 'string') {
            wc.push(
                `// old script: weatherEntity ${quote(cfg.weatherEntity)} (alias of the old script, not needed any more)`,
            );
        }
        let weather = '';
        if (typeof weatherInstance === 'string' && weatherInstance) {
            weather = weatherInstance.endsWith('.') ? weatherInstance : `${weatherInstance}.`;
            if (!WEATHER_ADAPTERS.includes(weather.split('.')[0])) {
                wc.push(
                    this.todo(
                        undefined,
                        `weather adapter ${quote(weather)} is not supported by the screensaver of the adapter (only ${WEATHER_ADAPTERS.join(', ')})`,
                    ),
                );
            }
        } else {
            wc.push(
                this.todo(undefined, 'no weatherAdapterInstance found in the old script - set the weather adapter'),
            );
        }
        e.push({ k: 'weatherEntity', v: toNode(weather), c: wc });
        e.push({ k: 'weatherAddDefaultItems', v: toNode(false), c: [] });
        for (const k of ['defaultOffColor', 'defaultOnColor', 'defaultColor', 'defaultBackgroundColor']) {
            const n = toNode(cfg[k]);
            if (n && cfg[k] !== undefined) {
                e.push({ k, v: n, c: [] });
            }
        }
        e.push({
            k: 'pages',
            v: { t: 'arr', e: scriptPages.filter(p => p.main).map(ref) },
            c: ['// Hauptseiten / Mainpages'],
        });
        e.push({
            k: 'subPages',
            v: { t: 'arr', e: scriptPages.filter(p => !p.main).map(ref) },
            c: ['// Unterseiten / Subpages'],
        });
        e.push({ k: 'favoritScreensaverEntity', v: { t: 'arr', e: [] }, c: [] });
        e.push({ k: 'alternateScreensaverEntity', v: { t: 'arr', e: [] }, c: [] });
        e.push(this.screensaverList('leftScreensaverEntity', true));
        e.push(this.screensaverList('bottomScreensaverEntity', false));
        e.push(this.screensaverList('indicatorScreensaverEntity', true));
        for (const k of ['mrIcon1ScreensaverEntity', 'mrIcon2ScreensaverEntity']) {
            const r = this.screensaver(cfg[k], k, true);
            e.push({ k, v: r.v ?? { t: 'lit', s: 'null' }, c: r.c });
        }
        e.push(this.button('button1', 'buttonLeft'));
        e.push(this.button('button2', 'buttonRight'));
        for (const [k, v] of Object.entries(cfg)) {
            if (!CONFIG_KNOWN.has(k) && v !== undefined) {
                e.push({ c: [this.todo(undefined, `${k}: ${show(v)} - no counterpart in the adapter`)] });
            }
        }

        const lines: string[] = [];
        lines.push('    const overrideConfig: Partial<ScriptConfig.Config> = {');
        lines.push(
            '        // hier können Werte von unten überschrieben werden / values from below can be overridden here',
        );
        lines.push('    };');
        lines.push('');
        for (const t of pageTexts) {
            lines.push(t, '');
        }
        lines.push(`    const config: ScriptConfig.Config = ${render({ t: 'obj', e }, '    ')};`);
        lines.push('');
        return lines.join('\n');
    }

    get scriptPageNames(): string[] {
        return this.order.filter(p => this.isScriptCard(p.page)).map(p => p.uniqueName);
    }

    get todoPageNames(): string[] {
        return this.order.filter(p => !this.isScriptCard(p.page)).map(p => p.uniqueName);
    }
}

/**
 * Converts the old NSPanelTs script into a configuration script of the adapter.
 *
 * @param input source, template and target
 * @returns the new script and what happened
 */
export function convertNsPanelTs(input: NsPanelTsConvertInput): NsPanelTsConvertResult {
    const result: NsPanelTsConvertResult = { todos: [], pages: [], todoPages: [], discarded: [], errors: [] };
    const info = inspectNsPanelTs(input.source);
    result.version = info.version;
    if (!info.isNsPanelTs) {
        result.errors.push('the script is no NSPanelTs script');
        return result;
    }
    if (!info.supported) {
        result.errors.push(
            info.reason === 'noVersion'
                ? 'no scriptVersion found in the script'
                : info.reason === 'noConfig'
                  ? 'no `config` object found in the script'
                  : `script version ${info.version ?? '?'} is not supported (supported: ${NSPANELTS_MIN_VERSION} … ${NSPANELTS_MAX_VERSION}.x)`,
        );
        return result;
    }
    const tokenAt = input.template.indexOf(input.endToken);
    const commentAt = tokenAt === -1 ? -1 : input.template.lastIndexOf('/**', tokenAt);
    if (commentAt === -1) {
        result.errors.push('the END STOP block was not found in the template');
        return result;
    }
    let ev: Evaluated;
    try {
        ev = evaluate(input.source);
    } catch (e: unknown) {
        result.errors.push(
            `the configuration part of the script cannot be evaluated: ${e instanceof Error ? e.message : String(e)}`,
        );
        return result;
    }
    const conv = new Converter(ev);
    conv.collectPages();
    let body: string;
    try {
        body = conv.body(input.panelTopic);
    } catch (e: unknown) {
        result.errors.push(`conversion failed: ${e instanceof Error ? e.message : String(e)}`);
        return result;
    }
    result.todos = conv.todos;
    result.pages = conv.scriptPageNames;
    result.todoPages = conv.todoPageNames;
    result.discarded = conv.discarded;
    result.errors.push(...conv.errors);

    const header = [
        '/*',
        ` * Converted by ${input.namespace} on ${input.today} from the NSPanelTs script ${input.sourceScriptId} (${info.version ?? '?'}).`,
        ` * ${result.todos.length} TODO(s): search for "TODO" - these settings could not be taken over 1:1.`,
        ` * Stop the old script ${input.sourceScriptId} before you activate this script!`,
        ' *',
        ` * Umgewandelt von ${input.namespace} am ${input.today} aus dem NSPanelTs-Skript ${input.sourceScriptId} (${info.version ?? '?'}).`,
        ` * ${result.todos.length} TODO(s): nach "TODO" suchen - diese Einstellungen ließen sich nicht 1:1 übernehmen.`,
        ` * Das alte Skript ${input.sourceScriptId} vor dem Aktivieren dieses Skripts stoppen!`,
        ' */',
        '',
    ].join('\n');
    const tail = input.template
        .slice(commentAt)
        .replace(
            /await sendToAsync\('nspanel-lovelace-ui\.0', 'ScriptConfig',/,
            `await sendToAsync('${input.namespace}', 'ScriptConfig',`,
        );
    result.scriptSource = `${header}async function configuration (): Promise<void> {\n${body}\n    ${tail}`;
    return result;
}
