import { Panel } from '../controller/panel';
import { AdapterClassDefinition, BaseClass } from './library';
import { rgb_dec565, White } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { Page } from './Page';
import { getPayload } from '../const/tools';

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
} | null;

export type NavigationItem = {
    left: {
        single?: number;
        double?: number;
    };
    right: {
        single?: number;
        double?: number;
    };
    page: Page;
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
    doubleClickDelay: number = 400;
    private mainPage = 'main';
    private doubleClickTimeout: ioBroker.Timeout | undefined;
    private currentItem: number = 0;
    constructor(config: NavigationConfig) {
        super(config.adapter, `${config.panel.name}-navigation`);
        this.panel = config.panel;
        this.navigationConfig = config.navigationConfig;
    }

    init(): void {
        let b = 1;
        for (let a = 0; a < this.navigationConfig.length; a++) {
            const c = this.navigationConfig[a];
            if (!c) continue;
            const pageID = this.panel.getPagebyUniqueID(c.page);
            this.database[c.name === 'main' ? 0 : b++] = pageID !== null ? { page: pageID, left: {}, right: {} } : null;
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

    setTargetPageByName(n: string): void {
        const index = this.navigationConfig.findIndex((a) => a && a.name === n);
        if (index !== -1 && this.database[index]) {
            this.currentItem = index;
            this.panel.setActivePage(this.database[index]!.page);
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
                if (index !== undefined && this.database[index]) {
                    this.currentItem = index;
                    this.panel.setActivePage(this.database[index]!.page);
                }
            }
            this.log.debug('Navigation double click not work.');
            // erster Klick und check obs ein Ziel für den 2. Klick gibt.
        } else if (!single && i && i[d] && i[d].double) {
            this.doubleClickTimeout = this.adapter.setTimeout(
                (...arg: any): void => {
                    this.go(arg[0], arg[1]);
                },
                this.doubleClickDelay,
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
                if (index !== undefined && this.database[index]) {
                    this.currentItem = index;
                    this.panel.setActivePage(this.database[index]!.page);
                    return;
                }
                this.log.debug(`Navigation single click with target ${i[d].single} not work.`);
                return;
            }
            this.log.debug('Navigation single click not work.');
        }
    }
    buildNavigationString(): string {
        const item = this.database[this.currentItem];
        if (!item) return '';
        let navigationString = '';
        if (
            item.left.single !== undefined &&
            (item.left.double === undefined || this.doubleClickTimeout === undefined)
        ) {
            navigationString = getPayload(
                'button',
                'bSubPrev',
                item.left.double !== undefined
                    ? Icons.GetIcon('arrow-left-bold')
                    : Icons.GetIcon('arrow-top-left-bold-outline'),
                String(rgb_dec565(White)),
                '',
                '',
            );
        } else if (item.left.double !== undefined) {
            navigationString = getPayload(
                'button',
                'bUp',
                Icons.GetIcon('arrow-up-bold'),
                String(rgb_dec565(White)),
                '',
                '',
            );
        } else {
            navigationString = getPayload('', '', '', '', '', '');
        }
        let navigationString2 = '';
        //Right icon
        if (
            item.right.single !== undefined &&
            (item.right.double === undefined || this.doubleClickTimeout === undefined)
        ) {
            navigationString2 = getPayload(
                'button',
                'bSubNext',
                item.left.double === undefined
                    ? Icons.GetIcon('arrow-right-bold')
                    : Icons.GetIcon('arrow-top-right-bold-outline'),
                String(rgb_dec565(White)),
                '',
                '',
            );
        } else if (item.right.double !== undefined) {
            navigationString2 = getPayload('button', 'bHome', Icons.GetIcon('home'), String(rgb_dec565(White)), '', '');
        } else {
            navigationString2 = getPayload('', '', '', '', '', '');
        }
        return getPayload(navigationString, navigationString2);
    }
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
}
