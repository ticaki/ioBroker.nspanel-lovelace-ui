import type { ParseContext } from '../CardContract';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';

/**
 * Helpers for the `entityUpdateDetail~…` payloads of the popups. The adapter marks
 * missing parts with `disable` (sliders, buttons) and present parts with `enable`
 * or a number, see `getDetailPayload` in `src/lib/pages/pageItem.ts`.
 */

/** `enable` -> true, everything else -> false */
export function isEnabled(fieldValue: string | undefined): boolean {
    return fieldValue === 'enable';
}

/** A number field; `undefined` for `disable`, an empty field or anything not numeric */
export function optionalNumber(fieldValue: string | undefined): number | undefined {
    if (fieldValue === undefined || fieldValue === '' || fieldValue === 'disable') {
        return undefined;
    }
    const n = Number(fieldValue);
    return Number.isFinite(n) ? n : undefined;
}

/** A RGB565 colour field; `undefined` for `disable` or an empty field */
export function optionalColor(fieldValue: string | undefined): number | undefined {
    return optionalNumber(fieldValue);
}

/** A `1`/`0` button state; `undefined` for `disable` */
export function optionalBoolean(fieldValue: string | undefined): boolean | undefined {
    if (fieldValue === '1') {
        return true;
    }
    if (fieldValue === '0') {
        return false;
    }
    return undefined;
}

/**
 * The entity id the popup answers with (`event,buttonPress2,<id>,…`). The popup is opened
 * with `pageType~popupX~<name>~<id>`; the id of the page arguments is the one the user
 * tapped (the id of the `entityUpd` tuple), the `entityName` of the detail payload is
 * the fallback.
 */
export function popupEntityId(ctx: ParseContext, entityName: string): string {
    return ctx.pageArgs[0] !== undefined && ctx.pageArgs[0] !== '' ? ctx.pageArgs[0] : entityName;
}

/** The title of the popup: the name from the page arguments (`[id, title, icon, iconColor]`), else the entity name */
export function popupTitle(ctx: ParseContext, entityName: string): string {
    return ctx.pageArgs[1] !== undefined && ctx.pageArgs[1] !== '' ? ctx.pageArgs[1] : entityName;
}

/**
 * The RGB565 colour of the entity the popup was opened from (`pageArgs[3]`, set by
 * `openPopup`); `undefined` when the popup was opened without one (raw `pageOpenDetail`,
 * `pageType` of the adapter).
 */
export function popupIconColor565(ctx: ParseContext): number | undefined {
    return optionalNumber(ctx.pageArgs[3]);
}

/**
 * The css colour of the head icon of a popup. The HMI draws it in the colour the entity had
 * on the previous page; a popup whose detail payload carries its own icon colour shows that
 * one (`payloadColor`, wins), the others fall back to the page arguments, then to the
 * foreground.
 *
 * @param ctx the page context (`pageArgs[3]` = RGB565 of the entity)
 * @param payloadColor RGB565 colour of the `entityUpdateDetail` payload, if the popup has one
 */
export function popupHeaderIconColor(ctx: ParseContext, payloadColor?: number): string {
    const color = payloadColor ?? popupIconColor565(ctx);
    return color !== undefined ? color565ToCss(color) : theme.foreground;
}

/** Clamps `value` to `min..max` and snaps it to `step` (relative to `min`) */
export function snapToStep(value: number, min: number, max: number, step: number): number {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    let v = Math.max(lo, Math.min(hi, value));
    if (step > 0) {
        v = lo + Math.round((v - lo) / step) * step;
        v = Math.max(lo, Math.min(hi, v));
        const decimals = Math.min(10, (String(step).split('.')[1] ?? '').length);
        v = Number(v.toFixed(decimals));
    }
    return v;
}
