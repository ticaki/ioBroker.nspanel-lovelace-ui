import type { ConfigGenericProps } from '@iobroker/json-config';

/** Port of the web panel server when the instance has no `webPort` */
export const WEB_PANEL_DEFAULT_PORT = 8090;

type Socket = ConfigGenericProps['oContext']['socket'];

/** What the admin pages need to build the links to the web panels of an instance */
export interface WebLinkSettings {
    /** host name or address the browser reaches the web panel server on */
    host: string;
    /** `webPort` of the instance */
    port: number;
    /** `webSecure` of the instance - true = https */
    secure: boolean;
    /** `webPin` of the instance in plain text, '' = none (or not available) */
    pin: string;
    /** `webEnabled` of the instance */
    enabled: boolean;
}

function isRecord(obj: unknown): obj is Record<string, unknown> {
    return typeof obj === 'object' && obj !== null;
}

function readString(obj: unknown, key: string): string | undefined {
    if (!isRecord(obj) || !(key in obj)) {
        return undefined;
    }
    const value = obj[key];
    return typeof value === 'string' ? value : undefined;
}

function readStringArray(obj: unknown, key: string): string[] {
    if (!isRecord(obj) || !(key in obj)) {
        return [];
    }
    const value = obj[key];
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function isUsableAddress(address: string): boolean {
    return address !== '' && address !== '127.0.0.1' && address !== '::1' && address !== 'localhost';
}

/**
 * Is the host a DNS name (no IPv4, no IPv6, not localhost)? Only such a name can carry a
 * certificate and be a WebAuthn relying party.
 *
 * @param host host part of a URL (`window.location.hostname`, IPv6 may come with brackets)
 */
export function isDnsName(host: string): boolean {
    const h = host.trim().toLowerCase();
    if (h === '' || h === 'localhost' || h.endsWith('.localhost')) {
        return false;
    }
    if (h.includes(':') || h.startsWith('[')) {
        return false;
    }
    return !/^\d{1,3}(\.\d{1,3}){3}$/.test(h);
}

/**
 * `webHost` of the instance, trimmed; '' when not set.
 *
 * @param data `props.data` of the config component or `native` of the instance object
 */
export function webHostOf(data: unknown): string {
    return (readString(data, 'webHost') ?? '').trim();
}

/** `window.location.port` as a number, the default port of the protocol when empty */
function adminPagePort(): number {
    const port = Number(window.location.port);
    if (port > 0) {
        return port;
    }
    return window.location.protocol === 'https:' ? 443 : 80;
}

/**
 * Does the admin that serves this page run on the ioBroker host `host`? Looked up via the admin
 * instances: the one listening on the port of the page (`native.port`) tells its `common.host`.
 *
 * @param socket admin socket
 * @param host `common.host` of the nspanel instance
 * @returns true when an admin instance on that host serves the port of the page; false when none
 * matches or the lookup fails
 */
async function adminRunsOnHost(socket: Socket, host: string): Promise<boolean> {
    try {
        const admins = await socket.getObjectViewSystem('instance', 'system.adapter.admin.', 'system.adapter.admin.香');
        const port = adminPagePort();
        for (const obj of Object.values(admins)) {
            // several hosts may run an admin on the same port - any of them on `host` counts
            if (Number(readPort(obj?.native)) === port && readString(obj.common, 'host') === host) {
                return true;
            }
        }
    } catch {
        // no view, no permission - the address lookup below decides
    }
    return false;
}

function readPort(native: unknown): unknown {
    return isRecord(native) ? native.port : undefined;
}

/**
 * The host a browser reaches the web panel server of the instance on.
 *
 * 1. `webHost` of the instance (when the user typed one) wins - with HTTPS/FIDO2 it is the name
 *    of the certificate.
 * 2. The admin page is opened under a DNS name and the admin that serves it runs on the same
 *    ioBroker host as the instance: that name is kept, it resolves for the user and matches the
 *    certificate of the host.
 * 3. The host of the instance is read and its addresses looked up. When the admin page already
 *    addresses that host (same name or address), its hostname is kept, otherwise the first
 *    usable IPv4 of the host is taken.
 *
 * @param socket admin socket
 * @param adapterName adapter name
 * @param instance instance number
 * @param data `props.data` of the config component when it holds the instance configuration
 * (unsaved `webHost` applies at once); the `native` of the instance object is read otherwise
 * @returns host name or address, the hostname of the admin page as fallback
 */
export async function resolveWebPanelHost(
    socket: Socket,
    adapterName: string,
    instance: string | number,
    data?: unknown,
): Promise<string> {
    const fallback = window.location.hostname;
    const typed = webHostOf(data);
    if (typed) {
        return typed;
    }
    try {
        const instanceObj = await socket.getObject(`system.adapter.${adapterName}.${instance}`);
        if (!isRecord(data) || !('webHost' in data)) {
            const configured = webHostOf(instanceObj?.native);
            if (configured) {
                return configured;
            }
        }
        const host = readString(instanceObj?.common, 'host');
        if (!host) {
            return fallback;
        }
        if (host === fallback) {
            return fallback;
        }
        if (isDnsName(fallback) && (await adminRunsOnHost(socket, host))) {
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

/** Link settings before anything is loaded: hostname of the admin page, port 8090, http, no PIN */
export function defaultWebLinkSettings(): WebLinkSettings {
    return { host: window.location.hostname, port: WEB_PANEL_DEFAULT_PORT, secure: false, pin: '', enabled: true };
}

/**
 * Port, https flag, PIN and `webEnabled` of the web panel server from `data` - `props.data` of
 * the instance configuration (the PIN is decrypted there) or `native` of the instance object (the
 * PIN is still encrypted there and yields ''). Keys that are missing in `data` keep the values of
 * `base`.
 *
 * @param data `props.data` or `native`
 * @param base settings to fall back to for keys missing in `data`
 * @returns settings for the links; `host` is taken from `data.webHost` when set, else from `base`
 */
export function webLinkSettingsOf(data: unknown, base: WebLinkSettings): WebLinkSettings {
    const d = isRecord(data) ? data : {};
    const port = 'webPort' in d ? Number(d.webPort) || WEB_PANEL_DEFAULT_PORT : base.port;
    const secure = 'webSecure' in d ? d.webSecure === true : base.secure;
    const pin = 'webPin' in d ? webPinOf(d) : base.pin;
    const enabled = 'webEnabled' in d ? d.webEnabled !== false : base.enabled;
    return { host: webHostOf(d) || base.host, port, secure, pin, enabled };
}

/**
 * Settings for the links to the web panels of an instance.
 *
 * Inside the instance configuration `props.data` holds the configuration (PIN decrypted). The
 * admin tab (`jsonTab.json5`) gets no configuration in `props.data`, so the `native` of the
 * instance object is read instead - there the PIN is encrypted and the user gets the PIN page of
 * the web panel once per browser. The host comes from `resolveWebPanelHost`.
 *
 * @param socket admin socket
 * @param adapterName adapter name
 * @param instance instance number
 * @param data `props.data` of the config component
 */
export async function loadWebLinkSettings(
    socket: Socket,
    adapterName: string,
    instance: string | number,
    data: unknown,
): Promise<WebLinkSettings> {
    const defaults = defaultWebLinkSettings();
    let native: unknown;
    if (!isRecord(data) || !('webPort' in data)) {
        try {
            const instanceObj = await socket.getObject(`system.adapter.${adapterName}.${instance}`);
            native = instanceObj?.native;
        } catch {
            native = undefined;
        }
    }
    const host = await resolveWebPanelHost(socket, adapterName, instance, data);
    const settings = webLinkSettingsOf(native, defaults);
    return { ...webLinkSettingsOf(data, settings), host };
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
 * @param settings link settings of the instance (see `loadWebLinkSettings`)
 * @param topic topic of the panel
 */
export function openWebPanel(settings: WebLinkSettings, topic: string): void {
    window.open(webPanelUrl(settings.host, settings.port, topic, settings.pin, settings.secure), '_blank', 'noopener');
}

/**
 * `webSecure` of the instance: does the web panel server speak https?
 *
 * @param data `props.data` of the config component
 * @returns true only when the flag is set
 */
export function webSecureOf(data: unknown): boolean {
    return isRecord(data) && data.webSecure === true;
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
    if (!isRecord(data)) {
        return '';
    }
    // a PIN typed as digits may arrive as a number
    const raw = data.webPin;
    const pin = typeof raw === 'number' ? String(raw) : typeof raw === 'string' ? raw.trim() : '';
    return pin.startsWith('$/') ? '' : pin;
}
