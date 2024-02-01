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
        }
    }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
