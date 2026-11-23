/**
 * The device page of a device item (doc/ideas/device-details/README.md, section Geräteseite): layout with a schematic
 * preview, big icon, status line, the slots of the layout and the "i" icon. The states come from the answer of the
 * adapter (`getDeviceDetails`); without it the saved states stay as they are.
 */
import React from 'react';
import {
    Box,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormHelperText,
    FormLabel,
    InputLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    Typography,
} from '@mui/material';
import { I18n } from '@iobroker/gui-components';
import {
    DEVICE_PAGE_LAYOUTS,
    deviceDetailNameKey,
    isDevicePageLayout,
    type DeviceDetailEntryConfig,
    type DevicePageConfig,
    type DevicePageLayout,
    type DevicePageSlotKind,
    type DevicePageStateRef,
    type DeviceStateInfo,
} from '../../../src/lib/types/deviceDetails';
import {
    devicePageRefOf,
    devicePageStateOptions,
    withDevicePageLayout,
    withDevicePageSlot,
    withDevicePageStatus,
    type DevicePageStateOption,
} from '../devicePageConfig';

export interface DevicePageSectionProps {
    deviceId: string;
    /** the ticked rows of the detail page */
    entries: DeviceDetailEntryConfig[];
    value: DevicePageConfig;
    /** the states of the device, null = no answer of the adapter */
    states: DeviceStateInfo[] | null;
    onChange: (value: DevicePageConfig) => void;
    /** the icon selector of the big icon, rendered by the page item dialog */
    iconSelector: React.ReactNode;
}

/** an area of the schematic preview in display pixels (480 × 320, doc/ideas/device-details/device-page-hmi.md) */
interface PreviewArea {
    x: number;
    y: number;
    w: number;
    h: number;
    /** slot number (1 …), 0 = main icon, -1 = status line, -2 = "i" */
    slot: number;
}

const MAIN = 0;
const STATUS = -1;
const INFO = -2;
const COMMON_AREAS: PreviewArea[] = [
    { x: 10, y: 289, w: 390, h: 30, slot: STATUS },
    { x: 404, y: 288, w: 36, h: 32, slot: INFO },
];

/** the areas of every layout (geometry of the HMI pages cardDevice1-3) */
const PREVIEW_AREAS: Readonly<Record<DevicePageLayout, PreviewArea[]>> = {
    1: [
        { x: 10, y: 68, w: 110, h: 114, slot: MAIN },
        { x: 126, y: 76, w: 314, h: 34, slot: 1 },
        { x: 126, y: 120, w: 314, h: 34, slot: 2 },
        { x: 10, y: 190, w: 104, h: 80, slot: 3 },
        { x: 118, y: 190, w: 104, h: 80, slot: 4 },
        { x: 226, y: 190, w: 104, h: 80, slot: 5 },
        { x: 334, y: 190, w: 104, h: 80, slot: 6 },
        ...COMMON_AREAS,
    ],
    2: [
        { x: 10, y: 67, w: 96, h: 110, slot: MAIN },
        { x: 110, y: 67, w: 226, h: 110, slot: 1 },
        { x: 10, y: 179, w: 429, h: 42, slot: 2 },
        { x: 10, y: 226, w: 140, h: 51, slot: 3 },
        { x: 154, y: 226, w: 140, h: 51, slot: 4 },
        { x: 298, y: 226, w: 141, h: 51, slot: 5 },
        { x: 340, y: 67, w: 100, h: 78, slot: 6 },
        ...COMMON_AREAS,
    ],
    3: [
        { x: 10, y: 67, w: 100, h: 110, slot: MAIN },
        { x: 114, y: 67, w: 161, h: 51, slot: 1 },
        { x: 277, y: 67, w: 161, h: 51, slot: 2 },
        { x: 114, y: 119, w: 161, h: 51, slot: 3 },
        { x: 277, y: 119, w: 161, h: 51, slot: 4 },
        { x: 114, y: 171, w: 161, h: 51, slot: 5 },
        { x: 277, y: 171, w: 161, h: 51, slot: 6 },
        { x: 10, y: 228, w: 213, h: 50, slot: 7 },
        { x: 226, y: 228, w: 213, h: 50, slot: 8 },
        ...COMMON_AREAS,
    ],
};

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
};

export default class DevicePageSection extends React.Component<DevicePageSectionProps> {
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
        const { showInfo } = this.props.value;
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
                {PREVIEW_AREAS[layout].map(area => {
                    const kind = area.slot > 0 ? kinds[area.slot - 1] : undefined;
                    let bg = '#424242';
                    let text = '';
                    if (kind) {
                        bg = KIND_COLOR[kind];
                        text = String(area.slot);
                    } else if (area.slot === MAIN) {
                        bg = '#9e9e9e';
                    } else if (area.slot === INFO) {
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
     * A selection of a state of the device.
     *
     * @param label label of the field
     * @param kind kind of the slot, null = status line (all states)
     * @param current the saved state
     * @param onPick the chosen state, null = empty
     * @param dataDd test marker
     * @returns the field
     */
    private renderStateSelect(
        label: string,
        kind: DevicePageSlotKind | null,
        current: DevicePageStateRef | null | undefined,
        onPick: (ref: DevicePageStateRef | null) => void,
        dataDd: string,
    ): React.JSX.Element {
        const { deviceId, states, entries } = this.props;
        const options = devicePageStateOptions(deviceId, states, kind, current);
        const value = current?.id ?? '';
        const problem = options.find(o => o.id === value)?.problem;
        return (
            <FormControl
                variant="standard"
                size="small"
                sx={{ flex: 1, minWidth: 0 }}
                error={problem !== undefined}
                data-dd={dataDd}
            >
                <InputLabel shrink>{label}</InputLabel>
                <Select
                    value={value}
                    displayEmpty
                    sx={{ '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                    onChange={e => onPick(devicePageRefOf(String(e.target.value), options, entries, current))}
                >
                    <MenuItem value="">
                        <em>{I18n.t('deviceDetailsDialog_pageEmpty')}</em>
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
        );
    }

    private renderSlots(): React.JSX.Element {
        const { value, onChange } = this.props;
        const kinds = DEVICE_PAGE_LAYOUTS[value.layout];
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormLabel sx={{ fontSize: '0.875rem' }}>{I18n.t('deviceDetailsDialog_pageSlots')}</FormLabel>
                {kinds.map((kind, index) => (
                    <Box
                        key={`${value.layout}-${index}`}
                        sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}
                    >
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
                                mb: 0.5,
                            }}
                        >
                            {index + 1}
                        </Box>
                        <Typography
                            variant="body2"
                            sx={{ width: 140, flexShrink: 0, mb: 0.5 }}
                            noWrap
                        >
                            {DevicePageSection.kindLabel(kind)}
                        </Typography>
                        {this.renderStateSelect(
                            I18n.t('deviceDetailsDialog_state'),
                            kind,
                            value.slots[index],
                            ref => onChange(withDevicePageSlot(value, index, ref)),
                            'device-page-slot',
                        )}
                    </Box>
                ))}
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
                {this.renderStateSelect(
                    I18n.t('deviceDetailsDialog_pageStatus'),
                    null,
                    value.status,
                    ref => onChange(withDevicePageStatus(value, ref)),
                    'device-page-status',
                )}
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
