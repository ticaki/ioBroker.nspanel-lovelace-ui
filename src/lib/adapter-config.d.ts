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

            fixBrokenCommonTypes: boolean;

            onlyStartFromSystemConfig: boolean;
            logUnknownTokens: boolean;
            doubleClickTime: number;
            
            // tasmota Admin
            useTasmotaAdmin: boolean;
            tasmotaAdmin: string;
            tasmotaAdminPassword: string;
            panels: {name: string, topic: string, id: string, ip: string}[];
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
                setStateHomeTop?: string,
                setStateLeftTop?: string,
                setStateLeftMiddle?: string,
                setStateLeftBottom?: string,
                setStateRightTop?: string,
                setStateRightMiddle?: string,
                setStateRightBottom?: string,
            }[];
        }
    }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export { };
