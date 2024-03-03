// hm

interface notificationInput {
    id: string;
    headline: string;
    text: string;
    version: number;
    severity: Severity;
}
interface notification {
    id: string;
    headline: string;
    text: string;
    version: number;
    ts: number;
    cleared: boolean;
    severity: Severity;
    scopeid?: string;
    categoryid?: string;
    instanceid?: string;
    host?: string;
}

interface GetNotificationsResponse {
    result: NotificationsObject;
}

type HostId = `system.host.${string}`;

type Severity = 'alert' | 'info' | 'notify';

interface NotificationCategory {
    instances: {
        [adapterInstance: string]: {
            messages: NotificationInstanceMessage[];
        };
    };
    /** i18n description of category */
    description: Record<string, string>;
    /** i18n name of category */
    name: Record<string, string>;
    severity: Severity;
}

/** Notifications category where i18n objects are already translated */
interface LocalizedNotificationCategory extends Omit<NotificationCategory, 'description' | 'name'> {
    description: string;
    name: string;
}

interface NotificationScope {
    /** i18n description of scope */
    description: Record<string, string>;
    /** i18n name of scope */
    name: Record<string, string>;
    categories: {
        [category: string]: NotificationCategory;
    };
}

/** Notifications scope where i18n objects are already translated */
interface LocalizedNotificationScope extends Omit<NotificationScope, 'description' | 'name'> {
    description: string;
    name: string;
}

interface NotificationsObject {
    [scope: string]: NotificationScope;
}

interface NotificationInstanceMessage {
    message: string;
    ts: number;
}

interface SendNotificationsOptions {
    /** hostname system.host.xy */
    host: string;
    /** the received notifications from controller */
    notifications: NotificationsObject;
}

export interface FindInstanceOptions {
    /** id of the scope */
    scopeId: string;
    /** id of the category */
    categoryId: string;
    /** Severity of this category */
    severity: Severity;
}

export interface CategoryActiveCheckOptions {
    /** id of the scope */
    scopeId: string;
    /** id of the category */
    categoryId: string;
}

export interface ResponsibleInstances {
    firstAdapter: {
        /** highest priority adapter instance */
        main?: string;
        /** second priority adapter instance */
        fallback: string;
    };
    secondAdapter: {
        /** Fallback instance for the first instance */
        main?: string;
        /** Fallback instance for the second instance */
        fallback: string;
    };
}

export interface LocalizedNotification {
    /** host where the notification belongs too */
    host: string;
    /** The localized scope of the notification */
    scope: Omit<LocalizedNotificationScope, 'categories'>;
    /** The localized category of the notification */
    category: LocalizedNotificationCategory;
}
