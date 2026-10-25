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
 * `http(s)://<host>:<port>/<topic>` - https when the instance serves the web panels with the
 * ioBroker certificates (`webSecure`), otherwise plain http. A new tab is not subject to mixed
 * content rules, so a plain http link also works from an https admin.
 *
 * @param host host name or address of the adapter host
 * @param port `webPort` of the instance, falls back to 8090
 * @param topic topic (or id) of the panel, may contain slashes
 * @param pin `webPin` of the instance; when set it is passed as `?pin=` so the user does not have
 * to type it - the server removes it from the address bar again with a redirect
 * @param secure `webSecure` of the instance - true = https
 */
export function webPanelUrl(host: string, port: unknown, topic: string, pin?: string, secure?: boolean): string {
    const p = Number(port) || WEB_PANEL_DEFAULT_PORT;
    const h = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
    const query = pin ? `?pin=${encodeURIComponent(pin)}` : '';
    return `${secure ? 'https' : 'http'}://${h}:${p}/${encodeURIComponent(topic)}${query}`;
}

/**
 * Opens the web panel of a panel in a new tab.
 *
 * @param host host name or address of the adapter host (see `resolveWebPanelHost`)
 * @param port `webPort` of the instance
 * @param topic topic of the panel
 * @param pin `webPin` of the instance (plain text), empty = none
 * @param secure `webSecure` of the instance - true = https (see `webSecureOf`)
 */
export function openWebPanel(host: string, port: unknown, topic: string, pin?: string, secure?: boolean): void {
    window.open(webPanelUrl(host, port, topic, pin, secure), '_blank', 'noopener');
}

/**
 * `webSecure` of the instance: does the web panel server speak https?
 *
 * @param data `props.data` of the config component
 * @returns true only when the flag is set
 */
export function webSecureOf(data: unknown): boolean {
    if (typeof data !== 'object' || data === null || !('webSecure' in data)) {
        return false;
    }
    return (data as Record<string, unknown>).webSecure === true;
}

/**
 * `webPin` of the instance in plain text for the links of the admin pages.
 *
 * Inside the instance configuration `props.data` holds the decrypted value. A still encrypted
 * value (`$/aes-192-cbc:…`, as it is stored in `encryptedNative`) is useless for the URL and is
 * treated as "no PIN" - the user then gets the PIN page of the web panel once per browser.
 *
 * @param data `props.data` of the config component
 * @returns the PIN, empty when none is set or usable
 */
export function webPinOf(data: unknown): string {
    const pin = readString(data, 'webPin') ?? '';
    return pin.startsWith('$/') ? '' : pin;
}
