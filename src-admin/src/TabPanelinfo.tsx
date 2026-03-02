import React from 'react';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import {
    Box,
    Button,
    Typography,
    Alert,
    TextField,
    Switch,
    FormControlLabel,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    InputAdornment,
    IconButton,
} from '@mui/material';
import { grey, orange, yellow } from '@mui/material/colors';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { type IobTheme, type ThemeName, type ThemeType } from '@iobroker/adapter-react-v5';
import { PanelStatusBadge } from './components/PanelStatusBadge';

interface PanelinfoInfo {
    _Headline: string;
    _name: string;
    _ip: string;
    _online: 'yes' | 'no';
    _flashing: boolean;
    _topic: string;
    _id: string;
    _check?: boolean;
}

interface PanelinfoProps {
    oContext?: any;
    themeType: ThemeType;
    themeName: ThemeName;
    theme: IobTheme;
}

interface StateObjectData {
    id: string;
    common: {
        name: string | Record<string, string>;
        type: 'number' | 'boolean' | 'string';
        write: boolean;
        read: boolean;
        unit?: string;
        states?: Record<string, string>;
        role?: string;
    };
}

interface PanelStateData {
    panelId: string;
    states: Record<string, { object: StateObjectData; value: any; tempValue?: string }>;
}

interface PanelinfoState extends ConfigGenericState {
    panelsInfo: PanelinfoInfo[];
    loading: boolean;
    error: string | null;
    alive?: boolean;
    panelStates: Record<string, PanelStateData>;
}

// daten die aus der config kommen, also die props.data
interface PanelConfig {
    id?: string;
    ip?: string;
    name?: string;
    topic?: string;
    model?: string;
}

// Hier können weitere States hinzugefügt werden, die angezeigt bzw. besteuert werden sollen
const displayStates = [
    'cmd.screenSaver.layout', // steht für z.B. für nspanel-lovelace-ui.0.panels.C0_49_EF_FA_4C_6C.cmd.screenSaver.layout
    'cmd.screenSaver.timeout',
    'cmd.dim.dayMode',
    'cmd.dim.schedule',
    'info.nspanel.model',
    'info.internal.pageCount',
    'info.internal.servicePageCount',
    'info.internal.scriptName',
];

// Optionale States mit bedingter Anzeige (z.B. nur für Tasmota-Modelle)
interface OptionalDisplayState {
    id: string;
    f: (val: any) => boolean;
}

const optionalDisplayStates: OptionalDisplayState[] = [
    {
        id: 'info.nspanel.firmwareUpdate',
        f: (val: any) => {
            return val && val < 100 && val > 0;
        },
    },
];

class TabPanelinfo extends ConfigGeneric<ConfigGenericProps & PanelinfoProps, PanelinfoState> {
    private timeoutHandle: NodeJS.Timeout | null = null;
    private retryTimeoutHandle: NodeJS.Timeout | null = null;
    private instance = this.props.oContext.instance ?? '0';
    private adapterName = this.props.oContext.adapterName;
    private panelsConfig: PanelConfig[] = [];
    private _isMounted: boolean = false;
    private stateRetryCount: Map<string, number> = new Map(); // Track retry count per state
    private failedStates: Set<string> = new Set(); // Track states that need retry
    private readonly MAX_RETRY_COUNT = 5;
    private readonly RETRY_DELAY_MS = 7000; // 7 seconds

    constructor(props: ConfigGenericProps & PanelinfoProps) {
        super(props);
        this.state = {
            ...this.state,
            panelsInfo: [],
            loading: false,
            error: null,
            alive: false,
            panelStates: {},
        };
    }

    async componentWillUnmount(): Promise<void> {
        this._isMounted = false;
        // Remove visibility change listener
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        // Unsubscribe from alive state changes
        const aliveStateId = `system.adapter.${this.adapterName}.${this.instance}.alive`;
        this.props.oContext.socket.unsubscribeState(aliveStateId, this.onAliveChanged);
        // Unsubscribe from panel online state changes
        const panels = await this.getPanels();
        for (const panel of panels) {
            this.props.oContext.socket.unsubscribeState(
                `${this.adapterName}.${this.instance}.panels.${panel.id}.info.isOnline`,
                this.onPanelOnlineChanged,
            );
            // Unsubscribe from panel states
            for (const statePath of displayStates) {
                const stateId = `${this.adapterName}.${this.instance}.panels.${panel.id}.${statePath}`;
                this.props.oContext.socket.unsubscribeState(stateId, this.onStateChanged);
            }
            // Unsubscribe from optional panel states
            for (const optState of optionalDisplayStates) {
                const stateId = `${this.adapterName}.${this.instance}.panels.${panel.id}.${optState.id}`;
                this.props.oContext.socket.unsubscribeState(stateId, this.onStateChanged);
            }
        }
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
            this.timeoutHandle = null;
        }
        if (this.retryTimeoutHandle) {
            clearTimeout(this.retryTimeoutHandle);
            this.retryTimeoutHandle = null;
        }
    }

    async getPanels(): Promise<PanelConfig[]> {
        if (!this.props.data?.panels) {
            if (this.panelsConfig.length > 0) {
                return this.panelsConfig;
            }
            const obj = await this.props.oContext.socket.getObject(
                `system.adapter.${this.props.oContext.adapterName}.${this.props.oContext.instance}`,
            );

            this.panelsConfig = obj?.native?.panels || [];
            return this.panelsConfig; // Fallback zu leerem Objekt, falls native nicht definiert ist
        }
        this.panelsConfig = this.props.data.panels || [];
        return this.panelsConfig; // Fallback zu leerem Array, falls panels nicht definiert ist
    }

    async componentDidMount(): Promise<void> {
        super.componentDidMount();
        this._isMounted = true;

        // Get initial alive state and subscribe to changes
        const aliveStateId = `system.adapter.${this.adapterName}.${this.instance}.alive`;

        try {
            const state = await this.props.oContext.socket.getState(aliveStateId);
            const isAlive = !!state?.val;
            if (this._isMounted) {
                this.setState({ alive: isAlive });
            }

            // Subscribe to alive state changes
            await this.props.oContext.socket.subscribeState(aliveStateId, this.onAliveChanged);

            // If adapter is alive, start loading pages
            if (isAlive) {
                console.log('[Panelinfo] Adapter is alive, ready to load settings.');
                await this.refreshPanels();
            }
            const panels = await this.getPanels();
            for (const panel of panels) {
                if (!panel.id) {
                    continue;
                }
                // nspanel-lovelace-ui.0.panels.7C_87_CE_C6_1B_74.info.isOnline
                console.log(`[Panelinfo] Subscribing to online state for panel ${panel.name} (${panel.id})`);
                await this.props.oContext.socket.subscribeState(
                    `${this.adapterName}.${this.instance}.panels.${panel.id}.info.isOnline`,
                    this.onPanelOnlineChanged,
                );
                // Subscribe to panel states and load object data
                await this.loadPanelStates(panel.id);
            }
        } catch (error) {
            console.error('[Panelinfo] Failed to get alive state or subscribe:', error);
            if (this._isMounted) {
                this.setState({ alive: false });
            }
        }

        // Listen for visibility changes to refresh states when tab becomes visible again
        document.addEventListener('visibilitychange', this.onVisibilityChange);
    }

    // Handler für Visibility-Änderungen (Browser-Tab erhält wieder Fokus)
    private onVisibilityChange = (): void => {
        if (document.visibilityState === 'visible') {
            console.log('[Panelinfo] Tab became visible - refreshing states');
            void this.refreshStates();
        }
    };

    // Methode zum Aktualisieren der States nach Fokus-Wiedererlannung
    private async refreshStates(): Promise<void> {
        if (!this._isMounted) {
            return;
        }
        // Alive-Status neu laden
        const aliveStateId = `system.adapter.${this.adapterName}.${this.instance}.alive`;
        try {
            const state = await this.props.oContext.socket.getState(aliveStateId);
            const isAlive = !!state?.val;
            if (this._isMounted && this.state.alive !== isAlive) {
                this.setState({ alive: isAlive });
            }
        } catch (error) {
            console.error('[Panelinfo] Failed to refresh alive state:', error);
        }

        // Panel-Informationen komplett neu laden
        if (this._isMounted && this.state.alive) {
            await this.refreshPanels();
        }
    }

    // Callback for alive state changes
    onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        if (!this._isMounted) {
            return;
        }
        const wasAlive = this.state.alive;
        const isAlive = state ? !!state.val : false;

        if (wasAlive !== isAlive) {
            console.log('[Panelinfo] Alive state changed:', { wasAlive, isAlive });
            this.setState({ alive: isAlive });
        }
    };

    // Load panel states and subscribe
    private async loadPanelStates(panelId: string): Promise<void> {
        const panelStateData: PanelStateData = {
            panelId,
            states: {},
        };

        for (const statePath of displayStates) {
            const stateId = `${this.adapterName}.${this.instance}.panels.${panelId}.${statePath}`;

            try {
                // Get object data
                const obj = await this.props.oContext.socket.getObject(stateId);
                if (!obj || !obj.common) {
                    console.warn(`[Panelinfo] Object not found or invalid: ${stateId}`);
                    this.failedStates.add(stateId);
                    this.scheduleRetry();
                    continue;
                }

                // Validate type
                if (!['number', 'boolean', 'string'].includes(obj.common.type)) {
                    console.error(`[Panelinfo] Invalid type '${obj.common.type}' for state: ${stateId}`);
                    continue;
                }

                // Get current state value
                const state = await this.props.oContext.socket.getState(stateId);
                const value = state?.val ?? null;

                panelStateData.states[statePath] = {
                    object: obj as StateObjectData,
                    value,
                };

                // Subscribe to state changes
                await this.props.oContext.socket.subscribeState(stateId, this.onStateChanged);
                console.log(`[Panelinfo] Subscribed to state: ${stateId}`);
                // Remove from failed states if it was there
                this.failedStates.delete(stateId);
                this.stateRetryCount.delete(stateId);
            } catch (error) {
                console.error(`[Panelinfo] Failed to load state ${stateId}:`, error);
                this.failedStates.add(stateId);
                this.scheduleRetry();
            }
        }

        // Load optional states
        for (const optState of optionalDisplayStates) {
            const stateId = `${this.adapterName}.${this.instance}.panels.${panelId}.${optState.id}`;

            try {
                // Get object data
                const obj = await this.props.oContext.socket.getObject(stateId);
                if (!obj || !obj.common) {
                    console.warn(`[Panelinfo] Optional object not found or invalid: ${stateId}`);
                    this.failedStates.add(stateId);
                    this.scheduleRetry();
                    continue;
                }

                // Validate type
                if (!['number', 'boolean', 'string'].includes(obj.common.type)) {
                    console.error(`[Panelinfo] Invalid type '${obj.common.type}' for optional state: ${stateId}`);
                    continue;
                }

                // Get current state value
                const state = await this.props.oContext.socket.getState(stateId);
                const value = state?.val ?? null;

                panelStateData.states[optState.id] = {
                    object: obj as StateObjectData,
                    value,
                };

                // Subscribe to state changes
                await this.props.oContext.socket.subscribeState(stateId, this.onStateChanged);
                console.log(`[Panelinfo] Subscribed to optional state: ${stateId}`);
                // Remove from failed states if it was there
                this.failedStates.delete(stateId);
                this.stateRetryCount.delete(stateId);
            } catch (error) {
                console.error(`[Panelinfo] Failed to load optional state ${stateId}:`, error);
                this.failedStates.add(stateId);
                this.scheduleRetry();
            }
        }

        if (this._isMounted) {
            this.setState(prevState => ({
                panelStates: {
                    ...prevState.panelStates,
                    [panelId]: panelStateData,
                },
            }));
        }
    }

    // Schedule retry for failed states
    private scheduleRetry(): void {
        if (this.retryTimeoutHandle || !this._isMounted) {
            return; // Already scheduled or unmounted
        }

        this.retryTimeoutHandle = setTimeout(() => {
            this.retryTimeoutHandle = null;
            void this.retryFailedStates();
        }, this.RETRY_DELAY_MS);
    }

    // Retry loading failed states
    private async retryFailedStates(): Promise<void> {
        if (!this._isMounted || this.failedStates.size === 0) {
            return;
        }

        const statesToRetry = Array.from(this.failedStates);
        console.log(`[Panelinfo] Retrying ${statesToRetry.length} failed states`);

        for (const stateId of statesToRetry) {
            const retryCount = this.stateRetryCount.get(stateId) || 0;

            if (retryCount >= this.MAX_RETRY_COUNT) {
                console.warn(`[Panelinfo] Max retry count reached for state: ${stateId}`);
                this.failedStates.delete(stateId);
                this.stateRetryCount.delete(stateId);
                continue;
            }

            // Parse stateId to get panelId and statePath
            const match = stateId.match(new RegExp(`${this.adapterName}.${this.instance}.panels.([^.]+).(.+)`));
            if (!match) {
                console.error(`[Panelinfo] Cannot parse state ID: ${stateId}`);
                this.failedStates.delete(stateId);
                continue;
            }

            const [, panelId, statePath] = match;

            try {
                // Get object data
                const obj = await this.props.oContext.socket.getObject(stateId);
                if (!obj || !obj.common) {
                    console.warn(`[Panelinfo] Retry ${retryCount + 1}: Object still not found: ${stateId}`);
                    this.stateRetryCount.set(stateId, retryCount + 1);
                    continue;
                }

                // Validate type
                if (!['number', 'boolean', 'string'].includes(obj.common.type)) {
                    console.error(`[Panelinfo] Invalid type '${obj.common.type}' for state: ${stateId}`);
                    this.failedStates.delete(stateId);
                    this.stateRetryCount.delete(stateId);
                    continue;
                }

                // Get current state value
                const state = await this.props.oContext.socket.getState(stateId);
                const value = state?.val ?? null;

                // Subscribe to state changes
                await this.props.oContext.socket.subscribeState(stateId, this.onStateChanged);
                console.log(`[Panelinfo] Retry ${retryCount + 1} successful: Subscribed to state: ${stateId}`);

                // Update panel state data
                if (this._isMounted) {
                    this.setState(prevState => {
                        const panelStateData = prevState.panelStates[panelId];
                        if (!panelStateData) {
                            return null;
                        }

                        return {
                            ...prevState,
                            panelStates: {
                                ...prevState.panelStates,
                                [panelId]: {
                                    ...panelStateData,
                                    states: {
                                        ...panelStateData.states,
                                        [statePath]: {
                                            object: obj as StateObjectData,
                                            value,
                                        },
                                    },
                                },
                            },
                        };
                    });
                }

                // Success - remove from failed states
                this.failedStates.delete(stateId);
                this.stateRetryCount.delete(stateId);
            } catch (error) {
                console.error(`[Panelinfo] Retry ${retryCount + 1} failed for state ${stateId}:`, error);
                this.stateRetryCount.set(stateId, retryCount + 1);
            }
        }

        // If there are still failed states, schedule another retry
        if (this.failedStates.size > 0) {
            this.scheduleRetry();
        }
    }

    // Callback for state changes
    onStateChanged = (id: string, state: ioBroker.State | null | undefined): void => {
        if (!this._isMounted) {
            return;
        }

        // Parse the state ID to find panel and state path
        const match = id.match(new RegExp(`${this.adapterName}.${this.instance}.panels.([^.]+).(.+)`));
        if (!match) {
            return;
        }

        const [, panelId, statePath] = match;
        const value = state?.val ?? null;

        console.log(`[Panelinfo] State changed: ${id} = ${value}`);

        this.setState(prevState => {
            const panelStateData = prevState.panelStates[panelId];
            if (!panelStateData || !panelStateData.states[statePath]) {
                return null;
            }

            return {
                ...prevState,
                panelStates: {
                    ...prevState.panelStates,
                    [panelId]: {
                        ...panelStateData,
                        states: {
                            ...panelStateData.states,
                            [statePath]: {
                                ...panelStateData.states[statePath],
                                value,
                            },
                        },
                    },
                },
            };
        });
    };

    // Callback for panel online state changes
    onPanelOnlineChanged = (_id: string, _state: ioBroker.State | null | undefined): void => {
        if (!this._isMounted) {
            return;
        }
        console.log('[Panelinfo] Panel online state changed, refreshing panels');
        void this.refreshPanels();
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
        }
        this.timeoutHandle = setTimeout(() => {
            if (this._isMounted) {
                void this.refreshPanels();
            }
        }, 5000);
    };

    private async refreshPanels(): Promise<void> {
        if (!this._isMounted) {
            return;
        }
        if (!this.state.alive) {
            if (this._isMounted) {
                this.setState({ error: this.getText('adapterNotAlive'), loading: false });
            }
            return;
        }
        await this.getPanels();
        if (this._isMounted) {
            this.setState({ loading: true, error: null });
        }

        try {
            const result = await this.props.oContext.socket.sendTo(
                `${this.adapterName}.${this.instance}`,
                'refreshMaintainTable',
                { internalServerIp: this.props.data.internalServerIp },
            );
            console.log('[Panelinfo] refreshMaintainTable result:', result);

            if (!this._isMounted) {
                return;
            }

            if (result && result.native && Array.isArray(result.native._maintainPanels)) {
                this.setState({ panelsInfo: result.native._maintainPanels, loading: false });
            } else {
                this.setState({ error: this.getText('invalidResponseFromAdapter'), loading: false });
            }
        } catch (err) {
            if (this._isMounted) {
                this.setState({ error: String(err), loading: false });
            }
            return;
        }
    }

    private handleOpenTasmotaConsole(panel: PanelConfig | undefined): void {
        try {
            console.log('[Maintain] Attempting to open Tasmota console for panel:', panel);
            if (!panel?.ip) {
                this.setState({ error: this.getText('invalidIpForConsole') });
                return;
            }
            const openUrl = `http://${panel.ip}:80/cs?`;
            window.open(openUrl, '_blank', 'noopener,noreferrer');
        } catch (err) {
            if (this._isMounted) {
                this.setState({ error: String(err) });
            }
        }
    }

    // Write state value
    private async writeStateValue(panelId: string, statePath: string, value: any): Promise<void> {
        const stateId = `${this.adapterName}.${this.instance}.panels.${panelId}.${statePath}`;

        try {
            await this.props.oContext.socket.setState(stateId, value, false);
            console.log(`[Panelinfo] Wrote state ${stateId} = ${value}`);
        } catch (error) {
            console.error(`[Panelinfo] Failed to write state ${stateId}:`, error);
            if (this._isMounted) {
                this.setState({ error: String(error) });
            }
        }
    }

    // Handle text field change (temp value)
    private handleTextFieldChange(panelId: string, statePath: string, value: string): void {
        this.setState(prevState => {
            const panelStateData = prevState.panelStates[panelId];
            if (!panelStateData || !panelStateData.states[statePath]) {
                return null;
            }

            return {
                ...prevState,
                panelStates: {
                    ...prevState.panelStates,
                    [panelId]: {
                        ...panelStateData,
                        states: {
                            ...panelStateData.states,
                            [statePath]: {
                                ...panelStateData.states[statePath],
                                tempValue: value,
                            },
                        },
                    },
                },
            };
        });
    }
    private handleSettingsPanel(): void {
        // Konstruiere die URL zur Adapter-Konfiguration
        const protocol = window.location.protocol; // http: or https:
        const host = window.location.host; // ip:port, z.B. 127.0.0.1:8082
        const configUrl = `${protocol}//${host}/#tab-instances/config/system.adapter.${this.adapterName}.${this.instance}`;

        console.log('[Panelinfo] Opening settings panel:', configUrl);
        window.location.href = configUrl;
    }

    // Handle text field commit (blur or enter)
    private async handleTextFieldCommit(panelId: string, statePath: string): Promise<void> {
        const panelStateData = this.state.panelStates[panelId];
        if (!panelStateData || !panelStateData.states[statePath]) {
            return;
        }

        const stateData = panelStateData.states[statePath];
        const tempValue = stateData.tempValue;

        if (tempValue === undefined) {
            return; // No change
        }

        const type = stateData.object.common.type;
        let parsedValue: any = tempValue;

        if (type === 'number') {
            parsedValue = parseFloat(tempValue);
            if (isNaN(parsedValue)) {
                this.setState({ error: `Invalid number: ${tempValue}` });
                return;
            }
        }

        await this.writeStateValue(panelId, statePath, parsedValue);

        // Clear temp value
        this.setState(prevState => {
            const panelStateData = prevState.panelStates[panelId];
            if (!panelStateData || !panelStateData.states[statePath]) {
                return null;
            }

            return {
                ...prevState,
                panelStates: {
                    ...prevState.panelStates,
                    [panelId]: {
                        ...panelStateData,
                        states: {
                            ...panelStateData.states,
                            [statePath]: {
                                ...panelStateData.states[statePath],
                                tempValue: undefined,
                            },
                        },
                    },
                },
            };
        });
    }

    // Check if optional state should be displayed based on condition function
    private shouldDisplayOptionalState(panelId: string, statePath: string): boolean {
        const optState = optionalDisplayStates.find(opt => opt.id === statePath);
        if (!optState) {
            return true; // Not an optional state, always display
        }

        const panelStateData = this.state.panelStates[panelId];
        if (!panelStateData || !panelStateData.states[statePath]) {
            return false;
        }

        const value = panelStateData.states[statePath].value;
        try {
            return optState.f(value);
        } catch (error) {
            console.error(`[Panelinfo] Error in optional state condition for ${statePath}:`, error);
            return false;
        }
    }

    // Render state control based on object data
    private renderStateControl(panelId: string, statePath: string): React.JSX.Element | null {
        const panelStateData = this.state.panelStates[panelId];
        if (!panelStateData || !panelStateData.states[statePath]) {
            return null;
        }

        const stateData = panelStateData.states[statePath];
        const obj = stateData.object;
        const value = stateData.tempValue !== undefined ? stateData.tempValue : (stateData.value ?? '');
        const isWritable = obj.common.write;
        const type = obj.common.type;
        const states = obj.common.states;
        const unit = obj.common.unit;
        const role = obj.common.role;

        console.log(`[Panelinfo] Rendering control for ${statePath}:`, { type, unit, isWritable, states, role });

        // Get label from common.name
        let label = obj.common.name;
        if (typeof label === 'object') {
            label = label[this.props.oContext.systemLang] || label.en || Object.values(label)[0] || statePath;
        }

        // Boolean button (Taster ohne anzeigbaren Wert)
        if (type === 'boolean' && isWritable && role && role.startsWith('button')) {
            return (
                <Button
                    key={statePath}
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => {
                        void this.writeStateValue(panelId, statePath, true);
                    }}
                    disabled={!this.state.alive}
                >
                    {label}
                </Button>
            );
        }

        // Boolean with switch
        if (type === 'boolean' && isWritable) {
            return (
                <FormControlLabel
                    key={statePath}
                    control={
                        <Switch
                            checked={!!value}
                            onChange={e => {
                                void this.writeStateValue(panelId, statePath, e.target.checked);
                            }}
                        />
                    }
                    label={label}
                />
            );
        }

        // Boolean read-only
        if (type === 'boolean' && !isWritable) {
            const panel = this.state.panelsInfo.find(p => p._id === panelId);
            const iconColor = panel?._check ? 'disabled' : 'error';
            return (
                <Box
                    key={statePath}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}
                >
                    {value ? <CheckCircleIcon color="success" /> : <CancelIcon color={iconColor} />}
                    <Typography variant="body2">{label}</Typography>
                </Box>
            );
        }

        // Select field with states
        if (states && Object.keys(states).length > 0) {
            return (
                <FormControl
                    key={statePath}
                    fullWidth
                    size="small"
                >
                    <InputLabel>{label}</InputLabel>
                    <Select
                        value={value}
                        label={label}
                        onChange={e => {
                            if (isWritable) {
                                void this.writeStateValue(panelId, statePath, e.target.value);
                            }
                        }}
                        disabled={!isWritable}
                    >
                        {Object.entries(states).map(([val, text]) => (
                            <MenuItem
                                key={val}
                                value={val}
                            >
                                {text}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            );
        }

        // Text/Number field
        return (
            <TextField
                key={statePath}
                label={label}
                value={value}
                onChange={e => this.handleTextFieldChange(panelId, statePath, e.target.value)}
                onBlur={() => {
                    void this.handleTextFieldCommit(panelId, statePath);
                }}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        void this.handleTextFieldCommit(panelId, statePath);
                        // Remove focus from the input field
                        (e.target as HTMLInputElement).blur();
                    }
                }}
                slotProps={{
                    input: {
                        readOnly: !isWritable,
                        endAdornment: unit ? <InputAdornment position="end">{unit}</InputAdornment> : undefined,
                    },
                }}
                size="small"
                fullWidth
            />
        );
    }

    private getPanelCardStyle(panel: PanelinfoInfo): {
        backgroundColor: string;
        borderColor: string;
    } {
        // Use state.themeName which is updated via interval
        console.log(`[Panelinfo] themeType: ${this.props.themeType}, themeName: ${this.props.themeName}`);
        const isDark = this.props.themeName === 'dark';

        if (!this.state.alive) {
            return {
                backgroundColor: isDark ? grey[800] : grey[300],
                borderColor: isDark ? grey[700] : grey[400],
            };
        }
        if (panel._flashing) {
            return {
                backgroundColor: isDark ? yellow[900] : yellow[100],
                borderColor: isDark ? yellow[700] : yellow[400],
            };
        }
        if (panel._check) {
            return {
                backgroundColor: isDark ? orange[900] : orange[100],
                borderColor: orange[700],
            };
        }
        return {
            backgroundColor: 'transparent',
            borderColor: 'primary',
        };
    }

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        const panelsConfig: PanelConfig[] = this.panelsConfig;
        const { panelsInfo, error, alive, panelStates } = this.state;

        return (
            <Box sx={{ p: 2 }}>
                {/* Error display */}
                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 2 }}
                        onClose={() => this.setState({ error: null })}
                    >
                        {error}
                    </Alert>
                )}

                {/* Panels as Boxes */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {panelsInfo.map((panel, index) => {
                        const cardStyle = this.getPanelCardStyle(panel);
                        const panelConfig = panelsConfig.find(p => p.topic === panel._topic);
                        return (
                            <Box
                                key={panel._id || index}
                                sx={{
                                    width: 'fit-content',
                                    maxWidth: '100%',
                                    minWidth: 320,
                                    border: 3,
                                    borderColor: cardStyle.borderColor,
                                    backgroundColor: cardStyle.backgroundColor,
                                    opacity: !alive ? 0.6 : 1,
                                    p: 2,
                                    borderRadius: 1,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                                    {/* Left side: Name and Badge vertically stacked */}
                                    {/* Panel Name and Status Badge */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: panel._check ? 'bold' : 'normal',
                                            }}
                                        >
                                            {panel._Headline}
                                        </Typography>
                                        <PanelStatusBadge
                                            panelId={panelConfig?.id || panel._id}
                                            oContext={this.props.oContext}
                                            disableTooltip={true}
                                            showIcon={false}
                                            alive={alive}
                                        />
                                    </Box>
                                    <IconButton
                                        size="small"
                                        color={panel._check ? 'primary' : 'default'}
                                        onClick={() => this.handleSettingsPanel()}
                                        disabled={!alive}
                                        title={this.getText('settingPanel')}
                                    >
                                        <SettingsOutlinedIcon />
                                    </IconButton>
                                </Box>

                                {/* Panel States */}
                                {panelStates[panelConfig?.id || panel._id] && (
                                    <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        {displayStates.map(statePath =>
                                            this.renderStateControl(panelConfig?.id || panel._id, statePath),
                                        )}
                                        {optionalDisplayStates
                                            .filter(optState =>
                                                this.shouldDisplayOptionalState(
                                                    panelConfig?.id || panel._id,
                                                    optState.id,
                                                ),
                                            )
                                            .map(optState =>
                                                this.renderStateControl(panelConfig?.id || panel._id, optState.id),
                                            )}
                                    </Box>
                                )}

                                {/* Console Button */}
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={() => this.handleOpenTasmotaConsole(panelConfig)}
                                    disabled={!panelConfig?.ip || !alive}
                                    size="small"
                                >
                                    {this.getText('openTasmotaConsole')}
                                </Button>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        );
    }
}
export default TabPanelinfo;
