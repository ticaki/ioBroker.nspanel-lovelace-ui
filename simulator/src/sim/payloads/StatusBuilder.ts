import type { PersistedState } from '../../persistence.js';

export interface SimRuntimeInfo {
    firmwareVersion: string;
    model: string;
    bootStartUtc: string;
    uptimeSec: number;
}

function macToHostnameSuffix(mac: string): string {
    return mac.replace(/:/g, '').slice(-6).toLowerCase();
}

function uptimeToTasmota(sec: number): string {
    const days = Math.floor(sec / 86_400);
    const h = Math.floor((sec % 86_400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${days}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function buildStatusNet(state: PersistedState): Record<string, unknown> {
    return {
        StatusNET: {
            Hostname: state.hostname,
            IPAddress: state.ipAddress,
            Gateway: '192.168.0.1',
            Subnetmask: '255.255.255.0',
            DNSServer1: '192.168.0.1',
            DNSServer2: '0.0.0.0',
            Mac: state.mac,
            IP6Global: '',
            IP6Local: '',
            Ethernet: {
                Hostname: '',
                IPAddress: '0.0.0.0',
                Gateway: '0.0.0.0',
                Subnetmask: '0.0.0.0',
                DNSServer1: '0.0.0.0',
                DNSServer2: '0.0.0.0',
                Mac: '00:00:00:00:00:00',
                IP6Global: '',
                IP6Local: '',
            },
            Webserver: 2,
            HTTP_API: 1,
            WifiConfig: 4,
            WifiPower: 16.0,
        },
    };
}

export function buildStatusSensor(): Record<string, unknown> {
    return {
        StatusSNS: {
            Time: new Date().toISOString().replace('Z', '').slice(0, 19),
            ANALOG: { Temperature1: 21.5 },
            TempUnit: 'C',
        },
    };
}

export function buildStatus0(state: PersistedState, runtime: SimRuntimeInfo): Record<string, unknown> {
    const topic = state.topic ?? `nspanel-${macToHostnameSuffix(state.mac)}`;
    return {
        Status: {
            Module: 0,
            DeviceName: state.friendlyName ?? 'NSPanel-Sim',
            FriendlyName: [state.friendlyName ?? 'Tasmota', ''],
            Topic: topic,
            ButtonTopic: '0',
            Power: `${state.power1 === 'ON' ? '1' : '0'}${state.power2 === 'ON' ? '1' : '0'}`,
            PowerLock: '00',
            PowerOnState: 3,
            LedState: 1,
            LedMask: 'FFFF',
            SaveData: 1,
            SaveState: 1,
            SwitchTopic: '0',
            SwitchMode: Array(32).fill(0),
            ButtonRetain: 0,
            SwitchRetain: 0,
            SensorRetain: 0,
            PowerRetain: 0,
            InfoRetain: 0,
            StateRetain: 0,
            StatusRetain: 0,
        },
        StatusPRM: {
            Baudrate: 115200,
            SerialConfig: '8N1',
            GroupTopic: 'tasmotas',
            OtaUrl: 'http://ota.tasmota.com/tasmota32/release/tasmota32-nspanel.bin',
            RestartReason: 'Vbat power on reset',
            Uptime: uptimeToTasmota(runtime.uptimeSec),
            StartupUTC: runtime.bootStartUtc,
            Sleep: 50,
            CfgHolder: 4617,
            BootCount: state.bootCount,
            BCResetTime: '2024-01-06T17:11:30',
            SaveCount: 110,
        },
        StatusFWR: {
            Version: runtime.firmwareVersion,
            BuildDateTime: '2024-12-15T13:33:11',
            Core: '3_1_0',
            SDK: '5.3.2',
            CpuFrequency: 160,
            Hardware: 'ESP32-D0WD-V3 v3.1',
            CR: '502/699',
        },
        StatusLOG: {
            SerialLog: 2,
            WebLog: state.weblog,
            MqttLog: 3,
            SysLog: 0,
            LogHost: '',
            LogPort: 514,
            SSId: ['SimNet', ''],
            TelePeriod: 300,
            Resolution: '558180C0',
            SetOption: ['00008009', '2805C80001000600003C5A0A192800000000', '00000080', '00006000', '00004000', '00000000'],
        },
        StatusMEM: {
            ProgramSize: 2017,
            Free: 862,
            Heap: 148,
            StackLowMark: 3,
            PsrMax: 2048,
            PsrFree: 2025,
            ProgramFlashSize: 4096,
            FlashSize: 4096,
            FlashChipId: '16405E',
            FlashFrequency: 40,
            FlashMode: 'DIO',
            Features: ['0809', '9F9AD7DF', '0015A001', 'B7F7BFCF', '05DA9BC4', 'E0360DC7', '480840D2', '20200000', 'D4BC482D', '810A80F1', '00000014'],
            Drivers: '1,2,!3,!4,!5,7,!8,9,10,11,12',
            Sensors: '1,2,3,5,6,7,8,9,10,11,12,13,14,15',
            I2CDriver: '7,8,9,10,11,12',
        },
        StatusNET: (buildStatusNet(state) as { StatusNET: Record<string, unknown> }).StatusNET,
        StatusMQT: {
            MqttHost: state.mqttHost ?? '',
            MqttPort: state.mqttPort ?? 1883,
            MqttClientMask: state.mqttClient ?? topic,
            MqttClient: state.mqttClient ?? topic,
            MqttUser: state.mqttUser ?? '',
            MqttCount: 1,
            MAX_PACKET_SIZE: 1200,
            KEEPALIVE: 30,
            SOCKET_TIMEOUT: 4,
        },
        StatusTIM: {
            UTC: new Date().toISOString().replace('Z', '').slice(0, 19) + 'Z',
            Local: new Date().toISOString().replace('Z', '').slice(0, 19),
            StartDST: '2025-03-30T02:00:00',
            EndDST: '2025-10-26T03:00:00',
            Timezone: state.timezoneOffset,
            Sunrise: '07:50',
            Sunset: '18:17',
        },
        StatusSNS: (buildStatusSensor() as { StatusSNS: Record<string, unknown> }).StatusSNS,
        StatusSTS: {
            Time: new Date().toISOString().replace('Z', '').slice(0, 19),
            Uptime: uptimeToTasmota(runtime.uptimeSec),
            UptimeSec: runtime.uptimeSec,
            Heap: 146,
            SleepMode: 'Dynamic',
            Sleep: 50,
            LoadAvg: 19,
            MqttCount: 1,
            Berry: { HeapUsed: 16, Objects: 212 },
            POWER1: state.power1,
            POWER2: state.power2,
            Wifi: {
                AP: 1,
                SSId: 'SimNet',
                BSSId: 'DC:15:C8:EB:3E:B8',
                Channel: 7,
                Mode: 'HT40',
                RSSI: 80,
                Signal: -60,
                LinkCount: 1,
                Downtime: '0T00:00:03',
            },
        },
    };
}

export function buildStatusFwrOnly(runtime: SimRuntimeInfo): Record<string, unknown> {
    return {
        StatusFWR: {
            Version: runtime.firmwareVersion,
            BuildDateTime: '2024-12-15T13:33:11',
            Core: '3_1_0',
            SDK: '5.3.2',
            CpuFrequency: 160,
            Hardware: 'ESP32-D0WD-V3 v3.1',
            CR: '502/699',
        },
    };
}
