import React from 'react';
import { withTheme } from '@mui/styles';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import {
    Checkbox,
    FormControlLabel,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
    Typography,
    FormHelperText,
    TextField,
} from '@mui/material';
import { ADAPTER_NAME } from '../../src/lib/types/adminShareConfig';

interface PageGlobalSettingsState extends ConfigGenericState {
    // Define any additional state properties if needed
    useBetaTFT?: boolean;
    colorTheme?: number;
    weatherEntity?: string;
    weekdayFormat?: boolean;
    monthFormat?: number;
    yearFormat?: boolean;
    shutterClosedIsZero?: boolean;
    defaultValueCardThermo?: boolean;
    pw1?: string;
    rememberLastSite?: boolean;
    alive?: boolean;
}

class PageGlobalSettings extends ConfigGeneric<ConfigGenericProps & { theme?: any }, PageGlobalSettingsState> {
    private pagesRetryTimeout?: NodeJS.Timeout;

    constructor(props: ConfigGenericProps & { theme?: any }) {
        super(props);
    }

    componentWillUnmount(): void {
        if (this.pagesRetryTimeout) {
            clearTimeout(this.pagesRetryTimeout);
        }
        // Unsubscribe from alive state changes
        const instance = this.props.oContext.instance ?? '0';
        this.props.oContext.socket.unsubscribeState(
            `system.adapter.${ADAPTER_NAME}.${instance}.alive`,
            this.onAliveChanged,
        );
    }

    async componentDidMount(): Promise<void> {
        super.componentDidMount();

        // Get initial alive state and subscribe to changes
        const instance = this.props.oContext.instance ?? '0';
        const aliveStateId = `system.adapter.${ADAPTER_NAME}.${instance}.alive`;

        try {
            const state = await this.props.oContext.socket.getState(aliveStateId);
            const isAlive = !!state?.val;
            this.setState({ alive: isAlive } as PageGlobalSettingsState);

            // Subscribe to alive state changes
            await this.props.oContext.socket.subscribeState(aliveStateId, this.onAliveChanged);

            // If adapter is alive, start loading pages
            if (isAlive) {
                console.log('[PageGlobalSettings] Adapter is alive, ready to load settings.');
            }
        } catch (error) {
            console.error('[PageGlobalSettings] Failed to get alive state or subscribe:', error);
            this.setState({ alive: false } as PageGlobalSettingsState);
        }
    }

    // Callback for alive state changes
    onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const wasAlive = this.state.alive;
        const isAlive = state ? !!state.val : false;

        if (wasAlive !== isAlive) {
            this.setState({ alive: isAlive } as PageGlobalSettingsState);
        }
    };

    // Generische Handler-Funktion für Checkbox-Änderungen
    private handleCheckboxChange =
        (key: string) =>
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            void this.onChange(key, event.target.checked);
        };

    // Generische Handler-Funktion für Zahl/Number-Änderungen (genutzt für Select-Komponenten da dort value ein number ist)
    private handleNumberChange =
        (key: string) =>
        (event: React.ChangeEvent<{ value: unknown }>): void => {
            void this.onChange(key, event.target.value as number);
        };

    // Generische Handler-Funktion für Text-Änderungen
    private handleTextChange =
        (key: string) =>
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            void this.onChange(key, event.target.value);
        };

    // Validierungsfunktion
    private validateServicePin = (value: string): boolean => {
        // Prüft, ob der String nur aus Ziffern besteht (oder leer ist)
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
        // Lade Werte aus this.props.data (hier werden die Config-Werte gespeichert)
        const data = this.props.data || {};
        const useBetaTFT = data.useBetaTFT ?? false;
        const colorTheme = data.colorTheme ?? 0;
        const weekdayFormat = data.weekdayFormat ?? false;
        const monthFormat = data.monthFormat ?? 0;
        const yearFormat = data.yearFormat ?? false;
        const shutterClosedIsZero = data.shutterClosedIsZero ?? false;
        const defaultValueCardThermo = data.defaultValueCardThermo ?? false;
        const pw1 = data.pw1 ?? '';

        return (
            <Box sx={{ p: 2 }}>
                {/* Use Beta TFT Checkbox */}
                <Box
                    sx={{
                        mb: 3,
                        p: 2,
                        minWidth: 200,
                        maxWidth: 400,
                        border: 2,
                        borderColor: 'divider',
                        borderRadius: 1,
                    }}
                >
                    <Typography
                        variant="h6"
                        gutterBottom
                    >
                        {this.getText('headeruseBetaTFT')}
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={useBetaTFT}
                                    onChange={this.handleCheckboxChange('useBetaTFT')}
                                    disabled={!this.state.alive}
                                />
                            }
                            label={this.getText('useBetaVersion')}
                        />
                    </Box>
                </Box>

                {/* Color Theme Select */}
                <Box
                    sx={{
                        mb: 3,
                        p: 2,
                        minWidth: 200,
                        maxWidth: 400,
                        border: 2,
                        borderColor: 'divider',
                        borderRadius: 1,
                    }}
                >
                    <FormControl
                        sx={{ m: 1, minWidth: 120 }}
                        size="small"
                        disabled={!this.state.alive}
                    >
                        <InputLabel id="color-theme-label">{this.getText('headerColorTheme')}</InputLabel>
                        <Select
                            labelId="color-theme-label"
                            id="color-theme-select"
                            value={colorTheme}
                            label={this.getText('colorTheme')}
                            onChange={this.handleNumberChange('colorTheme') as any}
                        >
                            <MenuItem value={0}>{this.getText('default')}</MenuItem>
                            <MenuItem value={1}>{this.getText('tropical')}</MenuItem>
                            <MenuItem value={2}>{this.getText('technical')}</MenuItem>
                            <MenuItem value={3}>{this.getText('sunset')}</MenuItem>
                            <MenuItem value={4}>{this.getText('vulcano')}</MenuItem>
                            <MenuItem value={5}>{this.getText('userColors')}</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* Date Format Settings */}
                <Box
                    sx={{
                        mb: 3,
                        p: 2,
                        minWidth: 200,
                        maxWidth: 400,
                        border: 2,
                        borderColor: 'divider',
                        borderRadius: 1,
                    }}
                >
                    <Typography
                        variant="h6"
                        gutterBottom
                    >
                        {this.getText('headerDateFormat')}
                    </Typography>
                    {/* Weekday Format Checkbox */}
                    <Box sx={{ mb: 3 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={weekdayFormat}
                                    onChange={this.handleCheckboxChange('weekdayFormat')}
                                    disabled={!this.state.alive}
                                />
                            }
                            label={this.getText('longWeekdayName')}
                        />
                        <FormControl
                            sx={{ m: 1, minWidth: 120 }}
                            size="small"
                            disabled={!this.state.alive}
                        >
                            <InputLabel id="MonthFormat-label">{this.getText('MonthFormat')}</InputLabel>
                            <Select
                                labelId="MonthFormat-label"
                                id="MonthFormat-select"
                                value={monthFormat}
                                label={this.getText('MonthFormat')}
                                onChange={this.handleNumberChange('monthFormat') as any}
                            >
                                <MenuItem value={0}>{this.getText('long')}</MenuItem>
                                <MenuItem value={1}>{this.getText('short')}</MenuItem>
                                <MenuItem value={2}>{this.getText('numeric')}</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={yearFormat}
                                    onChange={this.handleCheckboxChange('yearFormat')}
                                    disabled={!this.state.alive}
                                />
                            }
                            label={this.getText('longYear')}
                        />
                    </Box>
                </Box>

                {/* Shutter Closed Is Zero Checkbox */}
                <Box
                    sx={{
                        mb: 3,
                        p: 2,
                        minWidth: 200,
                        maxWidth: 400,
                        border: 2,
                        borderColor: 'divider',
                        borderRadius: 1,
                    }}
                >
                    <Typography
                        variant="h6"
                        gutterBottom
                    >
                        {this.getText('headerShutter')}
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={shutterClosedIsZero}
                                    onChange={this.handleCheckboxChange('shutterClosedIsZero')}
                                    disabled={!this.state.alive}
                                />
                            }
                            label={this.getText('shutterClosedIsZero')}
                        />
                    </Box>
                </Box>

                {/* Card Thermo2 Value Checkbox */}
                <Box
                    sx={{
                        mb: 3,
                        p: 2,
                        minWidth: 200,
                        maxWidth: 400,
                        border: 2,
                        borderColor: 'divider',
                        borderRadius: 1,
                    }}
                >
                    <Typography
                        variant="h6"
                        gutterBottom
                    >
                        {this.getText('headerCardThermo')}
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={defaultValueCardThermo}
                                    onChange={this.handleCheckboxChange('defaultValueCardThermo')}
                                    disabled={!this.state.alive}
                                />
                            }
                            label={this.getText('defaultValueCardThermo')}
                        />
                        <FormHelperText>{this.getText('defaultValueCardThermoHint')}</FormHelperText>
                    </Box>
                </Box>

                {/* Service Pin Textfeld */}
                <Box
                    sx={{
                        mb: 3,
                        p: 2,
                        minWidth: 200,
                        maxWidth: 400,
                        border: 2,
                        borderColor: 'divider',
                        borderRadius: 1,
                    }}
                >
                    <Typography
                        variant="h6"
                        gutterBottom
                    >
                        Service-Pin
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            id="service-pin-input"
                            type="password"
                            value={pw1}
                            onChange={this.handleServicePinChange}
                            disabled={!this.state.alive}
                            helperText={this.getText('mustBeNumber')}
                            error={!this.validateServicePin(pw1)}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                            }}
                        />
                    </Box>
                </Box>

                {/* Card Thermo2 Value Checkbox */}
                <Box
                    sx={{
                        mb: 3,
                        p: 2,
                        minWidth: 200,
                        maxWidth: 400,
                        border: 2,
                        borderColor: 'divider',
                        borderRadius: 1,
                    }}
                >
                    <Typography
                        variant="h6"
                        gutterBottom
                    >
                        {this.getText('headerRememberLastSite')}
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={defaultValueCardThermo}
                                    onChange={this.handleCheckboxChange('rememberLastSite')}
                                    disabled={!this.state.alive}
                                />
                            }
                            label={this.getText('rememberLastSite')}
                        />
                    </Box>
                </Box>
            </Box>
        );
    }
}

export default withTheme(PageGlobalSettings);
