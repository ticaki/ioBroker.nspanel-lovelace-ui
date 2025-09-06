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
var getMpd_exports = {};
__export(getMpd_exports, {
  getPageMpd: () => getPageMpd
});
module.exports = __toCommonJS(getMpd_exports);
var import_Color = require("../../const/Color");
async function getPageMpd(configManager, page, gridItem, messages, justCheck = false) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  if (justCheck) {
    return { gridItem, messages: ["done"] };
  }
  gridItem.dpInit = `/^${page.media.id.split(".").slice(0, 2).join("\\.")}\\./`;
  gridItem = {
    ...gridItem,
    uniqueID: page.uniqueName,
    config: {
      ...gridItem.config,
      ident: page.media.id,
      card: "cardMedia",
      data: {
        headline: page.media.name ? await configManager.getFieldAsDataItemConfig(page.media.name) : void 0,
        album: {
          mode: "auto",
          type: "state",
          role: "media.album",
          regexp: /\.album$/,
          dp: ""
        },
        title: {
          value: {
            mode: "auto",
            type: "triggered",
            role: "media.title",
            regexp: /\.title$/,
            dp: ""
          },
          true: page.media.colorMediaArtist ? {
            color: await configManager.getFieldAsDataItemConfig(page.media.colorMediaArtist)
          } : void 0
        },
        duration: {
          mode: "auto",
          type: "state",
          role: "media.duration",
          regexp: /\.current_duration_s$/,
          dp: "",
          read: `return val ? val*1000 : val;`
        },
        onOffColor: {
          true: page.media.colorMediaIcon ? { color: await configManager.getIconColor(page.media.colorMediaIcon) } : void 0
        },
        elapsed: {
          mode: "auto",
          type: "triggered",
          role: "media.elapsed",
          regexp: /\.elapsed$/,
          dp: "",
          read: `return val ? val*1000 : val;`
        },
        volume: {
          value: {
            mode: "auto",
            type: "state",
            role: "level.volume",
            scale: { min: (_a = page.media.minValue) != null ? _a : 0, max: (_b = page.media.maxValue) != null ? _b : 100 },
            regexp: /\.volume$/,
            dp: ""
          },
          set: {
            mode: "auto",
            type: "state",
            role: "",
            scale: { min: (_c = page.media.minValue) != null ? _c : 0, max: (_d = page.media.maxValue) != null ? _d : 100 },
            regexp: /\.setvol$/,
            dp: ""
          }
        },
        artist: {
          value: {
            mode: "auto",
            type: "state",
            role: "media.artist",
            regexp: /\.artist$/,
            dp: ""
          },
          true: page.media.colorMediaArtist ? {
            color: await configManager.getIconColor(page.media.colorMediaArtist)
          } : void 0
        },
        shuffle: {
          value: {
            mode: "auto",
            type: "triggered",
            role: "media.mode.shuffle",
            regexp: /\.random$/,
            dp: ""
          },
          set: {
            mode: "auto",
            type: "state",
            role: "media.mode.shuffle",
            regexp: /\.random$/,
            dp: ""
          }
        },
        icon: {
          type: "const",
          constVal: "dialpad"
        },
        play: {
          mode: "auto",
          type: "state",
          role: "button.play",
          regexp: /\.play$/,
          dp: ""
        },
        isPlaying: {
          mode: "auto",
          type: "triggered",
          role: "media.state",
          regexp: /\.state$/,
          dp: "",
          read: `return val === 'play';`
        },
        mediaState: {
          mode: "auto",
          type: "triggered",
          role: "media.state",
          regexp: /\.state$/,
          dp: ""
        },
        stop: {
          mode: "auto",
          type: "state",
          role: "button.stop",
          regexp: /\.stop$/,
          dp: ""
        },
        pause: {
          mode: "auto",
          type: "state",
          role: "button.pause",
          regexp: /\.pause$/,
          dp: ""
        },
        forward: {
          mode: "auto",
          type: "state",
          role: "button.next",
          regexp: /\.next$/,
          dp: ""
        },
        backward: {
          mode: "auto",
          type: "state",
          role: "button.prev",
          regexp: /\.previous$/,
          dp: ""
        },
        logo: {
          on: {
            type: "const",
            constVal: true
          },
          text: { type: "const", constVal: "1" },
          icon: { true: { type: "const", constVal: "logo-mpd" } },
          color: { type: "const", constVal: { r: 250, b: 100, g: 200 } },
          list: void 0,
          action: "cross"
        }
      }
    },
    items: void 0,
    pageItems: []
  };
  gridItem.pageItems = gridItem.pageItems || [];
  if (((_e = page.media.deactivateDefaultItems) == null ? void 0 : _e.online) !== true) {
    gridItem.pageItems.push({
      role: "",
      type: "text",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "wifi" },
            color: await configManager.getIconColor((_f = page.media.itemsColorOn) == null ? void 0 : _f.online, import_Color.Color.good)
          },
          false: {
            value: { type: "const", constVal: "wifi-off" },
            color: await configManager.getIconColor((_g = page.media.itemsColorOff) == null ? void 0 : _g.online, import_Color.Color.attention)
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            mode: "auto",
            type: "triggered",
            role: "indicator.connected",
            regexp: /\.info\.connection$/,
            dp: ""
          }
        },
        enabled: {
          mode: "auto",
          type: "triggered",
          role: "indicator.connected",
          regexp: /\.info\.connection$/,
          dp: "",
          read: "return !val;"
        }
      }
    });
  }
  if (((_h = page.media.deactivateDefaultItems) == null ? void 0 : _h.repeat) !== true) {
    gridItem.pageItems.push({
      role: "",
      type: "button",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "repeat-variant" },
            color: await configManager.getIconColor((_i = page.media.itemsColorOn) == null ? void 0 : _i.repeat, import_Color.Color.activated)
          },
          false: {
            value: { type: "const", constVal: "repeat" },
            color: await configManager.getIconColor((_j = page.media.itemsColorOff) == null ? void 0 : _j.repeat, import_Color.Color.deactivated)
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            mode: "auto",
            type: "triggered",
            role: "media.mode.repeat",
            regexp: /\.repeat$/,
            dp: ""
          }
        }
      }
    });
  }
  if (((_k = page.media.deactivateDefaultItems) == null ? void 0 : _k.clock) !== true) {
    gridItem.pageItems.push({
      template: "text.clock",
      dpInit: ""
    });
  }
  return { gridItem, messages };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getPageMpd
});
//# sourceMappingURL=getMpd.js.map
