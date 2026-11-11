import type { IClientPublishOptions } from 'mqtt';
import { MAX_PANEL_PAYLOAD_BYTES, SendTopicAppendix } from '../const/definition';
import { BaseClass, type AdapterClassDefinition } from './library';
import type { callbackMessageType } from '../classes/mqtt';
import type { PanelChannel } from '../classes/panel-channel';
import type { Panel } from './panel';
import { crcPrefix, panelFrameCrc } from '../tools/crc16';
import { driverGeneration } from '../const/berry-driver';

type QueuedMessage = {
    payload: string;
    /** crc of the frame the display receives for this payload, see {@link panelFrameCrc} */
    crc: number;
    opt?: IClientPublishOptions;
    ackForType: boolean;
    /** how often the message was handed to tasmota - 0 = not sent yet */
    sent: number;
    /**
     * 'Done' answers received for this message - in the old mode only while waiting for the renderCurrentPage ack,
     * in the display ack mode for every message
     */
    done: number;
};

/** Kind of acknowledgement the display sends with the crc of the processed message */
export type DisplayAckKind = 'ack' | 'renderCurrentPage';

/** How long 'Done' answers of a message sent more than once are expected after its ack (ms) */
const STALE_DONE_WINDOW = 1000;
/** Pause after an ack in the old mode: gives the display time to process the message (ms) */
const DONE_NEXT_DELAY = 250;
/** Pause after an ack of the display: it has processed the message already (ms) */
const DISPLAY_ACK_NEXT_DELAY = 0;
/**
 * Display ack mode: how long to wait for the display ack after Tasmota's 'Done' (ms). Pages without a serial
 * timer (pageIcons, cardLChart2, pageSplash, pageTest) never answer - then the 'Done' is enough.
 */
export const DISPLAY_ACK_TIMEOUT = 500;
/** Berry driver generation that takes a precomputed crc `^XXXX^` in front of the CustomSend payload */
export const BERRY_DRIVER_CRC_PREFIX = 12;

/**
 * Übernimmt das senden von Payloads an die mqtt Klasse - delay zwischen einzelnen Messages
 * 1 * pro Klasse Panel
 */
export class PanelSend extends BaseClass {
    private messageDb: QueuedMessage[] = [];
    /**
     * 'Done' answers still expected for already acknowledged messages (sent more than once).
     * They must not acknowledge the next message - the count only holds until staleDoneUntil.
     */
    private staleDone = 0;
    private staleDoneUntil = 0;
    private messageDbTasmota: { topic: string; payload: string; opt?: IClientPublishOptions }[] = [];

    private messageTimeout: ioBroker.Timeout | undefined;
    private messageTimeoutTasmota: ioBroker.Timeout | true | undefined;
    private channel: PanelChannel;
    private topic: string = '';
    private configTopic: string = '';
    private losingMessageCount = 0;
    /** Display ack mode: waits for the display ack after the 'Done' of the head of the queue */
    private doneFallback: ioBroker.Timeout | undefined;
    /**
     * The display acknowledges every processed message with `event,ack,<crc>` and a page change with
     * `event,renderCurrentPage,<crc>` (TFT 6.1.0+). Set by the first renderCurrentPage with a crc, reset by a
     * restart of the display.
     */
    private _displayAck = false;

    private _losingDelay = 1000;
    panel: Panel | undefined = undefined;

    get displayAck(): boolean {
        return this._displayAck;
    }
    set displayAck(v: boolean) {
        if (v !== this._displayAck) {
            this.log.debug(`Display ack mode ${v ? 'on' : 'off'}`);
        }
        this._displayAck = v;
        if (!v) {
            this.clearDoneFallback();
        }
    }

    get losingDelay(): number {
        return this._losingDelay;
    }
    set losingDelay(v: number) {
        this._losingDelay = Math.max(1000, Math.min(30_000, v));
    }
    constructor(
        adapter: AdapterClassDefinition,
        config: { name: string; channel: PanelChannel; topic: string; panel: Panel },
    ) {
        super(adapter, config.name);
        this.channel = config.channel;
        void this.channel.subscribe(`${config.topic}/stat/RESULT`, this.onMessage);
        this.configTopic = config.topic;
        this.topic = config.topic + SendTopicAppendix;
        this.panel = config.panel;
    }

    public resetMessageDB(): void {
        this.messageDb = [];
        if (this.messageTimeout) {
            this.adapter.clearTimeout(this.messageTimeout);
        }
        this.messageTimeout = undefined;
        this.clearDoneFallback();
        this.losingMessageCount = 0;
        this._losingDelay = 1000;
        this.staleDone = 0;
    }

    private clearDoneFallback(): void {
        if (this.doneFallback) {
            this.adapter.clearTimeout(this.doneFallback);
        }
        this.doneFallback = undefined;
    }

    /**
     * Acknowledgement from the display with the crc of the message it processed (TFT 6.1.0+).
     * A `renderCurrentPage` with a crc switches to the display ack mode. Only an ack with the crc of the
     * head of the queue counts: `renderCurrentPage` for a pageType, `ack` for every other message.
     *
     * @param kind `ack` or `renderCurrentPage`
     * @param crc the crc the display sent
     */
    public onDisplayAck(kind: DisplayAckKind, crc: number): void {
        if (this.unload || this.adapter.unload) {
            return;
        }
        if (kind === 'renderCurrentPage') {
            this.displayAck = true;
        } else if (!this.displayAck) {
            if (this.adapter.config.debugLogMqtt) {
                this.log.debug(`Ignore display ack ${crc} - display ack mode is off`);
            }
            return;
        }
        const head = this.messageDb[0];
        if (!head || head.sent === 0 || head.ackForType !== (kind === 'renderCurrentPage') || head.crc !== crc) {
            if (this.adapter.config.debugLogMqtt) {
                this.log.debug(
                    `Ignore display ${kind} ${crc} - ${head ? `head ${JSON.stringify(head)}` : 'queue is empty'}`,
                );
            }
            return;
        }
        this.acknowledgeHead(DISPLAY_ACK_NEXT_DELAY);
    }

    /**
     * The head of the queue reached its goal: remove it and send the next message after `delay`.
     *
     * @param delay pause before the next message (ms)
     */
    private acknowledgeHead(delay: number): void {
        if (this.messageTimeout) {
            this.adapter.clearTimeout(this.messageTimeout);
        }
        this.clearDoneFallback();
        this.losingMessageCount = 0;
        this._losingDelay = 1000;
        const oldMessage = this.messageDb.shift();
        if (oldMessage) {
            // every transmission is answered with 'Done' - the ones still on their way belong to this message
            const expected = oldMessage.sent - (this.displayAck || oldMessage.ackForType ? oldMessage.done : 1);
            if (expected > 0) {
                this.staleDone = expected;
                this.staleDoneUntil = Date.now() + STALE_DONE_WINDOW;
            } else {
                this.staleDone = 0;
            }
            if (oldMessage.payload === 'pageType~pageStartup') {
                this.messageDb = [];
            }
            if (this.adapter.config.debugLogMqtt) {
                this.log.debug(`Receive ack for ${JSON.stringify(oldMessage)}`);
            }
        }
        if (this.unload || this.adapter.unload) {
            this.messageTimeout = undefined;
            return;
        }
        this.messageTimeout = this.adapter.setTimeout(this.sendMessageLoop, delay);
    }

    /**
     * Display ack mode: Tasmota's 'Done' only tells that the bytes went to the display. Without a display ack
     * within {@link DISPLAY_ACK_TIMEOUT} the message counts as done anyway.
     *
     * @param head the head of the queue the 'Done' belongs to
     */
    private onDoneInDisplayAckMode(head: QueuedMessage | undefined): void {
        if (!head || head.sent === 0) {
            if (this.adapter.config.debugLogMqtt) {
                this.log.debug(`Ignore 'Done' - ${head ? `${JSON.stringify(head)} not sent yet` : 'queue is empty'}`);
            }
            return;
        }
        head.done++;
        // a pageType is only acknowledged by its renderCurrentPage
        if (head.ackForType || this.doneFallback) {
            return;
        }
        if (this.unload || this.adapter.unload) {
            return;
        }
        this.doneFallback = this.adapter.setTimeout(() => {
            this.doneFallback = undefined;
            if (this.messageDb[0] !== head) {
                return;
            }
            if (this.adapter.config.debugLogMqtt) {
                this.log.debug(`No display ack for ${JSON.stringify(head)} - 'Done' counts`);
            }
            this.acknowledgeHead(0);
        }, DISPLAY_ACK_TIMEOUT);
    }
    onMessage: callbackMessageType = async (topic: string, message: string) => {
        if (this.unload || this.adapter.unload) {
            return;
        }
        if (!topic.endsWith('/stat/RESULT')) {
            return;
        }
        if (this.adapter.config.debugLogMqtt) {
            this.log.debug(`Receive command ${topic} with ${message}`);
        }
        try {
            const msg = JSON.parse(message);
            const head = this.messageDb[0];
            const ackForType = head && head.ackForType;
            if (msg) {
                if (msg.CustomSend === 'Done' && this.staleDone > 0) {
                    // answer to an earlier transmission of an already acknowledged message
                    const stale = Date.now() <= this.staleDoneUntil;
                    this.staleDone = stale ? this.staleDone - 1 : 0;
                    if (stale) {
                        if (this.adapter.config.debugLogMqtt) {
                            this.log.debug(`Ignore late 'Done' of an already acknowledged message`);
                        }
                        return;
                    }
                }
                if (this.displayAck) {
                    if (msg.CustomSend === 'Done') {
                        this.onDoneInDisplayAckMode(head);
                    }
                    return;
                }
                if (
                    (ackForType && msg.CustomSend === 'renderCurrentPage') ||
                    (!ackForType && msg.CustomSend === 'Done')
                ) {
                    // a duplicate ack (mqtt qos 1, overlapping subscriptions) must not acknowledge
                    // the next message before it has even been sent - it would be lost silently
                    if (!head || head.sent === 0) {
                        if (this.adapter.config.debugLogMqtt) {
                            this.log.debug(
                                `Ignore '${msg.CustomSend}' - ${head ? `${JSON.stringify(head)} not sent yet` : 'queue is empty'}`,
                            );
                        }
                        return;
                    }
                    // Give the Nextion time to render the previous frame before the next one hits its 1024-byte buffer
                    this.acknowledgeHead(DONE_NEXT_DELAY);
                } else {
                    if (ackForType && head.sent > 0 && msg.CustomSend === 'Done') {
                        head.done++;
                    }
                    if (this.adapter.config.additionalLog) {
                        this.log.info(
                            `1: ${!(ackForType && msg.CustomSend === 'renderCurrentPage')} 2: ${!(!ackForType && msg.CustomSend === 'Done')} msg: ${msg.CustomSend}`,
                        );
                    }
                }
            }
        } catch (err: any) {
            this.log.error(`onMessage: ${err}`);
        }
    };

    readonly addMessage = (
        payload: string,
        ackForType: boolean,
        force?: boolean,
        opt?: IClientPublishOptions,
    ): void => {
        this.warnIfTooLong(payload);
        // a pageType clears the page on the panel - only messages queued after the last pageType are real
        // duplicates, otherwise a resent pageType~X would be left without its content (black page)
        const lastPageType = this.messageDb.findLastIndex(a => a.payload.startsWith('pageType~'));
        if (
            this.messageTimeout !== undefined &&
            this.messageDb.length > 0 &&
            this.messageDb.slice(lastPageType + 1).some(a => a.payload === payload && a.opt === opt)
        ) {
            if (this.adapter.config.debugLogMqtt) {
                this.log.debug(`Message ${payload} is already in queue - skip adding`);
            }
            return;
        }
        if (!this.panel?.isOnline && force !== true) {
            if (this.adapter.config.debugLogMqtt) {
                this.log.debug(`Panel is offline - skip adding message ${payload}`);
            }
            return;
        }
        if (force === true) {
            this.resetMessageDB();
        }
        const replaced = this.findReplaceable(payload, ackForType, opt, lastPageType);
        if (replaced) {
            replaced.payload = payload;
            replaced.crc = panelFrameCrc(payload);
            return;
        }
        this.messageDb.push({
            payload: payload,
            crc: panelFrameCrc(payload),
            opt: opt,
            ackForType: ackForType,
            sent: 0,
            done: 0,
        });
        if (this.messageTimeout === undefined) {
            void this.sendMessageLoop();
        }
    };

    /**
     * The panel only needs the newest state of a page or of a popup: a new `entityUpd` takes the place of an older one
     * that was not sent yet, `entityUpdateDetail` per item id. Nothing moves in the queue. A message that was sent waits
     * for its ack and stays as it is, so ack and retry only ever see what was really sent. A pageType ends the page.
     *
     * @param payload the new message
     * @param ackForType kind of ack of the new message
     * @param opt options of the new message
     * @param lastPageType index of the last pageType in the queue
     * @returns the queued message to overwrite
     */
    private findReplaceable(
        payload: string,
        ackForType: boolean,
        opt: IClientPublishOptions | undefined,
        lastPageType: number,
    ): QueuedMessage | undefined {
        const fields = payload.split('~', 2);
        const isPage = fields[0] === 'entityUpd';
        const isDetail = fields[0] === 'entityUpdateDetail';
        if (!isPage && !isDetail) {
            return undefined;
        }
        for (let i = this.messageDb.length - 1; i > lastPageType; i--) {
            const queued = this.messageDb[i];
            const other = queued.payload.split('~', 2);
            if (
                queued.sent === 0 &&
                queued.ackForType === ackForType &&
                queued.opt === opt &&
                other[0] === fields[0] &&
                (isPage || other[1] === fields[1])
            ) {
                return queued;
            }
        }
        return undefined;
    }

    private readonly sendMessageLoop = async (): Promise<void> => {
        const msg = this.messageDb[0];
        if (this.adapter.config.debugLogMqtt) {
            this.log.debug(
                `sendMessageLoop - messages in queue: ${this.messageDb.length} handling message: ${JSON.stringify(msg)}`,
            );
        }
        if (msg === undefined || this.unload) {
            if (this.adapter.config.debugLogMqtt) {
                this.log.debug(`No message to send or unload - stop send loop`);
            }
            if (this.messageTimeout) {
                this.adapter.clearTimeout(this.messageTimeout);
            }
            this.messageTimeout = undefined;
            return;
        }

        if (this.losingMessageCount > 0 && this.adapter.config.additionalLog && this.panel?.isOnline) {
            this.log.warn(`send payload: ${JSON.stringify(msg)} to panel. Losing count: ${this.losingMessageCount}`);
        }
        if (this.losingMessageCount++ > 5) {
            if (this.panel) {
                if (this.adapter.config.additionalLog && this.panel?.isOnline) {
                    this.log.error(`Losing ${this.losingMessageCount} messages - set panel offline!`);
                }
                this.panel.isOnline = false;
                if (this.panel.isVirtual) {
                    // no Tasmota to ask - the browser simply stopped answering
                    await this.panel.setStatus('offline');
                } else if (this.panel.handleLostMessages()) {
                    await this.panel.setStatus('offline');
                } else if (this.panel.status !== 'flashing') {
                    try {
                        await this.adapter.fetch(`http://${this.panel.info.tasmota.net.IPAddress}/cm?`, undefined, 500);
                    } catch {
                        await this.panel.setStatus('offline');
                        return;
                    }
                    await this.panel.setStatus('error');
                }
            }
        }
        this.losingDelay = this.losingDelay + 2000;

        if (this.unload) {
            return;
        }
        if (!this.adapter.unload) {
            this.messageTimeout = this.adapter.setTimeout(this.sendMessageLoop, this.losingDelay);
        }
        msg.sent++;
        this.addMessageTasmota(this.topic, this.withCrcPrefix(msg), msg.opt);
    };

    /**
     * A Berry driver of generation {@link BERRY_DRIVER_CRC_PREFIX} or newer takes the crc from the adapter:
     * `^XXXX^<payload>`. The emulator counts with its generation (-12 yes, -1 no).
     * A web panel gets the payload as it is.
     *
     * @param msg the queued message
     * @returns what goes to the CustomSend topic
     */
    private withCrcPrefix(msg: QueuedMessage): string {
        const panel = this.panel;
        if (
            !panel ||
            panel.isVirtual ||
            !(driverGeneration(panel.info?.nspanel?.berryDriverVersion) >= BERRY_DRIVER_CRC_PREFIX)
        ) {
            return msg.payload;
        }
        return `${crcPrefix(msg.crc)}${msg.payload}`;
    }

    /**
     * Logs a warning when the payload does not fit into the receive buffer of the display.
     * Only a warning - the message is sent anyway.
     *
     * @param payload the message for the panel
     */
    private warnIfTooLong(payload: string): void {
        if (this.panel?.isVirtual) {
            return;
        }
        const bytes = Buffer.byteLength(payload, 'utf8');
        if (bytes > MAX_PANEL_PAYLOAD_BYTES) {
            this.log.warn(
                `Message to the panel has ${bytes} bytes, the display can receive only ${MAX_PANEL_PAYLOAD_BYTES} bytes: ${payload.slice(0, 60)}...`,
            );
        }
    }

    readonly addMessageTasmota = (topic: string, payload: string, opt?: IClientPublishOptions): void => {
        if (
            this.messageDbTasmota.length > 0 &&
            this.messageDbTasmota.some(a => a.topic === topic && a.payload === payload && a.opt === opt)
        ) {
            if (this.adapter.config.debugLogMqtt) {
                this.log.debug(`Tasmota Message ${payload} is already in queue - skip adding`);
            }
            return;
        }
        if (this.unload || this.adapter.unload) {
            this.messageDbTasmota = [];
        }

        if (this.adapter.config.debugLogMqtt) {
            this.log.debug(`add Tasmota message ${payload} to queue`);
        }
        this.messageDbTasmota.push({ topic: topic, payload: payload, opt: opt });

        if (this.messageTimeoutTasmota === undefined) {
            void this.sendMessageLoopTasmota();
        }
    };
    private readonly sendMessageLoopTasmota = async (): Promise<void> => {
        const msg = this.messageDbTasmota.shift();
        if (msg === undefined) {
            if (this.messageTimeoutTasmota && this.messageTimeoutTasmota !== true) {
                this.adapter.clearTimeout(this.messageTimeoutTasmota);
            }
            this.messageTimeoutTasmota = undefined;
            return;
        }
        //if (this.adapter.config.debugLogMqtt) {
        this.log.debug(`send payload: ${JSON.stringify(msg)} to panel.`);
        //}
        this.messageTimeoutTasmota = true;
        try {
            await this.channel.publish(msg.topic, msg.payload, { ...(msg.opt ?? {}), qos: 1 });
        } catch (e) {
            this.log.warn(`MQTT publish failed: ${(e as Error).message}`);
            // optional: Requeue
            this.messageDbTasmota.unshift(msg);
            this.losingDelay = this.losingDelay + 1000; // sanfter Backoff
        }
        if (this.unload || this.adapter.unload) {
            return;
        }
        this.messageTimeoutTasmota = this.adapter.setTimeout(this.sendMessageLoopTasmota, 10);
    };

    async delete(): Promise<void> {
        await super.delete();
        this.channel.unsubscribe(`${this.configTopic}/stat/RESULT`);
        if (this.messageTimeout) {
            this.adapter.clearTimeout(this.messageTimeout);
        }
        if (this.messageTimeoutTasmota && this.messageTimeoutTasmota !== true) {
            this.adapter.clearTimeout(this.messageTimeoutTasmota);
        }
        this.clearDoneFallback();
        (this as any).onMessage = async () => {};
        this.panel = undefined;
        this.messageDb = [];
        this.messageDbTasmota = [];
    }
}
