import type { ParseContext } from '../CardContract';
import { field, parseEntityList, toNumber } from '../../protocol/split';
import type { Entity6, PanelModel } from '../../protocol/types';

/**
 * The four layouts of the screensaver. `standard` and `alternate` share the pageType
 * `screensaver` and are told apart by the number of entities of the `weatherUpdate`
 * (the adapter sends 5 for standard and 6 for alternate, see `Screensaver.update()`).
 */
export type ScreensaverLayout = 'standard' | 'alternate' | 'advanced' | 'easyview';

/**
 * `color~background~tTime~timeAMPM~tDate~tMainText~tForecast1..4~tForecast1Val..4Val~bar~tMainTextAlt2~tTimeAdd`
 * - every field a RGB565 number, `undefined` when the field was missing (the text colour of
 * `dimmode` is used then).
 */
export interface ScreensaverColors {
    background: number | undefined;
    time: number | undefined;
    timeAmPm: number | undefined;
    date: number | undefined;
    mainText: number | undefined;
    forecast: (number | undefined)[];
    forecastVal: (number | undefined)[];
    bar: number | undefined;
    mainTextAlt2: number | undefined;
    timeAdd: number | undefined;
}

/** One of the two MR icons of `statusUpdate` */
export interface StatusIcon {
    /** glyph, may also contain plain text (e.g. `<glyph> 19.0°`) */
    icon: string;
    /** RGB565 */
    color: number;
    /** `1` in the font field: draw the icon larger */
    big: boolean;
}

export interface ScreensaverNotify {
    heading: string;
    text: string;
}

export interface ScreensaverModel {
    /** entities of the last `weatherUpdate`, in the order the adapter sends them */
    entities: Entity6[];
    colors: ScreensaverColors | undefined;
    status: [StatusIcon, StatusIcon];
    /** `undefined` = no notification shown */
    notify: ScreensaverNotify | undefined;
}

/** The entities of a `weatherUpdate` sorted into the areas of the screensaver */
export interface ScreensaverAreas {
    layout: ScreensaverLayout;
    favorit: Entity6 | undefined;
    left: Entity6[];
    bottom: Entity6[];
    alternate: Entity6 | undefined;
    indicator: Entity6[];
}

/** Number of entities per area and layout (`ScreenSaverConst` of the adapter) */
export const AREA_SIZES: Record<
    ScreensaverLayout,
    { favorit: number; left: number; bottom: number; alternate: number; indicator: number }
> = {
    standard: { favorit: 1, left: 0, bottom: 4, alternate: 0, indicator: 0 },
    alternate: { favorit: 1, left: 0, bottom: 3, alternate: 1, indicator: 0 },
    advanced: { favorit: 1, left: 3, bottom: 6, alternate: 0, indicator: 5 },
    easyview: { favorit: 1, left: 0, bottom: 3, alternate: 0, indicator: 0 },
};

/** The alternate layout sends favorit + 3 bottom + an empty entity + the alternate entity */
const ALTERNATE_ENTITY_COUNT = 6;

export function emptyStatusIcon(): StatusIcon {
    return { icon: '', color: 65535, big: false };
}

export function initial(): ScreensaverModel {
    return { entities: [], colors: undefined, status: [emptyStatusIcon(), emptyStatusIcon()], notify: undefined };
}

/** The real display ignores `entityUpd` on the screensaver, so does this module */
export function parseEntityUpd(_args: string[], prev: ScreensaverModel, _ctx: ParseContext): ScreensaverModel {
    return prev;
}

/** `weatherUpdate~[entity]~[entity]~…` */
export function parseWeatherUpdate(args: string[]): Entity6[] {
    return parseEntityList(args, 0);
}

/**
 * A colour field of `color~…`: number or `undefined` when missing or not numeric.
 *
 * @param fields the args of `color`
 * @param index index of the field
 */
function colorField(fields: readonly string[], index: number): number | undefined {
    const raw = fields[index];
    if (raw === undefined || raw === '') {
        return undefined;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
}

/** `color~background~tTime~timeAMPM~tDate~tMainText~tForecast1~…~tForecast4Val~bar~tMainTextAlt2~tTimeAdd` */
export function parseColor(args: string[]): ScreensaverColors {
    return {
        background: colorField(args, 0),
        time: colorField(args, 1),
        timeAmPm: colorField(args, 2),
        date: colorField(args, 3),
        mainText: colorField(args, 4),
        forecast: [colorField(args, 5), colorField(args, 6), colorField(args, 7), colorField(args, 8)],
        forecastVal: [colorField(args, 9), colorField(args, 10), colorField(args, 11), colorField(args, 12)],
        bar: colorField(args, 13),
        mainTextAlt2: colorField(args, 14),
        timeAdd: colorField(args, 15),
    };
}

/** `statusUpdate~icon1~icon1Color~icon2~icon2Color~icon1Font~icon2Font` (font `1` = big icon) */
export function parseStatusUpdate(args: string[]): [StatusIcon, StatusIcon] {
    return [
        { icon: field(args, 0), color: toNumber(args[1], 65535), big: field(args, 4) === '1' },
        { icon: field(args, 2), color: toNumber(args[3], 65535), big: field(args, 5) === '1' },
    ];
}

/** `notify~heading~text`; both empty = clear the notification */
export function parseNotify(args: string[]): ScreensaverNotify | undefined {
    const heading = field(args, 0);
    const text = field(args, 1);
    return heading === '' && text === '' ? undefined : { heading, text };
}

export function handleCommand(
    cmd: string,
    args: string[],
    prev: ScreensaverModel,
    _ctx: ParseContext,
): ScreensaverModel | undefined {
    switch (cmd) {
        case 'weatherUpdate':
            return { ...prev, entities: parseWeatherUpdate(args) };
        case 'color':
            return { ...prev, colors: parseColor(args) };
        case 'statusUpdate':
            return { ...prev, status: parseStatusUpdate(args) };
        case 'notify':
            return { ...prev, notify: parseNotify(args) };
        default:
            return undefined;
    }
}

/**
 * The layout of the page: `screensaver2` = advanced, `screensaver3` = easyview, `screensaver`
 * = alternate when the `weatherUpdate` carried 6 entities, standard otherwise.
 *
 * @param pageType the active pageType
 * @param entities the entities of the last `weatherUpdate`
 */
export function layoutOf(pageType: string, entities: readonly Entity6[]): ScreensaverLayout {
    switch (pageType) {
        case 'screensaver2':
            return 'advanced';
        case 'screensaver3':
            return 'easyview';
        default:
            return entities.length >= ALTERNATE_ENTITY_COUNT ? 'alternate' : 'standard';
    }
}

/** Number of bottom entities of the layout on the given hardware model (EasyView has 4 on `us-p`) */
export function bottomCount(layout: ScreensaverLayout, model: PanelModel): number {
    if (layout === 'easyview' && model === 'us-p') {
        return 4;
    }
    return AREA_SIZES[layout].bottom;
}

/**
 * Sorts the entities of a `weatherUpdate` into the areas. The adapter concatenates
 * favorit, left, bottom, alternate (with a leading empty entity) and indicator.
 *
 * @param pageType the active pageType
 * @param entities the entities of the last `weatherUpdate`
 * @param model the hardware model
 */
export function splitAreas(pageType: string, entities: readonly Entity6[], model: PanelModel): ScreensaverAreas {
    const layout = layoutOf(pageType, entities);
    const sizes = AREA_SIZES[layout];
    const bottom = bottomCount(layout, model);
    let i = 0;
    const take = (n: number): Entity6[] => {
        const slice = entities.slice(i, i + n);
        i += n;
        return slice;
    };
    const favorit = take(sizes.favorit)[0];
    const left = take(sizes.left);
    const bottomEntities = take(bottom);
    // alternate: one empty entity in front of the alternate entity
    const alternate = sizes.alternate > 0 ? take(1 + sizes.alternate)[1] : undefined;
    const indicator = take(sizes.indicator);
    return { layout, favorit, left, bottom: bottomEntities, alternate, indicator };
}

/** `true` when the entity shows nothing (no icon, no name, no value) */
export function isBlankEntity(entity: Entity6 | undefined): boolean {
    return !entity || (entity.icon === '' && entity.displayName === '' && entity.optionalValue === '');
}

/** Splits `HH:MM` / `HH:MM PM` into the time and the optional AM/PM suffix */
export function splitTime(time: string): { time: string; ampm: string } {
    const idx = time.indexOf(' ');
    if (idx === -1) {
        return { time, ampm: '' };
    }
    return { time: time.slice(0, idx), ampm: time.slice(idx + 1).trim() };
}

/** Private use glyphs of the HMI font (icons) - everything else is plain text */
const GLYPH = /[-\u{F0000}-\u{FFFFF}]/u;

export type TextRun = { kind: 'icon'; glyph: string } | { kind: 'text'; text: string };

/**
 * Splits a field that mixes icon glyphs and text (the MR icons may carry a value next
 * to the icon) into runs.
 *
 * @param value the raw field
 */
export function splitRuns(value: string): TextRun[] {
    const runs: TextRun[] = [];
    for (const ch of value) {
        if (GLYPH.test(ch)) {
            runs.push({ kind: 'icon', glyph: ch });
        } else {
            const last = runs[runs.length - 1];
            if (last && last.kind === 'text') {
                last.text += ch;
            } else {
                runs.push({ kind: 'text', text: ch });
            }
        }
    }
    return runs;
}
