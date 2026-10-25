import {
    ENTITY_FIELDS,
    field,
    parseEntity6,
    parseEntityList,
    parseEntityUpdHeader,
    toNumber,
} from '../../protocol/split';
import type { Entity6, Navigation } from '../../protocol/types';
import type { ParseContext } from '../CardContract';

/** number of entity slots in the bottom row */
export const MEDIA_OPTIONS = 5;

/**
 * Model of `cardMedia`, built from what `PageMedia.getMessage` sends:
 * `entityUpd~headline~<nav left>~<nav right>~id~name~nameColor~artist~artistColor~volume~playPauseIcon~onOffColor~shuffleIcon~<logo>~<5 options>`
 */
export interface CardMediaModel {
    title: string;
    navigation: Navigation;
    /** internal id sent back in `event,buttonPress2,<id>,media-…` (always `media`) */
    id: string;
    /** first text row: title with the elapsed/duration suffix, scrolled by the adapter */
    name: string;
    /** RGB565 */
    nameColor: number;
    /** second text row: album | artist */
    artist: string;
    /** RGB565 */
    artistColor: number;
    /** 0-100, undefined when the player has no volume */
    volume: number | undefined;
    /** glyph of the play/pause button, empty = hidden */
    playPauseIcon: string;
    /** power button: undefined = hidden (`disable`), otherwise RGB565 */
    onOffColor: number | undefined;
    /** glyph of the shuffle button, empty = hidden */
    shuffleIcon: string;
    /** media logo in the upper left corner */
    logo: Entity6;
    /** the bottom row, always {@link MEDIA_OPTIONS} entries */
    options: Entity6[];
    /** commands other than entityUpd received on this page (counted for diagnostics only) */
    otherCommands: number;
}

function emptyNav(): Navigation {
    return { left: parseEntity6([]), right: parseEntity6([]) };
}

export function initial(): CardMediaModel {
    return {
        title: '',
        navigation: emptyNav(),
        id: 'media',
        name: '',
        nameColor: 65535,
        artist: '',
        artistColor: 65535,
        volume: undefined,
        playPauseIcon: '',
        onOffColor: undefined,
        shuffleIcon: '',
        logo: parseEntity6([]),
        options: [],
        otherCommands: 0,
    };
}

/**
 * Parses the power button field: `disable` (or empty) hides the button, otherwise it is a RGB565 colour.
 *
 * @param raw the field
 */
export function parseOnOff(raw: string): number | undefined {
    if (raw === '' || raw === 'disable') {
        return undefined;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
}

/**
 * Parses the volume field: empty = no volume control, otherwise clamped to 0-100.
 *
 * @param raw the field
 */
export function parseVolume(raw: string): number | undefined {
    if (raw === '') {
        return undefined;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : undefined;
}

export function parseEntityUpd(args: string[], prev: CardMediaModel, _ctx: ParseContext): CardMediaModel {
    const { title, navigation, rest } = parseEntityUpdHeader(args);
    const optionsOffset = 9 + ENTITY_FIELDS;
    const options = parseEntityList(rest, optionsOffset, MEDIA_OPTIONS);
    while (options.length < MEDIA_OPTIONS) {
        options.push(parseEntity6([]));
    }
    return {
        ...prev,
        title,
        navigation,
        id: field(rest, 0) || 'media',
        name: field(rest, 1),
        nameColor: toNumber(rest[2], 65535),
        artist: field(rest, 3),
        artistColor: toNumber(rest[4], 65535),
        volume: parseVolume(field(rest, 5)),
        playPauseIcon: field(rest, 6),
        onOffColor: parseOnOff(field(rest, 7)),
        shuffleIcon: field(rest, 8),
        logo: parseEntity6(rest, 9),
        options,
    };
}

/** `entityUpdateDetail` belongs to popups, the card keeps its model */
export function parseEntityUpdateDetail(
    _args: string[],
    _prev: CardMediaModel,
    _ctx: ParseContext,
): CardMediaModel | undefined {
    return undefined;
}

export function handleCommand(
    _cmd: string,
    _args: string[],
    prev: CardMediaModel,
    _ctx: ParseContext,
): CardMediaModel | undefined {
    return { ...prev, otherCommands: prev.otherCommands + 1 };
}
