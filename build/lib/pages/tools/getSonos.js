"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var getSonos_exports = {};
__export(getSonos_exports, {
  getPageSonos: () => getPageSonos
});
module.exports = __toCommonJS(getSonos_exports);
var import_Color = require("../../const/Color");
var tools = __toESM(require("../../const/tools"));
async function getPageSonos(configManager, page, gridItem, messages, justCheck = false) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
  const adapter = configManager.adapter;
  const arr = page.media.id.split(".").slice(0, 3);
  const viewStr = arr.join(".");
  const str = page.media.id.split(".").slice(0, 3).join(".");
  const devices = viewStr && arr.length === 3 ? await configManager.adapter.getObjectViewAsync("system", "device", {
    startkey: `${viewStr}.`,
    endkey: `${viewStr}${String.fromCharCode(65533)}`
  }) : { rows: [] };
  if (devices && devices.rows && devices.rows.length > 0) {
    if (devices.rows.findIndex((row) => {
      if (row && row.value && row.id && row.id.split(".").length === 3) {
        return str === row.id;
      }
    }) === -1) {
      const msg = `${page.uniqueName}: Media page id ${page.media.id} is not a valid sonos device!`;
      messages.push(msg);
      adapter.log.warn(msg);
      return { gridItem, messages };
    }
  }
  if (justCheck) {
    return { gridItem, messages: ["done"] };
  }
  const reg = tools.getRegExp(str, { startsWith: true });
  gridItem.dpInit = reg ? reg : str;
  gridItem = {
    ...gridItem,
    config: {
      ...gridItem.config,
      ident: str,
      card: "cardMedia",
      logo: {
        type: "number",
        data: {
          text: { true: { type: "const", constVal: "media.seek" } },
          icon: {
            true: {
              value: { type: "const", constVal: "speaker" },
              color: { type: "const", constVal: { r: 250, b: 250, g: 0 } }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              type: "triggered",
              role: "media.elapsed",
              regexp: /\.current_elapsed$/,
              dp: "",
              read: `return val != null ? val*1000 : val;`
            },
            set: {
              mode: "auto",
              type: "state",
              writeable: true,
              role: "media.seek",
              regexp: /\.seek$/,
              dp: "",
              write: `return val != null ? Math.round(val/1000) : val;`
            }
          }
        }
      },
      data: {
        headline: page.media.name ? await configManager.getFieldAsDataItemConfig(page.media.name) : void 0,
        album: {
          mode: "auto",
          type: "state",
          role: "media.album",
          regexp: /\.current_album$/,
          dp: ""
        },
        title: {
          value: {
            mode: "auto",
            type: "triggered",
            role: "media.title",
            regexp: /\.current_title$/,
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
          regexp: /\.current_duration$/,
          dp: "",
          read: `return val ? val*1000 : val;`
        },
        onOffColor: {
          true: page.media.colorMediaIcon ? { color: await configManager.getIconColor(page.media.colorMediaIcon) } : void 0
        },
        elapsed: {
          mode: "auto",
          type: "triggered",
          commonType: "number",
          role: ["media.elapsed"],
          regexp: /\.current_elapsed$/,
          dp: "",
          read: `return val != null ? val*1000 : val;`
        },
        volume: {
          value: {
            mode: "auto",
            type: "state",
            role: ["level.volume"],
            scale: { min: (_a = page.media.minValue) != null ? _a : 0, max: (_b = page.media.maxValue) != null ? _b : 100 },
            regexp: /\.volume$/,
            dp: ""
          },
          set: {
            mode: "auto",
            type: "state",
            role: ["level.volume"],
            scale: { min: (_c = page.media.minValue) != null ? _c : 0, max: (_d = page.media.maxValue) != null ? _d : 100 },
            regexp: /\.volume$/,
            dp: ""
          }
        },
        artist: {
          value: {
            mode: "auto",
            type: "state",
            role: "media.artist",
            regexp: /\.current_artist$/,
            dp: ""
          },
          true: page.media.colorMediaArtist ? {
            color: await configManager.getIconColor(page.media.colorMediaArtist)
          } : void 0
        },
        shuffle: {
          value: {
            mode: "auto",
            type: "state",
            role: "media.mode.shuffle",
            regexp: /\.shuffle$/,
            dp: ""
          },
          set: {
            mode: "auto",
            type: "state",
            role: "media.mode.shuffle",
            regexp: /\.shuffle$/,
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
          role: ["button.play"],
          regexp: /\.play$/,
          dp: ""
        },
        isPlaying: {
          mode: "auto",
          type: "triggered",
          role: ["media.state"],
          regexp: /\.state_simple$/,
          dp: ""
        },
        mediaState: {
          mode: "auto",
          type: "triggered",
          role: ["media.state"],
          regexp: /\.state_simple$/,
          dp: ""
        },
        stop: {
          mode: "auto",
          type: "state",
          role: ["button.stop"],
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
          regexp: /\.prev$/,
          dp: ""
        }
      }
    },
    items: void 0,
    uniqueID: page.uniqueName,
    pageItems: []
  };
  gridItem.pageItems = gridItem.pageItems || [];
  if (!((_e = page.media.deactivateDefaultItems) == null ? void 0 : _e.online)) {
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
            role: "indicator.reachable",
            regexp: /\.alive$/,
            dp: ""
          }
        },
        enabled: {
          mode: "auto",
          type: "triggered",
          role: "indicator.reachable",
          regexp: /\.alive$/,
          dp: "",
          read: "return !val;"
        }
      }
    });
  }
  if (!((_h = page.media.deactivateDefaultItems) == null ? void 0 : _h.speakerList)) {
    gridItem.pageItems.push({
      role: "",
      type: "input_sel",
      data: {
        color: {
          true: {
            type: "const",
            constVal: import_Color.Color.HMIOn
          },
          false: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "speaker-multiple" },
            color: await configManager.getIconColor((_i = page.media.itemsColorOn) == null ? void 0 : _i.speakerList, import_Color.Color.good)
          },
          false: {
            value: { type: "const", constVal: "speaker-multiple" },
            color: await configManager.getIconColor((_j = page.media.itemsColorOff) == null ? void 0 : _j.speakerList, import_Color.Color.bad)
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entityInSel: {
          value: {
            type: "const",
            constVal: "Sonos Speaker"
          }
        },
        headline: {
          type: "const",
          constVal: "speakerList"
        },
        /**
         * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
         */
        valueList: {
          type: "const",
          constVal: JSON.stringify(page.media.speakerList || [])
        },
        /**
         * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
         */
        setList: { type: "const", constVal: "0_userdata.0.test?1|0_userdata.0.test?2" }
      }
    });
  }
  if (!((_k = page.media.deactivateDefaultItems) == null ? void 0 : _k.playList)) {
    gridItem.pageItems.push({
      role: "",
      type: "input_sel",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "playlist-play" },
            color: await configManager.getIconColor((_l = page.media.itemsColorOn) == null ? void 0 : _l.playList, import_Color.Color.activated)
          }
        },
        entityInSel: {
          value: {
            type: "const",
            constVal: "My Playlist"
          }
        },
        valueList: {
          type: "const",
          constVal: JSON.stringify(page.media.playList || [])
        },
        headline: {
          type: "const",
          constVal: "playList"
        }
      }
    });
  }
  if (!((_m = page.media.deactivateDefaultItems) == null ? void 0 : _m.clock)) {
    gridItem.pageItems.push({
      template: "text.clock",
      dpInit: ""
    });
  }
  if (!((_n = page.media.deactivateDefaultItems) == null ? void 0 : _n.repeat)) {
    gridItem.pageItems.push({
      role: "",
      type: "text",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "repeat-variant" },
            color: await configManager.getIconColor((_o = page.media.itemsColorOn) == null ? void 0 : _o.repeat, import_Color.Color.activated)
          },
          false: {
            value: { type: "const", constVal: "repeat" },
            color: await configManager.getIconColor((_p = page.media.itemsColorOff) == null ? void 0 : _p.repeat, import_Color.Color.deactivated)
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
  return { gridItem, messages };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getPageSonos
});
//# sourceMappingURL=getSonos.js.map
