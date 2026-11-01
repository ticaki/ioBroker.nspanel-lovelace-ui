/**
 * Helpers shared by the media page editor and its player selection dialog.
 */
import type { MediaBackend } from '../../../src/lib/types/adminShareConfig';

/** a similar logo per backend - colors only, the panel shows the real ones */
export const MEDIA_LOGOS: Record<MediaBackend, { text: string; bg: string; fg: string }> = {
    alexa2: { text: 'alexa', bg: '#1a98d5', fg: '#fff' },
    sonos: { text: 'SONOS', bg: '#111', fg: '#fff' },
    'spotify-premium': { text: 'spotify', bg: '#1db954', fg: '#000' },
    mpd: { text: 'mpd', bg: '#555', fg: '#fff' },
    squeezeboxrpc: { text: 'LMS', bg: '#e8731a', fg: '#fff' },
};

/**
 * a text that may be translated (`ioBroker.StringOrTranslated`) as plain text
 *
 * @param raw string or object with one text per language
 * @param lang admin language
 * @returns the text in this language, else English, else the first one; empty when there is none
 */
export function localizedText(raw: unknown, lang: string): string {
    if (typeof raw === 'string') {
        return raw;
    }
    if (raw && typeof raw === 'object') {
        const values = Object.entries(raw).filter((e): e is [string, string] => typeof e[1] === 'string');
        const map = Object.fromEntries(values);
        return map[lang] || map.en || values[0]?.[1] || '';
    }
    return '';
}

/**
 * common.name of an object as plain text
 *
 * @param obj object from the database
 * @param lang admin language
 * @returns the name, empty when there is none
 */
export function objectName(obj: ioBroker.AnyObject | null | undefined, lang: string): string {
    return localizedText(obj?.common?.name, lang);
}
