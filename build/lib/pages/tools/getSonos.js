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
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M;
  const adapter = configManager.adapter;
  const arr = page.media.id.split(".").slice(0, 3);
  const viewStr = arr.join(".");
  const str = page.media.id.split(".").slice(0, 4).join(".");
  const devices = viewStr && arr.length === 3 ? await configManager.adapter.getObjectViewAsync("system", "channel", {
    startkey: `${viewStr}.`,
    endkey: `${viewStr}${String.fromCharCode(65533)}`
  }) : { rows: [] };
  if (!devices || !devices.rows || devices.rows.length == 0 || devices.rows.findIndex((row) => {
    if (row && row.value && row.id && row.id.split(".").length === 4) {
      return str === row.id;
    }
  }) === -1) {
    const msg = `${page.uniqueName}: Media page id ${page.media.id} is not a valid sonos device!`;
    messages.push(msg);
    adapter.log.warn(msg);
    return { gridItem, messages };
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
              value: { type: "const", constVal: "logo-sonos" },
              color: { type: "const", constVal: { r: 250, b: 250, g: 0 } }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              type: "triggered",
              role: "media.seek",
              regexp: /\.seek$/,
              dp: "",
              read: `return val != null ? Math.round(val) : val;`
            },
            set: {
              mode: "auto",
              type: "state",
              writeable: true,
              role: "media.seek",
              regexp: /\.seek$/,
              dp: "",
              write: `return val != null ? Math.round(val) : val;`
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
          true: page.media.colorMediaIcon ? { color: await configManager.getIconColor(page.media.colorMediaIcon) } : { color: { type: "const", constVal: import_Color.Color.on } },
          false: page.media.colorMediaIcon ? void 0 : { color: { type: "const", constVal: import_Color.Color.off } }
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
        useGroupVolume: {
          mode: "auto",
          type: "triggered",
          regexp: /.?\.members$/,
          dp: "",
          read: `
                        if (typeof val === 'string') {
                            const t = val.split(',');
                            return t.length > 1;
                        };
                        return false;`
        },
        volumeGroup: {
          value: {
            mode: "auto",
            type: "state",
            role: ["level.volume.group"],
            scale: { min: (_e = page.media.minValue) != null ? _e : 0, max: (_f = page.media.maxValue) != null ? _f : 100 },
            regexp: /\.group_volume$/,
            dp: ""
          },
          set: {
            mode: "auto",
            type: "state",
            role: ["level.volume.group"],
            scale: { min: (_g = page.media.minValue) != null ? _g : 0, max: (_h = page.media.maxValue) != null ? _h : 100 },
            regexp: /\.group_volume$/,
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
  if (!((_i = page.media.deactivateDefaultItems) == null ? void 0 : _i.online)) {
    gridItem.pageItems.push({
      role: "",
      type: "text",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "wifi" },
            color: await configManager.getIconColor((_j = page.media.itemsColorOn) == null ? void 0 : _j.online, import_Color.Color.good)
          },
          false: {
            value: { type: "const", constVal: "wifi-off" },
            color: await configManager.getIconColor((_k = page.media.itemsColorOff) == null ? void 0 : _k.online, import_Color.Color.attention)
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
  if (!((_l = page.media.deactivateDefaultItems) == null ? void 0 : _l.speakerList)) {
    const selects = [];
    const list = page.media.speakerList;
    if (devices && devices.rows && devices.rows.length !== 0) {
      if (list && list.length > 0) {
        devices.rows.filter((v) => list.includes(tools.getStringFromStringOrTranslated(adapter, v.value.common.name))).forEach((v) => selects.push(tools.getStringFromStringOrTranslated(adapter, v.value.common.name)));
      } else {
        devices.rows.forEach(
          (v) => selects.push(tools.getStringFromStringOrTranslated(adapter, v.value.common.name))
        );
      }
    }
    let arr2 = list && list.length > 0 ? selects.filter((t) => list.find((s) => s === t) == null) : selects;
    arr2 = arr2.concat(list != null ? list : []);
    arr2 = [...new Set(arr2.filter(Boolean))];
    if (arr2.length > 1) {
      gridItem.pageItems.push({
        role: "SonosSpeaker",
        type: "button",
        data: {
          entity1: {
            value: {
              //mode: 'auto',
              type: "triggered",
              //regexp: /.?\.coordinator$/,
              dp: `${str}.coordinator`,
              read: ` return val === '${str.split(".").pop()}'`
            }
          },
          icon: {
            true: {
              value: { type: "const", constVal: "speaker-multiple" },
              color: await configManager.getIconColor((_m = page.media.itemsColorOn) == null ? void 0 : _m.speakerList, import_Color.Color.good)
            },
            false: {
              value: { type: "const", constVal: "speaker-multiple" },
              color: await configManager.getIconColor((_n = page.media.itemsColorOff) == null ? void 0 : _n.speakerList, import_Color.Color.bad)
            }
          },
          /**
           * Für role selectGrid ist entity3 die Liste der möglichen Werte
           */
          entity3: {
            value: {
              type: "const",
              constVal: JSON.stringify(page.media.speakerList || [])
            }
          },
          enabled: {
            type: "const",
            constVal: true
          }
        }
      });
    }
  }
  if (!((_o = page.media.deactivateDefaultItems) == null ? void 0 : _o.favoriteList)) {
    gridItem.pageItems.push({
      role: "2valuesIsValue",
      type: "input_sel",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "playlist-star" },
            color: await configManager.getIconColor((_p = page.media.itemsColorOn) == null ? void 0 : _p.favoriteList, import_Color.Color.activated)
          }
        },
        entityInSel: {
          value: {
            mode: "auto",
            type: "triggered",
            regexp: /.?\.favorites_set$/,
            dp: ""
          },
          set: {
            mode: "auto",
            type: "state",
            regexp: /.?\.favorites_set$/,
            dp: ""
          }
        },
        valueList: {
          type: "const",
          constVal: JSON.stringify(page.media.favoriteList || [])
        },
        valueList2: {
          mode: "auto",
          type: "state",
          regexp: /.?\.favorites_list_array$/,
          dp: ""
        },
        headline: {
          type: "const",
          constVal: "favoriteList"
        },
        enabled: {
          mode: "auto",
          type: "triggered",
          regexp: /.?\.favorites_list_array$/,
          dp: "",
          read: `
                    let data = val;
                    if (typeof val === 'string') {
                        try {
                            data = JSON.parse(val);
                        } catch {
                            return false;
                        }
                    }
                    if (Array.isArray(data)) {
                        return data.length !== 0;
                    }
                    return false;`
        }
      }
    });
  }
  if (!((_q = page.media.deactivateDefaultItems) == null ? void 0 : _q.playList)) {
    gridItem.pageItems.push({
      role: "",
      type: "input_sel",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "playlist-play" },
            color: await configManager.getIconColor((_r = page.media.itemsColorOn) == null ? void 0 : _r.playList, import_Color.Color.activated)
          }
        },
        entityInSel: Array.isArray(page.media.playList) ? {
          set: {
            mode: "auto",
            type: "state",
            regexp: /.?\.playlist_set$/,
            dp: "",
            write: Array.isArray(page.media.playList) ? `return ${JSON.stringify(page.media.playList)}.length > val ? ${JSON.stringify(page.media.playList)}[val]: ''` : void 0
          }
        } : void 0,
        valueList: Array.isArray(page.media.playList) ? {
          type: "const",
          constVal: JSON.stringify(page.media.playList)
        } : void 0,
        headline: {
          type: "const",
          constVal: "playList"
        },
        enabled: {
          type: "const",
          constVal: Array.isArray(page.media.playList) ? page.media.playList.length > 0 : false
        }
      }
    });
  }
  if (!((_s = page.media.deactivateDefaultItems) == null ? void 0 : _s.clock)) {
    gridItem.pageItems.push({
      template: "text.clock",
      dpInit: "",
      data: {
        icon: {
          true: {
            color: ((_t = page.media.itemsColorOn) == null ? void 0 : _t.clock) ? await configManager.getIconColor((_u = page.media.itemsColorOn) == null ? void 0 : _u.clock) : void 0
          }
        }
      }
    });
  }
  if (page.media.volumePresets) {
    gridItem.pageItems.push({
      role: "",
      type: "input_sel",
      dpInit: "",
      filter: "volume",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "volume-source" },
            color: await configManager.getIconColor(
              (_v = page.media.itemsColorOn) == null ? void 0 : _v.volumePresets,
              import_Color.Color.activated
            )
          }
        },
        entityInSel: {
          value: {
            mode: "auto",
            type: "state",
            role: ["level.volume"],
            scale: { min: (_w = page.media.minValue) != null ? _w : 0, max: (_x = page.media.maxValue) != null ? _x : 100 },
            regexp: /\.volume$/,
            dp: ""
          },
          set: {
            mode: "auto",
            type: "state",
            role: ["level.volume"],
            scale: { min: (_y = page.media.minValue) != null ? _y : 0, max: (_z = page.media.maxValue) != null ? _z : 100 },
            regexp: /\.volume$/,
            dp: ""
          }
        },
        valueList: {
          type: "const",
          constVal: JSON.stringify(page.media.volumePresets || [])
        },
        headline: {
          type: "const",
          constVal: "volumePresets"
        }
      }
    });
  }
  if (page.media.volumePresets) {
    gridItem.pageItems.push({
      role: "",
      type: "input_sel",
      dpInit: "",
      filter: "volumeGroup",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "volume-source" },
            color: await configManager.getIconColor(
              (_A = page.media.itemsColorOn) == null ? void 0 : _A.volumePresets,
              import_Color.Color.activated
            )
          }
        },
        entityInSel: {
          value: {
            mode: "auto",
            type: "state",
            role: ["level.volume.group"],
            scale: { min: (_B = page.media.minValue) != null ? _B : 0, max: (_C = page.media.maxValue) != null ? _C : 100 },
            regexp: /\.group_volume$/,
            dp: ""
          },
          set: {
            mode: "auto",
            type: "state",
            role: ["level.volume.group"],
            scale: { min: (_D = page.media.minValue) != null ? _D : 0, max: (_E = page.media.maxValue) != null ? _E : 100 },
            regexp: /\.group_volume$/,
            dp: ""
          }
        },
        valueList: {
          type: "const",
          constVal: JSON.stringify(page.media.volumePresets || [])
        },
        headline: {
          type: "const",
          constVal: "volumePresets"
        }
      }
    });
  }
  if (((_F = page.media.deactivateDefaultItems) == null ? void 0 : _F.trackList) !== true) {
    gridItem.pageItems.push({
      role: "spotify-tracklist",
      type: "input_sel",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "animation-play-outline" },
            color: await configManager.getIconColor((_G = page.media.itemsColorOn) == null ? void 0 : _G.playList, import_Color.Color.activated)
          }
        },
        entityInSel: {
          value: {
            mode: "auto",
            type: "triggered",
            regexp: /.?\.current_track_number$/,
            dp: "",
            read: `return val != null && parseInt(val) > 0? (parseInt(val)-1) : val;`
          },
          set: {
            mode: "auto",
            type: "state",
            regexp: /.?\.current_track_number$/,
            dp: "",
            write: `return parseInt(val)+1;`
          }
        },
        valueList: {
          mode: "auto",
          type: "state",
          regexp: /.?\.queue$/,
          dp: "",
          read: `
                        let data = val;
                        if (typeof val === 'string') {
                            data = data.split(',');
                            return data.map(item => {
                                item = item.trim();
                                let result = item.split(' - ')[1];
                                if (!result) {
                                    result = item;
                                }
                                return result;
                            });
                        }
                        return [];`
        },
        headline: {
          type: "const",
          constVal: "trackList"
        }
      }
    });
  }
  if (!((_H = page.media.deactivateDefaultItems) == null ? void 0 : _H.repeat)) {
    const tempOn = await configManager.getIconColor((_I = page.media.itemsColorOn) == null ? void 0 : _I.repeat);
    const tempOff = await configManager.getIconColor((_J = page.media.itemsColorOff) == null ? void 0 : _J.repeat);
    let colorOn;
    let colorOff;
    if (tempOn && tempOn.type === "const") {
      colorOn = tempOn.constVal;
    }
    if (tempOff && tempOff.type === "const") {
      colorOff = tempOff.constVal;
    }
    gridItem.pageItems.push({
      role: "repeatValue",
      type: "button",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: {
              mode: "auto",
              type: "state",
              role: "media.mode.repeat",
              regexp: /\.repeat$/,
              dp: "",
              read: `switch (val) {
                                    case 0:
                                        return 'repeat';
                                    case 2:
                                        return 'repeat-once';
                                    case 1:
                                        return 'repeat-variant';
                                }`
            },
            color: {
              mode: "auto",
              type: "state",
              role: "media.mode.repeat",
              regexp: /\.repeat$/,
              dp: "",
              read: `switch (val) {
                                    case 0:
                                        return ${colorOff ? JSON.stringify(colorOff) : "Color.deactivated"};
                                    case 1:
                                        return ${colorOn ? JSON.stringify(colorOn) : "Color.activated"};
                                    case 2:
                                        return ${colorOn ? JSON.stringify(colorOn) : "Color.option4"};
                                }`
            }
          }
        },
        entity1: {
          value: {
            mode: "auto",
            type: "triggered",
            role: "media.mode.repeat",
            regexp: /\.repeat$/,
            dp: "",
            read: `
                            switch (val) {
                                case 0:
                                    return 'OFF';
                                case 1:
                                    return 'ALL';
                                case 2:
                                    return 'ONE';
                            }
                            return 'OFF';
                        `
          },
          set: {
            mode: "auto",
            type: "state",
            role: "media.mode.repeat",
            regexp: /\.repeat$/,
            dp: "",
            write: `
                            switch (val) {
                                case 'OFF':
                                    return 1;
                                case 'ALL':
                                    return 2;
                                case 'ONE':
                                    return 0;
                            }
                            return 0;`
          }
        }
      }
    });
  }
  if (!((_K = page.media.deactivateDefaultItems) == null ? void 0 : _K.crossfade)) {
    gridItem.pageItems.push({
      role: "",
      type: "button",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "shuffle" },
            color: await configManager.getIconColor((_L = page.media.itemsColorOn) == null ? void 0 : _L.crossfade, import_Color.Color.activated)
          },
          false: {
            value: { type: "const", constVal: "shuffle" },
            color: await configManager.getIconColor((_M = page.media.itemsColorOff) == null ? void 0 : _M.crossfade, import_Color.Color.deactivated)
          }
        },
        entity1: {
          value: {
            mode: "auto",
            type: "triggered",
            role: "media.mode.crossfade",
            regexp: /\.crossfade$/,
            dp: ""
          },
          set: {
            mode: "auto",
            type: "state",
            role: "media.mode.crossfade",
            regexp: /\.crossfade$/,
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
