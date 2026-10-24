import type { ConfigGenericProps } from '@iobroker/json-config';

/** Port of the web panel server when the instance has no `webPort` */
export const WEB_PANEL_DEFAULT_PORT = 8090;

type Socket = ConfigGenericProps['oContext']['socket'];

function readString(obj: unknown, key: string): string | undefined {
    if (typeof obj !== 'object' || obj === null || !(key in obj)) {
        return undefined;
    }
    const value: unknown = (obj as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : undefined;
}

function readStringArray(obj: unknown, key: string): string[] {
    if (typeof obj !== 'object' || obj === null || !(key in obj)) {
        return [];
    }
    const value: unknown = (obj as Record<string, unknown>)[key];
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function isUsableAddress(address: string): boolean {
    return address !== '' && address !== '127.0.0.1' && address !== '::1' && address !== 'localhost';
}

/**
 * The host a browser reaches the web panel server of the instance on.
 *
 * The admin page may run on another host than the adapter, so the host of the instance is read
 * and its addresses looked up. When the admin page already addresses that host (same name or
 * address), its hostname is kept - that is what the user typed and what resolves for them.
 *
 * @param socket admin socket
 * @param adapterName adapter name
 * @param instance instance number
 * @returns host name or address, the hostname of the admin page as fallback
 */
export async function resolveWebPanelHost(
    socket: Socket,
    adapterName: string,
    instance: string | number,
): Promise<string> {
    const fallback = window.location.hostname;
    try {
        const instanceObj = await socket.getObject(`system.adapter.${adapterName}.${instance}`);
        const host = readString(instanceObj?.common, 'host');
        if (!host) {
            return fallback;
        }
        if (host === fallback) {
            return fallback;
        }
        const hostObj = await socket.getObject(`system.host.${host}`);
        const addresses = readStringArray(hostObj?.common, 'address');
        if (addresses.includes(fallback)) {
            return fallback;
        }
        const ipv4 = addresses.find(a => isUsableAddress(a) && !a.includes(':'));
        return ipv4 ?? addresses.find(isUsableAddress) ?? fallback;
    } catch {
        return fallback;
    }
}

/**
 * `http://<host>:<port>/<topic>` - always plain http, the web panel server has no TLS. A new tab
 * is not subject to mixed content rules, so this also works from an https admin.
 *
 * @param host host name or address of the adapter host
 * @param port `webPort` of the instance, falls back to 8090
 * @param topic topic (or id) of the panel, may contain slashes
 */
export function webPanelUrl(host: string, port: unknown, topic: string): string {
    const p = Number(port) || WEB_PANEL_DEFAULT_PORT;
    const h = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
    return `http://${h}:${p}/${encodeURIComponent(topic)}`;
}

/**
 * Opens the web panel of a panel in a new tab.
 *
 * @param host host name or address of the adapter host (see `resolveWebPanelHost`)
 * @param port `webPort` of the instance
 * @param topic topic of the panel
 */
export function openWebPanel(host: string, port: unknown, topic: string): void {
    window.open(webPanelUrl(host, port, topic), '_blank', 'noopener');
}
