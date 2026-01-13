// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
    namespace ioBroker {
        interface AdapterConfig {
            rememberLastSite: boolean
            testCase: boolean;
            mqttServer: boolean;
            mqttPassword: string;
            mqttUsername: string;
            mqttIp: string;
            mqttPort: number;
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

            //onlyStartFromSystemConfig: boolean;
            logUnknownTokens: boolean;
        
            // tasmota Admin
            useTasmotaAdmin: boolean;
            tasmotaAdmin: string;
            tasmotaAdminPassword: string;
            panels: {name: string, topic: string, id: string, ip: string, model: string}[];
            pw1: string;

            // PagePower
            pagePowerdata: {
                pageName: string,
                headline: string,
                alwaysOnDisplay: boolean,
                hiddenByTrigger: boolean,
                power1_icon: string,
                power1_iconColor: string,
                power1_minColorScale: number,
                power1_maxColorScale: number,
                power1_bestColorScale: number,
                power1_state: string,
                power1_valueDecimal: number,
                power1_valueUnit: string,
                power1_entityHeadline: string,
                power1_minSpeedScale: number,
                power1_maxSpeedScale: number,
                power1_reverse: boolean,
                power2_icon: string,
                power2_iconColor: string,
                power2_minColorScale: number,
                power2_maxColorScale: number,
                power2_bestColorScale: number,
                power2_state: string,
                power2_valueDecimal: number,
                power2_valueUnit: string,
                power2_entityHeadline: string,
                power2_minSpeedScale: number,
                power2_maxSpeedScale: number,
                power2_reverse: boolean,
                power3_icon: string,
                power3_iconColor: string,
                power3_minColorScale: number,
                power3_maxColorScale: number,
                power3_bestColorScale: number,
                power3_state: string,
                power3_valueDecimal: number,
                power3_valueUnit: string,
                power3_entityHeadline: string,
                power3_minSpeedScale: number,
                power3_maxSpeedScale: number,
                power3_reverse: boolean,
                power4_icon: string,
                power4_iconColor: string,
                power4_minColorScale: number,
                power4_maxColorScale: number,
                power4_bestColorScale: number,
                power4_state: string,
                power4_valueDecimal: number,
                power4_valueUnit: string,
                power4_entityHeadline: string,
                power4_minSpeedScale: number,
                power4_maxSpeedScale: number,
                power4_reverse: boolean,
                power5_icon: string,
                power5_iconColor: string,
                power5_minColorScale: number,
                power5_maxColorScale: number,
                power5_bestColorScale: number,
                power5_state: string,
                power5_valueDecimal: number,
                power5_valueUnit: string,
                power5_entityHeadline: string,
                power5_minSpeedScale: number,
                power5_maxSpeedScale: number,
                power5_reverse: boolean,
                power6_icon: string,
                power6_iconColor: string,
                power6_minColorScale: number,
                power6_maxColorScale: number,
                power6_bestColorScale: number,
                power6_state: string,
                power6_valueDecimal: number,
                power6_valueUnit: string,
                power6_entityHeadline: string,
                power6_minSpeedScale: number,
                power6_maxSpeedScale: number,
                power6_reverse: boolean,
                power7_state: string,
                power7_valueDecimal: number,
                power7_valueUnit: string,
                power8_selInternalCalculation: boolean,
                power8_state: string,
                power8_selPowerSupply: number,
                power8_valueDecimal: number,
                power8_valueUnit: string
            }[];

            // PageChart
            pageChartdata: {
                pageName: string,
                headline: string,
                alwaysOnDisplay: boolean,
                hiddenByTrigger: boolean,
                chart_color: string,
                selChartType: 'cardChart' | 'cardLChart',
                selInstanceDataSource: 0 | 1,
                selInstance: string,
                setStateForTicks: string,
                setStateForValues: string,
                setStateForDB: string,
                txtlabelYAchse: string,
                rangeHours: number,
                maxXAxisTicks: number,
                factorCardChart: number,
                maxXAxisLabels: number,
            }[];


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
            pageUnlockConfig: any
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
                pwdhidden: boolean;
                setState: string;
                hidden?: boolean;
                alwaysOn?: 'none' | 'always' | 'action' | 'ignore';
                uniqueName: string;
                navigationAssignment?: navigationAssignment[]
            }|{
                card: 'cardTrash';
                headline: string;
                trashState: string;
                leftNumber: 0;
                rightNumber: 0;
                textTrash1: string;
                textTrash2: string;
                textTrash3: string;
                textTrash4: string;
                textTrash5: string;
                textTrash6: string;
                hidden?: boolean;
                alwaysOn?: 'none' | 'always' | 'action' | 'ignore';
                uniqueName: string;
                navigationAssignment?: navigationAssignment[];
            })[];

            pageQRConfig: any[];
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
