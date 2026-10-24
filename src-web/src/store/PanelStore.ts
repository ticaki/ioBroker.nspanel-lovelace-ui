import type { AnyCardModule, ParseContext } from '../cards/CardContract';
import {
    buttonPress2,
    HMI_PROJECT_VERSION,
    isPopupPage,
    isScreensaverPage,
    pageOpenDetailEvent,
    parseCommand,
    renderCurrentPageEvent,
    sleepReachedEvent,
    startupEvent,
} from '../protocol/commands';
import { toNumber } from '../protocol/split';
import type { GlobalState, PanelModel } from '../protocol/types';

export interface PageState {
    pageType: string;
    pageArgs: string[];
    module: AnyCardModule | undefined;
    model: unknown;
}

export interface StoreSnapshot {
    global: GlobalState;
    page: PageState;
    /** counter, increased with every change - cheap "did anything change" check for React */
    version: number;
}

export interface StoreOptions {
    /** modules by pageType */
    registry: Readonly<Record<string, AnyCardModule>>;
    /** sends a display event (`event,…`) */
    recv: (payload: string) => void;
    /** acknowledges a command (`Done`) */
    ack: () => void;
    /** log unknown commands */
    log?: (message: string) => void;
    /** timer functions, replaceable for tests */
    setTimeout?: (fn: () => void, ms: number) => unknown;
    clearTimeout?: (handle: unknown) => void;
}

/** Page types the display does not answer with `event,renderCurrentPage` */
const NO_RENDER_ACK = new Set(['pageStartup', 'popupNotify', 'popupNotify2']);

/** Popups that run their own timeout (the `timeout` field of the payload, 0 = stays open) */
const OWN_TIMEOUT = new Set(['popupNotify', 'popupNotify2']);

const POPUP_EVENT_PREFIX = 'event,pageOpenDetail,';

export function initialGlobalState(model: PanelModel = 'eu'): GlobalState {
    return {
        model,
        time: '',
        timeIcon: '',
        date: '',
        timeout: 0,
        dim: { standby: 20, active: 100, background: 0, text: 65535 },
        sleeping: false,
    };
}

/**
 * Holds the state of the virtual display and dispatches the CustomSend payloads.
 * One instance per App, the components only read snapshots.
 */
export class PanelStore {
    private readonly registry: Readonly<Record<string, AnyCardModule>>;
    private readonly options: StoreOptions;
    private readonly listeners = new Set<() => void>();
    private global: GlobalState;
    /** TFT version reported in the startup event, from the hello frame */
    private tftVersion = '1.0.0';
    private page: PageState = { pageType: 'pageStartup', pageArgs: [], module: undefined, model: undefined };
    /** the card page a locally opened popup returns to on `bExit` */
    private cardPage: PageState | undefined = undefined;
    private version = 0;
    private sleepTimer: unknown = undefined;
    private snapshot: StoreSnapshot;

    constructor(options: StoreOptions, model: PanelModel = 'eu') {
        this.options = options;
        this.registry = options.registry;
        this.global = initialGlobalState(model);
        this.enterPage('pageStartup', []);
        this.snapshot = this.buildSnapshot();
    }

    /**
     * Takes model and TFT version of the `hello` frame, resets to the startup page and
     * sends the startup event - the first message of a display after boot.
     *
     * @param model panel model
     * @param tftVersion version reported in `event,startup`, may be `1.0.0`
     */
    reset(model: PanelModel, tftVersion = this.tftVersion): void {
        this.tftVersion = tftVersion;
        this.global = { ...initialGlobalState(model), dim: this.global.dim };
        this.enterPage('pageStartup', []);
        this.commit();
        this.sendStartupEvent();
    }

    /** `event,startup,<hmi>,<model>,<tft>` - after hello and whenever the startup page is shown */
    private sendStartupEvent(): void {
        this.options.recv(startupEvent(HMI_PROJECT_VERSION, this.global.model, this.tftVersion));
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    getSnapshot(): StoreSnapshot {
        return this.snapshot;
    }

    private buildSnapshot(): StoreSnapshot {
        return { global: this.global, page: this.page, version: this.version };
    }

    private commit(): void {
        this.version++;
        this.snapshot = this.buildSnapshot();
        for (const listener of this.listeners) {
            listener();
        }
    }

    /** sends `event,buttonPress2,<id>,<action>[,<value>]` and counts as touch */
    readonly press = (id: string, action: string, value?: string | number): void => {
        this.touch();
        if (action === 'bExit') {
            this.leavePopup();
        }
        this.options.recv(buttonPress2(id, action, value));
    };

    /** sends a raw display event and counts as touch */
    readonly send = (event: string): void => {
        this.touch();
        if (event.startsWith(POPUP_EVENT_PREFIX)) {
            // a raw popup request of a card: switch like the display does, without a title
            const [popup = '', id = ''] = event.slice(POPUP_EVENT_PREFIX.length).split(',');
            if (popup !== this.page.pageType) {
                this.showPopup(popup, [id, '', '']);
            }
        } else if (/^event,buttonPress2,[^,]*,bExit(,|$)/.test(event)) {
            this.leavePopup();
        }
        this.options.recv(event);
    };

    /**
     * Opens a popup the way the real display does: the page changes locally and the
     * adapter is asked for the content (`entityUpdateDetail`). The card page is kept and
     * restored on `bExit`.
     *
     * @param popup popup page type, e.g. `popupLight`
     * @param id entity id the popup answers with
     * @param title title shown in the popup header (display name of the entity)
     * @param icon icon glyph of the entity
     */
    readonly openPopup = (popup: string, id: string, title = '', icon = ''): void => {
        this.touch();
        this.showPopup(popup, [id, title, icon]);
        this.options.recv(pageOpenDetailEvent(popup, id));
    };

    private showPopup(popup: string, pageArgs: string[]): void {
        if (!isPopupPage(this.page.pageType)) {
            this.cardPage = this.page;
        }
        this.enterPage(popup, pageArgs, true);
        if (!this.page.module) {
            this.options.log?.(`unknown popup ${popup}`);
        }
        this.commit();
    }

    /** back to the card a popup was opened from (the adapter re-sends the card anyway) */
    private leavePopup(): void {
        if (!isPopupPage(this.page.pageType) || !this.cardPage) {
            return;
        }
        this.page = this.cardPage;
        this.cardPage = undefined;
        this.global = { ...this.global, sleeping: isScreensaverPage(this.page.pageType) };
        this.restartSleepTimer();
        this.commit();
    }

    /** any user interaction - restarts the screensaver timeout */
    readonly touch = (): void => {
        this.restartSleepTimer();
    };

    private ctx(): ParseContext {
        return { pageType: this.page.pageType, pageArgs: this.page.pageArgs };
    }

    private enterPage(pageType: string, pageArgs: string[], keepCardPage = false): void {
        const module = this.registry[pageType];
        this.page = { pageType, pageArgs, module, model: module ? module.initial() : undefined };
        if (!keepCardPage) {
            // a page sent by the adapter replaces whatever a local popup would return to
            this.cardPage = undefined;
        }
        this.global = { ...this.global, sleeping: isScreensaverPage(pageType) };
        this.restartSleepTimer();
    }

    /**
     * Processes one `cmd` frame, acknowledges it and sends the follow-up events the
     * display would send.
     *
     * @param payload the CustomSend payload
     */
    dispatch(payload: string): void {
        const { cmd, args } = parseCommand(payload);
        let renderAck: string | undefined;
        let startup = false;
        switch (cmd) {
            case 'pageType': {
                const pageType = args[0] ?? '';
                this.enterPage(pageType, args.slice(1));
                if (!NO_RENDER_ACK.has(pageType)) {
                    renderAck = renderCurrentPageEvent(pageType);
                }
                // the real HMI repeats the startup event while it shows the startup page;
                // the adapter sends pageType~pageStartup every 5 s until it arrives
                startup = pageType === 'pageStartup';
                if (!this.page.module) {
                    this.options.log?.(`unknown pageType ${pageType}`);
                }
                break;
            }
            case 'time':
                this.global = { ...this.global, time: args[0] ?? '', timeIcon: args[1] ?? '' };
                break;
            case 'date':
                this.global = { ...this.global, date: args.join('~') };
                break;
            case 'timeout':
                this.global = { ...this.global, timeout: toNumber(args[0], 0) };
                this.restartSleepTimer();
                break;
            case 'dimmode':
                this.global = {
                    ...this.global,
                    dim: {
                        standby: toNumber(args[0], this.global.dim.standby),
                        active: toNumber(args[1], this.global.dim.active),
                        background: toNumber(args[2], this.global.dim.background),
                        text: toNumber(args[3], this.global.dim.text),
                    },
                };
                break;
            case 'entityUpd':
                this.applyToPage(module => module.parseEntityUpd(args, this.page.model, this.ctx()), cmd);
                break;
            case 'entityUpdateDetail':
                this.applyToPage(
                    module =>
                        module.parseEntityUpdateDetail
                            ? module.parseEntityUpdateDetail(args, this.page.model, this.ctx())
                            : undefined,
                    cmd,
                );
                break;
            default:
                this.applyToPage(
                    module =>
                        module.handleCommand ? module.handleCommand(cmd, args, this.page.model, this.ctx()) : undefined,
                    cmd,
                );
                break;
        }
        this.commit();
        this.options.ack();
        if (renderAck) {
            this.options.recv(renderAck);
        }
        if (startup) {
            this.sendStartupEvent();
        }
    }

    private applyToPage(fn: (module: AnyCardModule) => unknown, cmd: string): void {
        const module = this.page.module;
        if (!module) {
            this.options.log?.(`${cmd} for unknown page ${this.page.pageType} ignored`);
            return;
        }
        const next = fn(module);
        if (next === undefined) {
            this.options.log?.(`${cmd} not handled by ${this.page.pageType}`);
            return;
        }
        this.page = { ...this.page, model: next };
    }

    /**
     * Brightness (0-100) the display shows right now, relative to its active level: the
     * active backlight value (often 60-80 %) is what the user perceives as "normal", so
     * only the screensaver dims - by the ratio standby/active.
     */
    get brightness(): number {
        if (!this.global.sleeping) {
            return 100;
        }
        const { standby, active } = this.global.dim;
        const ratio = standby / Math.max(active, 1);
        return Math.max(0, Math.min(100, Math.round(ratio * 100)));
    }

    private restartSleepTimer(): void {
        const clear =
            this.options.clearTimeout ?? ((h: unknown): void => clearTimeout(h as ReturnType<typeof setTimeout>));
        const set = this.options.setTimeout ?? ((fn: () => void, ms: number): unknown => setTimeout(fn, ms));
        if (this.sleepTimer !== undefined) {
            clear(this.sleepTimer);
            this.sleepTimer = undefined;
        }
        if (
            this.global.timeout <= 0 ||
            this.global.sleeping ||
            this.page.pageType === 'pageStartup' ||
            OWN_TIMEOUT.has(this.page.pageType)
        ) {
            return;
        }
        this.sleepTimer = set(() => {
            this.sleepTimer = undefined;
            if (isPopupPage(this.page.pageType)) {
                // a popup closes on timeout (the HMI sends bExit, not sleepReached)
                const id = this.page.pageArgs[0] || this.page.pageType;
                this.leavePopup();
                this.options.recv(buttonPress2(id, 'bExit'));
                return;
            }
            this.options.recv(sleepReachedEvent(this.page.pageType));
        }, this.global.timeout * 1000);
    }

    destroy(): void {
        if (this.sleepTimer !== undefined) {
            (this.options.clearTimeout ?? ((h: unknown): void => clearTimeout(h as ReturnType<typeof setTimeout>)))(
                this.sleepTimer,
            );
            this.sleepTimer = undefined;
        }
        this.listeners.clear();
    }
}
