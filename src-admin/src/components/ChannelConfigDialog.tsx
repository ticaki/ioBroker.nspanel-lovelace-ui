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
    Autocomplete,
    CircularProgress,
    Tooltip,
    InputLabel,
    Select,
    MenuItem,
    FormLabel,
    Radio,
    RadioGroup,
} from '@mui/material';
import { Color, type ColorThemenInterface, type RGB } from '../../../src/lib/const/Color';
import { loadAdapterColorTheme, resolveThemeColor } from '../adapterColorTheme';
import {
    getPageItemDefaultsByRole,
    getPageNaviItemDefaultsByRole,
    type PageItemRoleDefaults,
} from '../../../src/lib/const/page-item-defaults';
import icons from '../icons.json';
import CancelIcon from '@mui/icons-material/Cancel';
import ErrorOutline from '@mui/icons-material/ErrorOutlineOutlined';
import PaletteIcon from '@mui/icons-material/Palette';
import { I18n, type ThemeName, type ThemeType } from '@iobroker/gui-components';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import RawItemConfigDialog, { RawItemButton, RawItemNotice, type RawItemValue } from './RawItemConfigDialog';
import { EntitySelector } from './EntitySelector';
import { dynamicNamePanelText, hasDynamicName, type ValuePreviewParts } from '../channelValueConfig';
import IconSelect from '../IconSelect';
import { channelIdOf, channelRolesOf, isInChannels } from '../channelSelection';
import SettingsIcon from '@mui/icons-material/Settings';
import ChannelValueDialog from './ChannelValueDialog';
import DeviceDetailsSection, { isBlockingDeviceError } from './DeviceDetailsSection';
import TargetPageSelect from './TargetPageSelect';
import { pageItemSaveState } from '../pageItemSaveState';
import {
    freshKindFields,
    freshShortPressFields,
    isItemKind,
    switchOption,
    type ItemKind,
    type ItemKindFields,
    type ItemTapFields,
    type OptionStash,
} from '../itemOptionStash';
import { applyDeviceAnswer } from '../deviceAnswer';
import {
    devicePageTargetProblem,
    devicePageToSave,
    shortPressToSave,
    switchLongPressTarget,
    withDevicePageIcon,
    type DevicePageSlotItemOptions,
    type LongPressStash,
    type LongPressTarget,
} from '../devicePageConfig';
import {
    devicePageConfigOf,
    devicePageSlotTargetOf,
    deviceShortPressOf,
    isDeviceDetailsConfig,
    updatedDeviceDetailsLearned,
    type DeviceDetailEntryConfig,
    type DeviceDetailsConfig,
    type DeviceDetailsInfo,
    type DeviceDetailsLearned,
    type DevicePageConfig,
    type DevicePageSlotRef,
    type DeviceSelectionError,
    type DeviceShortPress,
} from '../../../src/lib/types/deviceDetails';
import type {
    AlexaTimerConfig,
    IconScaleElement,
    AdminPageItemConfig,
    MenuEntry,
    Thermo2Entry,
    MediaEntry,
    ChannelValueConfig,
    ChannelColorConfig,
    ChannelModeListConfig,
    HmiTextSize,
    PageConfigEntry,
    ScreensaverEntry,
} from '../../../src/lib/types/adminShareConfig';
import {
    ADAPTER_NAME,
    CHANNEL_ROLES_LIST,
    screensaverTargetPage,
    isClockTimerSourceItem,
    requiredScriptDataPoints,
    emptyChannelValueConfig,
    isRawItemObject,
    isLongPressCard,
    isNameOnlyPopupTitle,
    normalizeChannelId,
    pageItemRawFormat,
    isAsciiOnlyTextSize,
    isIconTextSize,
    isAlexaTimerComplete,
    isAlexaTimerConfig,
    copyAlexaTimerConfig,
} from '../../../src/lib/types/adminShareConfig';
import { AlexaTimerSelect } from './AlexaTimerSelect';
import { textSizeLabel, textSizeOfOption, textSizeOptions } from '../textSizeOptions';
import { adminPageItemToScriptItem } from '../../../src/lib/configuration/admin-page-item';
import ChannelColorDialog from './ChannelColorDialog';
import ChannelModeListDialog from './ChannelModeListDialog';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { DocButton, DocHelp } from './DocHelp';
import { pageitemsTopicsOfChannel, pageitemsTopicsOfRole } from '../docTopics/pageitems';
import { isChannelStatesProblem } from '../channelDatapointCheck';

/**
 * Channel roles for which the adapter evaluates `modeList` (config-manager.ts): the light roles also use
 * `inSel_Alias`, role `select` takes the list only and selects through the channel's SET state.
 */
const MODE_LIST_ROLES: readonly string[] = ['rgbSingle', 'rgb', 'ct', 'hue', 'select'];

/**
 * Channel roles whose icon text takes `useValueConditions` (config-manager.ts, `iconTextDefaults` of
 * getPageItemConfig): the value is shown instead of the icon only while the expression is true.
 */
const USE_VALUE_CONDITIONS_ROLES: readonly string[] = [
    'info',
    'slider',
    'motion',
    'door',
    'window',
    'temperature',
    'value.temperature',
    'thermostat',
    'airCondition',
    'humidity',
    'value.humidity',
];

/** Same for navigation items (getPageNaviItemConfig): the humidity and temperature cases hand the condition on. */
const USE_VALUE_CONDITIONS_NAVI_ROLES: readonly string[] = [
    'thermostat',
    'airCondition',
    'temperature',
    'value.temperature',
    'humidity',
    'value.humidity',
];

/** Channel roles whose page item reads `minValue` / `maxValue` (config-manager.ts, case 'volume'). */
const VALUE_RANGE_ROLES: readonly string[] = ['volume'];

/** Channel roles whose page item reads `secondRow` (config-manager.ts, case 'blind'). */
const SECOND_ROW_ROLES: readonly string[] = ['blind'];
/** Channel roles whose page item reads `useScreensaverTimer` (config-manager.ts, case 'level.timer'). */
const SCREENSAVER_TIMER_ROLES: readonly string[] = ['level.timer'];

/**
 * Page types whose items can be a timer (role level.timer - no page type of the dialog excludes it): only there the
 * dialog offers the kind "Alexa timer".
 */
const ALEXA_TIMER_CARDS: readonly string[] = [
    'cardGrid',
    'cardGrid2',
    'cardGrid3',
    'cardEntities',
    'cardSchedule',
    'cardThermo2',
    'cardMedia',
];

/** role an item of kind "Alexa timer" is stored with: icons and defaults of a timer */
const ALEXA_TIMER_ROLE = 'level.timer';

/**
 * Channel roles whose page item reads `minValueBrightness` / `maxValueBrightness` and `colormode`
 * (config-manager.ts, case 'dimmer' and the color branch 'rgbSingle' / 'ct' / 'rgb' / 'hue'). Role light does not.
 */
const BRIGHTNESS_ROLES: readonly string[] = ['dimmer', 'ct', 'rgb', 'rgbSingle', 'hue'];

/** Channel roles whose page item reads `minValueColorTemp` / `maxValueColorTemp` (the color branch only). */
const COLOR_TEMP_ROLES: readonly string[] = ['ct', 'rgb', 'rgbSingle', 'hue'];

/** the number fields of a light item: lower / upper end of the brightness and the color temperature slider */
type LightRangeKey = 'minValueBrightness' | 'maxValueBrightness' | 'minValueColorTemp' | 'maxValueColorTemp';

export type { AdminPageItemConfig as PageItemConfig };

type ChannelConfigDialogProps = {
    socket: any;
    theme?: any;
    themeType?: ThemeType;
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
    currentPageCard?: MenuEntry['card'] | Thermo2Entry['card'] | MediaEntry['card'];
    /** cardThermo2: Bezeichnungen der Heizkreise (Index = filter); gesetzt → Heizkreis-Auswahl sichtbar */
    heatCircuits?: string[];
    onSave?: (config: AdminPageItemConfig) => void;
    /** Vorausgefüllte Channel-ID für Testzwecke */
    initialChannelId?: string;
    /** Trigger-Button ausblenden; Dialog wird per openWith()-Methode geöffnet */
    hideTriggerButton?: boolean;
    /** device with details: the learned ticks per adapter (native `deviceDetailsLearned`) */
    deviceDetailsLearned?: DeviceDetailsLearned;
    /** device with details: the learned ticks changed with a saved item */
    onDeviceDetailsLearnedChange?: (learned: DeviceDetailsLearned) => void;
    /**
     * the choice of the data point / channel is not shown (with the kind of the item, "custom" and the raw data):
     * the dialog edits the settings of a slot of the device page, whose source is chosen at the slot
     * ({@link ChannelConfigDialog.openWith} with slot options)
     */
    hideChannelSelection?: boolean;
};

/** a slot of the device page whose settings the inner dialog edits: what it offers and where the result goes */
interface SlotEdit {
    options: DevicePageSlotItemOptions;
    onApply: (item: AdminPageItemConfig) => void;
}

interface ChannelConfigDialogState {
    open: boolean;
    isGridCard: boolean;
    channelId: ChannelValueConfig;
    name: string;
    isNavigation: boolean;
    isCustom: boolean;
    targetPage: string;
    targetPageLongPress: string | null | undefined;
    longPress: string | null | undefined;
    availablePages: string[];
    loadingPages: boolean;
    trueIcon: string;
    trueColor: string;
    falseIcon: string;
    falseColor: string;
    /** null = nicht geprüft, true = existiert, false = existiert nicht */
    channelExists: boolean | null;
    checkingChannel: boolean;

    // null=kein State, undefined=kein boolean State, true/false=boolean State mit write=true/false
    stateIsWriteable?: boolean | null;
    /** common.role des gewählten ioBroker-Objekts */
    channelRole: string | null;
    /** true wenn channelRole eine bekannte ScriptConfig.channelRole ist */
    roleIsValid: boolean | null;
    /** Vorgeladene Channel-IDs mit passender Rolle – Basis für filterFunc */
    validChannelIds: string[];
    /** raw data of the item (dialog RawItemConfigDialog); set = raw mode, the standard fields are not used */
    raw: RawItemValue | null;
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
    /** Fehlende Pflicht-Datenpunkte (nach Datapoint-Prüfung) */
    datapointErrors: string[];
    /** Doppelt gemappte Datenpunkte (mehrere States passen auf dieselbe Rolle) */
    datapointDuplicates: string[];
    /** true während Datapoint-Prüfung läuft */
    checkingDatapoints: boolean;
    /** Vorgeschlagener Name aus common.name des Channels – wird nicht gespeichert */
    channelNameSuggestion: string;
    /** Value-display configuration (undefined = not configured) */
    valueEntry: ChannelValueConfig | undefined;
    /** Last preview text computed inside ValueEntryDialog – purely for display in the name field */
    valueEntryPreview: string;
    /** Resolved prefix / value / suffix of the last preview - the panel text with a filled Name field */
    valueEntryParts: ValuePreviewParts | null;
    /** useValue Checkbox Auswahl */
    useValue: boolean;
    /** Textgröße 0–5 (undefined = Standard) */
    textSize: HmiTextSize | undefined;
    /** Farbthema aus der Adapter-Konfiguration */
    adapterColorTheme: ColorThemenInterface;
    scale?: IconScaleElement;
    hasProblems: boolean;
    colorFieldDisabled: boolean;
    /** Selection state for the mode list of light items (undefined = not configured) */
    inSel_Alias: string | undefined;
    /** cardThermo2: Heizkreis des Items (0-basiert); undefined = bei jedem Heizkreis sichtbar */
    filter: number | undefined;
    /** Mode list of light items (undefined = not configured) */
    modeList: string[] | undefined;
    /** JavaScript expression over `val` deciding whether the value is shown instead of the icon ('' = not set) */
    useValueConditions: string;
    /** Role volume: lower end of the volume slider (undefined = panel default) */
    minValue: number | undefined;
    /** Role volume: upper end of the volume slider (undefined = panel default) */
    maxValue: number | undefined;
    /** Role blind: second text row of the shutter popup ('' = not set) */
    secondRow: string;
    /** Role level.timer: the item uses the timer of the screensaver of this panel */
    useScreensaverTimer: boolean;
    /** kind "Alexa timer": the Echo device, null = standard item (channel, custom button, navigation) */
    alexaTimer: AlexaTimerConfig | null;
    /** internal id of the item: kept as it is, the page editor gives a new item its id */
    itemId: string | undefined;
    /** stored tables: the screensaver of the panel may use this item as its source (circle) */
    timerSourceTables: { screensavers: ScreensaverEntry[]; pages: PageConfigEntry[] };
    /** Light roles: brightness slider range (undefined = panel default) */
    minValueBrightness: number | undefined;
    maxValueBrightness: number | undefined;
    /** Color light roles: color temperature slider range (undefined = panel default) */
    minValueColorTemp: number | undefined;
    maxValueColorTemp: number | undefined;
    /** Light roles: color mode switched on */
    colormode: boolean;
    /** device with details (doc/ideas/device-details): null = the item is no device item */
    device: DeviceDetailsConfig | null;
    /** the reason of the adapter why the device cannot be used, undefined = ok or no answer (adapter offline) */
    deviceError: DeviceSelectionError | undefined;
    /**
     * the device the entries of the device item belong to; another device gets the learned ticks (deviceAnswer). Kept
     * in the state next to the entries: two answers of the adapter that come before React renders must see both of
     * the same moment, else the second takes the first's device but the old (empty) entries.
     */
    deviceEntriesId: string;
    /**
     * the dialog edits a slot of the device page (opened with slot options): only the fields the slot takes are shown
     * (DevicePageSlotItemOptions), null = a page item
     */
    slot: DevicePageSlotItemOptions | null;
}

/** Minimales leeres ioBroker.InstanceCommon für ConfigGeneric-Komponenten */
const EMPTY_COMMON: ioBroker.InstanceCommon = {} as ioBroker.InstanceCommon;

/** Verzögerung in ms bevor Datapoint-Prüfung beim Eintippen startet */
const DATAPOINT_CHECK_DEBOUNCE_MS = 800;

/**
 * Dialog zum Konfigurieren eines ioBroker-Channels mit
 * optionalem Navigations-Zielseiten-Selector.
 * Optik analog zu den Panel-Boxen in PagePanelOverview.
 */
class ChannelConfigDialog extends React.Component<ChannelConfigDialogProps, ChannelConfigDialogState> {
    private datapointCheckTimer: ReturnType<typeof setTimeout> | null = null;
    private valueEntryDialogRef = React.createRef<ChannelValueDialog>();
    private valueEntryDialogMain = React.createRef<ChannelValueDialog>();
    private colorDialogRef = React.createRef<ChannelColorDialog>();
    private modeListDialogRef = React.createRef<ChannelModeListDialog>();
    private rawDialogRef = React.createRef<RawItemConfigDialog>();
    /** the device configuration of the item when the dialog was opened - the learned ticks change only with its ticks */
    private deviceBefore: DeviceDetailsConfig | undefined = undefined;
    /** fields of the kinds not chosen right now (itemOptionStash) - kept while the dialog is open */
    private kindStash: OptionStash<ItemKind, ItemKindFields<ChannelValueConfig>> = {};
    /** fields of the short taps of a device item not chosen right now (itemOptionStash) */
    private shortPressStash: OptionStash<DeviceShortPress, ItemTapFields<ChannelValueConfig>> = {};
    /** the device page of a device item while its long press opens the detail page (devicePageConfig) */
    private longPressStash: LongPressStash = {};
    /** the device whose filter list the user saved in this dialog ('' = none) - only that may change the learned ticks */
    private deviceEntriesEdited = '';
    /** the inner dialog for the slots of the device page (only in a dialog that shows the channel selection) */
    private slotDialogRef = React.createRef<ChannelConfigDialog>();
    /** the slot the inner dialog is open for */
    private slotEdit: SlotEdit | null = null;
    private static iconMap: Map<string, string> | null = null;

    private static getIconBase64(name: string): string {
        if (!ChannelConfigDialog.iconMap) {
            ChannelConfigDialog.iconMap = new Map();
            for (const icon of icons as { name: string; base64: string }[]) {
                ChannelConfigDialog.iconMap.set(icon.name, icon.base64);
            }
        }
        return ChannelConfigDialog.iconMap.get(name) ?? '';
    }

    constructor(props: ChannelConfigDialogProps) {
        super(props);
        this.state = {
            open: false,
            channelId: emptyChannelValueConfig(props.initialChannelId ?? ''),
            name: '',
            isNavigation: false,
            isCustom: false,
            targetPage: '',
            targetPageLongPress: null,
            longPress: null,
            availablePages: [],
            isGridCard: false,
            loadingPages: false,
            trueIcon: '',
            trueColor: '',
            falseIcon: '',
            falseColor: '',
            channelExists: null,
            checkingChannel: false,
            channelRole: null,
            stateIsWriteable: null,
            roleIsValid: null,
            validChannelIds: [],
            raw: null,
            isSaving: false,
            checkResultOpen: false,
            checkResultMessages: [],
            checkResultIsError: false,
            checkResultPendingConfig: null,
            datapointErrors: [],
            datapointDuplicates: [],
            checkingDatapoints: false,
            hasProblems: false,
            channelNameSuggestion: '',
            valueEntry: undefined,
            valueEntryPreview: '',
            valueEntryParts: null,
            useValue: false,
            textSize: undefined,
            // the color button is hidden until checkDatapoints has looked at the channel
            colorFieldDisabled: true,
            adapterColorTheme: Color.defaultTheme,
            inSel_Alias: undefined,
            modeList: undefined,
            filter: undefined,
            useValueConditions: '',
            minValue: undefined,
            maxValue: undefined,
            secondRow: '',
            useScreensaverTimer: false,
            alexaTimer: null,
            itemId: undefined,
            timerSourceTables: { screensavers: [], pages: [] },
            minValueBrightness: undefined,
            maxValueBrightness: undefined,
            minValueColorTemp: undefined,
            maxValueColorTemp: undefined,
            colormode: false,
            device: null,
            deviceError: undefined,
            deviceEntriesId: '',
            slot: null,
        };
    }

    override componentWillUnmount(): void {
        if (this.datapointCheckTimer !== null) {
            clearTimeout(this.datapointCheckTimer);
        }
    }

    /**
     * Zieht die Zielseiten-Liste nach, wenn der Parent sie erst nachträglich liefert
     * (die Seitenliste wird asynchron per sendTo geladen und kann nach dem Öffnen des Dialogs eintreffen).
     *
     * @param prevProps Vorherige Props
     */
    override componentDidUpdate(prevProps: ChannelConfigDialogProps): void {
        if (prevProps.pagesList !== this.props.pagesList || prevProps.currentPageName !== this.props.currentPageName) {
            const pagesList = this.props.pagesList;
            if (pagesList && pagesList.length > 0) {
                this.setState({ availablePages: this.sortPages(pagesList) });
            }
        }
    }

    private handleOpen = (): void => {
        this.setState({
            open: true,
            datapointErrors: [],
            datapointDuplicates: [],
            checkResultMessages: [],
            checkResultOpen: false,
            checkResultIsError: false,
            checkResultPendingConfig: null,
            isSaving: false,
        });
        if (this.props.pagesList && this.props.pagesList.length > 0) {
            this.setState({ availablePages: this.sortPages(this.props.pagesList) });
        } else if (!this.state.loadingPages && this.state.availablePages.length === 0) {
            void this.loadAvailablePages();
        }
        if (this.state.validChannelIds.length === 0) {
            void this.loadValidChannels();
        }
        void this.loadAdapterColorTheme();
    };

    /**
     * Öffnet den Dialog mit optionalen Vorbelegungsdaten.
     * Wird von übergeordneten Komponenten per ref aufgerufen.
     *
     * @param data
     * @param isGridCard  (optional) true wenn die Daten von einem GridCard-Item stammen – steuert die Sichtbarkeit bestimmter Felder
     * @param slot (optional) the dialog edits a slot of the device page: the fields it offers
     */
    public openWith(data?: Partial<AdminPageItemConfig>, isGridCard?: boolean, slot?: DevicePageSlotItemOptions): void {
        void this.loadTimerSourceTables();
        const isNative = data?.useNative === true;
        const raw: RawItemValue | null =
            data && isNative
                ? { format: pageItemRawFormat(data), config: isRawItemObject(data.native) ? data.native : {} }
                : null;
        this.setState({
            open: true,
            channelId: normalizeChannelId(data?.channelId),
            name: data?.name ?? '',
            isNavigation: data?.isNavigation ?? false,
            isCustom: data?.type === 'custom',
            targetPage: data?.targetPage ?? '',
            targetPageLongPress: data?.targetPageLongPress || null,
            longPress: data?.longPress || null,
            trueIcon: data?.trueIcon ?? '',
            trueColor: data?.trueColor ?? '',
            falseIcon: data?.falseIcon ?? '',
            falseColor: data?.falseColor ?? '',
            channelExists: isNative ? true : null,
            checkingChannel: false,
            channelRole: data?.role ?? null,
            roleIsValid: null,
            raw,
            useValue: data?.useValue ?? false,
            textSize: data?.textSize,
            valueEntry: data?.valueEntry,
            valueEntryPreview: '',
            valueEntryParts: null,
            scale: data?.scale,
            datapointErrors: [],
            datapointDuplicates: [],
            checkResultMessages: [],
            checkResultOpen: false,
            checkResultIsError: false,
            checkResultPendingConfig: null,
            isSaving: false,
            // the color button is hidden until checkDatapoints has looked at the channel
            colorFieldDisabled: true,
            isGridCard: isGridCard ?? false,
            hasProblems: false,
            inSel_Alias:
                typeof data?.inSel_Alias === 'string' && data.inSel_Alias !== '' ? data.inSel_Alias : undefined,
            modeList: Array.isArray(data?.modeList) && data.modeList.length > 0 ? data.modeList : undefined,
            filter: typeof data?.filter === 'number' ? data.filter : undefined,
            useValueConditions: typeof data?.useValueConditions === 'string' ? data.useValueConditions : '',
            minValue: typeof data?.minValue === 'number' ? data.minValue : undefined,
            maxValue: typeof data?.maxValue === 'number' ? data.maxValue : undefined,
            secondRow: typeof data?.secondRow === 'string' ? data.secondRow : '',
            useScreensaverTimer: data?.useScreensaverTimer === true,
            alexaTimer:
                !isNative && isAlexaTimerConfig(data?.alexaTimer) ? copyAlexaTimerConfig(data.alexaTimer) : null,
            itemId: typeof data?.itemId === 'string' ? data.itemId : undefined,
            minValueBrightness: typeof data?.minValueBrightness === 'number' ? data.minValueBrightness : undefined,
            maxValueBrightness: typeof data?.maxValueBrightness === 'number' ? data.maxValueBrightness : undefined,
            minValueColorTemp: typeof data?.minValueColorTemp === 'number' ? data.minValueColorTemp : undefined,
            maxValueColorTemp: typeof data?.maxValueColorTemp === 'number' ? data.maxValueColorTemp : undefined,
            colormode: data?.colormode === true,
            device: isDeviceDetailsConfig(data?.device) ? ChannelConfigDialog.deviceOfStored(data.device) : null,
            deviceError: undefined,
            deviceEntriesId: isDeviceDetailsConfig(data?.device) ? data.device.deviceId.trim() : '',
            slot: slot ?? null,
        });
        this.deviceBefore = isDeviceDetailsConfig(data?.device) ? structuredClone(data.device) : undefined;
        this.kindStash = {};
        this.shortPressStash = {};
        this.longPressStash = {};
        this.deviceEntriesEdited = '';
        if (this.props.pagesList && this.props.pagesList.length > 0) {
            this.setState({ availablePages: this.sortPages(this.props.pagesList) });
        } else if (!this.state.loadingPages && this.state.availablePages.length === 0) {
            void this.loadAvailablePages();
        }
        if (this.state.validChannelIds.length === 0) {
            void this.loadValidChannels();
        }
        const channelIdToCheck = normalizeChannelId(data?.channelId).valueStateId;
        if (!isNative && channelIdToCheck) {
            void this.checkChannelExists(channelIdToCheck, data?.type === 'custom');
        }
        if (data?.valueEntry && hasDynamicName(data.valueEntry)) {
            this.valueEntryDialogRef.current?.triggerPreviewFor(data.valueEntry);
        }
        void this.loadAdapterColorTheme();
    }

    private handleClose = (): void => {
        this.setState({ open: false });
    };

    private handleColorOpen = (): void => {
        this.colorDialogRef.current?.openWith({
            trueColor: this.state.trueColor,
            falseColor: this.state.falseColor,
            scale: this.state.scale,
        });
    };

    private handleModeListOpen = (): void => {
        this.modeListDialogRef.current?.openWith({
            inSel_Alias: this.state.inSel_Alias,
            modeList: this.state.modeList,
        });
    };

    private handleModeListSave = (config: ChannelModeListConfig): void => {
        this.setState({
            inSel_Alias: config.inSel_Alias,
            modeList: config.modeList,
        });
    };

    private async loadTimerSourceTables(): Promise<void> {
        const socket = this.props.oContext?.socket ?? this.props.socket;
        const instance = this.props.oContext?.instance ?? this.props.instance ?? 0;
        if (!socket) {
            return;
        }
        try {
            const obj: ioBroker.Object | null | undefined = await socket.getObject(
                `system.adapter.${this.props.adapterName ?? ADAPTER_NAME}.${instance}`,
            );
            const screensavers: unknown = obj?.native?.screensaverConfig;
            const pages: unknown = obj?.native?.pageConfig;
            this.setState({
                timerSourceTables: {
                    screensavers: Array.isArray(screensavers) ? screensavers : [],
                    pages: Array.isArray(pages) ? pages : [],
                },
            });
        } catch {
            /* the adapter finds a circle at runtime as well */
        }
    }

    /**
     * @returns true while the screensaver of this panel has this item as its source
     */
    private isTimerSourceOfScreensaver(): boolean {
        const { screensavers, pages } = this.state.timerSourceTables;
        return isClockTimerSourceItem(screensavers, pages, this.props.currentPageName ?? '', this.state.itemId);
    }

    /**
     * Whether the item shows the timer of the screensaver: option set, timer role, and not the screensaver's source.
     *
     * @returns True if `useScreensaverTimer` takes effect.
     */
    private usesScreensaverTimer(): boolean {
        return (
            this.state.useScreensaverTimer &&
            SCREENSAVER_TIMER_ROLES.includes(this.state.channelRole ?? '') &&
            !this.isTimerSourceOfScreensaver()
        );
    }

    private async loadAdapterColorTheme(): Promise<void> {
        const { socket, adapterName, instance } = this.props;
        this.setState({ adapterColorTheme: await loadAdapterColorTheme(socket, adapterName, instance) });
    }

    private getThemeColors(): { on: RGB; off: RGB } {
        const theme = this.state.adapterColorTheme;
        return { on: theme.on, off: theme.off };
    }

    /**
     * Returns on/off colors for the currently selected role.
     * Falls back to the generic theme colors when no role-specific entry is found.
     */
    /*private getRoleDefaultColors(): { on: RGB; off: RGB } {
        const defaults = this.getDefaultsForRole(this.state.channelRole, this.state.isNavigation);
        const themeColors = this.getThemeColors();
        if (!defaults) {
            return themeColors;
        }
        const on = this.getThemeColorForKey(defaults.colorOn) ?? themeColors.on;
        const off = this.getThemeColorForKey(defaults.colorOff) ?? themeColors.off;
        return { on, off };
    }
    */
    /**
     * Resolves a color key (e.g. 'on', 'activated', 'Green') to an RGB value
     * using the currently selected color theme.
     *
     * @param colorKey
     */
    private getThemeColorForKey(colorKey: string): RGB | null {
        return resolveThemeColor(this.state.adapterColorTheme, colorKey);
    }

    /**
     * Returns the default icon / color entry for a given role and navigation flag.
     * Returns null if no entry is found.
     *
     * @param role
     * @param isNavigation
     */
    private getDefaultsForRole(role: string | null, isNavigation: boolean): PageItemRoleDefaults | null {
        if (!role) {
            return null;
        }
        return isNavigation ? getPageNaviItemDefaultsByRole(role) : getPageItemDefaultsByRole(role);
    }

    /**
     * The item is a navigation item (other defaults and fields of the role). The navigation of a slot of the device
     * page is no navigation item: the item of the slot stays the item of its role, the device page handles the tap.
     */
    private itemIsNavigation(): boolean {
        return this.state.slot === null && this.state.isNavigation;
    }

    private handleColorSave = (config: ChannelColorConfig): void => {
        this.setState({
            trueColor: config.trueColor ?? '',
            falseColor: config.falseColor ?? '',
            scale: config.scale,
        });
    };

    /**
     * Target page after pressing: normal (non-navigation, non-custom) items of role button. The adapter
     * presses the button and then changes to the page (config-manager.ts getPageItemConfig sets `setNavi`
     * from `targetPage` for items of type button; the custom branch returns earlier and ignores it).
     */
    private isButtonTargetPageVisible(): boolean {
        return !this.state.raw && this.isButtonTargetPageAllowed();
    }

    /** the item takes a target page without navigation (role button) - independent of the raw mode */
    private isButtonTargetPageAllowed(): boolean {
        const { channelRole, isCustom, isNavigation, slot } = this.state;
        // a slot of the device page: its own navigation of the short tap stands for it
        return slot === null && !isNavigation && !isCustom && channelRole === 'button';
    }

    /**
     * Long press fieldset visible: grid pages cardGrid / cardGrid2 / cardGrid3 only - only their items send a long
     * press on the HMI ({@link isLongPressCard}, independent of the isGridCard flag of openWith()), for role button,
     * custom and navigation items only (intentionally narrow - items with a popup collide with the long press).
     */
    private isLongPressVisible(): boolean {
        return !this.state.raw && this.isLongPressAllowed();
    }

    /**
     * the item takes a long press (page type and kind of item) - independent of the raw mode; the long press of a
     * device item opens its detail page
     */
    private isLongPressAllowed(): boolean {
        const { channelRole, isCustom, isNavigation, device, slot } = this.state;
        if (slot !== null) {
            return slot.longPress;
        }
        return (
            device === null &&
            isLongPressCard(this.props.currentPageCard) &&
            (channelRole === 'button' || isCustom || isNavigation)
        );
    }

    /**
     * The kind "device with details" is offered where a long press (grid pages) or a tap on the left part of an item
     * (cardEntities) reaches the item ({@link isLongPressCard}) - a device item keeps it everywhere, also while the
     * dialog shows the standard kind.
     */
    private isDeviceAllowed(): boolean {
        return (
            this.state.device !== null ||
            this.kindStash.device !== undefined ||
            isLongPressCard(this.props.currentPageCard)
        );
    }

    /**
     * Font size (textSize) visible: grid cards and cardThermo2 - the HMI reads the font id suffix of the icon text
     * there. cardThermo2 is checked explicitly, independent of the isGridCard flag of openWith().
     */
    private isTextSizeVisible(): boolean {
        const { slot } = this.state;
        if (slot !== null) {
            return slot.textSize;
        }
        return this.state.isGridCard || this.props.currentPageCard === 'cardThermo2';
    }

    /**
     * The page shows no item names on the card, the name is only the title of the item's popup
     * ({@link isNameOnlyPopupTitle}) - the one source for the name texts of the dialog.
     */
    private get nameIsPopupTitle(): boolean {
        return isNameOnlyPopupTitle(this.props.currentPageCard);
    }

    /** Hint of the dynamic name dialog, with the popup note where the name is only the popup title */
    private dynamicNameHint(): string {
        const hint = I18n.t('channelConfigDialog_dynamicNameHint');
        return this.nameIsPopupTitle ? `${hint}\n${I18n.t('channelConfigDialog_namePopupTitleHint')}` : hint;
    }

    /** Helper text below the Name field: name suggestion / default, plus the popup note where it applies */
    private nameHelperText(): string | undefined {
        const { name, channelNameSuggestion, slot, valueEntry, valueEntryParts } = this.state;
        if (slot !== null && slot.source !== 'channel') {
            // a state slot: the name of the mask entry / state, a navigation slot: the name of the target page
            return name === ''
                ? I18n.t(
                      slot.source === 'navigation'
                          ? 'deviceDetailsDialog_slotNameNavigationHint'
                          : 'deviceDetailsDialog_slotNameHint',
                  )
                : undefined;
        }
        const dynamicName = hasDynamicName(valueEntry);
        // a fixed name with prefix / suffix of the dynamic name: show what the panel will show
        const panelText =
            dynamicName && name !== '' && valueEntryParts && (valueEntryParts.prefix || valueEntryParts.suffix)
                ? `${I18n.t('channelConfigDialog_namePanelPreview')}: ${dynamicNamePanelText(name, valueEntryParts)}`
                : undefined;
        // with a dynamic name the channel name is no longer used - the placeholder shows the panel text
        const base = panelText
            ? panelText
            : dynamicName && name === ''
              ? undefined
              : name === '' && channelNameSuggestion
                ? `${I18n.t('channelConfigDialog_nameSuggestion')}: ${channelNameSuggestion}`
                : name === ''
                  ? I18n.t('channelConfigDialog_defaultName')
                  : undefined;
        if (!this.nameIsPopupTitle) {
            return base;
        }
        const popup = I18n.t('channelConfigDialog_namePopupTitleHint');
        return base ? `${popup}\n${base}` : popup;
    }

    /**
     * The item sends a value text instead of an icon: only `useValue` on grid cards - the adapter ignores
     * `useValue` on other page types, there the field always carries the icon.
     */
    private showsValueText(): boolean {
        return this.state.isGridCard && this.state.useValue;
    }

    /** The text sizes offered in the select ({@link textSizeOptions}) */
    private textSizeOptions(): string[] {
        return textSizeOptions(this.state.textSize, this.showsValueText());
    }

    /**
     * Label of a text size option ({@link textSizeLabel})
     *
     * @param option the option value ('' = default)
     */
    private textSizeLabel(option: string): string {
        return textSizeLabel(option, key => I18n.t(key));
    }

    /** Hint below the text size select: an icon in a font without icons, or a value in the ASCII-only font */
    private textSizeHint(): { text: string; warning: boolean } | null {
        const { textSize } = this.state;
        if (!this.showsValueText()) {
            return isIconTextSize(textSize)
                ? null
                : { text: I18n.t('valueEntryDialog_textSizeIconEmpty'), warning: true };
        }
        return isAsciiOnlyTextSize(textSize)
            ? { text: I18n.t('valueEntryDialog_textSizeAsciiHint'), warning: false }
            : null;
    }

    /**
     * Baut die zu speichernde PageItemConfig aus dem aktuellen State zusammen. Im Rohdaten-Modus bleiben die
     * Standardfelder erhalten (für „Zurück zum Standard“), zur Laufzeit gilt nur `native`.
     */
    private buildSaveConfig(): AdminPageItemConfig {
        const standard = this.buildStandardConfig();
        const { raw } = this.state;
        if (raw) {
            return { ...standard, useNative: true, nativeFormat: raw.format, native: raw.config };
        }
        return standard;
    }

    /** the item from the standard fields of the dialog, regardless of the raw mode */
    private buildStandardConfig(): AdminPageItemConfig {
        const alexaTimer = this.state.alexaTimer;
        if (alexaTimer !== null) {
            return this.buildAlexaTimerConfig(alexaTimer);
        }
        const {
            channelId,
            name,
            isNavigation,
            targetPageLongPress,
            longPress,
            isCustom,
            targetPage,
            trueIcon,
            trueColor,
            falseIcon,
            falseColor,
            channelRole,
            useValue,
            scale,
            textSize,
            inSel_Alias,
            modeList,
            filter,
            useValueConditions,
            minValue,
            maxValue,
            secondRow,
            colormode,
        } = this.state;
        // '' and non-finite numbers are "not set" - the field is left out of the stored item
        const useValueConditionsOut = useValueConditions.trim() !== '' ? useValueConditions.trim() : undefined;
        const minValueOut = minValue !== undefined && Number.isFinite(minValue) ? minValue : undefined;
        const maxValueOut = maxValue !== undefined && Number.isFinite(maxValue) ? maxValue : undefined;
        // the adapter reads the light ranges only when they are truthy - 0 is stored as "not set"
        // hidden long press fieldset: store nothing, so no stale value reaches the adapter
        const longPressAllowed = this.isLongPressAllowed();
        // a slot of the device page has no navigation by long press
        const targetPageLongPressOut =
            longPressAllowed && this.state.slot === null ? targetPageLongPress || null : null;
        const longPressOut = longPressAllowed ? longPress || null : null;
        // navigation items keep their target page, otherwise only a button item stores one
        const targetPageOut = isNavigation || this.isButtonTargetPageAllowed() ? targetPage : '';
        const lightRange = (value: number | undefined): number | undefined =>
            value !== undefined && Number.isFinite(value) && value !== 0 ? value : undefined;
        const extraFields: Pick<
            AdminPageItemConfig,
            'secondRow' | 'useScreensaverTimer' | 'itemId' | 'colormode' | LightRangeKey
        > = {
            secondRow: secondRow !== '' ? secondRow : undefined,
            itemId: this.state.itemId,
            useScreensaverTimer:
                this.state.useScreensaverTimer &&
                SCREENSAVER_TIMER_ROLES.includes(channelRole ?? '') &&
                !this.isTimerSourceOfScreensaver()
                    ? true
                    : undefined,
            minValueBrightness: lightRange(this.state.minValueBrightness),
            maxValueBrightness: lightRange(this.state.maxValueBrightness),
            minValueColorTemp: lightRange(this.state.minValueColorTemp),
            maxValueColorTemp: lightRange(this.state.maxValueColorTemp),
            colormode: colormode ? true : undefined,
        };
        const { device } = this.state;
        return {
            channelId: channelId,
            role: channelRole ?? undefined,
            name,
            isNavigation,
            device:
                device !== null
                    ? {
                          deviceId: device.deviceId.trim(),
                          shortPress: shortPressToSave(device),
                          entries: device.entries,
                          devicePage: devicePageToSave(device),
                      }
                    : undefined,
            type: isCustom ? 'custom' : undefined,
            targetPage: targetPageOut,
            targetPageLongPress: targetPageLongPressOut,
            longPress: longPressOut,
            trueIcon,
            trueColor,
            falseIcon,
            falseColor,
            textSize,
            useValue,
            scale,
            inSel_Alias,
            modeList,
            filter,
            useValueConditions: useValueConditionsOut,
            minValue: minValueOut,
            maxValue: maxValueOut,
            ...extraFields,
            valueEntry: this.state.valueEntry,
        };
    }

    /**
     * The item of kind "Alexa timer": the Echo device, name, icons and colors - the fields of the standard kind are
     * not stored with it.
     *
     * @param alexaTimer the Echo device
     */
    private buildAlexaTimerConfig(alexaTimer: AlexaTimerConfig): AdminPageItemConfig {
        const { name, trueIcon, trueColor, falseIcon, falseColor, itemId } = this.state;
        return {
            channelId: emptyChannelValueConfig(''),
            role: ALEXA_TIMER_ROLE,
            name,
            trueIcon,
            trueColor,
            falseIcon,
            falseColor,
            itemId,
            useValue: this.isAlexaUseValueVisible(alexaTimer) && this.state.useValue ? true : undefined,
            alexaTimer: copyAlexaTimerConfig(alexaTimer),
        };
    }

    /**
     * value instead of icon for the kind "Alexa timer": like for the channels only on grid cards, and only for the
     * timers - an alarm has no remaining time
     *
     * @param alexaTimer the Echo device
     */
    private isAlexaUseValueVisible(alexaTimer: AlexaTimerConfig): boolean {
        return this.state.isGridCard && alexaTimer.show !== 'alarm';
    }

    /** the dialog offers the kind "Alexa timer": pages with timer items, or an item that is one already */
    private isAlexaTimerAllowed(): boolean {
        return (
            this.state.alexaTimer !== null ||
            this.kindStash.alexaTimer !== undefined ||
            ALEXA_TIMER_CARDS.includes(this.props.currentPageCard ?? '')
        );
    }

    /**
     * The page item of kind "Alexa timer": Echo device, name, icons and colors.
     *
     * @param alexaTimer the Echo device
     */
    private renderAlexaTimerFields(alexaTimer: AlexaTimerConfig): React.JSX.Element {
        const { name } = this.state;
        return (
            <>
                <AlexaTimerSelect
                    socket={this.props.oContext?.socket ?? this.props.socket}
                    value={alexaTimer}
                    onChange={value => this.setState({ alexaTimer: value })}
                    offerAlarms
                />
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: -1 }}
                >
                    {I18n.t(
                        alexaTimer.show === 'alarm'
                            ? 'channelConfigDialog_alexaAlarmHint'
                            : 'channelConfigDialog_alexaTimerHint',
                    )}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                        label={I18n.t('channelConfigDialog_name')}
                        value={name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.setState({ name: e.target.value })}
                        variant="standard"
                        sx={{ flex: 1 }}
                        helperText={name === '' ? I18n.t('channelConfigDialog_defaultName') : undefined}
                        slotProps={{ formHelperText: { sx: { color: 'text.disabled' } } }}
                    />
                    <DocHelp
                        topic="pageitems.name"
                        sx={{ ml: 0, flexShrink: 0 }}
                    />
                </Box>
                {this.isAlexaUseValueVisible(alexaTimer) && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={this.state.useValue}
                                    onChange={this.handleUseValueChange}
                                />
                            }
                            label={
                                <Typography variant="body1">{I18n.t('channelConfigDialog_useValueLabel')}</Typography>
                            }
                        />
                        <DocHelp
                            topic="pageitems.cardFields"
                            sx={{ ml: -1.5 }}
                        />
                    </Box>
                )}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {this.renderBranchColumn('true')}
                    {this.renderBranchColumn('false')}
                </Box>
            </>
        );
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
        if (config.device && !config.useNative && this.props.onDeviceDetailsLearnedChange) {
            const learned = updatedDeviceDetailsLearned(
                this.props.deviceDetailsLearned ?? {},
                this.deviceBefore,
                config.device,
                this.deviceEntriesEdited !== '' && this.deviceEntriesEdited === config.device.deviceId.trim(),
            );
            if (learned) {
                this.props.onDeviceDetailsLearnedChange(learned);
            }
        }
        this.handleClose();
    }

    private handleSave = (): void => {
        void this.handleSaveAsync();
    };

    private handleSaveAsync = async (): Promise<void> => {
        const configToSave = this.buildSaveConfig();
        if (this.state.slot !== null) {
            // a slot of the device page: the page item check is the one of the device item when it is saved
            this.commitSave(configToSave);
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

    private handleRawOpen = (): void => {
        if (this.state.raw) {
            this.rawDialogRef.current?.openWith(this.state.raw);
            return;
        }
        // standard item: the dialog starts with the script item the adapter builds from the fields
        this.rawDialogRef.current?.openWith(this.rawSuggestion(), false);
    };

    /**
     * The script item of the standard fields as raw data (format script), undefined while the item has
     * neither a channel nor a navigation target.
     */
    private rawSuggestion(): RawItemValue | undefined {
        const { channelId, isNavigation, targetPage } = this.state;
        if (!channelId.valueStateId && !(isNavigation && targetPage)) {
            return undefined;
        }
        const item = adminPageItemToScriptItem(this.buildStandardConfig());
        // JSON round trip: fields without a value (undefined) are left out of the text
        const config: unknown = item ? JSON.parse(JSON.stringify(item)) : undefined;
        return isRawItemObject(config) ? { format: 'script', config } : undefined;
    }

    private handleRawApply = (raw: RawItemValue): void => {
        this.setState({ raw });
    };

    private handleRawRemove = (): void => {
        this.setState({ raw: null });
        const id = this.state.channelId.valueStateId;
        if (id) {
            void this.checkChannelExists(id, this.state.isCustom);
        }
    };

    private async loadValidChannels(): Promise<void> {
        const { socket } = this.props;
        if (!socket) {
            return;
        }
        try {
            const objects: Record<string, ioBroker.Object> | null | undefined =
                await socket.getObjectViewSystem('channel');
            this.setState({ validChannelIds: Object.keys(channelRolesOf(objects, CHANNEL_ROLES_LIST)) });
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
        const { isCustom } = this.state;

        return (obj: ioBroker.Object): boolean => {
            if (isCustom) {
                return obj.common?.type === 'boolean';
            }
            const id = (obj as any)._id as string | undefined;
            if (!id) {
                return false;
            }
            return isInChannels(validChannelIds, id);
        };
    }

    /**
     * Reduziert eine ausgewählte ID auf den längsten passenden Channel-Prefix.
     *
     * @param id
     */
    private transformChannelId = (id: string): string => {
        const { validChannelIds, isCustom } = this.state;
        if (isCustom) {
            return id;
        }
        return channelIdOf(validChannelIds, id);
    };

    private handleChannelIdChange = (id: string): void => {
        this.setState({
            channelId: { ...this.state.channelId, valueStateId: id },
            channelExists: null,
            channelRole: null,
            stateIsWriteable: null,
            roleIsValid: null,
            datapointErrors: [],
            datapointDuplicates: [],
            channelNameSuggestion: '',
            // the color button waits for checkDatapoints instead of showing the verdict of the previous channel
            colorFieldDisabled: true,
        });
        if (this.datapointCheckTimer !== null) {
            clearTimeout(this.datapointCheckTimer);
        }
        const trimmed = id.trim();
        if (trimmed) {
            this.datapointCheckTimer = setTimeout(() => {
                void this.checkChannelExists(trimmed);
            }, DATAPOINT_CHECK_DEBOUNCE_MS);
        }
    };

    private handleChannelIdCommit = (id: string): void => {
        if (this.datapointCheckTimer !== null) {
            clearTimeout(this.datapointCheckTimer);
            this.datapointCheckTimer = null;
        }
        const trimmed = id.trim();
        if (trimmed) {
            void this.checkChannelExists(trimmed);
        } else {
            this.setState({
                channelExists: null,
                channelRole: null,
                stateIsWriteable: null,
                roleIsValid: null,
                datapointErrors: [],
                datapointDuplicates: [],
                colorFieldDisabled: true,
            });
        }
    };

    private async checkChannelExists(objectId: string, checked: boolean | undefined = undefined): Promise<void> {
        const { socket } = this.props;
        this.setState({ checkingChannel: true });
        if (!socket) {
            this.setState({ channelExists: false, checkingChannel: false, colorFieldDisabled: true });
            return;
        }
        try {
            const isCustom = checked === undefined ? this.state.isCustom : checked;
            const obj: ioBroker.Object | null | undefined = await socket.getObject(objectId);
            const role = obj?.common?.role ?? null;
            const stateIsWriteable =
                obj?.type === 'state' ? (obj.common.type !== 'boolean' ? undefined : obj.common?.write === true) : null;
            const channelRole = typeof role === 'string' ? role : null;
            const roleIsValid = channelRole !== null && (CHANNEL_ROLES_LIST as readonly string[]).includes(channelRole);
            const rawName: unknown = (obj as any)?.common?.name;
            let channelNameSuggestion = '';
            if (typeof rawName === 'string') {
                channelNameSuggestion = rawName;
            } else if (rawName && typeof rawName === 'object') {
                const nameMap = rawName as Record<string, string>;
                const lang: string = (I18n as any).getLanguage?.() ?? 'en';
                channelNameSuggestion = nameMap[lang] || nameMap.en || Object.values(nameMap)[0] || '';
            }
            this.setState(
                {
                    channelExists: obj != null,
                    channelRole,
                    stateIsWriteable,
                    roleIsValid: channelRole !== null ? roleIsValid : null,
                    checkingChannel: false,
                    channelNameSuggestion,
                },
                () => {
                    if (obj != null && roleIsValid && channelRole) {
                        void this.checkDatapoints(
                            objectId,
                            channelRole as keyof typeof requiredScriptDataPoints,
                            isCustom,
                        );
                    }
                },
            );
        } catch (e) {
            console.error('[ChannelConfigDialog] checkChannelExists failed for', objectId, e);
            this.setState({ channelExists: false, checkingChannel: false, colorFieldDisabled: true });
        }
    }

    /**
     * Prüft ob alle required=true Datenpunkte im Channel vorhanden sind.
     * Zeigt Fehler (fehlende States) und Duplikate (mehrere States treffen auf dieselbe Rolle).
     *
     * @param channelId  Die Channel-ID unter der die States gesucht werden
     * @param role       Die Channel-Rolle (Key in requiredScriptDataPoints)
     * @param isCustom   true wenn der Channel als "custom" getypt ist – dann werden die Rollenanforderungen ignoriert, aber die Datenpunkte trotzdem geprüft und Fehler/Duplikate angezeigt
     */
    private async checkDatapoints(
        channelId: string,
        role: keyof typeof requiredScriptDataPoints,
        isCustom: boolean = false,
    ): Promise<void> {
        const { socket } = this.props;
        if (!socket) {
            console.warn('[ChannelConfigDialog] checkDatapoints: no socket available, skipping check for', channelId);
            return;
        }

        this.setState({ checkingDatapoints: true });
        try {
            const prefix = `${channelId}.`;
            let colorFieldDisabled = true;
            const allObjects: Record<string, ioBroker.Object> | null | undefined =
                await socket.getObjectViewSystem('state');
            if (isCustom) {
                if (
                    !allObjects?.[channelId] ||
                    !allObjects?.[channelId]?.common?.type ||
                    allObjects[channelId].common.type !== 'boolean'
                ) {
                    console.warn(
                        `[ChannelConfigDialog] checkDatapoints: custom item has no boolean state at isCustom:${isCustom}`,
                        channelId,
                    );
                    this.setState({
                        datapointErrors: [],
                        datapointDuplicates: [],
                        checkingDatapoints: false,
                        hasProblems: true,
                        colorFieldDisabled,
                    });
                    return;
                }
                // Bei Custom-Items wird die ID direkt als boolean-State verwendet –
                // keine Datenpunkt-Rollenprüfung nötig, unabhängig von childStates.
                this.setState({
                    datapointErrors: [],
                    datapointDuplicates: [],
                    checkingDatapoints: false,
                    hasProblems: false,
                    colorFieldDisabled,
                });
                return;
            }

            if (this.itemIsNavigation()) {
                const defaults = getPageNaviItemDefaultsByRole(role);
                colorFieldDisabled = defaults?.type !== 'number' && defaults?.type !== 'mixed';
            } else {
                const defaults = getPageItemDefaultsByRole(role);
                colorFieldDisabled = defaults?.type !== 'number' && defaults?.type !== 'mixed';
            }
            // Alle direkten Kind-States (nur eine Ebene tiefer) mit ihrem Key-Namen
            const childStates: { key: string; common: ioBroker.StateCommon }[] = [];
            for (const [id, stateObj] of Object.entries(allObjects ?? {})) {
                if (!id.startsWith(prefix)) {
                    continue;
                }
                // Keine weiteren Ebenen (kein weiterer Punkt nach prefix)
                const rest = id.slice(prefix.length);
                if (rest.includes('.')) {
                    continue;
                }
                childStates.push({ key: rest, common: (stateObj as any).common as ioBroker.StateCommon });
            }

            const dpDef = requiredScriptDataPoints[role]?.data as
                | Record<
                      string,
                      {
                          role: string | string[];
                          type: string | string[];
                          writeable?: boolean;
                          required: boolean;
                          alternate?: string;
                          useKey?: boolean;
                      }
                  >
                | undefined;
            // an empty channel is fine for a role whose datapoints are all optional (level.timer: internal timer)
            if (!dpDef || isChannelStatesProblem(dpDef, childStates.length)) {
                console.warn(
                    '[ChannelConfigDialog] checkDatapoints: no dpDef or no required states for role',
                    role,
                    'in',
                    channelId,
                );
                this.setState({
                    datapointErrors: [],
                    datapointDuplicates: [],
                    checkingDatapoints: false,
                    hasProblems: true,
                });
                return;
            }

            const errors: string[] = [];
            const duplicates: string[] = [];

            for (const [dpKey, dp] of Object.entries(dpDef)) {
                if (!dp.required) {
                    continue;
                }

                const roles = Array.isArray(dp.role) ? dp.role : [dp.role];
                const types = Array.isArray(dp.type) ? dp.type : [dp.type];

                // Erste role+type-Kombination suchen, die mindestens einen State trifft.
                // Beim ersten Treffer wird abgebrochen – weitere Kombis werden nicht probiert.
                let matched: { key: string; common: ioBroker.StateCommon }[] = [];
                outer: for (const r of roles) {
                    for (const t of types) {
                        const candidates = childStates.filter(s => {
                            if (dp.useKey === true && s.key !== dpKey) {
                                return false;
                            }
                            if (s.common.role !== r) {
                                return false;
                            }
                            if ((s.common.type as string) !== t) {
                                return false;
                            }
                            if (dp.writeable === true && s.common.write === false) {
                                return false;
                            }
                            return true;
                        });
                        if (candidates.length > 0) {
                            matched = candidates;
                            break outer;
                        }
                    }
                }

                // Alternate-Fallback prüfen
                let foundViaAlternate = false;
                if (matched.length === 0 && dp.alternate) {
                    const altDp = dpDef[dp.alternate];
                    if (altDp) {
                        const altKey = dp.alternate;
                        const altRoles = Array.isArray(altDp.role) ? altDp.role : [altDp.role];
                        const altTypes = Array.isArray(altDp.type) ? altDp.type : [altDp.type];
                        foundViaAlternate = childStates.some(
                            s =>
                                (altDp.useKey !== true || s.key === altKey) &&
                                altRoles.includes(s.common.role) &&
                                altTypes.includes(s.common.type) &&
                                (altDp.writeable !== true || s.common.write !== false),
                        );
                    }
                }

                if (matched.length === 0 && !foundViaAlternate) {
                    errors.push(dpKey);
                } else if (matched.length > 1) {
                    // Alle matched-States haben dieselbe role+type (Abbruch beim ersten Treffer),
                    // daher reicht matched.length > 1 als Duplikat-Kriterium.
                    duplicates.push(dpKey);
                }
            }

            if (errors.length > 0) {
                console.warn(
                    '[ChannelConfigDialog] checkDatapoints: missing required datapoints in',
                    channelId,
                    '(role:',
                    role,
                    '):',
                    errors,
                );
            }
            if (duplicates.length > 0) {
                console.warn(
                    '[ChannelConfigDialog] checkDatapoints: duplicate datapoints in',
                    channelId,
                    '(role:',
                    role,
                    '):',
                    duplicates,
                );
            }
            this.setState({
                datapointErrors: errors,
                datapointDuplicates: duplicates,
                checkingDatapoints: false,
                hasProblems: false,
                colorFieldDisabled,
            });
        } catch (e) {
            console.error('[ChannelConfigDialog] checkDatapoints failed for', channelId, e);
            this.setState({ checkingDatapoints: false, hasProblems: true });
        }
    }

    // "is a navigation" and "custom button" exclude each other: the adapter follows the navigation and
    // drops the role fields of a custom item, so the two checkboxes take each other back
    private handleNavigationChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const checked = event.target.checked;
        const dropCustom = checked && this.state.isCustom;
        this.setState({
            isNavigation: checked,
            targetPage: checked ? this.state.targetPage : '',
            isCustom: dropCustom ? false : this.state.isCustom,
            device: checked ? null : this.state.device,
        });
        if (dropCustom) {
            void this.checkChannelExists(this.state.channelId.valueStateId, false);
        }
    };

    private handleCustomChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        this.setCustom(event.target.checked);
    };

    /**
     * Custom item (a state switched on/off) or alias channel.
     *
     * @param checked true = custom item
     */
    private setCustom(checked: boolean): void {
        if (checked === this.state.isCustom) {
            return;
        }
        const dropNavigation = checked && this.state.isNavigation;
        this.setState({
            isCustom: checked,
            checkingChannel: true,
            isNavigation: dropNavigation ? false : this.state.isNavigation,
            targetPage: dropNavigation ? '' : this.state.targetPage,
        });
        void this.checkChannelExists(this.state.channelId.valueStateId, checked);
    }

    /**
     * The fields that belong to the chosen channel / state and are computed from it - reset when the option changes,
     * {@link recheckChannel} computes them again.
     */
    private resetChannelChecks(): Pick<
        ChannelConfigDialogState,
        | 'channelExists'
        | 'channelRole'
        | 'stateIsWriteable'
        | 'roleIsValid'
        | 'datapointErrors'
        | 'datapointDuplicates'
        | 'checkingChannel'
        | 'checkingDatapoints'
        | 'hasProblems'
    > {
        if (this.datapointCheckTimer !== null) {
            clearTimeout(this.datapointCheckTimer);
            this.datapointCheckTimer = null;
        }
        return {
            channelExists: null,
            channelRole: null,
            stateIsWriteable: null,
            roleIsValid: null,
            datapointErrors: [],
            datapointDuplicates: [],
            checkingChannel: false,
            checkingDatapoints: false,
            hasProblems: false,
        };
    }

    /**
     * Checks the channel / state an option brought back (the checks are not kept with it).
     *
     * @param fields the fields of the option
     */
    private recheckChannel(fields: ItemTapFields<ChannelValueConfig>): void {
        const id = fields.channelId.valueStateId.trim();
        if (id) {
            void this.checkChannelExists(id, fields.isCustom);
        }
    }

    /** the kind of the item the dialog shows */
    private currentKind(): ItemKind {
        return this.state.alexaTimer !== null ? 'alexaTimer' : this.state.device !== null ? 'device' : 'standard';
    }

    /**
     * The kind of the item: standard (channel, custom button, navigation), device with details or Alexa timer. The
     * fields of the kind left are kept until the dialog closes and come back with it ({@link switchOption}); a kind
     * chosen for the first time starts empty - a new device item switches a state of the device on a short tap.
     *
     * @param value the value of the radio group
     */
    private handleKindChange = (value: string): void => {
        if (!isItemKind(value)) {
            return;
        }
        const { device, deviceError, alexaTimer, isNavigation, targetPage, isCustom, channelId } = this.state;
        const from = this.currentKind();
        if (value === from) {
            return;
        }
        const { stash, fields } = switchOption(
            this.kindStash,
            from,
            { device, deviceError, alexaTimer, isNavigation, targetPage, isCustom, channelId },
            value,
            kind => freshKindFields(kind, emptyChannelValueConfig('')),
        );
        this.kindStash = stash;
        this.setState({ ...fields, ...this.resetChannelChecks() });
        this.recheckChannel(fields);
    };

    /**
     * The device configuration of a stored item for the dialog: a copy, the device page normalized.
     *
     * @param stored the stored device configuration
     * @returns the copy
     */
    private static deviceOfStored(stored: DeviceDetailsConfig): DeviceDetailsConfig {
        const { devicePage: rawPage, ...rest } = stored;
        const devicePage = devicePageConfigOf(rawPage);
        const device: DeviceDetailsConfig = { ...rest, entries: [...stored.entries] };
        return devicePage ? { ...device, devicePage } : device;
    }

    /**
     * What the long press of a device item opens. The device page left is kept until the dialog closes and comes back
     * with it; the first device page is suggested from the ticked rows ({@link switchLongPressTarget}).
     *
     * @param target the new target
     */
    private handleLongPressTargetChange = (target: LongPressTarget): void => {
        const { device } = this.state;
        if (!device) {
            return;
        }
        const switched = switchLongPressTarget(device, this.longPressStash, target);
        this.longPressStash = switched.stash;
        // the short tap "open the device page" needs the device page: without it the tap does nothing
        this.setState({ device: { ...switched.device, shortPress: shortPressToSave(switched.device) } });
    };

    /**
     * @param devicePage the changed device page of the device item
     */
    private handleDevicePageChange = (devicePage: DevicePageConfig): void => {
        this.setState(prev => (prev.device ? { device: { ...prev.device, devicePage } } : null));
    };

    private handleDeviceDetailsChange = (
        device: DeviceDetailsConfig,
        error: DeviceSelectionError | undefined,
    ): void => {
        this.setState({ device, deviceError: error });
    };

    /**
     * The filter list was saved: its entries belong to the device now.
     *
     * @param entries the ticked rows in their order
     */
    private handleDeviceEntriesChange = (entries: DeviceDetailEntryConfig[]): void => {
        const { device } = this.state;
        if (!device) {
            return;
        }
        const id = device.deviceId.trim();
        this.deviceEntriesEdited = id;
        this.setState({ device: { ...device, entries }, deviceEntriesId: id });
    };

    /**
     * The answer of the adapter for the device of the item. It may come after the short tap or the kind was switched:
     * it goes into the fields of the device and of the short tap `state` wherever they are now - shown or stashed
     * ({@link applyDeviceAnswer}).
     *
     * @param id the device the answer is for
     * @param answer the answer
     */
    private handleDeviceAnswer = (id: string, answer: DeviceDetailsInfo): void => {
        const learned = this.props.deviceDetailsLearned ?? {};
        // the short tap the answer changed - its channel checks run once the state is set
        let recheck: ItemTapFields<ChannelValueConfig> | null = null;
        // an updater, not this.state: two answers before React renders must not apply the second to the old fields
        this.setState(
            (prev): ChannelConfigDialogState | null => {
                if (!prev.open) {
                    return null;
                }
                const { device, deviceError, alexaTimer, isNavigation, targetPage, isCustom, channelId } = prev;
                const shown = device !== null;
                const kind = shown
                    ? { device, deviceError, alexaTimer, isNavigation, targetPage, isCustom, channelId }
                    : this.kindStash.device;
                if (!kind) {
                    return null;
                }
                const result = applyDeviceAnswer(
                    { kind, shortPressStash: this.shortPressStash, entriesDeviceId: prev.deviceEntriesId },
                    id,
                    answer,
                    learned,
                );
                if (!result) {
                    return null;
                }
                this.shortPressStash = result.shortPressStash;
                if (!shown) {
                    this.kindStash = { ...this.kindStash, device: result.kind };
                    return { ...prev, deviceEntriesId: result.entriesDeviceId };
                }
                const tapChanged =
                    result.kind.channelId.valueStateId !== channelId.valueStateId ||
                    (result.kind.device !== null &&
                        deviceShortPressOf(result.kind.device) !== deviceShortPressOf(device));
                if (!tapChanged) {
                    return { ...prev, ...result.kind, deviceEntriesId: result.entriesDeviceId };
                }
                recheck = result.kind;
                return {
                    ...prev,
                    ...result.kind,
                    ...this.resetChannelChecks(),
                    deviceEntriesId: result.entriesDeviceId,
                };
            },
            () => {
                if (recheck) {
                    this.recheckChannel(recheck);
                    recheck = null;
                }
            },
        );
    };

    /**
     * Short tap of a device item: a state of the device (custom item), nothing, a navigation or the popup of an alias
     * channel. The state / channel / target page of the short tap left is kept until the dialog closes and comes back
     * with it ({@link switchOption}).
     *
     * @param shortPress the new short tap
     */
    private handleDeviceShortPressChange = (shortPress: DeviceShortPress): void => {
        const { device, isNavigation, targetPage, isCustom, channelId } = this.state;
        if (!device) {
            return;
        }
        const from = deviceShortPressOf(device);
        if (from === shortPress) {
            return;
        }
        const { stash, fields } = switchOption(
            this.shortPressStash,
            from,
            { isNavigation, targetPage, isCustom, channelId },
            shortPress,
            tap => freshShortPressFields(tap, emptyChannelValueConfig('')),
        );
        this.shortPressStash = stash;
        this.setState({ device: { ...device, shortPress }, ...fields, ...this.resetChannelChecks() });
        this.recheckChannel(fields);
    };

    /**
     * Short tap `state`: the chosen state of the device is the id of the custom item.
     *
     * @param id the state, '' = none
     */
    private handleDeviceStateChange = (id: string): void => {
        if (id === this.state.channelId.valueStateId) {
            return;
        }
        this.setState({
            channelId: { ...this.state.channelId, valueStateId: id },
            channelExists: null,
            hasProblems: false,
        });
        if (id) {
            void this.checkChannelExists(id, true);
        }
    };

    /** the target page of a navigation (standard item with navigation, device item with short tap navigation) */
    private renderTargetPageSelect(): React.JSX.Element {
        const { loadingPages, availablePages, targetPage } = this.state;
        return (
            <TargetPageSelect
                pages={availablePages}
                loading={loadingPages}
                value={targetPage}
                onChange={(value: string): void => this.setState({ targetPage: value })}
                docTopic="pageitems.targetPage"
            />
        );
    }

    /**
     * The target page of a slot of the device page (short tap "navigation", navigation slot): the same selection, a
     * page that cannot be chosen is marked.
     *
     * @param slot the slot
     * @param onPick the chosen page
     */
    private renderSlotTargetSelect = (slot: DevicePageSlotRef, onPick: (page: string) => void): React.JSX.Element => {
        const { loadingPages, availablePages } = this.state;
        const problem = this.isSlotTargetProblem(slot);
        return (
            <TargetPageSelect
                pages={availablePages}
                loading={loadingPages}
                value={devicePageSlotTargetOf(slot)}
                onChange={onPick}
                error={problem}
                helperText={problem ? I18n.t('deviceDetailsDialog_slotTargetMissing') : undefined}
            />
        );
    };

    /**
     * Opens the inner dialog for the settings of a slot of the device page (DevicePageSection).
     *
     * @param item the settings of the slot as page item
     * @param options what the dialog offers for the slot
     * @param onApply the saved settings
     */
    private openSlotItemDialog = (
        item: AdminPageItemConfig,
        options: DevicePageSlotItemOptions,
        onApply: (saved: AdminPageItemConfig) => void,
    ): void => {
        this.slotEdit = { options, onApply };
        // a slot is a cardGrid cell (main.ts builds the item of a channel slot for cardGrid)
        this.slotDialogRef.current?.openWith(item, true, options);
    };

    /**
     * @param item the settings the inner dialog saved for a slot
     */
    private handleSlotItemSave = (item: AdminPageItemConfig): void => {
        this.slotEdit?.onApply(item);
        this.slotEdit = null;
    };

    /**
     * @param slot a slot of the device page
     * @returns true when its target page is not among the pages that can be chosen
     */
    private isSlotTargetProblem = (slot: DevicePageSlotRef | null): boolean =>
        devicePageTargetProblem(
            slot,
            this.state.loadingPages ? null : this.state.availablePages,
            this.props.currentPageName,
        );

    /**
     * the kind of the item at the top of the dialog: standard, device with details (grid pages, cardEntities) or
     * Alexa timer (pages with timer items; not for navigation items)
     */
    private renderKindSwitch(): React.JSX.Element | null {
        if (this.props.hideChannelSelection) {
            return null;
        }
        const deviceAllowed = this.isDeviceAllowed();
        const alexaAllowed = this.isAlexaTimerAllowed();
        if (!deviceAllowed && !alexaAllowed) {
            return null;
        }
        const kind = this.currentKind();
        // the "?" inside a radio label is a link: activating it does not toggle the radio, DocHelp stops the click
        return (
            <FormControl>
                <FormLabel sx={{ fontSize: 12 }}>
                    {I18n.t('channelConfigDialog_kind')}
                    <DocHelp topic="pageitems.dialog" />
                </FormLabel>
                <RadioGroup
                    row
                    value={kind}
                    onChange={e => this.handleKindChange(e.target.value)}
                >
                    <FormControlLabel
                        value="standard"
                        control={<Radio size="small" />}
                        label={I18n.t('channelConfigDialog_kindStandard')}
                    />
                    {deviceAllowed && (
                        <FormControlLabel
                            value="device"
                            control={<Radio size="small" />}
                            label={I18n.t('channelConfigDialog_isDevice')}
                        />
                    )}
                    {alexaAllowed && (
                        <FormControlLabel
                            value="alexaTimer"
                            control={<Radio size="small" />}
                            disabled={kind === 'standard' && this.state.isNavigation}
                            label={
                                <>
                                    {I18n.t('channelConfigDialog_kindAlexaTimer')}
                                    <DocHelp topic="pageitems.alexaTimer" />
                                </>
                            }
                        />
                    )}
                </RadioGroup>
            </FormControl>
        );
    }

    /**
     * The page item of kind "device with details": device, short tap, filter list and the name.
     *
     * @param device the device configuration
     * @param panelBoxStyle style of the box
     */
    private renderDeviceItem(device: DeviceDetailsConfig, panelBoxStyle: object): React.JSX.Element {
        const { socket, theme, themeType } = this.props;
        const { channelId, name, checkingChannel, channelExists } = this.state;
        const popupSelector = (
            <Box>
                <EntitySelector
                    label={I18n.t('channelConfigDialog_channelId')}
                    value={channelId.valueStateId}
                    onChange={this.handleChannelIdChange}
                    onCommit={this.handleChannelIdCommit}
                    onTransformSelectedId={this.transformChannelId}
                    socket={socket}
                    theme={theme}
                    themeType={themeType ?? 'light'}
                    dialogName="channelConfigDialog"
                    filterFunc={this.buildChannelFilterFunc()}
                />
                {channelId.valueStateId !== '' && channelExists === false && !checkingChannel && (
                    <Typography
                        variant="caption"
                        color="error"
                    >
                        {I18n.t('channelConfigDialog_channelNotFound')}
                    </Typography>
                )}
            </Box>
        );
        return (
            <Box sx={panelBoxStyle}>
                {this.renderKindSwitch()}
                <DeviceDetailsSection
                    socket={this.props.oContext?.socket ?? socket}
                    theme={theme}
                    themeType={themeType ?? 'light'}
                    instance={this.props.oContext?.instance ?? this.props.instance ?? 0}
                    value={device}
                    stateId={deviceShortPressOf(device) === 'state' ? channelId.valueStateId : ''}
                    onStateChange={this.handleDeviceStateChange}
                    onShortPressChange={this.handleDeviceShortPressChange}
                    popupChannelSelector={popupSelector}
                    navigationTargetSelector={this.renderTargetPageSelect()}
                    onChange={this.handleDeviceDetailsChange}
                    onAnswer={this.handleDeviceAnswer}
                    onEntriesChange={this.handleDeviceEntriesChange}
                    onLongPressTargetChange={this.handleLongPressTargetChange}
                    onDevicePageChange={this.handleDevicePageChange}
                    devicePageIconSelector={device.devicePage ? this.renderDevicePageIcon(device.devicePage) : null}
                    devicePageIconSelect={this.renderSlotIconSelect}
                    devicePageTargetSelect={this.renderSlotTargetSelect}
                    devicePageTargetProblem={this.isSlotTargetProblem}
                    devicePageSlotItemDialog={this.openSlotItemDialog}
                    adapterName={this.props.adapterName}
                />
                <TextField
                    label={I18n.t('channelConfigDialog_name')}
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.setState({ name: e.target.value })}
                    variant="standard"
                    helperText={name === '' ? I18n.t('deviceDetailsDialog_nameHint') : undefined}
                    slotProps={{ formHelperText: { sx: { color: 'text.disabled' } } }}
                />
            </Box>
        );
    }

    /**
     * The big icon of the device page: the icon selector of the admin, empty = the icon of the item.
     *
     * @param devicePage the device page
     */
    private renderDevicePageIcon(devicePage: DevicePageConfig): React.JSX.Element {
        return this.renderDevicePageIconSelect(
            'device-page-icon',
            devicePage.icon ?? '',
            'deviceDetailsDialog_pageIcon',
            'deviceDetailsDialog_pageIconHint',
            (page, icon) => withDevicePageIcon(page, icon),
        );
    }

    /**
     * An icon selector for the settings of a slot of the device page (DevicePageSlotDialog): the icon selector of the
     * page item dialog, the value lives in the dialog of the slot.
     *
     * @param label translation key of the label
     * @param iconValue the chosen icon, '' = none
     * @param onPick the picked icon
     */
    private renderSlotIconSelect = (
        label: string,
        iconValue: string,
        onPick: (icon: string) => void,
    ): React.JSX.Element => {
        const themeName: ThemeName = this.props.themeType === 'dark' ? 'dark' : 'light';
        return (
            <IconSelect
                oContext={this.buildOContext()}
                alive={true}
                changed={false}
                themeName={themeName}
                common={EMPTY_COMMON}
                attr="devicePageSlotIcon"
                data={{ devicePageSlotIcon: iconValue }}
                originalData={{ devicePageSlotIcon: iconValue }}
                onError={() => {}}
                schema={{ type: 'custom', name: 'IconSelect', url: '', label, i18n: true }}
                custom
                onChange={(attrOrData, val, cb): void => {
                    let icon = '';
                    if (typeof attrOrData === 'object') {
                        const picked: unknown = attrOrData.devicePageSlotIcon;
                        icon = typeof picked === 'string' ? picked : '';
                    } else if (typeof val === 'string') {
                        icon = val;
                    }
                    onPick(icon);
                    if (cb) {
                        cb();
                    }
                }}
                theme={this.props.theme}
            />
        );
    };

    /**
     * An icon selector of the device page.
     *
     * @param dataDd test marker
     * @param iconValue the saved icon, '' = none
     * @param label translation key of the label
     * @param hint translation key of the hint below
     * @param apply puts the picked icon into the device page
     */
    private renderDevicePageIconSelect(
        dataDd: string,
        iconValue: string,
        label: string,
        hint: string,
        apply: (devicePage: DevicePageConfig, icon: string) => DevicePageConfig,
    ): React.JSX.Element {
        const themeName: ThemeName = this.props.themeType === 'dark' ? 'dark' : 'light';
        return (
            <Box data-dd={dataDd}>
                <IconSelect
                    oContext={this.buildOContext()}
                    alive={true}
                    changed={false}
                    themeName={themeName}
                    common={EMPTY_COMMON}
                    attr="devicePageIcon"
                    data={{ devicePageIcon: iconValue }}
                    originalData={{ devicePageIcon: iconValue }}
                    onError={() => {}}
                    schema={{
                        type: 'custom',
                        name: 'IconSelect',
                        url: '',
                        label,
                        i18n: true,
                    }}
                    custom
                    onChange={(attrOrData, val, cb): void => {
                        let icon = '';
                        if (typeof attrOrData === 'object') {
                            const picked: unknown = attrOrData.devicePageIcon;
                            icon = typeof picked === 'string' ? picked : '';
                        } else if (typeof val === 'string') {
                            icon = val;
                        }
                        this.setState(prev =>
                            prev.device?.devicePage
                                ? {
                                      device: {
                                          ...prev.device,
                                          devicePage: apply(prev.device.devicePage, icon),
                                      },
                                  }
                                : null,
                        );
                        if (cb) {
                            cb();
                        }
                    }}
                    theme={this.props.theme}
                />
                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    {I18n.t(hint)}
                </Typography>
            </Box>
        );
    }

    /**
     * Number of a range field; empty or not a number = not set.
     *
     * @param raw Text of the input.
     */
    /**
     * Lower and upper end of a light slider (brightness or color temperature); empty = panel default.
     *
     * @param minKey state field of the lower end
     * @param maxKey state field of the upper end
     * @param hintKey i18n key of the helper text
     * @param disabled whether the fields are disabled
     * @param withHelp whether the hint carries the help link (once per group of light fields)
     */
    private renderLightRange(
        minKey: LightRangeKey,
        maxKey: LightRangeKey,
        hintKey: string,
        disabled: boolean,
        withHelp: boolean,
    ): React.JSX.Element {
        const field = (key: LightRangeKey, label: string, hint: React.ReactNode): React.JSX.Element => (
            <TextField
                variant="standard"
                type="number"
                label={I18n.t(label)}
                value={this.state[key] === undefined ? '' : String(this.state[key])}
                onChange={e => this.setLightRange(key, this.parseRangeInput(e.target.value))}
                disabled={disabled}
                helperText={hint}
                sx={{ width: 160 }}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 'any' } }}
            />
        );
        return (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                {field(minKey, `channelConfigDialog_${minKey}`, undefined)}
                {field(
                    maxKey,
                    `channelConfigDialog_${maxKey}`,
                    <>
                        {I18n.t(hintKey)}
                        {withHelp && <DocHelp topic="pageitems.roleFields" />}
                    </>,
                )}
            </Box>
        );
    }

    /**
     * Sets one of the light slider fields.
     *
     * @param key state field
     * @param value new value, undefined = not set
     */
    private setLightRange(key: LightRangeKey, value: number | undefined): void {
        switch (key) {
            case 'minValueBrightness':
                this.setState({ minValueBrightness: value });
                break;
            case 'maxValueBrightness':
                this.setState({ maxValueBrightness: value });
                break;
            case 'minValueColorTemp':
                this.setState({ minValueColorTemp: value });
                break;
            case 'maxValueColorTemp':
                this.setState({ maxValueColorTemp: value });
                break;
        }
    }

    private parseRangeInput(raw: string): number | undefined {
        if (raw.trim() === '') {
            return undefined;
        }
        const n = Number(raw);
        return Number.isFinite(n) ? n : undefined;
    }

    private handleUseValueChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const checked = event.target.checked;
        this.setState({ useValue: checked });
    };

    private handleTargetPageChange = (value: string): void => {
        this.setState({ targetPage: this.targetPageOfText(value) });
    };

    /**
     * @param pages pages that can be chosen
     * @returns the options of a target page: the screensaver is a target as well
     */
    private targetPageOptions(pages: string[]): string[] {
        return [...pages, screensaverTargetPage];
    }

    private targetPageLabel = (option: string): string =>
        option === screensaverTargetPage ? I18n.t('screensaver_target') : option;

    /**
     * The field of a target page can be typed in and reports its text: the text of the screensaver means the target.
     *
     * @param text text of the field
     * @returns the value to store
     */
    private targetPageOfText(text: string): string {
        return text === I18n.t('screensaver_target') ? screensaverTargetPage : text;
    }

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
    /**
     * Renders a read-only color swatch with a label for the "default color" case.
     * Pass the resolved default RGB; when null, colour swatch is omitted.
     *
     * @param label  Field label shown above the swatch
     * @param rgb    Default RGB derived from the current theme (null = no swatch)
     */
    private renderColorDefault(label: string, rgb: RGB | null): React.JSX.Element {
        const hex = rgb ? Color.ConvertRGBtoHex(rgb.r, rgb.g, rgb.b) : '';
        return (
            <Box
                sx={{
                    border: '1px dashed',
                    borderColor: 'text.disabled',
                    borderRadius: 1,
                    px: 1,
                    py: 0.75,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    minHeight: 48,
                }}
            >
                {rgb && (
                    <Box
                        sx={{
                            width: 22,
                            height: 22,
                            backgroundColor: `rgb(${rgb.r},${rgb.g},${rgb.b})`,
                            borderRadius: 0.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            flexShrink: 0,
                            opacity: 0.75,
                        }}
                    />
                )}
                <Box>
                    <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ display: 'block', lineHeight: 1.2 }}
                    >
                        {label}
                    </Typography>
                    <Typography
                        variant="caption"
                        color="text.disabled"
                    >
                        {hex
                            ? `${I18n.t('channelConfigDialog_defaultColor')}: ${hex}`
                            : I18n.t('channelConfigDialog_defaultColor')}
                    </Typography>
                </Box>
            </Box>
        );
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

        // Defaults from role
        const roleDefaults =
            this.state.alexaTimer !== null
                ? this.getDefaultsForRole(ALEXA_TIMER_ROLE, false)
                : this.getDefaultsForRole(this.state.channelRole, this.itemIsNavigation());
        // an Alexa alarm shows the alarm icons of the adapter (config-manager getAlexaTimerItemConfig)
        const defaults =
            roleDefaults && this.state.alexaTimer?.show === 'alarm'
                ? { ...roleDefaults, iconOn: 'alarm', iconOff: 'alarm-off' }
                : roleDefaults;
        const defaultIconName = defaults ? (isTrue ? defaults.iconOn : defaults.iconOff) : '';
        const defaultColorKey = defaults ? (isTrue ? defaults.colorOn : defaults.colorOff) : '';
        const defaultColorRgb: RGB | null = defaultColorKey ? this.getThemeColorForKey(defaultColorKey) : null;
        const defaultColorHex: string = defaultColorRgb
            ? Color.ConvertRGBtoHex(defaultColorRgb.r, defaultColorRgb.g, defaultColorRgb.b)
            : '';

        // Default icon SVG for preview
        const defaultIconBase64 = defaultIconName ? ChannelConfigDialog.getIconBase64(defaultIconName) : '';
        const defaultIconSvg = defaultIconBase64
            ? atob(defaultIconBase64.replace(/^data:image\/svg\+xml;base64,/, '')).replace(
                  /<svg([^>]*)>/,
                  '<svg$1 fill="currentColor">',
              )
            : '';

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
                    {isTrue && <DocHelp topic="pageitems.trueFalse" />}
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
                {/* Default-Icon-Vorschau – nur wenn kein Icon gesetzt */}
                {iconValue === '' && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            mt: -1,
                            opacity: 0.6,
                        }}
                    >
                        {defaultIconSvg !== '' && (
                            <span
                                style={{
                                    display: 'inline-flex',
                                    width: 18,
                                    height: 18,
                                    flexShrink: 0,
                                    color: 'inherit',
                                }}
                                dangerouslySetInnerHTML={{ __html: defaultIconSvg }}
                            />
                        )}
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {defaultIconName
                                ? `${I18n.t('channelConfigDialog_defaultIcon')}: ${defaultIconName}`
                                : I18n.t('channelConfigDialog_defaultIcon')}
                        </Typography>
                    </Box>
                )}

                {/* Farbauswahl */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {colorValue === '' ? (
                        <>
                            <Box sx={{ flex: 1 }}>
                                {this.renderColorDefault(I18n.t('channelConfigDialog_color'), defaultColorRgb)}
                            </Box>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                    const startColor = defaultColorHex || (isTrue ? '#00cc00' : '#cc0000');
                                    if (isTrue) {
                                        this.setState({ trueColor: startColor });
                                    } else {
                                        this.setState({ falseColor: startColor });
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
            isCustom,
            targetPage,
            targetPageLongPress,
            longPress,
            availablePages,
            loadingPages,
            channelExists,
            checkingChannel,
            channelRole,
            stateIsWriteable,
            roleIsValid,
            raw,
            useValue,
            colorFieldDisabled,
        } = this.state;

        const rawMode = raw !== null;
        const channelIdValid = channelId.valueStateId !== '';
        const { device, deviceError } = this.state;
        const alexaTimer = this.state.alexaTimer;
        /** kind "Alexa timer": no channel, none of its checks apply */
        const alexaMode = !rawMode && alexaTimer !== null;
        // a device item is checked by its short tap - the channel checks apply to the popup of an alias channel only;
        // no answer of the adapter (offline) or a device that is gone keeps a stored item savable
        const saveState = pageItemSaveState({
            rawMode,
            device: device !== null ? { deviceId: device.deviceId, shortPress: deviceShortPressOf(device) } : null,
            deviceErrorBlocks: isBlockingDeviceError(deviceError),
            alexaTimerComplete: alexaTimer !== null ? isAlexaTimerComplete(alexaTimer) : null,
            isNavigation,
            isCustom,
            targetPage,
            channelId: channelId.valueStateId,
            channelExists,
            checkingChannel,
            checkingDatapoints: this.state.checkingDatapoints,
            roleIsValid,
            hasProblems: this.state.hasProblems,
            datapointErrors: this.state.datapointErrors.length,
            datapointDuplicates: this.state.datapointDuplicates.length,
        });
        const { slot } = this.state;
        // a slot of the device page: its source is chosen and checked at the slot, the settings can always be saved
        const hasDatapointProblems = slot === null && saveState.datapointProblems;
        const canSave = slot !== null || saveState.canSave;
        // raw mode: role and datapoint checks do not apply - the raw data are saved as they are
        const errorSaveDetails = slot === null && saveState.roleProblem;
        /** Felder sperren wenn noch keine gültige ID ausgewählt ist */
        const fieldsDisabled = slot === null && !saveState.standardCanSave;
        const itemIsNavigation = this.itemIsNavigation();

        // a state slot takes colors and a color scale whatever its role, a navigation slot has one color only
        const internColorFieldsDisabled =
            slot?.source === 'state'
                ? false
                : slot?.source === 'navigation' ||
                  !channelIdValid ||
                  isCustom ||
                  rawMode ||
                  colorFieldDisabled ||
                  device !== null;
        /**
         * Modusliste nur für die Licht-Rollen, die der Adapter dafür auswertet. Bewusst OHNE `colorFieldDisabled`:
         * diese Rollen haben `type: 'boolean'` in den Page-Item-Defaults, der Farb-Button ist für sie gesperrt.
         */
        const modeListVisible =
            channelRole !== null && MODE_LIST_ROLES.includes(channelRole) && channelIdValid && !isCustom && !rawMode;
        const longPressVisible = this.isLongPressVisible();
        const buttonTargetPageVisible = this.isButtonTargetPageVisible();
        /** Buttons turn green (theme palette "success", works in light and dark mode) once their settings hold data */
        const colorConfigured =
            this.state.trueColor !== '' || this.state.falseColor !== '' || this.state.scale !== undefined;
        const modeListConfigured =
            (channelRole !== 'select' && !!this.state.inSel_Alias) || (this.state.modeList?.length ?? 0) > 0;
        /** Condition for the value text: only the roles whose icon text the adapter builds from it */
        const useValueConditionsVisible =
            channelRole !== null &&
            channelIdValid &&
            !isCustom &&
            !rawMode &&
            (slot === null || slot.iconText) &&
            (itemIsNavigation ? USE_VALUE_CONDITIONS_NAVI_ROLES : USE_VALUE_CONDITIONS_ROLES).includes(channelRole);
        /** Range of the volume slider: the adapter reads minValue / maxValue for page items of role volume only */
        const valueRangeVisible =
            channelRole !== null &&
            channelIdValid &&
            !isCustom &&
            !rawMode &&
            !itemIsNavigation &&
            VALUE_RANGE_ROLES.includes(channelRole);
        /**
         * Fields the adapter reads for page items (not navigation items) of some roles only.
         *
         * @param roles channel roles that read the field
         */
        const pageItemOfRole = (roles: readonly string[]): boolean =>
            channelRole !== null &&
            channelIdValid &&
            !isCustom &&
            !rawMode &&
            !itemIsNavigation &&
            roles.includes(channelRole);
        const secondRowVisible = pageItemOfRole(SECOND_ROW_ROLES);
        const screensaverTimerVisible = pageItemOfRole(SCREENSAVER_TIMER_ROLES);
        const brightnessVisible = pageItemOfRole(BRIGHTNESS_ROLES);
        const colorTempVisible = pageItemOfRole(COLOR_TEMP_ROLES);

        // Untertitel neben dem Titel
        const titleSuffix = slot
            ? `${slot.title}${slot.source === 'channel' && channelRole !== null ? ` – ${channelRole}` : ''}`
            : alexaMode
              ? I18n.t('channelConfigDialog_kindAlexaTimer')
              : channelId.valueStateId === ''
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
                    onClose={(event, reason) => {
                        // Dialog darf nur über Button geschlossen werden
                        if (reason === 'backdropClick') {
                            return;
                        }
                        this.handleClose();
                    }}
                    fullWidth
                    maxWidth="md"
                    sx={{
                        '& .MuiDialog-container': {
                            alignItems: 'flex-start',
                        },
                        '& .MuiDialog-paper': {
                            mt: { xs: 0, sm: 4, lg: 8 },
                            mx: { xs: 0, sm: 'auto' },
                            borderRadius: { xs: 0, sm: 2 },
                            maxHeight: { xs: '100dvh', sm: 'calc(100dvh - 64px)', lg: 'calc(100dvh - 128px)' },
                            width: { xs: '100%', sm: undefined },
                        },
                    }}
                >
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                                variant="h6"
                                sx={{ flex: 1 }}
                            >
                                {I18n.t(slot ? 'deviceDetailsDialog_slotSettings' : 'channelConfigDialog_title')}
                                <Typography
                                    component="span"
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ ml: 1 }}
                                >
                                    ({titleSuffix})
                                </Typography>
                                {/* type-dependent help: the documentation of exactly this role */}
                                {!rawMode &&
                                    !alexaMode &&
                                    pageitemsTopicsOfRole(channelRole).map(topic => (
                                        <DocHelp
                                            key={topic}
                                            topic={topic}
                                        />
                                    ))}
                            </Typography>
                            {rawMode && <DocHelp topic="pageitems.rawData" />}
                            {!this.props.hideChannelSelection && (
                                <RawItemButton
                                    active={rawMode}
                                    onClick={this.handleRawOpen}
                                />
                            )}
                        </Box>
                    </DialogTitle>

                    <DialogContent>
                        {raw ? (
                            <RawItemNotice
                                value={raw}
                                onEdit={this.handleRawOpen}
                            />
                        ) : device !== null ? (
                            this.renderDeviceItem(device, panelBoxStyle)
                        ) : alexaTimer !== null ? (
                            <Box sx={panelBoxStyle}>
                                {this.renderKindSwitch()}
                                {this.renderAlexaTimerFields(alexaTimer)}
                            </Box>
                        ) : (
                            <Box sx={panelBoxStyle}>
                                {this.renderKindSwitch()}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 2,
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    {/* Navigation-Checkbox - a slot: only where its short tap can navigate */}
                                    {(slot === null || slot.tap) && (
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
                                    )}
                                    {!this.props.hideChannelSelection && (
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={isCustom}
                                                    onChange={this.handleCustomChange}
                                                />
                                            }
                                            label={
                                                <Typography variant="body1">
                                                    {I18n.t('channelConfigDialog_isCustom')}
                                                </Typography>
                                            }
                                        />
                                    )}
                                    {!this.props.hideChannelSelection && (
                                        <DocHelp
                                            topic="pageitems.basicCases"
                                            sx={{ alignSelf: 'center' }}
                                        />
                                    )}
                                </Box>
                                {/* Zielseiten-Selector – nur sichtbar wenn isNavigation aktiv */}
                                {isNavigation && this.renderTargetPageSelect()}

                                {/* the channel / state and its checks - not for a slot of the device page */}
                                {!this.props.hideChannelSelection && (
                                    <>
                                        {/* ioBroker-Channel-Auswahl + Validierungsicons */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {/* Fehler-Icon: fehlende Pflicht-Datenpunkte */}
                                            {!checkingChannel &&
                                                !this.state.checkingDatapoints &&
                                                this.state.datapointErrors.length > 0 && (
                                                    <Tooltip
                                                        title={`${I18n.t('channelConfigDialog_missingDps')}: ${this.state.datapointErrors.join(', ')}`}
                                                    >
                                                        <CancelIcon
                                                            color="error"
                                                            sx={{ flexShrink: 0 }}
                                                        />
                                                    </Tooltip>
                                                )}
                                            {/* Duplikat-Icon: mehrere States treffen auf dieselbe Pflicht-Rolle */}
                                            {!checkingChannel &&
                                                !this.state.checkingDatapoints &&
                                                (this.state.datapointDuplicates.length > 0 || errorSaveDetails) && (
                                                    <Tooltip
                                                        title={
                                                            errorSaveDetails
                                                                ? I18n.t('channelConfigDialog_pressDetails')
                                                                : `${I18n.t('channelConfigDialog_duplicateDps')}: ${this.state.datapointDuplicates.join(', ')}`
                                                        }
                                                    >
                                                        <ErrorOutline
                                                            color="error"
                                                            sx={{ flexShrink: 0 }}
                                                        />
                                                    </Tooltip>
                                                )}
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <EntitySelector
                                                    label={I18n.t(
                                                        isCustom
                                                            ? 'channelConfigDialog_stateId'
                                                            : 'channelConfigDialog_channelId',
                                                    )}
                                                    value={channelId.valueStateId}
                                                    onChange={this.handleChannelIdChange}
                                                    onCommit={this.handleChannelIdCommit}
                                                    onTransformSelectedId={this.transformChannelId}
                                                    socket={socket}
                                                    theme={theme}
                                                    themeType={themeType ?? 'light'}
                                                    dialogName="channelConfigDialog"
                                                    filterFunc={this.buildChannelFilterFunc()}
                                                />
                                                {hasDatapointProblems && (
                                                    <Typography
                                                        variant="caption"
                                                        color="error"
                                                        sx={{ display: 'block', mt: 0.25, px: 1.75 }}
                                                    >
                                                        {channelId.valueStateId}
                                                    </Typography>
                                                )}
                                            </Box>
                                            {/* ... Button für erweiterte Channel-ID Konfiguration */}
                                            {!isCustom && (
                                                <Tooltip title={I18n.t('channelConfigDialog_channelIdConfig')}>
                                                    <span style={{ display: 'flex', alignItems: 'center' }}>
                                                        <Button
                                                            variant="text"
                                                            onClick={() =>
                                                                this.valueEntryDialogMain.current?.openWith(
                                                                    this.state.channelId,
                                                                )
                                                            }
                                                            sx={{ minWidth: 20, minHeight: 24 }}
                                                            startIcon={<SettingsIcon />}
                                                        ></Button>
                                                    </span>
                                                </Tooltip>
                                            )}
                                            {/* Lade-Spinner während Prüfung */}
                                            {(checkingChannel || this.state.checkingDatapoints) && (
                                                <CircularProgress
                                                    size={20}
                                                    sx={{ flexShrink: 0 }}
                                                />
                                            )}
                                            {/* role-dependent help: the documentation of the chosen channel's role */}
                                            {pageitemsTopicsOfChannel(
                                                isCustom ? null : channelRole,
                                                this.usesScreensaverTimer(),
                                            ).map(topic => (
                                                <DocHelp
                                                    key={topic}
                                                    topic={topic}
                                                    sx={{ ml: 0, flexShrink: 0 }}
                                                />
                                            ))}
                                        </Box>
                                        {/* Validierungshinweis Channel */}
                                        {channelId.valueStateId !== '' &&
                                            channelExists === false &&
                                            !checkingChannel && (
                                                <Typography
                                                    variant="caption"
                                                    color="error"
                                                    sx={{ mt: -1.5 }}
                                                >
                                                    {I18n.t('channelConfigDialog_channelNotFound')}
                                                </Typography>
                                            )}
                                        {(!isNavigation && !channelId.valueStateId && (
                                            <Typography
                                                variant="caption"
                                                color="warning.main"
                                                sx={{ mt: -1.5 }}
                                            >
                                                {I18n.t('channelConfigDialog_missingIDForbidden')}
                                            </Typography>
                                        )) ||
                                            (isCustom && (
                                                <Typography
                                                    variant="caption"
                                                    color={stateIsWriteable != null ? 'text.disabled' : 'warning.main'}
                                                    sx={{ mt: -1.5 }}
                                                >
                                                    {`${
                                                        I18n.t('channelConfigDialog_isCustomHint') +
                                                        (stateIsWriteable === false
                                                            ? I18n.t('read-only')
                                                            : stateIsWriteable === true
                                                              ? I18n.t('writeable')
                                                              : stateIsWriteable === undefined
                                                                ? I18n.t('not_a_boolean_state')
                                                                : I18n.t('not_a_state'))
                                                    }.`}
                                                </Typography>
                                            )) ||
                                            (roleIsValid === false && !checkingChannel && (
                                                <Typography
                                                    variant="caption"
                                                    color="warning.main"
                                                    sx={{ mt: -1.5 }}
                                                >
                                                    {I18n.t('channelConfigDialog_unknownRoleHint')}
                                                </Typography>
                                            )) ||
                                            (channelId.valueStateId && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.disabled"
                                                    sx={{ mt: -1.5 }}
                                                >
                                                    {I18n.t(`ok ${channelRole ? `(role=${channelRole})` : ''}`)}
                                                </Typography>
                                            )) || (
                                                <Typography
                                                    variant="caption"
                                                    color="text.disabled"
                                                    sx={{ mt: -1.5 }}
                                                >
                                                    {I18n.t('channelConfigDialog_emptyIDAllowed')}
                                                </Typography>
                                            )}
                                    </>
                                )}
                                {/* Namensfeld + Value-Entry-Konfigurationsbutton */}
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <TextField
                                        label={I18n.t('channelConfigDialog_name')}
                                        value={name}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            this.setState({ name: e.target.value })
                                        }
                                        variant="standard"
                                        sx={{ flex: 1 }}
                                        disabled={fieldsDisabled}
                                        helperText={this.nameHelperText()}
                                        slotProps={{
                                            formHelperText: {
                                                sx: { color: 'text.disabled', whiteSpace: 'pre-line' },
                                            },
                                            inputLabel: {
                                                shrink: name !== '' || this.state.valueEntryPreview !== '',
                                            },
                                        }}
                                        placeholder={
                                            name === '' && this.state.valueEntryPreview !== ''
                                                ? this.state.valueEntryPreview
                                                : undefined
                                        }
                                    />
                                    {/* the dynamic name: a page item - of the slots only an alias channel builds one */}
                                    {(slot === null || slot.source === 'channel') && (
                                        <Tooltip title={I18n.t('channelConfigDialog_nameEntryConfig')}>
                                            <span>
                                                <Button
                                                    variant="outlined"
                                                    onClick={() =>
                                                        this.valueEntryDialogRef.current?.openWith(
                                                            this.state.valueEntry,
                                                        )
                                                    }
                                                    disabled={fieldsDisabled}
                                                    sx={{ minWidth: 48 }}
                                                >
                                                    ...
                                                </Button>
                                            </span>
                                        </Tooltip>
                                    )}
                                    <DocHelp
                                        topic="pageitems.name"
                                        sx={{ ml: 0, flexShrink: 0 }}
                                    />
                                </Box>
                                {/* useValue Checkbox + TextSize */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                    {this.props.heatCircuits && this.props.heatCircuits.length > 0 && (
                                        <FormControl
                                            variant="standard"
                                            sx={{ minWidth: 220 }}
                                            disabled={fieldsDisabled}
                                        >
                                            <InputLabel>{I18n.t('thermo2_circuitLabel')}</InputLabel>
                                            <Select
                                                value={this.state.filter === undefined ? '' : String(this.state.filter)}
                                                onChange={e => {
                                                    const raw = String(e.target.value);
                                                    this.setState({ filter: raw === '' ? undefined : Number(raw) });
                                                }}
                                            >
                                                <MenuItem value="">{I18n.t('thermo2_circuitAll')}</MenuItem>
                                                {this.props.heatCircuits.map((label, i) => (
                                                    <MenuItem
                                                        key={i}
                                                        value={String(i)}
                                                    >
                                                        {`${i + 1}: ${label}`}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                    {this.isTextSizeVisible() && (
                                        <Tooltip
                                            title={
                                                <span style={{ whiteSpace: 'pre-line' }}>
                                                    {I18n.t('valueEntryDialog_textSizeTooltip')}
                                                </span>
                                            }
                                            placement="top"
                                        >
                                            <Autocomplete
                                                options={this.textSizeOptions()}
                                                value={
                                                    this.state.textSize !== undefined ? String(this.state.textSize) : ''
                                                }
                                                onChange={(_e, val) => {
                                                    this.setState({ textSize: textSizeOfOption(val) });
                                                }}
                                                disabled={fieldsDisabled}
                                                disableClearable={false}
                                                getOptionLabel={opt => this.textSizeLabel(opt)}
                                                renderOption={(props, opt) => {
                                                    const { key, ...rest } = props;
                                                    const empty =
                                                        !this.showsValueText() &&
                                                        opt !== '' &&
                                                        !isIconTextSize(Number(opt));
                                                    return (
                                                        <li
                                                            key={key}
                                                            {...rest}
                                                        >
                                                            <Typography
                                                                variant="body2"
                                                                color={empty ? 'warning.main' : undefined}
                                                            >
                                                                {this.textSizeLabel(opt)}
                                                            </Typography>
                                                        </li>
                                                    );
                                                }}
                                                sx={{ width: 260 }}
                                                renderInput={params => {
                                                    const hint = this.textSizeHint();
                                                    return (
                                                        <TextField
                                                            {...params}
                                                            variant="standard"
                                                            label={I18n.t('valueEntryDialog_textSize')}
                                                            helperText={hint?.text}
                                                            slotProps={{
                                                                ...params.slotProps,
                                                                formHelperText: {
                                                                    sx: hint?.warning
                                                                        ? { color: 'warning.main' }
                                                                        : undefined,
                                                                },
                                                            }}
                                                        />
                                                    );
                                                }}
                                            />
                                        </Tooltip>
                                    )}
                                    {this.isTextSizeVisible() && (
                                        <DocHelp
                                            topic="pageitems.textSize"
                                            sx={{ ml: -1.5 }}
                                        />
                                    )}
                                    {(slot !== null ? slot.iconText : this.state.isGridCard && !isCustom) && (
                                        <FormControl
                                            component="fieldset"
                                            disabled={fieldsDisabled}
                                        >
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={useValue}
                                                        onChange={this.handleUseValueChange}
                                                        disabled={fieldsDisabled}
                                                    />
                                                }
                                                label={
                                                    <Typography variant="body1">
                                                        {I18n.t('channelConfigDialog_useValueLabel')}
                                                    </Typography>
                                                }
                                            />
                                        </FormControl>
                                    )}
                                    {((this.props.heatCircuits && this.props.heatCircuits.length > 0) ||
                                        (slot !== null ? slot.iconText : this.state.isGridCard && !isCustom)) && (
                                        <DocHelp
                                            topic="pageitems.cardFields"
                                            sx={{ ml: -1.5 }}
                                        />
                                    )}
                                </Box>
                                {useValueConditionsVisible && (
                                    <TextField
                                        variant="standard"
                                        fullWidth
                                        label={I18n.t('channelConfigDialog_useValueConditions')}
                                        value={this.state.useValueConditions}
                                        onChange={e => this.setState({ useValueConditions: e.target.value })}
                                        disabled={fieldsDisabled}
                                        helperText={
                                            <>
                                                {I18n.t('channelConfigDialog_useValueConditionsHint')}
                                                <DocHelp topic="pageitems.roleFields" />
                                            </>
                                        }
                                        placeholder="val && val < 100"
                                        slotProps={{
                                            inputLabel: { shrink: true },
                                            input: { sx: { fontFamily: 'monospace' } },
                                        }}
                                    />
                                )}
                                {valueRangeVisible && (
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                                        <TextField
                                            variant="standard"
                                            type="number"
                                            label={I18n.t('channelConfigDialog_minValue')}
                                            value={this.state.minValue === undefined ? '' : String(this.state.minValue)}
                                            onChange={e =>
                                                this.setState({ minValue: this.parseRangeInput(e.target.value) })
                                            }
                                            disabled={fieldsDisabled}
                                            sx={{ width: 160 }}
                                            slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 'any' } }}
                                        />
                                        <TextField
                                            variant="standard"
                                            type="number"
                                            label={I18n.t('channelConfigDialog_maxValue')}
                                            value={this.state.maxValue === undefined ? '' : String(this.state.maxValue)}
                                            onChange={e =>
                                                this.setState({ maxValue: this.parseRangeInput(e.target.value) })
                                            }
                                            disabled={fieldsDisabled}
                                            helperText={
                                                <>
                                                    {I18n.t('channelConfigDialog_valueRangeHint')}
                                                    <DocHelp topic="pageitems.roleFields" />
                                                </>
                                            }
                                            sx={{ width: 160 }}
                                            slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 'any' } }}
                                        />
                                    </Box>
                                )}
                                {secondRowVisible && (
                                    <TextField
                                        variant="standard"
                                        fullWidth
                                        label={I18n.t('channelConfigDialog_secondRow')}
                                        value={this.state.secondRow}
                                        onChange={e => this.setState({ secondRow: e.target.value })}
                                        disabled={fieldsDisabled}
                                        helperText={
                                            <>
                                                {I18n.t('channelConfigDialog_secondRowHint')}
                                                <DocHelp topic="pageitems.roleFields" />
                                            </>
                                        }
                                        slotProps={{ inputLabel: { shrink: true } }}
                                    />
                                )}
                                {screensaverTimerVisible && (
                                    <Box>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={
                                                        this.state.useScreensaverTimer &&
                                                        !this.isTimerSourceOfScreensaver()
                                                    }
                                                    onChange={e =>
                                                        this.setState({ useScreensaverTimer: e.target.checked })
                                                    }
                                                    disabled={fieldsDisabled || this.isTimerSourceOfScreensaver()}
                                                />
                                            }
                                            label={I18n.t('channelConfigDialog_useScreensaverTimer')}
                                        />
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ display: 'block' }}
                                        >
                                            {I18n.t(
                                                this.isTimerSourceOfScreensaver()
                                                    ? 'channelConfigDialog_useScreensaverTimerLocked'
                                                    : 'channelConfigDialog_useScreensaverTimerHint',
                                            )}
                                            <DocHelp topic="pageitems.screensaverTimer" />
                                        </Typography>
                                    </Box>
                                )}
                                {brightnessVisible &&
                                    this.renderLightRange(
                                        'minValueBrightness',
                                        'maxValueBrightness',
                                        'channelConfigDialog_brightnessRange',
                                        fieldsDisabled,
                                        true,
                                    )}
                                {colorTempVisible &&
                                    this.renderLightRange(
                                        'minValueColorTemp',
                                        'maxValueColorTemp',
                                        'channelConfigDialog_colorTempRange',
                                        fieldsDisabled,
                                        false,
                                    )}
                                {brightnessVisible && (
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={this.state.colormode}
                                                onChange={e => this.setState({ colormode: e.target.checked })}
                                                disabled={fieldsDisabled}
                                            />
                                        }
                                        label={I18n.t('channelConfigDialog_colormode')}
                                    />
                                )}
                                {/* Zielseite nach dem Drücken – nur normale Items der Rolle button */}
                                {buttonTargetPageVisible && (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Tooltip
                                            title={I18n.t('channelConfigDialog_buttonTargetPageTooltip')}
                                            placement="top"
                                        >
                                            <Autocomplete
                                                options={loadingPages ? [] : this.targetPageOptions(availablePages)}
                                                getOptionLabel={this.targetPageLabel}
                                                value={targetPage || null}
                                                onChange={(_e, val) => this.handleTargetPageChange(val ?? '')}
                                                onInputChange={(_e, val) => this.handleTargetPageChange(val)}
                                                disabled={loadingPages || fieldsDisabled}
                                                freeSolo
                                                forcePopupIcon
                                                sx={{ flex: 1 }}
                                                renderInput={params => (
                                                    <TextField
                                                        {...params}
                                                        variant="standard"
                                                        label={I18n.t('channelConfigDialog_buttonTargetPage')}
                                                        slotProps={{
                                                            ...params.slotProps,
                                                            input: {
                                                                ...params.slotProps.input,
                                                                endAdornment: (
                                                                    <>
                                                                        {loadingPages && <CircularProgress size={16} />}
                                                                        {params.slotProps.input.endAdornment}
                                                                    </>
                                                                ),
                                                            },
                                                        }}
                                                    />
                                                )}
                                            />
                                        </Tooltip>
                                        <DocHelp topic="pageitems.roleFields" />
                                    </Box>
                                )}
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
                                    {/* a navigation slot has no state: one icon and color */}
                                    {slot?.source !== 'navigation' && this.renderBranchColumn('false')}
                                </Box>
                                {/* Langer Druck: bewusst ganz unten im Dialog */}
                                {longPressVisible && (
                                    <Box
                                        component="fieldset"
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 1,
                                            p: 1.5,
                                            mt: 1,
                                            flex: 1,
                                            minWidth: 0,
                                        }}
                                    >
                                        <Typography
                                            component="legend"
                                            variant="caption"
                                            sx={{ color: 'text.secondary', px: 0.5 }}
                                        >
                                            <Tooltip
                                                title={
                                                    <Box>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{ display: 'block' }}
                                                        >
                                                            {I18n.t('channelConfigDialog_longPressHint1')}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{ display: 'block' }}
                                                        >
                                                            {I18n.t('channelConfigDialog_longPressHint2')}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{ display: 'block' }}
                                                        >
                                                            {I18n.t('channelConfigDialog_longPressHint3')}
                                                        </Typography>
                                                    </Box>
                                                }
                                            >
                                                <span style={{ cursor: 'help' }}>
                                                    {I18n.t('channelConfigDialog_longPressTitle')}
                                                </span>
                                            </Tooltip>
                                            <DocHelp topic="pageitems.longPress" />
                                        </Typography>
                                        {targetPageLongPress == null && (
                                            <EntitySelector
                                                label={I18n.t('channelConfigDialog_LongPressChannelId')}
                                                value={longPress || ''}
                                                onChange={(value: string): void =>
                                                    this.setState({ longPress: value || null })
                                                }
                                                onCommit={(value: string): void =>
                                                    this.setState({ longPress: value || null })
                                                }
                                                onTransformSelectedId={(id: string) => id.trim()}
                                                socket={socket}
                                                theme={theme}
                                                themeType={themeType ?? 'light'}
                                                dialogName="longPressConfigDialog"
                                                filterFunc={(obj: ioBroker.Object) => {
                                                    return (
                                                        obj.type === 'state' &&
                                                        obj.common?.type === 'boolean' &&
                                                        obj.common?.write === true
                                                    );
                                                }}
                                            />
                                        )}
                                        {longPress == null && slot === null && (
                                            <Autocomplete
                                                options={loadingPages ? [] : this.targetPageOptions(availablePages)}
                                                getOptionLabel={this.targetPageLabel}
                                                value={targetPageLongPress || null}
                                                onChange={(_e, val) =>
                                                    this.setState({ targetPageLongPress: val || null })
                                                }
                                                onInputChange={(_e, val) =>
                                                    this.setState({
                                                        targetPageLongPress: this.targetPageOfText(val) || null,
                                                    })
                                                }
                                                disabled={loadingPages}
                                                freeSolo
                                                forcePopupIcon
                                                renderInput={params => (
                                                    <TextField
                                                        {...params}
                                                        variant="standard"
                                                        label={I18n.t('channelConfigDialog_targetLongPressPage')}
                                                        slotProps={{
                                                            ...params.slotProps,
                                                            input: {
                                                                ...params.slotProps.input,
                                                                endAdornment: (
                                                                    <>
                                                                        {loadingPages && <CircularProgress size={16} />}
                                                                        {params.slotProps.input.endAdornment}
                                                                    </>
                                                                ),
                                                            },
                                                        }}
                                                    />
                                                )}
                                            />
                                        )}
                                    </Box>
                                )}
                            </Box>
                        )}
                    </DialogContent>

                    <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1, px: 2, pb: 2 }}>
                        {/* Color-Button (+ Modusliste bei Licht-Rollen) in eigener Zeile, wenn nicht im Native-Modus */}
                        {(!internColorFieldsDisabled || modeListVisible) && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {!internColorFieldsDisabled && (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color={colorConfigured ? 'success' : 'primary'}
                                        onClick={this.handleColorOpen}
                                        startIcon={<PaletteIcon />}
                                        fullWidth
                                    >
                                        {I18n.t('channelConfigDialog_colorSettings')}
                                    </Button>
                                )}
                                {!internColorFieldsDisabled && (
                                    <DocHelp
                                        topic="pageitems.colorOptions"
                                        sx={{ alignSelf: 'center', ml: 0, flexShrink: 0 }}
                                    />
                                )}
                                {modeListVisible && (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color={modeListConfigured ? 'success' : 'primary'}
                                        onClick={this.handleModeListOpen}
                                        startIcon={<FormatListBulletedIcon />}
                                        fullWidth
                                    >
                                        {I18n.t('channelConfigDialog_modeListSettings')}
                                    </Button>
                                )}
                                {modeListVisible && (
                                    <DocHelp
                                        topic="pageitems.modeList"
                                        sx={{ alignSelf: 'center', ml: 0, flexShrink: 0 }}
                                    />
                                )}
                            </Box>
                        )}
                        {/* Untere Zeile: Abbrechen + Speichern rechts */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <DocButton
                                topic="pageitems.dialog"
                                sx={{ mr: 'auto' }}
                            />
                            {/* Abbrechen-Button immer anzeigen, Speichern-Button nur mit gültiger Konfiguration (Rohdaten oder Standardfelder) */}
                            <Button onClick={this.handleClose}>{I18n.t('channelConfigDialog_cancel')}</Button>
                            <Button
                                variant="contained"
                                onClick={this.handleSave}
                                disabled={!canSave || this.state.isSaving}
                                color={hasDatapointProblems || errorSaveDetails ? 'warning' : 'primary'}
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
                                    : hasDatapointProblems || errorSaveDetails
                                      ? I18n.t('channelConfigDialog_details')
                                      : I18n.t('valueEntryDialog_save')}
                            </Button>
                        </Box>
                    </DialogActions>
                </Dialog>

                {/* raw data of the item */}
                <RawItemConfigDialog
                    ref={this.rawDialogRef}
                    kind="pageItem"
                    themeType={themeType}
                    onApply={this.handleRawApply}
                    onRemove={this.handleRawRemove}
                />
                {/* Color Options Dialog */}
                <ChannelColorDialog
                    ref={this.colorDialogRef}
                    socket={socket}
                    adapterName={this.props.adapterName}
                    instance={this.props.instance}
                    channelRole={this.state.channelRole}
                    isNavigation={this.itemIsNavigation()}
                    roleDefaults={this.getDefaultsForRole(this.state.channelRole, this.itemIsNavigation())}
                    trueColor={this.state.trueColor}
                    falseColor={this.state.falseColor}
                    onSave={this.handleColorSave}
                />
                {/* Modusliste (inSel_Alias / modeList) für Licht-Rollen */}
                <ChannelModeListDialog
                    ref={this.modeListDialogRef}
                    socket={socket}
                    theme={theme}
                    themeType={themeType}
                    showAlias={this.state.channelRole !== 'select'}
                    statesSourceId={
                        this.state.channelRole === 'select' ? `${this.state.channelId.valueStateId}.SET` : undefined
                    }
                    onSave={this.handleModeListSave}
                />
                {/* Channel-ID Konfigurationsdialog – Auswahl per Channel-Rolle-Filter */}
                <ChannelValueDialog
                    ref={this.valueEntryDialogMain}
                    socket={socket}
                    theme={theme}
                    themeType={themeType}
                    features={{
                        showUnit: true,
                        showDateFormat: true,
                        showPreview: false,
                        readOnlyValueStateId: true,
                        forceDateFormat: true,
                        forceUnit: this.state.useValue || this.state.isGridCard,
                    }}
                    mainValueFilterFunc={this.buildChannelFilterFunc()}
                    mainValueTransformId={this.transformChannelId}
                    onSave={(config: ChannelValueConfig) => {
                        this.setState({ channelId: config });
                        void this.checkChannelExists(config.valueStateId);
                    }}
                    onDelete={() => this.setState({ channelId: emptyChannelValueConfig() })}
                />

                {/* Dynamic name: the state is the name while the Name field is empty, prefix and suffix always apply */}
                <ChannelValueDialog
                    ref={this.valueEntryDialogRef}
                    socket={socket}
                    theme={theme}
                    themeType={themeType}
                    title={I18n.t('channelConfigDialog_dynamicNameTitle')}
                    hint={this.dynamicNameHint()}
                    features={{
                        showUnit: false,
                        showDateFormat: false,
                        showPreview: true,
                        readOnlyValueStateId: false,
                    }}
                    onSave={(config: ChannelValueConfig) => {
                        this.setState({ valueEntry: config });
                        this.valueEntryDialogRef.current?.triggerPreviewFor(config);
                    }}
                    onDelete={() =>
                        this.setState({ valueEntry: undefined, valueEntryPreview: '', valueEntryParts: null })
                    }
                    onPreviewUpdate={(text: string, parts: ValuePreviewParts) =>
                        this.setState({ valueEntryPreview: text, valueEntryParts: parts })
                    }
                    valueStateTypes={['string', 'number']}
                />
                {/* CheckPageItemConfig Ergebnis-Dialog */}
                <Dialog
                    open={this.state.checkResultOpen}
                    onClose={this.state.checkResultIsError ? this.handleCheckResultClose : undefined}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
                        {this.state.checkResultIsError
                            ? I18n.t('channelConfigDialog_checkError_title')
                            : I18n.t('channelConfigDialog_checkLog_title')}
                        <DocHelp topic="pageitems.applyCheck" />
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
                {/* the settings of a slot of the device page: this dialog without the channel selection */}
                {!this.props.hideChannelSelection && (
                    <ChannelConfigDialog
                        ref={this.slotDialogRef}
                        socket={socket}
                        theme={theme}
                        themeType={themeType}
                        adapterName={this.props.adapterName}
                        instance={this.props.instance}
                        oContext={this.props.oContext}
                        pagesList={this.props.pagesList}
                        panelIds={this.props.panelIds}
                        currentPageName={this.props.currentPageName}
                        hideTriggerButton
                        hideChannelSelection
                        onSave={this.handleSlotItemSave}
                    />
                )}
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
                themeType={oContext?.themeType}
                adapterName={oContext?.adapterName}
                instance={oContext?.instance}
                oContext={oContext}
            />
        );
    }
}
