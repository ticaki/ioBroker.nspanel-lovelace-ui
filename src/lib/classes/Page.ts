import type * as pages from '../types/pages';
import * as convertColorScaleBest from '../types/function-and-const';
import { BaseClassPage } from './baseClassPage';
import type * as types from '../types/types';
import { PageItem } from '../pages/pageItem';
import { deepAssign, getPayload, getPayloadRemoveTilde, getRegExp } from '../const/tools';
import { pageItemTemplates } from '../templates/templateArray';
import type { PageInterface, PageItemInterface } from './PageInterface';
import { Icons } from '../const/icon_mapping';
import { Color, type RGB } from '../const/Color';
import type { NSPanel } from '../types/NSPanel';

//interface Page extends BaseClass | PageConfig..
export type PageConfigAll = pages.PageBase;

export class Page extends BaseClassPage {
    readonly card: pages.PageTypeCards;
    readonly id: string;
    private lastCardCounter: number = 0;
    //protected overridePageItemsDpInit: string | RegExp = '';
    public readonly isScreensaver: boolean;
    public hidden: boolean = false;

    /**
     * Direct reference to the parent page,
     * bypassing navigation logic.
     */
    public directParentPage: Page | undefined;

    /**
     * Direct reference to the child page,
     * bypassing navigation logic.
     */
    public directChildPage: Page | undefined; //readonly enums: string | string[];
    config: pages.PageBase['config'];
    //config: Card['config'];

    /**
     * Constructs a new Page instance.
     * Initializes page properties, processes device and dpInit patterns, and sets up the configuration.
     * This is the base constructor for all page types (Grid, Media, Entities, etc.).
     *
     * @param card - Page interface containing card type, ID, and data point initialization pattern
     * @param pageItemsConfig - Optional page configuration including items, enums, device references
     * @param isScreensaver - Whether this page is a screensaver (default: false)
     */
    constructor(card: PageInterface, pageItemsConfig: pages.PageBase | undefined, isScreensaver: boolean = false) {
        super(card, pageItemsConfig && pageItemsConfig.alwaysOn, pageItemsConfig && pageItemsConfig.pageItems);
        this.isScreensaver = isScreensaver;
        this.card = card.card;
        this.id = card.id;
        this.hidden = pageItemsConfig && 'hidden' in pageItemsConfig ? !!pageItemsConfig.hidden : false;
        this.enums =
            pageItemsConfig && 'enums' in pageItemsConfig && pageItemsConfig.enums ? pageItemsConfig.enums : '';
        this.device =
            pageItemsConfig && 'device' in pageItemsConfig && pageItemsConfig.device ? pageItemsConfig.device : '';
        if (this.device) {
            card.dpInit = typeof card.dpInit === 'string' ? card.dpInit.replace('#°^°#', this.device) : card.dpInit;
        }
        if (card.dpInit && typeof card.dpInit === 'string') {
            const reg = getRegExp(card.dpInit);
            if (reg) {
                card.dpInit = reg;
            }
        }
        this.dpInit = card.dpInit ?? '';
        this.config = pageItemsConfig && pageItemsConfig.config;
    }

    /**
     * Initializes the page and all its PageItems.
     * Processes templates, resolves data point patterns (dpInit/enums), and creates PageItem instances.
     * Must be called after construction and before the page is displayed.
     * Derived classes may override this to add page-specific initialization logic.
     *
     * @returns Promise that resolves when all PageItems are initialized
     */
    async init(): Promise<void> {
        // do the work für PageItems only one time - changes in ObjectDB need a adapter restart.
        if (this.pageItemConfig) {
            for (let a = 0; a < this.pageItemConfig.length; a++) {
                let options = this.pageItemConfig[a];
                if (options === undefined) {
                    continue;
                }

                // switch type text to button as indicator for cardThermo
                if (options.type === 'text' && this && this.card === 'cardThermo') {
                    options.type = 'button' as any;
                    options.role = 'indicator';
                }

                options = await this.getItemFromTemplate(options);
                if (!options) {
                    this.log.error(`Dont get a template for ${a} in ${this.name}`);
                    continue;
                }

                options.dpInit =
                    typeof options.dpInit === 'string' && options.device
                        ? options.dpInit.replace('#°^°#', options.device)
                        : options.dpInit;

                if (options.dpInit && typeof options.dpInit === 'string') {
                    const reg = getRegExp(options.dpInit, { startsWith: true });
                    if (reg) {
                        options.dpInit = reg;
                    }
                }
                // search states for mode auto
                const dpInit = (this.dpInit ? this.dpInit : options.dpInit) ?? '';
                const enums = this.enums ? this.enums : options.enums;
                if (!dpInit && !enums) {
                    //this.log.debug(`No dpInit or enums for pageItem ${a} in ${this.name}`);
                }

                options.data =
                    dpInit || enums
                        ? await this.basePanel.statesControler.getDataItemsFromAuto(
                              dpInit,
                              options.data,
                              'appendix' in options ? options.appendix : undefined,
                              this.enums ? this.enums : options.enums,
                          )
                        : options.data;
                options = structuredClone(options);
                if (options) {
                    options.dpInit = dpInit;
                }
                this.pageItemConfig[a] = await this.initPageItems(options);
            }
        }
    }

    /**
     * Initializes a single PageItem configuration.
     * Resolves data items from auto-discovery (dpInit patterns or enums) and clones the configuration.
     * Used during page initialization and when dynamically creating PageItems.
     *
     * @param item - PageItem configuration to initialize
     * @param overrideDpInit - Optional override for data point initialization pattern
     * @returns Promise resolving to the initialized PageItem configuration, or undefined if invalid
     */
    async initPageItems(
        item: NSPanel.PageItemDataItemsOptions | undefined,
        overrideDpInit: string | RegExp = '',
    ): Promise<NSPanel.PageItemDataItemsOptions | undefined> {
        let options = item;
        if (options === undefined) {
            return undefined;
        }
        const dpInit = (overrideDpInit || (this.dpInit ? this.dpInit : options.dpInit)) ?? '';
        const enums = this.enums ? this.enums : options.enums;

        options.data =
            dpInit || enums
                ? await this.basePanel.statesControler.getDataItemsFromAuto(
                      dpInit,
                      options.data,
                      'appendix' in options ? options.appendix : undefined,
                      this.enums ? this.enums : options.enums,
                  )
                : options.data;
        options = JSON.parse(JSON.stringify(options));
        if (options) {
            options.dpInit = dpInit;
        }
        return options;
    }

    /**
     * Resolves a PageItem configuration from its template definition.
     * Templates provide pre-configured settings for common device types (lights, shutters, etc.).
     * Supports template inheritance and deep merging of color/icon overrides.
     * Validates adapter compatibility and type consistency.
     *
     * @param options - PageItem configuration with template reference
     * @param subtemplate - Optional sub-template identifier for recursive resolution
     * @param loop - Recursion depth counter to prevent infinite loops (max 10)
     * @returns Promise resolving to the merged configuration, or undefined if template not found/invalid
     */
    async getItemFromTemplate(
        options: NSPanel.PageItemDataItemsOptions,
        subtemplate: types.TemplateIdent = '',
        loop: number = 0,
    ): Promise<NSPanel.PageItemDataItemsOptions | undefined> {
        if ('template' in options && options.template) {
            const template: NSPanel.PageItemOptionsTemplate | undefined = subtemplate
                ? pageItemTemplates[subtemplate]
                : pageItemTemplates[options.template];
            const name = options.template;
            if (!template) {
                this.log.error(`Dont find template ${options.template}`);
                return undefined;
            }
            if (
                template.adapter &&
                typeof options.dpInit === 'string' &&
                !options.dpInit.includes(template.adapter) &&
                typeof this.dpInit === 'string' &&
                !this.dpInit.includes(template.adapter)
            ) {
                this.log.error(
                    `Missing dbInit or dbInit not starts with${template.adapter} for template ${options.template}`,
                );
                return undefined;
            }

            const newTemplate = structuredClone(template) as Partial<NSPanel.PageItemOptionsTemplate>;
            delete newTemplate.adapter;
            if (
                options.type &&
                options.type !== template.type &&
                !(options.type == 'button' && template.type == 'text')
            ) {
                this.log.error(`Type: ${String(options.type as string)} is not equal with ${template.type}`);
                return undefined;
            }
            const colorTrue = (options.color || {}).true;
            const colorFalse = (options.color || {}).false;
            const colorScale = (options.color || {}).scale;
            const iconTrue = (options.icon || {}).true;
            const iconFalse = (options.icon || {}).false;

            options.type = options.type || template.type;
            options.role = options.role || template.role;
            options = deepAssign(newTemplate, options);
            if (template.template !== undefined) {
                if (loop > 10) {
                    throw new Error(
                        `Endless loop in getItemFromTemplate() detected! From ${template.template} for ${name}. Bye Bye`,
                    );
                }
                const o = await this.getItemFromTemplate(options, template.template, ++loop);
                if (o !== undefined) {
                    options = o;
                } else {
                    this.log.warn(`Dont get a template from ${template.template} for ${name}`);
                }
            }
            if (options.data) {
                options.data.icon = options.data.icon ?? {};
                if (colorTrue) {
                    options.data.icon.true = options.data.icon.true ?? {};
                    options.data.icon.true.color = colorTrue;
                }
                if (iconTrue) {
                    options.data.icon.true = options.data.icon.true ?? {};
                    options.data.icon.true.value = iconTrue;
                }
                if (colorFalse) {
                    options.data.icon.false = options.data.icon.false ?? {};
                    options.data.icon.false.color = colorFalse;
                }
                if (iconFalse) {
                    options.data.icon.false = options.data.icon.false ?? {};
                    options.data.icon.false.value = iconFalse;
                }
                if (colorScale) {
                    options.data.icon.scale = { type: 'const', constVal: colorScale };
                }
            }
        }
        return options;
    }

    /**
     * Handles incoming button events from the NSPanel.
     * Base implementation logs a warning; derived classes should override this to handle
     * page-specific button interactions (navigation, media controls, alarm actions, etc.).
     *
     * @param event - The incoming event from the panel containing button action and value
     */
    async onButtonEvent(event: types.IncomingEvent): Promise<void> {
        this.log.warn(`Event received but no handler! ${JSON.stringify(event)}`);
    }

    /**
     * Sends the page type command to the NSPanel to prepare the display.
     * Determines whether to force-send based on card type and panel state.
     * Some card types (Chart, Thermo) always force-send to ensure correct rendering.
     * Implements throttling to avoid redundant type commands (sends every 15th call if unchanged).
     *
     * @param force - Optional flag to force sending the pageType command regardless of cache
     */
    sendType(force?: boolean): void {
        let forceSend = force || false;
        let renderCurrentPage = false;
        switch (this.card) {
            //case 'cardBurnRec':
            case 'cardChart':
            case 'cardLChart':
            case 'cardThermo':
                forceSend = true;
            //@disable-next-line no-fallthrough
            case 'cardEntities':
            case 'cardGrid':
            case 'cardGrid2':
            case 'cardGrid3':
            case 'cardMedia':
            case 'cardQR':
            case 'cardAlarm':
            case 'cardPower':
            case 'screensaver':
            case 'screensaver2':
            case 'screensaver3':
            case 'cardItemSpecial':
            case 'cardSchedule':
            case 'cardThermo2':
                renderCurrentPage = true;
                break;
            case 'popupNotify':
            case 'popupNotify2':
                renderCurrentPage = false;
                break;
            default:
                convertColorScaleBest.exhaustiveCheck(this.card);
                break;
        }
        if (forceSend || this.basePanel.lastCard !== this.card) {
            this.basePanel.lastSendTypeDate = Date.now();
            this.log.debug(
                `Register last send type ${this.basePanel.name}-${this.card} block for ${this.basePanel.blockTouchEventsForMs}ms`,
            );
            this.sendToPanel(`pageType~${this.card}`, renderCurrentPage);
        } else {
            if (this.lastCardCounter++ > 31) {
                this.lastCardCounter = 0;
                this.basePanel.lastSendTypeDate = Date.now();
                this.log.debug(
                    `Register last send type ${this.card} block for ${this.basePanel.blockTouchEventsForMs}ms`,
                );
                this.sendToPanel(`pageType~${this.card}`, renderCurrentPage);
            }
        }
        this.basePanel.lastCard = this.card;
    }

    /**
     * Creates PageItem instances from configuration.
     * Constructs PageItem objects for interactive elements (lights, buttons, shutters, etc.).
     * Used during page initialization and when dynamically adding items to a page.
     *
     * @param pageItemsConfig - Single or array of PageItem configurations
     * @param ident - Optional identifier prefix for the PageItems (used in naming)
     * @returns Promise resolving to array of created PageItem instances (may contain undefined for invalid configs)
     */
    async createPageItems(
        pageItemsConfig:
            | NSPanel.PageItemDataItemsOptions
            | (NSPanel.PageItemDataItemsOptions | undefined)[]
            | undefined,
        ident: string = '',
    ): Promise<(PageItem | undefined)[] | undefined> {
        const result = [];
        if (pageItemsConfig) {
            if (!Array.isArray(pageItemsConfig)) {
                pageItemsConfig = [pageItemsConfig];
            }
            for (let a = 0; a < pageItemsConfig.length; a++) {
                const config: Omit<PageItemInterface, 'pageItemsConfig'> = {
                    name: ident ? ident : `${this.name}|PI`,
                    adapter: this.adapter,
                    panel: this.basePanel,
                    card: 'cardItemSpecial',
                    id: `${this.id}?${ident ? ident : a}`,
                    parent: this,
                };
                result[a] = await PageItem.getPageItem(config, pageItemsConfig[a]);
            }
        }
        return result;
    }

    /**
     * Generates the navigation payload string for the NSPanel.
     * If a direct parent page exists, shows an "up" arrow for back navigation.
     * Otherwise delegates to the panel's navigation controller for normal nav behavior.
     *
     * @param side - Optional side to generate navigation for ('left' or 'right'); if omitted, returns both
     * @returns Formatted navigation payload string for MQTT transmission
     */
    protected getNavigation(side?: 'left' | 'right'): string {
        if (this.directParentPage) {
            let left = '';
            let right = '';
            if (!side || side === 'left') {
                left = getPayloadRemoveTilde(
                    'button',
                    'bUp',
                    Icons.GetIcon('arrow-up-bold'),
                    String(Color.rgb_dec565(Color.navParent as RGB)),
                    '',
                    '',
                );
            }
            if (!side || side === 'right') {
                right = getPayload('', '', '', '', '', '');
            }
            if (!side) {
                return getPayload(left, right);
            }
            return side === 'left' ? left : right;
        }

        return this.basePanel.navigation.buildNavigationString(side);
    }

    /**
     * Handles left navigation button press.
     * If a direct parent page exists, navigates to it (for popup/child pages).
     * Otherwise delegates to the panel's navigation controller (history-based navigation).
     *
     * @param short - Whether the navigation is a short press (true) or long press (false)
     */
    goLeft(short: boolean): void {
        if (this.directParentPage) {
            void this.basePanel.setActivePage(this.directParentPage, false);
            return;
        }
        this.basePanel.navigation.goLeft(short);
    }

    /**
     * Handles right navigation button press.
     * If a direct parent page exists, does nothing (right nav disabled for child pages).
     * Otherwise delegates to the panel's navigation controller (forward navigation).
     *
     * @param short - Whether the navigation is a short press (true) or long press (false)
     */
    goRight(short: boolean): void {
        if (this.directParentPage) {
            return;
        }
        this.basePanel.navigation.goRight(short);
    }

    /**
     * Called when the page becomes visible or hidden.
     * When visible: creates PageItems, sends page type, and triggers initial update.
     * When hidden: deletes all PageItems to free resources and unsubscribe from states.
     * Derived classes should call super.onVisibilityChange() if overriding.
     *
     * @param val - true if page is becoming visible, false if being hidden
     */
    protected async onVisibilityChange(val: boolean): Promise<void> {
        if (val) {
            if (!this.pageItems || this.pageItems.length === 0) {
                this.pageItems = await this.createPageItems(this.pageItemConfig);
            }
            //if (this.card !== 'cardLChart') {
            this.sendType();
            //}
            await this.update();
        } else {
            if (this.pageItems) {
                for (const item of this.pageItems) {
                    item && (await item.delete());
                }
                this.pageItems = [];
            }
        }
    }

    /**
     * Returns the data point initialization pattern for child pages.
     * Base implementation returns empty string; derived classes (like PageMenu)
     * override this to pass dpInit patterns to dynamically created child pages.
     *
     * @returns Data point pattern (string or RegExp) for child page initialization
     */
    getdpInitForChild(): string | RegExp {
        return '';
    }

    /**
     * Registers a page as the last active page.
     * Base implementation does nothing; derived classes (like PageMenu with pagination)
     * override this to track navigation history or maintain parent-child relationships.
     *
     * @param _p - The page to register as last active (may be undefined)
     */
    setLastPage(_p: Page | undefined): void {}

    /**
     * Removes a page from the last active page tracking.
     * Base implementation does nothing; derived classes (like PageMenu)
     * override this to clean up navigation history or parent-child relationships.
     *
     * @param _p - The page to remove from tracking (may be undefined)
     */
    removeLastPage(_p: Page | undefined): void {}

    getLastPage(): Page | undefined {
        return undefined;
    }
    /**
     * Updates the page content and sends data to the NSPanel.
     * Base implementation logs a warning; all derived page classes MUST override this
     * to implement page-specific rendering logic (e.g., grid items, media player state, chart data).
     * Called when the page becomes visible or when subscribed states change.
     */
    public async update(): Promise<void> {
        this.adapter.log.warn(
            `<- instance of [${Object.getPrototypeOf(this)}] update() is not defined or call super.onStateTrigger()`,
        );
    }

    /**
     * Handles popup requests from the NSPanel (e.g., light color picker, shutter position).
     * Routes the request to the appropriate PageItem, executes commands, or generates popup payloads.
     * Called when user interacts with a PageItem that triggers a popup dialog.
     *
     * @param id - The PageItem index or identifier
     * @param popup - The type of popup to display (e.g., 'popupLight', 'popupShutter')
     * @param action - The button action performed in the popup (e.g., 'OnOff', 'brightnessSlider')
     * @param value - The value from the action (e.g., slider position, color RGB)
     * @param _event - The raw incoming event from the panel (optional)
     * @returns Promise that resolves when popup is handled and sent to panel
     */
    public async onPopupRequest(
        id: number | string,
        popup: types.PopupType | undefined,
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        action: types.ButtonActionType | undefined | string,
        value: string | undefined,
        _event: types.IncomingEvent | null = null,
    ): Promise<void> {
        if (!this.pageItems || id == '') {
            this.log.debug(
                `onPopupRequest: No pageItems or id this is only a warning if u used a pageitem except: 'arrow': ${id}`,
            );
            return;
        }
        let item: PageItem | undefined;
        if (isNaN(Number(id)) && typeof id === 'string') {
            this.log.error(
                `onPopupRequest: id should be a number but is a string: ${id}. Page name: ${this.name}, Page id: ${this.id}, Page card: ${this.card}`,
            );
        } else {
            const i = typeof id === 'number' ? id : parseInt(id);
            item = this.pageItems[i];
        }
        if (!item) {
            return;
        }
        let msg: string | null = null;
        if (action && value !== undefined && (await item.onCommand(action, value))) {
            return;
        } else if (convertColorScaleBest.isPopupType(popup) && action !== 'bExit') {
            this.basePanel.lastCard = '';
            msg = await item.GeneratePopup(popup);
        }
        if (msg !== null) {
            this.sleep = true;
            this.sendToPanel(msg, false);
        }
    }

    public async onButtonPress3(
        id: number | string,
        _popup: types.PopupType | undefined,
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        action: types.ButtonActionType | undefined | string,
        value: string | undefined,
        _event: types.IncomingEvent | null = null,
    ): Promise<boolean> {
        if (!this.pageItems || id == '') {
            this.log.debug(
                `onPopupRequest: No pageItems or id this is only a warning if u used a pageitem except: 'arrow': ${id}`,
            );
            return false;
        }
        let item: PageItem | undefined;
        if (isNaN(Number(id)) && typeof id === 'string') {
            this.log.error(
                `onPopupRequest: id should be a number but is a string: ${id}. Page name: ${this.name}, Page id: ${this.id}, Page card: ${this.card}`,
            );
        } else {
            const i = typeof id === 'number' ? id : parseInt(id);
            item = this.pageItems[i];
        }
        if (!item) {
            return false;
        }
        return !!action && value !== undefined && (await item.onCommandLongPress(action, value));
    }

    /**
     * Cleans up the page and all its resources.
     * Recursively deletes child/parent page references, destroys all PageItems,
     * and calls the base class cleanup (unsubscribes states, clears timers).
     * Must be called when a page is removed from navigation or the adapter unloads.
     *
     * @returns Promise that resolves when cleanup is complete
     */
    async delete(): Promise<void> {
        this.unload = true;

        if (this.directChildPage) {
            await this.directChildPage.delete();
            this.directChildPage = undefined;
        }
        if (this.directParentPage) {
            this.directParentPage.directChildPage = undefined;
            this.directParentPage = undefined;
        }
        if (this.pageItems) {
            for (const item of this.pageItems) {
                item && (await item.delete());
            }
        }
        this.pageItems = [];
        this.pageItemConfig = [];
        await super.delete();
    }
}

/**
 * Type guard to check if a string is a valid media button action type.
 * Used in media page implementations to validate incoming button events.
 *
 * @param F - The string to check
 * @returns true if F is a valid MediaButtonActionType, false otherwise
 */
export function isMediaButtonActionType(F: string): F is MediaButtonActionType {
    switch (F) {
        case 'media-back':
        case 'media-pause':
        case 'media-next':
        case 'media-shuffle':
        case 'volumeSlider':
        case 'mode-speakerlist':
        case 'mode-playlist':
        case 'mode-tracklist':
        case 'mode-repeat':
        case 'mode-equalizer':
        case 'mode-seek':
        case 'mode-crossfade':
        case 'mode-favorites':
        case 'mode-insel':
        case 'media-OnOff':
        case 'button':
            return true;
    }
    console.error(`${F} isMediaButtonActionType === false`);
    return false;
}
type MediaButtonActionType = Extract<
    types.ButtonActionType,
    | 'media-back'
    | 'media-pause'
    | 'media-next'
    | 'media-shuffle'
    | 'volumeSlider'
    | 'mode-speakerlist'
    | 'mode-playlist'
    | 'mode-tracklist'
    | 'mode-repeat'
    | 'mode-equalizer'
    | 'mode-seek'
    | 'mode-crossfade'
    | 'mode-favorites'
    | 'mode-insel'
    | 'media-OnOff'
    | 'button'
>;
