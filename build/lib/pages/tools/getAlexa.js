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
var getAlexa_exports = {};
__export(getAlexa_exports, {
  getPageAlexa: () => getPageAlexa
});
module.exports = __toCommonJS(getAlexa_exports);
var import_Color = require("../../const/Color");
var tools = __toESM(require("../../const/tools"));
async function getPageAlexa(configManager, page, gridItem, messages) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  const adapter = configManager.adapter;
  const arr = page.media.id.split(".").slice(0, 3);
  const str = arr.join(".");
  const devices = str && arr.length === 3 ? await configManager.adapter.getObjectViewAsync("system", "device", {
    startkey: `${str}.`,
    endkey: `${str}${String.fromCharCode(65533)}`
  }) : { rows: [] };
  if (devices && devices.rows && devices.rows.length > 0) {
    if (devices.rows.findIndex((row) => {
      if (row && row.value && row.id && row.id.split(".").length === 4) {
        return page.media.id === row.id;
      }
    }) === -1) {
      const msg = `${page.uniqueName}: Media page id ${page.media.id} is not a valid alexa2 device!`;
      messages.push(msg);
      adapter.log.warn(msg);
      return { gridItem, messages };
    }
  }
  gridItem.dpInit = tools.getRegExp(`/^${page.media.id.split(".").join("\\.")}/`) || page.media.id;
  gridItem = {
    ...gridItem,
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
          regexp: /.?\.Player\..?/,
          dp: ""
        },
        title: {
          value: {
            mode: "auto",
            type: "triggered",
            role: "media.title",
            regexp: /.?\.Player\..?/,
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
          regexp: /.?\.Player\..?/,
          dp: "",
          read: `return val ? val*1000 : val;`
        },
        onOffColor: {
          true: page.media.colorMediaIcon ? { color: await configManager.getIconColor(page.media.colorMediaIcon) } : void 0
        },
        elapsed: {
          mode: "auto",
          type: "triggered",
          role: ["media.elapsed", "media.elapsed.text"],
          regexp: /.?\.Player\..?/,
          dp: ""
        },
        volume: {
          value: {
            mode: "auto",
            type: "state",
            role: ["level.volume"],
            scale: { min: (_a = page.media.minValue) != null ? _a : 0, max: (_b = page.media.maxValue) != null ? _b : 100 },
            regexp: /.?\.Player\..?/,
            dp: ""
          },
          set: {
            mode: "auto",
            type: "state",
            role: ["level.volume"],
            scale: { min: (_c = page.media.minValue) != null ? _c : 0, max: (_d = page.media.maxValue) != null ? _d : 100 },
            regexp: /.?\.Player\..?/,
            dp: ""
          }
        },
        artist: {
          value: {
            mode: "auto",
            type: "state",
            role: "media.artist",
            regexp: /.?\.Player\..?/,
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
            regexp: /.?\.Player\..?/,
            dp: ""
          },
          set: {
            mode: "auto",
            type: "state",
            role: "media.mode.shuffle",
            regexp: /.?\.Player\..?/,
            dp: ""
          },
          enabled: {
            mode: "auto",
            type: "triggered",
            role: "indicator",
            regexp: /.?\.Player\.allowShuffle$/,
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
          regexp: /.?\.Player\..?/,
          dp: ""
        },
        isPlaying: {
          mode: "auto",
          type: "triggered",
          role: ["media.state"],
          regexp: /.?\.Player\..?/,
          dp: ""
        },
        mediaState: {
          mode: "auto",
          type: "triggered",
          role: ["media.state"],
          regexp: /.?\.Player\..?/,
          dp: ""
        },
        stop: {
          mode: "auto",
          type: "state",
          role: ["button.stop"],
          regexp: /.?\.Player\..?/,
          dp: ""
        },
        pause: {
          mode: "auto",
          type: "state",
          role: "button.pause",
          regexp: /.?\.Player\..?/,
          dp: ""
        },
        forward: {
          mode: "auto",
          type: "state",
          role: "button.next",
          regexp: /.?\.Player\..?/,
          dp: ""
        },
        backward: {
          mode: "auto",
          type: "state",
          role: "button.prev",
          regexp: /.?\.Player\..?/,
          dp: ""
        },
        logo: {
          on: {
            type: "const",
            constVal: true
          },
          text: { type: "const", constVal: "1" },
          icon: { true: { type: "const", constVal: "logo-alexa" } },
          color: { type: "const", constVal: { r: 250, b: 250, g: 0 } },
          list: void 0,
          action: "cross"
        }
      }
    },
    items: void 0,
    pageItems: [
      //reminder
      {
        role: "text.list",
        type: "text",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "reminder" },
              color: await configManager.getIconColor(
                (_e = page.media.itemsColorOff) == null ? void 0 : _e.reminder,
                import_Color.Color.attention
              )
            }
          },
          entity1: {
            value: {
              type: "const",
              constVal: true
            }
          },
          enabled: {
            mode: "auto",
            type: "triggered",
            role: "value",
            regexp: /.?\.Reminder\.triggered$/,
            dp: "",
            read: "return (val != null && lc <= Date.now() + 120000 ? true : false);"
          }
        }
      },
      // online
      {
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
              regexp: /.?\.online$/,
              dp: ""
            }
          },
          enabled: {
            mode: "auto",
            type: "triggered",
            role: "indicator.reachable",
            regexp: /.?\.online$/,
            dp: "",
            read: "return !val;"
          }
        }
      },
      //speaker select
      {
        role: "alexa-speaker",
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
              color: await configManager.getIconColor((_h = page.media.itemsColorOn) == null ? void 0 : _h.speakerList, import_Color.Color.good)
            },
            false: {
              value: { type: "const", constVal: "speaker-multiple" },
              color: await configManager.getIconColor((_i = page.media.itemsColorOff) == null ? void 0 : _i.speakerList, import_Color.Color.bad)
            },
            scale: void 0,
            maxBri: void 0,
            minBri: void 0
          },
          entityInSel: {
            value: {
              mode: "auto",
              type: "triggered",
              regexp: /.?\.Info\.name$/,
              dp: ""
            },
            set: {
              mode: "auto",
              type: "state",
              regexp: /.?\.Commands\.textCommand$/,
              dp: ""
            },
            decimal: void 0,
            factor: void 0,
            unit: void 0
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
      },
      //playlist select
      {
        role: "alexa-playlist",
        type: "input_sel",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "playlist-play" },
              color: await configManager.getIconColor((_j = page.media.itemsColorOn) == null ? void 0 : _j.playList, import_Color.Color.activated)
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
      },
      //equalizer
      {
        role: "",
        type: "number",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "equalizer-outline" },
              color: await configManager.getIconColor(
                (_k = page.media.itemsColorOn) == null ? void 0 : _k.equalizer,
                import_Color.Color.activated
              )
            },
            scale: void 0,
            maxBri: void 0,
            minBri: void 0
          },
          heading1: {
            type: "const",
            constVal: "treble"
          },
          heading2: {
            type: "const",
            constVal: "midrange"
          },
          heading3: {
            type: "const",
            constVal: "bass"
          },
          zero1: {
            type: "const",
            constVal: 6
          },
          zero2: {
            type: "const",
            constVal: 6
          },
          zero3: {
            type: "const",
            constVal: 6
          },
          entity1: {
            value: {
              mode: "auto",
              type: "state",
              regexp: /.?\.Preferences\.equalizerTreble$/,
              dp: ""
            },
            minScale: {
              type: "const",
              constVal: -6
            },
            maxScale: {
              type: "const",
              constVal: 6
            },
            decimal: {
              type: "const",
              constVal: 0
            }
          },
          minValue1: {
            type: "const",
            constVal: 0
          },
          maxValue1: {
            type: "const",
            constVal: 12
          },
          entity2: {
            value: {
              mode: "auto",
              type: "state",
              regexp: /.?\.Preferences\.equalizerMidRange$/,
              dp: ""
            },
            minScale: {
              type: "const",
              constVal: -6
            },
            maxScale: {
              type: "const",
              constVal: 6
            },
            decimal: {
              type: "const",
              constVal: 0
            }
          },
          minValue2: {
            type: "const",
            constVal: 0
          },
          maxValue2: {
            type: "const",
            constVal: 12
          },
          entity3: {
            value: {
              mode: "auto",
              type: "state",
              regexp: /.?\.Preferences\.equalizerBass$/,
              dp: ""
            },
            minScale: {
              type: "const",
              constVal: -6
            },
            maxScale: {
              type: "const",
              constVal: 6
            },
            decimal: {
              type: "const",
              constVal: 0
            }
          },
          minValue3: {
            type: "const",
            constVal: 0
          },
          maxValue3: {
            type: "const",
            constVal: 12
          },
          text: {
            true: {
              type: "const",
              constVal: "equalizer"
            }
          }
        }
      },
      // repeat
      {
        role: "",
        type: "text",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "repeat-variant" },
              color: await configManager.getIconColor((_l = page.media.itemsColorOn) == null ? void 0 : _l.repeat, import_Color.Color.activated)
            },
            false: {
              value: { type: "const", constVal: "repeat" },
              color: await configManager.getIconColor(
                (_m = page.media.itemsColorOff) == null ? void 0 : _m.repeat,
                import_Color.Color.deactivated
              )
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
              regexp: /\.Player\.controlRepeat$/,
              dp: ""
            }
          },
          enabled: {
            mode: "auto",
            type: "triggered",
            role: "indicator",
            regexp: /\.Player\.allowRepeat$/,
            dp: ""
          }
        }
      }
    ],
    uniqueID: page.uniqueName
  };
  return { gridItem, messages };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getPageAlexa
});
//# sourceMappingURL=getAlexa.js.map
