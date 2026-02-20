import React from 'react';
import { withTheme } from '@mui/styles';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import {
    Alert,
    //Checkbox,
    //FormControlLabel,
    Box,
    Select,
    TextField,
    MenuItem,
    CircularProgress,
    InputLabel,
    Typography,
    type SelectChangeEvent,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
} from '@mui/material';

interface PanelInfo {
    _id?: string;
    _ip?: string;
    _name?: string;
    _topic?: string;
    _model?: string;
}

interface TimezoneEntity {
    value: string;
    label: string;
}

interface PagePanelOverviewState extends ConfigGenericState {
    // Define any additional state properties if needed
    timezoneEntities?: TimezoneEntity[];
    loadingTimezone?: boolean;
    lastTimezoneLoad?: number;
    // State for alive status of the adapter
    alive: boolean;
    // State for confirmation dialog
    showConfirm: boolean;
    processing: boolean;

    error: string | null;
    panels: PanelInfo[];
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
            timezoneEntities: [],
            lastTimezoneLoad: 0,
            showConfirm: false,
            processing: false,
            error: null,
            panels: [],
        };
    }
    // Bereinige Ressourcen und Abonnements beim Unmounten
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
    // Lade Timezone-Entities beim Mounten und abonniere Alive-Status
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
            this.setState({ alive: false, error: String(error) });
        }
    }
    // Callback for alive state changes
    onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const wasAlive = this.state.alive;
        const isAlive = state ? !!state.val : false;

        if (wasAlive !== isAlive) {
            this.setState({ alive: isAlive, error: isAlive ? null : this.getText('adapterNotAlive') });
        }
    };
    // Lade Timezone-Entities
    async loadTimezoneEntities(forceReload = false): Promise<void> {
        if (!this.state.alive) {
            return;
        }

        const now = Date.now();
        const lastLoad = this.state.lastTimezoneLoad || 0;

        if (!forceReload && now - lastLoad < 60000 && this.state.timezoneEntities?.length) {
            console.log('[PagePanelOverview] Using cached timezone entities, last load:', new Date(lastLoad));
            return;
        }

        console.log('[PagePanelOverview] Loading timezone entities, forceReload:', forceReload);
        this.setState({ loadingTimezone: true, error: null });

        if (this.props.oContext.socket) {
            const target = `${this.adapterName}.${this.instance}`;
            const payload = {
                ip: this.props.data?.internalServerIp,
            };

            try {
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('sendTo timeout after 2 seconds')), 2000);
                });

                const sendToPromise = this.props.oContext.socket.sendTo(target, 'getTimeZones', payload);

                const raw = await Promise.race([sendToPromise, timeoutPromise]);

                let entities: TimezoneEntity[] = [];
                if (Array.isArray(raw)) {
                    entities = raw;
                } else if (raw && Array.isArray(raw.result)) {
                    entities = raw.result;
                }

                console.log('[PagePanelOverview] sendTo successful', { target, entities });

                this.setState({
                    timezoneEntities: entities,
                    lastTimezoneLoad: now,
                    loadingTimezone: false,
                });
            } catch (e) {
                console.error('[PagePanelOverview] Failed to load timezone entities', {
                    target,
                    cmd: 'getTimeZones',
                    payload,
                    error: e,
                });
                this.setState({
                    timezoneEntities: [],
                    loadingTimezone: false,
                    error: String(e),
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
    // Prüft, ob der String nur aus Ziffern besteht (oder leer ist)
    private validatePin = (value: string): boolean => {
        return value === '' || /^[0-9]+$/.test(value);
    };
    // Prüft, ob die IP-Eingabe erlaubt ist (während des Tippens)
    private isValidIpInput(ip: string): boolean {
        if (ip === '') {
            return true; // Leeres Feld erlauben
        }
        // Erlaube nur Ziffern und Punkte
        if (!/^[\d.]*$/.test(ip)) {
            return false;
        }
        // Prüfe, dass nicht mehr als 3 Punkte vorhanden sind
        if (ip.split('.').length > 4) {
            return false;
        }
        // Prüfe, dass keine Zahlen über 255 vorkommen
        const parts = ip.split('.');
        return parts.every(part => {
            if (part === '') {
                return true; // Leere Teile während des Tippens erlauben
            }
            const num = parseInt(part, 10);
            return !isNaN(num) && num <= 255;
        });
    }
    // Prüft, ob die IP vollständig und gültig ist (für Fehleranzeige)
    private isValidCompleteIp(ip: string): boolean {
        if (ip === '127.0.0.1') {
            // Verwerfe localhost IPs
            return false;
        }
        if (ip === '') {
            return true; // Leeres Feld ist ok
        }
        const parts = ip.split('.');
        if (parts.length !== 4) {
            return false;
        }
        return parts.every(part => {
            const num = parseInt(part, 10);
            return !isNaN(num) && num >= 0 && num <= 255;
        });
    }
    // Validiert das Topic-Format (mindestens 4 Zeichen, beginnt mit Buchstabe, gefolgt von Buchstaben, Zahlen, Unterstrichen oder Schrägstrichen)
    private validateTopic(topic: string): boolean {
        if (!topic || topic.length < 4) {
            return false;
        }
        return /^[a-zA-Z][\w/]+$/.test(topic);
    }
    // Prüft, ob alle erforderlichen Felder gültig sind, um den Init/Update-Button zu aktivieren
    private isFormValid(): boolean {
        const data = this.props.data;

        return (
            !!data._tasmotaIP &&
            this.isValidCompleteIp(data._tasmotaIP) &&
            !!data._tasmotaTopic &&
            this.validateTopic(data._tasmotaTopic) &&
            !!data._tasmotaName &&
            data.nsPanelModel != null &&
            (!!data.mqttServer || !!data.mqttIp) &&
            !!data.mqttPort &&
            !!data.mqttUsername &&
            !!data.mqttPassword &&
            (!data.mqttServer || (!!data.internalServerIp && this.isValidCompleteIp(data.internalServerIp)))
        );
    }
    // Prüft, ob das Panel bereits konfiguriert ist (basierend auf dem Topic)
    private isPanelAlreadyConfigured(): boolean {
        const panels = this.props.data.panels || [];
        return panels.findIndex((panel: any) => panel.topic === this.props.data._tasmotaTopic) !== -1;
    }
    // Öffnet den Bestätigungsdialog für die Initialisierung
    private handleInitClick = (): void => {
        this.setState({ showConfirm: true });
    };
    // Schließt den Bestätigungsdialog ohne Aktion
    private handleConfirmClose = (): void => {
        this.setState({ showConfirm: false });
    };
    // Startet die Initialisierung nach Bestätigung
    private handleConfirmStart = async (): Promise<void> => {
        this.setState({ showConfirm: false, processing: true });

        try {
            const payload = {
                tasmotaName: this.props.data._tasmotaName,
                tasmotaIP: this.props.data._tasmotaIP,
                tasmotaTopic: this.props.data._tasmotaTopic,
                mqttServer: this.props.data.mqttServer,
                mqttIp: this.props.data.mqttIp,
                mqttPort: this.props.data.mqttPort,
                mqttUsername: this.props.data.mqttUsername,
                mqttPassword: this.props.data.mqttPassword,
                internalServerIp: this.props.data.internalServerIp,
                useBetaTFT: this.props.data.useBetaTFT,
                model: this.props.data.nsPanelModel,
            };

            await this.props.oContext.socket.sendTo(`${this.adapterName}.${this.instance}`, 'nsPanelInit', payload);

            this.setState({ processing: false });
        } catch (error) {
            console.error('[PageNSPanelOverview] Init failed:', error);
            this.setState({ processing: false });
        }
    };
    // Handler für Service-Pin-Änderungen mit Validierung
    private handlePinChange =
        (key: string) =>
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            const value = event.target.value;

            // Erlaube die Änderung nur, wenn der Wert valide ist
            if (this.validatePin(value)) {
                void this.onChange(key, value);
            }
        };
    // Handler für IP-Adress-Änderungen mit Validierung während der Eingabe
    private handleIpChange =
        (key: string) =>
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            const value = event.target.value;

            // Erlaube die Eingabe, wenn sie während des Tippens valide ist
            if (this.isValidIpInput(value)) {
                void this.onChange(key, value);
                // Prüfe Validierung und setze Fehler
                this.checkValidation(key, value);
            }
        };
    // Prüft die Validierung und setzt Fehler
    private checkValidation(key: string, value: string): void {
        const data = this.props.data || {};
        const tempData = { ...data, [key]: value };

        // Prüfe und setze Fehler für internalServerIp
        if (tempData.internalServerIp && !this.isValidCompleteIp(tempData.internalServerIp)) {
            this.props.onError('internalServerIp', this.getText('mustBeIp'));
        } else {
            this.props.onError('internalServerIp');
        }

        // Prüfe und setze Fehler für _tasmotaIP
        if (tempData._tasmotaIP && !this.isValidCompleteIp(tempData._tasmotaIP)) {
            this.props.onError('_tasmotaIP', this.getText('mustBeIp'));
        } else {
            this.props.onError('_tasmotaIP');
        }

        // Prüfe und setze Fehler für _tasmotaTopic
        if (tempData._tasmotaTopic && !this.validateTopic(tempData._tasmotaTopic)) {
            this.props.onError('_tasmotaTopic', this.getText('invalidTopic'));
        } else {
            this.props.onError('_tasmotaTopic');
        }
    }

    private async handleOpenTasmotaConsole(panel: PanelInfo): Promise<void> {
        try {
            const result = await this.props.oContext.socket.sendTo(
                `${this.adapterName}.${this.instance ?? '0'}`,
                'openTasmotaConsole',
                { ip: panel._ip },
            );

            if (result && typeof result === 'object' && 'openUrl' in result) {
                window.open(result.openUrl as string, '_blank');
            }
        } catch (err) {
            this.setState({ error: String(err) });
        }
    }

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        // Expert Mode from props (provided by json-config system)
        //const isExpertMode = this.props.expertMode ?? false;

        // Lade Werte aus this.props.data (hier werden die Config-Werte gespeichert)
        const data = this.props.data || {};
        const isUpdate = this.isPanelAlreadyConfigured();
        const panels: PanelInfo[] = data.panels || [];

        // Setze Standardwert für nsPanelModel, falls nicht vorhanden (EU als Standard)
        const panelModel = data.nsPanelModel ?? '';

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
                {/* Link to wiki */}
                <Box sx={{ mb: 2 }}>
                    <Button
                        variant="text"
                        color="primary"
                        href="https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki/Adapter-Installation"
                        target="_blank"
                        sx={{ color: 'red' }}
                    >
                        {this.getText('openLinkAdapterInsatllation')}
                    </Button>
                </Box>
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
                    {/* IP-Adresse des internen Servers */}
                    {data.mqttServer && (
                        <TextField
                            sx={{ m: 1, minWidth: 200 }}
                            size="small"
                            disabled={!this.state.alive}
                            variant="standard"
                            label={this.getText('internalServerIp')}
                            value={data.internalServerIp ?? ''}
                            onChange={this.handleIpChange('internalServerIp')}
                            error={!!data.internalServerIp && !this.isValidCompleteIp(data.internalServerIp)}
                            helperText={
                                !!data.internalServerIp && !this.isValidCompleteIp(data.internalServerIp)
                                    ? this.getText('mustBeIp')
                                    : ''
                            }
                        />
                    )}
                    <TextField
                        sx={{ m: 1, minWidth: 200 }}
                        variant="standard"
                        size="small"
                        disabled={!this.state.alive}
                        label={this.getText('ipFromPanel')}
                        value={data._tasmotaIP ?? ''}
                        onChange={this.handleIpChange('_tasmotaIP')}
                        error={!!data._tasmotaIP && !this.isValidCompleteIp(data._tasmotaIP)}
                        helperText={
                            !!data._tasmotaIP && !this.isValidCompleteIp(data._tasmotaIP)
                                ? this.getText('mustBeIp')
                                : ''
                        }
                    />
                    <TextField
                        sx={{ m: 1, minWidth: 200 }}
                        size="small"
                        disabled={!this.state.alive}
                        variant="standard"
                        label={this.getText('panelName')}
                        value={data._tasmotaName ?? ''}
                        onChange={this.handleTextChange('_tasmotaName')}
                    />
                    <TextField
                        sx={{ m: 1, minWidth: 200 }}
                        size="small"
                        disabled={!this.state.alive}
                        variant="standard"
                        label={this.getText('panelTopic')}
                        value={data._tasmotaTopic ?? ''}
                        onChange={this.handleTextChange('_tasmotaTopic')}
                        error={!!data._tasmotaTopic && !this.validateTopic(data._tasmotaTopic)}
                    />
                    {/* Panel Model Select */}
                    <FormControl
                        sx={{ m: 1, minWidth: 200 }}
                        size="small"
                        disabled={!this.state.alive}
                        variant="standard"
                    >
                        <InputLabel id="panelmodel-label">{this.getText('nsPanelModel')}</InputLabel>
                        <Select
                            labelId="panelmodel-label"
                            id="panelmodel-select"
                            label={this.getText('nsPanelModel')}
                            value={panelModel}
                            onChange={this.handleSelectStringChange('nsPanelModel')}
                        >
                            <MenuItem value="">{this.getText('eu-Version')}</MenuItem>
                            <MenuItem value="us-l">{this.getText('us-l-Version')}</MenuItem>
                            <MenuItem value="us-p">{this.getText('us-p-Version')}</MenuItem>
                        </Select>
                    </FormControl>
                    {/* Timezone Select - wird nur angezeigt, wenn die Daten geladen wurden oder gerade geladen werden */}
                    <FormControl
                        sx={{ m: 1, minWidth: 200 }}
                        size="small"
                        disabled={!this.state.alive || this.state.loadingTimezone}
                        variant="standard"
                    >
                        <InputLabel id="timezone-label">{this.getText('timezone')}</InputLabel>
                        <Select
                            labelId="timezone-label"
                            id="timezone-select"
                            value={data.timezone ?? ''}
                            label={this.getText('timezone')}
                            onOpen={() => {
                                // Lade Daten wenn Select geöffnet wird
                                void this.loadTimezoneEntities(true);
                            }}
                            onChange={this.handleSelectStringChange('timezone')}
                        >
                            {this.state.loadingTimezone && (
                                <MenuItem
                                    disabled
                                    value=""
                                >
                                    <CircularProgress size={16} />
                                </MenuItem>
                            )}
                            {(this.state.timezoneEntities || []).map(entity => (
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
                {/* Init/Update Button */}
                <Button
                    variant="contained"
                    fullWidth
                    onClick={this.handleInitClick}
                    disabled={!this.state.alive || !this.isFormValid() || this.state.processing}
                    sx={{ mt: 2 }}
                >
                    {this.state.processing ? (
                        <CircularProgress size={24} />
                    ) : isUpdate ? (
                        this.getText('nsPanelUpdate')
                    ) : (
                        this.getText('nsPanelInit')
                    )}
                </Button>

                {/* Panels as Boxes */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {panels.map((panel, index) => {
                        return (
                            <Box
                                key={panel._id || index}
                                sx={{
                                    width: 'fit-content',
                                    maxWidth: '100%',
                                    minWidth: 320,
                                    border: 3,
                                    opacity: !this.state.alive ? 0.6 : 1,
                                    p: 2,
                                    borderRadius: 1,
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{
                                        mb: 2,
                                    }}
                                >
                                    {panel._name}
                                </Typography>

                                {/* Version Info with Flexbox */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {/* mac */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                        <TextField
                                            label={this.getText('macAdressOfPanel')}
                                            value={panel._id}
                                            slotProps={{ input: { readOnly: true } }}
                                            size="small"
                                            sx={{ flex: '1 1 250px', minWidth: 200, maxWidth: 300 }}
                                        />
                                    </Box>

                                    {/* ip - Address */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                        <TextField
                                            label={this.getText('ipFromPanel')}
                                            value={panel._ip}
                                            slotProps={{ input: { readOnly: true } }}
                                            size="small"
                                            sx={{ flex: '1 1 250px', minWidth: 200, maxWidth: 300 }}
                                        />
                                    </Box>

                                    {/* topic */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                        <TextField
                                            label={this.getText('panelTopic')}
                                            value={panel._topic}
                                            slotProps={{ input: { readOnly: true } }}
                                            size="small"
                                            sx={{ flex: '1 1 250px', minWidth: 200, maxWidth: 300 }}
                                        />
                                    </Box>

                                    {/* Model*/}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                        <TextField
                                            label={this.getText('panelModel')}
                                            value={panel._model}
                                            slotProps={{ input: { readOnly: true } }}
                                            size="small"
                                            sx={{ flex: '1 1 250px', minWidth: 200, maxWidth: 300 }}
                                        />
                                    </Box>

                                    {/* Console Button */}
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={() => this.handleOpenTasmotaConsole(panel)}
                                        disabled={!panel._ip || !this.state.alive}
                                        size="small"
                                        sx={{ mt: 1 }}
                                    >
                                        {this.getText('openTasmotaConsole')}
                                    </Button>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>

                {/* Confirm Dialog */}
                <Dialog
                    open={this.state.showConfirm}
                    onClose={this.handleConfirmClose}
                >
                    <DialogTitle>{isUpdate ? this.getText('nsPanelUpdate') : this.getText('nsPanelInit')}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {isUpdate
                                ? this.getText('NSPanel_configuration_update_text')
                                : this.getText('NSPanel_configuration_text')}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleConfirmClose}>{this.getText('Cancel')}</Button>
                        <Button
                            onClick={this.handleConfirmStart}
                            variant="contained"
                            autoFocus
                        >
                            {this.getText('Start')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    }
}

export default withTheme(PagePanelOverview);
