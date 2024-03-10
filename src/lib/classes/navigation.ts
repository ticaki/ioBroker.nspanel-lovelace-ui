import { Panel } from '../controller/panel';
import { AdapterClassDefinition, BaseClass } from './library';
import { Color } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { Page } from './Page';
import { getPayload } from '../const/tools';
import { genericStateObjects } from '../const/definition';
type optionalActionsType = 'notifications';
export type NavigationItemConfig = {
    name: string;
    left?: {
        single?: string;
        double?: string;
    };
    right?: {
        single?: string;
        double?: string;
    };
    page: string;
    optional?: optionalActionsType;
} | null;

type NavigationItem = {
    left: {
        single?: number;
        double?: number;
    };
    right: {
        single?: number;
        double?: number;
    };
    page: Page;
    index: number;
} | null;

export interface NavigationConfig {
    adapter: AdapterClassDefinition;
    panel: Panel;
    navigationConfig: NavigationItemConfig[];
}

export class Navigation extends BaseClass {
    panel: Panel;
    private database: NavigationItem[] = [];
    private navigationConfig: NavigationItemConfig[];
    private mainPage = 'main';
    private doubleClickTimeout: ioBroker.Timeout | undefined;
    private _currentItem: number = 0;
    public get currentItem(): number {
        return this._currentItem;
    }
    public set currentItem(value: number) {
        const c = this.navigationConfig[value];
        if (c) {
            const states = this.buildCommonStates();
            genericStateObjects.panel.panels.cmd.goToNavigationPoint.common.states = states;
            this.library.writedp(
                `panels.${this.panel.name}.cmd.goToNavigationPoint`,
                c.name,
                genericStateObjects.panel.panels.cmd.goToNavigationPoint,
            );
        }
        this._currentItem = value;
    }
    constructor(config: NavigationConfig) {
        super(config.adapter, `${config.panel.name}-navigation`);
        this.panel = config.panel;
        this.navigationConfig = config.navigationConfig;
    }

    init(): void {
        this.database = [];
        let b = 1;
        let serviceLeft: string = '';
        let serviceRight: string = '';
        let serviceID: number = -1;
        for (let a = 0; a < this.navigationConfig.length; a++) {
            const c = this.navigationConfig[a];
            if (!c) continue;
            if (c.left && c.left.single === '///service') serviceRight = c.name;
            if (c.right && c.right.single === '///service') serviceLeft = c.name;
            if (c.name === '///service') serviceID = a;
            const pageID = this.panel.getPagebyUniqueID(c.page);
            this.database[c.name === 'main' ? 0 : b++] =
                pageID !== null ? { page: pageID, left: {}, right: {}, index: a } : null;
        }
        if (serviceID !== -1) {
            const c = this.navigationConfig[serviceID];
            if (c) {
                if (serviceLeft) c.left = { single: serviceLeft };
                if (serviceRight) c.right = { single: serviceRight };
            }
        }
        for (let a = 0; a < this.database.length; a++) {
            const c = this.navigationConfig[a];
            const i = this.database[a];
            if (!c || !i) continue;
            for (const k of ['left', 'right']) {
                const nk = k as 'left' | 'right';
                const r = c[nk];
                if (!r) continue;
                for (const k2 of ['single', 'double']) {
                    const nk2 = k2 as 'single' | 'double';
                    const r2 = r[nk2];
                    if (!r2) continue;
                    const index = this.navigationConfig.findIndex((a) => a && a.name === r2);
                    if (index !== -1) {
                        i[nk][nk2] = index;
                    } else {
                        this.log.warn(`Dont find a navigation node with name ${r2}`);
                    }
                }
            }
        }
    }
    async setPageByIndex(index: number | undefined): Promise<void> {
        if (index !== -1 && index !== undefined) {
            const item = this.database[index];
            if (item) {
                this.currentItem = index;
                await this.panel.setActivePage(this.database[index]!.page);
                await this.optionalActions(item);
            }
        }
    }

    setTargetPageByName(n: string): void {
        const index = this.navigationConfig.findIndex((a) => a && a.name === n);
        if (index !== -1) {
            this.setPageByIndex(index);
        } else {
            this.log.warn(`Dont find navigation target for ${n}`);
        }
    }
    setMainPageByName(n: string): void {
        const index = this.navigationConfig.findIndex((a) => a && a.name === n);
        if (index !== -1 && this.database[index]) {
            this.mainPage = this.navigationConfig[index]!.name;
        } else {
            this.log.warn(`Dont find navigation main page for ${n}`);
        }
    }

    buildCommonStates(): Record<string, string> {
        const result: Record<string, string> = {};
        for (const n of this.navigationConfig) {
            if (n) result[n.name] = n.name;
        }
        return result;
    }
    goLeft(): void {
        this.go('left');
    }
    goRight(): void {
        this.go('right');
    }
    private go(d: 'left' | 'right', single: boolean = false): void {
        const i = this.database[this.currentItem];
        // zweiter Klick
        if (this.doubleClickTimeout && !single) {
            this.adapter.clearTimeout(this.doubleClickTimeout);
            this.doubleClickTimeout = undefined;
            if (i && i[d] && i[d].double) {
                const index = i[d].double;
                this.setPageByIndex(index);
            }
            this.log.debug('Navigation double click work.');
            // erster Klick und check obs ein Ziel für den 2. Klick gibt.
        } else if (!single && i && i[d] && i[d].double) {
            this.doubleClickTimeout = this.adapter.setTimeout(
                (...arg: any): void => {
                    this.go(arg[0], arg[1]);
                },
                this.adapter.config.doubleClickTime,
                d,
                true,
            );
            return;
            // erster Klick und timeout ist durch oder forced.
        } else {
            this.adapter.clearTimeout(this.doubleClickTimeout);
            this.doubleClickTimeout = undefined;
            if (i && i[d] && i[d].single !== undefined) {
                const index = i[d].single;
                this.setPageByIndex(index);
                this.log.debug(`Navigation single click with target ${i[d].single} work.`);
                return;
            } else if (i && i[d] && i[d].double !== undefined) {
                const index = i[d].double;
                this.setPageByIndex(index);
                this.log.debug(`Navigation single click (use double target) with target ${i[d].double} work.`);
                return;
            }
            this.log.debug('Navigation single click not work.');
        }
    }

    async optionalActions(item: NavigationItem): Promise<void> {
        if (!item) return;
        const nItem = this.navigationConfig[item.index];
        if (!nItem) return;
        if (nItem.optional === 'notifications') {
            if (this.panel.controller.systemNotification.getNotificationIndex(this.panel.notifyIndex) !== -1) {
                await this.panel.statesControler.setInternalState(
                    `${this.panel.name}/cmd/NotificationNext2`,
                    true,
                    false,
                );
            }
        }
    }

    buildNavigationString(side?: 'left' | 'right'): string {
        const item = this.database[this.currentItem];
        if (!item) return '';
        let navigationString = '';
        if (!side || side === 'left') {
            if (
                item.left.single !== undefined &&
                (item.left.double === undefined || this.doubleClickTimeout === undefined)
            ) {
                navigationString = getPayload(
                    'button',
                    'bSubPrev',
                    item.left.double === undefined
                        ? Icons.GetIcon('arrow-left-bold')
                        : Icons.GetIcon('arrow-top-left-bold-outline'),
                    String(Color.rgb_dec565(Color.White)),
                    '',
                    '',
                );
            } else if (item.left.double !== undefined) {
                navigationString = getPayload(
                    'button',
                    'bUp',
                    Icons.GetIcon('arrow-up-bold'),
                    String(Color.rgb_dec565(Color.White)),
                    '',
                    '',
                );
            } else {
                navigationString = getPayload('', '', '', '', '', '');
            }
        }
        let navigationString2 = '';
        //Right icon
        if (!side || side === 'right') {
            if (
                item.right.single !== undefined &&
                (item.right.double === undefined || this.doubleClickTimeout === undefined)
            ) {
                navigationString2 = getPayload(
                    'button',
                    'bSubNext',
                    item.right.double === undefined
                        ? Icons.GetIcon('arrow-right-bold')
                        : Icons.GetIcon('arrow-top-right-bold-outline'),
                    String(Color.rgb_dec565(Color.White)),
                    '',
                    '',
                );
            } else if (item.right.double !== undefined) {
                navigationString2 = getPayload(
                    'button',
                    'bHome',
                    Icons.GetIcon('home'),
                    String(Color.rgb_dec565(Color.White)),
                    '',
                    '',
                );
            } else {
                navigationString2 = getPayload('', '', '', '', '', '');
            }
        }
        if (side === 'left') return navigationString;
        else if (side === 'right') return navigationString2;
        return getPayload(navigationString, navigationString2);
    }

    /**
     *
     */
    resetPosition(): void {
        const index = this.navigationConfig.findIndex((a) => a && a.name === this.mainPage);
        if (index !== -1 && this.database[index]) {
            this.currentItem = index;
        }
    }
    getCurrentMainPoint(): string {
        const index = this.navigationConfig.findIndex((a) => a && a.name === this.mainPage);
        if (index === -1) return 'main';
        const item = this.navigationConfig[index];
        return item ? item.name : 'main';
    }
    getCurrentPage(): Page {
        const page = this.database[this.currentItem];
        if (page === null || page === undefined) {
            const index = this.database.findIndex((a) => a && a.page !== null);
            return this.database[index]!.page;
        }
        return page.page;
    }

    async setCurrentPage(): Promise<void> {
        let page = this.database[this.currentItem];
        if (page === null || page === undefined) {
            const index = this.database.findIndex((a) => a && a.page !== null);
            page = this.database[index];
        }
        if (page) await this.setPageByIndex(page.index);
    }
    async delete(): Promise<void> {
        await super.delete();
        if (this.doubleClickTimeout) this.adapter.clearTimeout(this.doubleClickTimeout);
    }
}
