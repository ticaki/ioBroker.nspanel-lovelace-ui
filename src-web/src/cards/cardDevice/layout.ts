import type { Entity6, PanelModel } from '../../protocol/types';
import { isWebModel, stageSize } from '../../style/theme';
import {
    DEVICE_EXTRA_KINDS,
    fromTable,
    type DeviceGeometry,
    type DeviceGeometryBuilder,
    type DeviceLayout,
    type DeviceSlotKind,
} from './geometry';
import { EU_GEOMETRY, US_L_GEOMETRY } from './geometryHmi';
import { webLandscapeGeometry } from './geometryWeb';

export {
    DEVICE_EXTRA_KINDS,
    DEVICE_SLOT_KINDS,
    STATUS_FRAME_COLOR,
    slotBoxes,
    statusBlockVisible,
    type Box,
    type DeviceGeometry,
    type DeviceLayout,
    type DeviceSlotKind,
    type SlotGeometry,
    type StatusSlotGeometry,
} from './geometry';

/** The eu pages - the table every other landscape layout is derived from */
export const DEVICE_GEOMETRY = EU_GEOMETRY;

const EU_BUILDER = fromTable(EU_GEOMETRY);

/**
 * The geometry of the device pages per model. Hardware models (and their web clones) are tables of the HMI
 * boxes (`geometryHmi.ts`), the web models layouts of their own with the additional slots (`geometryWeb.ts`).
 *
 * **Phase 2 (us-p, web-p):** add the table / builder here - nothing else has to change. Until then these
 * models use {@link FALLBACK}.
 */
const GEOMETRY: Readonly<Partial<Record<PanelModel, DeviceGeometryBuilder>>> = {
    eu: EU_BUILDER,
    'us-l': fromTable(US_L_GEOMETRY),
    'web-l': webLandscapeGeometry,
    // 'us-p': fromTable(US_P_GEOMETRY),   <- doc/ideas/device-details/device-page-geometry.json, key us-p
    // 'web-p': webPortraitGeometry,       <- with the additional slots, like web-l
};

/**
 * PROVISIONAL FALLBACK for a model without a geometry of its own (us-p, web-p until phase 2): the eu page
 * without additional slots, scaled down to the width of the stage ({@link deviceFallbackScale}) - everything
 * is visible and works, nothing is laid out for the model. The adapter does not send device pages to these
 * models yet.
 */
const FALLBACK: DeviceGeometryBuilder = EU_BUILDER;

/** Width the fallback page is scaled from: the visible width of the eu display (x 0-449) */
const FALLBACK_WIDTH = 450;

/**
 * `true` when the model has device pages of its own, `false` when it draws the provisional fallback.
 *
 * @param model the panel model
 */
export function hasDeviceGeometry(model: PanelModel): boolean {
    return GEOMETRY[model] !== undefined;
}

/**
 * The scale the content of a device page is drawn with: 1 on every model with a geometry of its own; a model
 * on the provisional fallback (us-p, web-p) shrinks the eu page to the width of its stage.
 *
 * @param model the panel model
 */
export function deviceFallbackScale(model: PanelModel): number {
    return hasDeviceGeometry(model) ? 1 : Math.min(1, stageSize(model).width / FALLBACK_WIDTH);
}

/**
 * The kinds of the additional slots a model gets behind the info icon: the web models
 * ({@link DEVICE_EXTRA_KINDS}), none on the hardware models and their web clones.
 *
 * @param layout the page
 * @param model the panel model
 */
export function deviceExtraKinds(layout: DeviceLayout, model: PanelModel): readonly DeviceSlotKind[] {
    return isWebModel(model) ? DEVICE_EXTRA_KINDS[layout] : [];
}

/**
 * The layout of a device pageType: `cardDevice2` -> 2, `cardDevice3` -> 3, everything else 1.
 *
 * @param pageType the active pageType
 */
export function deviceLayout(pageType: string): DeviceLayout {
    switch (pageType) {
        case 'cardDevice2':
            return 2;
        case 'cardDevice3':
            return 3;
        default:
            return 1;
    }
}

/**
 * The fill of a progress bar: field 6 as an integer, limited to 0-100 like the HMI; not a number = 0.
 *
 * @param value field 6 of the progress slot
 */
export function progressPercent(value: string): number {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
}

/**
 * The geometry of a page on a model for the elements it shows. Hardware models: the boxes of the HMI - with a
 * visible status block the two info rows of cardDevice1 move right and get narrower (eu: icon x 204, name 242
 * 86 px wide, value 1 px lower). Web models: the rows are laid out for the additional slots that are filled.
 *
 * @param layout the layout
 * @param slots the standard slots of the model
 * @param model the panel model
 * @param extras the additional slots of the model (web models)
 */
export function deviceGeometry(
    layout: DeviceLayout,
    slots: readonly Entity6[],
    model: PanelModel,
    extras: readonly Entity6[] = [],
): DeviceGeometry {
    return (GEOMETRY[model] ?? FALLBACK)(layout, slots, extras);
}
