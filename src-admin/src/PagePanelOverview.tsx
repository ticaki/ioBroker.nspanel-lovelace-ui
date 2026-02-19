import React from 'react';
import { withTheme } from '@mui/styles';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import {
    Alert,
    //Checkbox,
    //FormControlLabel,
    Box,
    TextField,
    //TextField,
    Typography,
    //TextField,
    type SelectChangeEvent,
    //Button,
    //FormControl,
} from '@mui/material';

interface PagePanelOverviewState extends ConfigGenericState {
    // Define any additional state properties if needed

    // State for alive status of the adapter
    alive?: boolean;
}

class PagePanelOverview extends ConfigGeneric<ConfigGenericProps & { theme?: any }, PagePanelOverviewState> {
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
            console.error('[PagePanelOverview] Failed to get alive state or subscribe:', error);
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
    private validatePin = (value: string): boolean => {
        return value === '' || /^[0-9]+$/.test(value);
    };
    // Prüft IP-Adresse (optional, je nach Anforderung)
    private validateIp(ip: string): boolean {
        if (ip === '127.0.0.1') {
            return false;
        }
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) {
            return false;
        }
        const parts = ip.split('.');
        return parts.every(part => {
            const num = parseInt(part, 10);
            return num >= 0 && num <= 255;
        });
    }

    // Handler für Service-Pin-Änderungen mit Validierung
    private handleServicePinChange =
        (key: string) =>
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            const value = event.target.value;

            // Erlaube die Änderung nur, wenn der Wert valide ist
            if (this.validatePin(value)) {
                void this.onChange(key, value);
            }
        };

    // Handler für IP-Adress-Änderungen mit Validierung
    private handleIpChange =
        (key: string) =>
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            const value = event.target.value;

            // Erlaube die Änderung nur, wenn der Wert valide ist
            if (this.validateIp(value)) {
                void this.onChange(key, value);
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
        };

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Beta warning */}
                {this.props.data.useBetaTFT && (
                    <Alert
                        severity="warning"
                        sx={{ mb: 2 }}
                    >
                        {this.getText('useBetaVersionText')}
                    </Alert>
                )}
                <Box
                    component="fieldset"
                    sx={boxStyle}
                >
                    <Typography
                        component="legend"
                        variant="h6"
                    >
                        {this.getText('nsPanelInitLabel')}
                    </Typography>
                    <TextField
                        label={this.getText('internalServerIp')}
                        value={data.internalServerIp ?? ''}
                        onChange={this.handleIpChange('internalServerIp')}
                        disabled={!this.state.alive}
                    />
                    <TextField
                        label={this.getText('ipFromPanel')}
                        value={data._tasmotaIP ?? ''}
                        onChange={this.handleIpChange('_tasmotaIP')}
                        disabled={!this.state.alive}
                    />
                </Box>
            </Box>
        );
    }
}

export default withTheme(PagePanelOverview);
