import React from 'react';
import { Alert, Box, CircularProgress, MenuItem, TextField } from '@mui/material';
import { I18n } from '@iobroker/gui-components';
import type { AlexaTimerConfig } from '../../../src/lib/types/adminShareConfig';
import {
    loadAlexaInstances,
    loadAlexaTimerDevices,
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
};

type AlexaTimerSelectState = {
    instances: AlexaInstanceInfo[];
    loadingInstances: boolean;
    /** instance the devices below belong to */
    devicesOf: string;
    devices: AlexaDeviceInfo[];
    loadingDevices: boolean;
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
            error: false,
        };
    }

    override componentDidMount(): void {
        void this.loadInstances();
    }

    override componentDidUpdate(prevProps: AlexaTimerSelectProps): void {
        if (prevProps.value.instance !== this.props.value.instance) {
            void this.loadDevices(this.props.value.instance);
        }
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
                onChange={e => this.props.onChange({ instance: e.target.value, serial: '' })}
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
                onChange={e => this.props.onChange({ instance, serial: e.target.value })}
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

    render(): React.JSX.Element {
        const { instances, loadingInstances, devices, loadingDevices, devicesOf, error } = this.state;
        const { instance, serial } = this.props.value;
        const chosen = instances.find(i => i.instance === instance);
        const loaded = devicesOf === instance && !loadingDevices;
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', '& > *': { flex: '1 1 200px' } }}>
                    {this.renderInstance()}
                    {this.renderDevice()}
                </Box>
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
