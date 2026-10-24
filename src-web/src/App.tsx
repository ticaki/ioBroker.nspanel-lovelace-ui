import React from 'react';
import { Buzzer } from './audio/buzzer';
import { registry } from './cards/registry';
import { DeviceFrame } from './components/DeviceFrame';
import { loadIconPaths } from './icons/iconData';
import { hardwareButtonEvent } from './protocol/commands';
import type { ConnectionStatus, HelloFrame, PanelModel } from './protocol/types';
import { isPanelModel } from './protocol/types';
import { PanelStore, type StoreSnapshot } from './store/PanelStore';
import type { PanelTransport } from './transport/Transport';
import { WsTransport } from './transport/WsTransport';

export interface MockPanel {
    /** feeds one raw CustomSend payload into the store */
    dispatch: (raw: string) => void;
    /** every event / ack the frontend sent, in order (`ack` or `event,…`) */
    sent: string[];
    hello: HelloFrame;
}

declare global {
    interface Window {
        __panel?: MockPanel;
    }
}

export interface AppProps {
    /** topic or id of the panel, from the url */
    topic: string;
    /** `?mock=1`: no websocket, `window.__panel` drives the store (tests, screenshots) */
    mock?: boolean;
    /** overrides for the mock hello */
    mockModel?: PanelModel;
}

interface AppState {
    status: ConnectionStatus;
    /** reason of the `bye` frame that ended the session, undefined while it is alive */
    byeReason: string | undefined;
    hello: HelloFrame | undefined;
    snapshot: StoreSnapshot;
    iconsLoaded: boolean;
}

/** Transport of the mock mode: records everything, delivers nothing */
class MockTransport implements PanelTransport {
    readonly sent: string[] = [];
    private statusCb: ((status: ConnectionStatus) => void) | undefined;
    connect(): void {
        this.statusCb?.('open');
    }
    disconnect(): void {}
    onHello(): void {}
    onCommand(): void {}
    onBuzzer(): void {}
    onStatus(cb: (status: ConnectionStatus) => void): void {
        this.statusCb = cb;
    }
    onBye(): void {}
    ack(): void {
        this.sent.push('ack');
    }
    recv(payload: string): void {
        this.sent.push(payload);
    }
}

/**
 * The topic (or id) of the panel is the whole path: Tasmota topics may contain slashes
 * (`nspanel/ns_panel6`), so `/nspanel/ns_panel6` and `/nspanel%2Fns_panel6` both work.
 *
 * @param location the page location
 */
export function topicFromLocation(location: Location = window.location): string {
    const path = location.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
    try {
        return decodeURIComponent(path);
    } catch {
        return path;
    }
}

export function mockFromLocation(location: Location = window.location): boolean {
    const mock = new URLSearchParams(location.search).get('mock');
    return mock !== null && mock !== '0' && mock !== 'false';
}

/** `?model=us-p` - model of the mock hello, `eu` by default */
export function mockModelFromLocation(location: Location = window.location): PanelModel {
    const model = new URLSearchParams(location.search).get('model');
    return isPanelModel(model) ? model : 'eu';
}

export class App extends React.Component<AppProps, AppState> {
    private readonly transport: PanelTransport;
    private readonly store: PanelStore;
    private readonly buzzer = new Buzzer();
    private unsubscribe: (() => void) | undefined;

    constructor(props: AppProps) {
        super(props);
        const transport = props.mock ? new MockTransport() : new WsTransport(props.topic);
        this.transport = transport;
        this.store = new PanelStore({
            registry,
            recv: payload => this.transport.recv(payload),
            ack: () => this.transport.ack(),
            log: message => console.debug(`[panel] ${message}`),
        });
        this.state = {
            status: 'connecting',
            byeReason: undefined,
            hello: undefined,
            snapshot: this.store.getSnapshot(),
            iconsLoaded: false,
        };
        if (props.mock && transport instanceof MockTransport) {
            const hello: HelloFrame = {
                t: 'hello',
                session: 'mock',
                model: props.mockModel ?? 'eu',
                topic: props.topic,
                name: 'mock',
                friendlyName: 'Mock panel',
                tftVersion: '5.1.1',
            };
            window.__panel = {
                dispatch: (raw: string): void => this.store.dispatch(raw),
                sent: transport.sent,
                hello,
            };
            this.onHello(hello);
        }
    }

    componentDidMount(): void {
        this.unsubscribe = this.store.subscribe(() => this.setState({ snapshot: this.store.getSnapshot() }));
        this.transport.onStatus(status => this.setState({ status }));
        this.transport.onHello(hello => this.onHello(hello));
        this.transport.onBye(reason => this.setState({ byeReason: reason }));
        this.transport.onCommand(payload => this.store.dispatch(payload));
        this.transport.onBuzzer(payload => this.buzzer.play(payload));
        void loadIconPaths().then(() => this.setState({ iconsLoaded: true }));
        this.transport.connect();
    }

    componentWillUnmount(): void {
        this.unsubscribe?.();
        this.transport.disconnect();
        this.store.destroy();
    }

    private onHello(hello: HelloFrame): void {
        const model = isPanelModel(hello.model) ? hello.model : 'eu';
        // resets to the startup page and sends the startup event (tftVersion may be 1.0.0)
        this.store.reset(model, hello.tftVersion);
        this.setState({ hello, byeReason: undefined, snapshot: this.store.getSnapshot() });
    }

    private readonly onTouch = (): void => {
        // audio is only allowed after a user gesture
        this.buzzer.enable();
        this.store.touch();
    };

    private readonly onHardwareButton = (button: 1 | 2): void => {
        this.buzzer.enable();
        this.store.send(hardwareButtonEvent(button));
    };

    private renderPage(): React.ReactNode {
        const { page, global } = this.state.snapshot;
        if (!page.module) {
            return (
                <div style={{ position: 'absolute', inset: 0, padding: 16, color: '#ff8a65', fontSize: 16 }}>
                    unknown pageType: {page.pageType}
                </div>
            );
        }
        const Component = page.module.Component;
        return (
            <Component
                key={page.pageType}
                model={page.model}
                ctx={{ pageType: page.pageType, pageArgs: page.pageArgs }}
                global={global}
                send={this.store.send}
                press={this.store.press}
                openPopup={this.store.openPopup}
            />
        );
    }

    render(): React.JSX.Element {
        const { snapshot, status, byeReason } = this.state;
        return (
            <DeviceFrame
                model={snapshot.global.model}
                brightness={this.store.brightness}
                status={status}
                byeReason={byeReason}
                onTouch={this.onTouch}
                onHardwareButton={this.onHardwareButton}
            >
                {this.state.iconsLoaded ? this.renderPage() : null}
            </DeviceFrame>
        );
    }
}
