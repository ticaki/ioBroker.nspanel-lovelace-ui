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
var getSqueezebox_exports = {};
__export(getSqueezebox_exports, {
  getPageSqueezebox: () => getPageSqueezebox
});
module.exports = __toCommonJS(getSqueezebox_exports);
var import_Color = require("../../const/Color");
var tools = __toESM(require("../../const/tools"));
async function getPageSqueezebox(configManager, page, gridItem, messages, justCheck = false) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A;
  const adapter = configManager.adapter;
  const arr = page.media.id.split(".");
  const viewStr = arr.slice(0, 3).join(".");
  const str = arr.slice(0, 4).join(".");
  const devices = arr.length >= 4 && arr[2] === "Players" ? await adapter.getObjectViewAsync("system", "device", {
    startkey: `${viewStr}.`,
    endkey: `${viewStr}${String.fromCharCode(65533)}`
  }) : { rows: [] };
  if (!devices || !devices.rows || devices.rows.length == 0 || devices.rows.findIndex((row) => row && row.value && row.id === str) === -1) {
    const msg = `${page.uniqueName}: Media page id ${page.media.id} is not a valid squeezeboxrpc player (expected squeezeboxrpc.X.Players.<name>)!`;
    messages.push(msg);
    adapter.log.warn(msg);
    return { gridItem, messages };
  }
  if (justCheck) {
    return { gridItem, messages: ["done"] };
  }
  const reg = tools.getRegExp(`${str}.`, { startsWith: true });
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
              value: { type: "const", constVal: "logo-dnla" },
              color: { type: "const", constVal: { r: 250, b: 250, g: 0 } }
            }
          },
          // slider range is 0..duration in seconds
          entity1: {
            value: {
              mode: "auto",
              type: "triggered",
              role: "media.elapsed",
              regexp: /\.Time$/,
              dp: "",
              read: `return val != null ? Math.round(val) : val;`
            },
            set: {
              mode: "auto",
              type: "state",
              writeable: true,
              regexp: /\.cmdGoTime$/,
              dp: "",
              write: `return val != null ? String(Math.round(val)) : val;`
            }
          },
          minValue1: { type: "const", constVal: 0 },
          maxValue1: {
            mode: "auto",
            type: "triggered",
            role: "media.duration",
            regexp: /\.Duration$/,
            dp: "",
            read: `return val ? Math.round(val) : null;`
          }
        }
      },
      data: {
        headline: page.media.name ? await configManager.getFieldAsDataItemConfig(page.media.name) : void 0,
        album: {
          mode: "auto",
          type: "state",
          role: "media.album",
          regexp: /\.Album$/,
          dp: ""
        },
        title: {
          value: {
            mode: "auto",
            type: "triggered",
            role: "media.title",
            regexp: /\.Title$/,
            dp: ""
          },
          true: page.media.colorMediaTitle ? {
            color: await configManager.getIconColor(page.media.colorMediaTitle)
          } : void 0
        },
        duration: {
          mode: "auto",
          type: "state",
          role: "media.duration",
          regexp: /\.Duration$/,
          dp: "",
          read: `return val ? val*1000 : val;`
        },
        station: {
          mode: "auto",
          type: "triggered",
          regexp: /\.RadioName$/,
          dp: ""
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
          regexp: /\.Time$/,
          dp: "",
          read: `return val != null ? val*1000 : val;`
        },
        volume: {
          value: {
            mode: "auto",
            type: "state",
            role: ["level.volume"],
            scale: { min: (_a = page.media.minValue) != null ? _a : 0, max: (_b = page.media.maxValue) != null ? _b : 100 },
            regexp: /\.Volume$/,
            dp: "",
            // LMS reports a negative volume while muted
            read: `return typeof val === 'number' && val < 0 ? 0 : val;`
          },
          set: {
            mode: "auto",
            type: "state",
            role: ["level.volume"],
            scale: { min: (_c = page.media.minValue) != null ? _c : 0, max: (_d = page.media.maxValue) != null ? _d : 100 },
            regexp: /\.Volume$/,
            dp: ""
          }
        },
        // group volume is handled in PageMedia (relative change for all sync members)
        useGroupVolume: {
          mode: "auto",
          type: "triggered",
          regexp: /\.SyncSlaves$/,
          dp: "",
          read: `return typeof val === 'string' && val.trim() !== '';`
        },
        artist: {
          value: {
            mode: "auto",
            type: "state",
            role: "media.artist",
            regexp: /\.Artist$/,
            dp: ""
          },
          true: page.media.colorMediaArtist ? {
            color: await configManager.getIconColor(page.media.colorMediaArtist)
          } : void 0
        },
        // 0 = off, 1 = songs, 2 = albums - cycled in PageMedia
        shuffle: {
          value: {
            mode: "auto",
            type: "state",
            role: "media.mode.shuffle",
            regexp: /\.PlaylistShuffle$/,
            dp: ""
          },
          set: {
            mode: "auto",
            type: "state",
            role: "media.mode.shuffle",
            regexp: /\.PlaylistShuffle$/,
            dp: ""
          }
        },
        icon: {
          type: "const",
          constVal: "dialpad"
        },
        // state: 0 = pause, 1 = play, 2 = stop
        play: {
          mode: "auto",
          type: "state",
          role: "media.state",
          regexp: /\.state$/,
          dp: "",
          write: "return 1;"
        },
        pause: {
          mode: "auto",
          type: "state",
          role: "media.state",
          regexp: /\.state$/,
          dp: "",
          write: "return 0;"
        },
        stop: {
          mode: "auto",
          type: "state",
          role: "media.state",
          regexp: /\.state$/,
          dp: "",
          write: "return 2;"
        },
        isPlaying: {
          mode: "auto",
          type: "triggered",
          role: "media.state",
          regexp: /\.Mode$/,
          dp: "",
          read: `return val === 'play';`
        },
        power: {
          mode: "auto",
          type: "triggered",
          regexp: /\.Power$/,
          dp: "",
          read: "return !!val;",
          write: "return val ? 1 : 0;"
        },
        forward: {
          mode: "auto",
          type: "state",
          regexp: /\.btnForward$/,
          dp: ""
        },
        backward: {
          mode: "auto",
          type: "state",
          regexp: /\.btnRewind$/,
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
            regexp: /\.Connected$/,
            dp: "",
            read: "return !!val;"
          }
        },
        enabled: {
          mode: "auto",
          type: "triggered",
          regexp: /\.Connected$/,
          dp: "",
          read: "return !val;"
        }
      }
    });
  }
  if (!((_h = page.media.deactivateDefaultItems) == null ? void 0 : _h.speakerList)) {
    const list = page.media.speakerList;
    const names = devices.rows.filter((v) => v && v.id && v.id.split(".").length === 4).map((v) => tools.getStringFromStringOrTranslated(adapter, v.value.common.name)).filter((n) => !list || list.length === 0 || list.includes(n));
    if (names.length > 1) {
      gridItem.pageItems.push({
        role: "SqueezeboxSpeaker",
        type: "button",
        data: {
          entity1: {
            value: {
              type: "triggered",
              dp: `${str}.SyncSlaves`,
              read: `return typeof val === 'string' && val.trim() !== '';`
            }
          },
          icon: {
            true: {
              value: { type: "const", constVal: "speaker-multiple" },
              color: await configManager.getIconColor((_i = page.media.itemsColorOn) == null ? void 0 : _i.speakerList, import_Color.Color.good)
            },
            false: {
              value: { type: "const", constVal: "speaker-multiple" },
              color: await configManager.getIconColor((_j = page.media.itemsColorOff) == null ? void 0 : _j.speakerList, import_Color.Color.bad)
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
  if (!((_k = page.media.deactivateDefaultItems) == null ? void 0 : _k.favoriteList)) {
    gridItem.pageItems.push({
      role: "squeezebox-favorites",
      type: "input_sel",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "playlist-star" },
            color: await configManager.getIconColor((_l = page.media.itemsColorOn) == null ? void 0 : _l.favoriteList, import_Color.Color.activated)
          }
        },
        entityInSel: {
          value: {
            mode: "auto",
            type: "state",
            regexp: /\.cmdPlayFavorite$/,
            dp: ""
          },
          set: {
            mode: "auto",
            type: "state",
            regexp: /\.cmdPlayFavorite$/,
            dp: ""
          }
        },
        valueList: {
          type: "const",
          constVal: JSON.stringify(page.media.favoriteList || [])
        },
        headline: {
          type: "const",
          constVal: "favoriteList"
        }
      }
    });
  }
  if (!((_m = page.media.deactivateDefaultItems) == null ? void 0 : _m.playList)) {
    gridItem.pageItems.push({
      role: "squeezebox-playlist",
      type: "input_sel",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "playlist-play" },
            color: await configManager.getIconColor((_n = page.media.itemsColorOn) == null ? void 0 : _n.playList, import_Color.Color.activated)
          }
        },
        entityInSel: {
          value: {
            mode: "auto",
            type: "state",
            regexp: /\.cmdGeneral$/,
            dp: ""
          },
          set: {
            mode: "auto",
            type: "state",
            regexp: /\.cmdGeneral$/,
            dp: "",
            write: `return '"playlistcontrol","cmd:load","playlist_id:' + val + '"';`
          }
        },
        // whitelist of playlist names
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
  if (((_o = page.media.deactivateDefaultItems) == null ? void 0 : _o.trackList) !== true) {
    gridItem.pageItems.push({
      role: "spotify-tracklist",
      type: "input_sel",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "animation-play-outline" },
            color: await configManager.getIconColor((_p = page.media.itemsColorOn) == null ? void 0 : _p.playList, import_Color.Color.activated)
          }
        },
        entityInSel: {
          value: {
            mode: "auto",
            type: "triggered",
            regexp: /\.PlaylistCurrentIndex$/,
            dp: "",
            read: `
                            const n = parseInt(val);
                            return Number.isNaN(n) ? null : n + 1;`
          },
          set: {
            mode: "auto",
            type: "state",
            regexp: /\.PlaylistCurrentIndex$/,
            dp: "",
            // the adapter expects a string
            write: `return String(parseInt(val) - 1);`
          }
        },
        valueList: {
          type: "const",
          constVal: JSON.stringify([])
        },
        valueList2: {
          mode: "auto",
          type: "triggered",
          regexp: /\.Playlist$/,
          dp: "",
          read: `
                        let data = val;
                        if (typeof val === 'string') {
                            try {
                                data = JSON.parse(val);
                            } catch {
                                return [];
                            }
                        }
                        if (!Array.isArray(data)) {
                            return [];
                        }
                        return data.map(item => ({
                            id: item.id,
                            title: item.title || item.RadioName || item.url || '',
                        }));`
        },
        headline: {
          type: "const",
          constVal: "trackList"
        }
      }
    });
  }
  if (!((_q = page.media.deactivateDefaultItems) == null ? void 0 : _q.repeat)) {
    const tempOn = await configManager.getIconColor((_r = page.media.itemsColorOn) == null ? void 0 : _r.repeat);
    const tempOff = await configManager.getIconColor((_s = page.media.itemsColorOff) == null ? void 0 : _s.repeat);
    let colorOn;
    let colorOff;
    if (tempOn && tempOn.type === "const" && import_Color.Color.isRGB(tempOn.constVal)) {
      colorOn = tempOn.constVal;
    }
    if (tempOff && tempOff.type === "const" && import_Color.Color.isRGB(tempOff.constVal)) {
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
              regexp: /\.PlaylistRepeat$/,
              dp: "",
              read: `switch (val) {
                                    case 1:
                                        return 'repeat-once';
                                    case 2:
                                        return 'repeat-variant';
                                }
                                return 'repeat';`
            },
            color: {
              mode: "auto",
              type: "state",
              role: "media.mode.repeat",
              regexp: /\.PlaylistRepeat$/,
              dp: "",
              read: `switch (val) {
                                    case 1:
                                        return ${colorOn ? JSON.stringify(colorOn) : "Color.option4"};
                                    case 2:
                                        return ${colorOn ? JSON.stringify(colorOn) : "Color.activated"};
                                }
                                return ${colorOff ? JSON.stringify(colorOff) : "Color.deactivated"};`
            }
          }
        },
        entity1: {
          value: {
            mode: "auto",
            type: "triggered",
            role: "media.mode.repeat",
            regexp: /\.PlaylistRepeat$/,
            dp: "",
            read: `
                            switch (val) {
                                case 1:
                                    return 'ONE';
                                case 2:
                                    return 'ALL';
                            }
                            return 'OFF';
                        `
          },
          // cycle OFF -> ALL -> ONE -> OFF
          set: {
            mode: "auto",
            type: "state",
            role: "media.mode.repeat",
            regexp: /\.PlaylistRepeat$/,
            dp: "",
            write: `
                            switch (val) {
                                case 'OFF':
                                    return 2;
                                case 'ALL':
                                    return 1;
                            }
                            return 0;`
          }
        }
      }
    });
  }
  if (!((_t = page.media.deactivateDefaultItems) == null ? void 0 : _t.clock)) {
    gridItem.pageItems.push({
      template: "text.clock",
      dpInit: "",
      data: {
        icon: {
          true: {
            color: ((_u = page.media.itemsColorOn) == null ? void 0 : _u.clock) ? await configManager.getIconColor((_v = page.media.itemsColorOn) == null ? void 0 : _v.clock) : void 0
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
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "volume-source" },
            color: await configManager.getIconColor(
              (_w = page.media.itemsColorOn) == null ? void 0 : _w.volumePresets,
              import_Color.Color.activated
            )
          }
        },
        entityInSel: {
          value: {
            mode: "auto",
            type: "state",
            role: ["level.volume"],
            scale: { min: (_x = page.media.minValue) != null ? _x : 0, max: (_y = page.media.maxValue) != null ? _y : 100 },
            regexp: /\.Volume$/,
            dp: ""
          },
          set: {
            mode: "auto",
            type: "state",
            role: ["level.volume"],
            scale: { min: (_z = page.media.minValue) != null ? _z : 0, max: (_A = page.media.maxValue) != null ? _A : 100 },
            regexp: /\.Volume$/,
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
  return { gridItem, messages };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getPageSqueezebox
});
//# sourceMappingURL=getSqueezebox.js.map
