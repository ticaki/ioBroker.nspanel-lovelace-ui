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
    /** acknowledges a command (`Done`) with the `seq` of its frame (undefined: unnumbered frame) */
    ack: (seq: number | undefined) => void;
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
        awake: false,
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
    /** re-dims the woken screensaver after `timeout` seconds (`global.awake` -> false) */
    private dimTimer: unknown = undefined;
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

    /** sends `event,buttonPress2,<id>,<action>[,<value>]`, wakes the screensaver and counts as touch */
    readonly press = (id: string, action: string, value?: string | number): void => {
        this.wake();
        if (action === 'bExit') {
            this.leavePopup();
        }
        this.options.recv(buttonPress2(id, action, value));
    };

    /** sends a raw display event, wakes the screensaver and counts as touch */
    readonly send = (event: string): void => {
        this.wake();
        if (event.startsWith(POPUP_EVENT_PREFIX)) {
            // a raw popup request of a card: switch like the display does, without a title
            const [popup = '', id = ''] = event.slice(POPUP_EVENT_PREFIX.length).split(',');
            if (popup !== this.page.pageType) {
                this.showPopup(popup, [id, '', '', '']);
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
     * @param iconColor RGB565 colour of the entity icon - the HMI draws the head icon of the
     *   popup in the colour the item had on the previous page (`pageArgs[3]`, as string)
     */
    readonly openPopup = (popup: string, id: string, title = '', icon = '', iconColor?: number): void => {
        this.wake();
        const color = iconColor !== undefined && Number.isFinite(iconColor) ? String(iconColor) : '';
        this.showPopup(popup, [id, title, icon, color]);
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
        this.setSleeping(isScreensaverPage(this.page.pageType));
        this.restartSleepTimer();
        this.commit();
    }

    /**
     * Any touch of the stage (pointer down) - restarts the running timeout: the sleep
     * timer on a card, the re-dim timer of a woken screensaver. It does not wake a dimmed
     * screensaver by itself: the event the gesture ends with does (`press`/`send`), so a
     * card can still read `global.awake` as it was when the gesture started.
     */
    readonly touch = (): void => {
        if (this.global.sleeping) {
            if (this.global.awake) {
                this.restartDimTimer();
            }
            return;
        }
        this.restartSleepTimer();
    };

    /**
     * A tap or swipe in the screensaver: the display is woken (full brightness) and dims
     * again after `timeout` seconds without interaction (0 = stays bright), like the real
     * display does locally. Outside the screensaver it is a plain touch.
     */
    private wake(): void {
        if (!this.global.sleeping) {
            this.restartSleepTimer();
            return;
        }
        if (!this.global.awake) {
            this.global = { ...this.global, awake: true };
            this.commit();
        }
        this.restartDimTimer();
    }

    /** enters or leaves the screensaver state; the screensaver always starts dimmed */
    private setSleeping(sleeping: boolean): void {
        this.clearDimTimer();
        this.global = { ...this.global, sleeping, awake: false };
    }

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
        this.setSleeping(isScreensaverPage(pageType));
        this.restartSleepTimer();
    }

    /**
     * Processes one `cmd` frame, acknowledges it with its `seq` and sends the follow-up
     * events the display would send.
     *
     * @param payload the CustomSend payload
     * @param seq running number of the frame, echoed in the ack (mock mode sends none)
     */
    dispatch(payload: string, seq?: number): void {
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
                if (this.global.awake) {
                    // the adapter sends the new re-dim time when it enters the screensaver
                    this.restartDimTimer();
                }
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
        this.options.ack(seq);
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
     * only the dimmed screensaver dims - by the ratio standby/active. A woken screensaver
     * (`global.awake`) is as bright as a card.
     */
    get brightness(): number {
        if (!this.global.sleeping || this.global.awake) {
            return 100;
        }
        const { standby, active } = this.global.dim;
        const ratio = standby / Math.max(active, 1);
        return Math.max(0, Math.min(100, Math.round(ratio * 100)));
    }

    private clearTimer(handle: unknown): void {
        const clear =
            this.options.clearTimeout ?? ((h: unknown): void => clearTimeout(h as ReturnType<typeof setTimeout>));
        clear(handle);
    }

    private setTimer(fn: () => void, ms: number): unknown {
        const set = this.options.setTimeout ?? ((f: () => void, m: number): unknown => setTimeout(f, m));
        return set(fn, ms);
    }

    private clearDimTimer(): void {
        if (this.dimTimer !== undefined) {
            this.clearTimer(this.dimTimer);
            this.dimTimer = undefined;
        }
    }

    /** (re)starts the re-dim of a woken screensaver; `timeout` 0 = never dims again */
    private restartDimTimer(): void {
        this.clearDimTimer();
        if (this.global.timeout <= 0 || !this.global.sleeping || !this.global.awake) {
            return;
        }
        this.dimTimer = this.setTimer(() => {
            this.dimTimer = undefined;
            if (!this.global.sleeping || !this.global.awake) {
                return;
            }
            // the display dims locally, nothing is sent
            this.global = { ...this.global, awake: false };
            this.commit();
        }, this.global.timeout * 1000);
    }

    private restartSleepTimer(): void {
        if (this.sleepTimer !== undefined) {
            this.clearTimer(this.sleepTimer);
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
        this.sleepTimer = this.setTimer(() => {
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
            this.clearTimer(this.sleepTimer);
            this.sleepTimer = undefined;
        }
        this.clearDimTimer();
        this.listeners.clear();
    }
}
