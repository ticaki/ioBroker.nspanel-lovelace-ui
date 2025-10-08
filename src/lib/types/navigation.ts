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
