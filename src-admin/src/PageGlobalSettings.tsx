import React from 'react';
import { withTheme } from '@mui/styles';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { Checkbox, FormControlLabel, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
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

    private handleUseBetaTFTChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const useBetaTFT = event.target.checked;
        // Verwende this.props.data für den aktuellen Config-Wert
        void this.onChange('useBetaTFT', useBetaTFT);
    };

    private handleColorThemeChange = (event: React.ChangeEvent<{ value: unknown }>): void => {
        const colorTheme = event.target.value as number;
        // Verwende this.props.data für den aktuellen Config-Wert
        void this.onChange('colorTheme', colorTheme);
    };

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        // Lade Werte aus this.props.data (hier werden die Config-Werte gespeichert)
        const data = this.props.data || {};
        const useBetaTFT = data.useBetaTFT ?? false;
        const colorTheme = data.colorTheme ?? 0;

        return (
            <Box sx={{ p: 2 }}>
                {/* Use Beta TFT Checkbox */}
                <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={useBetaTFT}
                                onChange={this.handleUseBetaTFTChange}
                                disabled={!this.state.alive}
                            />
                        }
                        label={this.getText('useBetaVersion')}
                    />
                </Box>

                {/* Color Theme Select */}
                <Box sx={{ mb: 3, minWidth: 200 }}>
                    <FormControl
                        fullWidth
                        disabled={!this.state.alive}
                    >
                        <InputLabel id="color-theme-label">{this.getText('headerColorTheme')}</InputLabel>
                        <Select
                            labelId="color-theme-label"
                            id="color-theme-select"
                            value={colorTheme}
                            label={this.getText('colorTheme')}
                            onChange={this.handleColorThemeChange as any}
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
            </Box>
        );
    }
}

export default withTheme(PageGlobalSettings);
