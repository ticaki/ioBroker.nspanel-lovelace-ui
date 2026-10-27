// This file extends the AdapterConfig type from "@types/iobroker"

import {NSpanelModel} from "./types/types";
import type { ScreensaverEntry, ScreensaverNotifyConfig } from "./types/adminShareConfig";

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
    namespace ioBroker {
        interface AdapterConfig {
            versionJsonUrl: string;
            berryUrl: string;
            tftUrl: string;
            adminOverridesScriptPages: boolean;
            rememberLastSite: boolean
            testCase: boolean;
            mqttServer: boolean;
            mqttPassword: string;
            mqttUsername: string;
            /** id of a central credential (system.credentials.<name>, form login & password); empty = use mqttUsername/mqttPassword */
            mqttCredentialId: string;
            mqttIp: string;
            mqttPort: number;
            internalServerIp: string;
            /** web panels: HTTP/WebSocket server that shows the panel UI in a browser */
            webEnabled: boolean;
            webPort: number;
            webBind: string;
            /** host name (or address) browsers reach the web panel server on - used for the links in the admin; '' = detected automatically */
            webHost: string;
            /** global PIN of the web panels, '' = no protection (encrypted, decrypted by the js-controller) */
            webPin: string;
            /** serve the web panels over HTTPS/WSS with the ioBroker certificates below */
            webSecure: boolean;
            /** names of the certificates in `system.certificates` (public, private, chain; chain may be '') */
            webCertPublic: string;
            webCertPrivate: string;
            webCertChained: string;
            /** FIDO2/WebAuthn security keys as login alternative to the PIN (needs webSecure) */
            webFido: boolean;
            Testconfig2: Partial<Panel.panelConfigPartial>[];
            timezone: string;
            useBetaTFT: boolean;
            weekdayFormat: boolean;
            monthFormat: number;
            yearFormat: boolean;
            shutterClosedIsZero: boolean;
            defaultValueCardThermo: boolean;
            forceTFTVersion: string;
            colorTheme: number;
            weatherEntity: string;
            fixBrokenCommonTypes: boolean;
            hideDeveloperSymbols: boolean;
            writeTasmotaTele:boolean;
            deactivateDebugLog: boolean;

            //onlyStartFromSystemConfig: boolean;
            logUnknownTokens: boolean;
        
            // tasmota Admin
            useTasmotaAdmin: boolean;
            tasmotaAdmin: string;
            tasmotaAdminPassword: string;
            /** id of a central credential holding the Tasmota WebUI password; empty = use tasmotaAdminPassword */
            tasmotaCredentialId: string;
            /**
             * Admin panel table. `kind` missing = 'tasmota' (hardware NSPanel); 'web' = standalone
             * web panel (id `web_<12 hex>`, no ip) shown only in a browser.
             */
            panels: {name: string, topic: string, id: string, ip: string, model: NSpanelModel, kind?: 'tasmota' | 'web'}[];
            pw1: string;


            additionalLog: boolean;
            debugLogMqtt: boolean;
            debugLogStates: boolean;
            debugLogPages: boolean;

            // Color Themes (jede Accordion-Gruppe = Array mit genau einem Objekt)
            colorStates: {
                colGood: string;
                colBad: string;
                colTrue: string;
                colFalse: string;
                colActivated: string;
                colDeactivated: string;
                colAttention: string;
                colInfo: string;
                colOption1: string;
                colOption2: string;
                colOption3: string;
                colOption4: string;
                colOpen: string;
                colClose: string;
                colHot: string;
                colCold: string;
                colOn: string;
                colOff: string;
                colLight: string;
                colDark: string;
                colWarning: string;
                colSuccess: string;
                colNeutral: string;
                colHighlight: string;
                colDisabled: string;
            }[];

            colorNavigation: {
                colNavLeft: string;
                colNavRight: string;
                colNavDownLeft: string;
                colNavDownRight: string;
                colNavDown: string;
                colNavHome: string;
                colNavParent: string;
            }[];

            colorWeatherIcon: {
                colSunny: string;
                colPartlyCloudy: string;
                colCloudy: string;
                colFog: string;
                colHail: string;
                colLightning: string;
                colLightningRainy: string;
                colPouring: string;
                colRainy: string;
                colSnowy: string;
                colSnowyHeavy: string;
                colSnowyRainy: string;
                colWindy: string;
                colTornado: string;
                colClearNight: string;
                colExceptional: string;
            }[];

            colorDisplay: {
                colForeground: string;
                colBackground: string;
            }[];

            colorWeatherForecast: {
                colSolar: string;
                colTemperature: string;
                colGust: string;
                colSunrise: string;
                colSunset: string;
            }[];

            colorScreensaver: {
                colFgTime: string;
                colFgTimeAmPm: string;
                colFgDate: string;
                colFgMain: string;
                colFgMainAlt: string;
                colFgTimeAdd: string;
                colFgForecast: string;
                colFgBar: string;
            }[];

            colorCardMedia: {
                colMediaArtistOn: string;
                colMediaArtistOff: string;
                colMediaTitleOn: string;
                colMediaTitleOff: string;
                colMediaOnOffColor: string;
            }[];

            /** screensavers configured in the admin tab "Screensaver" (own table, not part of pageConfig) */
            screensaverConfig: ScreensaverEntry[];
            /** notifications shared by all screensavers, an entry uses them by id (ScreensaverEntry.notify) */
            screensaverNotify: ScreensaverNotifyConfig[];

            pageUnlockConfig: any
            pageQRConfig: any[];

            pageConfig: ({
                card: 'cardAlarm'; // Card type - will be extended with more types
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
                approved?: boolean;
                setNavi?: string;
                uniqueName: string;
                hidden?: boolean;
                alwaysOn?: 'none' | 'always' | 'action' | 'ignore';
                navigationAssignment?: navigationAssignment[];
            }|{
                card: 'cardQR';
                selType?: number; // e.g. 0 = FREE, 1 = Wifi, 2 = URL, 3 = TEL
                headline: string;
                ssidUrlTel: string;
                wlanhidden: boolean;
                wlantype?: 'nopass' | 'WPA' | 'WPA2' | 'WPA3' | 'WEP';
                qrPass?: string;
                /** id of a central credential holding the wifi password; empty = use qrPass */
                qrCredentialId?: string;
                pwdhidden: boolean;
                setState: string;
                hidden?: boolean;
                alwaysOn?: 'none' | 'always' | 'action' | 'ignore';
                uniqueName: string;
                navigationAssignment?: navigationAssignment[]
            }|{
                card: 'cardTrash';
                headline: string;
                countItems: number; // Anzahl der anzuzeigenden Müllarten
                trashImport: boolean; // true = Import from iCal Adapter, false = Import from .ics file
                trashState: string;
                trashFile: string;
                items: {
                    textTrash: string;
                    customTrash: string;
                    iconColor: string;
                    icon: string;
                }[];
                hidden?: boolean;
                alwaysOn?: 'none' | 'always' | 'action' | 'ignore';
                uniqueName: string;
                navigationAssignment?: navigationAssignment[];
            }|{
                card: 'cardChart';
                headline: string;
                chartColor: string;
                selChartType: 'cardChart' | 'cardLChart';
                selInstanceDataSource: 0 | 1;
                selInstance: string;
                setStateForTicks: string;
                setStateForValues: string;
                setStateForDB: string;
                txtLabelYAchse: string;
                rangeHours: number;
                maxXAxisTicks: number;
                factorCardChart: number;
                maxXAxisLabels: number;
                scriptNavigation?: boolean;
                scriptName?: string;
                uniqueName: string;
                hidden?: boolean;
                alwaysOn?: 'none' | 'always' | 'action' | 'ignore';
                navigationAssignment?: navigationAssignment[]
            })[];
        }
    }
}

type navigationAssignment = {
    topic: string;
    navigation?: {
        next?: string;
        prev?: string;
        home?: string;
        parent?: string;
    };
};
// this is required so the above AdapterConfig is found by TypeScript / type checking
export { };
