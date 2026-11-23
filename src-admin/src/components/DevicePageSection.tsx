/**
 * The device page of a device item (doc/ideas/device-details/README.md, section Geräteseite): layout with a schematic
 * preview, big icon, status line, the slots of the layout and the "i" icon. The states come from the answer of the
 * adapter (`getDeviceDetails`); without it the saved states stay as they are. A slot shows a state of the device or,
 * user defined, any data point or an alias channel; its "…" button opens the settings of the element
 * (DevicePageSlotDialog).
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
import { CHANNEL_ROLES_LIST } from '../../../src/lib/types/adminShareConfig';
import {
    DEVICE_PAGE_LAYOUTS,
    deviceDetailNameKey,
    devicePageHasStatusIcons,
    devicePageSlotAcceptsChannel,
    devicePageSlotHasLook,
    devicePageSlotTakesLongPress,
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
    customDevicePageSlot,
    devicePageCustomProblem,
    devicePagePreviewAreas,
    devicePageSlotDialogValue,
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
    type DevicePageCustomObject,
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
}

interface DevicePageSectionState {
    /** the alias channels with a role the adapter knows (id -> role), null = not read yet */
    channelRoles: ChannelRoleMap | null;
    /** the objects behind the user defined slots by id: null = it does not exist, missing = not read yet */
    objects: Record<string, DevicePageCustomObject | null>;
}

const LAYOUTS: readonly DevicePageLayout[] = [1, 2, 3];

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
        for (const slot of this.props.value.slots) {
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
     * The schematic preview of a layout: main icon, numbered slots colored by kind, status line and "i".
     *
     * @param layout the layout
     * @returns the preview
     */
    private renderPreview(layout: DevicePageLayout): React.JSX.Element {
        const kinds = DEVICE_PAGE_LAYOUTS[layout];
        const { showInfo, slots } = this.props.value;
        // the status grid only when one of its slots is filled - the slots stay by position on a layout change
        const withStatusIcons = devicePageHasStatusIcons(layout, slots);
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
                {devicePagePreviewAreas(layout, withStatusIcons).map(area => {
                    const kind = area.slot > 0 ? kinds[area.slot - 1] : undefined;
                    let bg = '#424242';
                    let text = '';
                    if (kind) {
                        bg = KIND_COLOR[kind];
                        text = String(area.slot);
                    } else if (area.slot === PREVIEW_MAIN) {
                        bg = '#9e9e9e';
                    } else if (area.slot === PREVIEW_INFO) {
                        bg = showInfo ? '#0288d1' : '#212121';
                        text = 'i';
                    }
                    return (
                        <Box
                            key={`${area.slot}`}
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
     * @param index index of the slot (0 = slot 1)
     * @param ref what the slot shows, null = empty
     */
    private setSlot(index: number, ref: DevicePageSlotRef | null): void {
        this.props.onChange(withDevicePageSlot(this.props.value, index, ref));
    }

    /**
     * Opens the settings of the element of a slot.
     *
     * @param kind the kind of the slot
     * @param index index of the slot (0 = slot 1)
     * @param slot the slot
     */
    private openSlotSettings(kind: DevicePageSlotKind, index: number, slot: DevicePageSlotRef): void {
        const role = slot.custom === 'channel' ? this.state.objects[slot.id]?.role : undefined;
        this.slotDialogRef.current?.openWith(
            index,
            `${index + 1} ${DevicePageSection.kindLabel(kind)}`,
            devicePageSlotDialogValue(slot),
            devicePageSlotTakesLongPress(kind, slot, role),
        );
    }

    /**
     * The fields of a user defined slot: an own data point (any state) or an alias channel (the channels with a role
     * that fits the kind of the slot, picked like in the page item dialog).
     *
     * @param kind the kind of the slot
     * @param index index of the slot (0 = slot 1)
     * @param slot the slot
     * @param problem why it is marked
     * @returns the fields
     */
    private renderCustomSlot(
        kind: DevicePageSlotKind,
        index: number,
        slot: DevicePageSlotRef,
        problem: DevicePageStateProblem | undefined,
    ): React.JSX.Element {
        const { socket, theme, themeType } = this.props;
        const source = slot.custom === 'channel' ? 'channel' : 'state';
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
                    onChange={e =>
                        this.setSlot(
                            index,
                            customDevicePageSlot(e.target.value === 'channel' ? 'channel' : 'state', ''),
                        )
                    }
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
                </RadioGroup>
                {source === 'channel' ? (
                    <EntitySelector
                        key="channel"
                        label={I18n.t('deviceDetailsDialog_slotCustomChannelId')}
                        value={slot.id}
                        onChange={(id: string) => this.setSlot(index, customDevicePageSlot('channel', id.trim()))}
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
                        onChange={(id: string) => this.setSlot(index, customDevicePageSlot('state', id.trim()))}
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
     * @param index index of the slot (0 = slot 1)
     * @returns the row
     */
    private renderSlot(kind: DevicePageSlotKind, index: number): React.JSX.Element {
        const { deviceId, states, entries, value } = this.props;
        const slot = value.slots[index] ?? null;
        const custom = !!slot?.custom;
        const options = devicePageStateOptions(deviceId, states, kind, custom ? null : slot);
        const selected = devicePageSlotSelectValue(slot);
        const problem = custom
            ? devicePageCustomProblem(kind, slot, slot ? this.state.objects[slot.id] : undefined)
            : options.find(o => o.id === selected)?.problem;
        return (
            <Box
                key={`${value.layout}-${index}`}
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
                        {index + 1}
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
                        error={problem !== undefined}
                        data-dd="device-page-slot"
                    >
                        {/* no label per row: number and kind stand in front of the selection */}
                        <Select
                            value={selected}
                            displayEmpty
                            sx={{ '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                            onChange={e =>
                                this.setSlot(index, devicePageSlotOf(String(e.target.value), options, entries, slot))
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
                                disabled={!slot || slot.id === ''}
                                color={devicePageSlotHasLook(slot) ? 'success' : 'default'}
                                onClick={() => slot && this.openSlotSettings(kind, index, slot)}
                                data-dd="device-page-slot-settings"
                                data-set={devicePageSlotHasLook(slot) ? '1' : '0'}
                            >
                                <MoreHorizIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
                {slot && custom ? this.renderCustomSlot(kind, index, slot, problem) : null}
            </Box>
        );
    }

    private renderSlots(): React.JSX.Element {
        const { value, onChange, socket, theme, themeType, iconSelect, adapterName, instance } = this.props;
        const kinds = DEVICE_PAGE_LAYOUTS[value.layout];
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <FormLabel sx={{ fontSize: '0.875rem' }}>{I18n.t('deviceDetailsDialog_pageSlots')}</FormLabel>
                {kinds.map((kind, index) => this.renderSlot(kind, index))}
                {kinds.includes('status') ? (
                    <FormHelperText sx={{ mt: 0 }}>{I18n.t('deviceDetailsDialog_pageStatusIconsHint')}</FormHelperText>
                ) : null}
                <DevicePageSlotDialog
                    ref={this.slotDialogRef}
                    socket={socket}
                    theme={theme}
                    themeType={themeType}
                    adapterName={adapterName}
                    instance={instance}
                    iconSelect={iconSelect}
                    onApply={(index, look) => onChange(withDevicePageSlotLook(this.props.value, index, look))}
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
