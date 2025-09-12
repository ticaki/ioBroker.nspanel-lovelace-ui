import type { PageInterface } from './PageInterface';
import type { PageItem } from '../pages/pageItem';
import type { PageItemDataItemsOptions } from '../types/type-pageItem';
import type { Panel } from '../controller/panel';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import { BaseClass } from './library';
import { genericStateObjects } from '../const/definition';
import type { Controller } from '../controller/controller';
import type { IClientPublishOptions } from 'mqtt';
import type { AlwaysOnMode } from '../types/types';

export interface BaseClassTriggerdInterface {
    name: string;
    adapter: NspanelLovelaceUi;
    alwaysOn?: 'none' | 'always' | 'action' | 'ignore';
    panel: Panel;
    dpInit?: string | RegExp;
}

/**
 * Basisklasse für alles das auf Statestriggern soll - also jede card / popup
 * übernimmt auch die Sichtbarkeitssteuerung das triggern wird pausiert wenn nicht sichtbar
 * mit async onStateTrigger(): Promise<void> {} können abgeleitete Klassen auf Triggerereignisse reagieren
 */
export class BaseClassTriggerd extends BaseClass {
    private updateTimeout: ioBroker.Timeout | undefined;
    private waitForTimeout: ioBroker.Timeout | undefined;
    private doUpdate: boolean = true;
    protected minUpdateInterval: number;
    protected visibility: boolean = false;
    public alwaysOn: AlwaysOnMode;
    private alwaysOnState: ioBroker.Timeout | undefined;
    private lastMessage: string = '';
    readonly basePanel: Panel;
    public _currentPanel: Panel | undefined;
    protected filterDuplicateMessages: boolean = true;
    neverDeactivateTrigger: boolean = false;
    sleep: boolean = false;
    parent: BaseClassTriggerd | undefined = undefined;
    canBeHidden: boolean = false;
    triggerParent: boolean = false;
    dpInit: string | RegExp = '';
    protected blockUpdateUntilTime: Date | null = null;
    protected enums: string | string[] = '';
    protected device: string = '';
    protected sendToPanel: (payload: string, ackForType: boolean, opt?: IClientPublishOptions) => void = (
        payload: string,
        ackForType: boolean,
        opt?: IClientPublishOptions,
    ) => {
        if (this.filterDuplicateMessages && payload == this.lastMessage) {
            return;
        }
        this.lastMessage = payload;
        this.sendToPanelClass(payload, ackForType, opt);
    };
    resetLastMessage(): void {
        this.lastMessage = '';
    }

    constructor(card: BaseClassTriggerdInterface) {
        super(card.adapter, card.name);
        this.minUpdateInterval = 400;
        if (!this.adapter.controller) {
            throw new Error('No controller! bye bye');
        }
        this.alwaysOn = card.alwaysOn ?? 'none';
        this.basePanel = card.panel;
        this._currentPanel = card.panel;
    }

    get currentPanel(): Panel {
        return this._currentPanel ?? this.basePanel;
    }
    set currentPanel(p: Panel | undefined) {
        this._currentPanel = p;
    }
    protected sendToPanelClass(payload: string, ackForType: boolean, opt?: IClientPublishOptions): void {
        this.currentPanel.panelSend.addMessage(payload, ackForType, opt);
    }
    get controller(): Controller {
        // checked in constructor
        return this.adapter.controller!;
    }
    async reset(): Promise<void> {}

    readonly onStateTriggerSuperDoNotOverride = async (dp: string, from: BaseClassTriggerd): Promise<boolean> => {
        if (this.unload || this.adapter.unload) {
            return false;
        }
        if (
            !this.visibility &&
            !(
                this.neverDeactivateTrigger ||
                (this.canBeHidden && this.parent?.visibility) ||
                from.neverDeactivateTrigger
            )
        ) {
            this.log.debug(`[${this.basePanel.friendlyName} ${this.name}] Page not visible, ignore trigger!`);
            return false;
        }

        if (this.sleep && !this.neverDeactivateTrigger) {
            return false;
        }
        if (this.waitForTimeout) {
            return false;
        }

        if (this.blockUpdateUntilTime) {
            if (this.blockUpdateUntilTime.getTime() > new Date().getTime()) {
                if (this.updateTimeout) {
                    this.adapter.clearTimeout(this.updateTimeout);
                }
                this.updateTimeout = this.adapter.setTimeout(
                    async () => {
                        if (this.unload || this.adapter.unload) {
                            return;
                        }
                        this.updateTimeout = undefined;
                        if (this.doUpdate) {
                            this.doUpdate = false;
                            await this.onStateTrigger(dp, from);
                        }
                    },
                    this.blockUpdateUntilTime.getTime() - new Date().getTime() + 20,
                );
            }
            this.blockUpdateUntilTime = null;
        }
        if (this.updateTimeout) {
            this.doUpdate = true;
            return false;
        }

        this.waitForTimeout = this.adapter.setTimeout(async () => {
            this.waitForTimeout = undefined;
            await this.onStateTrigger(dp, from);
            if (this.alwaysOnState) {
                this.adapter.clearTimeout(this.alwaysOnState);
            }
            if (this.alwaysOn === 'action') {
                if (this.unload || this.adapter.unload) {
                    return;
                }
                this.alwaysOnState = this.adapter.setTimeout(
                    () => {
                        this.basePanel.sendScreensaverTimeout(this.basePanel.timeout);
                    },
                    this.basePanel.timeout * 1000 || 5000,
                );
            }
        }, 20);
        this.updateTimeout = this.adapter.setTimeout(async () => {
            if (this.unload || this.adapter.unload) {
                return;
            }
            this.updateTimeout = undefined;
            if (this.doUpdate) {
                this.doUpdate = false;
                await this.onStateTrigger(dp, from);
            }
        }, this.minUpdateInterval);
        return true;
    };

    protected async onStateTrigger(_dp: string, _from: BaseClassTriggerd): Promise<void> {
        this.adapter.log.warn(
            `<- instance of [${Object.getPrototypeOf(this)}] is triggert but dont react or call super.onStateTrigger()`,
        );
    }

    private stopTriggerTimeout(): void {
        if (this.updateTimeout) {
            this.adapter.clearTimeout(this.updateTimeout);
            this.updateTimeout = undefined;
        }
    }
    async delete(): Promise<void> {
        await super.delete();
        await this.setVisibility(false);
        this.parent = undefined;
        if (this.waitForTimeout) {
            this.adapter.clearTimeout(this.waitForTimeout);
        }
        if (this.alwaysOnState) {
            this.adapter.clearTimeout(this.alwaysOnState);
        }
        this.stopTriggerTimeout();
    }
    getVisibility = (): boolean => {
        return this.visibility;
    };
    setVisibility = async (v: boolean): Promise<void> => {
        if (v !== this.visibility) {
            this.visibility = v;
            if (this.visibility) {
                if (this.unload || this.adapter.unload) {
                    return;
                }

                this.log.debug(`[${this.basePanel.friendlyName}] Switch page to visible!`);
                this.resetLastMessage();
                this.controller && (await this.controller.statesControler.activateTrigger(this));

                this.basePanel.info.nspanel.currentPage = this.name;
                await this.library.writedp(
                    `panels.${this.basePanel.name}.info.nspanel.currentPage`,
                    this.name,
                    genericStateObjects.panel.panels.info.nspanel.currentPage,
                );
            } else {
                if (this.alwaysOnState) {
                    this.adapter.clearTimeout(this.alwaysOnState);
                }
                this.log.debug(`[${this.basePanel.friendlyName}] Switch page to invisible!`);
                if (!this.neverDeactivateTrigger) {
                    this.stopTriggerTimeout();
                    this.controller && (await this.controller.statesControler.deactivateTrigger(this));
                }
            }
            if (this.unload || this.adapter.unload) {
                return;
            }
            await this.onVisibilityChange(v);
            if (this.visibility) {
                if (this.alwaysOn != 'ignore') {
                    if (this.alwaysOn != 'none') {
                        if (this.alwaysOn === 'action') {
                            if (this.unload || this.adapter.unload) {
                                return;
                            }
                            this.alwaysOnState = this.adapter.setTimeout(
                                async () => {
                                    this.basePanel.sendScreensaverTimeout(this.basePanel.timeout);
                                },
                                this.basePanel.timeout * 2 * 1000 || 5000,
                            );
                        } else {
                            this.basePanel.sendScreensaverTimeout(0);
                        }
                    } else {
                        this.basePanel.sendScreensaverTimeout(this.basePanel.timeout);
                    }
                }
            }
        } else {
            this.visibility = v;
            // bin mir nicht sicher ob das für alles passt.
            if (this.unload || this.adapter.unload) {
                return;
            }
            if (this.visibility) {
                await this.onVisibilityChange(v);
            }
        }
    };
    /**
     * Event when visibility is on Change.
     *
     * @param val true/false
     */
    protected async onVisibilityChange(val: boolean): Promise<void> {
        val;
        this.adapter.log.warn(
            `<- instance of [${this.name}] not react on onVisibilityChange(), or call super.onVisibilityChange()`,
        );
    }
}
export class BaseClassPage extends BaseClassTriggerd {
    pageItemConfig: (PageItemDataItemsOptions | undefined)[] | undefined;
    pageItems: (PageItem | undefined)[] | undefined;
    constructor(card: PageInterface, pageItemsConfig: (PageItemDataItemsOptions | undefined)[] | undefined) {
        super(card);
        this.pageItemConfig = pageItemsConfig;
    }
    async getEnabledPageItems(): Promise<(PageItem | undefined)[] | undefined> {
        if (this.pageItems) {
            const pageItems = [];
            for (let a = 0; a < this.pageItems.length; a++) {
                if (this.pageItems[a] == null) {
                    continue;
                }
                if (await this.pageItems[a]!.isEnabled()) {
                    pageItems.push(this.pageItems[a]);
                }
            }
            return pageItems;
        }
        return this.pageItems;
    }
}
