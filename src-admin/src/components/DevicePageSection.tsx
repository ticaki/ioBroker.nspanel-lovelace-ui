/**
 * The device page of a device item (doc/ideas/device-details/README.md, section Geräteseite): layout with a schematic
 * preview, big icon, status line, the slots of the layout and the "i" icon. The states come from the answer of the
 * adapter (`getDeviceDetails`); without it the saved states stay as they are. A slot shows a state of the device or,
 * user defined, any data point, an alias channel or a navigation (icon and name, a tap opens a page); its "…" button
 * opens the settings of the element (DevicePageSlotDialog). With the option "web panel elements" ticked the extra
 * slots of the layout follow (DEVICE_PAGE_EXTRA_SLOTS) - each one like a slot of the layout of the same kind.
 * Layouts 1 and 3 choose the stage of the status icon grid: as many status icon places as the stage holds follow the
 * slots, the slots the stage covers and the places beyond it are hidden, not deleted; the preview shows the stage.
 */
import React from 'react';
import {
    Box,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormHelperText,
    FormLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    Tooltip,
    Typography,
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { I18n, type AdminConnection, type IobTheme, type ThemeType } from '@iobroker/gui-components';
import { EntitySelector } from './EntitySelector';
import DevicePageSlotDialog from './DevicePageSlotDialog';
import { CHANNEL_ROLES_LIST, type AdminPageItemConfig } from '../../../src/lib/types/adminShareConfig';
import {
    DEVICE_PAGE_LAYOUTS,
    deviceDetailNameKey,
    isDevicePageStatusStage,
    devicePageSlotAcceptsChannel,
    devicePageSlotHasLook,
    devicePageSlotTakesLongPress,
    devicePageSlotTakesNavigation,
    isDevicePageLayout,
    type DeviceDetailEntryConfig,
    type DevicePageConfig,
    type DevicePageLayout,
    type DevicePageSlotKind,
    type DevicePageSlotRef,
    type DeviceStateInfo,
} from '../../../src/lib/types/deviceDetails';
import { channelIdOf, channelRolesOf, isInChannels, roleOfObject, type ChannelRoleMap } from '../channelSelection';
import {
    DEVICE_PAGE_CUSTOM,
    DEVICE_PAGE_CUSTOM_STATUS,
    PREVIEW_INFO,
    PREVIEW_MAIN,
    PREVIEW_STATUS_CELL,
    customDevicePageSlot,
    devicePageCustomProblem,
    devicePageCustomSources,
    devicePageExtraSlots,
    isDevicePageCustomSource,
    withDevicePageSlotNavigation,
    devicePagePreviewAreas,
    devicePageShownStage,
    devicePageStatusPlaceCount,
    devicePageStatusStages,
    devicePageVisibleSlotIndexes,
    devicePageSlotDialogItem,
    devicePageSlotDialogValue,
    devicePageSlotItemOptions,
    devicePageSlotLookOfItem,
    devicePageSlotOf,
    devicePageSlotSelectValue,
    devicePageStateOptions,
    devicePageStatusOf,
    devicePageStatusSelectValue,
    customDevicePageStatus,
    isCustomDevicePageStatus,
    withDevicePageLayout,
    withDevicePageSlot,
    withDevicePageSlotLook,
    withDevicePageStatus,
    withDevicePageStatusSlot,
    withDevicePageStatusSlotLook,
    withDevicePageStatusSlotNavigation,
    withDevicePageStatusStage,
    withDevicePageWebExtras,
    type DevicePageCustomObject,
    type DevicePageSlotItemOptions,
    type DevicePageStateOption,
    type DevicePageStateProblem,
} from '../devicePageConfig';

export interface DevicePageSectionProps {
    /** for the object browser of the own data points and alias channels */
    socket: AdminConnection;
    /** for the color theme in the color dialog of a slot */
    adapterName?: string;
    instance?: number;
    theme: IobTheme;
    themeType: ThemeType;
    deviceId: string;
    /** the ticked rows of the detail page */
    entries: DeviceDetailEntryConfig[];
    value: DevicePageConfig;
    /** the states of the device, null = no answer of the adapter */
    states: DeviceStateInfo[] | null;
    onChange: (value: DevicePageConfig) => void;
    /** the icon selector of the big icon, rendered by the page item dialog */
    iconSelector: React.ReactNode;
    /**
     * an icon selector for the settings of a slot, rendered by the page item dialog
     *
     * @param label translation key of the label
     * @param value the chosen icon, '' = none
     * @param onChange the picked icon
     */
    iconSelect: (label: string, value: string, onChange: (icon: string) => void) => React.ReactNode;
    /**
     * the selector of the target page of a slot, rendered by the page item dialog
     *
     * @param slot the slot
     * @param onChange the chosen page, '' = none
     */
    targetSelect: (slot: DevicePageSlotRef, onChange: (page: string) => void) => React.ReactNode;
    /**
     * @param slot a slot
     * @returns true when its target page is not among the pages that can be chosen
     */
    targetProblem: (slot: DevicePageSlotRef | null) => boolean;
    /**
     * opens the page item dialog for the settings of a slot that shows a name (a status slot keeps its small dialog)
     *
     * @param item the settings of the slot as page item
     * @param options what the dialog offers for the slot
     * @param onApply the saved settings
     */
    slotItemDialog: (
        item: AdminPageItemConfig,
        options: DevicePageSlotItemOptions,
        onApply: (saved: AdminPageItemConfig) => void,
    ) => void;
}

interface DevicePageSectionState {
    /** the alias channels with a role the adapter knows (id -> role), null = not read yet */
    channelRoles: ChannelRoleMap | null;
    /** the objects behind the user defined slots by id: null = it does not exist, missing = not read yet */
    objects: Record<string, DevicePageCustomObject | null>;
}

const LAYOUTS: readonly DevicePageLayout[] = [1, 2, 3];

/**
 * where a slot of the section is stored: `slots` a slot of the layout or an extra slot ({@link DevicePageConfig.slots}),
 * `status` a status icon place ({@link DevicePageConfig.statusSlots}); index 0 = the first one
 */
interface SlotPlace {
    list: 'slots' | 'status';
    index: number;
}

/** scale of the preview: 480 × 320 → 168 × 112 */
const PREVIEW_SCALE = 0.35;

/** background of the areas by kind - the panel is dark, the preview as well (both themes) */
const KIND_COLOR: Readonly<Record<DevicePageSlotKind, string>> = {
    info: '#455a64',
    value: '#5d4037',
    progress: '#2e7d32',
    button: '#1565c0',
    switch: '#6a1b9a',
    status: '#00838f',
};

export default class DevicePageSection extends React.Component<DevicePageSectionProps, DevicePageSectionState> {
    private slotDialogRef = React.createRef<DevicePageSlotDialog>();
    /** the small dialog of the status icon places */
    private statusDialogRef = React.createRef<DevicePageSlotDialog>();
    /** ids being read */
    private readonly reading = new Set<string>();
    private unmounted = false;

    constructor(props: DevicePageSectionProps) {
        super(props);
        this.state = { channelRoles: null, objects: {} };
    }

    override componentDidMount(): void {
        void this.loadChannels();
        this.loadCustomObjects();
    }

    override componentDidUpdate(): void {
        this.loadCustomObjects();
    }

    override componentWillUnmount(): void {
        this.unmounted = true;
    }

    /** reads the alias channels the object browser of a channel slot offers */
    private async loadChannels(): Promise<void> {
        let channelRoles: ChannelRoleMap = {};
        try {
            channelRoles = channelRolesOf(await this.props.socket.getObjectViewSystem('channel'), CHANNEL_ROLES_LIST);
        } catch {
            // without the list the object browser offers no channel, an id can still be entered
        }
        if (!this.unmounted) {
            this.setState({ channelRoles });
        }
    }

    /** reads the objects of the user defined slots that are not known yet (for the marks of the slots) */
    private loadCustomObjects(): void {
        for (const slot of [...this.props.value.slots, ...(this.props.value.statusSlots ?? [])]) {
            const id = slot?.custom ? slot.id : '';
            if (id && !(id in this.state.objects) && !this.reading.has(id)) {
                this.reading.add(id);
                void this.loadCustomObject(id);
            }
        }
    }

    /**
     * @param id id of a data point or channel of a user defined slot
     */
    private async loadCustomObject(id: string): Promise<void> {
        let found: DevicePageCustomObject | null = null;
        try {
            const obj = await this.props.socket.getObject(id);
            if (obj) {
                found = { type: obj.type, role: roleOfObject(obj) };
                if (obj.type === 'state') {
                    found.valueType = obj.common.type;
                    found.read = obj.common.read;
                    found.write = obj.common.write;
                }
            }
        } catch {
            // not readable counts as missing
        }
        this.reading.delete(id);
        if (!this.unmounted) {
            this.setState(prev => ({ objects: { ...prev.objects, [id]: found } }));
        }
    }
    /**
     * @param layout the layout
     * @returns the label of the layout, e.g. "1 – Steuern"
     */
    private static layoutLabel(layout: DevicePageLayout): string {
        return `${layout} – ${I18n.t(`deviceDetailsDialog_pageLayout${layout}`)}`;
    }

    /**
     * @param kind the kind of a slot
     * @returns its translated label
     */
    private static kindLabel(kind: DevicePageSlotKind): string {
        return I18n.t(`deviceDetailsDialog_pageKind_${kind}`);
    }

    /**
     * The label of a state like in the filter list: the readable name (entry of the mask, else the name of the state)
     * and the id below the device, a marked state with the reason.
     *
     * @param option the state
     * @returns the label
     */
    private static optionLabel(option: DevicePageStateOption): string {
        const name = option.key ? I18n.t(deviceDetailNameKey(option.key)) : option.stateName;
        const label = name && name !== option.rest ? `${name} – ${option.rest}` : option.rest;
        if (option.problem === 'missing') {
            return `${label} (${I18n.t('deviceDetailsDialog_pageMissing')})`;
        }
        if (option.problem === 'unfit') {
            return `${label} (${I18n.t('deviceDetailsDialog_pageUnfit')})`;
        }
        return label;
    }

    private handleLayoutChange = (raw: string): void => {
        const layout = Number(raw);
        if (isDevicePageLayout(layout)) {
            this.props.onChange(withDevicePageLayout(this.props.value, layout));
        }
    };

    /**
     * The schematic preview of a layout: main icon, numbered slots colored by kind, the status icon grid of the chosen
     * stage (cut to the layout), status line and "i".
     *
     * @param layout the layout
     * @returns the preview
     */
    private renderPreview(layout: DevicePageLayout): React.JSX.Element {
        const kinds = DEVICE_PAGE_LAYOUTS[layout];
        const { showInfo, statusStage } = this.props.value;
        return (
            <Box
                sx={{
                    position: 'relative',
                    width: 480 * PREVIEW_SCALE,
                    height: 320 * PREVIEW_SCALE,
                    bgcolor: '#000',
                    borderRadius: 0.5,
                    overflow: 'hidden',
                    flexShrink: 0,
                }}
                data-dd={`device-page-preview-${layout}`}
            >
                {/* heading */}
                <Box
                    sx={{
                        position: 'absolute',
                        left: 65 * PREVIEW_SCALE,
                        top: 26 * PREVIEW_SCALE,
                        width: 320 * PREVIEW_SCALE,
                        height: 30 * PREVIEW_SCALE,
                        bgcolor: '#333',
                    }}
                />
                {devicePagePreviewAreas(layout, statusStage).map(area => {
                    const kind = area.slot > 0 ? kinds[area.slot - 1] : undefined;
                    let bg = '#424242';
                    let text = '';
                    if (kind) {
                        bg = KIND_COLOR[kind];
                        text = String(area.slot);
                    } else if (area.slot === PREVIEW_STATUS_CELL) {
                        bg = KIND_COLOR.status;
                    } else if (area.slot === PREVIEW_MAIN) {
                        bg = '#9e9e9e';
                    } else if (area.slot === PREVIEW_INFO) {
                        bg = showInfo ? '#0288d1' : '#212121';
                        text = 'i';
                    }
                    return (
                        <Box
                            key={`${area.slot}-${area.cell ?? ''}`}
                            sx={{
                                position: 'absolute',
                                left: area.x * PREVIEW_SCALE,
                                top: area.y * PREVIEW_SCALE,
                                width: area.w * PREVIEW_SCALE - 1,
                                height: area.h * PREVIEW_SCALE - 1,
                                bgcolor: bg,
                                color: '#fff',
                                fontSize: 10,
                                lineHeight: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 0.25,
                            }}
                        >
                            {text}
                        </Box>
                    );
                })}
            </Box>
        );
    }

    private renderLayoutChoice(): React.JSX.Element {
        const { layout } = this.props.value;
        return (
            <FormControl>
                <FormLabel sx={{ fontSize: '0.875rem' }}>{I18n.t('deviceDetailsDialog_pageLayout')}</FormLabel>
                <RadioGroup
                    row
                    value={String(layout)}
                    onChange={e => this.handleLayoutChange(e.target.value)}
                    sx={{ gap: 1 }}
                >
                    {LAYOUTS.map(l => (
                        <FormControlLabel
                            key={l}
                            value={String(l)}
                            control={<Radio size="small" />}
                            sx={{ alignItems: 'flex-start', m: 0 }}
                            label={
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 1 }}>
                                    <Typography variant="body2">{DevicePageSection.layoutLabel(l)}</Typography>
                                    {this.renderPreview(l)}
                                </Box>
                            }
                        />
                    ))}
                </RadioGroup>
            </FormControl>
        );
    }

    /**
     * The status line: empty, an own data point of the user (any state, entered as id or chosen in the object
     * browser) or a state of the device. An own data point is never marked as missing in the device.
     *
     * @returns the selection and, for an own data point, the field of its id
     */
    private renderStatus(): React.JSX.Element {
        const { deviceId, states, entries, value, onChange, socket, theme, themeType } = this.props;
        const current = value.status;
        const custom = isCustomDevicePageStatus(current);
        const options = devicePageStateOptions(deviceId, states, null, custom ? null : current);
        const selected = devicePageStatusSelectValue(current);
        const problem = options.find(o => o.id === selected)?.problem;
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControl
                    variant="standard"
                    size="small"
                    sx={{ minWidth: 0 }}
                    error={problem !== undefined}
                    data-dd="device-page-status"
                >
                    <InputLabel shrink>{I18n.t('deviceDetailsDialog_pageStatus')}</InputLabel>
                    <Select
                        value={selected}
                        displayEmpty
                        sx={{ '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                        onChange={e =>
                            onChange(
                                withDevicePageStatus(
                                    value,
                                    devicePageStatusOf(String(e.target.value), options, entries, current),
                                ),
                            )
                        }
                    >
                        <MenuItem value="">
                            <em>{I18n.t('deviceDetailsDialog_pageEmpty')}</em>
                        </MenuItem>
                        <MenuItem value={DEVICE_PAGE_CUSTOM_STATUS}>
                            {I18n.t('deviceDetailsDialog_pageStatusCustom')}
                        </MenuItem>
                        {options.map(option => (
                            <MenuItem
                                key={option.id}
                                value={option.id}
                                sx={option.problem ? { color: 'error.main' } : undefined}
                            >
                                {DevicePageSection.optionLabel(option)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {custom ? (
                    <Box data-dd="device-page-status-custom">
                        <EntitySelector
                            label={I18n.t('deviceDetailsDialog_pageStatusCustomId')}
                            value={current?.id ?? ''}
                            onChange={(id: string) => onChange(withDevicePageStatus(value, customDevicePageStatus(id)))}
                            socket={socket}
                            theme={theme}
                            themeType={themeType}
                            dialogName="devicePageStatusCustom"
                        />
                    </Box>
                ) : null}
            </Box>
        );
    }

    /**
     * @param place where the slot is stored
     * @returns what the slot shows, null = empty
     */
    private slotAt(place: SlotPlace): DevicePageSlotRef | null {
        const { value } = this.props;
        return (place.list === 'status' ? value.statusSlots?.[place.index] : value.slots[place.index]) ?? null;
    }

    /**
     * @param place where the slot is stored (a slot of the layout, an extra slot or a status icon place)
     * @param ref what the slot shows, null = empty
     */
    private setSlot(place: SlotPlace, ref: DevicePageSlotRef | null): void {
        const { value } = this.props;
        this.props.onChange(
            place.list === 'status'
                ? withDevicePageStatusSlot(value, place.index, ref)
                : withDevicePageSlot(value, place.index, ref),
        );
    }

    /**
     * @param place where the navigation slot is stored
     * @param page the target page, '' = none
     */
    private setSlotNavigation(place: SlotPlace, page: string): void {
        const { value } = this.props;
        this.props.onChange(
            place.list === 'status'
                ? withDevicePageStatusSlotNavigation(value, place.index, page)
                : withDevicePageSlotNavigation(value, place.index, page),
        );
    }

    /**
     * Opens the settings of the element of a slot: the page item dialog without the channel selection for a slot that
     * shows a name, the small dialog (icons, colors, tap, long press) for a status icon.
     *
     * @param kind the kind of the slot
     * @param place where the slot is stored
     * @param slot the slot
     */
    private openSlotSettings(kind: DevicePageSlotKind, place: SlotPlace, slot: DevicePageSlotRef): void {
        const { index } = place;
        const role = slot.custom === 'channel' ? this.state.objects[slot.id]?.role : undefined;
        const title = `${index + 1} ${DevicePageSection.kindLabel(kind)}`;
        if (kind !== 'status') {
            this.props.slotItemDialog(
                devicePageSlotDialogItem(slot),
                devicePageSlotItemOptions(kind, slot, role, title),
                (item: AdminPageItemConfig): void =>
                    this.props.onChange(
                        withDevicePageSlotLook(this.props.value, index, devicePageSlotLookOfItem(item)),
                    ),
            );
            return;
        }
        const navigationSlot = slot.custom === 'navigation';
        const dialog = place.list === 'status' ? this.statusDialogRef : this.slotDialogRef;
        dialog.current?.openWith(index, title, devicePageSlotDialogValue(slot), {
            // a navigation slot has no state: one icon and color, its tap is fixed
            longPress: !navigationSlot && devicePageSlotTakesLongPress(kind, slot, role),
            tap: !navigationSlot && devicePageSlotTakesNavigation(slot, role),
            single: navigationSlot,
        });
    }

    /**
     * The fields of a user defined slot: an own data point (any state), an alias channel (the channels with a role
     * that fits the kind of the slot, picked like in the page item dialog) or a navigation (target page; text, icon
     * and color in the settings of the element) - the navigation only where icon and name are enough.
     *
     * @param kind the kind of the slot
     * @param place where the slot is stored
     * @param slot the slot
     * @param problem why it is marked
     * @returns the fields
     */
    private renderCustomSlot(
        kind: DevicePageSlotKind,
        place: SlotPlace,
        slot: DevicePageSlotRef,
        problem: DevicePageStateProblem | undefined,
    ): React.JSX.Element {
        const { socket, theme, themeType } = this.props;
        const source = slot.custom ?? 'state';
        const sources = devicePageCustomSources(kind, slot);
        const roles = this.state.channelRoles ?? {};
        const channelIds = Object.keys(roles).filter(id => devicePageSlotAcceptsChannel(kind, roles[id]));
        return (
            <Box
                sx={{ display: 'flex', flexDirection: 'column', pl: 4 }}
                data-dd="device-page-slot-custom"
            >
                <RadioGroup
                    row
                    value={source}
                    onChange={e => {
                        if (isDevicePageCustomSource(e.target.value)) {
                            this.setSlot(place, customDevicePageSlot(e.target.value, ''));
                        }
                    }}
                >
                    <FormControlLabel
                        value="state"
                        control={<Radio size="small" />}
                        label={I18n.t('deviceDetailsDialog_slotCustomState')}
                        slotProps={{ typography: { variant: 'body2' } }}
                    />
                    <FormControlLabel
                        value="channel"
                        control={<Radio size="small" />}
                        label={I18n.t('deviceDetailsDialog_slotCustomChannel')}
                        slotProps={{ typography: { variant: 'body2' } }}
                    />
                    {sources.includes('navigation') ? (
                        <FormControlLabel
                            value="navigation"
                            control={<Radio size="small" />}
                            label={I18n.t('deviceDetailsDialog_slotCustomNavigation')}
                            slotProps={{ typography: { variant: 'body2' } }}
                        />
                    ) : null}
                </RadioGroup>
                {source === 'navigation' ? (
                    <Box
                        sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                        data-dd="device-page-slot-navigation"
                    >
                        {this.props.targetSelect(slot, page => this.setSlotNavigation(place, page))}
                    </Box>
                ) : source === 'channel' ? (
                    <EntitySelector
                        key="channel"
                        label={I18n.t('deviceDetailsDialog_slotCustomChannelId')}
                        value={slot.id}
                        onChange={(id: string) => this.setSlot(place, customDevicePageSlot('channel', id.trim()))}
                        onTransformSelectedId={(id: string) => channelIdOf(channelIds, id)}
                        socket={socket}
                        theme={theme}
                        themeType={themeType}
                        dialogName="devicePageSlotChannel"
                        filterFunc={(obj: ioBroker.Object) => isInChannels(channelIds, obj._id)}
                    />
                ) : (
                    <EntitySelector
                        key="state"
                        label={I18n.t('deviceDetailsDialog_slotCustomStateId')}
                        value={slot.id}
                        onChange={(id: string) => this.setSlot(place, customDevicePageSlot('state', id.trim()))}
                        socket={socket}
                        theme={theme}
                        themeType={themeType}
                        dialogName="devicePageSlotState"
                    />
                )}
                {problem ? (
                    <FormHelperText
                        error
                        sx={{ mt: -0.5 }}
                    >
                        {I18n.t(
                            problem === 'unfit'
                                ? 'deviceDetailsDialog_pageUnfit'
                                : source === 'channel'
                                  ? 'deviceDetailsDialog_slotChannelMissing'
                                  : 'deviceDetailsDialog_slotStateMissing',
                        )}
                    </FormHelperText>
                ) : null}
            </Box>
        );
    }

    /**
     * A slot: empty, user defined (an own data point or an alias channel) or a state of the device; with something
     * chosen the "…" button opens the settings of the element.
     *
     * @param kind the kind of the slot
     * @param place where the slot is stored
     * @returns the row
     */
    private renderSlot(kind: DevicePageSlotKind, place: SlotPlace): React.JSX.Element {
        const { deviceId, states, entries, value } = this.props;
        const slot = this.slotAt(place);
        const custom = !!slot?.custom;
        const options = devicePageStateOptions(deviceId, states, kind, custom ? null : slot);
        const selected = devicePageSlotSelectValue(slot);
        const problem = custom
            ? devicePageCustomProblem(kind, slot, slot ? this.state.objects[slot.id] : undefined)
            : options.find(o => o.id === selected)?.problem;
        // the short tap navigates to a page that cannot be chosen (a navigation slot marks it at its own field)
        const targetProblem = !!slot && slot.custom !== 'navigation' && this.props.targetProblem(slot);
        return (
            <Box
                key={`${place.list}-${value.layout}-${place.index}`}
                sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                        sx={{
                            width: 22,
                            height: 22,
                            flexShrink: 0,
                            borderRadius: 0.5,
                            bgcolor: KIND_COLOR[kind],
                            color: '#fff',
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {place.index + 1}
                    </Box>
                    <Typography
                        variant="body2"
                        sx={{ width: 140, flexShrink: 0 }}
                        noWrap
                    >
                        {DevicePageSection.kindLabel(kind)}
                    </Typography>
                    <FormControl
                        variant="standard"
                        size="small"
                        sx={{ flex: 1, minWidth: 0 }}
                        error={problem !== undefined || targetProblem}
                        data-dd="device-page-slot"
                    >
                        {/* no label per row: number and kind stand in front of the selection */}
                        <Select
                            value={selected}
                            displayEmpty
                            sx={{ '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                            onChange={e =>
                                this.setSlot(place, devicePageSlotOf(String(e.target.value), options, entries, slot))
                            }
                        >
                            <MenuItem value="">
                                <em>{I18n.t('deviceDetailsDialog_pageEmpty')}</em>
                            </MenuItem>
                            <MenuItem value={DEVICE_PAGE_CUSTOM}>{I18n.t('deviceDetailsDialog_slotCustom')}</MenuItem>
                            {options.map(option => (
                                <MenuItem
                                    key={option.id}
                                    value={option.id}
                                    sx={option.problem ? { color: 'error.main' } : undefined}
                                >
                                    {DevicePageSection.optionLabel(option)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Tooltip title={I18n.t('deviceDetailsDialog_slotSettings')}>
                        <span>
                            <IconButton
                                size="small"
                                disabled={!slot || (slot.id === '' && slot.custom !== 'navigation')}
                                color={devicePageSlotHasLook(slot) ? 'success' : 'default'}
                                onClick={() => slot && this.openSlotSettings(kind, place, slot)}
                                data-dd="device-page-slot-settings"
                                data-set={devicePageSlotHasLook(slot) ? '1' : '0'}
                            >
                                <MoreHorizIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
                {slot && custom ? this.renderCustomSlot(kind, place, slot, problem) : null}
                {targetProblem ? (
                    <FormHelperText
                        error
                        sx={{ pl: 4, mt: 0 }}
                        data-dd="device-page-slot-target-missing"
                    >
                        {I18n.t('deviceDetailsDialog_slotTargetMissing')}
                    </FormHelperText>
                ) : null}
            </Box>
        );
    }

    /**
     * The option "web panel elements" and, while it is ticked, the extra slots of the layout - each one a slot like
     * those above (same selection, same dialogs), numbered on. Unticked nothing of them is shown; what was chosen
     * for them stays stored.
     *
     * @returns the option and the extra slots
     */
    private renderWebExtras(): React.JSX.Element {
        const { value, onChange } = this.props;
        const extras = devicePageExtraSlots(value);
        return (
            <Box
                sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
                data-dd="device-page-web-extras"
            >
                <Tooltip
                    title={I18n.t('deviceDetailsDialog_pageWebExtrasHint')}
                    placement="bottom-start"
                >
                    <FormControlLabel
                        sx={{ alignSelf: 'flex-start' }}
                        control={
                            <Checkbox
                                size="small"
                                checked={value.webExtras === true}
                                onChange={e => onChange(withDevicePageWebExtras(value, e.target.checked))}
                            />
                        }
                        label={I18n.t('deviceDetailsDialog_pageWebExtras')}
                    />
                </Tooltip>
                {extras.map(extra => this.renderSlot(extra.kind, { list: 'slots', index: extra.index }))}
            </Box>
        );
    }

    /**
     * The choice of the stage of the status icon grid (layouts 1 and 3). It shows the stage the layout uses: a stored
     * stage too large for the layout is shown as its largest one, the stored value stays until another is chosen.
     *
     * @returns the selection, null for a layout without status icons
     */
    private renderStageChoice(): React.JSX.Element | null {
        const { value, onChange } = this.props;
        const stages = devicePageStatusStages(value.layout);
        if (stages.length < 2) {
            return null;
        }
        return (
            <FormControl
                variant="standard"
                size="small"
                sx={{ minWidth: 0 }}
                data-dd="device-page-stage"
            >
                <InputLabel shrink>{I18n.t('deviceDetailsDialog_pageStage')}</InputLabel>
                <Select
                    value={String(devicePageShownStage(value))}
                    onChange={e => {
                        const stage = Number(e.target.value);
                        if (isDevicePageStatusStage(stage)) {
                            onChange(withDevicePageStatusStage(value, stage));
                        }
                    }}
                >
                    {stages.map(stage => (
                        <MenuItem
                            key={stage}
                            value={String(stage)}
                        >
                            {I18n.t(`deviceDetailsDialog_pageStage${value.layout}_${stage}`)}
                        </MenuItem>
                    ))}
                </Select>
                <FormHelperText>{I18n.t('deviceDetailsDialog_pageStageHint')}</FormHelperText>
            </FormControl>
        );
    }

    /**
     * The status icon places: as many as the shown stage holds, in the order of the list (the panel moves the filled
     * ones up without gaps). The places beyond stay stored and come back with a larger stage.
     *
     * @returns the places, null when the stage shows none
     */
    private renderStatusSlots(): React.JSX.Element | null {
        const count = devicePageStatusPlaceCount(this.props.value);
        if (count === 0) {
            return null;
        }
        return (
            <Box
                sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
                data-dd="device-page-status-slots"
            >
                <FormLabel sx={{ fontSize: '0.875rem' }}>{I18n.t('deviceDetailsDialog_pageStatusSlots')}</FormLabel>
                {Array.from({ length: count }, (_v, index) => this.renderSlot('status', { list: 'status', index }))}
                <FormHelperText sx={{ mt: 0 }}>{I18n.t('deviceDetailsDialog_pageStatusIconsHint')}</FormHelperText>
            </Box>
        );
    }

    private renderSlots(): React.JSX.Element {
        const { value, onChange, socket, theme, themeType, iconSelect, targetSelect, adapterName, instance } =
            this.props;
        const kinds = DEVICE_PAGE_LAYOUTS[value.layout];
        const dialogProps = { socket, theme, themeType, adapterName, instance, iconSelect, targetSelect };
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {this.renderStageChoice()}
                <FormLabel sx={{ fontSize: '0.875rem' }}>{I18n.t('deviceDetailsDialog_pageSlots')}</FormLabel>
                {/* the slots the stage covers stay stored, they are only not shown */}
                {devicePageVisibleSlotIndexes(value).map(index =>
                    this.renderSlot(kinds[index], { list: 'slots', index }),
                )}
                {this.renderStatusSlots()}
                {this.renderWebExtras()}
                <DevicePageSlotDialog
                    ref={this.slotDialogRef}
                    {...dialogProps}
                    onApply={(index, look) => onChange(withDevicePageSlotLook(this.props.value, index, look))}
                />
                <DevicePageSlotDialog
                    ref={this.statusDialogRef}
                    {...dialogProps}
                    onApply={(index, look) => onChange(withDevicePageStatusSlotLook(this.props.value, index, look))}
                />
            </Box>
        );
    }

    render(): React.JSX.Element {
        const { value, onChange, iconSelector } = this.props;
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    pl: 1,
                    borderLeft: 2,
                    borderColor: 'divider',
                }}
                data-dd="device-page-section"
            >
                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    {I18n.t('deviceDetailsDialog_pageHint')}
                </Typography>
                {this.renderLayoutChoice()}
                {iconSelector}
                {this.renderStatus()}
                {this.renderSlots()}
                <FormControl>
                    <FormControlLabel
                        control={
                            <Checkbox
                                size="small"
                                checked={value.showInfo}
                                onChange={e => onChange({ ...value, showInfo: e.target.checked })}
                            />
                        }
                        label={I18n.t('deviceDetailsDialog_pageShowInfo')}
                    />
                    <FormHelperText sx={{ mt: 0 }}>{I18n.t('deviceDetailsDialog_pageShowInfoHint')}</FormHelperText>
                </FormControl>
            </Box>
        );
    }
}
