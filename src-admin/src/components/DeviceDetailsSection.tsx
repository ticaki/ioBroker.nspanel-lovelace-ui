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
import { ADAPTER_NAME } from '../../../src/lib/types/adminShareConfig';
import {
    buildDeviceDetailRows,
    deviceDetailEntriesOfRows,
    deviceDetailMaskOf,
    deviceDetailEntryOfState,
    deviceDetailsAdapter,
    deviceShortPressOf,
    isDeviceShortPressState,
    SENDTO_GET_DEVICE_DETAILS_COMMAND,
    type DeviceDetailEntryConfig,
    type DeviceDetailsConfig,
    type DeviceDetailsInfo,
    type DeviceDetailsLearned,
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
    /** the learned ticks per adapter */
    learned: DeviceDetailsLearned;
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
    /** the device the saved entries belong to; another device gets the learned ticks */
    private entriesDeviceId: string;
    private unmounted = false;

    constructor(props: DeviceDetailsSectionProps) {
        super(props);
        this.entriesDeviceId = props.value.deviceId;
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
     * Asks the adapter for the device. A device the entries do not belong to gets the learned ticks and - with the
     * short tap `state` - the state of the entry `switch` of the mask; a device without such a state gets the short
     * tap `none`. No answer (adapter offline) changes nothing.
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
        if (this.unmounted) {
            return;
        }
        this.setState({ checking: false });
        if (id !== this.props.value.deviceId.trim() || !isDeviceDetailsInfo(answer)) {
            return;
        }
        this.setState({ info: { ...answer, id } });
        if (!answer.ok) {
            this.props.onChange(this.props.value, answer.error ?? 'notFound');
            return;
        }
        let value = this.props.value;
        const otherDevice = this.entriesDeviceId !== id;
        if (otherDevice) {
            this.entriesDeviceId = id;
            const learned = this.props.learned[deviceDetailsAdapter(id)];
            const rows = buildDeviceDetailRows(id, answer.states, undefined, learned);
            value = { ...value, deviceId: id, entries: deviceDetailEntriesOfRows(rows) };
        }
        this.props.onChange(value, undefined);
        if (deviceShortPressOf(value) === 'state' && !this.props.stateId.startsWith(`${id}.`)) {
            const mask = deviceDetailMaskOf(id);
            const suggested = answer.states.find(
                s => isDeviceShortPressState(s) && s.read && deviceDetailEntryOfState(mask, s)?.key === 'switch',
            );
            if (suggested) {
                this.props.onStateChange(suggested.id);
            } else if (otherDevice) {
                this.props.onShortPressChange('none');
            } else {
                this.props.onStateChange('');
            }
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
        const rows = buildDeviceDetailRows(value.deviceId, info.states, value.entries, undefined);
        this.filterDialogRef.current?.openWith(value.deviceId, info.name, info.states, rows);
    };

    private handleFilterSave = (entries: DeviceDetailEntryConfig[]): void => {
        this.entriesDeviceId = this.props.value.deviceId;
        this.props.onChange({ ...this.props.value, entries }, undefined);
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
        const rest = (id: string): string =>
            id.startsWith(`${value.deviceId}.`) ? id.slice(value.deviceId.length + 1) : id;
        return (
            <FormControl
                variant="standard"
                size="small"
                sx={{ minWidth: 260 }}
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
                        {I18n.t('deviceDetailsDialog_longPressHint')}
                    </Typography>
                </Box>
                <DeviceDetailsFilterDialog
                    ref={this.filterDialogRef}
                    onSave={this.handleFilterSave}
                />
            </Box>
        );
    }
}
