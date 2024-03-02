"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var system_notifications_exports = {};
__export(system_notifications_exports, {
  SystemNotifications: () => SystemNotifications
});
module.exports = __toCommonJS(system_notifications_exports);
var import_library = require("./library");
class SystemNotifications extends import_library.BaseClass {
  language;
  alert = false;
  info = false;
  notifications = [];
  msgIndex = 0;
  messageTimeout;
  constructor(adapter) {
    super(adapter, "system-notifcations");
    this.language = this.adapter.library.getLocalLanguage();
  }
  async init() {
    await this.adapter.subscribeForeignStatesAsync("system.host.*.notifications.*");
    const obj = await this.adapter.getObjectAsync(`${this.adapter.namespace}.panels`);
    if (obj) {
      this.notifications = obj.native && obj.native.SystemNotifications || [];
    }
    await this.handleIobrokerNotifications();
  }
  async delete() {
    await this.writeConfig();
    await super.delete();
    if (this.messageTimeout)
      this.adapter.clearTimeout(this.messageTimeout);
    this.messageTimeout = void 0;
  }
  /**
   * write config data to object
   */
  async writeConfig() {
    const obj = await this.adapter.getObjectAsync(`${this.adapter.namespace}.panels`);
    if (obj && obj.native) {
      obj.native.SystemNotifications = this.notifications;
      await this.adapter.setObjectAsync(`${this.adapter.namespace}.panels`, obj);
    }
  }
  /**
   * Get all existing hosts of this installation
   */
  async getAllHosts() {
    const res = await this.adapter.getObjectViewAsync("system", "host", {
      startkey: "system.host.",
      endkey: "system.host.\u9999"
    });
    return res.rows.map((host) => host.id);
  }
  /**
   * Is called if a subscribed state changes
   */
  async onStateChange(id, _state) {
    if (id.startsWith("system.host")) {
      const hostName = id.split(".")[2];
      this.log.info(`New notification on "${hostName}" detected`);
      await this.handleIobrokerNotifications([`system.host.${hostName}`]);
    }
  }
  /**
   * Checks for existing notifications and handles them according to the configuration
   *
   * @param hosts names of the hosts to handle notifications for, if omitted all hosts are used
   */
  async handleIobrokerNotifications(hosts) {
    hosts = hosts || await this.getAllHosts();
    for (const host of hosts) {
      this.log.debug(`Request notifications from "${host}"`);
      const { result: notifications } = await this.adapter.sendToHostAsync(
        host,
        "getNotifications",
        {}
      );
      this.log.debug(`Received notifications from "${host}": ${JSON.stringify(notifications)}`);
      const msgs = [];
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
            cleared: false
          });
        }
      }
      for (const m of msgs)
        await this.sendNotifications(m);
    }
  }
  async sendNotifications(notify) {
    if (this.notifications.some((a) => {
      if (a.id === notify.id && a.ts === notify.ts && a.severity == notify.severity)
        return true;
    }))
      return;
    this.notifications.push(notify);
    if (this.messageTimeout)
      return;
    this.messageTimeout = this.adapter.setTimeout(() => {
      this.alert = false;
      this.info = false;
      this.notifications.sort((a, b) => {
        if (a.severity === b.severity)
          return 0;
        if (a.severity === "alert")
          return 1;
        if (b.severity === "alert")
          return -1;
        return 0;
      });
      this.notifications.forEach((a) => {
        if (a.severity === "alert")
          this.alert = true;
        else
          this.info = true;
      });
      if (this.notifications.some((a) => !a.cleared))
        this.adapter.controller && this.adapter.controller.notificationToPanel();
    }, 2500);
  }
  /**
   * name
   */
  async clearNotification(index) {
    if (this.notifications[index]) {
      this.notifications[index].cleared = true;
      await this.writeConfig();
    }
  }
  getNotification(index) {
    if (this.notifications[index]) {
      let { headline, text } = this.notifications[index];
      const line = 46;
      let counter = 0;
      let a = 0;
      let olda = a;
      while (counter++ < 10) {
        if (a + line >= text.length)
          break;
        a = text.lastIndexOf(" ", line + a);
        if (olda === a)
          break;
        olda = a;
        text = text.slice(0, a) + "\n" + text.slice(++a);
      }
      headline += "\n";
      text = headline + "\n" + text;
      return { headline: "Notification", text };
    }
    return null;
  }
  /**
   *
   * @param index
   * @returns
   */
  getNotificationIndex(index) {
    if (index === -1)
      index = 0;
    const l = this.notifications.length;
    const lastPos = index + l - 1;
    if (index >= 0) {
      for (index; index < lastPos; index++) {
        if (this.notifications[index % l] && !this.notifications[index % l].cleared)
          break;
      }
      if (!this.notifications[index % l].cleared) {
        return index % l;
      }
    }
    return -1;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SystemNotifications
});
//# sourceMappingURL=system-notifications.js.map
