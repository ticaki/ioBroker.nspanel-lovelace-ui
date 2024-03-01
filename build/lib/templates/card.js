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
var card_exports = {};
__export(card_exports, {
  cardTemplates: () => cardTemplates
});
module.exports = __toCommonJS(card_exports);
var Color = __toESM(require("../const/Color"));
const cardTemplates = {
  "entities.waste-calendar": {
    // Abfallkalender
    adapter: "0_userdata.0",
    card: "cardEntities",
    alwaysOn: "none",
    useColor: false,
    config: {
      card: "cardEntities",
      data: {
        headline: {
          type: "const",
          constVal: "Waste dates"
        }
      }
    },
    pageItems: [
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "trash-can" },
              color: { type: "state", dp: "", regexp: /\.1\.color$/, mode: "auto", role: "state" }
            }
          },
          entity1: {
            value: { type: "const", constVal: true }
          },
          text: {
            true: { type: "state", dp: ".1.event", mode: "auto", role: "state" },
            false: void 0
          },
          text1: {
            true: { type: "state", dp: ".1.date", mode: "auto", role: "state" },
            false: void 0
          }
        }
      },
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "trash-can" },
              color: { type: "state", dp: "", regexp: /\.2\.color$/, mode: "auto", role: "state" }
            }
          },
          entity1: {
            value: { type: "const", constVal: true }
          },
          text: {
            true: { type: "state", dp: ".2.event", mode: "auto", role: "state" },
            false: void 0
          },
          text1: {
            true: { type: "state", dp: ".2.date", mode: "auto", role: "state" },
            false: void 0
          }
        }
      },
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "trash-can" },
              color: { type: "state", dp: "", regexp: /\.3\.color$/, mode: "auto", role: "state" }
            }
          },
          entity1: {
            value: { type: "const", constVal: true }
          },
          text: {
            true: { type: "state", dp: ".3.event", mode: "auto", role: "state" },
            false: void 0
          },
          text1: {
            true: { type: "state", dp: ".3.date", mode: "auto", role: "state" },
            false: void 0
          }
        }
      },
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "trash-can" },
              color: { type: "state", dp: "", regexp: /\.4\.color$/, mode: "auto", role: "state" }
            }
          },
          entity1: {
            value: { type: "const", constVal: true }
          },
          text: {
            true: { type: "state", dp: ".4.event", mode: "auto", role: "state" },
            false: void 0
          },
          text1: {
            true: { type: "state", dp: ".4.date", mode: "auto", role: "state" },
            false: void 0
          }
        }
      }
    ],
    items: void 0
  },
  "media.spotify-premium": {
    //cardMedia
    card: "cardMedia",
    adapter: "",
    alwaysOn: "none",
    config: {
      card: "cardMedia",
      data: {
        headline: {
          type: "const",
          constVal: "Spotify-Premium"
        },
        alwaysOnDisplay: {
          type: "const",
          constVal: "none"
        },
        album: {
          mode: "auto",
          role: "value",
          type: "triggered",
          dp: "",
          regexp: /\.player\.album$/
        },
        title: {
          on: {
            type: "const",
            constVal: true
          },
          text: {
            mode: "auto",
            role: "value",
            type: "triggered",
            dp: ".player.trackName"
          },
          color: {
            type: "const",
            constVal: { r: 250, g: 2, b: 3 }
          }
        },
        duration: {
          mode: "auto",
          type: "state",
          role: "value",
          dp: ".player.durationMs",
          read: "return Math.floor(val/1000);"
        },
        elapsed: {
          mode: "auto",
          type: "triggered",
          role: "value",
          dp: ".player.progressMs",
          read: "return Math.floor(val/1000);"
        },
        volume: {
          value: {
            mode: "auto",
            type: "state",
            role: "value",
            response: "now",
            scale: { min: 0, max: 100 },
            dp: ".player.device.volume"
          },
          set: {
            mode: "auto",
            type: "state",
            role: "value",
            response: "now",
            scale: { min: 0, max: 100 },
            dp: ".player.volume"
          }
        },
        artist: {
          on: {
            type: "const",
            constVal: true
          },
          text: {
            mode: "auto",
            type: "state",
            role: "value",
            dp: ".player.artistName"
          },
          color: void 0,
          icon: {
            type: "const",
            constVal: "diameter"
          },
          list: void 0
        },
        shuffle: {
          value: {
            mode: "auto",
            type: "triggered",
            role: "value",
            dp: ".player.shuffle",
            read: 'return val === "on";',
            write: 'return val === "ON" ? "on" : "off";'
          },
          set: {
            mode: "auto",
            type: "state",
            role: "value",
            dp: ".player.shuffle",
            read: 'return val === "on";',
            write: 'return val === "ON" ? "on" : "off";'
          }
        },
        icon: {
          type: "const",
          constVal: "dialpad"
        },
        play: {
          mode: "auto",
          type: "state",
          role: "button",
          dp: "",
          regexp: /\.player\.play$/
        },
        mediaState: {
          mode: "auto",
          type: "triggered",
          role: "value",
          dp: ".player.isPlaying"
        },
        stop: {
          mode: "auto",
          type: "state",
          role: "button",
          dp: ".player.pause"
        },
        pause: {
          mode: "auto",
          type: "state",
          role: "button",
          dp: ".player.pause"
        },
        forward: {
          mode: "auto",
          type: "state",
          role: "button",
          dp: ".player.skipPlus"
        },
        backward: {
          mode: "auto",
          type: "state",
          role: "button",
          dp: ".player.skipMinus"
        },
        logo: {
          on: {
            type: "const",
            constVal: true
          },
          text: { type: "const", constVal: "1" },
          icon: { type: "const", constVal: "home" },
          color: { type: "const", constVal: { r: 250, b: 250, g: 0 } },
          list: void 0,
          action: "cross"
        }
      }
    },
    items: void 0,
    pageItems: [
      {
        role: "spotify-playlist",
        type: "input_sel",
        dpInit: "",
        data: {
          color: {
            true: {
              type: "const",
              constVal: Color.HMIOn
            },
            false: void 0
          },
          icon: {
            true: {
              value: { type: "const", constVal: "playlist-music" },
              color: { type: "const", constVal: Color.Green }
            }
          },
          entityInSel: {
            value: {
              mode: "auto",
              role: "value",
              type: "triggered",
              regexp: /\.player\.trackName$/,
              dp: ""
            }
          },
          text: {
            true: void 0,
            false: void 0
          },
          /**
           * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
           */
          valueList: {
            type: "triggered",
            mode: "auto",
            role: "value",
            dp: ".player.playlist.trackListArray"
          },
          setValue1: {
            role: "",
            mode: "auto",
            type: "state",
            dp: "",
            regexp: /\.player\.playlist\.trackNo$/
          }
          /**
           * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
           */
          //setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
        }
      },
      {
        role: "2values",
        type: "input_sel",
        dpInit: "",
        data: {
          color: {
            true: {
              type: "const",
              constVal: Color.HMIOn
            },
            false: void 0
          },
          icon: {
            true: {
              value: { type: "const", constVal: "playlist-play" },
              color: { type: "const", constVal: Color.Green }
            }
          },
          entityInSel: {
            value: {
              mode: "auto",
              role: "value",
              type: "triggered",
              dp: "",
              regexp: /\.playlists\.playlistList$/
            }
          },
          text: {
            true: void 0,
            false: void 0
          },
          /**
           * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
           */
          valueList: {
            mode: "auto",
            role: "value",
            type: "triggered",
            dp: "",
            regexp: /\.playlists\.playlistListIds$/,
            read: 'return val ? val.split(";") : []'
          },
          valueList2: {
            mode: "auto",
            role: "value",
            type: "triggered",
            dp: "",
            regexp: /\.playlists\.playlistListString$/,
            read: 'return val ? val.split(";") : []'
          },
          setValue1: void 0
          /**
           * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
           */
          //setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
        }
      },
      {
        role: "text.list",
        type: "input_sel",
        dpInit: "",
        data: {
          color: {
            true: {
              type: "const",
              constVal: Color.HMIOn
            },
            false: void 0
          },
          icon: {
            true: {
              value: { type: "const", constVal: "home" },
              color: { type: "const", constVal: Color.Green }
            },
            false: {
              value: { type: "const", constVal: "fan" },
              color: { type: "const", constVal: Color.Red }
            },
            scale: void 0,
            maxBri: void 0,
            minBri: void 0
          },
          entityInSel: {
            value: {
              type: "const",
              constVal: true
            }
          },
          text: {
            true: void 0,
            false: void 0
          },
          /**
           * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
           */
          valueList: { type: "const", constVal: "home?butter" },
          /**
           * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
           */
          setList: { type: "const", constVal: "0_userdata.0.test?1|0_userdata.0.test?2" }
        }
      },
      {
        role: "text.list",
        type: "button",
        dpInit: "",
        data: {
          color: {
            true: {
              type: "const",
              constVal: Color.HMIOn
            },
            false: void 0,
            scale: void 0
          },
          icon: {
            true: {
              value: { type: "const", constVal: "home" },
              color: { type: "const", constVal: Color.Green }
            },
            false: {
              value: { type: "const", constVal: "fan" },
              color: { type: "const", constVal: Color.Red }
            },
            scale: void 0,
            maxBri: void 0,
            minBri: void 0
          },
          entity1: {
            value: {
              type: "const",
              constVal: true
            }
          },
          text: {
            true: void 0,
            false: void 0
          }
        }
      },
      {
        role: "text.list",
        type: "button",
        dpInit: "",
        data: {
          color: {
            true: {
              type: "const",
              constVal: Color.HMIOn
            },
            false: void 0,
            scale: void 0
          },
          icon: {
            true: {
              value: { type: "const", constVal: "home" },
              color: { type: "const", constVal: Color.Green }
            },
            false: {
              value: { type: "const", constVal: "fan" },
              color: { type: "const", constVal: Color.Red }
            },
            scale: void 0,
            maxBri: void 0,
            minBri: void 0
          },
          entity1: {
            value: {
              type: "const",
              constVal: true
            }
          },
          text: {
            true: void 0,
            false: void 0
          }
        }
      },
      {
        role: "text.list",
        type: "button",
        dpInit: "",
        data: {
          color: {
            true: {
              type: "const",
              constVal: Color.HMIOn
            },
            false: void 0,
            scale: void 0
          },
          icon: {
            true: {
              value: { type: "const", constVal: "home" },
              color: { type: "const", constVal: Color.Green }
            },
            false: {
              value: { type: "const", constVal: "fan" },
              color: { type: "const", constVal: Color.Red }
            },
            scale: void 0,
            maxBri: void 0,
            minBri: void 0
          },
          entity1: {
            value: {
              type: "const",
              constVal: true
            }
          },
          text: {
            true: void 0,
            false: void 0
          }
        }
      },
      {
        role: "text.list",
        type: "button",
        dpInit: "",
        data: {
          color: {
            true: {
              type: "const",
              constVal: Color.HMIOn
            },
            false: void 0,
            scale: void 0
          },
          icon: {
            true: {
              value: { type: "const", constVal: "home" },
              color: { type: "const", constVal: Color.Green }
            },
            false: {
              value: { type: "const", constVal: "fan" },
              color: { type: "const", constVal: Color.Red }
            },
            scale: void 0,
            maxBri: void 0,
            minBri: void 0
          },
          entity1: {
            value: {
              type: "const",
              constVal: true
            }
          },
          text: {
            true: void 0,
            false: void 0
          }
        }
      },
      {
        role: "text.list",
        type: "button",
        dpInit: "",
        data: {
          color: {
            true: {
              type: "const",
              constVal: Color.HMIOn
            },
            false: void 0,
            scale: void 0
          },
          icon: {
            true: {
              value: { type: "const", constVal: "home" },
              color: { type: "const", constVal: Color.Green }
            },
            false: {
              value: { type: "const", constVal: "fan" },
              color: { type: "const", constVal: Color.Red }
            },
            scale: void 0,
            maxBri: void 0,
            minBri: void 0
          },
          entity1: {
            value: {
              type: "const",
              constVal: true
            }
          },
          text: {
            true: void 0,
            false: void 0
          }
        }
      }
    ],
    useColor: false
  },
  "entities.departure-timetable": {
    //Anzeigetafel Fahrplan
    adapter: "fahrplan.0",
    card: "cardEntities",
    alwaysOn: "none",
    useColor: false,
    config: {
      card: "cardEntities",
      data: {
        headline: {
          type: "const",
          constVal: "departure"
        }
      }
    },
    pageItems: [
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.0\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: Color.Red }
            },
            false: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.0\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: Color.Green }
            }
          },
          entity1: {
            value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.0\.DepartureDelayed$/ }
          },
          entity2: {
            value: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.0\.Departure$/,
              read: "return val === 0 ? null : val"
            },
            dateFormat: {
              type: "const",
              constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
            }
          },
          text: {
            true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.0\.Direction$/ },
            false: void 0
          },
          text1: {
            true: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.0\.DeparturePlanned$/,
              read: `{ return new Date(val).toLocaleTimeString().slice(0,5) }`
            },
            false: void 0
          }
        }
      },
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.1\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: Color.Red }
            },
            false: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.1\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: Color.Green }
            }
          },
          entity1: {
            value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.1\.DepartureDelayed$/ }
          },
          entity2: {
            value: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.1\.Departure$/,
              read: "return val === 0 ? null : val"
            },
            dateFormat: {
              type: "const",
              constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
            }
          },
          text: {
            true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.1\.Direction$/ },
            false: void 0
          },
          text1: {
            true: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.1\.DeparturePlanned$/,
              read: `{ return new Date(val).toLocaleTimeString().slice(0,5) }`
            },
            false: void 0
          }
        }
      },
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.2\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: Color.Red }
            },
            false: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.2\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: Color.Green }
            }
          },
          entity1: {
            value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.2\.DepartureDelayed$/ }
          },
          entity2: {
            value: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.2\.Departure$/,
              read: "return val === 0 ? null : val"
            },
            dateFormat: {
              type: "const",
              constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
            }
          },
          text: {
            true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.2\.Direction$/ },
            false: void 0
          },
          text1: {
            true: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.2\.DeparturePlanned$/,
              read: `{ return new Date(val).toLocaleTimeString().slice(0,5) }`
            },
            false: void 0
          }
        }
      },
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.3\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: Color.Red }
            },
            false: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.3\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: Color.Green }
            }
          },
          entity1: {
            value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.3\.DepartureDelayed$/ }
          },
          entity2: {
            value: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.3\.Departure$/,
              read: "return val === 0 ? null : val"
            },
            dateFormat: {
              type: "const",
              constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
            }
          },
          text: {
            true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.3\.Direction$/ },
            false: void 0
          },
          text1: {
            true: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.3\.DeparturePlanned$/,
              read: `{ return new Date(val).toLocaleTimeString().slice(0,5) }`
            },
            false: void 0
          }
        }
      }
    ],
    items: void 0
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cardTemplates
});
//# sourceMappingURL=card.js.map
