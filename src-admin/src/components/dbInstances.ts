/**
 * Shared helpers of the editors that read from a history/sql/influxdb instance (PageChartEditor,
 * PagePChartEditor): the instance list in the stored short form and the alive state of the adapter.
 * Pure functions only - the components keep their state and subscriptions themselves.
 */
import { ADAPTER_NAME } from '../../../src/lib/types/adminShareConfig';

export type DbInstance = { id: string; name: string };

/** adapters that answer `getHistory` */
export const DB_ADAPTERS: readonly string[] = ['influxdb', 'history', 'sql'];

/**
 * `system.adapter.influxdb.0` → `influxdb.0` (the stored form, same as the classic table)
 *
 * @param id full or short instance id
 */
export function shortInstanceId(id: string | undefined): string {
    return (id ?? '').replace(/^system\.adapter\./, '');
}

/**
 * Enabled history/sql/influxdb instances, sorted, with the short form as name. Throws what the socket throws.
 *
 * @param socket admin socket
 */
export async function loadDbInstances(socket: any): Promise<DbInstance[]> {
    const objects = await socket.getObjectViewSystem('instance', 'system.adapter.', 'system.adapter.香');
    const dbInstances: DbInstance[] = [];
    for (const id of Object.keys(objects)) {
        const obj = objects[id];
        if (!obj || obj.type !== 'instance' || !obj.common?.enabled) {
            continue;
        }
        const name = shortInstanceId(id);
        if (DB_ADAPTERS.some(adapter => name.startsWith(`${adapter}.`))) {
            dbInstances.push({ id, name });
        }
    }
    dbInstances.sort((a, b) => a.name.localeCompare(b.name));
    return dbInstances;
}

/**
 * Whether a state is logged by a DB instance: `common.custom['influxdb.0'].enabled`. Without an instance:
 * any enabled logging of a DB adapter.
 *
 * @param instance short instance id (`influxdb.0`) or ''
 * @param obj object from the browser or the object cache
 */
export function isLoggedByInstance(instance: string, obj: ioBroker.Object | null | undefined): boolean {
    if (!obj || obj.type !== 'state') {
        return false;
    }
    const custom = obj.common?.custom as Record<string, { enabled?: boolean } | undefined> | undefined;
    if (!custom) {
        return false;
    }
    if (instance) {
        return !!custom[instance]?.enabled;
    }
    return Object.keys(custom).some(key => DB_ADAPTERS.includes(key.split('.')[0]) && !!custom[key]?.enabled);
}

/**
 * DB source: only states with logging enabled for the chosen instance (filter of the state picker).
 *
 * @param instance short instance id (`influxdb.0`) or ''
 */
export function loggedByInstance(instance: string): (obj: ioBroker.Object) => boolean {
    return (obj: ioBroker.Object): boolean => isLoggedByInstance(instance, obj);
}

/**
 * The alive state of the adapter instance the admin is opened for.
 *
 * @param oContext admin context (instance number)
 */
export function adapterAliveStateId(oContext: { instance?: string | number } | undefined): string {
    return `system.adapter.${ADAPTER_NAME}.${oContext?.instance ?? '0'}.alive`;
}
