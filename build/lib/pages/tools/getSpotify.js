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
async function getPageSpotify(configManager, page, gridItem, messages) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  gridItem.dpInit = `/^${page.media.id.split(".").slice(0, 2).join("\\.")}\\./`;
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
          regexp: /.?\.player\.progress$/,
          dp: ""
        },
        volume: {
          value: {
            mode: "auto",
            type: "state",
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
            type: "state",
            role: "",
            regexp: /.?\.player\.shuffle$/,
            dp: "",
            read: `return val == 'on' || val == 'ON';`
          },
          set: {
            mode: "auto",
            type: "state",
            role: "",
            regexp: /.?\.player\.shuffle$/,
            dp: "",
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
        },
        logo: {
          on: {
            type: "const",
            constVal: true
          },
          text: { type: "const", constVal: "1" },
          icon: { true: { type: "const", constVal: "logo-spotify" } },
          color: { type: "const", constVal: { r: 250, b: 250, g: 0 } },
          list: void 0,
          action: "cross"
        }
      }
    },
    items: void 0,
    pageItems: [
      // online
      {
        role: "",
        type: "text",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "wifi" },
              color: await configManager.getIconColor((_e = page.media.itemsColorOn) == null ? void 0 : _e.online, import_Color.Color.good)
            },
            false: {
              value: { type: "const", constVal: "wifi-off" },
              color: await configManager.getIconColor((_f = page.media.itemsColorOff) == null ? void 0 : _f.online, import_Color.Color.attention)
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
      },
      //speaker select
      {
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
              color: await configManager.getIconColor((_g = page.media.itemsColorOn) == null ? void 0 : _g.speakerList, import_Color.Color.good)
            },
            false: {
              value: { type: "const", constVal: "speaker-multiple" },
              color: await configManager.getIconColor((_h = page.media.itemsColorOff) == null ? void 0 : _h.speakerList, import_Color.Color.bad)
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
          },
          /**
           * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
           */
          setList: { type: "const", constVal: "0_userdata.0.test?1|0_userdata.0.test?2" }
        }
      },
      //playlist select
      {
        role: "spotify-playlist",
        type: "input_sel",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "playlist-play" },
              color: await configManager.getIconColor((_i = page.media.itemsColorOn) == null ? void 0 : _i.playList, import_Color.Color.activated)
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
      },
      {
        role: "spotify-tracklist",
        type: "input_sel",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "animation-play-outline" },
              color: await configManager.getIconColor((_j = page.media.itemsColorOn) == null ? void 0 : _j.playList, import_Color.Color.on)
            }
          },
          entityInSel: {
            value: {
              mode: "auto",
              type: "triggered",
              regexp: /.?\.player\.playlist\.trackList$/,
              dp: ""
            },
            set: {
              mode: "auto",
              type: "state",
              regexp: /.?\.player\.playlist\.trackList$/,
              dp: ""
            }
          },
          valueList: {
            type: "const",
            constVal: JSON.stringify([])
          },
          headline: {
            type: "const",
            constVal: "playList"
          }
        }
      },
      //equalizer
      /*{
                      role: '',
                      type: 'number',
                      dpInit: '',
      
                      data: {
                          icon: {
                              true: {
                                  value: { type: 'const', constVal: 'equalizer-outline' },
                                  color: await configManager.getIconColor(
                                      page.media.itemsColorOn?.equalizer,
                                      Color.activated,
                                  ),
                              },
      
                              scale: undefined,
                              maxBri: undefined,
                              minBri: undefined,
                          },
                          heading1: {
                              type: 'const',
                              constVal: 'treble',
                          },
                          heading2: {
                              type: 'const',
                              constVal: 'midrange',
                          },
                          heading3: {
                              type: 'const',
                              constVal: 'bass',
                          },
                          zero1: {
                              type: 'const',
                              constVal: 6,
                          },
                          zero2: {
                              type: 'const',
                              constVal: 6,
                          },
                          zero3: {
                              type: 'const',
                              constVal: 6,
                          },
                          entity1: {
                              value: {
                                  mode: 'auto',
                                  type: 'state',
                                  regexp: /.?\.Preferences\.equalizerTreble$/,
                                  dp: '',
                              },
                              minScale: {
                                  type: 'const',
                                  constVal: -6,
                              },
                              maxScale: {
                                  type: 'const',
                                  constVal: 6,
                              },
                              decimal: {
                                  type: 'const',
                                  constVal: 0,
                              },
                          },
                          minValue1: {
                              type: 'const',
                              constVal: 0,
                          },
                          maxValue1: {
                              type: 'const',
                              constVal: 12,
                          },
      
                          entity2: {
                              value: {
                                  mode: 'auto',
                                  type: 'state',
                                  regexp: /.?\.Preferences\.equalizerMidRange$/,
                                  dp: '',
                              },
                              minScale: {
                                  type: 'const',
                                  constVal: -6,
                              },
                              maxScale: {
                                  type: 'const',
                                  constVal: 6,
                              },
                              decimal: {
                                  type: 'const',
                                  constVal: 0,
                              },
                          },
                          minValue2: {
                              type: 'const',
                              constVal: 0,
                          },
                          maxValue2: {
                              type: 'const',
                              constVal: 12,
                          },
                          entity3: {
                              value: {
                                  mode: 'auto',
                                  type: 'state',
                                  regexp: /.?\.Preferences\.equalizerBass$/,
                                  dp: '',
                              },
                              minScale: {
                                  type: 'const',
                                  constVal: -6,
                              },
                              maxScale: {
                                  type: 'const',
                                  constVal: 6,
                              },
                              decimal: {
                                  type: 'const',
                                  constVal: 0,
                              },
                          },
                          minValue3: {
                              type: 'const',
                              constVal: 0,
                          },
                          maxValue3: {
                              type: 'const',
                              constVal: 12,
                          },
                          text: {
                              true: {
                                  type: 'const',
                                  constVal: 'equalizer',
                              },
                          },
                      },
                  },*/
      // repeat
      {
        role: "",
        type: "text",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "repeat-variant" },
              color: await configManager.getIconColor((_k = page.media.itemsColorOn) == null ? void 0 : _k.repeat, import_Color.Color.activated)
            },
            false: {
              value: { type: "const", constVal: "repeat" },
              color: await configManager.getIconColor(
                (_l = page.media.itemsColorOff) == null ? void 0 : _l.repeat,
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
  getPageSpotify
});
//# sourceMappingURL=getSpotify.js.map
