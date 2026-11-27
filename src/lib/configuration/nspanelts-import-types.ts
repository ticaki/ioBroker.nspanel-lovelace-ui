/**
 * Types of the NSPanelTs import shared by the adapter and the admin dialog (no imports, so the admin bundle
 * does not pull in adapter code).
 */

/** why a script cannot be converted */
export type NsPanelTsUnsupportedReason = 'noVersion' | 'version' | 'noConfig';

/** an old script as the admin dialog lists it (answer of `nspanelTsList`: `{ scripts }`) */
export type NsPanelTsScriptInfo = {
    id: string;
    name: string;
    enabled: boolean;
    version?: string;
    topic?: string;
    supported: boolean;
    reason?: NsPanelTsUnsupportedReason;
};

/** message of `nspanelTsConvert` */
export type NsPanelTsConvertRequest = {
    /** id of the old script */
    scriptId: string;
    /** name of the target panel (`native.panels[i].name`) */
    panelName: string;
    /** value written as `panelTopic` into the new script */
    topic: string;
};

/** answer of `nspanelTsConvert` */
export type NsPanelTsConvertAnswer =
    | { error: string; /** translation key for the admin */ errorKey?: string }
    | {
          scriptId: string;
          pages: string[];
          todoPages: string[];
          todos: number;
          discarded: string[];
          warnings: string[];
      };
