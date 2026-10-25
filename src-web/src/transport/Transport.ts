import type { ConnectionStatus, HelloFrame } from '../protocol/types';

/**
 * The connection of the virtual display to the adapter. The websocket implementation is
 * the first one, later variants (token, ioBroker socket) implement the same interface.
 */
export interface PanelTransport {
    connect(): void;
    disconnect(): void;
    onHello(cb: (hello: HelloFrame) => void): void;
    /**
     * a `cmd` frame: the CustomSend payload and its running number `seq`, which the
     * display hands back in `ack(seq)` once the frame is processed (`seq` is undefined
     * only with an outdated backend that numbers nothing)
     */
    onCommand(cb: (payload: string, seq: number | undefined) => void): void;
    onBuzzer(cb: (payload: string) => void): void;
    onStatus(cb: (status: ConnectionStatus) => void): void;
    /**
     * the server ended the connection: `unknown panel` and `panel removed` are final (no
     * automatic reconnect, the page has to be reloaded), `shutdown` means the adapter
     * restarts and the transport reconnects on its own with the usual backoff
     */
    onBye(cb: (reason: string) => void): void;
    /** acknowledges the command with this `seq` (`Done`) */
    ack(seq: number | undefined): void;
    /** sends a display event (`event,…`) */
    recv(payload: string): void;
}
