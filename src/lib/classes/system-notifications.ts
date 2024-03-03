import { GetNotificationsResponse, HostId, notification } from '../types/system-notifications';
import { AdapterClassDefinition, BaseClass } from './library';

export class SystemNotifications extends BaseClass {
    private language: ioBroker.Languages;
    private notifications: notification[] = [];
    private messageTimeout: ioBroker.Timeout | undefined;

    constructor(adapter: AdapterClassDefinition) {
        super(adapter, 'system-notifcations');
        this.language = this.adapter.library.getLocalLanguage();
    }
    public async init(): Promise<void> {
        await this.adapter.subscribeForeignStatesAsync('system.host.*.notifications.*');
        const obj = await this.adapter.getObjectAsync(`${this.adapter.namespace}.panels`);
        if (obj) {
            this.notifications = (obj.native && obj.native.SystemNotifications) || [];
        }

        await this.handleIobrokerNotifications();
    }
    async delete(): Promise<void> {
        await this.writeConfig();
        await super.delete();
        if (this.messageTimeout) this.adapter.clearTimeout(this.messageTimeout);
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
     * Get all existing hosts of this installation
     */
    private async getAllHosts(): Promise<HostId[]> {
        const res = await this.adapter.getObjectViewAsync('system', 'host', {
            startkey: 'system.host.',
            endkey: 'system.host.\u9999',
        });

        return res.rows.map((host) => host.id as HostId);
    }
    /**
     * Is called if a subscribed state changes
     */
    public async onStateChange(id: string, _state: ioBroker.State | null | undefined): Promise<void> {
        if (id.startsWith('system.host')) {
            const hostName = id.split('.')[2];
            this.log.info(`New notification on "${hostName}" detected`);
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

            const { result: notifications } = (await this.adapter.sendToHostAsync(
                host,
                'getNotifications',
                {},
            )) as unknown as GetNotificationsResponse;

            this.log.debug(`Received notifications from "${host}": ${JSON.stringify(notifications)}`);

            const msgs: notification[] = [];
            for (const k in notifications) {
                const sub = notifications[k];
                for (const c in sub.categories) {
                    msgs.push({
                        id: `${k}.${c}`,
                        headline: sub.categories[c].name[this.language],
                        text: sub.categories[c].description[this.language],
                        version: 0,
                        severity: sub.categories[c].severity,
                        ts: 0,
                        cleared: false,
                    });
                }
            }
            for (const m of msgs) await this.sendNotifications(m);
        }
    }

    private async sendNotifications(notify: notification): Promise<void> {
        if (
            this.notifications.some((a) => {
                if (a.id === notify.id && a.ts === notify.ts && a.severity == notify.severity) return true;
            })
        )
            return;
        this.notifications.push(notify);

        if (this.messageTimeout) return;
        this.messageTimeout = this.adapter.setTimeout(() => {
            this.notifications.sort((a, b) => {
                if (a.severity === b.severity) return 0;
                if (a.severity === 'alert') return 1;
                if (b.severity === 'alert') return -1;
                return 0;
            });

            if (this.notifications.some((a) => !a.cleared))
                this.adapter.controller && this.adapter.controller.notificationToPanel();
        }, 2500);
    }

    /**
     * name
     */
    public async clearNotification(index: number): Promise<void> {
        if (this.notifications[index]) {
            this.notifications[index].cleared = true;
            await this.writeConfig();
        }
    }
    public getNotification(index: number): { headline: string; text: string } | null {
        if (this.notifications[index]) {
            let { headline, text } = this.notifications[index];
            const line = 46;
            let counter = 0;
            let a = 0;
            let olda = a;
            while (counter++ < 10) {
                if (a + line >= text.length) break;
                a = text.lastIndexOf(' ', line + a);
                if (olda === a) break;
                olda = a;
                text = text.slice(0, a) + '\n' + text.slice(++a);
            }
            headline += '\n';
            text = headline + '\n' + text;
            return { headline: 'Notification', text };
        }
        return null;
    }
    /**
     *
     * @param index
     * @returns
     */
    public getNotificationIndex(index: number): number {
        if (index === -1) index = 0;
        const l = this.notifications.length;
        if (index >= 0) {
            for (index; index < l; index++) {
                if (this.notifications[index] && !this.notifications[index].cleared) break;
            }
            if (this.notifications[index] && !this.notifications[index].cleared) {
                return index;
            }
        }
        return -1;
    }
}
