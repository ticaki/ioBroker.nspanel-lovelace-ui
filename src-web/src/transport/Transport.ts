import type { ConnectionStatus, HelloFrame } from '../protocol/types';

/**
 * The connection of the virtual display to the adapter. The websocket implementation is
 * the first one, later variants (token, ioBroker socket) implement the same interface.
 */
export interface PanelTransport {
    connect(): void;
    disconnect(): void;
    onHello(cb: (hello: HelloFrame) => void): void;
    onCommand(cb: (payload: string) => void): void;
    onBuzzer(cb: (payload: string) => void): void;
    onStatus(cb: (status: ConnectionStatus) => void): void;
    /**
     * the server ended the session for good (`unknown panel`, `no free slot`, `replaced`,
     * `panel removed`, `shutdown`) - no automatic reconnect afterwards
     */
    onBye(cb: (reason: string) => void): void;
    /** acknowledges the last command (`Done`) */
    ack(): void;
    /** sends a display event (`event,…`) */
    recv(payload: string): void;
}
