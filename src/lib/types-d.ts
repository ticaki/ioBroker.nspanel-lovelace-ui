export type room = {
    status: string;
    restart: boolean;
    max_distance: number;
    absorption: number;
    tx_ref_rssi: number;
    rx_adj_rssi: number;
    include: string;
    query: string;
    exclude: string;
    known_macs: string;
    count_ids: string;
    arduino_ota: boolean;
    auto_update: boolean;
    prerelease: boolean;
    motion: boolean;
    switch: boolean;
    button: boolean;
    pir_timeout: number;
    radar_timeout: number;
    button_1: boolean;
    switch_1_timeout: number;
    switch_2_timeout: number;
    button_1_timeout: number;
    button_2_timeout: number;
    known_irks: string;
    led_1: {
        state: boolean;
        brightness: number;
        color: {
            r: number;
            g: number;
            b: number;
        };
    };
    telemetry: {
        ip: string;
        uptime: number;
        firm: string;
        rssi: number;
        ver: string;
        count: number;
        adverts: number;
        seen: number;
        reported: number;
        freeHeap: number;
        maxHeap: number;
        scanStack: number;
        loopStack: number;
        bleStack: number;
    };
};

export type device = {
    mac: string;
    id: string;
    name: string;
    disc: string;
    idType: number;
    'rssi@1m': number;
    rssi: number;
    raw: number;
    distance: number;
    int: number;
    close: boolean;
};

export type settings = {
    id: string;
    name: string;
};
