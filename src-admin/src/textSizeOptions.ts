/**
 * Options and labels of a font select (HMI font id = `textSize`), shared by the page item dialog and the
 * screensaver item dialog. The font table is HMI_FONTS of the adapter.
 */
import {
    HMI_FONTS,
    HMI_TEXT_SIZES,
    isHmiTextSize,
    isIconTextSize,
    type HmiTextSize,
} from '../../src/lib/types/adminShareConfig';

/**
 * The text sizes offered in a select, '' = default font: with an icon only the fonts that contain the icon
 * glyphs (1, 3, 4), a stored value outside of them stays in the list so it is not silently dropped.
 *
 * @param current the stored text size, undefined = default
 * @param allSizes true when the field shows a text instead of an icon - every font fits then
 */
export function textSizeOptions(current: HmiTextSize | undefined, allSizes: boolean): string[] {
    const sizes = allSizes ? HMI_TEXT_SIZES : HMI_TEXT_SIZES.filter(n => isIconTextSize(n) || n === current);
    return ['', ...sizes.map(n => String(n))];
}

/**
 * Label of a text size option, built from the font table: `0 – 24 px (text only)`, `4 – 80 px bold`, …
 *
 * @param option the option value ('' = default)
 * @param t translation function
 */
export function textSizeLabel(option: string, t: (key: string) => string): string {
    const n = Number(option);
    if (option === '' || !isHmiTextSize(n)) {
        return t('valueEntryDialog_textSizeDefault');
    }
    const font = HMI_FONTS[n];
    let label = `${n} – ${font.px} px`;
    if (font.bold) {
        label += ` ${t('valueEntryDialog_textSizeBold')}`;
    }
    if (font.asciiOnly) {
        label += ` (${t('valueEntryDialog_textSizeAsciiOnly')})`;
    } else if (!font.icons) {
        label += ` (${t('valueEntryDialog_textSizeTextOnly')})`;
    }
    return label;
}

/**
 * The value of a select option as text size, undefined for the default ('') and anything invalid
 *
 * @param option the option value
 */
export function textSizeOfOption(option: string | null | undefined): HmiTextSize | undefined {
    if (option === '' || option == null) {
        return undefined;
    }
    const n = Number(option);
    return isHmiTextSize(n) ? n : undefined;
}
