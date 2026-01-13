// Zentrale Definition aller verfügbaren Card-Typen
export type AdminCardTypes =
    // Grid Cards
    | 'cardGrid'
    | 'cardGrid2'
    | 'cardGrid3'
    | 'cardThermo2'
    | 'cardMedia'
    // Entities Cards
    | 'cardEntities'
    | 'cardSchedule'
    // Standalone Cards
    | 'cardAlarm'
    | 'cardQR'
    | 'cardPower'
    | 'cardChart'
    | 'cardLChart'
    | 'cardThermo'
    | 'screensaver'
    | 'screensaver2'
    | 'screensaver3'
    // Popup Cards
    | 'popupNotify'
    | 'cardItemSpecial'; // Special card to manage pageItems (not selectable in admin UI)

// Typ für pageInfo bei PageMenuConfig (siehe Panel)
export interface PageMenuConfigInfo {
    card: AdminCardTypes;
    alwaysOn?: string;
    scrollPresentation?: string;
    scrollType?: string;
    scrollAutoTiming?: number;
    pageItemCount?: number;
}

export const ALL_PANELS_SPECIAL_ID = '///ALL_PANELS_SPECIAL';

// Zentrale Kommandos für Navigation-API
export const SENDTO_GET_PANEL_NAVIGATION_COMMAND = 'getPanelNavigation';
export const SAVE_PANEL_NAVIGATION_COMMAND = 'savePanelNavigation';
// SendTo command to request the list of available panels from the adapter
export const SENDTO_GET_PANELS_COMMAND = 'getPanels';
// SendTo command to request the list of pages for a given panel
export const SENDTO_GET_PAGES_COMMAND = 'getPagesForPanel';
export const SENDTO_GET_PAGES_All_COMMAND = 'getAllPages';
// Central adapter name constant for admin <-> adapter sendTo calls
export const ADAPTER_NAME = 'nspanel-lovelace-ui';
// Expected response when asking the adapter for panels
export type PanelInfo = {
    friendlyName: string;
    panelTopic: string;
};

export type PanelsResponse = PanelInfo[];
export interface NavigationSavePayload {
    panelName: string;
    pages: NavigationPositionsMap[];
}
export type NavigationPositionsMap = { name: string; position: { x: number; y: number } };
// Gemeinsame Typen für Navigation (Panel + Admin UI)

export interface NavigationMapEntry {
    page: string;
    next?: string;
    prev?: string;
    home?: string;
    parent?: string;
    targetPages?: string[];
    label?: string;
    position?: { x: number; y: number } | null;
    pageInfo?: PageMenuConfigInfo;
}

export type NavigationMap = NavigationMapEntry[];

export interface PanelListEntry {
    panelName: string;
    friendlyName: string;
    navigationMap: NavigationMap;
}

// Shared types for admin UI (typo: file name uses 'Shard')
export interface PageConfigBaseFields {
    hidden?: boolean;
    alwaysOn?: 'none' | 'always' | 'action' | 'ignore';
    navigationAssignment?: NavigationAssignmentList;
}

export type UnlockEntry = {
    card: Extract<AdminCardTypes, 'cardAlarm'>; // Supported card types - will be extended
    alarmType?: string; // e.g. 'alarm' | 'unlock' (only for cardAlarm)
    headline: string;
    button1: string;
    button2: string;
    button3: string;
    button4: string;
    button5: string;
    button6: string;
    button7: string;
    button8: string;
    pin: number;
    global?: boolean;
    approved?: boolean;
    setNavi?: string;
    uniqueName: string;
} & PageConfigBaseFields;

export type PageItemButtonEntry = {
    type: 'text' | 'button';
    headline?: string;
    modeScr?: 'left' | 'bottom' | 'indicator' | 'favorit' | 'alternate';
    data: any; // TODO: Should be NSPanel.PageItemButton but causes type resolution issues in admin
};

// Screensaver types
export type ScreensaverEntry = {
    card: Extract<AdminCardTypes, 'screensaver' | 'screensaver2' | 'screensaver3'>; // Use the card type from AdminCardTypes
    uniqueName: string;
    clockFormat?: '12h' | '24h';
    dateFormat?: string; // JavaScript date format string
    timeFormat?: string; // JavaScript time format string
    customDateFormat?: string; // Custom date format when dateFormat is 'custom'
    pageItems?: PageItemButtonEntry[];
    navigation?: NavigationAssignmentList;
    navigationAssignment?: NavigationAssignmentList;
};

export type ScreensaverEntries = ScreensaverEntry[];
// QR Entry for pageQR configuration
export type QREntry = {
    card: Extract<AdminCardTypes, 'cardQR'>;
    selType?: number; // e.g. 0 = FREE, 1 = Wifi, 2 = URL, 3 = TEL
    headline: string;
    ssidUrlTel: string;
    wlanhidden: boolean;
    wlantype?: 'nopass' | 'WPA' | 'WPA2' | 'WPA3' | 'WEP';
    qrPass?: string;
    pwdhidden: boolean;
    setState: string;
    uniqueName: string;
} & PageConfigBaseFields;

export type TrashEntry = {
    card: 'cardTrash';
    uniqueName: string;
    headline: string;
    trashState: string; // Object ID Selector
    leftNumber: number; // Zahl links
    rightNumber: number; // Zahl rechts
    textTrash1: string; // 6 Textfelder
    textTrash2: string;
    textTrash3: string;
    textTrash4: string;
    textTrash5: string;
    textTrash6: string;
    customTrash1: string;
    customTrash2: string;
    customTrash3: string;
    customTrash4: string;
    customTrash5: string;
    customTrash6: string;
} & PageConfigBaseFields;

export type PageConfigEntry = UnlockEntry | QREntry | ScreensaverEntry | TrashEntry;
// Rückgabewert-Typ für das Navigation Assignment Panel
export type NavigationAssignment = {
    topic: string;

    navigation?: {
        next?: string;
        prev?: string;
        home?: string;
        parent?: string;
    };
};

export type NavigationAssignmentList = NavigationAssignment[];

export type PageConfig = QREntry | UnlockEntry | ScreensaverEntry | TrashEntry;
