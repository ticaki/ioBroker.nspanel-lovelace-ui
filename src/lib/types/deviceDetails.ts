/**
 * Device with details (doc/ideas/device-details/README.md): a page item shows any device (an object of type device or
 * channel); a long press opens a generated detail page (cardEntities) with the chosen states of the device.
 *
 * Pure module, shared by the adapter and the admin - it must not import anything that pulls adapter code into the
 * admin bundle (adminShareConfig is shared as well).
 *
 * A mask describes the entries of the filter list for the devices of one adapter. Every entry has a name (translation
 * key `deviceDetail_<key>`), a color group, an icon and rules in the style of the templates (`src/lib/templates`):
 * first by `role`, and where the role does not carry it by the end of the id (`dp`).
 */

import { isIconColorScaleElement, type IconColorElement } from './adminShareConfig';

/** sendTo command of main.ts: the states of a device for the filter list ({@link DeviceDetailsInfo}) */
export const SENDTO_GET_DEVICE_DETAILS_COMMAND = 'getDeviceDetails';

/** role of the generated rows of the detail page (PageItem) */
export const DEVICE_DETAIL_ROW_ROLE = 'deviceDetail';

/** role of the info item of the device page: a tap opens the detail page */
export const DEVICE_PAGE_INFO_ROLE = 'devicePageInfo';

/** prefix of the translation keys of the mask entries, used on the panel and in the admin */
export const DEVICE_DETAIL_NAME_PREFIX = 'deviceDetail_';

/** color group of an entry: values take the theme color of their group, on/off the colors activated/deactivated */
export type DeviceDetailGroup = 'energy' | 'climate' | 'connection' | 'info';

/** theme key (Color.ts) of every group - climate takes the existing temperature color */
export const deviceDetailGroupColorKey: Readonly<
    Record<DeviceDetailGroup, 'deviceEnergy' | 'temperature' | 'deviceConnection' | 'deviceInfo'>
> = {
    energy: 'deviceEnergy',
    climate: 'temperature',
    connection: 'deviceConnection',
    info: 'deviceInfo',
};

/** a rule matches a state when every condition that is given matches */
export type DeviceDetailRule = {
    /** common.role of the state, one of them */
    role?: string | readonly string[];
    /** the state id ends with it (e.g. `.rssi`), like `dp` of the templates */
    dp?: string;
    /** common.unit of the state */
    unit?: string;
};

/** an entry of the filter list */
export type DeviceDetailMaskEntry = {
    /** key of the entry, name = translation `deviceDetail_<key>` */
    key: string;
    group: DeviceDetailGroup;
    /** icon of the row on the detail page */
    icon: string;
    /** a state belongs to the entry when one of the rules matches */
    rules: readonly DeviceDetailRule[];
};

export type DeviceDetailMask = {
    /** adapter name (first part of the id), '' = the general mask */
    adapter: string;
    /** number of parts of the id of a device (`shelly.0.<device>` = 3), undefined = any level */
    deviceLevel?: number;
    entries: readonly DeviceDetailMaskEntry[];
};

/** what the admin needs to know of a state of the device */
export type DeviceStateInfo = {
    id: string;
    /** common.name in the language of the system */
    name: string;
    role: string;
    /** common.type */
    type: string;
    read: boolean;
    write: boolean;
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
};

/** why an object cannot be chosen as device */
export type DeviceSelectionError = 'notFound' | 'type' | 'root' | 'info' | 'level';

/** answer of {@link SENDTO_GET_DEVICE_DETAILS_COMMAND} */
export type DeviceDetailsInfo = {
    ok: boolean;
    error?: DeviceSelectionError;
    /** adapter of the device (first part of the id) */
    adapter: string;
    /** common.name of the device */
    name: string;
    /** the states of the device: directly below it or in at most one sub folder */
    states: DeviceStateInfo[];
};

/** a chosen row of the detail page, saved in the order of the detail page */
export type DeviceDetailEntryConfig = {
    /** key of the mask entry, '' = a state without entry (named by the state) */
    key: string;
    /** full id of the state */
    id: string;
    /**
     * own text of the second name line (admin), missing or '' = the automatic text of
     * {@link deviceDetailSubNames} - only rows with the same name as another ticked row get one automatically
     */
    subName?: string;
};

/** what a short tap on a device item does */
export type DeviceShortPress =
    /**
     * a writable boolean state of the device (stored as custom item, `channelId` = the state): switched on/off, a
     * button (`read: false`) is written with true
     */
    | 'state'
    /** nothing - only the long press opens the details (stored without channel, runtime item of type text) */
    | 'none'
    /** navigates to a target page (stored as navigation item, `targetPage`) */
    | 'navigation'
    /** the popup of an alias channel (stored as standard item, `channelId` = the channel) */
    | 'popup'
    /**
     * opens the device page like the long press (stored without channel, runtime item of type button); only with a
     * device page ({@link DeviceDetailsConfig.devicePage}), without one it does nothing like `none`. Where the panel
     * has no device page the detail page opens, as with the long press.
     */
    | 'devicePage';

/**
 * @param state a state of the device
 * @param state.type common.type
 * @param state.write common.write
 * @returns true for a state the short tap `state` can use: a writable boolean (a button with `read: false` included)
 */
export function isDeviceShortPressState(state: { type: string; write: boolean }): boolean {
    return state.type === 'boolean' && state.write;
}

/**
 * @param config the device configuration of an item (or a value of the admin)
 * @param config.shortPress the stored short tap
 * @returns its short tap, `state` when not set or unknown
 */
export function deviceShortPressOf(config: { shortPress?: unknown }): DeviceShortPress {
    switch (config.shortPress) {
        case 'none':
        case 'navigation':
        case 'popup':
        case 'devicePage':
            return config.shortPress;
        default:
            return 'state';
    }
}

/** admin configuration of the device of a page item ({@link AdminPageItemConfig.device}) */
export type DeviceDetailsConfig = {
    /** id of the device or channel object */
    deviceId: string;
    /** what a short tap does, missing = `state` */
    shortPress?: DeviceShortPress;
    /** the ticked rows of the filter list in the order of the detail page */
    entries: DeviceDetailEntryConfig[];
    /**
     * the long press opens the device page (cardDevice1..3) instead of the detail page; missing = the detail page as
     * before. Normalize with {@link devicePageConfigOf}.
     */
    devicePage?: DevicePageConfig;
};

/** layout of the device page: HMI page cardDevice1 / cardDevice2 / cardDevice3 */
export type DevicePageLayout = 1 | 2 | 3;

/**
 * What a slot of the device page is (field 6 = optionalValue of the element):
 * - `info`: like a text row of the detail page (value as text with unit, a boolean on/off, the text of
 *   `common.states`); a writable state with `common.states` is an `input_sel` (tap → popupInSel),
 * - `value`: `text`, field 6 = the value short like a text row (number with unit or text), no tap,
 * - `progress`: `text`, field 6 = whole number 0-100 (the value scaled from common.min/max, without them as it is,
 *   clamped), field 4 = color of the bar - number states only,
 * - `button`: `button`; a state with `read: false` is written with true, a writable boolean is switched,
 * - `switch`: `switch`, field 6 = 0/1, the tap comes as `OnOff` like on cardEntities - writable boolean only,
 * - `status`: a small status icon only (field 3) in its color (field 4) - type `text`, name and value (fields 5/6)
 *   empty, no tap. Icon and color like an info row of the same state (a boolean in the colors activated /
 *   deactivated); the icon can be chosen per slot ({@link DevicePageStateRef.icon}). Any state.
 */
export type DevicePageSlotKind = 'info' | 'value' | 'progress' | 'button' | 'switch' | 'status';

/**
 * The slots of every layout in the order of the payload (slot1 … slotN). The single place for the number and kind of
 * the slots (HMI doc/ideas/device-details/device-page-hmi.md, section "Art je Slot").
 */
export const DEVICE_PAGE_LAYOUTS: Readonly<Record<DevicePageLayout, readonly DevicePageSlotKind[]>> = {
    /** "Steuern" (control): slots 7-10 are the 2x2 status icons right of the big icon */
    1: ['info', 'info', 'button', 'button', 'button', 'button', 'status', 'status', 'status', 'status'],
    /** "Fortschritt" (progress) */
    2: ['value', 'progress', 'info', 'info', 'info', 'button'],
    /** "Werte" (values) */
    3: ['info', 'info', 'info', 'info', 'info', 'info', 'switch', 'switch'],
};

/** width of the text fields of a slot kind in px */
export type DevicePageSlotFields = {
    /** name (field 5), font 0 */
    name: number;
    /** value (field 6), font {@link DevicePageSlotFields.valueFont} - missing = the kind shows no value text */
    value?: number;
    /** font of the value, default 0 */
    valueFont?: number;
};

/** the text fields of a layout in px (HMI doc/ideas/device-details/device-page-hmi.md, section Feldbreiten) */
export type DevicePageLayoutFields = {
    /** name of main, font 0 */
    mainName: number;
    /** the status line (field 6 of main), font 0, one line */
    status: number;
    /** the fields of the kinds of slots the layout has (`status` shows no text) */
    slots: Partial<Record<DevicePageSlotKind, DevicePageSlotFields>>;
    /**
     * the fields that change when at least one `status` slot is filled (layout 1: the info rows get narrower to make
     * room for the 2x2 status icons); missing kinds keep {@link DevicePageLayoutFields.slots}
     */
    slotsWithStatus?: Partial<Record<DevicePageSlotKind, DevicePageSlotFields>>;
};

/** font of the names, values and the status line of the device page: font 0 (Noto Sans 24) */
export const DEVICE_PAGE_TEXT_FONT = 0;

/** maximum bytes of the status line (txt_maxl of tStatus) */
export const DEVICE_PAGE_STATUS_MAX_BYTES = 63;

/**
 * The text fields of the device pages (EU HMI). Only the status line is shortened by the adapter (with "..."), every
 * other field is cut by the HMI at its edge - the widths are here for the admin and the web panel.
 *
 * The `value` slot of layout 2 draws field 6 in font 4 (Noto Sans Bold 80) in 190 px: a digit is 33 px, ':' 17 px,
 * '%' 53 px, '°' 25 px, a space 15 px - about 5 digits fit. The font has digits, `: % ° , . - /`, letters with
 * umlauts, but no '€'.
 */
export const DEVICE_PAGE_FIELDS: Readonly<Record<DevicePageLayout, DevicePageLayoutFields>> = {
    1: {
        mainName: 110,
        status: 390,
        slots: { info: { name: 164, value: 110 }, button: { name: 104 } },
        // at least one status icon: the 2x2 block stands right of the big icon, the info rows get narrower (empty status
        // slots inside the shown block stay empty grid cells)
        slotsWithStatus: { info: { name: 86, value: 110 } },
    },
    2: {
        mainName: 96,
        status: 390,
        slots: {
            value: { name: 190, value: 190, valueFont: 4 },
            progress: { name: 429 },
            info: { name: 104, value: 104 },
            button: { name: 100 },
        },
    },
    3: {
        mainName: 100,
        status: 390,
        slots: { info: { name: 125, value: 125 }, switch: { name: 125 } },
    },
};

/**
 * @param layout the layout
 * @returns number of slots of the layout
 */
export function devicePageSlotCount(layout: DevicePageLayout): number {
    return DEVICE_PAGE_LAYOUTS[layout].length;
}

/**
 * @param layout the layout
 * @param slots the slots of the page (same order as {@link DEVICE_PAGE_LAYOUTS})
 * @returns true when at least one `status` slot is filled - then the HMI draws the 2x2 status icons
 */
export function devicePageHasStatusIcons(
    layout: DevicePageLayout,
    slots: readonly (DevicePageSlotRef | null | undefined)[],
): boolean {
    return DEVICE_PAGE_LAYOUTS[layout].some((kind, i) => kind === 'status' && !!slots[i]);
}

/**
 * @param layout the layout
 * @param kind the kind of the slot
 * @param withStatusIcons at least one status slot is filled ({@link devicePageHasStatusIcons})
 * @returns the text fields of the kind, undefined for a kind without text
 */
export function devicePageSlotFields(
    layout: DevicePageLayout,
    kind: DevicePageSlotKind,
    withStatusIcons: boolean,
): DevicePageSlotFields | undefined {
    const fields = DEVICE_PAGE_FIELDS[layout];
    return (withStatusIcons ? fields.slotsWithStatus?.[kind] : undefined) ?? fields.slots[kind];
}

/**
 * Whether a state of the device may be shown in a slot of this kind.
 *
 * @param kind the kind of the slot
 * @param state the state (DeviceStateInfo of the admin or the common of the object)
 * @param state.type common.type
 * @param state.read common.read (undefined counts as true)
 * @param state.write common.write (undefined counts as true)
 * @returns true for `info` / `value` / `status` always, `button` a button (`read: false`) or a writable boolean, `switch` a
 * writable (readable) boolean, `progress` a number
 */
export function devicePageSlotAccepts(
    kind: DevicePageSlotKind,
    state: { type?: string; read?: boolean; write?: boolean },
): boolean {
    const writable = state.write !== false;
    const button = state.read === false;
    switch (kind) {
        case 'info':
        case 'value':
        case 'status':
            return true;
        case 'button':
            return button || (state.type === 'boolean' && writable);
        case 'switch':
            return !button && state.type === 'boolean' && writable;
        case 'progress':
            return !button && state.type === 'number';
    }
}

/** the channel roles a slot can show: every role with a page item of its own, see {@link DEVICE_PAGE_CHANNEL_ROLES} */
const CHANNEL_SENSOR_ROLES = [
    'temperature',
    'value.temperature',
    'humidity',
    'value.humidity',
    'thermostat',
    'airCondition',
    'motion',
    'door',
    'window',
    'info',
    'warning',
] as const;

/** channel roles that switch on / off (`OnOff` of a switch slot), field 6 is `0` / `1` */
const CHANNEL_SWITCH_ROLES = ['socket', 'light', 'dimmer', 'hue', 'rgb', 'rgbSingle', 'ct', 'level.mode.fan'] as const;

/** channel roles with a number and its range in field 6 (`value|min|max`) */
const CHANNEL_NUMBER_ROLES = ['slider', 'volume'] as const;

/** channel roles without a readable value in field 6 (a button, the icon list of the shutter popup) */
const CHANNEL_NO_VALUE_ROLES = ['button', 'blind', 'gate', 'lock'] as const;

/** channel roles with a text in field 6 (selection, time of a timer) */
const CHANNEL_TEXT_ROLES = ['select', 'level.timer'] as const;

/**
 * The roles of the alias channels a slot of a kind takes ({@link DevicePageSlotRef.custom} `channel`,
 * doc/ideas/device-details/README.md, table Alias-Kanäle). Every slot is tapped like a cardGrid cell (tap, popup of
 * the type, long press), so a kind only limits what its field 6 can show: `info`, `button` and `status` take every
 * role, `value` what has a value to read, `progress` a number with a range, `switch` what `OnOff` switches. `media`,
 * `timeTable` and `sensor.alarm.flood` never (they need a page of their own or a template).
 */
export const DEVICE_PAGE_CHANNEL_ROLES: Readonly<Record<DevicePageSlotKind, readonly string[]>> = {
    info: [
        ...CHANNEL_SWITCH_ROLES,
        ...CHANNEL_NUMBER_ROLES,
        ...CHANNEL_TEXT_ROLES,
        ...CHANNEL_NO_VALUE_ROLES,
        ...CHANNEL_SENSOR_ROLES,
    ],
    value: [...CHANNEL_SENSOR_ROLES, ...CHANNEL_NUMBER_ROLES, ...CHANNEL_TEXT_ROLES, ...CHANNEL_SWITCH_ROLES],
    progress: CHANNEL_NUMBER_ROLES,
    button: [
        ...CHANNEL_SWITCH_ROLES,
        ...CHANNEL_NUMBER_ROLES,
        ...CHANNEL_TEXT_ROLES,
        ...CHANNEL_NO_VALUE_ROLES,
        ...CHANNEL_SENSOR_ROLES,
    ],
    switch: CHANNEL_SWITCH_ROLES,
    status: [
        ...CHANNEL_SWITCH_ROLES,
        ...CHANNEL_NUMBER_ROLES,
        ...CHANNEL_TEXT_ROLES,
        ...CHANNEL_NO_VALUE_ROLES,
        ...CHANNEL_SENSOR_ROLES,
    ],
};

/**
 * @param role common.role of an alias channel
 * @returns true when its page item takes a long press action (`longPress`): the config manager allows it for the
 * item types button and switch only - the roles `button` and `socket`
 */
export function devicePageChannelTakesLongPress(role: string | null | undefined): boolean {
    return role === 'button' || role === 'socket';
}

/**
 * Whether a slot takes a long press action ({@link DevicePageSlotLook.longPress}): a state in a `button` or `switch`
 * slot (its page item is a button / switch), an alias channel by its role ({@link devicePageChannelTakesLongPress}).
 *
 * @param kind the kind of the slot
 * @param ref the slot
 * @param channelRole common.role of the channel of a channel slot
 * @returns true when the long press action works there
 */
export function devicePageSlotTakesLongPress(
    kind: DevicePageSlotKind,
    ref: DevicePageSlotRef | null | undefined,
    channelRole?: string | null,
): boolean {
    if (!ref) {
        return false;
    }
    return ref.custom === 'channel'
        ? devicePageChannelTakesLongPress(channelRole)
        : kind === 'button' || kind === 'switch';
}

/**
 * Whether an alias channel may be shown in a slot of this kind ({@link DEVICE_PAGE_CHANNEL_ROLES}).
 *
 * @param kind the kind of the slot
 * @param role common.role of the channel
 * @returns true when the role fits
 */
export function devicePageSlotAcceptsChannel(kind: DevicePageSlotKind, role: string | null | undefined): boolean {
    return typeof role === 'string' && DEVICE_PAGE_CHANNEL_ROLES[kind].includes(role);
}

/** role of a `progress` slot of the device page (PageItem): field 6 is {@link devicePageProgressPercent} */
export const DEVICE_PAGE_PROGRESS_ROLE = 'devicePageProgress';

/**
 * The value of a `progress` slot: the value scaled from common.min/max to 0-100, without both (or with max <= min) the
 * value as it is; rounded to a whole number and clamped to 0-100.
 *
 * @param value the value of the state, null = none (0)
 * @param min common.min
 * @param max common.max
 * @returns whole number 0-100
 */
export function devicePageProgressPercent(value: number | null | undefined, min?: number, max?: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return 0;
    }
    let percent = value;
    if (typeof min === 'number' && typeof max === 'number' && max > min) {
        percent = ((value - min) / (max - min)) * 100;
    }
    return Math.min(100, Math.max(0, Math.round(percent)));
}

/**
 * A state of the device on the device page (a slot or the status line). The same form as a row of the detail page
 * ({@link DeviceDetailEntryConfig}): `key` of the mask entry (icon, name, color group; '' = a state without entry, named
 * by the state), `id` = full id of the state, `subName` = own text appended to the name. A slot may show any state of
 * the device, it does not have to be ticked for the detail page.
 */
export type DevicePageStateRef = DeviceDetailEntryConfig & {
    /**
     * older configurations: MDI name of the icon of a `status` slot. Still read as the icon for both states while
     * {@link DevicePageSlotLook.trueIcon} and {@link DevicePageSlotLook.falseIcon} are missing
     * ({@link devicePageSlotLookOf}); the admin writes the new fields.
     */
    icon?: string;
};

/**
 * The own settings of a slot (dialog "settings of the element"), the fields and their form are those of a standard
 * page item (AdminPageItemConfig): icon and color while the state is true / false, a color scale and the state a long
 * press writes. Everything optional, missing = as before (mask entry / kind / role of the channel, no long press).
 * A number or a text has no false: it shows the true icon and color.
 */
export type DevicePageSlotLook = {
    /** MDI name */
    trueIcon?: string;
    /** MDI name */
    falseIcon?: string;
    /** hex color `#rrggbb` */
    trueColor?: string;
    /** hex color `#rrggbb` */
    falseColor?: string;
    /** color scale of the icon by the value of a number, between {@link falseColor} and {@link trueColor} */
    scale?: IconColorElement;
    /**
     * id of a writable boolean state a long press writes: a button sets it to true, a switch toggles it. Only where
     * {@link devicePageSlotTakesLongPress} - elsewhere it is kept but does nothing.
     */
    longPress?: string;
};

/** the text fields of {@link DevicePageSlotLook} */
export const DEVICE_PAGE_SLOT_LOOK_FIELDS = ['trueIcon', 'falseIcon', 'trueColor', 'falseColor', 'longPress'] as const;

/**
 * What a slot of the device page shows:
 * - without `custom` a state of the device ({@link DevicePageStateRef}), as before,
 * - `custom: 'state'` an own data point of the user - any state, also outside the device; it behaves like a state of
 *   the device without mask entry (`key` is ''),
 * - `custom: 'channel'` an alias channel (`id` = the channel): the page item the channel is on a normal page, built by
 *   the config manager; which roles fit a slot says {@link devicePageSlotAcceptsChannel}.
 *
 * With `custom` the `id` may be '' (chosen in the admin, nothing entered yet): the slot stays empty.
 */
export type DevicePageSlotRef = DevicePageStateRef &
    DevicePageSlotLook & {
        custom?: 'state' | 'channel';
    };

/**
 * @param ref a slot
 * @param withOlderIcon false = without the older `icon` (the adapter: the status icon item applies it itself)
 * @returns its own settings: the new fields, an older `icon` as icon for both states while no own icon is set
 */
export function devicePageSlotLookOf(ref: DevicePageSlotRef, withOlderIcon = true): DevicePageSlotLook {
    const legacy = !withOlderIcon || ref.trueIcon || ref.falseIcon ? '' : (ref.icon ?? '');
    const look: DevicePageSlotLook = {};
    const trueIcon = ref.trueIcon || legacy;
    const falseIcon = ref.falseIcon || legacy;
    if (trueIcon) {
        look.trueIcon = trueIcon;
    }
    if (falseIcon) {
        look.falseIcon = falseIcon;
    }
    if (ref.trueColor) {
        look.trueColor = ref.trueColor;
    }
    if (ref.falseColor) {
        look.falseColor = ref.falseColor;
    }
    if (ref.scale) {
        look.scale = ref.scale;
    }
    if (ref.longPress) {
        look.longPress = ref.longPress;
    }
    return look;
}

/**
 * @param ref a slot
 * @returns true when the slot has own settings
 */
export function devicePageSlotHasLook(ref: DevicePageSlotRef | null | undefined): boolean {
    return !!ref && Object.keys(devicePageSlotLookOf(ref)).length > 0;
}

/**
 * The state of the status line of the device page: a state of the device ({@link DevicePageStateRef}) or, with
 * `custom`, an own data point of the user - any state, also outside the device (e.g. `0_userdata.0.…`), `key` is ''.
 * With `custom` the `id` may be '' (chosen in the admin, no data point entered yet): the status line stays empty.
 * A configuration without `custom` is a state of the device as before.
 */
export type DevicePageStatusRef = DevicePageStateRef & {
    /** true = an own data point of the user (not chosen from the states of the device) */
    custom?: true;
};

/** admin configuration of the device page ({@link DeviceDetailsConfig.devicePage}) */
export type DevicePageConfig = {
    /** HMI page: 1 = cardDevice1, 2 = cardDevice2, 3 = cardDevice3 */
    layout: DevicePageLayout;
    /**
     * one entry per slot of the layout ({@link DEVICE_PAGE_LAYOUTS}, same order), null = empty slot. A change of the
     * layout keeps the entries by position (cut or filled with null), nothing is guessed again.
     */
    slots: (DevicePageSlotRef | null)[];
    /** the "i" icon bottom right opens the detail page - only if the device has ticked rows ({@link DeviceDetailsConfig.entries}) */
    showInfo: boolean;
    /** MDI name of the big device icon, missing = the icon of the item */
    icon?: string;
    /**
     * the state shown as text in the wide status line (field 6 of the main item), missing = empty status line - no
     * suggestion, the user chooses it; with `custom` an own data point ({@link DevicePageStatusRef})
     */
    status?: DevicePageStatusRef;
};

/** the device page at runtime ({@link DeviceDetailsRuntime.devicePage}) */
export type DevicePageRuntime = {
    layout: DevicePageLayout;
    /** one entry per slot of the layout, null = empty slot - never a custom one without id */
    slots: (DevicePageSlotRef | null)[];
    /** the info icon is shown (configured and the device has rows for the detail page) */
    showInfo: boolean;
    icon?: string;
    /** never a custom one without id */
    status?: DevicePageStatusRef;
    /**
     * the short tap of the item: `navigation`, `popup` and `devicePage` make the main item a text without action;
     * `devicePage` opens the device page from the page of the item
     */
    shortPress: DeviceShortPress;
};

/**
 * @param slots slots of a device page
 * @param layout the layout
 * @returns the slots cut or filled with null to the number of slots of the layout - by position, nothing is guessed;
 * the older own icon (`icon`) stays only on a `status` slot, the own look ({@link DevicePageSlotLook}) on every slot
 */
export function fitDevicePageSlots(
    slots: readonly (DevicePageSlotRef | null)[],
    layout: DevicePageLayout,
): (DevicePageSlotRef | null)[] {
    return DEVICE_PAGE_LAYOUTS[layout].map((kind, i) => {
        const slot = slots[i];
        if (!slot) {
            return null;
        }
        const out: DevicePageSlotRef = { ...slot };
        if (kind !== 'status') {
            delete out.icon;
        }
        return out;
    });
}

/**
 * The suggestion for the slots of a new device page: only the `info` / `value` slots are filled, one after the other
 * with the ticked rows of the detail page (learned ticks / mask) - every state fits them. `button`, `switch`,
 * `progress` and `status` stay empty, the user chooses them.
 *
 * @param entries the ticked rows of the item in their order
 * @param layout the layout
 * @returns the slots
 */
export function defaultDevicePageSlots(
    entries: readonly DeviceDetailEntryConfig[],
    layout: DevicePageLayout,
): (DevicePageSlotRef | null)[] {
    const rows = entries.filter(e => e.id !== '');
    let next = 0;
    return DEVICE_PAGE_LAYOUTS[layout].map(kind => {
        if ((kind === 'info' || kind === 'value') && next < rows.length) {
            return { ...rows[next++] };
        }
        return null;
    });
}

/**
 * A new device page for the admin: the slots of {@link defaultDevicePageSlots}, info shown, no own icon, no status.
 *
 * @param entries the ticked rows of the item in their order
 * @param layout the layout, default 1
 * @returns the configuration
 */
export function defaultDevicePageConfig(
    entries: readonly DeviceDetailEntryConfig[],
    layout: DevicePageLayout = 1,
): DevicePageConfig {
    return { layout, slots: defaultDevicePageSlots(entries, layout), showInfo: true };
}

/**
 * @param value anything
 * @returns true for a layout of the device page
 */
export function isDevicePageLayout(value: unknown): value is DevicePageLayout {
    return value === 1 || value === 2 || value === 3;
}

/**
 * @param value a stored slot / status
 * @param keepIcon keep the own icon (only a `status` slot has one)
 * @returns the reference with a trimmed own text and icon (empty ones left out), null when it is no usable reference (no state)
 */
function devicePageStateRefOf(value: unknown, keepIcon: boolean): DevicePageStateRef | null {
    if (!isDeviceDetailEntryConfig(value) || value.id === '') {
        return null;
    }
    const ref: DevicePageStateRef = { key: value.key, id: value.id };
    const subName = value.subName?.trim();
    if (subName) {
        ref.subName = subName;
    }
    const icon = keepIcon && 'icon' in value && typeof value.icon === 'string' ? value.icon.trim() : '';
    if (icon) {
        ref.icon = icon;
    }
    return ref;
}

/**
 * @param value an object
 * @param key name of a field
 * @returns the trimmed text of the field, '' when it is missing or no text
 */
function trimmedField(value: object, key: string): string {
    const found: unknown = Object.entries(value).find(([k]) => k === key)?.[1];
    return typeof found === 'string' ? found.trim() : '';
}

/**
 * @param value a stored slot
 * @param kind the kind of the slot
 * @returns the slot: a state of the device, an own data point or an alias channel (`custom`, trimmed id, also an
 * empty one - the choice stays), with its own look (icons trimmed, colors only as `#rrggbb`, empty ones left out);
 * null when it is none
 */
function devicePageSlotRefOf(value: unknown, kind: DevicePageSlotKind): DevicePageSlotRef | null {
    if (!isDeviceDetailEntryConfig(value)) {
        return null;
    }
    let ref: DevicePageSlotRef | null;
    const custom = 'custom' in value ? value.custom : undefined;
    if (custom === 'state' || custom === 'channel') {
        ref = { key: '', id: value.id.trim(), custom };
    } else {
        ref = devicePageStateRefOf(value, kind === 'status');
    }
    if (!ref) {
        return null;
    }
    for (const field of DEVICE_PAGE_SLOT_LOOK_FIELDS) {
        const text = trimmedField(value, field);
        if (text && (!field.endsWith('Color') || /^#[0-9a-f]{6}$/i.test(text))) {
            ref[field] = text;
        }
    }
    if (ref.trueIcon || ref.falseIcon) {
        // the older icon counts only while no own icon is set
        delete ref.icon;
    }
    const scale: unknown = 'scale' in value ? value.scale : undefined;
    if (isIconColorScaleElement(scale)) {
        ref.scale = { ...scale };
    }
    return ref;
}

/**
 * @param value a stored status
 * @returns the reference of the status line: an own data point (`custom: true`, trimmed id, also an empty one - the
 * choice stays) or a state of the device, null when it is none
 */
function devicePageStatusRefOf(value: unknown): DevicePageStatusRef | null {
    if (isDeviceDetailEntryConfig(value) && 'custom' in value && value.custom === true) {
        return { key: '', id: value.id.trim(), custom: true };
    }
    return devicePageStateRefOf(value, false);
}

/**
 * The normalized device page of a stored configuration: an unknown layout becomes 1, the slots are cut or filled to
 * the slots of the layout (an invalid slot or one without state is empty; an older layout 1 with 6 slots gets its 4
 * status slots empty; an older own icon is kept only on a `status` slot, the own look on every slot), `showInfo` is
 * true unless it is false, an empty icon or status is left out - an own data point of the status line and an own
 * data point or alias channel of a slot (`custom`) stay also without id.
 *
 * @param value the field `devicePage` of a device configuration
 * @returns the device page, undefined when there is none (not an object)
 */
export function devicePageConfigOf(value: unknown): DevicePageConfig | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }
    const layout = 'layout' in value && isDevicePageLayout(value.layout) ? value.layout : 1;
    const rawSlots: unknown[] = 'slots' in value && Array.isArray(value.slots) ? value.slots : [];
    const slots: (DevicePageSlotRef | null)[] = [];
    DEVICE_PAGE_LAYOUTS[layout].forEach((kind, i) => {
        slots.push(devicePageSlotRefOf(rawSlots[i], kind));
    });
    const config: DevicePageConfig = {
        layout,
        slots,
        showInfo: !('showInfo' in value) || value.showInfo !== false,
    };
    const icon = 'icon' in value && typeof value.icon === 'string' ? value.icon.trim() : '';
    if (icon) {
        config.icon = icon;
    }
    const status = 'status' in value ? devicePageStatusRefOf(value.status) : null;
    if (status) {
        config.status = status;
    }
    return config;
}

/**
 * The learned ticks per adapter (native `deviceDetailsLearned`): adapter -> identifiers ({@link deviceDetailIdentifier})
 * in their order. An empty list is a valid learned choice (nothing ticked).
 */
export type DeviceDetailsLearned = Record<string, string[]>;

/**
 * the device part of a runtime page item: a long press opens the detail page with these rows - or the device page when
 * `devicePage` is set and the panel has it
 */
export type DeviceDetailsRuntime = {
    deviceId: string;
    entries: DeviceDetailEntryConfig[];
    devicePage?: DevicePageRuntime;
};

/** a row of the filter list of the admin */
export type DeviceDetailRow = {
    /** key of the mask entry, '' = a state without entry */
    key: string;
    /** full id of the state, '' = the entry of the mask found no state */
    id: string;
    /** ticked: shown on the detail page */
    enabled: boolean;
    /** own text of the second name line ({@link DeviceDetailEntryConfig.subName}) */
    subName?: string;
};

/** what the detail page does with a state (doc/ideas/device-details/README.md, section Zeilen) */
export type DeviceDetailRowKind =
    /** read: false - a button, a tap writes true */
    | 'button'
    /** boolean, writable - a switch (OnOff) */
    | 'switch'
    /** boolean, read only - on/off */
    | 'boolean'
    /** number or string with common.states, writable - a selection popup (input_sel / popupInSel) */
    | 'select'
    /** number, read only or writable without common.states - value with unit */
    | 'number'
    /** anything else - text, read only */
    | 'text';

/**
 * Whether `common.states` is a list the adapter can use: an array or an object with at least one entry. The old
 * string form (`"0:off;1:on"`) is not used, as everywhere else at runtime (StatesController.getCommonStates).
 *
 * @param states common.states of a state
 * @returns true for a usable list
 */
export function hasCommonStatesList(states: unknown): boolean {
    if (Array.isArray(states)) {
        return states.length > 0;
    }
    return !!states && typeof states === 'object' && Object.keys(states).length > 0;
}

/**
 * The kind of row a state gets on the detail page.
 *
 * @param common type, read, write and states of the state
 * @param common.type common.type
 * @param common.read common.read (undefined counts as true)
 * @param common.write common.write (undefined counts as true)
 * @param common.states common.states - a writable number or string with a usable list is a selection
 * @returns the kind of the row
 */
export function deviceDetailRowKind(common: {
    type?: string;
    read?: boolean;
    write?: boolean;
    states?: unknown;
}): DeviceDetailRowKind {
    const writable = common.write !== false;
    if (common.read === false) {
        return 'button';
    }
    if (common.type === 'boolean') {
        return writable ? 'switch' : 'boolean';
    }
    if (writable && (common.type === 'number' || common.type === 'string') && hasCommonStatesList(common.states)) {
        return 'select';
    }
    if (common.type === 'number') {
        return 'number';
    }
    return 'text';
}

/** the general mask: rules by role only, for adapters without a mask of their own */
export const generalDeviceDetailMask: DeviceDetailMask = {
    adapter: '',
    entries: [
        { key: 'switch', group: 'info', icon: 'toggle-switch', rules: [{ role: 'switch' }] },
        {
            key: 'power',
            group: 'energy',
            icon: 'lightning-bolt',
            rules: [{ role: ['value.power', 'value.power.active', 'value.power.consumption'], unit: 'W' }],
        },
        { key: 'voltage', group: 'energy', icon: 'flash', rules: [{ role: 'value.voltage' }] },
        { key: 'current', group: 'energy', icon: 'current-ac', rules: [{ role: 'value.current' }] },
        {
            key: 'energy',
            group: 'energy',
            icon: 'counter',
            rules: [
                { role: ['value.energy', 'value.energy.consumed', 'value.energy.active'] },
                { role: 'value.power.consumption', unit: 'kWh' },
                { role: 'value.power.consumption', unit: 'Wh' },
            ],
        },
        { key: 'battery', group: 'energy', icon: 'battery', rules: [{ role: 'value.battery' }] },
        { key: 'batteryVoltage', group: 'energy', icon: 'battery-charging', rules: [{ role: 'battery.voltage' }] },
        { key: 'lowBattery', group: 'energy', icon: 'battery-alert', rules: [{ role: 'indicator.lowbat' }] },
        { key: 'temperature', group: 'climate', icon: 'thermometer', rules: [{ role: 'value.temperature' }] },
        { key: 'setpoint', group: 'climate', icon: 'home-thermometer', rules: [{ role: 'level.temperature' }] },
        { key: 'humidity', group: 'climate', icon: 'water-percent', rules: [{ role: 'value.humidity' }] },
        {
            key: 'illuminance',
            group: 'climate',
            icon: 'brightness-5',
            rules: [{ role: ['value.brightness', 'value.illuminance'] }],
        },
        { key: 'pressure', group: 'climate', icon: 'gauge', rules: [{ role: 'value.pressure' }] },
        { key: 'rssi', group: 'connection', icon: 'wifi', rules: [{ role: 'value.rssi' }] },
        { key: 'reachable', group: 'connection', icon: 'lan-connect', rules: [{ role: 'indicator.reachable' }] },
        { key: 'unreachable', group: 'connection', icon: 'lan-disconnect', rules: [{ role: 'indicator.unreach' }] },
        { key: 'ip', group: 'connection', icon: 'ip-network', rules: [{ role: 'info.ip' }] },
        { key: 'firmware', group: 'info', icon: 'chip', rules: [{ role: 'info.firmware' }] },
    ],
};

/** the masks of the known adapters (allObjects.json of a productive ioBroker, 2026-11-21) */
export const deviceDetailMasks: readonly DeviceDetailMask[] = [
    {
        // shellyplus1pm#…#1 / SHSW-1#…#1 - Relay0, Input0, Sys, … as sub folders
        adapter: 'shelly',
        deviceLevel: 3,
        entries: [
            { key: 'switch', group: 'info', icon: 'toggle-switch', rules: [{ role: 'switch', dp: '.Switch' }] },
            { key: 'power', group: 'energy', icon: 'lightning-bolt', rules: [{ role: 'value.power', dp: '.Power' }] },
            { key: 'voltage', group: 'energy', icon: 'flash', rules: [{ role: 'value.voltage', dp: '.Voltage' }] },
            { key: 'current', group: 'energy', icon: 'current-ac', rules: [{ role: 'value.current', dp: '.Current' }] },
            // Gen2+: value.energy, Gen1 (Shelly 1PM, Plug S, …): value.power.consumption - both Wh in Relay0.Energy
            {
                key: 'energy',
                group: 'energy',
                icon: 'counter',
                rules: [
                    { role: 'value.energy', dp: '.Energy' },
                    { role: 'value.power.consumption', dp: '.Energy' },
                ],
            },
            // every temperature comes as °C and °F pair, the °C state counts
            {
                key: 'temperature',
                group: 'climate',
                icon: 'thermometer',
                rules: [{ role: 'value.temperature', dp: '.temperatureC' }],
            },
            { key: 'humidity', group: 'climate', icon: 'water-percent', rules: [{ role: 'value.humidity' }] },
            // role value, unit dBm
            { key: 'rssi', group: 'connection', icon: 'wifi', rules: [{ role: 'value', dp: '.rssi' }] },
            {
                key: 'reachable',
                group: 'connection',
                icon: 'lan-connect',
                rules: [{ role: 'indicator.reachable', dp: '.online' }],
            },
            { key: 'ip', group: 'connection', icon: 'ip-network', rules: [{ role: 'info.ip', dp: '.hostname' }] },
            { key: 'firmware', group: 'info', icon: 'chip', rules: [{ role: 'state', dp: '.version' }] },
            // boolean "new firmware available"
            { key: 'update', group: 'info', icon: 'update', rules: [{ role: 'state', dp: '.firmware' }] },
            { key: 'uptime', group: 'info', icon: 'timer-outline', rules: [{ role: 'value.interval', dp: '.uptime' }] },
        ],
    },
    {
        // Tasmota devices, one channel per device, INFO as sub folder
        adapter: 'sonoff',
        deviceLevel: 3,
        entries: [
            { key: 'switch', group: 'info', icon: 'toggle-switch', rules: [{ role: 'switch' }] },
            {
                key: 'power',
                group: 'energy',
                icon: 'lightning-bolt',
                rules: [{ role: 'value.power.consumption', dp: '.ENERGY_Power' }],
            },
            {
                key: 'voltage',
                group: 'energy',
                icon: 'flash',
                rules: [{ role: 'value.voltage', dp: '.ENERGY_Voltage' }],
            },
            {
                key: 'current',
                group: 'energy',
                icon: 'current-ac',
                rules: [{ role: 'value.current', dp: '.ENERGY_Current' }],
            },
            {
                key: 'energyToday',
                group: 'energy',
                icon: 'counter',
                rules: [{ role: 'value.energy.consumed', dp: '.ENERGY_Today' }],
            },
            {
                key: 'energy',
                group: 'energy',
                icon: 'counter',
                rules: [{ role: 'value.power.consumption', dp: '.ENERGY_Total' }],
            },
            { key: 'temperature', group: 'climate', icon: 'thermometer', rules: [{ role: 'value.temperature' }] },
            { key: 'humidity', group: 'climate', icon: 'water-percent', rules: [{ role: 'value.humidity' }] },
            { key: 'illuminance', group: 'climate', icon: 'brightness-5', rules: [{ role: 'value.illuminance' }] },
            // Wifi_RSSI (%) and Wifi_Signal (dBm) both have the role value.rssi - dBm like the other adapters
            { key: 'rssi', group: 'connection', icon: 'wifi', rules: [{ role: 'value.rssi', dp: '.Wifi_Signal' }] },
            { key: 'reachable', group: 'connection', icon: 'lan-connect', rules: [{ role: 'indicator.reachable' }] },
            { key: 'ip', group: 'connection', icon: 'ip-network', rules: [{ role: 'info.ip', dp: '.IPAddress' }] },
            { key: 'firmware', group: 'info', icon: 'chip', rules: [{ role: 'info.firmware', dp: '.Version' }] },
            {
                key: 'uptime',
                group: 'info',
                icon: 'timer-outline',
                rules: [{ role: 'value.interval', dp: '.UptimeSec' }],
            },
        ],
    },
    {
        // one device object per Zigbee device, all states directly below it
        adapter: 'zigbee2mqtt',
        deviceLevel: 3,
        entries: [
            { key: 'switch', group: 'info', icon: 'toggle-switch', rules: [{ role: 'switch', dp: '.state' }] },
            { key: 'power', group: 'energy', icon: 'lightning-bolt', rules: [{ role: 'value.power' }] },
            { key: 'voltage', group: 'energy', icon: 'flash', rules: [{ role: 'value.voltage' }] },
            { key: 'current', group: 'energy', icon: 'current-ac', rules: [{ role: 'value.current' }] },
            {
                key: 'energy',
                group: 'energy',
                icon: 'counter',
                rules: [{ role: 'value.power.consumption', dp: '.energy' }],
            },
            { key: 'battery', group: 'energy', icon: 'battery', rules: [{ role: 'value.battery' }] },
            { key: 'batteryVoltage', group: 'energy', icon: 'battery-charging', rules: [{ role: 'battery.voltage' }] },
            { key: 'lowBattery', group: 'energy', icon: 'battery-alert', rules: [{ role: 'indicator.lowbat' }] },
            {
                key: 'temperature',
                group: 'climate',
                icon: 'thermometer',
                rules: [{ role: 'value.temperature', dp: '.temperature' }],
            },
            {
                key: 'deviceTemperature',
                group: 'climate',
                icon: 'thermometer-lines',
                rules: [{ role: 'value.temperature', dp: '.device_temperature' }],
            },
            { key: 'humidity', group: 'climate', icon: 'water-percent', rules: [{ role: 'value.humidity' }] },
            {
                key: 'illuminance',
                group: 'climate',
                icon: 'brightness-5',
                rules: [{ role: 'value.brightness', dp: '.illuminance' }],
            },
            { key: 'pressure', group: 'climate', icon: 'gauge', rules: [{ role: 'value.pressure' }] },
            {
                key: 'linkQuality',
                group: 'connection',
                icon: 'signal',
                rules: [{ role: 'state', dp: '.link_quality' }],
            },
            {
                key: 'reachable',
                group: 'connection',
                icon: 'lan-connect',
                rules: [{ role: 'indicator.reachable', dp: '.available' }],
            },
            {
                key: 'lastSeen',
                group: 'connection',
                icon: 'clock-outline',
                rules: [{ role: 'state', dp: '.last_seen' }],
            },
        ],
    },
    {
        // HomeMatic: hm-rpc.N.<serial>, the states lie in the channels :0, :1, … (sub folders)
        adapter: 'hm-rpc',
        deviceLevel: 3,
        entries: [
            { key: 'switch', group: 'info', icon: 'toggle-switch', rules: [{ role: 'switch', dp: '.STATE' }] },
            { key: 'power', group: 'energy', icon: 'lightning-bolt', rules: [{ role: 'value.power' }] },
            { key: 'current', group: 'energy', icon: 'current-ac', rules: [{ role: 'value.current' }] },
            { key: 'energy', group: 'energy', icon: 'counter', rules: [{ role: 'value.power.consumption' }] },
            {
                key: 'voltage',
                group: 'energy',
                icon: 'flash',
                rules: [{ role: 'value.voltage', dp: '.OPERATING_VOLTAGE' }],
            },
            { key: 'lowBattery', group: 'energy', icon: 'battery-alert', rules: [{ role: 'indicator.lowbat' }] },
            {
                key: 'temperature',
                group: 'climate',
                icon: 'thermometer',
                rules: [{ role: 'value.temperature', dp: '.ACTUAL_TEMPERATURE' }],
            },
            {
                key: 'setpoint',
                group: 'climate',
                icon: 'home-thermometer',
                rules: [{ role: 'level.temperature', dp: '.SET_POINT_TEMPERATURE' }],
            },
            { key: 'humidity', group: 'climate', icon: 'water-percent', rules: [{ role: 'value.humidity' }] },
            { key: 'rssi', group: 'connection', icon: 'wifi', rules: [{ role: 'value.rssi', dp: '.RSSI_DEVICE' }] },
            {
                key: 'unreachable',
                group: 'connection',
                icon: 'lan-disconnect',
                rules: [{ role: 'indicator.unreach', dp: '.UNREACH' }],
            },
            { key: 'update', group: 'info', icon: 'update', rules: [{ role: 'indicator', dp: '.UPDATE_PENDING' }] },
        ],
    },
];

/**
 * @param id id of a device or state
 * @returns the adapter of the id (first part, `shelly` of `shelly.0.x`)
 */
export function deviceDetailsAdapter(id: string): string {
    return id.split('.')[0] ?? '';
}

/**
 * The mask of the adapter of a device, the general mask for an adapter without one.
 *
 * @param deviceId id of the device
 * @returns the mask
 */
export function deviceDetailMaskOf(deviceId: string): DeviceDetailMask {
    const adapter = deviceDetailsAdapter(deviceId);
    return deviceDetailMasks.find(m => m.adapter === adapter) ?? generalDeviceDetailMask;
}

/**
 * @param deviceId id of the device
 * @returns true when the adapter of the device has a mask of its own
 */
export function hasOwnDeviceDetailMask(deviceId: string): boolean {
    return deviceDetailMaskOf(deviceId) !== generalDeviceDetailMask;
}

/**
 * Whether an object may be the device of the item: only objects of type device or channel, never an instance, the
 * root of an adapter (`shelly.0`) or the info channel of an instance (`shelly.0.info`); a known adapter fixes the level
 * its devices lie on.
 *
 * @param id id of the object
 * @param type type of the object, undefined = the object does not exist
 * @returns why it cannot be chosen, undefined = it can
 */
export function deviceSelectionError(id: string, type: string | undefined): DeviceSelectionError | undefined {
    if (type === undefined) {
        return 'notFound';
    }
    if (type !== 'device' && type !== 'channel') {
        return 'type';
    }
    const parts = id.split('.');
    const level = parts.length;
    if (level < 3) {
        return 'root';
    }
    // the info channel of an instance (`shelly.0.info`, `zigbee2mqtt.0.info`) is no device
    if (level === 3 && parts[2] === 'info') {
        return 'info';
    }
    const mask = deviceDetailMaskOf(id);
    if (mask.deviceLevel !== undefined && mask.deviceLevel !== level) {
        return 'level';
    }
    return undefined;
}

/**
 * Whether a state belongs to the device: directly below it or in at most one sub folder (`Relay0.Power`, `1.STATE`).
 *
 * @param deviceId id of the device
 * @param stateId id of the state
 * @returns true when it belongs to the device
 */
export function isDeviceDetailState(deviceId: string, stateId: string): boolean {
    if (!deviceId || !stateId.startsWith(`${deviceId}.`)) {
        return false;
    }
    const rest = stateId.slice(deviceId.length + 1).split('.');
    return rest.length >= 1 && rest.length <= 2 && rest.every(part => part !== '');
}

/**
 * @param rule a rule of a mask entry
 * @param state the state
 * @returns true when every condition of the rule matches the state
 */
export function deviceDetailRuleMatches(
    rule: DeviceDetailRule,
    state: Pick<DeviceStateInfo, 'id' | 'role' | 'unit'>,
): boolean {
    if (rule.role === undefined && rule.dp === undefined && rule.unit === undefined) {
        return false;
    }
    if (rule.role !== undefined) {
        const roles: readonly string[] = typeof rule.role === 'string' ? [rule.role] : rule.role;
        if (!roles.includes(state.role)) {
            return false;
        }
    }
    if (rule.dp !== undefined && !state.id.endsWith(rule.dp)) {
        return false;
    }
    if (rule.unit !== undefined && state.unit !== rule.unit) {
        return false;
    }
    return true;
}

/**
 * The first entry of a mask a state belongs to.
 *
 * @param mask the mask
 * @param state the state
 * @returns the entry, undefined when no rule matches
 */
export function deviceDetailEntryOfState(
    mask: DeviceDetailMask,
    state: Pick<DeviceStateInfo, 'id' | 'role' | 'unit'>,
): DeviceDetailMaskEntry | undefined {
    return mask.entries.find(entry => entry.rules.some(rule => deviceDetailRuleMatches(rule, state)));
}

/**
 * An entry of the mask of a device or of the general mask by its key.
 *
 * @param deviceId id of the device
 * @param key key of the entry
 * @returns the entry, undefined for '' or an unknown key
 */
export function deviceDetailEntryByKey(deviceId: string, key: string): DeviceDetailMaskEntry | undefined {
    if (!key) {
        return undefined;
    }
    return (
        deviceDetailMaskOf(deviceId).entries.find(e => e.key === key) ??
        generalDeviceDetailMask.entries.find(e => e.key === key)
    );
}

/**
 * The entry a row stands for: the entry of its key, without key the entry of the general mask the role of the state
 * suggests (icon and color group of the row).
 *
 * @param deviceId id of the device
 * @param key key of the row
 * @param state the state of the row (role, unit), undefined when unknown
 * @returns the entry, undefined when nothing fits
 */
export function deviceDetailEntryOfRow(
    deviceId: string,
    key: string,
    state: Pick<DeviceStateInfo, 'id' | 'role' | 'unit'> | undefined,
): DeviceDetailMaskEntry | undefined {
    return (
        deviceDetailEntryByKey(deviceId, key) ??
        (state ? deviceDetailEntryOfState(generalDeviceDetailMask, state) : undefined)
    );
}

/**
 * @param key key of a mask entry
 * @returns the translation key of its name
 */
export function deviceDetailNameKey(key: string): string {
    return `${DEVICE_DETAIL_NAME_PREFIX}${key}`;
}

/**
 * What a row stands for when the admin learns the ticks of an adapter: the key of its entry, a row without entry by
 * the id of its state below the device (`~Relay0.Power`) - both are the same for the devices of one adapter.
 *
 * @param deviceId id of the device of the row
 * @param row the row
 * @param row.key key of the row
 * @param row.id id of the state of the row
 * @returns the identifier
 */
export function deviceDetailIdentifier(deviceId: string, row: { key: string; id: string }): string {
    if (row.key) {
        return row.key;
    }
    return `~${row.id.startsWith(`${deviceId}.`) ? row.id.slice(deviceId.length + 1) : row.id}`;
}

/**
 * The rows of the filter list: the entries of the mask with the states they found (an entry without a state as an
 * empty row), then every other state of the device as a row of its own.
 *
 * Ticked and order: the saved rows of the item first, in their order; without saved rows the rows the user ticked
 * last at this adapter ({@link DeviceDetailsLearned}, an empty list = nothing ticked), in their order; without both
 * the rows of the mask. A state appears in one row only.
 *
 * @param deviceId id of the device
 * @param states the states of the device
 * @param saved the saved rows of the item, undefined for a new item
 * @param learned the learned identifiers of the adapter ({@link deviceDetailIdentifier}), undefined = none
 * @returns the rows
 */
export function buildDeviceDetailRows(
    deviceId: string,
    states: readonly DeviceStateInfo[],
    saved: readonly DeviceDetailEntryConfig[] | undefined,
    learned: readonly string[] | undefined,
): DeviceDetailRow[] {
    const mask = deviceDetailMaskOf(deviceId);
    const own = states.filter(s => isDeviceDetailState(deviceId, s.id)).sort((a, b) => a.id.localeCompare(b.id));
    const byEntry = new Map<string, DeviceStateInfo[]>();
    const rest: DeviceStateInfo[] = [];
    for (const state of own) {
        const entry = deviceDetailEntryOfState(mask, state);
        if (entry) {
            const list = byEntry.get(entry.key) ?? [];
            list.push(state);
            byEntry.set(entry.key, list);
        } else {
            rest.push(state);
        }
    }
    const candidates: DeviceDetailRow[] = [];
    for (const entry of mask.entries) {
        const found = byEntry.get(entry.key);
        if (found && found.length > 0) {
            for (const state of found) {
                candidates.push({ key: entry.key, id: state.id, enabled: false });
            }
        } else if (mask !== generalDeviceDetailMask) {
            // the general mask only names what the roles find, an empty row of it says nothing
            candidates.push({ key: entry.key, id: '', enabled: false });
        }
    }
    for (const state of rest) {
        candidates.push({ key: '', id: state.id, enabled: false });
    }

    const same = (a: { key: string; id: string }, b: { key: string; id: string }): boolean =>
        a.key === b.key && a.id === b.id;

    if (saved && saved.length > 0) {
        const first: DeviceDetailRow[] = [];
        for (const s of saved) {
            if (s.id !== '' && !first.some(f => f.id === s.id)) {
                first.push(
                    s.subName
                        ? { key: s.key, id: s.id, enabled: true, subName: s.subName }
                        : { key: s.key, id: s.id, enabled: true },
                );
            }
        }
        // a state is shown once: a candidate whose state a saved row already shows (exchanged by the user) stays
        // as an empty row of its entry, a plain one is dropped
        const others: DeviceDetailRow[] = [];
        for (const c of candidates) {
            if (first.some(f => same(f, c))) {
                continue;
            }
            const row = c.id !== '' && first.some(f => f.id === c.id) ? { ...c, id: '' } : c;
            if (
                row.id === '' &&
                (row.key === '' || others.some(r => same(r, row)) || first.some(f => f.key === row.key))
            ) {
                continue;
            }
            others.push(row);
        }
        return [...first, ...others];
    }
    if (learned !== undefined) {
        const first: DeviceDetailRow[] = [];
        for (const ident of learned) {
            for (const c of candidates) {
                if (c.id && deviceDetailIdentifier(deviceId, c) === ident && !first.some(f => same(f, c))) {
                    first.push({ ...c, enabled: true });
                }
            }
        }
        return [...first, ...candidates.filter(c => !first.some(f => same(f, c)))];
    }
    return candidates.map(c => ({ ...c, enabled: c.key !== '' && c.id !== '' }));
}

/**
 * The rows the detail page shows: the ticked rows with a state, in their order.
 *
 * @param rows the rows of the filter list
 * @returns the rows to save
 */
export function deviceDetailEntriesOfRows(rows: readonly DeviceDetailRow[]): DeviceDetailEntryConfig[] {
    const out: DeviceDetailEntryConfig[] = [];
    for (const r of rows) {
        if (r.enabled && r.id !== '' && !out.some(o => o.id === r.id)) {
            const subName = r.subName?.trim();
            out.push(subName ? { key: r.key, id: r.id, subName } : { key: r.key, id: r.id });
        }
    }
    return out;
}

/**
 * Another state for a row of the filter list. A state is shown in one row only: a row that held the new state takes
 * the old state of the changed row (both swap), without old state it becomes empty and unticked; a row without entry
 * that would become empty is dropped.
 *
 * @param rows the rows
 * @param index index of the changed row
 * @param id the new state, '' = none
 * @param change further fields of the changed row (e.g. the entry the role suggests)
 * @returns the new rows
 */
export function exchangeDeviceDetailRowState<T extends DeviceDetailRow>(
    rows: readonly T[],
    index: number,
    id: string,
    change: Partial<DeviceDetailRow> = {},
): T[] {
    const row = rows[index];
    if (!row) {
        return [...rows];
    }
    const old = row.id;
    const out: T[] = [];
    rows.forEach((r, i) => {
        if (i === index) {
            out.push({ ...r, ...change, id, enabled: id !== '' && (r.enabled || old === '') });
        } else if (id !== '' && r.id === id) {
            if (old !== '') {
                out.push({ ...r, id: old });
            } else if (r.key !== '') {
                out.push({ ...r, id: '', enabled: false });
            }
        } else {
            out.push(r);
        }
    });
    return out;
}

/**
 * The filter list shows the ticked rows on top, in their order, then the unticked ones (stable: the order within both
 * blocks stays).
 *
 * @param rows the rows
 * @returns the rows, ticked first
 */
export function tickedDeviceDetailRowsFirst<T extends DeviceDetailRow>(rows: readonly T[]): T[] {
    return [...rows.filter(r => r.enabled), ...rows.filter(r => !r.enabled)];
}

/**
 * Ticks or unticks a row of the filter list and moves it to the border of both blocks: a ticked row becomes the last
 * ticked one, an unticked row the first unticked one.
 *
 * @param rows the rows, ticked first ({@link tickedDeviceDetailRowsFirst})
 * @param index index of the row
 * @param enabled ticked or not
 * @returns the new rows
 */
export function tickDeviceDetailRow<T extends DeviceDetailRow>(
    rows: readonly T[],
    index: number,
    enabled: boolean,
): T[] {
    const row = rows[index];
    if (!row) {
        return [...rows];
    }
    const others = tickedDeviceDetailRowsFirst(rows.filter((_r, i) => i !== index));
    const border = others.filter(r => r.enabled).length;
    return [...others.slice(0, border), { ...row, enabled }, ...others.slice(border)];
}

/**
 * @param value anything
 * @returns true for a saved row
 */
function isDeviceDetailEntryConfig(value: unknown): value is DeviceDetailEntryConfig {
    return (
        !!value &&
        typeof value === 'object' &&
        'key' in value &&
        typeof value.key === 'string' &&
        'id' in value &&
        typeof value.id === 'string' &&
        (!('subName' in value) || value.subName === undefined || typeof value.subName === 'string')
    );
}

/**
 * @param value anything, e.g. the `device` field of a stored page item
 * @returns true for a usable device configuration
 */
export function isDeviceDetailsConfig(value: unknown): value is DeviceDetailsConfig {
    return (
        !!value &&
        typeof value === 'object' &&
        'deviceId' in value &&
        typeof value.deviceId === 'string' &&
        value.deviceId !== '' &&
        'entries' in value &&
        Array.isArray(value.entries) &&
        value.entries.every(isDeviceDetailEntryConfig)
    );
}

/**
 * The runtime part of a device configuration (the field `deviceDetails` of the runtime page item).
 *
 * @param config the device configuration of an admin page item
 * @returns the runtime part, undefined without a usable configuration
 */
export function deviceDetailsRuntimeOf(config: unknown): DeviceDetailsRuntime | undefined {
    if (!isDeviceDetailsConfig(config)) {
        return undefined;
    }
    const runtime: DeviceDetailsRuntime = {
        deviceId: config.deviceId,
        entries: config.entries
            .filter(e => e.id !== '')
            .map(e => {
                const subName = e.subName?.trim();
                return subName ? { key: e.key, id: e.id, subName } : { key: e.key, id: e.id };
            }),
    };
    const page = devicePageConfigOf(config.devicePage);
    if (page) {
        const devicePage: DevicePageRuntime = {
            layout: page.layout,
            // an own data point or channel that is not entered yet: an empty slot
            slots: page.slots.map(slot => (slot && slot.id !== '' ? slot : null)),
            // without rows the detail page would be empty: no info icon
            showInfo: page.showInfo && runtime.entries.length > 0,
            shortPress: deviceShortPressOf(config),
        };
        if (page.icon) {
            devicePage.icon = page.icon;
        }
        // an own data point that is not entered yet: no status line
        if (page.status && page.status.id !== '') {
            devicePage.status = page.status;
        }
        runtime.devicePage = devicePage;
    }
    return runtime;
}

/**
 * @param value anything, e.g. native `deviceDetailsLearned`
 * @returns the learned ticks, invalid entries left out
 */
export function deviceDetailsLearnedOf(value: unknown): DeviceDetailsLearned {
    const out: DeviceDetailsLearned = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return out;
    }
    for (const [adapter, list] of Object.entries(value)) {
        if (Array.isArray(list) && list.every(v => typeof v === 'string')) {
            out[adapter] = [...list];
        }
    }
    return out;
}

/**
 * The learned ticks after saving a device item: they change only when the user saved the filter list of the device
 * and the ticks or their order changed at the item (a new item counts as changed), not with other changes like the
 * name. Entries the item only got as a suggestion (learned ticks, mask, no answer of the adapter) teach nothing.
 *
 * @param learned the learned ticks so far
 * @param before the device configuration of the item before the dialog, undefined for a new device item
 * @param after the saved device configuration
 * @param edited the user saved the filter list of this device in the dialog
 * @returns the new learned ticks, undefined when nothing changes
 */
export function updatedDeviceDetailsLearned(
    learned: DeviceDetailsLearned,
    before: DeviceDetailsConfig | undefined,
    after: DeviceDetailsConfig,
    edited: boolean,
): DeviceDetailsLearned | undefined {
    if (!after.deviceId || !edited) {
        return undefined;
    }
    const identifiers = (config: DeviceDetailsConfig): string[] =>
        config.entries.map(e => deviceDetailIdentifier(config.deviceId, e));
    const now = identifiers(after);
    if (before && before.deviceId === after.deviceId && JSON.stringify(identifiers(before)) === JSON.stringify(now)) {
        return undefined;
    }
    const adapter = deviceDetailsAdapter(after.deviceId);
    if (JSON.stringify(learned[adapter]) === JSON.stringify(now)) {
        return undefined;
    }
    return { ...learned, [adapter]: now };
}

/**
 * The id of a state below its device (`Ext.temperature100C`).
 *
 * @param deviceId id of the device
 * @param id full id of the state
 * @returns the rest of the id
 */
function restOfId(deviceId: string, id: string): string {
    return id.startsWith(`${deviceId}.`) ? id.slice(deviceId.length + 1) : id;
}

/**
 * The parts of an id below the device that the automatic second name line compares
 * (doc/ideas/device-details/README.md, section Zweite Namenszeile): every folder stays one part, the end id is cut
 * into runs of letters and runs of digits, a camel case word boundary separates as well - `Ext.temperature100C` ->
 * `Ext`, `temperature`, `100`, `C`; `Relay0.temperatureC` -> `Relay0`, `temperature`, `C`. Other characters (`_`,
 * `-`, ...) only separate.
 *
 * @param rest the id below the device
 * @returns the parts in their order
 */
export function deviceDetailSubNameTokens(rest: string): string[] {
    const parts = rest.split('.');
    const end = parts[parts.length - 1] ?? '';
    const folders = parts.slice(0, -1).filter(Boolean);
    // words of a camel case end id separately (temperatureC -> temperature, C; ABCValue -> ABC, Value)
    return [...folders, ...(end.match(/\p{Lu}+(?!\p{Ll})|\p{Lu}?\p{Ll}+|\p{L}+|\d+/gu) ?? [])];
}

/**
 * The automatic second name lines of a group of rows with the same name: the parts of the id
 * ({@link deviceDetailSubNameTokens}) that not every row of the group has, in their order, joined with a blank -
 * `Ext.temperature100C` / `Ext.temperature100F` -> `C` / `F`, `Relay0.temperatureC` / `Ext.temperature100C` ->
 * `Relay0` / `Ext 100`. A text that is empty or that another row of the group gets as well falls back to the id
 * below the device.
 *
 * @param rests the ids below the device of the rows of the group
 * @returns one text per row, same order
 */
function groupSubNames(rests: readonly string[]): string[] {
    const tokens = rests.map(deviceDetailSubNameTokens);
    const sets = tokens.map(t => new Set(t));
    const texts = tokens.map(t => t.filter(token => !sets.every(s => s.has(token))).join(' '));
    return texts.map((text, index) =>
        !text || texts.some((other, i) => i !== index && other === text) ? rests[index] : text,
    );
}

/** the second name line of a row ({@link deviceDetailSubNames}) */
export type DeviceDetailSubName = {
    /** another ticked row has the same name */
    duplicate: boolean;
    /**
     * the automatic text: for a duplicate what differs from the ids of the other rows of the same name (else the id
     * below the device), without duplicate the id below the device
     */
    auto: string;
    /** what the row shows: the own text, else the automatic one for a duplicate, else '' (no second line) */
    text: string;
};

/**
 * The second name lines of the ticked rows of a detail page: rows whose name another row has as well get an
 * automatic text - the ids below the device are compared within the rows of that name and only what differs is shown
 * (`Ext.temperature100C` / `Ext.temperature101C` -> `100` / `101`); if that is empty or not unique within the group,
 * the id below the device (`Ext.temperature100C`). An own text ({@link DeviceDetailEntryConfig.subName}) always
 * wins, also without duplicate.
 *
 * @param deviceId id of the device
 * @param rows the ticked rows in their order: id of the state, shown name, own text
 * @returns one entry per row, same order
 */
export function deviceDetailSubNames(
    deviceId: string,
    rows: readonly { id: string; name: string; subName?: string }[],
): DeviceDetailSubName[] {
    const groups = new Map<string, number[]>();
    rows.forEach((r, index) => groups.set(r.name, [...(groups.get(r.name) ?? []), index]));
    const autos = rows.map(r => restOfId(deviceId, r.id));
    for (const members of groups.values()) {
        if (members.length > 1) {
            const texts = groupSubNames(members.map(i => autos[i]));
            members.forEach((rowIndex, i) => {
                autos[rowIndex] = texts[i];
            });
        }
    }
    return rows.map((r, index) => {
        const duplicate = (groups.get(r.name)?.length ?? 0) > 1;
        const auto = autos[index];
        const own = r.subName?.trim() ?? '';
        return { duplicate, auto, text: own || (duplicate ? auto : '') };
    });
}
