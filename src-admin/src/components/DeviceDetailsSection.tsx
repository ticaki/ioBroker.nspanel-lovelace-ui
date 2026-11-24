/**
 * The page item kind "device with details" (doc/ideas/device-details/README.md): the device (an object of type device
 * or channel), what a short tap does - a writable boolean state of the device switched on/off or the popup of an alias
 * channel - and the button of the filter list. The states of the device come from the adapter (sendTo
 * `getDeviceDetails`).
 *
 * A new item (or another device) gets its ticks from what the user ticked last at the same adapter (native
 * `deviceDetailsLearned`), without that the entries of the mask.
 */
import React from 'react';
import {
    Box,
    Button,
    CircularProgress,
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
import FilterListIcon from '@mui/icons-material/FilterList';
import { I18n, type AdminConnection, type IobTheme, type ThemeType } from '@iobroker/gui-components';
import { EntitySelector } from './EntitySelector';
import DeviceDetailsFilterDialog from './DeviceDetailsFilterDialog';
import DevicePageSection from './DevicePageSection';
import {
    isLongPressTarget,
    longPressTargetOf,
    type DevicePageSlotItemOptions,
    type LongPressTarget,
} from '../devicePageConfig';
import { ADAPTER_NAME, type AdminPageItemConfig } from '../../../src/lib/types/adminShareConfig';
import {
    buildDeviceDetailRows,
    deviceShortPressOf,
    isDeviceShortPressState,
    SENDTO_GET_DEVICE_DETAILS_COMMAND,
    type DeviceDetailEntryConfig,
    type DeviceDetailsConfig,
    type DeviceDetailsInfo,
    type DevicePageConfig,
    type DevicePageSlotRef,
    type DeviceSelectionError,
    type DeviceShortPress,
} from '../../../src/lib/types/deviceDetails';

/** errors that make a device unusable - a missing device (deleted, adapter offline) does not block the save */
const BLOCKING_ERRORS: readonly DeviceSelectionError[] = ['type', 'root', 'info', 'level'];

/**
 * @param error the reason of the adapter
 * @returns true when the item cannot be saved with this device
 */
export function isBlockingDeviceError(error: DeviceSelectionError | undefined): boolean {
    return !!error && BLOCKING_ERRORS.includes(error);
}

export interface DeviceDetailsSectionProps {
    socket: AdminConnection;
    theme: IobTheme;
    themeType: ThemeType;
    instance: number | string;
    /** the device configuration of the item */
    value: DeviceDetailsConfig;
    /** short tap `state`: the chosen state of the device ('' = none) */
    stateId: string;
    onStateChange: (id: string) => void;
    onShortPressChange: (shortPress: DeviceShortPress) => void;
    /** short tap `popup`: the selector of the alias channel, rendered by the page item dialog */
    popupChannelSelector: React.ReactNode;
    /** short tap `navigation`: the selector of the target page, rendered by the page item dialog */
    navigationTargetSelector: React.ReactNode;
    /**
     * the configuration or the verdict of the adapter changed
     *
     * @param value the new configuration
     * @param error the reason of the adapter, undefined = ok or no answer
     */
    onChange: (value: DeviceDetailsConfig, error: DeviceSelectionError | undefined) => void;
    /**
     * the adapter answered for a device - also after this section was unmounted (the kind of the item was switched
     * meanwhile): the dialog puts the answer into the fields of the device wherever they are now (deviceAnswer.ts)
     *
     * @param id the device the answer is for (trimmed)
     * @param answer the answer
     */
    onAnswer: (id: string, answer: DeviceDetailsInfo) => void;
    /**
     * the filter list was saved: the entries belong to the device now
     *
     * @param entries the ticked rows in their order
     */
    onEntriesChange: (entries: DeviceDetailEntryConfig[]) => void;
    /**
     * what the long press opens: the detail page or the device page
     *
     * @param target the new target
     */
    onLongPressTargetChange: (target: LongPressTarget) => void;
    /**
     * the device page was changed
     *
     * @param devicePage the new device page
     */
    onDevicePageChange: (devicePage: DevicePageConfig) => void;
    /** the icon selector of the big icon of the device page, rendered by the page item dialog */
    devicePageIconSelector: React.ReactNode;
    /**
     * an icon selector for the settings of a slot of the device page, rendered by the page item dialog
     *
     * @param label translation key of the label
     * @param value the chosen icon, '' = none
     * @param onChange the picked icon
     */
    devicePageIconSelect: (label: string, value: string, onChange: (icon: string) => void) => React.ReactNode;
    /**
     * the selector of the target page of a slot of the device page, rendered by the page item dialog
     *
     * @param slot the slot
     * @param onChange the chosen page, '' = none
     */
    devicePageTargetSelect: (slot: DevicePageSlotRef, onChange: (page: string) => void) => React.ReactNode;
    /**
     * @param slot a slot of the device page
     * @returns true when its target page is not among the pages that can be chosen
     */
    devicePageTargetProblem: (slot: DevicePageSlotRef | null) => boolean;
    /**
     * opens the page item dialog for the settings of a slot of the device page (without the channel selection)
     *
     * @param item the settings of the slot as page item
     * @param options what the dialog offers for the slot
     * @param onApply the saved settings
     */
    devicePageSlotItemDialog: (
        item: AdminPageItemConfig,
        options: DevicePageSlotItemOptions,
        onApply: (saved: AdminPageItemConfig) => void,
    ) => void;
    /** for the color theme in the color dialog of a slot of the device page */
    adapterName?: string;
}

interface DeviceDetailsSectionState {
    /** the answer of the adapter for the device of {@link DeviceDetailsSectionProps.value} */
    info: (DeviceDetailsInfo & { id: string }) | null;
    checking: boolean;
}

/**
 * the type guard of the answer of the adapter
 *
 * @param value the answer
 * @returns true for an answer of `getDeviceDetails`
 */
function isDeviceDetailsInfo(value: unknown): value is DeviceDetailsInfo {
    return (
        !!value &&
        typeof value === 'object' &&
        'ok' in value &&
        typeof value.ok === 'boolean' &&
        'states' in value &&
        Array.isArray(value.states)
    );
}

export default class DeviceDetailsSection extends React.Component<
    DeviceDetailsSectionProps,
    DeviceDetailsSectionState
> {
    private filterDialogRef = React.createRef<DeviceDetailsFilterDialog>();
    private unmounted = false;

    constructor(props: DeviceDetailsSectionProps) {
        super(props);
        this.state = { info: null, checking: false };
    }

    componentDidMount(): void {
        if (this.props.value.deviceId) {
            void this.loadInfo(this.props.value.deviceId);
        }
    }

    componentWillUnmount(): void {
        this.unmounted = true;
    }

    /**
     * Asks the adapter for the device. The dialog applies the answer ({@link DeviceDetailsSectionProps.onAnswer}) -
     * also when it comes after the short tap or the kind of the item was switched. No answer (adapter offline) changes
     * nothing.
     *
     * @param rawId id of the device
     */
    private async loadInfo(rawId: string): Promise<void> {
        const id = rawId.trim();
        if (!id) {
            this.setState({ info: null });
            return;
        }
        this.setState({ checking: true });
        let answer: unknown = undefined;
        try {
            answer = await this.props.socket.sendTo<unknown>(
                `${ADAPTER_NAME}.${this.props.instance}`,
                SENDTO_GET_DEVICE_DETAILS_COMMAND,
                { id },
            );
        } catch {
            answer = undefined;
        }
        if (isDeviceDetailsInfo(answer)) {
            this.props.onAnswer(id, answer);
        }
        if (this.unmounted) {
            return;
        }
        this.setState({ checking: false });
        if (id === this.props.value.deviceId.trim() && isDeviceDetailsInfo(answer)) {
            this.setState({ info: { ...answer, id } });
        }
    }

    private handleIdChange = (id: string): void => {
        this.setState({ info: null });
        this.props.onChange({ ...this.props.value, deviceId: id }, undefined);
    };

    private handleIdCommit = (id: string): void => {
        void this.loadInfo(id);
    };

    private openFilter = (): void => {
        const { info } = this.state;
        const { value } = this.props;
        if (!info?.ok) {
            return;
        }
        // the entries of the item are what it shows, also none: an empty list ticks nothing (no mask defaults) - the
        // learned ticks or the mask came into the entries with the answer of the adapter already (deviceAnswer)
        const rows = buildDeviceDetailRows(value.deviceId, info.states, value.entries, []);
        this.filterDialogRef.current?.openWith(value.deviceId, info.name, info.states, rows);
    };

    private handleFilterSave = (entries: DeviceDetailEntryConfig[]): void => {
        this.props.onEntriesChange(entries);
    };

    /** the line below the device: checking, the reason it cannot be chosen, or the number of ticked rows */
    private renderStatus(): React.JSX.Element | null {
        const { info, checking } = this.state;
        const { value } = this.props;
        if (checking) {
            return <CircularProgress size={16} />;
        }
        if (!value.deviceId) {
            return (
                <Typography
                    variant="caption"
                    color="warning.main"
                >
                    {I18n.t('deviceDetailsDialog_noDevice')}
                </Typography>
            );
        }
        if (!info) {
            return null;
        }
        if (!info.ok) {
            return (
                <Typography
                    variant="caption"
                    color={isBlockingDeviceError(info.error) ? 'error' : 'warning.main'}
                >
                    {I18n.t(`deviceDetailsDialog_error_${info.error ?? 'notFound'}`)}
                </Typography>
            );
        }
        const count = value.entries.length;
        return (
            <Typography
                variant="caption"
                color="text.secondary"
            >
                {I18n.t(count === 1 ? 'deviceDetailsDialog_statusOne' : 'deviceDetailsDialog_status')
                    .replace('%s', info.name)
                    .replace('%d', String(count))}
            </Typography>
        );
    }

    /** short tap `state`: the writable boolean states of the device, buttons (`read: false`) marked */
    private renderStateSelect(): React.JSX.Element {
        const { stateId, value } = this.props;
        const states = this.state.info?.ok ? this.state.info.states.filter(isDeviceShortPressState) : [];
        const known = states.some(s => s.id === stateId);
        // the item cannot be applied without a state - say why, once the adapter has answered
        const stateMissing = stateId === '' && !this.state.checking;
        const rest = (id: string): string =>
            id.startsWith(`${value.deviceId}.`) ? id.slice(value.deviceId.length + 1) : id;
        return (
            <FormControl
                variant="standard"
                size="small"
                sx={{ minWidth: 260 }}
                error={stateMissing}
            >
                <InputLabel>{I18n.t('deviceDetailsDialog_shortStateId')}</InputLabel>
                <Select
                    value={stateId}
                    onChange={e => this.props.onStateChange(String(e.target.value))}
                >
                    <MenuItem value="">
                        <em>{I18n.t('deviceDetailsDialog_noSwitchState')}</em>
                    </MenuItem>
                    {/* the saved state stays selectable while the adapter has not answered */}
                    {stateId && !known && <MenuItem value={stateId}>{rest(stateId)}</MenuItem>}
                    {states.map(s => (
                        <MenuItem
                            key={s.id}
                            value={s.id}
                        >
                            {s.read ? rest(s.id) : `${rest(s.id)} (${I18n.t('deviceDetailsDialog_pushButton')})`}
                        </MenuItem>
                    ))}
                </Select>
                {stateMissing && <FormHelperText>{I18n.t('deviceDetailsDialog_stateRequired')}</FormHelperText>}
            </FormControl>
        );
    }

    render(): React.JSX.Element {
        const { value, socket, theme, themeType } = this.props;
        const { info } = this.state;
        const shortPress = deviceShortPressOf(value);
        return (
            <Box
                sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                data-dd="device-section"
            >
                <EntitySelector
                    label={I18n.t('deviceDetailsDialog_device')}
                    value={value.deviceId}
                    onChange={this.handleIdChange}
                    onCommit={this.handleIdCommit}
                    socket={socket}
                    theme={theme}
                    themeType={themeType}
                    dialogName="deviceDetailsDevice"
                    types={['device', 'channel']}
                    filterFunc={(obj: ioBroker.Object) => obj.type === 'device' || obj.type === 'channel'}
                />
                {this.renderStatus()}
                <FormControl>
                    <FormLabel sx={{ fontSize: '0.875rem' }}>{I18n.t('deviceDetailsDialog_shortPress')}</FormLabel>
                    <RadioGroup
                        row
                        value={shortPress}
                        onChange={e =>
                            this.props.onShortPressChange(deviceShortPressOf({ shortPress: e.target.value }))
                        }
                    >
                        <FormControlLabel
                            value="state"
                            control={<Radio size="small" />}
                            label={I18n.t('deviceDetailsDialog_shortState')}
                        />
                        <FormControlLabel
                            value="none"
                            control={<Radio size="small" />}
                            label={I18n.t('deviceDetailsDialog_shortNone')}
                        />
                        <FormControlLabel
                            value="navigation"
                            control={<Radio size="small" />}
                            label={I18n.t('deviceDetailsDialog_shortNavigation')}
                        />
                        <FormControlLabel
                            value="popup"
                            control={<Radio size="small" />}
                            label={I18n.t('deviceDetailsDialog_shortPopup')}
                        />
                        <FormControlLabel
                            value="devicePage"
                            // only with a device page: it is what the tap opens
                            disabled={!value.devicePage}
                            control={<Radio size="small" />}
                            label={I18n.t('deviceDetailsDialog_shortDevicePage')}
                        />
                    </RadioGroup>
                </FormControl>
                {shortPress === 'state' && this.renderStateSelect()}
                {shortPress === 'navigation' && this.props.navigationTargetSelector}
                {shortPress === 'popup' && this.props.popupChannelSelector}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FilterListIcon />}
                        disabled={!info?.ok}
                        color={value.entries.length > 0 ? 'success' : 'primary'}
                        onClick={this.openFilter}
                    >
                        {I18n.t('deviceDetailsDialog_filterList')}
                    </Button>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ whiteSpace: 'pre-line' }}
                    >
                        {I18n.t(
                            longPressTargetOf(value) === 'devicePage'
                                ? 'deviceDetailsDialog_longPressHintDevicePage'
                                : 'deviceDetailsDialog_longPressHint',
                        )}
                    </Typography>
                </Box>
                <FormControl>
                    <FormLabel sx={{ fontSize: '0.875rem' }}>{I18n.t('deviceDetailsDialog_longPress')}</FormLabel>
                    <RadioGroup
                        row
                        value={longPressTargetOf(value)}
                        onChange={e => {
                            if (isLongPressTarget(e.target.value)) {
                                this.props.onLongPressTargetChange(e.target.value);
                            }
                        }}
                    >
                        <FormControlLabel
                            value="details"
                            control={<Radio size="small" />}
                            label={I18n.t('deviceDetailsDialog_longDetails')}
                        />
                        <FormControlLabel
                            value="devicePage"
                            control={<Radio size="small" />}
                            label={I18n.t('deviceDetailsDialog_longDevicePage')}
                        />
                    </RadioGroup>
                </FormControl>
                {value.devicePage && (
                    <DevicePageSection
                        deviceId={value.deviceId.trim()}
                        entries={value.entries}
                        value={value.devicePage}
                        states={info?.ok ? info.states : null}
                        onChange={this.props.onDevicePageChange}
                        socket={socket}
                        theme={theme}
                        themeType={themeType}
                        iconSelector={this.props.devicePageIconSelector}
                        iconSelect={this.props.devicePageIconSelect}
                        targetSelect={this.props.devicePageTargetSelect}
                        targetProblem={this.props.devicePageTargetProblem}
                        slotItemDialog={this.props.devicePageSlotItemDialog}
                        adapterName={this.props.adapterName}
                        instance={Number(this.props.instance) || 0}
                    />
                )}
                <DeviceDetailsFilterDialog
                    ref={this.filterDialogRef}
                    onSave={this.handleFilterSave}
                />
            </Box>
        );
    }
}
