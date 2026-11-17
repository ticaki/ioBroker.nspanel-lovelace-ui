/**
 * Building blocks for installing the Berry driver (`autoexec.be`) on a Tasmota device.
 *
 * The install runs in two steps so the last working driver never gets lost:
 *
 * 1. `getBerryDownloadCommand`: the current `autoexec.be` is renamed to `autoexec.bak`, then the new
 *    driver is downloaded. `autoexec.old` stays untouched.
 * 2. After the result of `UrlFetch`:
 *    - success (`getBerryCommitCommand`): `autoexec.bak` becomes `autoexec.old` (previous version),
 *    - failure (`getBerryRestoreCommand`): a partial `autoexec.be` is deleted and `autoexec.bak`
 *      becomes `autoexec.be` again.
 *
 * On a first install there is no `autoexec.be`/`autoexec.bak` - the renames then answer `Failed`,
 * Tasmota continues with the next command of the backlog. Only the `UrlFetch` answer decides
 * between success and failure.
 */

/** Login for the Tasmota web interface, only used with `useTasmotaAdmin`. */
export interface TasmotaLogin {
    /** true: send `user=admin&password=...` */
    useAdmin: boolean;
    /** password of the Tasmota web interface */
    password: string;
}

/** Name of the driver file on the device. */
export const BERRY_DRIVER_FILE = 'autoexec.be';
/** Temporary backup of the running driver during a download. */
export const BERRY_BACKUP_FILE = 'autoexec.bak';
/** Previous driver version after a successful install. */
export const BERRY_OLD_FILE = 'autoexec.old';

/**
 * Backlog for step 1: backup the running driver, download the new one.
 *
 * @param berryUrl base url of the driver downloads (`config.berryUrl`)
 * @param version driver version, becomes the folder of the download url
 * @returns the Tasmota command (not url encoded)
 */
export function getBerryDownloadCommand(berryUrl: string, version: string): string {
    return (
        `Backlog UfsDelete ${BERRY_BACKUP_FILE}; ` +
        `UfsRename ${BERRY_DRIVER_FILE},${BERRY_BACKUP_FILE}; ` +
        `UrlFetch ${berryUrl}/${version}/${BERRY_DRIVER_FILE}`
    );
}

/**
 * Backlog after a confirmed download: the backup becomes the previous version.
 *
 * The restart is part of the backlog: a separate `Restart 1` would run before the queued backlog
 * commands and the rename would never happen.
 *
 * @param restart true: restart Tasmota after the rename so the new driver runs
 * @returns the Tasmota command (not url encoded)
 */
export function getBerryCommitCommand(restart: boolean): string {
    const restartCommand = restart ? '; Restart 1' : '';
    return `Backlog UfsDelete ${BERRY_OLD_FILE}; UfsRename ${BERRY_BACKUP_FILE},${BERRY_OLD_FILE}${restartCommand}`;
}

/**
 * Backlog after a failed or unconfirmed download: remove a partial file, restore the backup.
 *
 * @returns the Tasmota command (not url encoded)
 */
export function getBerryRestoreCommand(): string {
    return `Backlog UfsDelete ${BERRY_DRIVER_FILE}; UfsRename ${BERRY_BACKUP_FILE},${BERRY_DRIVER_FILE}`;
}

/**
 * Builds the http url for a Tasmota command (`/cm`), the command and password are url encoded.
 *
 * @param tasmotaIP ip or host name of the device
 * @param command Tasmota command
 * @param login login of the Tasmota web interface
 * @returns the url
 */
export function getTasmotaCommandUrl(tasmotaIP: string, command: string, login: TasmotaLogin): string {
    const auth = login.useAdmin ? `user=admin&password=${encodeURIComponent(login.password)}` : '';
    return `http://${tasmotaIP}/cm?${auth}&cmnd=${encodeURIComponent(command)}`;
}

/** Result of a `UrlFetch` answer on `stat/RESULT`. */
export type UrlFetchResult = 'done' | 'failed' | 'none';

/**
 * Evaluates a `stat/RESULT` payload of Tasmota for the `UrlFetch` result.
 *
 * @param message raw mqtt payload
 * @returns `done` for `{"UrlFetch":"Done"}`, `failed` for any other UrlFetch value, `none` if the
 *   message is no UrlFetch answer (other backlog commands, invalid json)
 */
export function parseUrlFetchResult(message: string): UrlFetchResult {
    let payload: unknown;
    try {
        payload = JSON.parse(message);
    } catch {
        return 'none';
    }
    if (typeof payload !== 'object' || payload === null || !('UrlFetch' in payload)) {
        return 'none';
    }
    return payload.UrlFetch === 'Done' ? 'done' : 'failed';
}

/**
 * Legacy backlog for an install without confirmation (no topic known): the running driver
 * becomes `autoexec.old`, then the download. Without the `UrlFetch` answer neither the commit nor
 * the restore step can follow, so a `autoexec.bak` would stay on the device - this keeps the old
 * file layout instead.
 *
 * @param berryUrl base url of the driver downloads (`config.berryUrl`)
 * @param version driver version, becomes the folder of the download url
 * @returns the Tasmota command (not url encoded)
 */
export function getBerryLegacyInstallCommand(berryUrl: string, version: string): string {
    return (
        `Backlog UfsDelete ${BERRY_OLD_FILE}; ` +
        `UfsRename ${BERRY_DRIVER_FILE},${BERRY_OLD_FILE}; ` +
        `UrlFetch ${berryUrl}/${version}/${BERRY_DRIVER_FILE}`
    );
}

/** The fields of an admin panel entry needed to find the topic of a Tasmota device. */
export interface BerryInstallPanelEntry {
    /** mqtt topic of the panel */
    topic: string;
    /** ip of the Tasmota device */
    ip: string;
    /** missing = 'tasmota' */
    kind?: 'tasmota' | 'web';
}

/**
 * Topic for the install confirmation: the topic of the request, otherwise the topic of the
 * Tasmota panel (not web panels) with this ip from the admin panel table.
 *
 * @param requestTopic topic from the sendTo message, if any
 * @param tasmotaIP ip of the device
 * @param panels admin panel table (`config.panels`)
 * @returns the topic or undefined when none is known
 */
export function findBerryInstallTopic(
    requestTopic: unknown,
    tasmotaIP: string,
    panels: readonly BerryInstallPanelEntry[] | undefined,
): string | undefined {
    if (typeof requestTopic === 'string' && requestTopic) {
        return requestTopic;
    }
    const panel = (panels ?? []).find(p => p && p.kind !== 'web' && p.ip === tasmotaIP && !!p.topic);
    return panel?.topic;
}
