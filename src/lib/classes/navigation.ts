import type { Panel } from '../controller/panel';
import { BaseClass, type AdapterClassDefinition } from './library';
import { Color } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import type { Page } from './Page';
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

export function isNavigationItemConfigArray(a: any[]): a is NavigationItemConfig[] {
    if (!a) {
        return false;
    }
    for (const n of a) {
        if (!isNavigationItemConfig(n)) {
            return false;
        }
    }
    return true;
}
export function isNavigationItemConfig(a: any): a is NavigationItemConfig {
    if (a === undefined) {
        return false;
    }
    if (a === null) {
        return true;
    }
    if (typeof a !== 'object' || !a.name || typeof a.name !== 'string') {
        return false;
    }
    if (a.left && typeof a.left !== 'object') {
        return false;
    }
    if (a.right && typeof a.right !== 'object') {
        return false;
    }
    if (!a.page || typeof a.page !== 'string') {
        return false;
    }
    if (
        a.right &&
        ((a.right.single && typeof a.right.single !== 'string') ||
            (a.right.double && typeof a.right.double !== 'string'))
    ) {
        return false;
    }
    if (
        a.left &&
        ((a.left.single && typeof a.left.single !== 'string') || (a.left.double && typeof a.left.double !== 'string'))
    ) {
        return false;
    }

    return true;
}
export type NavigationItemConfigNonNull = NonNullable<NavigationItemConfig>;
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
    private navigationConfig: NavigationItemConfigNonNull[];
    private mainPage = 'main';
    private doubleClickTimeout: ioBroker.Timeout | undefined;
    private _currentItem: number = 0;
    private initDone = false;
    private infityCounter = 0;
    public get currentItem(): number {
        return this._currentItem;
    }
    public set currentItem(value: number) {
        const c = this.navigationConfig[value];
        if (c) {
            if (!this.initDone) {
                const states = this.buildCommonStates();
                genericStateObjects.panel.panels.cmd.goToNavigationPoint.common.states = states;
                void this.library
                    .writedp(
                        `panels.${this.panel.name}.cmd.goToNavigationPoint`,
                        c.name,
                        genericStateObjects.panel.panels.cmd.goToNavigationPoint,
                    )
                    .catch();
                this.initDone = true;
            } else {
                void this.library.writedp(`panels.${this.panel.name}.cmd.goToNavigationPoint`, c.name).catch();
            }
        }
        this._currentItem = value;
    }
    constructor(config: NavigationConfig) {
        super(config.adapter, `${config.panel.friendlyName}-navigation`);
        this.panel = config.panel;
        this.navigationConfig = config.navigationConfig.filter(a => a !== null && a != null);
    }

    init(): void {
        this.database = [];
        let serviceLeft = '';
        let serviceRight = '';
        let serviceID = -1;
        this.navigationConfig.sort((a, b) => {
            if (a.name === 'main') {
                return -1;
            }
            if (b.name === 'main') {
                return 1;
            }
            if (a.name > b.name) {
                return 1;
            }
            if (a.name < b.name) {
                return -1;
            }
            return 0;
        });
        for (let a = 0; a < this.navigationConfig.length; a++) {
            const c = this.navigationConfig[a];
            if (c.left && c.left.single === '///service') {
                serviceRight = c.name;
            }
            if (c.right && c.right.single === '///service') {
                serviceLeft = c.name;
            }
            if (c.name === '///service') {
                serviceID = a;
            }
            const pageID = this.panel.getPagebyUniqueID(c.page);
            this.database[a] = pageID !== null ? { page: pageID, left: {}, right: {}, index: a } : null;
        }
        if (serviceID !== -1) {
            const c = this.navigationConfig[serviceID];
            if (c) {
                if (serviceLeft) {
                    c.left = { single: serviceLeft };
                }
                if (serviceRight) {
                    c.right = { single: serviceRight };
                }
            }
        }
        for (let a = 0; a < this.database.length; a++) {
            const c = this.navigationConfig[a];
            const i = this.database[a];
            if (!c || !i) {
                continue;
            }
            for (const k of ['left', 'right']) {
                const nk = k as 'left' | 'right';
                const r = c[nk];
                if (!r) {
                    continue;
                }
                for (const k2 of ['single', 'double']) {
                    const nk2 = k2 as 'single' | 'double';
                    const r2 = r[nk2];
                    if (!r2) {
                        continue;
                    }
                    const index = this.navigationConfig.findIndex(a => a && a.name === r2);
                    if (index !== -1) {
                        i[nk][nk2] = index;
                    } else {
                        this.log.warn(`Dont find a navigation node with name ${r2}`);
                    }
                }
            }
        }
    }
    async setPageByIndex(index: number | undefined, d?: 'left' | 'right'): Promise<void> {
        if (index !== -1 && index !== undefined) {
            const item = this.database[index];
            if (item) {
                this.currentItem = index;
                if (this.panel.hideCards && item.page.hidden) {
                    if (d) {
                        this.infityCounter++;
                        if (this.infityCounter > 10) {
                            this.log.error(
                                `Infinite loop detected in navigation: hidden - ${item.page.id} - ${item.page.name} - set navigation to main page.`,
                            );
                            await this.setTargetPageByName(this.mainPage);
                            this.infityCounter = 0;
                            return;
                        }
                        this.go(d);
                    }
                    return;
                }
                this.infityCounter = 0;
                await this.panel.setActivePage(item.page);
                await this.optionalActions(item);
            }
        }
    }

    async setTargetPageByName(n: string): Promise<void> {
        const index = this.navigationConfig.findIndex(a => a && a.name === n);
        if (index !== -1) {
            await this.setPageByIndex(index);
        } else {
            this.log.warn(`Dont find navigation target for ${n}`);
        }
    }
    setMainPageByName(n: string): void {
        const index = this.navigationConfig.findIndex(a => a && a.name === n);
        if (index !== -1 && this.database[index]) {
            this.mainPage = this.navigationConfig[index].name;
        } else {
            this.log.warn(`Dont find navigation main page for ${n}`);
        }
    }

    buildCommonStates(): Record<string, string> {
        const result: Record<string, string> = {};
        const clone = structuredClone(this.navigationConfig);
        clone.sort((a, b) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            if (!(bName.startsWith('///') && aName.startsWith('///'))) {
                if (bName.startsWith('///')) {
                    return -1;
                }
                if (aName.startsWith('///')) {
                    return 1;
                }
            }
            if (aName > bName) {
                return 1;
            }
            if (aName < bName) {
                return -1;
            }
            return 0;
        });
        for (const n of clone) {
            if (n) {
                result[n.name] = n.name;
            }
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
                void this.setPageByIndex(index, d);
            }
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
                void this.setPageByIndex(index, d);
                this.log.debug(`Navigation single click with target ${i[d].single} done.`);
                return;
            } else if (i && i[d] && i[d].double !== undefined) {
                const index = i[d].double;
                void this.setPageByIndex(index, d);
                this.log.debug(`Navigation single click (use double target) with target ${i[d].double} done.`);
                return;
            }
            this.log.debug('Navigation single click - failed.');
        }
    }

    async optionalActions(item: NavigationItem): Promise<void> {
        if (!item) {
            return;
        }
        const nItem = this.navigationConfig[item.index];
        if (!nItem) {
            return;
        }
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
        if (!item) {
            return '';
        }
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
        if (side === 'left') {
            return navigationString;
        } else if (side === 'right') {
            return navigationString2;
        }
        return getPayload(navigationString, navigationString2);
    }

    resetPosition(): void {
        const index = this.navigationConfig.findIndex(a => a && a.name === this.mainPage);
        if (index !== -1 && this.database[index]) {
            this.currentItem = index;
        }
    }
    getCurrentMainPoint(): string {
        const index = this.navigationConfig.findIndex(a => a && a.name === this.mainPage);
        if (index === -1) {
            return 'main';
        }
        const item = this.navigationConfig[index];
        return item ? item.name : 'main';
    }
    getCurrentMainPage(): Page {
        const index = this.navigationConfig.findIndex(a => a && a.name === this.mainPage);
        if (index === -1 || this.database[index] === null || this.database[index] === undefined) {
            return this.database[0]!.page;
        }
        return this.database[index].page;
    }
    getCurrentPage(): Page {
        const page = this.database[this.currentItem];
        if (page === null || page === undefined) {
            const index = this.database.findIndex(a => a && a.page !== null);
            return this.database[index]!.page;
        }
        return page.page;
    }

    async setCurrentPage(): Promise<void> {
        let page = this.database[this.currentItem];
        if (page === null || page === undefined) {
            const index = this.database.findIndex(a => a && a.page !== null);
            page = this.database[index];
        }
        if (page) {
            await this.setPageByIndex(page.index);
        }
    }
    async delete(): Promise<void> {
        await super.delete();
        this.navigationConfig = [];
        this.database = [];
        this.panel = {} as Panel;
        if (this.doubleClickTimeout) {
            this.adapter.clearTimeout(this.doubleClickTimeout);
        }
    }
}
