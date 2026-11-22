import React from 'react';
import { Alert, Box, CircularProgress, MenuItem, TextField } from '@mui/material';
import { I18n } from '@iobroker/gui-components';
import type { AlexaTimerConfig } from '../../../src/lib/types/adminShareConfig';
import {
    loadAlexaAlarms,
    loadAlexaInstances,
    loadAlexaTimerDevices,
    type AlexaAlarmInfo,
    type AlexaDeviceInfo,
    type AlexaInstanceInfo,
    type AlexaSocket,
} from '../alexaTimerDevices';

type AlexaTimerSelectProps = {
    /** socket of the admin */
    socket: AlexaSocket | undefined;
    value: AlexaTimerConfig;
    onChange: (value: AlexaTimerConfig) => void;
    disabled?: boolean;
    /** page items: the choice between the timers and an alarm of the device (`show`, `alarmId`) */
    offerAlarms?: boolean;
    /** instance and device one below the other in full width (narrow dialogs), else side by side */
    stacked?: boolean;
};

type AlexaTimerSelectState = {
    instances: AlexaInstanceInfo[];
    loadingInstances: boolean;
    /** instance the devices below belong to */
    devicesOf: string;
    devices: AlexaDeviceInfo[];
    loadingDevices: boolean;
    /** `<instance>/<serial>` the alarms below belong to */
    alarmsOf: string;
    alarms: AlexaAlarmInfo[];
    loadingAlarms: boolean;
    error: boolean;
};

/**
 * The Echo device of an Alexa timer: instance of alexa2 and device with timers (screensaver time dialog, page item
 * of kind "Alexa timer"). Warns when the instance does not report timers set by voice.
 */
export class AlexaTimerSelect extends React.Component<AlexaTimerSelectProps, AlexaTimerSelectState> {
    private unmounted = false;

    constructor(props: AlexaTimerSelectProps) {
        super(props);
        this.state = {
            instances: [],
            loadingInstances: true,
            devicesOf: '',
            devices: [],
            loadingDevices: false,
            alarmsOf: '',
            alarms: [],
            loadingAlarms: false,
            error: false,
        };
    }

    override componentDidMount(): void {
        void this.loadInstances();
        void this.loadAlarmsIfShown();
    }

    override componentDidUpdate(prevProps: AlexaTimerSelectProps): void {
        if (prevProps.value.instance !== this.props.value.instance) {
            void this.loadDevices(this.props.value.instance);
        }
        if (
            prevProps.value.instance !== this.props.value.instance ||
            prevProps.value.serial !== this.props.value.serial ||
            prevProps.value.alarmId !== this.props.value.alarmId
        ) {
            void this.loadAlarmsIfShown();
        }
    }

    /** key of the device whose alarms are needed, '' when no fixed alarm is chosen */
    private alarmKey(): string {
        const { instance, serial, show, alarmId } = this.props.value;
        return this.props.offerAlarms && show === 'alarm' && alarmId !== undefined && instance && serial
            ? `${instance}/${serial}`
            : '';
    }

    private async loadAlarmsIfShown(): Promise<void> {
        const key = this.alarmKey();
        const socket = this.props.socket;
        if (!key || !socket || key === this.state.alarmsOf || this.state.loadingAlarms) {
            return;
        }
        const { instance, serial } = this.props.value;
        this.setState({ loadingAlarms: true });
        try {
            const alarms = await loadAlexaAlarms(socket, instance, serial, I18n.t('alexaTimer_once'));
            if (!this.unmounted) {
                this.setState({ alarmsOf: key, alarms, loadingAlarms: false });
                if (this.alarmKey() !== key) {
                    void this.loadAlarmsIfShown();
                }
            }
        } catch {
            if (!this.unmounted) {
                this.setState({ alarmsOf: key, alarms: [], loadingAlarms: false, error: true });
            }
        }
    }

    /**
     * Another instance or device: what to show stays, a fixed alarm has to be picked again.
     *
     * @param instance the instance
     * @param serial the device
     */
    private changeDevice(instance: string, serial: string): void {
        const { show, alarmId } = this.props.value;
        const next: AlexaTimerConfig = { instance, serial };
        if (show === 'alarm') {
            next.show = 'alarm';
            if (alarmId !== undefined) {
                next.alarmId = '';
            }
        }
        this.props.onChange(next);
    }

    override componentWillUnmount(): void {
        this.unmounted = true;
    }

    private async loadInstances(): Promise<void> {
        const socket = this.props.socket;
        if (!socket) {
            this.setState({ loadingInstances: false });
            return;
        }
        try {
            const instances = await loadAlexaInstances(socket);
            if (this.unmounted) {
                return;
            }
            this.setState({ instances, loadingInstances: false });
            if (this.props.value.instance) {
                await this.loadDevices(this.props.value.instance);
            }
        } catch {
            if (!this.unmounted) {
                this.setState({ loadingInstances: false, error: true });
            }
        }
    }

    private async loadDevices(instance: string): Promise<void> {
        const socket = this.props.socket;
        if (!socket || !instance) {
            this.setState({ devicesOf: instance, devices: [] });
            return;
        }
        this.setState({ loadingDevices: true });
        try {
            const devices = await loadAlexaTimerDevices(socket, instance);
            if (!this.unmounted && this.props.value.instance === instance) {
                this.setState({ devicesOf: instance, devices, loadingDevices: false });
            }
        } catch {
            if (!this.unmounted) {
                this.setState({ devicesOf: instance, devices: [], loadingDevices: false, error: true });
            }
        }
    }

    private renderInstance(): React.JSX.Element {
        const { instances, loadingInstances } = this.state;
        const { instance } = this.props.value;
        const known = instances.some(i => i.instance === instance);
        return (
            <TextField
                select
                fullWidth
                variant="standard"
                label={I18n.t('alexaTimer_instance')}
                value={known ? instance : ''}
                disabled={this.props.disabled || loadingInstances}
                onChange={e => this.changeDevice(e.target.value, '')}
                slotProps={{
                    inputLabel: { shrink: true },
                    input: { endAdornment: loadingInstances ? <CircularProgress size={16} /> : undefined },
                }}
            >
                {instances.map(i => (
                    <MenuItem
                        key={i.instance}
                        value={i.instance}
                    >
                        {i.instance}
                    </MenuItem>
                ))}
            </TextField>
        );
    }

    private renderDevice(): React.JSX.Element {
        const { devices, loadingDevices, devicesOf } = this.state;
        const { instance, serial } = this.props.value;
        const loaded = devicesOf === instance;
        const known = devices.some(d => d.serial === serial);
        return (
            <TextField
                select
                fullWidth
                variant="standard"
                label={I18n.t('alexaTimer_device')}
                value={known ? serial : ''}
                disabled={this.props.disabled || !instance || loadingDevices || !loaded}
                onChange={e => this.changeDevice(instance, e.target.value)}
                slotProps={{
                    inputLabel: { shrink: true },
                    input: { endAdornment: loadingDevices ? <CircularProgress size={16} /> : undefined },
                }}
            >
                {devices.map(d => (
                    <MenuItem
                        key={d.serial}
                        value={d.serial}
                    >
                        {d.name === d.serial ? d.serial : `${d.name} (${d.serial})`}
                    </MenuItem>
                ))}
            </TextField>
        );
    }

    /** what the item shows and which alarm (page items only) */
    private renderAlarmChoice(): React.JSX.Element {
        const { value } = this.props;
        const { alarms, alarmsOf, loadingAlarms } = this.state;
        const isAlarm = value.show === 'alarm';
        const fixed = isAlarm && value.alarmId !== undefined;
        const loaded = alarmsOf === this.alarmKey() && !loadingAlarms;
        const known = fixed && alarms.some(a => a.id === value.alarmId);
        const base = { instance: value.instance, serial: value.serial };
        return (
            <>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', '& > *': { flex: '1 1 200px' } }}>
                    <TextField
                        select
                        fullWidth
                        variant="standard"
                        label={I18n.t('alexaTimer_show')}
                        value={isAlarm ? 'alarm' : 'timer'}
                        disabled={this.props.disabled}
                        onChange={e =>
                            this.props.onChange(e.target.value === 'alarm' ? { ...base, show: 'alarm' } : base)
                        }
                        slotProps={{ inputLabel: { shrink: true } }}
                    >
                        <MenuItem value="timer">{I18n.t('alexaTimer_showTimer')}</MenuItem>
                        <MenuItem value="alarm">{I18n.t('alexaTimer_showAlarm')}</MenuItem>
                    </TextField>
                    {isAlarm && (
                        <TextField
                            select
                            fullWidth
                            variant="standard"
                            label={I18n.t('alexaTimer_alarmWhich')}
                            value={fixed ? 'fixed' : 'next'}
                            disabled={this.props.disabled}
                            onChange={e =>
                                this.props.onChange(
                                    e.target.value === 'fixed'
                                        ? { ...base, show: 'alarm', alarmId: '' }
                                        : { ...base, show: 'alarm' },
                                )
                            }
                            slotProps={{ inputLabel: { shrink: true } }}
                        >
                            <MenuItem value="next">{I18n.t('alexaTimer_alarmNext')}</MenuItem>
                            <MenuItem value="fixed">{I18n.t('alexaTimer_alarmFixed')}</MenuItem>
                        </TextField>
                    )}
                </Box>
                {fixed && (
                    <TextField
                        select
                        fullWidth
                        variant="standard"
                        label={I18n.t('alexaTimer_alarm')}
                        value={known ? value.alarmId : ''}
                        disabled={this.props.disabled || !value.serial || !loaded}
                        onChange={e => this.props.onChange({ ...base, show: 'alarm', alarmId: e.target.value })}
                        slotProps={{
                            inputLabel: { shrink: true },
                            input: { endAdornment: loadingAlarms ? <CircularProgress size={16} /> : undefined },
                        }}
                    >
                        {alarms.map(a => (
                            <MenuItem
                                key={a.id}
                                value={a.id}
                            >
                                {a.label}
                            </MenuItem>
                        ))}
                    </TextField>
                )}
                {fixed && loaded && !!value.serial && alarms.length === 0 && (
                    <Alert severity="info">{I18n.t('alexaTimer_noAlarm')}</Alert>
                )}
                {fixed && loaded && !!value.alarmId && !known && (
                    <Alert severity="warning">{I18n.t('alexaTimer_alarmMissing')}</Alert>
                )}
            </>
        );
    }

    render(): React.JSX.Element {
        const { instances, loadingInstances, devices, loadingDevices, devicesOf, error } = this.state;
        const { instance, serial } = this.props.value;
        const chosen = instances.find(i => i.instance === instance);
        const loaded = devicesOf === instance && !loadingDevices;
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box
                    sx={{
                        display: 'flex',
                        gap: this.props.stacked ? 1 : 2,
                        flexWrap: 'wrap',
                        '& > *': { flex: this.props.stacked ? '1 1 100%' : '1 1 200px' },
                    }}
                >
                    {this.renderInstance()}
                    {this.renderDevice()}
                </Box>
                {this.props.offerAlarms && this.renderAlarmChoice()}
                {error && <Alert severity="error">{I18n.t('alexaTimer_loadError')}</Alert>}
                {!loadingInstances && !error && instances.length === 0 && (
                    <Alert severity="warning">{I18n.t('alexaTimer_noInstance')}</Alert>
                )}
                {chosen && !chosen.autoQuery && <Alert severity="warning">{I18n.t('alexaTimer_autoQueryOff')}</Alert>}
                {chosen && loaded && devices.length === 0 && (
                    <Alert severity="info">{I18n.t('alexaTimer_noDevice')}</Alert>
                )}
                {loaded && !!serial && !devices.some(d => d.serial === serial) && (
                    <Alert severity="warning">{I18n.t('alexaTimer_deviceMissing')}</Alert>
                )}
            </Box>
        );
    }
}
