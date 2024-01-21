import {write} from 'fs';
import { NspanelLovelaceUi } from '../main';
import { BaseClass } from './library';
import * as Nspanel from './types';

export class PageClass extends BaseClass {
    config: Nspanel.PageType;
    navigate: Nspanel.PageNavigationType = {};
    constructor(
        adapter: NspanelLovelaceUi,
        options: { config: Nspanel.PageType; navigate?: Nspanel.PageNavigationType },
    ) {
        super(adapter, 'Page');
        this.config = options.config;
        if (options.navigate) this.navigate = options.navigate;
    }

    GeneratePage (page: PageType): void {
        try {
            activePage = page;
            write.dp(NSPanel_Path + 'ActivePage.type', activePage!.type);
            setIfExists(NSPanel_Path + 'ActivePage.heading', activePage!.heading);
            setIfExists(NSPanel_Path + 'ActivePage.id0', activePage!.items[0].id);
            switch (page.type) {
                case 'cardEntities':
                    SendToPanel(GenerateEntitiesPage(page));
                    break;
                case 'cardThermo':
                    SendToPanel(GenerateThermoPage(page));
                    break;
                case 'cardGrid':
                    SendToPanel(GenerateGridPage(page));
                    break;
                case 'cardGrid2':
                    SendToPanel(GenerateGridPage2(page));
                    break;
                case 'cardMedia':
                    useMediaEvents = true;
                    SendToPanel(GenerateMediaPage(page));
                    break;
                case 'cardAlarm':
                    SendToPanel(GenerateAlarmPage(page));
                    break;
                case 'cardQR':
                    SendToPanel(GenerateQRPage(page));
                    break;
                case 'cardPower':
                    SendToPanel(GeneratePowerPage(page));
                    break;
                case 'cardChart':
                    SendToPanel(GenerateChartPage(page));
                    break;
                case 'cardLChart':
                    SendToPanel(GenerateChartPage(page));
                    break;
                case 'cardUnlock':
                    SendToPanel(GenerateUnlockPage(page));
                    break;
            }
        } catch (err: any) {
            if (err.message == "Cannot read properties of undefined (reading 'type')") {
                log(
                    'Please wait a few seconds longer when launching the NSPanel. Not all parameters are loaded yet.',
                    'warn',
                );
            } else {
                log('error at function GeneratePage: ' + err.message, 'warn');
            }
        }
    }
}
