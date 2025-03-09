// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
    namespace ioBroker {
        interface AdapterConfig {
            testCase: boolean;
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

            onlyStartFromSystemConfig: boolean;
            logUnknownTokens: boolean;
            doubleClickTime: number;
            
            pageQRpwd1: string;
            pageQRpwd2: string;
            pageQRpwd3: string;
            
            panels: {name: string, topic: string, id: string, ip: string}[];
            mqttServer: boolean;
            pw1: string;
            pageQRdata: {
                pageName: string,
                headline: string,
                optionalText: string,
                SSIDURLTEL: string,
                selType: 0 | 1 | 2 | 3,
                wlantype?: "nopass" | "WPA" | "WPA2" | "WPA3" | "WEP",
                qrPass?: number,
                wlanhidden?: boolean,
                setState?: string,
            }[];
        }
    }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export { };
