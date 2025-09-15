interface BaseTriggeredPageInterface {
    name: string;
    adapter: NspanelLovelaceUi;
    panel: Panel;
    dpInit?: string | RegExp;
}

interface DimConfig {
    standby: number;
    active: number;
    dayMode: boolean;
    nightStandby: number;
    nightActive: number;
    nightHourStart: number;
    nightHourEnd: number;
    schedule: boolean;
}
