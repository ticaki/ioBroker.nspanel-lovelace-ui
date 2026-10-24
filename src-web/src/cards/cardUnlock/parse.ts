/**
 * `cardUnlock` is configured as its own card type in the admin, but the adapter runs it
 * as `PageAlarm` with `alarmType: 'unlock'` and sends `pageType~cardAlarm` with the same
 * payload (one button `U1`, icons lock-remove / lock-off). This module exists so a
 * `pageType~cardUnlock` is rendered the same way, the parser and the model are shared.
 */
export type { CardAlarmModel as CardUnlockModel } from '../cardAlarm/parse';
export { initial, parseEntityUpd, parseEntityUpdateDetail, handleCommand } from '../cardAlarm/parse';
