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
var import_tools = require("../const/tools");
var import_library = require("../controller/library");
class SystemNotifications extends import_library.BaseClass {
  language;
  notifications = [];
  messageTimeout;
  count = 0;
  constructor(adapter) {
    super(adapter, "system-notifications");
    this.language = this.adapter.library.getLocalLanguage();
  }
  async init() {
    const obj = await this.adapter.getObjectAsync(`${this.adapter.namespace}.panels`);
    if (obj) {
      this.notifications = obj.native && obj.native.SystemNotifications || [];
    }
    if (this.adapter.config.testCase) {
      return;
    }
    await this.handleIobrokerNotifications();
  }
  async delete() {
    await super.delete();
    await this.writeConfig();
    if (this.messageTimeout) {
      this.adapter.clearTimeout(this.messageTimeout);
    }
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
   * Get all existing hosts of this installation.
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
   *
   * @param id    The id of the state that changed
   * @param _state The state object holding the new value and meta information of the state
   */
  async onStateChange(id, _state) {
    if (id.startsWith("system.host") && id.includes(".notifications.")) {
      const hostName = id.split(".")[2];
      this.log.info(`Changes to the notifications on "${hostName}" detected.`);
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
      if (this.unload || this.adapter.unload) {
        return;
      }
      const _helper = async () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ result: {} });
          }, 1e3);
          return resolve(
            this.adapter.sendToHostAsync(
              host,
              "getNotifications",
              {}
            )
          );
        });
      };
      const { result: notifications } = await _helper();
      this.log.debug(`Received notifications from "${host}": ${JSON.stringify(notifications)}`);
      const msgs = [];
      for (const k in notifications) {
        const sub = notifications[k];
        for (const c in sub.categories) {
          msgs.push({
            id: `${k}.${c}`,
            headline: (hosts.length > 1 ? `${host}: ` : "") + sub.categories[c].name[this.language],
            text: sub.categories[c].description[this.language],
            version: 0,
            severity: sub.categories[c].severity,
            ts: 0,
            cleared: false,
            scopeid: k,
            categoryid: c,
            host
          });
        }
      }
      this.notifications = this.notifications.filter((a) => {
        if (!a.scopeid || !a.categoryid || a.host !== host) {
          return true;
        }
        return msgs.findIndex((b) => b.scopeid === a.scopeid && b.categoryid === a.categoryid) !== -1;
      });
      for (const m of msgs) {
        await this.sendNotifications(m);
      }
    }
  }
  async sendNotifications(notify) {
    if (this.notifications.some((a) => {
      if (!a.scopeid && a.id === notify.id && a.ts === notify.ts && a.severity == notify.severity || a.scopeid && a.scopeid === notify.scopeid && a.categoryid === notify.scopeid && a.host === notify.host) {
        return true;
      }
    })) {
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
        if (a.severity === "alert") {
          return 1;
        }
        if (b.severity === "alert") {
          return -1;
        }
        return 0;
      });
      this.count = this.notifications.filter((a) => !a.cleared).length;
      if (this.notifications.some((a) => !a.cleared)) {
        this.adapter.controller && await this.adapter.controller.notificationToPanel();
      }
    }, 2500);
  }
  getCount() {
    return this.notifications.filter((a) => !a.cleared).length;
  }
  /**
   * Clear a notification
   *
   * @param index index of the notification. If omitted all notifications are cleared
   */
  async clearNotification(index) {
    var _a, _b;
    if (index === void 0) {
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
            await this.adapter.sendToHostAsync(msg.host, "clearNotifications", {
              scopeFilter: (_a = msg.scopeid) != null ? _a : null,
              categoryFilter: (_b = msg.categoryid) != null ? _b : null
            });
          } catch {
            this.log.error("Error while clear notification");
          }
        }
      }
      if (this.notifications[index]) {
        this.notifications[index].cleared = true;
      }
      await this.writeConfig();
    }
  }
  getNotification(index) {
    if (this.notifications[index]) {
      let currentNotify = 0;
      this.notifications.forEach((a) => !a.cleared && currentNotify <= index && currentNotify++);
      const { headline, text } = this.notifications[index];
      const line = 46;
      return {
        headline: `${this.library.getTranslation("Notification")} (${currentNotify}/${this.getCount()})`,
        text: `${(0, import_tools.insertLinebreak)(headline, line)}
${(0, import_tools.insertLinebreak)(text, line)}`,
        id: index
      };
    }
    return null;
  }
  /**
   * Get the index of the next notification
   *
   * @param index index of the notification
   */
  getNotificationIndex(index) {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SystemNotifications
});
//# sourceMappingURL=system-notifications.js.map
