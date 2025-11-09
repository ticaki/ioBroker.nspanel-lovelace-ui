import { Page } from '../classes/Page';
import { type PageInterface } from '../classes/PageInterface';
import { Color, type RGB } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { getPayload, getPayloadArray, getPayloadRemoveTilde, getRegExp } from '../const/tools';
import type * as pages from '../types/pages';
import * as globals from '../types/function-and-const';
import type { IncomingEvent, nsPanelState, nsPanelStateVal } from '../types/types';
import { handleCardRole } from './data-collection-functions';
import type { PageItem } from './pageItem';

export class PageMenu extends Page {
    declare config: pages.PageMenuConfig;
    protected autoLoopTimeout: ioBroker.Timeout | undefined;
    protected maxItems: number = 4;
    protected step: number = 0;
    protected iconLeft: string = '';
    protected iconRight: string = '';
    protected iconLeftP: string = '';
    protected iconRightP: string = '';
    protected doubleClick: ioBroker.Timeout | undefined;
    protected lastdirection: null | 'left' | 'right' = null;

    /** Optional arrow item used when scrollPresentation === 'arrow'. */
    protected arrowPageItem?: PageItem;

    private nextArrow: boolean = false;

    private tempItems: (PageItem | undefined)[] | undefined;

    constructor(config: PageInterface, options: pages.PageBase) {
        if (!globals.isPageMenuConfig(config)) {
            throw new Error(`PageMenu: invalid config (card=${(config as any).card})`);
        }
        super(config, options);
        if (options.config) {
            switch (options.config.card) {
                case 'cardSchedule':
                case 'cardGrid':
                    this.maxItems = 6;
                    break;
                case 'cardGrid2':
                    this.maxItems = this.basePanel.info.nspanel.model === 'us-p' ? 9 : 8;
                    break;
                case 'cardGrid3':
                    this.maxItems = 4;
                    break;
                case 'cardEntities':
                    this.maxItems = this.basePanel.info.nspanel.model === 'us-p' ? 5 : 4;
                    break;
                case 'cardThermo2':
                    this.maxItems = 9;
                    break;
                case 'cardMedia':
                    this.maxItems = 5;
                    break;
                case 'cardChart':
                case 'cardLChart':
                case 'cardThermo':
                case 'cardQR':
                case 'cardAlarm':
                case 'cardPower':
                case 'screensaver':
                case 'screensaver2':
                case 'screensaver3':
                case 'popupNotify':
                case 'popupNotify2':
                default:
                    this.log.warn(
                        `PageMenu: ${config.card} is not supported in this class. Please use the correct class for this card.`,
                    );
                    break;
            }
        }
    }

    public async init(): Promise<void> {
        await super.init();
        const temp = await this.createPageItems([
            {
                type: 'button',
                dpInit: '',
                role: 'button',
                data: {
                    icon: {
                        true: {
                            value: { type: 'const', constVal: 'arrow-right-bold-circle-outline' },
                            color: { type: 'const', constVal: Color.navRight },
                        },
                    },
                    entity1: { value: { type: 'const', constVal: true } },
                    additionalId: { type: 'const', constVal: '-NextPageArrow' },
                    text: { true: { type: 'const', constVal: 'more' } },
                },
            },
        ]);
        if (!temp || !temp[0]) {
            throw new Error('PageMenu: unable to create arrowPageItem');
        }
        this.arrowPageItem = temp[0];
    }

    protected nextTick(): void {
        this.step++;
        void this.update();
    }
    protected autoLoop(): void {
        if (this.autoLoopTimeout) {
            this.adapter.clearTimeout(this.autoLoopTimeout);
        }
        if (!this.config || this.config.scrollPresentation !== 'auto') {
            return;
        }
        if (this.unload || this.adapter.unload) {
            return;
        }
        this.autoLoopTimeout = this.adapter.setTimeout(
            () => {
                if ((this.visibility && !this.sleep && !this.unload) || this.adapter.unload) {
                    this.nextTick();
                }

                this.autoLoop();
            },
            (this.config.scrollAutoTiming < 2 ? 3000 : this.config.scrollAutoTiming * 1000) || 15_000,
        );
    }

    /**
     * Build the list of payload strings for the current view.
     *
     * Modes:
     * - "classic": windowed paging using `this.maxItems`.
     *     - Respects `config.scrollType`: "page" (full page) or "half" (half page).
     *     - "half" is only effective for grid/thermo cards; otherwise falls back to "page".
     * - "arrow": always returns exactly `this.maxItems` slots; the last slot is optionally
     *     replaced by `arrowPageItem`. Now also shows on the last page to wrap to the first.
     *
     * Order is preserved (sequential awaits). Resets `this.step` if it points beyond the list.
     *
     * @param result Pre-allocated result array to fill with payload strings.
     * @returns Filled `result`.
     */
    public async getOptions(result: string[]): Promise<string[]> {
        if (!this.pageItems || !this.config) {
            return result;
        }

        // refresh enabled items
        this.tempItems = (await this.getEnabledPageItems()) || [];

        // filtering
        if (this.config.filterType === true || this.config.filterType === false) {
            const wantTrue = this.config.filterType === true;
            const filtered: typeof this.tempItems = [];
            for (const p of this.tempItems) {
                if (
                    p?.dataItems?.data &&
                    'entity1' in p.dataItems.data &&
                    p.dataItems.data.entity1?.value &&
                    wantTrue === (await p.dataItems.data.entity1.value.getBoolean())
                ) {
                    filtered.push(p);
                }
            }
            this.tempItems = filtered;
        } else if (typeof this.config.filterType === 'number') {
            const filtered: typeof this.tempItems = [];
            for (const p of this.tempItems) {
                if (
                    p?.dataItems &&
                    (p.dataItems.filter == null ||
                        p.dataItems.filter === this.config.filterType ||
                        (typeof p.dataItems.filter === 'number' &&
                            p.dataItems.filter < 0 &&
                            p.dataItems.filter !== -this.config.filterType))
                ) {
                    filtered.push(p);
                }
            }
            this.tempItems = filtered;
        } else if (typeof this.config.filterType === 'string') {
            const filtered: typeof this.tempItems = [];
            const filter = this.config.filterType.split(',');
            for (const p of this.tempItems) {
                if (
                    p?.dataItems &&
                    (typeof p.dataItems.filter !== 'string' || filter.indexOf(String(p.dataItems.filter)) !== -1)
                ) {
                    filtered.push(p);
                }
            }
            this.tempItems = filtered;
        }

        const items = this.tempItems ?? [];
        const total = items.length;
        const maxItems = Math.max(0, this.maxItems | 0);

        // prefill with placeholders
        for (let i = 0; i < maxItems; i++) {
            result[i] = result[i] ?? '~~~~~';
        }

        // classic paging
        // normalize presentation: "auto" behaves exactly like "classic"
        const rawStyle = this.config.scrollPresentation ?? 'classic';
        const style: 'classic' | 'arrow' = rawStyle === 'auto' ? 'classic' : rawStyle;

        // classic paging
        if (style === 'classic') {
            const requestedScrollType = this.config.scrollType === 'half' ? 'half' : 'page';
            const cardAllowsHalf = globals.isCardMenuHalfPageScrollType(this.config.card);
            const effectiveScrollType: 'page' | 'half' =
                requestedScrollType === 'half' && cardAllowsHalf ? 'half' : 'page';

            const stride =
                total > maxItems
                    ? effectiveScrollType === 'page'
                        ? maxItems
                        : Math.max(1, Math.floor(maxItems / 2))
                    : 0;

            let start = stride > 0 ? this.step * stride : 0;
            if (start >= total) {
                this.step = 0;
                start = 0;
            }

            const end = Math.min(start + maxItems, total);

            let outIdx = 0;
            const tasks: Promise<string>[] = [];

            for (let i = start; i < end; i++, outIdx++) {
                const item = items[i];
                if (item) {
                    tasks.push(
                        item
                            .getPageItemPayload()
                            .then(p => p ?? '~~~~~')
                            .catch(() => '~~~~~'),
                    );
                } else {
                    tasks.push(Promise.resolve('~~~~~'));
                }
            }

            const results = await Promise.all(tasks);

            // Ergebnisse in die Slots einfügen
            for (let j = 0; j < results.length; j++) {
                result[j] = results[j];
            }
            while (outIdx < maxItems) {
                result[outIdx++] = '~~~~~';
            }

            return result;
        }

        // arrow paging (with wrap-around arrow on the last page)
        if (style === 'arrow') {
            if (maxItems <= 0) {
                return result;
            }
            const multiplePages = total > maxItems;

            let start = this.step * (maxItems - (multiplePages ? 1 : 0));
            if (start >= total) {
                this.step = 0;
                start = 0;
            }

            const moreAfterWindow = start + maxItems < total;
            const moreBeforeWindow = start > 0;

            // show arrow if there are multiple pages and either we can go forward OR we are on the last page (wrap)
            const shouldShowArrow = multiplePages && (moreAfterWindow || moreBeforeWindow);

            const tasks: Promise<string>[] = [];

            for (let i = 0; i < maxItems - (shouldShowArrow ? 1 : 0); i++) {
                const idx = start + i;
                const item = items[idx];
                if (item) {
                    tasks.push(
                        item
                            .getPageItemPayload()
                            .then(p => p ?? '~~~~~')
                            .catch(() => '~~~~~'),
                    );
                } else {
                    tasks.push(Promise.resolve('~~~~~'));
                }
            }

            const results = await Promise.all(tasks);

            for (let i = 0; i < maxItems - (shouldShowArrow ? 1 : 0); i++) {
                result[i] = results[i];
            }

            if (shouldShowArrow) {
                this.nextArrow = true;
                result[maxItems - 1] = this.arrowPageItem
                    ? ((await this.arrowPageItem.getPageItemPayload()) ?? '~~~~~')
                    : '~~~~~';
            } else {
                this.nextArrow = false;
            }

            return result;
        }

        return result;
    }

    protected async onVisibilityChange(val: boolean): Promise<void> {
        if (val) {
            if (this.directParentPage) {
                const dp = this.directParentPage.getdpInitForChild();
                if (dp) {
                    if (typeof dp === 'string') {
                        const v = getRegExp(`^${dp.replace(/\./g, '\\.').replace(/\*/g, '.*')}`);
                        if (v) {
                            this.dpInit = v;
                        }
                    } else {
                        this.dpInit = dp;
                    }
                }
            }
            if (this.config && globals.isPageMenuConfig(this.config)) {
                switch (this.config.card) {
                    case 'cardSchedule':
                    case 'cardGrid':
                        this.maxItems = 6;
                        break;
                    case 'cardGrid2':
                        this.maxItems = this.basePanel.info.nspanel.model === 'us-p' ? 9 : 8;
                        break;
                    case 'cardGrid3':
                        this.maxItems = 4;
                        break;
                    case 'cardEntities':
                        this.maxItems = this.basePanel.info.nspanel.model === 'us-p' ? 5 : 4;
                        break;
                    case 'cardThermo2':
                        this.maxItems = 9;
                        break;
                    case 'cardMedia':
                        this.maxItems = 5;
                        break;
                    default:
                        //@ts-expect-error
                        this.log.error(`PageMenu: ${this.config.card} is not supported in onVisibilityChange!`);
                        break;
                }
                const temp = await handleCardRole(this.adapter, this.config.cardRole, this, this.config?.options);
                if (temp) {
                    this.pageItemConfig = temp;
                }
            }
            this.step = 0;
            this.autoLoop();
        } else {
            if (this.autoLoopTimeout) {
                this.adapter.clearTimeout(this.autoLoopTimeout);
            }
            this.tempItems = [];
        }
        await super.onVisibilityChange(val);
    }

    goLeft(single: boolean = false): void {
        if (this.config.scrollPresentation && ['arrow', 'auto'].indexOf(this.config.scrollPresentation) !== -1) {
            super.goLeft();
            return;
        }
        if (!this.config || !globals.isPageMenuConfig(this.config)) {
            return;
        }

        if (!single) {
            if (this.doubleClick) {
                this.adapter.clearTimeout(this.doubleClick);
                this.doubleClick = undefined;
                if (this.lastdirection === 'left') {
                    super.goLeft();
                    return;
                }
            } else {
                this.lastdirection = 'left';
                if (this.unload || this.adapter.unload) {
                    return;
                }
                this.doubleClick = this.adapter.setTimeout(() => {
                    this.doubleClick = undefined;
                    this.goLeft(true);
                }, this.adapter.config.doubleClickTime);
                return;
            }
        }

        const total = (this.tempItems && this.tempItems.length) || (this.pageItems && this.pageItems.length) || 0;

        const maxItems = Math.max(0, this.maxItems | 0);
        const requested: 'page' | 'half' = this.config.scrollType === 'half' ? 'half' : 'page';
        const effective: 'page' | 'half' =
            requested === 'half' && globals.isCardMenuHalfPageScrollType(this.config.card) ? 'half' : 'page';
        const stride = effective === 'page' ? maxItems : Math.max(1, Math.floor(maxItems / 2));

        // wenn es gar keine weitere Seite gibt, delegiere nach links
        if (stride === 0 || total <= maxItems) {
            super.goLeft();
            return;
        }

        const prevStart = (this.step - 1) * stride;

        if (prevStart < 0) {
            // wir sind auf der ersten Seite -> nach außen navigieren
            super.goLeft();
        } else {
            this.step -= 1;
            void this.update();
        }
    }

    goRight(single: boolean = false): void {
        if (this.config.scrollPresentation && ['arrow', 'auto'].indexOf(this.config.scrollPresentation) !== -1) {
            super.goRight();
            return;
        }
        if (!this.config || !globals.isPageMenuConfig(this.config)) {
            return;
        }

        if (!single) {
            if (this.doubleClick) {
                this.adapter.clearTimeout(this.doubleClick);
                this.doubleClick = undefined;
                if (this.lastdirection === 'right') {
                    super.goRight();
                    return;
                }
            } else {
                this.lastdirection = 'right';
                if (this.unload || this.adapter.unload) {
                    return;
                }
                this.doubleClick = this.adapter.setTimeout(() => {
                    this.doubleClick = undefined;
                    this.goRight(true);
                }, this.adapter.config.doubleClickTime);
                return;
            }
        }

        const total = (this.tempItems && this.tempItems.length) || (this.pageItems && this.pageItems.length) || 0;

        const maxItems = Math.max(0, this.maxItems | 0);
        const requested: 'page' | 'half' = this.config.scrollType === 'half' ? 'half' : 'page';
        const effective: 'page' | 'half' =
            requested === 'half' && globals.isCardMenuHalfPageScrollType(this.config.card) ? 'half' : 'page';
        const stride = effective === 'page' ? maxItems : Math.max(1, Math.floor(maxItems / 2));

        const nextStart = (this.step + 1) * stride;
        if (nextStart >= total) {
            this.basePanel.navigation.goRight();
        } else {
            this.step += 1;
            void this.update();
        }
    }
    protected getNavigation(): string {
        // Arrow-Präsentation nutzt eigene Navigation
        if (this.config.scrollPresentation && ['arrow', 'auto'].indexOf(this.config.scrollPresentation) !== -1) {
            return super.getNavigation();
        }

        const total = (this.tempItems && this.tempItems.length) || (this.pageItems && this.pageItems.length) || 0;

        const maxItems = Math.max(0, this.maxItems | 0);
        if (maxItems === 0 || total <= maxItems) {
            return super.getNavigation();
        }

        // Scrolltyp wie in getOptions() bestimmen
        const requested: 'page' | 'half' = this.config.scrollType === 'half' ? 'half' : 'page';
        const cardAllowsHalf = globals.isCardMenuHalfPageScrollType(this.config.card);
        const effective: 'page' | 'half' = requested === 'half' && cardAllowsHalf ? 'half' : 'page';

        const stride = effective === 'page' ? maxItems : Math.max(1, Math.floor(maxItems / 2));
        const start = this.step * stride;

        const hasPrev = start > 0;
        const hasNext = start + maxItems < total;

        let left = hasPrev ? '' : super.getNavigation('left');
        let right = hasNext ? '' : super.getNavigation('right');

        if (!left) {
            left = getPayloadRemoveTilde(
                'button',
                'bSubPrev',
                effective === 'page' ? Icons.GetIcon('arrow-up-bold-outline') : Icons.GetIcon('arrow-up-bold'),
                String(Color.rgb_dec565(Color.navDown as RGB)),
                '',
                '',
            );
        }

        if (!right) {
            right = getPayloadRemoveTilde(
                'button',
                'bSubNext',
                effective === 'page' ? Icons.GetIcon('arrow-down-bold-outline') : Icons.GetIcon('arrow-down-bold'),
                String(Color.rgb_dec565(Color.navDown as RGB)),
                '',
                '',
            );
        }

        return getPayload(left, right);
    }
    async onButtonEvent(event: IncomingEvent): Promise<void> {
        if (this.nextArrow && event.id.endsWith('-NextPageArrow')) {
            this.step++;
            await this.update();
        }
    }
    removeTempItems(): void {
        this.tempItems = undefined; // statt [] um Referenzen zu lösen
        this.tempItems = [];
    }

    async reset(): Promise<void> {
        this.step = 0;
    }

    protected getMessage(message: any): string {
        return getPayload(
            getPayloadRemoveTilde('entityUpd', message.headline),
            message.navigation,
            getPayloadArray(message.options),
        );
    }
    onInternalCommand = async (_id: string, _state: nsPanelState | undefined): Promise<nsPanelStateVal> => {
        throw new Error('Method not implemented.');
    };

    async delete(): Promise<void> {
        this.unload = true;
        if (this.doubleClick) {
            this.adapter.clearTimeout(this.doubleClick);
            this.doubleClick = undefined;
        }
        if (this.autoLoopTimeout) {
            this.adapter.clearTimeout(this.autoLoopTimeout);
            this.autoLoopTimeout = undefined;
        }
        if (this.arrowPageItem) {
            await this.arrowPageItem.delete();
            this.arrowPageItem = undefined;
        }
        await this.basePanel.statesControler.deletePageLoop(this.onInternalCommand);
        this.tempItems = undefined; // statt [] um Referenzen zu lösen
        await super.delete();
    }
}
