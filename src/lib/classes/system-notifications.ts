import { insertLinebreak } from '../const/tools';
import type { GetNotificationsResponse, HostId, notification } from '../types/system-notifications';
import { BaseClass, type AdapterClassDefinition } from '../controller/library';

export class SystemNotifications extends BaseClass {
    private language: ioBroker.Languages;
    private notifications: notification[] = [];
    private messageTimeout: ioBroker.Timeout | undefined;
    public count: number = 0;

    constructor(adapter: AdapterClassDefinition) {
        super(adapter, 'system-notifications');
        this.language = this.adapter.library.getLocalLanguage();
    }
    public async init(): Promise<void> {
        //await this.adapter.subscribeForeignStatesAsync('system.host.*.notifications.*');
        const obj = await this.adapter.getObjectAsync(`${this.adapter.namespace}.panels`);
        if (obj) {
            this.notifications = (obj.native && obj.native.SystemNotifications) || [];
        }
        if (this.adapter.config.testCase) {
            return;
        }
        await this.handleIobrokerNotifications();
    }
    async delete(): Promise<void> {
        await super.delete();
        await this.writeConfig();
        if (this.messageTimeout) {
            this.adapter.clearTimeout(this.messageTimeout);
        }
        this.messageTimeout = undefined;
    }
    /**
     * write config data to object
     */
    private async writeConfig(): Promise<void> {
        const obj = await this.adapter.getObjectAsync(`${this.adapter.namespace}.panels`);
        if (obj && obj.native) {
            obj.native.SystemNotifications = this.notifications;
            await this.adapter.setObjectAsync(`${this.adapter.namespace}.panels`, obj);
        }
    }

    /**
     * Get all existing hosts of this installation.
     */
    private async getAllHosts(): Promise<HostId[]> {
        const res = await this.adapter.getObjectViewAsync('system', 'host', {
            startkey: 'system.host.',
            endkey: 'system.host.\u9999',
        });

        return res.rows.map(host => host.id);
    }
    /**
     * Is called if a subscribed state changes
     *
     * @param id    The id of the state that changed
     * @param _state The state object holding the new value and meta information of the state
     */
    public async onStateChange(id: string, _state: ioBroker.State | null | undefined): Promise<void> {
        if (id.startsWith('system.host') && id.includes('.notifications.')) {
            const hostName = id.split('.')[2];
            this.log.info(`Changes to the notifications on "${hostName}" detected.`);
            await this.handleIobrokerNotifications([`system.host.${hostName}`]);
        }
    }
    /**
     * Checks for existing notifications and handles them according to the configuration
     *
     * @param hosts names of the hosts to handle notifications for, if omitted all hosts are used
     */
    private async handleIobrokerNotifications(hosts?: HostId[]): Promise<void> {
        hosts = hosts || (await this.getAllHosts());

        for (const host of hosts) {
            this.log.debug(`Request notifications from "${host}"`);
            if (this.unload || this.adapter.unload) {
                return;
            }
            const _helper = async (): Promise<GetNotificationsResponse> => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve({ result: {} });
                    }, 1000);
                    return resolve(
                        this.adapter.sendToHostAsync(
                            host,
                            'getNotifications',
                            {},
                        ) as unknown as GetNotificationsResponse,
                    );
                });
            };
            const { result: notifications } = await _helper();

            this.log.debug(`Received notifications from "${host}": ${JSON.stringify(notifications)}`);

            const msgs: notification[] = [];
            for (const k in notifications) {
                const sub = notifications[k];
                for (const c in sub.categories) {
                    msgs.push({
                        id: `${k}.${c}`,
                        headline: (hosts.length > 1 ? `${host}: ` : '') + sub.categories[c].name[this.language],
                        text: sub.categories[c].description[this.language],
                        version: 0,
                        severity: sub.categories[c].severity,
                        ts: 0,
                        cleared: false,
                        scopeid: k,
                        categoryid: c,
                        host: host,
                    });
                }
            }
            this.notifications = this.notifications.filter(a => {
                if (!a.scopeid || !a.categoryid || a.host !== host) {
                    return true;
                }
                return msgs.findIndex(b => b.scopeid === a.scopeid && b.categoryid === a.categoryid) !== -1;
            });
            for (const m of msgs) {
                await this.sendNotifications(m);
            }
        }
    }

    private async sendNotifications(notify: notification): Promise<void> {
        if (
            this.notifications.some(a => {
                if (
                    (!a.scopeid && a.id === notify.id && a.ts === notify.ts && a.severity == notify.severity) ||
                    (a.scopeid &&
                        a.scopeid === notify.scopeid &&
                        a.categoryid === notify.scopeid &&
                        a.host === notify.host)
                ) {
                    return true;
                }
            })
        ) {
            return;
        }
        this.notifications.push(notify);

        if (this.messageTimeout) {
            return;
        }
        if (this.unload || this.adapter.unload) {
            return;
        }
        this.messageTimeout = this.adapter.setTimeout(async () => {
            this.notifications.sort((a, b) => {
                if (a.severity === b.severity) {
                    return 0;
                }
                if (a.severity === 'alert') {
                    return 1;
                }
                if (b.severity === 'alert') {
                    return -1;
                }
                return 0;
            });
            this.count = this.notifications.filter(a => !a.cleared).length;
            if (this.notifications.some(a => !a.cleared)) {
                this.adapter.controller && (await this.adapter.controller.notificationToPanel());
            }
        }, 2500);
    }
    getCount(): number {
        return this.notifications.filter(a => !a.cleared).length;
    }
    /**
     * Clear a notification
     *
     * @param index index of the notification. If omitted all notifications are cleared
     */
    public async clearNotification(index?: number): Promise<void> {
        if (index === undefined) {
            for (let i = 0; i < this.notifications.length; i++) {
                await this.clearNotification(i);
            }
            return;
        }
        if (this.notifications[index] && !this.notifications[index].cleared) {
            if (this.notifications[index].scopeid) {
                const msg = this.notifications[index];
                if (msg.host) {
                    try {
                        await this.adapter.sendToHostAsync(msg.host, 'clearNotifications', {
                            scopeFilter: msg.scopeid ?? null,
                            categoryFilter: msg.categoryid ?? null,
                        });
                    } catch {
                        this.log.error('Error while clear notification');
                    }
                }
            }
            if (this.notifications[index]) {
                this.notifications[index].cleared = true;
            }
            await this.writeConfig();
        }
    }
    public getNotification(index: number): { headline: string; text: string; id: number } | null {
        if (this.notifications[index]) {
            let currentNotify = 0;
            this.notifications.forEach(a => !a.cleared && currentNotify <= index && currentNotify++);
            const { headline, text } = this.notifications[index];
            const line = 46;
            return {
                headline: `${this.library.getTranslation('Notification')} (${currentNotify}/${this.getCount()})`,
                text: `${insertLinebreak(headline, line)}\n${insertLinebreak(text, line)}`,
                id: index,
            };
        }
        return null;
    }
    /**
     * Get the index of the next notification
     *
     * @param index index of the notification
     */
    public getNotificationIndex(index: number): number {
        if (index === -1) {
            index = 0;
        }
        const l = this.notifications.length;
        if (index >= 0) {
            for (index; index < l; index++) {
                if (this.notifications[index] && !this.notifications[index].cleared) {
                    break;
                }
            }
            if (this.notifications[index] && !this.notifications[index].cleared) {
                return index;
            }
        }
        return -1;
    }
}
