interface BaseTriggeredPageInterface {
    name: string;
    adapter: NspanelLovelaceUi;
    panel: Panel;
    dpInit?: string | RegExp;
}
