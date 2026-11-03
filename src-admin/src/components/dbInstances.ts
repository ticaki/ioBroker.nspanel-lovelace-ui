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
 * The alive state of the adapter instance the admin is opened for.
 *
 * @param oContext admin context (instance number)
 */
export function adapterAliveStateId(oContext: { instance?: string | number } | undefined): string {
    return `system.adapter.${ADAPTER_NAME}.${oContext?.instance ?? '0'}.alive`;
}
