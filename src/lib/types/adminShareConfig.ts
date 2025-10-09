// Typ für pageInfo bei PageMenuConfig (siehe Panel)
export interface PageMenuConfigInfo {
    card: string;
    alwaysOn?: string;
    scrollPresentation?: string;
    scrollType?: string;
    scrollAutoTiming?: number;
    pageItemCount?: number;
}
// Zentrale Kommandos für Navigation-API
export const SENDTO_GET_PANEL_NAVIGATION_COMMAND = 'getPanelNavigation';
export const SAVE_PANEL_NAVIGATION_COMMAND = 'savePanelNavigation';
// SendTo command to request the list of available panels from the adapter
export const SENDTO_GET_PANELS_COMMAND = 'getPanels';
// SendTo command to request the list of pages for a given panel
export const SENDTO_GET_PAGES_COMMAND = 'getPagesForPanel';
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
export type UnlockEntry = {
    alarmType?: string; // e.g. 'alarm' | 'unlock'
    headline: string;
    button1: string;
    button2: string;
    button3: string;
    button4: string;
    pin: number;
    approved?: boolean;
    setNavi?: string;
    hidden?: boolean;
    alwaysOn?: 'none' | 'always' | 'action' | 'ignore';
    navigationAssignment?: NavigationAssignmentList;
    uniqueName: string;
};

export type UnlockEntries = UnlockEntry[];

// Rückgabewert-Typ für das Navigation Assignment Panel
export type NavigationAssignment = {
    topic: string;

    active: boolean;
    navigation?: {
        next?: string;
        prev?: string;
        home?: string;
        parent?: string;
    };
};

export type NavigationAssignmentList = NavigationAssignment[];
