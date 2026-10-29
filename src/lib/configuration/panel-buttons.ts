import { isButton } from '../const/config-manager-const';
import type { AdminButtonFunction } from '../types/adminShareConfig';
import type { ConfigButtonFunction } from '../types/types';

/** The two hardware buttons of a panel. */
export type PanelButtons = {
    left: ConfigButtonFunction;
    right: ConfigButtonFunction;
};

/** What the admin stores for the hardware buttons of one panel (`native.panels[]`). */
export interface AdminPanelButtons {
    buttonLeft?: AdminButtonFunction;
    buttonRight?: AdminButtonFunction;
}

/** Result of {@link applyAdminButtons}. */
export interface AdminButtonsResult {
    /** The buttons to use, `null` when neither side has an action. */
    buttons: PanelButtons | null;
    /** Sides whose admin configuration was rejected - their script value stayed in place. */
    invalid: ('left' | 'right')[];
}

/**
 * Puts the hardware button actions of the admin on top of the ones of the configuration script.
 *
 * A side configured in the admin wins over the script. A side the admin never touched (field
 * missing) keeps the script value, so a panel configured by a script behaves as before as long as
 * nobody opens the dialog. An admin entry that is not a valid action is dropped and reported in
 * `invalid` instead of silently replacing the script value.
 *
 * @param scriptButtons Buttons the configuration script produced (`panelConfig.buttons`).
 * @param admin Panel entry of the admin table, only its two button fields are read.
 * @returns The merged buttons and the sides whose admin entry was rejected.
 */
export function applyAdminButtons(
    scriptButtons: PanelButtons | null | undefined,
    admin: AdminPanelButtons | undefined,
): AdminButtonsResult {
    const invalid: ('left' | 'right')[] = [];
    if (!admin || (admin.buttonLeft === undefined && admin.buttonRight === undefined)) {
        return { buttons: scriptButtons ?? null, invalid };
    }
    const buttons: PanelButtons = {
        left: scriptButtons ? scriptButtons.left : null,
        right: scriptButtons ? scriptButtons.right : null,
    };
    const sides: ['left' | 'right', AdminButtonFunction | undefined][] = [
        ['left', admin.buttonLeft],
        ['right', admin.buttonRight],
    ];
    for (const [side, action] of sides) {
        if (action === undefined) {
            continue;
        }
        if (isButton(action)) {
            buttons[side] = action;
        } else {
            invalid.push(side);
        }
    }
    return { buttons, invalid };
}
