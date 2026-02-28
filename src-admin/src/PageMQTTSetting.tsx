import React from 'react';
import { withTheme } from '@mui/styles';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import {
    Checkbox,
    FormControlLabel,
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface PageMQTTSettingState extends ConfigGenericState {
    // Define any additional state properties if needed
    showPassword: boolean;
    // State for alive status of the adapter
    alive?: boolean;
}

class PageMQTTSetting extends ConfigGeneric<ConfigGenericProps & { theme?: any }, PageMQTTSettingState> {
    private pagesRetryTimeout?: NodeJS.Timeout;
    private instance = this.props.oContext.instance ?? '0';
    private adapterName = this.props.oContext.adapterName;

    constructor(props: ConfigGenericProps & { theme?: any }) {
        super(props);
        this.state = {
            ...this.state,
            alive: false,
            showPassword: false,
        };
    }

    componentWillUnmount(): void {
        if (this.pagesRetryTimeout) {
            clearTimeout(this.pagesRetryTimeout);
        }
        // Unsubscribe from alive state changes
        this.props.oContext.socket.unsubscribeState(
            `system.adapter.${this.adapterName}.${this.instance}.alive`,
            this.onAliveChanged,
        );
    }

    async componentDidMount(): Promise<void> {
        super.componentDidMount();

        // Get initial alive state and subscribe to changes
        const aliveStateId = `system.adapter.${this.adapterName}.${this.instance}.alive`;

        try {
            const state = await this.props.oContext.socket.getState(aliveStateId);
            const isAlive = !!state?.val;
            this.setState({ alive: isAlive });

            // Subscribe to alive state changes
            await this.props.oContext.socket.subscribeState(aliveStateId, this.onAliveChanged);
        } catch (error) {
            console.error('[PageMQTTSetting] Failed to get alive state or subscribe:', error);
            this.setState({ alive: false });
        }
    }

    // Callback for alive state changes
    onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const wasAlive = this.state.alive;
        const isAlive = state ? !!state.val : false;

        if (wasAlive !== isAlive) {
            this.setState({ alive: isAlive });
        }
    };

    // Generische Handler-Funktion für Checkbox-Änderungen
    private handleCheckboxChange =
        (key: string) =>
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            void this.onChange(key, event.target.checked);
        };

    // Generische Handler-Funktion für Text-Änderungen
    private handleTextChange =
        (key: string) =>
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            void this.onChange(key, event.target.value);
        };

    // Handler für zufällige MQTT-Credentials
    private handleGetRandomMqttCredentials = async (): Promise<void> => {
        try {
            const result = await this.props.oContext.socket.sendTo(
                `${this.adapterName}.${this.instance}`,
                'getRandomMqttCredentials',
                { mqttServer: true },
            );

            if (result && result.native) {
                console.log('[PageMQTTSetting] Received random MQTT credentials:', result.native);

                // Setze die Werte direkt auf this.props.data
                this.props.data.mqttIp = ''; // MQTT IP wird leer gelassen, da der Server lokal läuft
                if (result.native.mqttPort !== undefined) {
                    this.props.data.mqttPort = result.native.mqttPort;
                }
                if (result.native.mqttUsername !== undefined) {
                    this.props.data.mqttUsername = result.native.mqttUsername;
                }
                if (result.native.mqttPassword !== undefined) {
                    this.props.data.mqttPassword = result.native.mqttPassword;
                }

                // Trigger onChange um die Config-Speicherung auszulösen
                // Da props.data bereits aktualisiert ist, reicht ein onChange-Aufruf
                if (result.native.mqttPort !== undefined) {
                    await this.onChange('mqttPort', result.native.mqttPort);
                }

                console.log('[PageMQTTSetting] Updated all MQTT credentials:', {
                    ip: this.props.data.mqttIp,
                    port: result.native.mqttPort,
                    username: result.native.mqttUsername,
                    password: '***',
                });
            } else if (result && result.error) {
                console.error('[PageMQTTSetting] Error getting random MQTT credentials:', result.error);
            }
        } catch (error) {
            console.error('[PageMQTTSetting] Failed to get random MQTT credentials:', error);
        }
    };

    private handleToggleVisibility = (): void => {
        this.setState(prevState => ({
            showPassword: !prevState.showPassword,
        }));
    };

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        // Expert Mode from props (provided by json-config system)
        //const isExpertMode = this.props.expertMode ?? false;

        // Destructure state properties for easier access
        const { alive, showPassword } = this.state;

        // Lade Werte aus this.props.data (hier werden die Config-Werte gespeichert)
        const data = this.props.data || {};

        // Gemeinsame Styles für alle Boxen
        const boxStyle = {
            p: 2,
            border: 2,
            borderColor: 'divider',
            borderRadius: 1,
            height: '100%',
            maxWidth: '50%',
        };

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* MQTT Server Enable Checkbox */}
                <Box
                    sx={boxStyle}
                    display={'flex'}
                    flexDirection={'column'}
                >
                    <FormControlLabel
                        sx={{ mb: 0 }}
                        control={
                            <Checkbox
                                onChange={this.handleCheckboxChange('mqttServer')}
                                checked={data.mqttServer ?? false}
                                disabled={!alive}
                            />
                        }
                        label={this.getText('mqttServer')}
                    />
                    {!data.mqttServer && (
                        <Typography
                            variant="body2"
                            color="red"
                            sx={{ mt: 1 }}
                        >
                            {this.getText('notifyMqttServer')}
                        </Typography>
                    )}
                    {/* Button to get random MQTT credentials */}
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={this.handleGetRandomMqttCredentials}
                        disabled={!alive || !data.mqttServer}
                    >
                        {this.getText('getRandomMqttCredentials')}
                    </Button>
                </Box>
                {/* MQTT Connection Settings */}
                <Box
                    sx={boxStyle}
                    flexDirection={'column'}
                >
                    <Box sx={{ display: 'flex', width: '100%' }}>
                        {/* IP-Feld mit readOnly, wenn mqttServer aktiviert ist */}
                        <TextField
                            variant="standard"
                            label={this.getText('mqttIp')}
                            value={data.mqttIp ?? ''}
                            onChange={this.handleTextChange('mqttIp')}
                            disabled={!alive || data.mqttServer}
                            sx={{ m: 1, maxWidth: '300px' }}
                        />
                        {/* Port-Feld mit readOnly, wenn mqttServer aktiviert ist */}
                        <TextField
                            variant="standard"
                            type="number"
                            label={this.getText('mqttPort')}
                            value={data.mqttPort ?? ''}
                            onChange={this.handleTextChange('mqttPort')}
                            disabled={!alive || data.mqttServer}
                            sx={{ m: 1, maxWidth: '300px' }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', width: '100%' }}>
                        {/* Benutzername-Feld mit readOnly, wenn mqttServer aktiviert ist */}
                        <TextField
                            variant="standard"
                            label={this.getText('mqttUser')}
                            value={data.mqttUsername ?? ''}
                            onChange={this.handleTextChange('mqttUsername')}
                            disabled={!alive || data.mqttServer}
                            sx={{ m: 1, maxWidth: '300px' }}
                        />
                        {/* Passwortfeld mit Sichtbarkeitstoggle */}
                        <TextField
                            variant="standard"
                            label={this.getText('mqttPassword')}
                            type={showPassword ? 'text' : 'password'}
                            value={data.mqttPassword ?? ''}
                            onChange={this.handleTextChange('mqttPassword')}
                            disabled={!alive || data.mqttServer}
                            sx={{ m: 1, maxWidth: '300px' }}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={this.handleToggleVisibility}
                                                disabled={!alive || data.mqttServer}
                                                edge="end"
                                                size="small"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Box>
                </Box>
                {/* Tasmota Admin Password */}
                <Box
                    sx={{
                        ...boxStyle,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <FormControlLabel
                        control={
                            <Checkbox
                                onChange={this.handleCheckboxChange('useTasmotaAdmin')}
                                checked={data.useTasmotaAdmin ?? false}
                                disabled={!alive}
                            />
                        }
                        label={this.getText('useTasmotaAdmin')}
                    />
                    {data.useTasmotaAdmin && (
                        <TextField
                            variant="standard"
                            label={this.getText('tasmotaAdminPassword')}
                            type={showPassword ? 'text' : 'password'}
                            value={data.tasmotaAdminPassword}
                            onChange={value => this.onChange('tasmotaAdminPassword', value)}
                            disabled={!alive}
                            sx={{ m: 1, maxWidth: '300px' }}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={this.handleToggleVisibility}
                                                disabled={!alive}
                                                edge="end"
                                                size="small"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    )}
                </Box>
            </Box>
        );
    }
}

export default withTheme(PageMQTTSetting);
