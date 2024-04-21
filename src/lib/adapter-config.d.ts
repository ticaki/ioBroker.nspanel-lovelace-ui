// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
    namespace ioBroker {
        interface AdapterConfig {
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
            pw1: string;
            pw2: string;
            pw3: string;
            pw4: string;
            pw5: string;
            pw6: string;
            pw7: string;
            pw8: string;
            pw9: string;
            pw0: string;
            onlyStartFromSystemConfig: boolean;
            logUnknownTokens: boolean;
            doubleClickTime: number;
            pageQRselType: number;
            pageQRwlantype: string;
            pageQRssid: string;
            pageQRpwd: string;
            pageQRwlanhidden: boolean;
            pageQRurl: string;
        }
    }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
