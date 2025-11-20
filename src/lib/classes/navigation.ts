import type { Panel } from '../controller/panel';
import { BaseClass, type AdapterClassDefinition } from '../controller/library';
import { Color, type RGB } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import type { Page } from './Page';
import { getPayload, getPayloadRemoveTilde } from '../const/tools';
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
        let serviceID: number | null = null;

        // Sortiere so, dass "main" zuerst kommt
        this.navigationConfig.sort((a, b) => {
            if (a.name === 'main') {
                return -1;
            }
            if (b.name === 'main') {
                return 1;
            }
            return a.name.localeCompare(b.name);
        });

        // Erzeuge Datenbank-Einträge
        for (let a = 0; a < this.navigationConfig.length; a++) {
            const c = this.navigationConfig[a];
            if (!c) {
                continue;
            }

            if (c.left?.single === '///service') {
                serviceRight = c.name;
            }
            if (c.right?.single === '///service') {
                serviceLeft = c.name;
            }
            if (c.name === '///service') {
                if (serviceID !== null) {
                    this.log.warn(`Multiple "///service" nodes detected (at least at indices ${serviceID} and ${a}).`);
                }
                serviceID = a;
            }

            const pageID = this.panel.getPagebyUniqueID(c.page);
            if (pageID !== null) {
                this.database[a] = { page: pageID, left: {}, right: {}, index: a };
            }
        }

        // Service-Knoten patchen
        if (serviceID !== null) {
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

        // Verknüpfungen auflösen
        for (let a = 0; a < this.database.length; a++) {
            const c = this.navigationConfig[a];
            const i = this.database[a];
            if (!c || !i) {
                continue;
            }

            for (const nk of ['left', 'right'] as const) {
                const r = c[nk];
                if (!r) {
                    continue;
                }

                for (const nk2 of ['single', 'double'] as const) {
                    const r2 = r[nk2];
                    if (!r2) {
                        continue;
                    }

                    const found = this.navigationConfig.find(entry => entry && entry.name === r2);
                    if (found) {
                        const idx = this.navigationConfig.indexOf(found);
                        i[nk][nk2] = idx;
                    } else {
                        this.log.warn(`Didn't find a navigation node with name "${r2}".`);
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
    getDatabase(): NavigationItem[] {
        return this.database;
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
    goLeft(short: boolean): void {
        this.go('left', short);
    }
    goRight(short: boolean): void {
        this.go('right', short);
    }
    private go(d: 'left' | 'right', single: boolean = false): void {
        const i = this.database[this.currentItem];
        if (!i) {
            this.log.warn(`No navigation item found for current index ${this.currentItem}`);
            return;
        }
        if (!i[d]) {
            this.log.debug(`No navigation direction ${d} found for current index ${this.currentItem}`);
            return;
        }
        // longpress
        if (i[d].double !== undefined && i[d].single !== undefined && !single) {
            const index = i[d].double;
            void this.setPageByIndex(index, d);
            // erster Klick und check obs ein Ziel für den 1. und 2. Klick gibt.
        } else {
            // shortpress
            if (i[d].single !== undefined) {
                const index = i[d].single;
                void this.setPageByIndex(index, d);
                this.log.debug(`Navigation single click with target ${i[d].single} done.`);
                return;
            } else if (i[d].double !== undefined) {
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
            if (this.panel.controller.systemNotification.getCount() !== 0) {
                await this.panel.statesControler.setInternalState(
                    `${this.panel.name}/cmd/NotificationNext`,
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
            if (item.left.single !== undefined && item.left.double === undefined) {
                navigationString = getPayloadRemoveTilde(
                    'button',
                    'bSubPrev',
                    item.left.double === undefined
                        ? Icons.GetIcon('arrow-left-bold')
                        : Icons.GetIcon('arrow-top-left-bold-outline'),
                    item.left.double === undefined
                        ? String(Color.rgb_dec565(Color.navLeft as RGB))
                        : String(Color.rgb_dec565(Color.navDownLeft as RGB)),
                    '',
                    '',
                );
            } else if (item.left.double !== undefined) {
                navigationString = getPayloadRemoveTilde(
                    'button',
                    'bUp',
                    Icons.GetIcon('arrow-up-bold'),
                    String(Color.rgb_dec565(Color.navParent as RGB)),
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
            if (item.right.single !== undefined && item.right.double === undefined) {
                navigationString2 = getPayloadRemoveTilde(
                    'button',
                    'bSubNext',
                    item.right.double === undefined
                        ? Icons.GetIcon('arrow-right-bold')
                        : Icons.GetIcon('arrow-top-right-bold-outline'),
                    item.right.double === undefined
                        ? String(Color.rgb_dec565(Color.navRight as RGB))
                        : String(Color.rgb_dec565(Color.navDownRight as RGB)),
                    '',
                    '',
                );
            } else if (item.right.double !== undefined) {
                navigationString2 = getPayloadRemoveTilde(
                    'button',
                    'bHome',
                    Icons.GetIcon('home'),
                    String(Color.rgb_dec565(Color.navHome as RGB)),
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

    resetPosition(force: boolean = false): void {
        if (!force && this.adapter.config.rememberLastSite === true) {
            return;
        }
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
    getCurrentMainPage(): Page | undefined {
        const index = this.navigationConfig.findIndex(a => a && a.name === this.mainPage);
        if (index === -1 || this.database[index] == null) {
            if (this.database[0]?.page == null) {
                return undefined;
            }
            return this.database[0]?.page;
        }
        return this.database[index]?.page;
    }
    getCurrentPage(): Page {
        const page = this.database[this.currentItem];
        if (page == null) {
            const index = this.database.findIndex(a => a && a.page !== null);
            return this.database[index]!.page;
        }
        return page.page;
    }

    async setCurrentPage(): Promise<void> {
        let page = this.database[this.currentItem];
        if (page == null) {
            const index = this.database.findIndex(a => a && a.page !== null);
            if (index === -1) {
                this.log.error('No valid page found in navigation database.');
                return;
            }
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
    }
}
