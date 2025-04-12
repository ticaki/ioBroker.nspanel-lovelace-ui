import type { PageInterface } from './PageInterface';
import type { PageItem } from '../pages/pageItem';
import type { PageItemDataItemsOptions } from '../types/type-pageItem';
import type { Panel } from '../controller/panel';
import type { PanelSend } from '../controller/panel-message';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import { BaseClass } from './library';
import { genericStateObjects } from '../const/definition';
import type { Controller } from '../controller/controller';
import type { IClientPublishOptions } from 'mqtt';

export interface BaseClassTriggerdInterface {
    name: string;
    adapter: NspanelLovelaceUi;
    panelSend: PanelSend;
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
    protected controller: Controller;
    readonly panelSend: PanelSend;
    public alwaysOn: 'none' | 'always' | 'action' | 'ignore';
    private alwaysOnState: ioBroker.Timeout | undefined;
    private lastMessage: string = '';
    public panel: Panel;
    protected filterDuplicateMessages: boolean = true;
    neverDeactivateTrigger: boolean = false;
    sleep: boolean = true;
    parent: BaseClassTriggerd | undefined = undefined;
    triggerParent: boolean = false;
    dpInit: string | RegExp = '';
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
    private sendToPanelClass: (payload: string, ackForType: boolean, opt?: IClientPublishOptions) => void = () => {};

    constructor(card: BaseClassTriggerdInterface) {
        super(card.adapter, card.name);
        this.minUpdateInterval = 400;
        if (!this.adapter.controller) {
            throw new Error('No controller! bye bye');
        }
        this.controller = this.adapter.controller;
        this.panelSend = card.panelSend;
        this.alwaysOn = card.alwaysOn ?? 'none';
        this.panel = card.panel;

        if (typeof this.panelSend.addMessage === 'function') {
            this.sendToPanelClass = card.panelSend.addMessage;
        }
    }

    async reset(): Promise<void> {}

    readonly onStateTriggerSuperDoNotOverride = async (dp: string, from: BaseClassTriggerd): Promise<boolean> => {
        if ((!this.visibility && !(this.neverDeactivateTrigger || from.neverDeactivateTrigger)) || this.unload) {
            return false;
        }
        if (this.sleep && !this.neverDeactivateTrigger) {
            return false;
        }
        if (this.waitForTimeout) {
            return false;
        }
        if (this.updateTimeout) {
            this.doUpdate = true;
            return false;
        }
        if (this.unload) {
            return false;
        }
        this.waitForTimeout = this.adapter.setTimeout(async () => {
            this.waitForTimeout = undefined;
            await this.onStateTrigger(dp, from);
            if (this.alwaysOnState) {
                this.adapter.clearTimeout(this.alwaysOnState);
            }
            if (this.alwaysOn === 'action') {
                if (this.unload) {
                    return;
                }
                this.alwaysOnState = this.adapter.setTimeout(
                    () => {
                        this.panel.sendScreeensaverTimeout(this.panel.timeout);
                    },
                    this.panel.timeout * 1000 || 5000,
                );
            }
        }, 20);
        this.updateTimeout = this.adapter.setTimeout(async () => {
            if (this.unload) {
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
        await this.setVisibility(false);
        this.parent = undefined;
        await super.delete();
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
                if (this.unload) {
                    return;
                }
                /*if (this.alwaysOn != 'ignore') {
                    if (this.alwaysOn != 'none') {
                        if (this.alwaysOn === 'action') {
                            if (this.unload) {
                                return;
                            }
                            this.alwaysOnState = this.adapter.setTimeout(
                                async () => {
                                    this.panel.sendScreeensaverTimeout(this.panel.timeout);
                                },
                                this.panel.timeout * 2 * 1000 || 5000,
                            );
                        } else {
                            this.panel.sendScreeensaverTimeout(0);
                        }
                    } else {
                        this.panel.sendScreeensaverTimeout(this.panel.timeout);
                    }
                }*/

                this.log.debug(`Switch page to visible!`);
                this.resetLastMessage();
                this.controller && (await this.controller.statesControler.activateTrigger(this));

                this.panel.info.nspanel.currentPage = this.name;
                await this.library.writedp(
                    `panels.${this.panel.name}.info.nspanel.currentPage`,
                    this.name,
                    genericStateObjects.panel.panels.info.nspanel.currentPage,
                );
            } else {
                if (this.alwaysOnState) {
                    this.adapter.clearTimeout(this.alwaysOnState);
                }
                this.log.debug(`Switch page to invisible!`);
                if (!this.neverDeactivateTrigger) {
                    this.stopTriggerTimeout();
                    this.controller && (await this.controller.statesControler.deactivateTrigger(this));
                }
            }
            await this.onVisibilityChange(v);
            if (this.visibility) {
                if (this.unload) {
                    return;
                }
                if (this.alwaysOn != 'ignore') {
                    if (this.alwaysOn != 'none') {
                        if (this.alwaysOn === 'action') {
                            if (this.unload) {
                                return;
                            }
                            this.alwaysOnState = this.adapter.setTimeout(
                                async () => {
                                    this.panel.sendScreeensaverTimeout(this.panel.timeout);
                                },
                                this.panel.timeout * 2 * 1000 || 5000,
                            );
                        } else {
                            this.panel.sendScreeensaverTimeout(0);
                        }
                    } else {
                        this.panel.sendScreeensaverTimeout(this.panel.timeout);
                    }
                }
            }
        } else {
            this.visibility = v;
            // bin mir nicht sicher ob das für alles passt.
            await this.onVisibilityChange(v);
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
}
