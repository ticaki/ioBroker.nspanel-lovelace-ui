import React from 'react';
import { withTheme } from '@mui/styles';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { Checkbox, FormControlLabel, Box, Typography, TextField, type SelectChangeEvent, Button } from '@mui/material';

interface PageMQTTSettingState extends ConfigGenericState {
    // Define any additional state properties if needed

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

    // Generische Handler-Funktion für Select-String-Änderungen
    private handleSelectStringChange =
        (key: string) =>
        (event: SelectChangeEvent<string>): void => {
            void this.onChange(key, event.target.value);
        };

    // Generische Handler-Funktion für Select-Number-Änderungen
    private handleSelectNumberChange =
        (key: string) =>
        (event: SelectChangeEvent<number>): void => {
            void this.onChange(key, event.target.value);
        };

    // Generische Handler-Funktion für Text-Änderungen
    private handleTextChange =
        (key: string) =>
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            void this.onChange(key, event.target.value);
        };

    // Validierungsfunktion
    // Prüft, ob der String nur aus Ziffern besteht (oder leer ist)
    private validateServicePin = (value: string): boolean => {
        return value === '' || /^[0-9]+$/.test(value);
    };

    // Handler für Service-Pin-Änderungen mit Validierung
    private handleServicePinChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const value = event.target.value;

        // Erlaube die Änderung nur, wenn der Wert valide ist
        if (this.validateServicePin(value)) {
            void this.onChange('pw1', value);
        }
    };

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        // Expert Mode from props (provided by json-config system)
        //const isExpertMode = this.props.expertMode ?? false;

        // Lade Werte aus this.props.data (hier werden die Config-Werte gespeichert)
        const data = this.props.data || {};

        // Gemeinsame Styles für alle Boxen
        const boxStyle = {
            p: 2,
            border: 2,
            borderColor: 'divider',
            borderRadius: 1,
            height: '100%',
        };

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* MQTT Server Enable Checkbox */}
                <Box sx={boxStyle}>
                    <FormControlLabel
                        sx={{ mb: 0 }}
                        control={
                            <Checkbox
                                onChange={this.handleCheckboxChange('mqttServer')}
                                checked={data.mqttServer ?? false}
                                disabled={!this.state.alive}
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
                        onClick={() => {
                            // Handle button click
                        }}
                        disabled={!this.state.alive || !data.mqttServer}
                    >
                        {this.getText('getRandomMqttCredentials')}
                    </Button>
                </Box>
                {/* MQTT Connection Settings */}
                <Box sx={boxStyle}>
                    <TextField
                        label={this.getText('mqttIp')}
                        value={data.mqttIp ?? ''}
                        onChange={this.handleTextChange('mqttIp')}
                        disabled={!this.state.alive || data.mqttServer}
                    />
                    <TextField
                        label={this.getText('mqttPort')}
                        value={data.mqttPort ?? ''}
                        onChange={this.handleTextChange('mqttPort')}
                        disabled={!this.state.alive || data.mqttServer}
                    />
                    <TextField
                        label={this.getText('mqttUsername')}
                        value={data.mqttUsername ?? ''}
                        onChange={this.handleTextChange('mqttUsername')}
                        disabled={!this.state.alive || data.mqttServer}
                    />
                    <TextField
                        type="password"
                        label={this.getText('mqttPassword')}
                        value={data.mqttPassword ?? ''}
                        onChange={this.handleTextChange('mqttPassword')}
                        disabled={!this.state.alive || data.mqttServer}
                    />
                </Box>
                {/* Tasmota Admin Password */}
                <Box sx={boxStyle}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                onChange={this.handleCheckboxChange('useTasmotaAdmin')}
                                checked={data.useTasmotaAdmin ?? false}
                                disabled={!this.state.alive}
                            />
                        }
                        label={this.getText('useTasmotaAdmin')}
                    />
                    {data.useTasmotaAdmin && (
                        <TextField
                            type="password"
                            label={this.getText('tasmotaAdminPassword')}
                            value={data.tasmotaAdminPassword ?? ''}
                            onChange={this.handleTextChange('tasmotaAdminPassword')}
                            disabled={!this.state.alive || !data.useTasmotaAdmin}
                        />
                    )}
                </Box>
            </Box>
        );
    }
}

export default withTheme(PageMQTTSetting);
