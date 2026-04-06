import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Alert,
    TextField,
    Checkbox,
    FormControlLabel,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    type SelectChangeEvent,
    CircularProgress,
} from '@mui/material';
import { I18n } from '@iobroker/adapter-react-v5';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { EntitySelector } from './EntitySelector';
import IconSelect from '../IconSelect';
import {
    ADAPTER_NAME,
    CHANNEL_ROLES_LIST,
    type AdminPageItemConfig,
    type MenuEntry,
} from '../../../src/lib/types/adminShareConfig';

export type { AdminPageItemConfig as PageItemConfig };

type ChannelConfigDialogProps = {
    socket: any;
    theme?: any;
    themeType?: string;
    adapterName?: string;
    instance?: number;
    /** oContext für IconSelect (optional – wird aus den anderen Props aufgebaut falls nicht übergeben) */
    oContext?: any;
    /** Panel-IDs zum Laden der verfügbaren Navigationsseiten (legacy, wird ignoriert wenn pagesList gesetzt) */
    panelIds?: string[];
    /** Direkte Liste der verfügbaren Seiten – hat Vorrang vor panelIds */
    pagesList?: string[];
    /** Name der aktuellen Seite – wird aus der Zielseiten-Auswahl gefiltert */
    currentPageName?: string;
    /** Card-Typ der aktuellen Seite – wird für CheckPageItemConfig benötigt */
    currentPageCard?: MenuEntry['card'];
    onSave?: (config: AdminPageItemConfig) => void;
    /** Vorausgefüllte Channel-ID für Testzwecke */
    initialChannelId?: string;
    /** Trigger-Button ausblenden; Dialog wird per openWith()-Methode geöffnet */
    hideTriggerButton?: boolean;
    /** Expert-Mode – zeigt Native-Toggle-Button an */
    expertMode?: boolean;
};

interface ChannelConfigDialogState {
    open: boolean;
    channelId: string;
    name: string;
    isNavigation: boolean;
    targetPage: string;
    availablePages: string[];
    loadingPages: boolean;
    trueIcon: string;
    trueColor: string;
    falseIcon: string;
    falseColor: string;
    /** null = nicht geprüft, true = existiert, false = existiert nicht */
    channelExists: boolean | null;
    checkingChannel: boolean;
    /** common.role des gewählten ioBroker-Objekts */
    channelRole: string | null;
    /** true wenn channelRole eine bekannte ScriptConfig.channelRole ist */
    roleIsValid: boolean | null;
    /** Vorgeladene Channel-IDs mit passender Rolle – Basis für filterFunc */
    validChannelIds: string[];
    /** Expert-Mode: native JSON-Editor aktiv */
    nativeMode: boolean;
    /** Rohes JSON im nativen Editor */
    nativeJson: string;
    /** true wenn nativeJson syntaktisch valide ist */
    nativeJsonValid: boolean;
    /** true während CheckPageItemConfig-Anfrage läuft */
    isSaving: boolean;
    /** Ergebnis-Dialog sichtbar */
    checkResultOpen: boolean;
    /** Meldungen aus CheckPageItemConfig */
    checkResultMessages: string[];
    /** true = Fehler-Warnung, false = Log + Done */
    checkResultIsError: boolean;
    /** Zu speichernde Konfiguration – wird nach "Done" ausgeführt */
    checkResultPendingConfig: AdminPageItemConfig | null;
}

/** Minimales leeres ioBroker.InstanceCommon für ConfigGeneric-Komponenten */
const EMPTY_COMMON: ioBroker.InstanceCommon = {} as ioBroker.InstanceCommon;

/**
 * Dialog zum Konfigurieren eines ioBroker-Channels mit
 * optionalem Navigations-Zielseiten-Selector.
 * Optik analog zu den Panel-Boxen in PagePanelOverview.
 */
class ChannelConfigDialog extends React.Component<ChannelConfigDialogProps, ChannelConfigDialogState> {
    constructor(props: ChannelConfigDialogProps) {
        super(props);
        this.state = {
            open: false,
            channelId: props.initialChannelId ?? '',
            name: '',
            isNavigation: false,
            targetPage: '',
            availablePages: [],
            loadingPages: false,
            trueIcon: '',
            trueColor: '',
            falseIcon: '',
            falseColor: '',
            channelExists: null,
            checkingChannel: false,
            channelRole: null,
            roleIsValid: null,
            validChannelIds: [],
            nativeMode: false,
            nativeJson: '',
            nativeJsonValid: false,
            isSaving: false,
            checkResultOpen: false,
            checkResultMessages: [],
            checkResultIsError: false,
            checkResultPendingConfig: null,
        };
    }

    private handleOpen = (): void => {
        this.setState({ open: true });
        if (this.props.pagesList && this.props.pagesList.length > 0) {
            this.setState({ availablePages: this.sortPages(this.props.pagesList) });
        } else if (!this.state.loadingPages && this.state.availablePages.length === 0) {
            void this.loadAvailablePages();
        }
        if (this.state.validChannelIds.length === 0) {
            void this.loadValidChannels();
        }
    };

    /**
     * Öffnet den Dialog mit optionalen Vorbelegungsdaten.
     * Wird von übergeordneten Komponenten per ref aufgerufen.
     *
     * @param data
     */
    public openWith(data?: Partial<AdminPageItemConfig>): void {
        const isNative = data?.useNative === true;
        this.setState({
            open: true,
            channelId: data?.channelId ?? '',
            name: data?.name ?? '',
            isNavigation: data?.isNavigation ?? false,
            targetPage: data?.targetPage ?? '',
            trueIcon: data?.trueIcon ?? '',
            trueColor: data?.trueColor ?? '',
            falseIcon: data?.falseIcon ?? '',
            falseColor: data?.falseColor ?? '',
            channelExists: isNative ? true : null,
            checkingChannel: false,
            channelRole: data?.role ?? null,
            roleIsValid: null,
            nativeMode: isNative,
            nativeJson: isNative ? JSON.stringify(data?.native ?? {}, null, 2) : '',
            nativeJsonValid: isNative,
        });
        if (this.props.pagesList && this.props.pagesList.length > 0) {
            this.setState({ availablePages: this.sortPages(this.props.pagesList) });
        } else if (!this.state.loadingPages && this.state.availablePages.length === 0) {
            void this.loadAvailablePages();
        }
        if (this.state.validChannelIds.length === 0) {
            void this.loadValidChannels();
        }
        if (!isNative && data?.channelId) {
            void this.checkChannelExists(data.channelId);
        }
    }

    private handleClose = (): void => {
        this.setState({ open: false });
    };

    /** Baut die zu speichernde PageItemConfig aus dem aktuellen State zusammen. */
    private buildSaveConfig(): AdminPageItemConfig | null {
        const { channelId, name, isNavigation, targetPage, trueIcon, trueColor, falseIcon, falseColor, channelRole } =
            this.state;
        if (this.state.nativeMode) {
            try {
                const parsed: unknown = JSON.parse(this.state.nativeJson);
                return {
                    channelId,
                    name,
                    isNavigation,
                    targetPage,
                    trueIcon,
                    trueColor,
                    falseIcon,
                    falseColor,
                    role: channelRole ?? undefined,
                    useNative: true,
                    native: parsed,
                };
            } catch {
                return null;
            }
        }
        return {
            channelId,
            role: channelRole ?? undefined,
            name,
            isNavigation,
            targetPage,
            trueIcon,
            trueColor,
            falseIcon,
            falseColor,
        };
    }

    /**
     * Führt onSave aus und schließt den Haupt-Dialog.
     *
     * @param config
     */
    private commitSave(config: AdminPageItemConfig): void {
        if (this.props.onSave) {
            this.props.onSave(config);
        }
        this.handleClose();
    }

    private handleSave = (): void => {
        void this.handleSaveAsync();
    };

    private handleSaveAsync = async (): Promise<void> => {
        const configToSave = this.buildSaveConfig();
        if (!configToSave) {
            return;
        }

        const socket = this.props.oContext?.socket ?? this.props.socket;
        const instance = this.props.oContext?.instance ?? '0';
        const card = this.props.currentPageCard;
        const uniqueName = this.props.currentPageName;

        if (socket && card && uniqueName) {
            this.setState({ isSaving: true });
            try {
                const result: { messages: string[]; error: string | undefined } = await socket.sendTo(
                    `${ADAPTER_NAME}.${instance}`,
                    'CheckPageItemConfig',
                    { item: configToSave, page: { card, uniqueName } },
                );
                this.setState({ isSaving: false });
                const messages = Array.isArray(result?.messages)
                    ? result.messages
                    : result?.messages != null
                      ? [String(result.messages)]
                      : [];
                if (result?.error !== undefined) {
                    messages.unshift(result.error);
                    // Fehler: Dialog bleibt offen, Warnung anzeigen
                    this.setState({
                        checkResultOpen: true,
                        checkResultMessages: messages,
                        checkResultIsError: true,
                        checkResultPendingConfig: null,
                    });
                } else {
                    // Erfolg: bei leeren Meldungen direkt speichern, sonst Log anzeigen
                    if (messages.length === 0) {
                        this.commitSave(configToSave);
                    } else {
                        this.setState({
                            checkResultOpen: true,
                            checkResultMessages: messages,
                            checkResultIsError: false,
                            checkResultPendingConfig: configToSave,
                        });
                    }
                }
                return;
            } catch (e) {
                console.warn('[ChannelConfigDialog] CheckPageItemConfig failed', e);
                this.setState({ isSaving: false });
                // Fallthrough: direkt speichern wenn Check nicht erreichbar
            }
        }

        // Kein Check möglich (Adapter offline / Props fehlen) → direkt speichern
        this.commitSave(configToSave);
    };

    private handleCheckResultClose = (): void => {
        this.setState({ checkResultOpen: false, checkResultPendingConfig: null });
    };

    private handleCheckResultDone = (): void => {
        const { checkResultPendingConfig } = this.state;
        this.setState({ checkResultOpen: false, checkResultPendingConfig: null });
        if (checkResultPendingConfig) {
            this.commitSave(checkResultPendingConfig);
        }
    };

    private handleNativeModeToggle = (): void => {
        if (!this.state.nativeMode) {
            // Beim Wechsel zu Native: vorhandenes native-JSON beibehalten oder leer starten
            this.setState({
                nativeMode: true,
                nativeJson: '{}',
                nativeJsonValid: true,
            });
        } else {
            this.setState({ nativeMode: false });
        }
    };

    private handleNativeJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): void => {
        const json = e.target.value;
        let valid = false;
        try {
            JSON.parse(json);
            valid = true;
        } catch {
            valid = false;
        }
        this.setState({ nativeJson: json, nativeJsonValid: valid });
    };

    private async loadValidChannels(): Promise<void> {
        const { socket } = this.props;
        if (!socket) {
            return;
        }
        try {
            const objects: Record<string, ioBroker.Object> | null | undefined =
                await socket.getObjectViewSystem('channel');
            const validIds: string[] = [];
            for (const [id, obj] of Object.entries(objects ?? {})) {
                const role = (obj as any)?.common?.role;
                if (typeof role === 'string' && (CHANNEL_ROLES_LIST as readonly string[]).includes(role)) {
                    validIds.push(id);
                }
            }
            this.setState({ validChannelIds: validIds });
        } catch (e) {
            console.warn('[ChannelConfigDialog] loadValidChannels failed', e);
        }
    }

    /**
     * filterFunc für SelectID: zeigt Channels/Devices mit passender Rolle
     * sowie alle ihre Kinder.
     */
    private buildChannelFilterFunc(): (obj: ioBroker.Object) => boolean {
        const { validChannelIds } = this.state;
        return (obj: ioBroker.Object): boolean => {
            const id = (obj as any)._id as string | undefined;
            if (!id) {
                return false;
            }
            return validChannelIds.some(chId => id === chId || id.startsWith(`${chId}.`));
        };
    }

    /**
     * Reduziert eine ausgewählte ID auf den längsten passenden Channel-Prefix.
     *
     * @param id
     */
    private transformChannelId = (id: string): string => {
        const { validChannelIds } = this.state;
        let best = '';
        for (const chId of validChannelIds) {
            if ((id === chId || id.startsWith(`${chId}.`)) && chId.length > best.length) {
                best = chId;
            }
        }
        return best || id;
    };

    private handleChannelIdChange = (id: string): void => {
        this.setState({ channelId: id, channelExists: null, channelRole: null, roleIsValid: null });
    };

    private handleChannelIdCommit = (id: string): void => {
        const trimmed = id.trim();
        if (trimmed) {
            void this.checkChannelExists(trimmed);
        } else {
            this.setState({ channelExists: null, channelRole: null, roleIsValid: null });
        }
    };

    private async checkChannelExists(objectId: string): Promise<void> {
        const { socket } = this.props;
        this.setState({ checkingChannel: true });
        if (!socket) {
            this.setState({ channelExists: false, checkingChannel: false });
            return;
        }
        try {
            const obj: ioBroker.Object | null | undefined = await socket.getObject(objectId);
            const role = (obj as any)?.common?.role ?? null;
            const channelRole = typeof role === 'string' ? role : null;
            const roleIsValid = channelRole !== null && (CHANNEL_ROLES_LIST as readonly string[]).includes(channelRole);
            this.setState({
                channelExists: obj != null,
                channelRole,
                roleIsValid: channelRole !== null ? roleIsValid : null,
                checkingChannel: false,
            });
        } catch {
            this.setState({ channelExists: false, checkingChannel: false });
        }
    }

    private handleNavigationChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const checked = event.target.checked;
        this.setState({ isNavigation: checked, targetPage: checked ? this.state.targetPage : '' });
    };

    private handleTargetPageChange = (event: SelectChangeEvent<string>): void => {
        this.setState({ targetPage: event.target.value });
    };

    private sortPages(pages: string[]): string[] {
        const current = this.props.currentPageName;
        return [...pages]
            .filter(p => !current || p !== current)
            .sort((a, b) => {
                if (a === 'main') {
                    return -1;
                }
                if (b === 'main') {
                    return 1;
                }
                return a.localeCompare(b);
            });
    }

    private async loadAvailablePages(): Promise<void> {
        // Wenn pagesList direkt übergeben wurde, direkt setzen
        if (this.props.pagesList && this.props.pagesList.length > 0) {
            this.setState({ availablePages: this.sortPages(this.props.pagesList), loadingPages: false });
            return;
        }
        const { socket, adapterName = ADAPTER_NAME, instance = 0, panelIds } = this.props;
        if (!socket || !panelIds || panelIds.length === 0) {
            return;
        }

        this.setState({ loadingPages: true });
        try {
            const allPages = new Set<string>();

            await Promise.all(
                panelIds.map(async panelId => {
                    const objectId = `${adapterName}.${instance}.panels.${panelId}`;
                    try {
                        const obj: ioBroker.Object | null | undefined = await socket.getObject(objectId);
                        if (obj?.native?.navigationNodes && Array.isArray(obj.native.navigationNodes)) {
                            for (const page of obj.native.navigationNodes as string[]) {
                                allPages.add(page);
                            }
                        }
                    } catch (e) {
                        console.warn(`[ChannelConfigDialog] getObject failed for ${objectId}`, e);
                    }
                }),
            );

            this.setState({
                availablePages: this.sortPages([...allPages]),
                loadingPages: false,
            });
        } catch (e) {
            console.error('[ChannelConfigDialog] loadAvailablePages failed', e);
            this.setState({ loadingPages: false });
        }
    }

    /** Baut einen minimalen oContext falls keiner übergeben wurde */
    private buildOContext(): any {
        if (this.props.oContext) {
            return this.props.oContext;
        }
        const { socket, theme, themeType, adapterName = ADAPTER_NAME, instance = 0 } = this.props;
        return {
            socket,
            theme,
            themeType: themeType ?? 'light',
            adapterName,
            instance,
            isFloatComma: false,
            dateFormat: 'DD.MM.YYYY',
            forceUpdate: () => {},
            systemConfig: {} as ioBroker.SystemConfigCommon,
            _themeName: themeType ?? 'light',
            onCommandRunning: () => {},
        };
    }

    /**
     * Rendert eine Bedingungsspalte (true oder false)
     *
     * @param branch
     */
    private renderBranchColumn(branch: 'true' | 'false'): React.JSX.Element {
        const isTrue = branch === 'true';
        const iconAttr = isTrue ? 'trueIcon' : 'falseIcon';
        const iconValue = isTrue ? this.state.trueIcon : this.state.falseIcon;
        const colorValue = isTrue ? this.state.trueColor : this.state.falseColor;
        const label = isTrue ? I18n.t('channelConfigDialog_condTrue') : I18n.t('channelConfigDialog_condFalse');

        const oContext = this.buildOContext();
        const theme = this.props.theme;
        const themeName: string = this.props.themeType === 'dark' ? 'dark' : 'light';

        return (
            <Box
                sx={{
                    flex: 1,
                    border: 2,
                    borderColor: isTrue ? 'success.main' : 'error.main',
                    borderRadius: 1,
                    p: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                }}
            >
                <Typography
                    variant="subtitle2"
                    sx={{ color: isTrue ? 'success.main' : 'error.main', fontWeight: 'bold' }}
                >
                    {label}
                </Typography>

                {/* Icon-Auswahl */}
                <IconSelect
                    oContext={oContext}
                    alive={true}
                    changed={false}
                    themeName={themeName as any}
                    common={EMPTY_COMMON}
                    attr={iconAttr}
                    data={{ [iconAttr]: iconValue }}
                    originalData={{ [iconAttr]: iconValue }}
                    onError={() => {}}
                    schema={{
                        type: 'custom',
                        name: 'IconSelect',
                        url: '',
                        label: `channelConfigDialog_icon_${branch}`,
                        i18n: true,
                    }}
                    custom
                    onChange={(attrOrData, val, cb): void => {
                        let newIcon = '';
                        if (typeof attrOrData === 'object') {
                            newIcon = attrOrData[iconAttr] ?? '';
                        } else if (typeof val === 'string') {
                            newIcon = val;
                        }
                        if (isTrue) {
                            this.setState({ trueIcon: newIcon });
                        } else {
                            this.setState({ falseIcon: newIcon });
                        }
                        if (cb) {
                            cb();
                        }
                    }}
                    theme={theme}
                />
                {iconValue === '' && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: -1 }}
                    >
                        {I18n.t('channelConfigDialog_defaultIcon')}
                    </Typography>
                )}

                {/* Farbauswahl */}
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                    {colorValue === '' ? (
                        <>
                            <TextField
                                variant="standard"
                                label={I18n.t('channelConfigDialog_color')}
                                value={I18n.t('channelConfigDialog_defaultColor')}
                                disabled
                                sx={{ flex: 1 }}
                            />
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                    if (isTrue) {
                                        this.setState({ trueColor: '#00cc00' });
                                    } else {
                                        this.setState({ falseColor: '#cc0000' });
                                    }
                                }}
                            >
                                {I18n.t('channelConfigDialog_setColor')}
                            </Button>
                        </>
                    ) : (
                        <>
                            <TextField
                                variant="standard"
                                type="color"
                                label={I18n.t('channelConfigDialog_color')}
                                value={colorValue}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    if (isTrue) {
                                        this.setState({ trueColor: e.target.value });
                                    } else {
                                        this.setState({ falseColor: e.target.value });
                                    }
                                }}
                                sx={{ flex: 1 }}
                            />
                            <Button
                                size="small"
                                variant="text"
                                onClick={() => {
                                    if (isTrue) {
                                        this.setState({ trueColor: '' });
                                    } else {
                                        this.setState({ falseColor: '' });
                                    }
                                }}
                            >
                                {I18n.t('channelConfigDialog_resetColor')}
                            </Button>
                        </>
                    )}
                </Box>
            </Box>
        );
    }

    render(): React.JSX.Element {
        const { socket, theme, themeType } = this.props;
        const {
            open,
            channelId,
            name,
            isNavigation,
            targetPage,
            availablePages,
            loadingPages,
            channelExists,
            checkingChannel,
            channelRole,
            roleIsValid,
            nativeMode,
            nativeJson,
            nativeJsonValid,
        } = this.state;

        const expertMode = this.props.expertMode === true;
        const channelIdValid = channelId !== '';
        const standardCanSave =
            channelIdValid &&
            ((isNavigation && targetPage !== '') || (!isNavigation && channelExists === true && !checkingChannel));
        const canSave = nativeMode ? nativeJsonValid : standardCanSave;
        /** Felder sperren wenn noch keine gültige ID ausgewählt ist */
        const fieldsDisabled = !standardCanSave;

        // Untertitel neben dem Titel
        const titleSuffix =
            channelId === ''
                ? I18n.t('channelConfigDialog_noChannelSelected')
                : channelRole !== null
                  ? `${channelRole}${roleIsValid === false ? ` (${I18n.t('channelConfigDialog_unknownRole')})` : ''}`
                  : channelExists === false
                    ? I18n.t('channelConfigDialog_channelNotFound')
                    : '…';

        // Optik analog zu den Panel-Boxen in PagePanelOverview (border: 3, p: 2, borderRadius: 1)
        const panelBoxStyle = {
            border: 3,
            borderColor: 'divider',
            borderRadius: 1,
            p: 2,
            display: 'flex',
            flexDirection: 'column' as const,
            gap: 2,
        };

        return (
            <>
                {!this.props.hideTriggerButton && (
                    <Button
                        variant="outlined"
                        onClick={this.handleOpen}
                    >
                        {I18n.t('channelConfigDialog_open')}
                    </Button>
                )}

                <Dialog
                    open={open}
                    onClose={this.handleClose}
                    fullWidth
                    maxWidth="md"
                >
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                                variant="h6"
                                sx={{ flex: 1 }}
                            >
                                {I18n.t('channelConfigDialog_title')}
                                <Typography
                                    component="span"
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ ml: 1 }}
                                >
                                    ({titleSuffix})
                                </Typography>
                            </Typography>
                        </Box>
                    </DialogTitle>

                    <DialogContent>
                        {nativeMode ? (
                            <TextField
                                fullWidth
                                multiline
                                minRows={12}
                                value={nativeJson}
                                onChange={this.handleNativeJsonChange}
                                error={!nativeJsonValid}
                                helperText={!nativeJsonValid ? I18n.t('channelConfigDialog_invalidJson') : undefined}
                                inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
                                variant="outlined"
                            />
                        ) : (
                            <Box sx={panelBoxStyle}>
                                {/* Navigation-Checkbox */}
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={isNavigation}
                                            onChange={this.handleNavigationChange}
                                        />
                                    }
                                    label={
                                        <Typography variant="body1">
                                            {I18n.t('channelConfigDialog_isNavigation')}
                                        </Typography>
                                    }
                                />

                                {/* Zielseiten-Selector – nur sichtbar wenn isNavigation aktiv */}
                                {isNavigation && (
                                    <FormControl
                                        variant="standard"
                                        fullWidth
                                        disabled={loadingPages}
                                    >
                                        <InputLabel>{I18n.t('channelConfigDialog_targetPage')}</InputLabel>
                                        <Select
                                            value={targetPage}
                                            onChange={this.handleTargetPageChange}
                                            label={I18n.t('channelConfigDialog_targetPage')}
                                        >
                                            {loadingPages && (
                                                <MenuItem
                                                    disabled
                                                    value=""
                                                >
                                                    <CircularProgress size={16} />
                                                </MenuItem>
                                            )}
                                            {!loadingPages && availablePages.length === 0 && (
                                                <MenuItem
                                                    disabled
                                                    value=""
                                                >
                                                    {I18n.t('channelConfigDialog_noPages')}
                                                </MenuItem>
                                            )}
                                            {availablePages.map(page => (
                                                <MenuItem
                                                    key={page}
                                                    value={page}
                                                >
                                                    {page}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}

                                {/* ioBroker-Channel-Auswahl */}
                                <EntitySelector
                                    label={I18n.t('channelConfigDialog_channelId')}
                                    value={channelId}
                                    onChange={this.handleChannelIdChange}
                                    onCommit={this.handleChannelIdCommit}
                                    onTransformSelectedId={this.transformChannelId}
                                    socket={socket}
                                    theme={theme}
                                    themeType={themeType ?? 'light'}
                                    dialogName="channelConfigDialog"
                                    filterFunc={this.buildChannelFilterFunc()}
                                />
                                {/* Validierungshinweis Channel */}
                                {channelId !== '' && channelExists === false && !checkingChannel && (
                                    <Typography
                                        variant="caption"
                                        color="error"
                                        sx={{ mt: -1.5 }}
                                    >
                                        {I18n.t('channelConfigDialog_channelNotFound')}
                                    </Typography>
                                )}
                                {roleIsValid === false && !checkingChannel && (
                                    <Typography
                                        variant="caption"
                                        color="warning.main"
                                        sx={{ mt: -1.5 }}
                                    >
                                        {I18n.t('channelConfigDialog_unknownRoleHint')}
                                    </Typography>
                                )}

                                {/* Namensfeld */}
                                <TextField
                                    label={I18n.t('channelConfigDialog_name')}
                                    value={name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        this.setState({ name: e.target.value })
                                    }
                                    variant="standard"
                                    fullWidth
                                    disabled={fieldsDisabled}
                                    helperText={name === '' ? I18n.t('channelConfigDialog_defaultName') : undefined}
                                />

                                {/* Zweispaltiger Bereich: Wahr / Unwahr */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 2,
                                        flexWrap: 'wrap',
                                        opacity: fieldsDisabled ? 0.4 : 1,
                                        pointerEvents: fieldsDisabled ? 'none' : 'auto',
                                    }}
                                >
                                    {this.renderBranchColumn('true')}
                                    {this.renderBranchColumn('false')}
                                </Box>
                            </Box>
                        )}
                    </DialogContent>

                    <DialogActions>
                        {(expertMode || nativeMode) && (
                            <Button
                                size="small"
                                variant={nativeMode ? 'contained' : 'outlined'}
                                color={nativeMode ? 'warning' : 'inherit'}
                                onClick={this.handleNativeModeToggle}
                                sx={{ mr: 'auto' }}
                            >
                                {nativeMode
                                    ? I18n.t('channelConfigDialog_standard')
                                    : I18n.t('channelConfigDialog_native')}
                            </Button>
                        )}
                        <Button onClick={this.handleClose}>{I18n.t('channelConfigDialog_cancel')}</Button>
                        <Button
                            variant="contained"
                            onClick={this.handleSave}
                            disabled={!canSave || this.state.isSaving}
                            startIcon={
                                this.state.isSaving ? (
                                    <CircularProgress
                                        size={16}
                                        color="inherit"
                                    />
                                ) : undefined
                            }
                        >
                            {this.state.isSaving
                                ? I18n.t('channelConfigDialog_checking')
                                : I18n.t('channelConfigDialog_save')}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* CheckPageItemConfig Ergebnis-Dialog */}
                <Dialog
                    open={this.state.checkResultOpen}
                    onClose={this.state.checkResultIsError ? this.handleCheckResultClose : undefined}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        {this.state.checkResultIsError
                            ? I18n.t('channelConfigDialog_checkError_title')
                            : I18n.t('channelConfigDialog_checkLog_title')}
                    </DialogTitle>
                    <DialogContent>
                        <Alert
                            severity={this.state.checkResultIsError ? 'error' : 'success'}
                            sx={{ mb: this.state.checkResultMessages.length > 0 ? 1 : 0 }}
                        >
                            {this.state.checkResultIsError
                                ? I18n.t('channelConfigDialog_checkError_title')
                                : I18n.t('channelConfigDialog_checkLog_title')}
                        </Alert>
                        {this.state.checkResultMessages.length > 0 && (
                            <Box
                                sx={{
                                    maxHeight: 300,
                                    overflowY: 'auto',
                                    p: 1,
                                    backgroundColor: 'action.hover',
                                    borderRadius: 1,
                                }}
                            >
                                {this.state.checkResultMessages.map((msg, i) => (
                                    <Typography
                                        key={i}
                                        variant="body2"
                                        sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                                    >
                                        {msg}
                                    </Typography>
                                ))}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        {this.state.checkResultIsError ? (
                            <Button
                                variant="contained"
                                color="error"
                                onClick={this.handleCheckResultClose}
                            >
                                {I18n.t('channelConfigDialog_checkError_close')}
                            </Button>
                        ) : (
                            <>
                                <Button onClick={this.handleCheckResultClose}>
                                    {I18n.t('channelConfigDialog_cancel')}
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={this.handleCheckResultDone}
                                >
                                    {I18n.t('channelConfigDialog_checkLog_done')}
                                </Button>
                            </>
                        )}
                    </DialogActions>
                </Dialog>
            </>
        );
    }
}

export default ChannelConfigDialog;

/**
 * Wrapper damit ChannelConfigDialog als Custom-Component in der jsonConfig eingebunden
 * werden kann. Leitet socket, theme und themeType aus dem oContext-Prop weiter.
 */
export class ChannelConfigDialogJsonConfig extends ConfigGeneric<ConfigGenericProps, ConfigGenericState> {
    render(): React.JSX.Element {
        const { oContext } = this.props;
        return (
            <ChannelConfigDialog
                socket={oContext?.socket}
                theme={oContext?.theme}
                themeType={oContext?.themeType as string | undefined}
                adapterName={oContext?.adapterName as string | undefined}
                instance={oContext?.instance as number | undefined}
                oContext={oContext}
            />
        );
    }
}
