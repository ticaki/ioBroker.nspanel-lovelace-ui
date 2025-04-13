// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
    namespace ioBroker {
        interface AdapterConfig {
            testCase: boolean;
            mqttServer: boolean;
            mqttPassword: string;
            mqttUsername: string;
            mqttIp: string;
            mqttPort: number;
            topic: string;
            name: string;
            timeout: number;
            mediaid: string;
            Testconfig2: Partial<Panel.panelConfigPartial>[];
            scstype: string;
            timezone: string;
            useBetaTFT: boolean;
            
            fixBrokenCommonTypes: boolean;

            onlyStartFromSystemConfig: boolean;
            logUnknownTokens: boolean;
            doubleClickTime: number;
            
            // tasmota Admin
            useTasmotaAdmin: boolean;
            tasmotaAdmin: string;
            tasmotaAdminPassword: string;
            panels: {name: string, topic: string, id: string, ip: string, model: string}[];
            pw1: string;

            // PageQR
            pageQRdata: {
                pageName: string,
                headline: string,
                alwaysOnDisplay: boolean,
                optionalText: string,
                SSIDURLTEL: string,
                selType: 0 | 1 | 2 | 3,
                wlantype?: "nopass" | "WPA" | "WPA2" | "WPA3" | "WEP",
                qrPass?: number,
                wlanhidden?: boolean,
                pwdhidden?: boolean,
                setState?: string,
            }[];
            pageQRpwd1: string;
            pageQRpwd2: string;
            pageQRpwd3: string;

            // PagePower
            pagePowerdata: {
                pageName: string,
                headline: string,
                alwaysOnDisplay: boolean,
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
                power8_state: string
            }[];
            additionalLog: boolean;
            debugLogMqtt: boolean;
            debugLogStates: boolean;
            debugLogPages: boolean;
        }
    }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export { };
