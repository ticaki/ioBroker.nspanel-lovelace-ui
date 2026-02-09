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
    CircularProgress,
    type SelectChangeEvent,
    Tooltip,
} from '@mui/material';
import { ADAPTER_NAME } from '../../src/lib/types/adminShareConfig';

interface WeatherEntity {
    label: string;
    value: string;
}

interface PageGlobalSettingsState extends ConfigGenericState {
    // Define any additional state properties if needed
    useBetaTFT?: boolean;
    colorTheme?: number;
    weatherEntity?: string;
    weatherEntities?: WeatherEntity[];
    loadingWeather?: boolean;
    lastWeatherLoad?: number;
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
        this.state = {
            ...this.state,
            alive: false,
            weatherEntities: [],
            loadingWeather: false,
        };
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
            this.setState({ alive: isAlive });

            // Subscribe to alive state changes
            await this.props.oContext.socket.subscribeState(aliveStateId, this.onAliveChanged);

            // If adapter is alive, start loading pages
            if (isAlive) {
                await this.loadWeatherEntities(false);
            }
        } catch (error) {
            console.error('[PageGlobalSettings] Failed to get alive state or subscribe:', error);
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

    // Lade Wetter-Entities
    async loadWeatherEntities(forceReload = false): Promise<void> {
        if (!this.state.alive) {
            return;
        }

        const now = Date.now();
        const lastLoad = this.state.lastWeatherLoad || 0;

        if (!forceReload && now - lastLoad < 60000 && this.state.weatherEntities?.length) {
            console.log('[PageGlobalSettings] Using cached weather entities, last load:', new Date(lastLoad));
            return;
        }

        console.log('[PageGlobalSettings] Loading weather entities, forceReload:', forceReload);
        this.setState({ loadingWeather: true });

        if (this.props.oContext.socket) {
            const instance = this.props.oContext.instance ?? '0';
            const target = `${ADAPTER_NAME}.${instance}`;
            const payload = {
                internalServerIp: this.props.data?.internalServerIp,
            };

            try {
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('sendTo timeout after 2 seconds')), 2000);
                });

                const sendToPromise = this.props.oContext.socket.sendTo(target, 'getWeatherEntity', payload);

                const raw = await Promise.race([sendToPromise, timeoutPromise]);

                let entities: WeatherEntity[] = [];
                if (Array.isArray(raw)) {
                    entities = raw;
                } else if (raw && Array.isArray(raw.result)) {
                    entities = raw.result;
                }

                console.log('[PageGlobalSettings] sendTo successful', { target, entities });

                this.setState({
                    weatherEntities: entities,
                    lastWeatherLoad: now,
                    loadingWeather: false,
                });
            } catch (e) {
                console.error('[PageGlobalSettings] Failed to load weather entities', {
                    target,
                    cmd: 'getWeatherEntity',
                    payload,
                    error: e,
                });
                this.setState({
                    weatherEntities: [],
                    loadingWeather: false,
                });
            }
        }
    }
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
        const rememberLastSite = data.rememberLastSite ?? false;
        const weatherEntity = data.weatherEntity ?? '';

        // Expert Mode from props (provided by json-config system)
        const isExpertMode = this.props.expertMode ?? false;

        // Gemeinsame Styles für alle Boxen
        const boxStyle = {
            p: 2,
            border: 2,
            borderColor: 'divider',
            borderRadius: 1,
            height: '100%',
        };

        return (
            <Box
                sx={{
                    p: 2,
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr', // Mobile: 1 Spalte
                        sm: 'repeat(2, 1fr)', // Tablet: 2 Spalten
                        md: 'repeat(2, 1fr)', // Desktop: 2 Spalten
                        lg: 'repeat(3, 1fr)', // Large Desktop: 3 Spalten
                    },
                    gap: 2,
                    width: '100%',
                }}
            >
                {/* Use Beta TFT Checkbox */}
                <Box
                    sx={{
                        ...boxStyle,
                        borderColor: useBetaTFT ? 'error.main' : 'divider',
                    }}
                >
                    <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ color: useBetaTFT ? 'error.main' : 'inherit' }}
                    >
                        {this.getText('headeruseBetaTFT')}
                    </Typography>
                    <Tooltip
                        title={this.getText('useBetaVersionTooltip')}
                        arrow
                        placement="top"
                    >
                        <span>
                            <FormControlLabel
                                sx={{ color: useBetaTFT ? 'error.main' : 'inherit' }}
                                control={
                                    <Checkbox
                                        checked={useBetaTFT}
                                        onChange={this.handleCheckboxChange('useBetaTFT')}
                                        disabled={!this.state.alive || !isExpertMode}
                                    />
                                }
                                label={this.getText('useBetaVersion')}
                            />
                        </span>
                    </Tooltip>
                </Box>

                {/* Color Theme Select */}
                <Box sx={boxStyle}>
                    <Typography
                        variant="h6"
                        gutterBottom
                    >
                        {this.getText('headerColorTheme')}
                    </Typography>
                    <FormControl
                        sx={{ m: 1, minWidth: 120 }}
                        size="small"
                        disabled={!this.state.alive}
                    >
                        <Select
                            id="color-theme-select"
                            value={colorTheme}
                            label={this.getText('colorTheme')}
                            onChange={this.handleSelectNumberChange('colorTheme')}
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

                {/* Weather Entity TextField */}
                <Box sx={boxStyle}>
                    <Typography
                        variant="h6"
                        gutterBottom
                    >
                        {this.getText('headerWeatherEntity')}
                    </Typography>
                    <FormControl
                        sx={{ m: 1, minWidth: 200 }}
                        size="small"
                        disabled={!this.state.alive}
                    >
                        <InputLabel id="weather-entity-label">{this.getText('weatherEntityLabel')}</InputLabel>
                        <Select
                            labelId="weather-entity-label"
                            id="weather-entity-select"
                            value={weatherEntity}
                            label={this.getText('weatherEntityLabel')}
                            onOpen={() => {
                                // Lade Daten wenn Select geöffnet wird
                                void this.loadWeatherEntities(true);
                            }}
                            onChange={this.handleSelectStringChange('weatherEntity')}
                            disabled={!this.state.alive || this.state.loadingWeather}
                        >
                            {this.state.loadingWeather && (
                                <MenuItem
                                    disabled
                                    value=""
                                >
                                    <CircularProgress size={16} />
                                </MenuItem>
                            )}
                            {(this.state.weatherEntities || []).map(entity => (
                                <MenuItem
                                    key={entity.value || entity.label}
                                    value={entity.value}
                                >
                                    {entity.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* Date Format Settings */}
                <Box sx={boxStyle}>
                    <Typography
                        variant="h6"
                        gutterBottom
                    >
                        {this.getText('headerDateFormat')}
                    </Typography>
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
                            onChange={this.handleSelectNumberChange('monthFormat')}
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

                {/* Shutter Closed Is Zero Checkbox */}
                <Box sx={boxStyle}>
                    <Typography
                        variant="h6"
                        gutterBottom
                    >
                        {this.getText('headerShutter')}
                    </Typography>
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

                {/* Card Thermo2 Value Checkbox */}
                <Box sx={boxStyle}>
                    <Typography
                        variant="h6"
                        gutterBottom
                    >
                        {this.getText('headerCardThermo')}
                    </Typography>
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

                {/* Service Pin Textfeld */}
                <Box sx={boxStyle}>
                    <Typography
                        variant="h6"
                        gutterBottom
                    >
                        Service-Pin
                    </Typography>
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

                {/* Remember Last Site Checkbox */}
                <Box sx={boxStyle}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={rememberLastSite}
                                onChange={this.handleCheckboxChange('rememberLastSite')}
                                disabled={!this.state.alive}
                            />
                        }
                        label={this.getText('rememberLastSite')}
                    />
                </Box>
            </Box>
        );
    }
}

export default withTheme(PageGlobalSettings);
