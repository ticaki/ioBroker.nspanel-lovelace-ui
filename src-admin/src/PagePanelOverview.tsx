import React from 'react';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import {
    Alert,
    //Checkbox,
    //FormControlLabel,
    Autocomplete,
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
    IconButton,
    Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AddIcon from '@mui/icons-material/Add';
import {
    defaultWebLinkSettings,
    loadWebLinkSettings,
    openWebPanel,
    webHostOf,
    webLinkSettingsOf,
    webPanelUrl,
    type WebLinkSettings,
} from './webPanelUrl';
import ConfigIP from './components/ConfigIP';
import { PanelStatusBadge } from './components/PanelStatusBadge';
import { resolveTasmotaTimeZone, uniqueTasmotaTimeZones, type TasmotaTimeZone } from './tasmotaTimeZones';

interface PanelConfig {
    id?: string;
    ip?: string;
    name?: string;
    topic?: string;
    model?: string;
    /** missing = tasmota; a web panel (`kind: 'web'`) has no hardware behind it */
    kind?: 'tasmota' | 'web';
}

/** the three hardware models a panel (and a web panel) can have */
const panelModels = ['eu', 'us-l', 'us-p'] as const;
type PanelModel = (typeof panelModels)[number];

function isPanelModel(value: unknown): value is PanelModel {
    return typeof value === 'string' && (panelModels as readonly string[]).includes(value);
}

/**
 * The topic of a web panel becomes its URL path (`http(s)://<host>:<port>/<topic>`): letters, digits,
 * `_`, `-` and `/` as separator between non-empty segments.
 */
const WEB_PANEL_TOPIC_PATTERN = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*$/;

/** first path segments the web server uses itself, see `web-server.ts` */
const WEB_PANEL_RESERVED_SEGMENTS: ReadonlySet<string> = new Set(['assets', 'fonts', 'icons', 'auth', 'ws']);

/**
 * `web_` + 12 random lower-case hex characters, unique within the given panels.
 *
 * @param panels existing panels, their ids are avoided
 */
function newWebPanelId(panels: PanelConfig[]): string {
    const bytes = new Uint8Array(6);
    for (;;) {
        crypto.getRandomValues(bytes);
        const id = `web_${Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')}`;
        if (!panels.some(p => p.id === id)) {
            return id;
        }
    }
}

/** form of the dialog that creates or edits a web panel */
interface WebPanelDialogState {
    open: boolean;
    /** id of the web panel being edited, null = a new one */
    editId: string | null;
    name: string;
    topic: string;
    model: PanelModel;
}

const closedWebPanelDialog: WebPanelDialogState = { open: false, editId: null, name: '', topic: '', model: 'eu' };

/** Antwort eines der drei Einrichtungsschritte, siehe `runInitStep` */
interface InitStepAnswer {
    /** Übersetzungsschlüssel des Fehlers, wenn der Schritt fehlgeschlagen ist */
    error?: string;
    /** Übersetzungsschlüssel des Meilensteins */
    result?: string;
    /** Nummer des Schritts */
    step?: number;
    /** nur der letzte Schritt liefert die Panelliste */
    native?: { panels?: PanelConfig[] };
    /** true, wenn die Konfiguration gespeichert werden soll */
    saveConfig?: boolean;
}

/**
 * Prüft, ob die Antwort des Adapters die erwartete Form hat.
 *
 * @param value - die Antwort aus `sendTo`
 * @returns true, wenn es ein Objekt ist - bei einem Timeout ist es der String `timeout`
 */
function isInitStepAnswer(value: unknown): value is InitStepAnswer {
    return !!value && typeof value === 'object';
}

interface PagePanelOverviewState extends ConfigGenericState {
    /** host, port, https, PIN of the web panel server of the instance (see `loadWebLinkSettings`) */
    webLink: WebLinkSettings;
    // Define any additional state properties if needed
    // Aktuelle Eingabe im Zeitzonen-Autocomplete und die dazu passenden Treffer
    timezoneInput: string;
    filteredTimezones: TasmotaTimeZone[];
    // State for alive status of the adapter
    alive: boolean;
    // State for confirmation dialog
    showConfirm: boolean;
    processing: boolean;
    // Meilenstein des zuletzt abgeschlossenen Einrichtungsschritts
    progressMessage: string;

    error: string | null;
    panels: PanelConfig[];
    // State for delete dialog
    showDeleteConfirm: boolean;
    panelToDelete: PanelConfig | null;
    // State for success dialog
    showSuccessConfirm: boolean;
    successMessage: string;
    pendingPanels: PanelConfig[] | null;
    // Map of panel IDs to their online status
    panelOnlineStates: Record<string, boolean>;
    // State for blink animation
    isBlinking: boolean;
    // Lokale Kopien der Tasmota-Eingabefelder (verhindert Cursor-Sprünge)
    localTasmotaIP: string;
    localTasmotaName: string;
    localTasmotaTopic: string;
    localTimezone: string;
    // State für Message Dialog
    showMessageConfirm: boolean;
    /** dialog to create or edit a web panel (kind 'web') */
    webPanelDialog: WebPanelDialogState;
}

class PagePanelOverview extends ConfigGeneric<ConfigGenericProps & { theme?: any }, PagePanelOverviewState> {
    private pagesRetryTimeout?: NodeJS.Timeout;
    private blinkTimeout?: NodeJS.Timeout;
    private instance = this.props.oContext.instance ?? '0';
    private adapterName = this.props.oContext.adapterName;

    constructor(props: ConfigGenericProps & { theme?: any }) {
        super(props);
        // Gespeichert wird der Name der Zeitzone; ältere Konfigurationen halten den Tasmota-Befehl
        const timezone = resolveTasmotaTimeZone(props.data.timezone ?? '')?.label ?? '';
        this.state = {
            ...this.state,
            alive: false,
            showConfirm: false,
            processing: false,
            progressMessage: '',
            error: null,
            panels: [],
            showDeleteConfirm: false,
            panelToDelete: null,
            showSuccessConfirm: false,
            successMessage: '',
            pendingPanels: null,
            panelOnlineStates: {},
            isBlinking: false,
            localTasmotaIP: props.data._tasmotaIP ?? '',
            localTasmotaName: props.data._tasmotaName ?? '',
            localTasmotaTopic: props.data._tasmotaTopic ?? '',
            localTimezone: timezone,
            timezoneInput: timezone,
            filteredTimezones: PagePanelOverview.filterTimezones(''),
            showMessageConfirm: false,
            webPanelDialog: closedWebPanelDialog,
            webLink: webLinkSettingsOf(props.data, defaultWebLinkSettings()),
        };
    }

    /**
     * Link settings for the web panels: the (possibly unsaved) instance configuration in
     * `props.data` wins, the loaded settings fill in the host.
     */
    private webLink(): WebLinkSettings {
        return webLinkSettingsOf(this.props.data, this.state.webLink);
    }

    private loadWebLink(): void {
        void loadWebLinkSettings(this.props.oContext.socket, this.adapterName, this.instance, this.props.data).then(
            settings => this.setState({ webLink: settings }),
        );
    }
    // Bereinige Ressourcen und Abonnements beim Unmounten
    componentWillUnmount(): void {
        if (this.pagesRetryTimeout) {
            clearTimeout(this.pagesRetryTimeout);
        }
        if (this.blinkTimeout) {
            clearTimeout(this.blinkTimeout);
        }
        // Remove visibility change listener
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        // Unsubscribe from alive state changes
        this.props.oContext.socket.unsubscribeState(
            `system.adapter.${this.adapterName}.${this.instance}.alive`,
            this.onAliveChanged,
        );
        // Unsubscribe from panel online state changes
        for (const panel of this.props.data.panels || []) {
            this.props.oContext.socket.unsubscribeState(
                `${this.adapterName}.${this.instance}.panels.${panel.id}.info.isOnline`,
                this.onPanelOnlineChanged,
            );
        }
    }
    // Lade Timezone-Entities beim Mounten und abonniere Alive-Status
    async componentDidMount(): Promise<void> {
        void super.componentDidMount();
        this.loadWebLink();

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

        try {
            for (const panel of this.props.data.panels) {
                // nspanel-lovelace-ui.0.panels.7C_87_CE_C6_1B_74.info.isOnline
                console.log(`[PagePanelOverview] Subscribing to online state for panel ${panel.name} (${panel.id})`);
                await this.props.oContext.socket.subscribeState(
                    `${this.adapterName}.${this.instance}.panels.${panel.id}.info.isOnline`,
                    this.onPanelOnlineChanged,
                );
            }
        } catch (error) {
            console.error('[PagePanelOverview] Failed to subscribe to panel online states:', error);
        }

        // Listen for visibility changes to refresh states when tab becomes visible again
        document.addEventListener('visibilitychange', this.onVisibilityChange);
    }

    // Synchronisiert props.data.timezone → localTimezone, sobald der Wert über Props hereinkommt
    componentDidUpdate(prevProps: ConfigGenericProps & { theme?: any }): void {
        // a changed host name in the instance configuration re-resolves the host of the links
        if (webHostOf(prevProps.data) !== webHostOf(this.props.data)) {
            this.loadWebLink();
        }
        const prevTz = resolveTasmotaTimeZone(prevProps.data?.timezone ?? '')?.label ?? '';
        const nextTz = resolveTasmotaTimeZone(this.props.data?.timezone ?? '')?.label ?? '';
        // Sync wenn sich der Prop-Wert ändert ODER wenn localTimezone noch leer ist
        // aber bereits ein Wert vorhanden ist (In-Place-Mutation von props.data)
        if (
            (prevTz !== nextTz || (this.state.localTimezone === '' && nextTz !== '')) &&
            this.state.localTimezone !== nextTz &&
            nextTz !== ''
        ) {
            this.setState({ localTimezone: nextTz, timezoneInput: nextTz });
        }
    }

    // Handler für Visibility-Änderungen (Browser-Tab erhält wieder Fokus)
    private onVisibilityChange = (): void => {
        if (document.visibilityState === 'visible') {
            console.log('[PagePanelOverview] Tab became visible - refreshing states');
            void this.refreshStates();
        }
    };

    // Methode zum Aktualisieren der States nach Fokus-Wiedererlannung
    private async refreshStates(): Promise<void> {
        // Alive-Status neu laden
        const aliveStateId = `system.adapter.${this.adapterName}.${this.instance}.alive`;
        try {
            const state = await this.props.oContext.socket.getState(aliveStateId);
            const isAlive = !!state?.val;
            if (this.state.alive !== isAlive) {
                this.setState({ alive: isAlive, error: isAlive ? null : this.getText('adapterNotAlive') });
            }
        } catch (error) {
            console.error('[PagePanelOverview] Failed to refresh alive state:', error);
        }

        // Panel-Online-Stati neu laden
        try {
            const newPanelStates: Record<string, boolean> = {};
            for (const panel of this.props.data.panels || []) {
                const panelStateId = `${this.adapterName}.${this.instance}.panels.${panel.id}.info.isOnline`;
                const state = await this.props.oContext.socket.getState(panelStateId);
                const isOnline = !!state?.val;
                newPanelStates[panel.id!] = isOnline;
            }

            // Nur State aktualisieren wenn es Änderungen gibt
            const hasChanges = Object.keys(newPanelStates).some(
                panelId => this.state.panelOnlineStates[panelId] !== newPanelStates[panelId],
            );

            if (hasChanges) {
                this.setState({ panelOnlineStates: newPanelStates });
            }
        } catch (error) {
            console.error('[PagePanelOverview] Failed to refresh panel online states:', error);
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

    // Callback für State-Änderungen (z.B. Online-Status der Panels)
    onPanelOnlineChanged = (id: string, state: ioBroker.State | null | undefined): void => {
        // Extract panel ID from state ID: nspanel-lovelace-ui.0.panels.{panelId}.info.isOnline
        const match = id.match(/\.panels\.([^.]+)\.info\.isOnline$/);
        if (!match) {
            console.warn('[PagePanelOverview] Could not extract panel ID from state:', id);
            return;
        }

        const panelId = match[1];
        const isOnline = state ? !!state.val : false;

        console.log(`[PagePanelOverview] Panel ${panelId} online status changed:`, isOnline);

        this.setState(prevState => ({
            panelOnlineStates: {
                ...prevState.panelOnlineStates,
                [panelId]: isOnline,
            },
        }));
    };

    /**
     * Reduziert die 562 Zeitzonen auf die Treffer zur Eingabe.
     *
     * Ohne Begrenzung baut MUI alle Einträge auf einmal auf – das legte den Browser lahm.
     *
     * @param input - der aktuelle Text im Eingabefeld
     * @returns höchstens 100 passende Zeitzonen
     */
    private static filterTimezones(input: string): TasmotaTimeZone[] {
        const q = (input || '').toLowerCase();
        if (!q) {
            return uniqueTasmotaTimeZones.slice(0, 100);
        }
        return uniqueTasmotaTimeZones.filter(tz => tz.label.toLowerCase().includes(q)).slice(0, 100);
    }
    // Generische Handler-Funktion für Checkbox-Änderungen
    private handleCheckboxChange =
        (key: string) =>
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            void this.onChange(key, event.target.checked).then(() => this.forceUpdate());
        };
    // Generische Handler-Funktion für Select-String-Änderungen
    private handleSelectStringChange =
        (key: string) =>
        (event: SelectChangeEvent<string>): void => {
            void this.onChange(key, event.target.value).then(() => this.forceUpdate());
        };
    // Generische Handler-Funktion für Select-Number-Änderungen
    private handleSelectNumberChange =
        (key: string) =>
        (event: SelectChangeEvent<number>): void => {
            void this.onChange(key, event.target.value).then(() => this.forceUpdate());
        };
    // Generische Handler-Funktion für Text-Änderungen
    private handleTextChange =
        (key: string) =>
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            const value = event.target.value;
            // Lokalen State aktualisieren, damit der Cursor nicht ans Ende springt
            if (key === '_tasmotaName') {
                this.setState({ localTasmotaName: value });
            } else if (key === '_tasmotaTopic') {
                this.setState({ localTasmotaTopic: value });
            }
            void this.onChange(key, value);
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
        const { localTasmotaIP, localTasmotaName, localTasmotaTopic } = this.state;

        return (
            !!localTasmotaIP &&
            this.isValidCompleteIp(localTasmotaIP) &&
            !!localTasmotaTopic &&
            this.validateTopic(localTasmotaTopic) &&
            !!localTasmotaName &&
            (!!data.mqttServer || !!data.mqttIp) &&
            !!data.mqttPort &&
            // the login comes either from the fields or, for an external broker, from a central credential (resolved by the adapter)
            ((!!data.mqttUsername && !!data.mqttPassword) || (!data.mqttServer && !!data.mqttCredentialId)) &&
            (!data.mqttServer || (!!data.internalServerIp && this.isValidCompleteIp(data.internalServerIp)))
        );
    }
    // Prüft, ob das Panel bereits konfiguriert ist (basierend auf dem Topic)
    private isPanelAlreadyConfigured(): boolean {
        const panels = this.props.data.panels || [];
        return panels.findIndex((panel: any) => panel.topic === this.state.localTasmotaTopic) !== -1;
    }
    // Öffnet den Bestätigungsdialog für die Initialisierung
    private handleInitClick = (): void => {
        // Lokale State-Werte nach props.data synchronisieren, damit handleConfirmStart
        // immer die aktuellsten Werte aus dem Formular übergibt.
        this.props.data._tasmotaIP = this.state.localTasmotaIP;
        this.props.data._tasmotaName = this.state.localTasmotaName;
        this.props.data._tasmotaTopic = this.state.localTasmotaTopic;
        this.setState({ showConfirm: true, isBlinking: false });
    };
    // Schließt den Bestätigungsdialog ohne Aktion
    private handleConfirmClose = (): void => {
        this.setState({ showConfirm: false });
    };
    /**
     * Führt einen der drei Einrichtungsschritte aus.
     *
     * Der Admin verwirft jede sendTo-Antwort, die länger als 30 Sekunden braucht, und ruft den
     * Callback dann mit dem String `timeout` auf. Die Einrichtung dauert insgesamt rund 40
     * Sekunden, deshalb ist sie auf drei Aufrufe verteilt, die nacheinander laufen.
     *
     * @param command - der sendTo-Befehl des Schritts
     * @param payload - die Daten des Formulars
     * @returns die Antwort des Adapters oder null, wenn der Schritt fehlgeschlagen ist
     */
    private async runInitStep(command: string, payload: Record<string, unknown>): Promise<InitStepAnswer | null> {
        const result = await this.props.oContext.socket.sendTo(
            `${this.adapterName}.${this.instance}`,
            command,
            payload,
        );

        if (result === 'timeout') {
            this.setState({ processing: false, progressMessage: '', error: this.getText('sendToStepTimeout') });
            return null;
        }

        if (!isInitStepAnswer(result)) {
            this.setState({
                processing: false,
                progressMessage: '',
                error: this.getText('sendToInvalidResponse'),
            });
            return null;
        }

        const answer = result;
        if (answer.error) {
            const errorMessage = this.getText(answer.error) || answer.error;
            this.setState({
                processing: false,
                progressMessage: '',
                error: errorMessage,
                showMessageConfirm: answer.error === 'sendToNoInternetAccess',
            });
            return null;
        }

        // Meilenstein des Schritts anzeigen
        if (answer.result) {
            this.setState({ progressMessage: this.getText(answer.result) || answer.result });
        }
        return answer;
    }

    // Startet die Initialisierung nach Bestätigung
    private handleConfirmStart = async (): Promise<void> => {
        this.setState({ showConfirm: false, processing: true, error: null, progressMessage: '' });

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
                mqttCredentialId: this.props.data.mqttCredentialId,
                internalServerIp: this.props.data.internalServerIp,
                useBetaTFT: this.props.data.useBetaTFT,
                model: this.props.data._nsPanelModel || 'eu',
            };

            // Die drei Schritte laufen nacheinander, jeder meldet seinen Meilenstein
            for (const command of ['nsPanelInitStep1', 'nsPanelInitStep2']) {
                if (!(await this.runInitStep(command, payload))) {
                    return;
                }
            }

            const last = await this.runInitStep('nsPanelInitStep3', payload);
            if (!last) {
                return;
            }

            const panels = last.native?.panels;
            if (!panels || !Array.isArray(panels)) {
                this.setState({
                    processing: false,
                    progressMessage: '',
                    error: this.getText('sendToNoPanelData'),
                });
                return;
            }

            const successKey = last.result ?? 'sendToNSPanelInitDataSuccess';
            this.setState({
                processing: false,
                progressMessage: '',
                showSuccessConfirm: true,
                successMessage: this.getText(successKey) || successKey,
                pendingPanels: panels,
            });
        } catch (error) {
            this.setState({
                processing: false,
                progressMessage: '',
                error: String(error),
            });
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
                // Lokalen State aktualisieren, damit der Cursor nicht ans Ende springt
                if (key === '_tasmotaIP') {
                    this.setState({ localTasmotaIP: value });
                }
                void this.onChange(key, value);
                // Prüfe Validierung und setze Fehler
                this.checkValidation(key, value);
            }
        };
    // Synchronisiert lokale State-Werte zurück nach props.data und erzwingt ein Re-Render
    private syncLocalToProps = (): void => {
        this.props.data._tasmotaIP = this.state.localTasmotaIP;
        this.props.data._tasmotaName = this.state.localTasmotaName;
        this.props.data._tasmotaTopic = this.state.localTasmotaTopic;
        this.props.data.timezone = this.state.localTimezone;
        this.forceUpdate();
    };
    // Handler für Blur- und Enter-Events in den Eingabefeldern
    private handleFieldSync = (): void => {
        this.syncLocalToProps();
    };
    private handleFieldKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === 'Enter') {
            this.syncLocalToProps();
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

    private async handleOpenTasmotaConsole(panel: PanelConfig): Promise<void> {
        try {
            const result = await this.props.oContext.socket.sendTo(
                `${this.adapterName}.${this.instance ?? '0'}`,
                'openTasmotaConsole',
                { ip: panel.ip },
            );

            if (result && typeof result === 'object' && 'openUrl' in result) {
                window.open(result.openUrl as string, '_blank');
            }
        } catch (err) {
            this.setState({ error: String(err) });
        }
    }

    // ---- Web panels (kind 'web'): no hardware, created and edited in a dialog ----

    /**
     * Opens the dialog, empty for a new web panel or filled with the values of an existing one.
     *
     * @param panel the web panel to edit, undefined = create a new one
     */
    private handleWebPanelDialogOpen = (panel?: PanelConfig): void => {
        this.setState({
            webPanelDialog: {
                open: true,
                editId: panel?.id ?? null,
                name: panel?.name ?? '',
                topic: panel?.topic ?? '',
                model: isPanelModel(panel?.model) ? panel.model : 'eu',
            },
        });
    };

    /**
     * The address a browser opens the web panel with: protocol (`webSecure`), host and port of the
     * instance plus the topic as typed (placeholder `<topic>` while empty).
     *
     * @param topic topic from the dialog
     * @returns the address for display
     */
    private webPanelAddressPreview(topic: string): string {
        const link = this.webLink();
        const base = webPanelUrl(link.host || window.location.hostname, link.port, '', undefined, link.secure);
        return `${base}${topic || '<topic>'}`;
    }

    private handleWebPanelDialogClose = (): void => {
        this.setState({ webPanelDialog: closedWebPanelDialog });
    };

    private handleWebPanelFieldChange =
        (key: 'name' | 'topic') =>
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            const value = event.target.value;
            this.setState(prev => ({ webPanelDialog: { ...prev.webPanelDialog, [key]: value } }));
        };

    private handleWebPanelModelChange = (event: SelectChangeEvent<string>): void => {
        const value = event.target.value;
        if (isPanelModel(value)) {
            this.setState(prev => ({ webPanelDialog: { ...prev.webPanelDialog, model: value } }));
        }
    };

    /**
     * Validates the topic of the dialog.
     *
     * @returns translation key of the error, null when the topic is fine
     */
    private webPanelTopicError(): string | null {
        const { topic, editId } = this.state.webPanelDialog;
        const trimmed = topic.trim();
        if (trimmed === '') {
            return 'webPanelTopicRequired';
        }
        if (!WEB_PANEL_TOPIC_PATTERN.test(trimmed)) {
            return 'webPanelTopicInvalid';
        }
        if (WEB_PANEL_RESERVED_SEGMENTS.has(trimmed.split('/')[0].toLowerCase())) {
            return 'webPanelTopicReserved';
        }
        const panels: PanelConfig[] = this.props.data.panels || [];
        if (panels.some(p => p.topic === trimmed && p.id !== editId)) {
            return 'webPanelTopicDuplicate';
        }
        return null;
    }

    private isWebPanelDialogValid(): boolean {
        return this.state.webPanelDialog.name.trim() !== '' && this.webPanelTopicError() === null;
    }

    /** appends a new web panel to the table or updates the edited one, then hands the table to the admin */
    private handleWebPanelSave = (): void => {
        if (!this.isWebPanelDialogValid()) {
            return;
        }
        const { editId, name, topic, model } = this.state.webPanelDialog;
        const panels: PanelConfig[] = this.props.data.panels || [];
        const values = { name: name.trim(), topic: topic.trim(), model };
        const updatedPanels =
            editId === null
                ? [...panels, { ...values, kind: 'web' as const, id: newWebPanelId(panels), ip: '' }]
                : panels.map(p => (p.id === editId ? { ...p, ...values, kind: 'web' as const } : p));

        void this.onChange('panels', updatedPanels).then(() => this.forceUpdate());
        this.setState({ webPanelDialog: closedWebPanelDialog });
    };

    // Handler zum Bearbeiten eines Panels - kopiert Daten in die Initialisierungsbox
    private handleEditPanel = (panel: PanelConfig): void => {
        console.log('Editing panel:', panel);
        if (panel.kind === 'web') {
            this.handleWebPanelDialogOpen(panel);
            return;
        }
        if (!this.state.alive) {
            return;
        }
        // Setze temporäre Laufzeit-Variablen direkt auf props.data
        this.props.data._tasmotaIP = panel.ip || '';
        this.props.data._tasmotaName = panel.name || '';
        this.props.data._tasmotaTopic = panel.topic || '';
        this.props.data._nsPanelModel = panel.model || 'eu';

        // Lokalen State synchronisieren
        this.setState({
            localTasmotaIP: panel.ip || '',
            localTasmotaName: panel.name || '',
            localTasmotaTopic: panel.topic || '',
            // localTimezone bleibt beim Edit unverändert
        });

        // Starte Blink-Animation
        this.startBlinkAnimation();
    };

    // Startet die Blink-Animation (8x blinken = 16 State-Änderungen)
    private startBlinkAnimation = (): void => {
        if (this.blinkTimeout) {
            clearTimeout(this.blinkTimeout);
        }

        let count = 0;
        const maxBlinks = 8; // 8x ein/aus = 16 Zustandsänderungen
        const blinkInterval = 200; // 200ms pro Zustandsänderung

        const blink = (): void => {
            if (count >= maxBlinks) {
                this.setState({ isBlinking: true }); // Bleibt blau nach dem Blinken
                return;
            }

            this.setState(prevState => ({ isBlinking: !prevState.isBlinking }));
            count++;

            this.blinkTimeout = setTimeout(blink, blinkInterval);
        };

        blink();
    };

    // Öffnet den Bestätigungsdialog zum Löschen
    private handleDeleteClick = (panel: PanelConfig): void => {
        this.setState({ showDeleteConfirm: true, panelToDelete: panel });
    };

    // Schließt den Lösch-Dialog ohne Aktion
    private handleDeleteClose = (): void => {
        this.setState({ showDeleteConfirm: false, panelToDelete: null });
    };

    // Löscht das Panel nach Bestätigung
    private handleDeleteConfirm = (): void => {
        const { panelToDelete } = this.state;
        if (!panelToDelete) {
            return;
        }
        console.log('[PagePanelOverview] Deleting panel:', panelToDelete);
        const panels = this.props.data.panels || [];
        const updatedPanels = panels.filter((p: PanelConfig) => p.id !== panelToDelete.id);

        void this.onChange('panels', updatedPanels);
        this.setState({ showDeleteConfirm: false, panelToDelete: null });
    };

    // Schließt den Success-Dialog ohne Speichern
    private handleSuccessClose = (): void => {
        console.log('[PagePanelOverview] Success dialog cancelled');
        this.setState({ showSuccessConfirm: false, successMessage: '', pendingPanels: null });
    };

    // Speichert die Config nach erfolgreicher Initialisierung
    private handleSuccessSave = async (): Promise<void> => {
        console.log('[PagePanelOverview] Saving config after success');
        const { pendingPanels } = this.state;

        if (pendingPanels) {
            await this.onChange('panels', pendingPanels);

            // Lösche temporäre Laufzeit-Variablen
            this.props.data._tasmotaIP = '';
            this.props.data._tasmotaName = '';
            this.props.data._tasmotaTopic = '';

            this.setState({
                showSuccessConfirm: false,
                successMessage: '',
                pendingPanels: null,
                localTasmotaIP: '',
                localTasmotaName: '',
                localTasmotaTopic: '',
                // localTimezone bleibt erhalten
            });
            console.log('[PagePanelOverview] Config saved successfully');
        }
    };

    // Schließt den Message-Dialog
    private handleMessageClose = (): void => {
        this.setState({ showMessageConfirm: false });
    };

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        // Expert Mode from props (provided by json-config system)
        //const isExpertMode = this.props.expertMode ?? false;
        const webLink = this.webLink();

        // Lade Werte aus this.props.data (hier werden die Config-Werte gespeichert)
        const data = this.props.data || {};
        const isUpdate = this.isPanelAlreadyConfigured();
        const panels: PanelConfig[] = data.panels || [];
        const {
            alive,
            error,
            showConfirm,
            showDeleteConfirm,
            showSuccessConfirm,
            panelToDelete,
            successMessage,
            processing,
            progressMessage,
            showMessageConfirm,
            webPanelDialog,
        } = this.state;
        const webPanelTopicError = this.webPanelTopicError();

        // Setze Standardwert für _nsPanelModel, falls nicht vorhanden (EU als Standard)
        const panelModel = data._nsPanelModel || 'eu';

        // Gemeinsame Styles für alle Boxen
        const boxStyle = {
            p: 2,
            border: 2,
            borderColor: 'divider',
            borderRadius: 1,
        };

        // Fieldset-Style mit Blink-Effekt
        const fieldsetStyle = {
            ...boxStyle,
            borderColor: this.state.isBlinking ? 'primary.main' : 'divider',
            transition: 'border-color 0.1s',
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
                        {this.getText('openLinkAdapterInstallation')}
                    </Button>
                </Box>
                <Box
                    component="fieldset"
                    sx={fieldsetStyle}
                >
                    <Typography
                        component="legend"
                        variant="h6"
                    >
                        {this.getText('nsPanelInitLabel')}
                    </Typography>
                    {/* IP-Adresse des internen Servers */}
                    {data.mqttServer && (
                        <FormControl>
                            <ConfigIP
                                {...this.props}
                                schema={
                                    {
                                        sx: { m: 1, minWidth: 200 },
                                        label: 'internalServerIp',
                                        noInternal: true,
                                        onlyIp4: true,
                                    } as any
                                }
                                attr="internalServerIp"
                                disabled={!alive}
                            />
                        </FormControl>
                    )}
                    <TextField
                        sx={{ m: 1, minWidth: 200 }}
                        variant="standard"
                        size="small"
                        disabled={!alive}
                        label={this.getText('ipFromPanel')}
                        value={this.state.localTasmotaIP}
                        onChange={this.handleIpChange('_tasmotaIP')}
                        onBlur={this.handleFieldSync}
                        onKeyDown={this.handleFieldKeyDown}
                        error={!!this.state.localTasmotaIP && !this.isValidCompleteIp(this.state.localTasmotaIP)}
                        helperText={
                            !!this.state.localTasmotaIP && !this.isValidCompleteIp(this.state.localTasmotaIP)
                                ? this.getText('mustBeIp')
                                : ''
                        }
                    />
                    <TextField
                        sx={{ m: 1, minWidth: 200 }}
                        size="small"
                        disabled={!alive}
                        variant="standard"
                        label={this.getText('panelName')}
                        value={this.state.localTasmotaName}
                        onChange={this.handleTextChange('_tasmotaName')}
                        onBlur={this.handleFieldSync}
                        onKeyDown={this.handleFieldKeyDown}
                    />
                    <TextField
                        sx={{ m: 1, minWidth: 200 }}
                        size="small"
                        disabled={!alive}
                        variant="standard"
                        label={this.getText('panelTopic')}
                        value={this.state.localTasmotaTopic}
                        onChange={this.handleTextChange('_tasmotaTopic')}
                        onBlur={this.handleFieldSync}
                        onKeyDown={this.handleFieldKeyDown}
                        error={!!this.state.localTasmotaTopic && !this.validateTopic(this.state.localTasmotaTopic)}
                    />
                    {/* Panel Model Select */}
                    <FormControl
                        sx={{ m: 1, minWidth: 200 }}
                        size="small"
                        disabled={!alive}
                        variant="standard"
                    >
                        <InputLabel id="panelmodel-label">{this.getText('nsPanelModel')}</InputLabel>
                        <Select
                            labelId="panelmodel-label"
                            id="panelmodel-select"
                            label={this.getText('nsPanelModel')}
                            value={panelModel}
                            onChange={this.handleSelectStringChange('_nsPanelModel')}
                        >
                            <MenuItem value="eu">{this.getText('eu-Version')}</MenuItem>
                            <MenuItem value="us-l">{this.getText('us-l-Version')}</MenuItem>
                            <MenuItem value="us-p">{this.getText('us-p-Version')}</MenuItem>
                        </Select>
                    </FormControl>
                    {/* Zeitzone: Autocomplete statt Select – 562 MenuItems auf einmal frieren den Browser ein.
                        Root ist ein Block-Div, deshalb inline-flex wie TextField/FormControl, sonst rutscht das Feld in eine eigene Zeile */}
                    <Autocomplete
                        sx={{ m: 1, minWidth: 200, display: 'inline-flex', verticalAlign: 'top' }}
                        size="small"
                        disabled={!alive}
                        options={this.state.filteredTimezones}
                        // interne Filterung aus: die Liste wird bei jeder Eingabe selbst begrenzt
                        filterOptions={opts => opts}
                        getOptionLabel={option => option.label}
                        isOptionEqualToValue={(option, value) => option.label === value.label}
                        value={uniqueTasmotaTimeZones.find(tz => tz.label === this.state.localTimezone) ?? null}
                        inputValue={this.state.timezoneInput}
                        onInputChange={(_, newInput) => {
                            this.setState({
                                timezoneInput: newInput,
                                filteredTimezones: PagePanelOverview.filterTimezones(newInput),
                            });
                        }}
                        onChange={(_, newValue) => {
                            const label = newValue?.label ?? '';
                            this.setState({
                                localTimezone: label,
                                timezoneInput: label,
                                filteredTimezones: PagePanelOverview.filterTimezones(label),
                            });
                            void this.onChange('timezone', label).then(() => this.forceUpdate());
                        }}
                        renderInput={params => (
                            <TextField
                                {...params}
                                variant="standard"
                                label={this.getText('timezone')}
                            />
                        )}
                    />
                </Box>
                {/* Error Alert */}
                {error && (
                    <Alert
                        severity="error"
                        onClose={() => this.setState({ error: null })}
                        sx={{ mt: 2 }}
                    >
                        {error}
                    </Alert>
                )}
                {/* Init/Update Button + Web panel button */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                    <Button
                        variant="contained"
                        onClick={this.handleInitClick}
                        disabled={!alive || !this.isFormValid() || processing}
                        sx={{ flex: '1 1 0', minWidth: 200 }}
                    >
                        {processing ? (
                            <CircularProgress size={24} />
                        ) : isUpdate ? (
                            this.getText('nsPanelUpdate')
                        ) : (
                            this.getText('nsPanelInit')
                        )}
                    </Button>
                    {/* a web panel is a pure config entry - no adapter interaction, so it does not need alive;
                        it only makes sense while the web server is enabled */}
                    {webLink.enabled ? (
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={(): void => this.handleWebPanelDialogOpen()}
                            disabled={processing}
                            sx={{ flex: '1 1 0', minWidth: 200 }}
                        >
                            {this.getText('webPanelAdd')}
                        </Button>
                    ) : null}
                </Box>

                {/* Meilenstein des laufenden Einrichtungsschritts */}
                {processing && progressMessage && (
                    <Alert
                        severity="info"
                        sx={{ mt: 1 }}
                    >
                        {progressMessage}
                    </Alert>
                )}

                {/* Panels as Boxes */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {panels.map((panel, index) => {
                        const isWebPanel = panel.kind === 'web';
                        return (
                            <Box
                                key={panel.id || index}
                                sx={{
                                    width: 'fit-content',
                                    maxWidth: '100%',
                                    minWidth: 320,
                                    border: 3,
                                    opacity: !alive ? 0.6 : 1,
                                    p: 2,
                                    borderRadius: 1,
                                }}
                            >
                                {/* Panel Name as Title with Edit, Delete and Status Badge */}
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                                    {/* Left side: Name and Badge vertically stacked */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="h6">{panel.name}</Typography>
                                            {isWebPanel ? (
                                                <Chip
                                                    label={this.getText('webPanelKind')}
                                                    size="small"
                                                    color="info"
                                                    variant="outlined"
                                                />
                                            ) : null}
                                        </Box>
                                        {panel.id && (
                                            <PanelStatusBadge
                                                panelId={panel.id}
                                                oContext={this.props.oContext}
                                                size="small"
                                                showLabel={true}
                                                alive={alive}
                                            />
                                        )}
                                    </Box>
                                    {/* Right side: Action buttons */}
                                    {webLink.enabled && panel.topic ? (
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={(): void => openWebPanel(webLink, panel.topic ?? '')}
                                            title={this.getText('openWebPanel')}
                                        >
                                            <OpenInNewIcon />
                                        </IconButton>
                                    ) : null}
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => this.handleEditPanel(panel)}
                                        disabled={!alive && !isWebPanel}
                                        title={this.getText('editPanel')}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => this.handleDeleteClick(panel)}
                                        disabled={!alive}
                                        title={this.getText('deletePanel')}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>

                                {/* Version Info with Flexbox */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {/* mac (hardware) or generated id (web panel) */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                        <TextField
                                            label={this.getText(isWebPanel ? 'webPanelId' : 'macAdressOfPanel')}
                                            value={panel.id}
                                            slotProps={{ input: { readOnly: true } }}
                                            size="small"
                                            sx={{ flex: '1 1 250px', minWidth: 200, maxWidth: 300 }}
                                        />
                                    </Box>

                                    {/* ip - Address (a web panel has none) */}
                                    {isWebPanel ? null : (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                            <TextField
                                                label={this.getText('ipFromPanel')}
                                                value={panel.ip}
                                                slotProps={{ input: { readOnly: true } }}
                                                size="small"
                                                sx={{ flex: '1 1 250px', minWidth: 200, maxWidth: 300 }}
                                            />
                                        </Box>
                                    )}

                                    {/* topic */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                        <TextField
                                            label={this.getText('panelTopic')}
                                            value={panel.topic}
                                            slotProps={{ input: { readOnly: true } }}
                                            size="small"
                                            sx={{ flex: '1 1 250px', minWidth: 200, maxWidth: 300 }}
                                        />
                                    </Box>

                                    {/* Model*/}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                        <TextField
                                            label={this.getText('nsPanelModel')}
                                            value={this.getText(`${panel.model || 'eu'}-Version`)}
                                            slotProps={{ input: { readOnly: true } }}
                                            size="small"
                                            sx={{ flex: '1 1 250px', minWidth: 200, maxWidth: 300 }}
                                        />
                                    </Box>

                                    {/* Console Button (Tasmota only) */}
                                    {isWebPanel ? null : (
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            onClick={() => this.handleOpenTasmotaConsole(panel)}
                                            disabled={!panel.ip || !alive}
                                            size="small"
                                            sx={{ mt: 1 }}
                                        >
                                            {this.getText('openTasmotaConsole')}
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>

                {/* Confirm Dialog */}
                <Dialog
                    open={showConfirm}
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

                {/* Delete Confirm Dialog */}
                <Dialog
                    open={showDeleteConfirm}
                    onClose={this.handleDeleteClose}
                >
                    <DialogTitle>{this.getText('deletePanel')}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {this.getText('deletePanelConfirmText').replace('%s', panelToDelete?.name || '')}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleDeleteClose}>{this.getText('Cancel')}</Button>
                        <Button
                            onClick={this.handleDeleteConfirm}
                            variant="contained"
                            color="error"
                            autoFocus
                        >
                            {this.getText('Delete')}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Success Confirm Dialog */}
                <Dialog
                    open={showSuccessConfirm}
                    onClose={this.handleSuccessClose}
                >
                    <DialogTitle>{this.getText('Success')}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>{successMessage}</DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleSuccessClose}>{this.getText('Cancel')}</Button>
                        <Button
                            onClick={this.handleSuccessSave}
                            variant="contained"
                            color="primary"
                            autoFocus
                        >
                            {this.getText('Save')}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Web panel create/edit dialog */}
                <Dialog
                    open={webPanelDialog.open}
                    onClose={this.handleWebPanelDialogClose}
                    fullWidth
                    maxWidth="xs"
                >
                    <DialogTitle>
                        {webPanelDialog.editId === null ? this.getText('webPanelAdd') : this.getText('webPanelEdit')}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ mb: 1 }}>{this.getText('webPanelAddText')}</DialogContentText>
                        {/* live preview of the address: protocol and port follow the web panel settings */}
                        <Typography
                            variant="body2"
                            sx={{ mb: 2, wordBreak: 'break-all' }}
                        >
                            {this.getText('webPanelAddress')}:{' '}
                            <code>{this.webPanelAddressPreview(webPanelDialog.topic)}</code>
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                autoFocus
                                size="small"
                                variant="standard"
                                label={this.getText('panelName')}
                                value={webPanelDialog.name}
                                onChange={this.handleWebPanelFieldChange('name')}
                                error={webPanelDialog.name !== '' && webPanelDialog.name.trim() === ''}
                            />
                            <TextField
                                size="small"
                                variant="standard"
                                label={this.getText('webPanelTopic')}
                                value={webPanelDialog.topic}
                                onChange={this.handleWebPanelFieldChange('topic')}
                                error={webPanelDialog.topic !== '' && webPanelTopicError !== null}
                                helperText={
                                    webPanelDialog.topic !== '' && webPanelTopicError !== null
                                        ? this.getText(webPanelTopicError)
                                        : this.getText('webPanelTopicHelp')
                                }
                            />
                            <FormControl
                                size="small"
                                variant="standard"
                            >
                                <InputLabel id="webpanel-model-label">{this.getText('nsPanelModel')}</InputLabel>
                                <Select
                                    labelId="webpanel-model-label"
                                    label={this.getText('nsPanelModel')}
                                    value={webPanelDialog.model}
                                    onChange={this.handleWebPanelModelChange}
                                >
                                    {panelModels.map(model => (
                                        <MenuItem
                                            key={model}
                                            value={model}
                                        >
                                            {this.getText(`${model}-Version`)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleWebPanelDialogClose}>{this.getText('Cancel')}</Button>
                        <Button
                            onClick={this.handleWebPanelSave}
                            variant="contained"
                            disabled={!this.isWebPanelDialogValid()}
                        >
                            {this.getText('Save')}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Message Dialog */}
                <Dialog
                    open={showMessageConfirm}
                    onClose={this.handleMessageClose}
                >
                    <DialogTitle>{`Panel ${this.props.data._tasmotaName}`}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>{error}</DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleMessageClose}>{this.getText('Commit')}</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    }
}

export default PagePanelOverview;
