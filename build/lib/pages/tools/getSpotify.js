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
var getSpotify_exports = {};
__export(getSpotify_exports, {
  getPageSpotify: () => getPageSpotify
});
module.exports = __toCommonJS(getSpotify_exports);
var import_Color = require("../../const/Color");
async function getPageSpotify(configManager, page, gridItem, messages, justCheck = false) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
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
      logo: {
        type: "number",
        data: {
          text: { true: { type: "const", constVal: "media.seek" } },
          icon: {
            true: {
              value: { type: "const", constVal: "logo-spotify" },
              color: { type: "const", constVal: { r: 250, b: 250, g: 0 } }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              type: "triggered",
              role: "",
              regexp: /.?\.player\.progressPercentage$/,
              dp: ""
            },
            set: {
              mode: "auto",
              type: "state",
              writeable: true,
              role: "",
              regexp: /.?\.player\.progressPercentage$/,
              dp: ""
            }
          }
        }
      },
      data: {
        headline: page.media.name ? await configManager.getFieldAsDataItemConfig(page.media.name) : void 0,
        album: {
          mode: "auto",
          type: "state",
          role: "",
          regexp: /.?\.player\.album$/,
          dp: ""
        },
        title: {
          value: {
            mode: "auto",
            type: "triggered",
            role: "",
            regexp: /.?\.player\.trackName$/,
            dp: ""
          },
          true: page.media.colorMediaArtist ? {
            color: await configManager.getFieldAsDataItemConfig(page.media.colorMediaArtist)
          } : void 0
        },
        duration: {
          mode: "auto",
          type: "state",
          role: "",
          regexp: /.?\.player\.durationMs/,
          dp: ""
        },
        onOffColor: {
          true: page.media.colorMediaIcon ? { color: await configManager.getIconColor(page.media.colorMediaIcon) } : void 0
        },
        elapsed: {
          mode: "auto",
          type: "triggered",
          role: "",
          regexp: /.?\.player\.progressMs$/,
          dp: ""
        },
        volume: {
          value: {
            mode: "auto",
            type: "triggered",
            role: "",
            scale: { min: (_a = page.media.minValue) != null ? _a : 0, max: (_b = page.media.maxValue) != null ? _b : 100 },
            regexp: /.?\.player\.volume$/,
            dp: ""
          },
          set: {
            mode: "auto",
            type: "state",
            role: "",
            scale: { min: (_c = page.media.minValue) != null ? _c : 0, max: (_d = page.media.maxValue) != null ? _d : 100 },
            regexp: /.?\.player\.volume$/,
            dp: ""
          }
        },
        artist: {
          value: {
            mode: "auto",
            type: "state",
            role: "",
            regexp: /.?\.player\.artistName/,
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
            role: "",
            regexp: /.?\.player\.shuffle$/,
            dp: "",
            read: `return val == 'on';`,
            write: `return val === 'ON' || val === true  ? 'on' : 'off';`
          },
          set: {
            mode: "auto",
            type: "state",
            role: "",
            regexp: /.?\.player\.shuffle$/,
            dp: "",
            read: `return val == 'on';`,
            write: `return val === 'ON' || val === true  ? 'on' : 'off';`
          }
          /*enabled: {
                          mode: 'auto',
                          type: 'triggered',
                          role: 'indicator',
                          regexp: /.?\.Player\.allowShuffle$/,
                          dp: '',
                      },*/
        },
        icon: {
          type: "const",
          constVal: "dialpad"
        },
        play: {
          mode: "auto",
          type: "state",
          role: "",
          regexp: /.?\.player\.play$/,
          dp: ""
        },
        isPlaying: {
          mode: "auto",
          type: "triggered",
          role: "",
          regexp: /.?\.player\.isPlaying$/,
          dp: ""
        },
        /*mediaState: {
                        mode: 'auto',
                        type: 'triggered',
                        role: ['media.state'],
                        regexp: /.?\.Player\..?/,
                        dp: '',
                    },*/
        /*stop: {
                        mode: 'auto',
                        type: 'state',
                        role: ['button.stop'],
                        regexp: /.?\.Player\..?/,
                        dp: '',
                    },*/
        pause: {
          mode: "auto",
          type: "state",
          role: "",
          regexp: /.?\.player\.pause$/,
          dp: ""
        },
        forward: {
          mode: "auto",
          type: "state",
          role: "",
          regexp: /.?\.player\.skipPlus$/,
          dp: ""
        },
        backward: {
          mode: "auto",
          type: "state",
          role: "",
          regexp: /.?\.player\.skipMinus$/,
          dp: ""
        }
      }
    },
    items: void 0,
    pageItems: []
  };
  gridItem.pageItems = gridItem.pageItems || [];
  if (((_e = page.media.deactivateDefaultItems) == null ? void 0 : _e.online) !== true) {
    gridItem.pageItems.push(
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
              role: "",
              regexp: /.?\.info\.connection/,
              dp: ""
            }
          },
          enabled: {
            mode: "auto",
            type: "triggered",
            role: "",
            regexp: /.?\.info\.connection/,
            dp: "",
            read: "return !val;"
          }
        }
      }
    );
  }
  if (((_h = page.media.deactivateDefaultItems) == null ? void 0 : _h.speakerList) !== true) {
    gridItem.pageItems.push({
      role: "spotify-speaker",
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
            mode: "auto",
            type: "triggered",
            regexp: /.?\.devices\.deviceList$/,
            dp: ""
          },
          set: {
            mode: "auto",
            type: "state",
            regexp: /.?\.devices\.deviceList$/,
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
        }
      }
    });
  }
  if (((_k = page.media.deactivateDefaultItems) == null ? void 0 : _k.playList) !== true) {
    gridItem.pageItems.push(
      //playlist select
      {
        role: "spotify-playlist",
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
              mode: "auto",
              type: "triggered",
              regexp: /.?\.playlists\.playlistList$/,
              dp: ""
            },
            set: {
              mode: "auto",
              type: "state",
              regexp: /.?\.playlists\.playlistList$/,
              dp: ""
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
      }
    );
  }
  if (((_m = page.media.deactivateDefaultItems) == null ? void 0 : _m.trackList) !== true) {
    gridItem.pageItems.push({
      role: "spotify-tracklist",
      type: "input_sel",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "animation-play-outline" },
            color: await configManager.getIconColor((_n = page.media.itemsColorOn) == null ? void 0 : _n.playList, import_Color.Color.activated)
          }
        },
        entityInSel: {
          value: {
            mode: "auto",
            type: "triggered",
            regexp: /.?\.player\.trackId$/,
            dp: ""
          },
          set: {
            mode: "auto",
            type: "state",
            regexp: /.?\.player\.playlist\.trackNo$/,
            dp: ""
          }
        },
        valueList: {
          type: "const",
          constVal: JSON.stringify([])
        },
        valueList2: {
          type: "triggered",
          mode: "auto",
          regexp: /.?\.player\.playlist\.trackListArray$/,
          dp: ""
        },
        headline: {
          type: "const",
          constVal: "trackList"
        }
      }
    });
  }
  if (!((_o = page.media.deactivateDefaultItems) == null ? void 0 : _o.clock)) {
    gridItem.pageItems.push({
      template: "text.clock",
      dpInit: "",
      data: {
        icon: {
          true: {
            color: ((_p = page.media.itemsColorOn) == null ? void 0 : _p.clock) ? await configManager.getIconColor((_q = page.media.itemsColorOn) == null ? void 0 : _q.clock) : void 0
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
              (_r = page.media.itemsColorOn) == null ? void 0 : _r.volumePresets,
              import_Color.Color.activated
            )
          }
        },
        entityInSel: {
          value: {
            mode: "auto",
            type: "triggered",
            role: "",
            scale: { min: (_s = page.media.minValue) != null ? _s : 0, max: (_t = page.media.maxValue) != null ? _t : 100 },
            regexp: /.?\.player\.volume$/,
            dp: ""
          },
          set: {
            mode: "auto",
            type: "state",
            role: "",
            scale: { min: (_u = page.media.minValue) != null ? _u : 0, max: (_v = page.media.maxValue) != null ? _v : 100 },
            regexp: /.?\.player\.volume$/,
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
  if (((_w = page.media.deactivateDefaultItems) == null ? void 0 : _w.repeat) !== true) {
    const tempOn = await configManager.getIconColor((_x = page.media.itemsColorOn) == null ? void 0 : _x.repeat);
    const tempOff = await configManager.getIconColor((_y = page.media.itemsColorOff) == null ? void 0 : _y.repeat);
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
              role: "",
              regexp: /\.player\.repeat$/,
              dp: "",
              read: `switch (val) {
                                    case 'off':
                                        return 'repeat';
                                    case 'track':
                                        return 'repeat-once';
                                    case 'context':
                                        return 'repeat-variant';
                                    default:
                                        return false;
                                }`
            },
            color: {
              mode: "auto",
              type: "state",
              role: "",
              regexp: /\.player\.repeat$/,
              dp: "",
              read: `switch (val) {
                                    case 'off':
                                        return ${colorOff ? JSON.stringify(colorOff) : "Color.deactivated"};
                                    case 'context':
                                        return ${colorOn ? JSON.stringify(colorOn) : "Color.activated"};
                                    case 'track':
                                        return ${colorOn ? JSON.stringify(colorOn) : "Color.option4"};
                                    default:
                                        return false;
                                }`
            }
          }
        },
        entity1: {
          value: {
            mode: "auto",
            type: "triggered",
            role: "",
            regexp: /\.player\.repeat$/,
            dp: "",
            read: `switch (val) {
                                    case 'off':
                                        return 'OFF';
                                    case 'context':
                                        return 'ALL';
                                    case 'track':
                                        return 'ONE';
                                    default:
                                        return 'OFF';
                                }`,
            write: `switch (val) {
                                    case 'OFF':
                                    case false:
                                        return 'track';
                                    case 'ONE':
                                        return 'context';
                                    case 'ALL':
                                        return 'off';
                                    default:
                                        return 'off';
                                }`
          }
        }
      }
    });
  }
  return { gridItem, messages };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getPageSpotify
});
//# sourceMappingURL=getSpotify.js.map
