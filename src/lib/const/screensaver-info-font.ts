/**
 * Font of the text in the popup of the info icon of the screensaver (see pages/screensaver-info-icon.ts). Its own
 * module without imports: the state object in definition.ts needs the font ids too.
 */

/** font ids the text of popupNotify can take (field 13, `textSize`) and that have a width table */
export type ScreensaverInfoFont = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Font of the popup text: one size above the default font 0 (24 px) of popupNotify - font 2 (Noto Sans 32, the same
 * characters as font 0; font 1 has only Latin-1 + icons). The adapter texts always use it, the text of the user when
 * `cmd.screenSaver.infoTextFont` is empty or invalid.
 */
export const SCREENSAVER_INFO_FONT_DEFAULT: ScreensaverInfoFont = 2;

/** the font ids of `cmd.screenSaver.infoTextFont` (states of the state object) */
export const SCREENSAVER_INFO_FONT_STATES: Readonly<Record<ScreensaverInfoFont, string>> = {
    0: '24px text',
    1: '32px icons+text',
    2: '32px text',
    3: '48px icons+text',
    4: '80px bold icons+text',
    5: '128px bold ASCII',
};

function isScreensaverInfoFont(n: number): n is ScreensaverInfoFont {
    return n === 0 || n === 1 || n === 2 || n === 3 || n === 4 || n === 5;
}

/**
 * Font of the text of the user icon from `cmd.screenSaver.infoTextFont`: 0..5 as given, anything else (empty,
 * null, out of range, not an integer, not a number) gives {@link SCREENSAVER_INFO_FONT_DEFAULT}.
 *
 * @param value value of the state
 * @returns the font id
 */
export function screensaverInfoFont(value: unknown): ScreensaverInfoFont {
    let n = Number.NaN;
    if (typeof value === 'number') {
        n = value;
    } else if (typeof value === 'string' && value.trim() !== '') {
        n = Number(value);
    }
    return isScreensaverInfoFont(n) ? n : SCREENSAVER_INFO_FONT_DEFAULT;
}
