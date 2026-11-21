import {
    ADMIN_BUTTON_DELAY_MODES,
    ADMIN_BUTTON_MAX_DELAY,
    ADMIN_BUTTON_MIN_DELAY,
    ADMIN_BUTTON_MODES,
    type AdminButtonFunction,
    type AdminButtonMode,
    type ButtonNavigationTarget,
} from '../../src/lib/types/adminShareConfig';

/** `none` = the admin configures nothing, the configuration script keeps its value */
export type PanelButtonDialogMode = AdminButtonMode | 'none';

/** The fields of the hardware button dialog an action is built from. */
export interface PanelButtonFields {
    mode: PanelButtonDialogMode;
    /** target of mode 'page' */
    page: string;
    /** target of mode 'navigation' */
    target: ButtonNavigationTarget;
    /** datapoint of the datapoint modes */
    stateId: string;
    /** delay of the delay modes in seconds, as typed; empty = the default of the adapter */
    delay: string;
}

/** Result of {@link buildPanelButtonAction}: the action to store, or `ok: false` while something is missing. */
export type PanelButtonActionResult = { ok: true; action: AdminButtonFunction | undefined } | { ok: false };

/**
 * @param mode a mode of the dialog
 * @returns true for one of the four delay modes
 */
export function isDelayMode(mode: PanelButtonDialogMode): boolean {
    return ADMIN_BUTTON_DELAY_MODES.some(m => m === mode);
}

/**
 * @param value a value of the mode select
 * @returns true for a mode the dialog offers
 */
export function isPanelButtonDialogMode(value: unknown): value is PanelButtonDialogMode {
    return value === 'none' || ADMIN_BUTTON_MODES.some(m => m === value);
}

/**
 * The delay as the adapter gets it.
 *
 * @param fields the dialog fields
 * @returns the delay in seconds; undefined = field empty, not a number or not a delay mode
 */
export function parsePanelButtonDelay(fields: Pick<PanelButtonFields, 'mode' | 'delay'>): number | undefined {
    if (!isDelayMode(fields.mode) || fields.delay.trim() === '') {
        return undefined;
    }
    const value = Number(fields.delay.replace(',', '.'));
    return isNaN(value) ? undefined : value;
}

/**
 * Builds the action of a hardware button from the dialog fields.
 *
 * @param fields the dialog fields
 * @returns the action (undefined = not configured in the admin), `ok: false` while something is missing
 */
export function buildPanelButtonAction(fields: PanelButtonFields): PanelButtonActionResult {
    const { mode, page, target, stateId } = fields;
    if (mode === 'none') {
        return { ok: true, action: undefined };
    }
    if (mode === 'page') {
        const name = page.trim();
        return name ? { ok: true, action: { mode: 'page', page: name } } : { ok: false };
    }
    if (mode === 'navigation') {
        return { ok: true, action: { mode: 'navigation', target } };
    }
    const id = stateId.trim();
    if (!id || id.endsWith('.')) {
        return { ok: false };
    }
    if (mode === 'switch' || mode === 'button') {
        return { ok: true, action: { mode, state: id } };
    }
    const delay = parsePanelButtonDelay(fields);
    if (fields.delay.trim() !== '' && delay === undefined) {
        return { ok: false };
    }
    if (delay !== undefined && (delay < ADMIN_BUTTON_MIN_DELAY || delay > ADMIN_BUTTON_MAX_DELAY)) {
        return { ok: false };
    }
    return { ok: true, action: delay === undefined ? { mode, state: id } : { mode, state: id, delay } };
}
