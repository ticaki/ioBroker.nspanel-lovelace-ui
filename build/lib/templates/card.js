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
var card_exports = {};
__export(card_exports, {
  cardTemplates: () => cardTemplates
});
module.exports = __toCommonJS(card_exports);
var import_Color = require("../const/Color");
const cardTemplates = {
  "entities.waste-calendar": {
    // Abfallkalender
    adapter: "0_userdata.0",
    card: "cardEntities",
    alwaysOn: "none",
    useColor: false,
    items: void 0,
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
    ]
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
            scale: { min: 0, max: 100 },
            dp: ".player.device.volume"
          },
          set: {
            mode: "auto",
            type: "state",
            role: "value",
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
              constVal: import_Color.Color.HMIOn
            },
            false: void 0
          },
          icon: {
            true: {
              value: { type: "const", constVal: "playlist-music" },
              color: { type: "const", constVal: import_Color.Color.Green }
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
              constVal: import_Color.Color.HMIOn
            },
            false: void 0
          },
          icon: {
            true: {
              value: { type: "const", constVal: "playlist-play" },
              color: { type: "const", constVal: import_Color.Color.Green }
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
              constVal: import_Color.Color.HMIOn
            },
            false: void 0
          },
          icon: {
            true: {
              value: { type: "const", constVal: "home" },
              color: { type: "const", constVal: import_Color.Color.Green }
            },
            false: {
              value: { type: "const", constVal: "fan" },
              color: { type: "const", constVal: import_Color.Color.Red }
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
              constVal: import_Color.Color.HMIOn
            },
            false: void 0,
            scale: void 0
          },
          icon: {
            true: {
              value: { type: "const", constVal: "home" },
              color: { type: "const", constVal: import_Color.Color.Green }
            },
            false: {
              value: { type: "const", constVal: "fan" },
              color: { type: "const", constVal: import_Color.Color.Red }
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
              constVal: import_Color.Color.HMIOn
            },
            false: void 0,
            scale: void 0
          },
          icon: {
            true: {
              value: { type: "const", constVal: "home" },
              color: { type: "const", constVal: import_Color.Color.Green }
            },
            false: {
              value: { type: "const", constVal: "fan" },
              color: { type: "const", constVal: import_Color.Color.Red }
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
              constVal: import_Color.Color.HMIOn
            },
            false: void 0,
            scale: void 0
          },
          icon: {
            true: {
              value: { type: "const", constVal: "home" },
              color: { type: "const", constVal: import_Color.Color.Green }
            },
            false: {
              value: { type: "const", constVal: "fan" },
              color: { type: "const", constVal: import_Color.Color.Red }
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
              constVal: import_Color.Color.HMIOn
            },
            false: void 0,
            scale: void 0
          },
          icon: {
            true: {
              value: { type: "const", constVal: "home" },
              color: { type: "const", constVal: import_Color.Color.Green }
            },
            false: {
              value: { type: "const", constVal: "fan" },
              color: { type: "const", constVal: import_Color.Color.Red }
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
              constVal: import_Color.Color.HMIOn
            },
            false: void 0,
            scale: void 0
          },
          icon: {
            true: {
              value: { type: "const", constVal: "home" },
              color: { type: "const", constVal: import_Color.Color.Green }
            },
            false: {
              value: { type: "const", constVal: "fan" },
              color: { type: "const", constVal: import_Color.Color.Red }
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
  "entities.fahrplan.departure-timetable": {
    //Anzeigetafel Fahrplan
    adapter: "fahrplan.0",
    card: "cardEntities",
    alwaysOn: "none",
    useColor: false,
    items: void 0,
    config: {
      card: "cardEntities",
      scrollType: "page",
      data: {
        headline: {
          type: "const",
          constVal: "departure"
        }
      }
    },
    pageItems: [
      //Abfahrt 1
      //{ template: 'text.fahrplan.departure', dpInit: '/.0/' },
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.0\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Red }
            },
            false: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.0\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Green }
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
      //Abfahrt 2
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.1\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Red }
            },
            false: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.1\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Green }
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
      //Abfahrt 3
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.2\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Red }
            },
            false: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.2\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Green }
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
      //Abfahrt 4
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.3\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Red }
            },
            false: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.3\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Green }
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
      },
      //Abfahrt 5
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.4\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Red }
            },
            false: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.4\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Green }
            }
          },
          entity1: {
            value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.4\.DepartureDelayed$/ }
          },
          entity2: {
            value: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.4\.Departure$/,
              read: "return val === 0 ? null : val"
            },
            dateFormat: {
              type: "const",
              constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
            }
          },
          text: {
            true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.4\.Direction$/ },
            false: void 0
          },
          text1: {
            true: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.4\.DeparturePlanned$/,
              read: `{ return new Date(val).toLocaleTimeString().slice(0,5) }`
            },
            false: void 0
          }
        }
      },
      //Abfahrt 6
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.5\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Red }
            },
            false: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.5\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Green }
            }
          },
          entity1: {
            value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.5\.DepartureDelayed$/ }
          },
          entity2: {
            value: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.5\.Departure$/,
              read: "return val === 0 ? null : val"
            },
            dateFormat: {
              type: "const",
              constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
            }
          },
          text: {
            true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.5\.Direction$/ },
            false: void 0
          },
          text1: {
            true: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.5\.DeparturePlanned$/,
              read: `{ return new Date(val).toLocaleTimeString().slice(0,5) }`
            },
            false: void 0
          }
        }
      },
      //Abfahrt 7
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.6\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Red }
            },
            false: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.6\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Green }
            }
          },
          entity1: {
            value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.6\.DepartureDelayed$/ }
          },
          entity2: {
            value: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.6\.Departure$/,
              read: "return val === 0 ? null : val"
            },
            dateFormat: {
              type: "const",
              constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
            }
          },
          text: {
            true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.6\.Direction$/ },
            false: void 0
          },
          text1: {
            true: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.6\.DeparturePlanned$/,
              read: `{ return new Date(val).toLocaleTimeString().slice(0,5) }`
            },
            false: void 0
          }
        }
      },
      //Abfahrt 8
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.7\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Red }
            },
            false: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.7\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Green }
            }
          },
          entity1: {
            value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.7\.DepartureDelayed$/ }
          },
          entity2: {
            value: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.7\.Departure$/,
              read: "return val === 0 ? null : val"
            },
            dateFormat: {
              type: "const",
              constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
            }
          },
          text: {
            true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.7\.Direction$/ },
            false: void 0
          },
          text1: {
            true: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.7\.DeparturePlanned$/,
              read: `{ return new Date(val).toLocaleTimeString().slice(0,5) }`
            },
            false: void 0
          }
        }
      },
      //Abfahrt 9
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.8\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Red }
            },
            false: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.8\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Green }
            }
          },
          entity1: {
            value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.8\.DepartureDelayed$/ }
          },
          entity2: {
            value: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.8\.Departure$/,
              read: "return val === 0 ? null : val"
            },
            dateFormat: {
              type: "const",
              constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
            }
          },
          text: {
            true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.8\.Direction$/ },
            false: void 0
          },
          text1: {
            true: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.8\.DeparturePlanned$/,
              read: `{ return new Date(val).toLocaleTimeString().slice(0,5) }`
            },
            false: void 0
          }
        }
      },
      //Abfahrt 10
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.9\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Red }
            },
            false: {
              value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.9\.Mode$/ },
              //value: { type:'const', constVal: ' bus'},
              color: { type: "const", constVal: import_Color.Color.Green }
            }
          },
          entity1: {
            value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.9\.DepartureDelayed$/ }
          },
          entity2: {
            value: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.9\.Departure$/,
              read: "return val === 0 ? null : val"
            },
            dateFormat: {
              type: "const",
              constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
            }
          },
          text: {
            true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.9\.Direction$/ },
            false: void 0
          },
          text1: {
            true: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.9\.DeparturePlanned$/,
              read: `{ return new Date(val).toLocaleTimeString().slice(0,5) }`
            },
            false: void 0
          }
        }
      }
    ]
  },
  "entities.fahrplan.routes": {
    //Route Fahrplan
    adapter: "fahrplan.0",
    card: "cardEntities",
    alwaysOn: "none",
    useColor: false,
    items: void 0,
    config: {
      card: "cardEntities",
      scrollType: "page",
      data: {
        headline: {
          type: "const",
          constVal: "route"
        }
      }
    },
    pageItems: [
      //Abfahrt
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: {
                role: "state",
                mode: "auto",
                type: "state",
                dp: "",
                regexp: /\.0\.0\.Line\.Mode$/
              },
              color: { type: "const", constVal: import_Color.Color.Red }
            },
            false: {
              value: {
                role: "state",
                mode: "auto",
                type: "state",
                dp: "",
                regexp: /\.0\.0\.Line\.Mode$/
              },
              color: { type: "const", constVal: import_Color.Color.Green }
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
            true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.StationFrom\.Name$/ },
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
      //Ankunft
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "clock-alert-outline" },
              color: { type: "const", constVal: import_Color.Color.Red }
            },
            false: {
              value: { type: "const", constVal: "" }
              //color: { type: 'const', constVal: Color.Red },
            }
          },
          entity1: {
            value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.0\.ArrivalDelayed$/ }
          },
          entity2: {
            value: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.0\.Arrival$/,
              read: "return val === 0 ? null : val"
            },
            dateFormat: {
              type: "const",
              constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
            }
          },
          text: {
            true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.StationTo\.Name$/ },
            false: void 0
          },
          text1: {
            true: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.0\.ArrivalPlanned$/,
              read: `{ return new Date(val).toLocaleTimeString().slice(0,5) }`
            },
            false: void 0
          }
        }
      },
      //Abfahrt
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: {
                role: "state",
                mode: "auto",
                type: "state",
                dp: "",
                regexp: /\.1\.0\.Line\.Mode$/
              },
              color: { type: "const", constVal: import_Color.Color.Red }
            },
            false: {
              value: {
                role: "state",
                mode: "auto",
                type: "state",
                dp: "",
                regexp: /\.1\.0\.Line\.Mode$/
              },
              color: { type: "const", constVal: import_Color.Color.Green }
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
            true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.StationFrom\.Name$/ },
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
      //Ankunft
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "clock-alert-outline" },
              color: { type: "const", constVal: import_Color.Color.Red }
            },
            false: {
              value: { type: "const", constVal: "" }
              //color: { type: 'const', constVal: Color.Red },
            }
          },
          entity1: {
            value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.1\.ArrivalDelayed$/ }
          },
          entity2: {
            value: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.1\.Arrival$/,
              read: "return val === 0 ? null : val"
            },
            dateFormat: {
              type: "const",
              constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
            }
          },
          text: {
            true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.StationTo\.Name$/ },
            false: void 0
          },
          text1: {
            true: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.1\.ArrivalPlanned$/,
              read: `{ return new Date(val).toLocaleTimeString().slice(0,5) }`
            },
            false: void 0
          }
        }
      },
      //Abfahrt
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: {
                role: "state",
                mode: "auto",
                type: "state",
                dp: "",
                regexp: /\.2\.0\.Line\.Mode$/
              },
              color: { type: "const", constVal: import_Color.Color.Red }
            },
            false: {
              value: {
                role: "state",
                mode: "auto",
                type: "state",
                dp: "",
                regexp: /\.2\.0\.Line\.Mode$/
              },
              color: { type: "const", constVal: import_Color.Color.Green }
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
            true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.StationFrom\.Name$/ },
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
      //Ankunft
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "clock-alert-outline" },
              color: { type: "const", constVal: import_Color.Color.Red }
            },
            false: {
              value: { type: "const", constVal: "" }
              //color: { type: 'const', constVal: Color.Red },
            }
          },
          entity1: {
            value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.2\.ArrivalDelayed$/ }
          },
          entity2: {
            value: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.2\.Arrival$/,
              read: "return val === 0 ? null : val"
            },
            dateFormat: {
              type: "const",
              constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
            }
          },
          text: {
            true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.StationTo\.Name$/ },
            false: void 0
          },
          text1: {
            true: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.2\.ArrivalPlanned$/,
              read: `{ return new Date(val).toLocaleTimeString().slice(0,5) }`
            },
            false: void 0
          }
        }
      },
      //Abfahrt
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: {
                role: "state",
                mode: "auto",
                type: "state",
                dp: "",
                regexp: /\.3\.0\.Line\.Mode$/
              },
              color: { type: "const", constVal: import_Color.Color.Red }
            },
            false: {
              value: {
                role: "state",
                mode: "auto",
                type: "state",
                dp: "",
                regexp: /\.3\.0\.Line\.Mode$/
              },
              color: { type: "const", constVal: import_Color.Color.Green }
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
            true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.StationFrom\.Name$/ },
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
      },
      //Ankunft
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "clock-alert-outline" },
              color: { type: "const", constVal: import_Color.Color.Red }
            },
            false: {
              value: { type: "const", constVal: "" }
              //color: { type: 'const', constVal: Color.Red },
            }
          },
          entity1: {
            value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.3\.ArrivalDelayed$/ }
          },
          entity2: {
            value: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.3\.Arrival$/,
              read: "return val === 0 ? null : val"
            },
            dateFormat: {
              type: "const",
              constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
            }
          },
          text: {
            true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.StationTo\.Name$/ },
            false: void 0
          },
          text1: {
            true: {
              role: "date",
              mode: "auto",
              type: "state",
              dp: "",
              regexp: /\.3\.ArrivalPlanned$/,
              read: `{ return new Date(val).toLocaleTimeString().slice(0,5) }`
            },
            false: void 0
          }
        }
      }
    ]
  },
  "thermo.hmip.valve": {
    adapter: "hmip.0",
    card: "cardThermo",
    alwaysOn: "none",
    useColor: false,
    items: void 0,
    config: {
      card: "cardThermo",
      data: {
        headline: { mode: "auto", role: "", type: "state", dp: "", regexp: /\.info\.label$/ },
        mixed1: {
          value: { type: "const", constVal: "actualtemp" }
        },
        mixed2: {
          value: {
            mode: "auto",
            role: "value.temperature",
            type: "triggered",
            dp: "",
            regexp: /\.channels\.1\.valveActualTemperature$/
          },
          factor: { type: "const", constVal: 1 },
          decimal: { type: "const", constVal: 1 },
          unit: { type: "const", constVal: "\xB0C" }
        },
        mixed3: {
          value: { type: "const", constVal: "valveposition" }
        },
        mixed4: {
          value: {
            mode: "auto",
            role: "value",
            type: "triggered",
            dp: "",
            regexp: /\.valvePosition$/
          },
          factor: { type: "const", constVal: 1 },
          decimal: { type: "const", constVal: 0 },
          unit: { type: "const", constVal: "%" }
        },
        minTemp: {
          mode: "auto",
          role: "value",
          type: "state",
          dp: "",
          regexp: /\.minTemperature$/
        },
        maxTemp: {
          mode: "auto",
          role: "value",
          type: "state",
          dp: "",
          regexp: /\.maxTemperature$/
        },
        tempStep: { type: "const", constVal: "5" },
        unit: { type: "const", constVal: "\xB0C" },
        set1: {
          mode: "auto",
          type: "state",
          dp: "",
          regexp: /\.setPointTemperature$/,
          role: ""
        }
      }
    },
    pageItems: [
      //Automatic
      {
        role: "button",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "alpha-a-circle" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "alpha-a-circle-outline" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.controlMode$/,
              read: `return val == 'AUTOMATIC' ? true : false`,
              forceType: "boolean"
            }
          },
          setValue1: {
            mode: "auto",
            role: "",
            type: "state",
            dp: "",
            regexp: /\.controlMode$/,
            write: `return val != true ? 'AUTOMATIC' : 'MANUAL'`
          }
        }
      },
      //Manual
      {
        role: "button",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "alpha-m-circle" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "alpha-m-circle-outline" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.controlMode$/,
              read: `return val == 'MANUAL' ? true : false`
            }
          },
          setValue1: {
            mode: "auto",
            role: "",
            type: "state",
            dp: "",
            regexp: /\.controlMode$/,
            write: `return val = true ? 'MANUAL' : 'AUTOMATIC'`
          }
        }
      },
      //Boost
      {
        role: "button",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "fast-forward-60" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "fast-forward-60" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.boostMode$/
            }
          },
          setValue1: { mode: "auto", type: "state", role: "switch", dp: "", regexp: /\.boostMode$/ }
        }
      },
      //Fenster
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "window-open-variant" },
              color: { type: "const", constVal: import_Color.Color.open }
            },
            false: {
              value: { type: "const", constVal: "window-closed-variant" },
              color: { type: "const", constVal: import_Color.Color.close }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.windowOpen$/
            }
          }
        }
      },
      //Party
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "party-popper" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "party-popper" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.partyMode$/
            }
          }
        }
      },
      //Feuchte
      {
        role: "text",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "water-percent" },
              color: { type: "const", constVal: import_Color.Color.good }
            },
            false: {
              value: { type: "const", constVal: "water-percent" },
              color: { type: "const", constVal: import_Color.Color.bad }
            },
            scale: { type: "const", constVal: { val_min: 0, val_max: 100, val_best: 60 } }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.humidity$/
            }
          }
        }
      },
      //Batterie
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "battery-low" },
              color: { type: "const", constVal: import_Color.Color.bad }
            },
            false: {
              value: { type: "const", constVal: "battery-high" },
              color: { type: "const", constVal: import_Color.Color.good }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.lowBat$/
            }
          }
        }
      },
      //Wartung UPDATE
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "account-wrench" },
              color: { type: "const", constVal: import_Color.Color.true }
            },
            false: {
              value: { type: "const", constVal: "account-wrench" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.updateState$/,
              forceType: "boolean",
              read: `return val !== 'UP_TO_DATE' ? true : false `
            }
          }
        }
      },
      //Empfang - Verbindung
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "wifi-off" },
              color: { type: "const", constVal: import_Color.Color.bad }
            },
            false: {
              value: { type: "const", constVal: "wifi" },
              color: { type: "const", constVal: import_Color.Color.good }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.unreach$/
            }
          }
        }
      },
      //Fehler dutyCycle
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "alert-circle" },
              color: { type: "const", constVal: import_Color.Color.bad }
            },
            false: {
              value: { type: "const", constVal: "alert-circle-outline" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.dutyCycle$/
            }
          }
        }
      }
    ]
  },
  "thermo.hmip.wallthermostat": {
    adapter: "hmip.0",
    card: "cardThermo",
    alwaysOn: "none",
    useColor: false,
    items: void 0,
    config: {
      card: "cardThermo",
      data: {
        headline: { mode: "auto", role: "", type: "state", dp: "", regexp: /\.info\.label$/ },
        mixed1: {
          value: { type: "const", constVal: "actualtemp" }
        },
        mixed2: {
          value: {
            mode: "auto",
            role: "value.temperature",
            type: "triggered",
            dp: "",
            regexp: /\.actualTemperature$/
          },
          factor: { type: "const", constVal: 1 },
          decimal: { type: "const", constVal: 1 },
          unit: { type: "const", constVal: "\xB0C" }
        },
        mixed3: {
          value: { type: "const", constVal: "valveposition" }
        },
        mixed4: {
          value: {
            mode: "auto",
            role: "value",
            type: "triggered",
            dp: "",
            regexp: /\.valvePosition$/
          },
          factor: { type: "const", constVal: 1 },
          decimal: { type: "const", constVal: 0 },
          unit: { type: "const", constVal: "%" }
        },
        minTemp: {
          mode: "auto",
          role: "value",
          type: "state",
          dp: "",
          regexp: /\.minTemperature$/
        },
        maxTemp: {
          mode: "auto",
          role: "value",
          type: "state",
          dp: "",
          regexp: /\.maxTemperature$/
        },
        tempStep: { type: "const", constVal: "5" },
        unit: { type: "const", constVal: "\xB0C" },
        set1: {
          mode: "auto",
          type: "state",
          dp: "",
          regexp: /\.setPointTemperature$/,
          role: ""
        }
      }
    },
    pageItems: [
      //Automatic
      {
        role: "button",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "alpha-a-circle" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "alpha-a-circle-outline" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.controlMode$/,
              read: `return val == 'AUTOMATIC' ? true : false`,
              forceType: "boolean"
            }
          },
          setValue1: {
            mode: "auto",
            role: "",
            type: "state",
            dp: "",
            regexp: /\.controlMode$/,
            write: `return val != true ? 'AUTOMATIC' : 'MANUAL'`
          }
        }
      },
      //Manual
      {
        role: "button",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "alpha-m-circle" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "alpha-m-circle-outline" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.controlMode$/,
              read: `return val == 'MANUAL' ? true : false`
            }
          },
          setValue1: {
            mode: "auto",
            role: "",
            type: "state",
            dp: "",
            regexp: /\.controlMode$/,
            write: `return val = true ? 'MANUAL' : 'AUTOMATIC'`
          }
        }
      },
      //Boost
      {
        role: "button",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "fast-forward-60" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "fast-forward-60" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.boostMode$/
            }
          },
          setValue1: { mode: "auto", type: "state", role: "switch", dp: "", regexp: /\.boostMode$/ }
        }
      },
      //Fenster
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "window-open-variant" },
              color: { type: "const", constVal: import_Color.Color.open }
            },
            false: {
              value: { type: "const", constVal: "window-closed-variant" },
              color: { type: "const", constVal: import_Color.Color.close }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.windowOpen$/
            }
          }
        }
      },
      //Party
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "party-popper" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "party-popper" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.partyMode$/
            }
          }
        }
      },
      //Feuchte
      {
        role: "text",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "water-percent" },
              color: { type: "const", constVal: import_Color.Color.good }
            },
            false: {
              value: { type: "const", constVal: "water-percent" },
              color: { type: "const", constVal: import_Color.Color.bad }
            },
            scale: { type: "const", constVal: { val_min: 0, val_max: 100, val_best: 60 } }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.humidity$/
            }
          }
        }
      },
      //Batterie
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "battery-low" },
              color: { type: "const", constVal: import_Color.Color.bad }
            },
            false: {
              value: { type: "const", constVal: "battery-high" },
              color: { type: "const", constVal: import_Color.Color.good }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.lowBat$/
            }
          }
        }
      },
      //Wartung UPDATE
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "account-wrench" },
              color: { type: "const", constVal: import_Color.Color.true }
            },
            false: {
              value: { type: "const", constVal: "account-wrench" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.updateState$/,
              forceType: "boolean",
              read: `return val !== 'UP_TO_DATE' ? true : false `
            }
          }
        }
      },
      //Empfang - Verbindung
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "wifi-off" },
              color: { type: "const", constVal: import_Color.Color.bad }
            },
            false: {
              value: { type: "const", constVal: "wifi" },
              color: { type: "const", constVal: import_Color.Color.good }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.unreach$/
            }
          }
        }
      },
      //Fehler dutyCycle
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "alert-circle" },
              color: { type: "const", constVal: import_Color.Color.bad }
            },
            false: {
              value: { type: "const", constVal: "alert-circle-outline" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              dp: "",
              regexp: /\.dutyCycle$/
            }
          }
        }
      }
    ]
  },
  "thermo.script": {
    adapter: "alias.0",
    card: "cardThermo",
    alwaysOn: "none",
    useColor: false,
    items: void 0,
    config: {
      card: "cardThermo",
      data: {
        mixed1: {
          value: { type: "const", constVal: "Temperature" }
        },
        mixed2: {
          value: {
            mode: "auto",
            role: "value.temperature",
            type: "triggered",
            dp: "",
            regexp: /\.ACTUAL$/
          },
          factor: { type: "const", constVal: 1 },
          decimal: { type: "const", constVal: 1 }
        },
        mixed3: {
          value: { type: "const", constVal: "Humidity" }
        },
        mixed4: {
          value: {
            mode: "auto",
            role: "value.humidity",
            type: "triggered",
            dp: "",
            regexp: /\.HUMIDITY$/
          },
          factor: { type: "const", constVal: 1 },
          decimal: { type: "const", constVal: 0 },
          unit: { type: "const", constVal: "%" }
        },
        set1: {
          mode: "auto",
          role: "level.temperature",
          type: "state",
          dp: "",
          regexp: /\.SET$/
        },
        set2: {
          mode: "auto",
          role: "level.temperature",
          type: "state",
          dp: "",
          regexp: /\.SET2$/
        }
      }
    },
    pageItems: [
      //Automatic
      {
        role: "button",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "alpha-a-circle" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "alpha-a-circle-outline" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "switch.mode.auto",
              type: "triggered",
              dp: "",
              regexp: /\.AUTOMATIC$/,
              forceType: "boolean"
            },
            set: {
              mode: "auto",
              role: "switch.mode.auto",
              type: "state",
              dp: "",
              regexp: /\.AUTOMATIC$/
            }
          }
        }
      },
      //Manual
      {
        role: "button",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "alpha-m-circle" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "alpha-m-circle-outline" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "switch.mode.manual",
              type: "triggered",
              dp: "",
              regexp: /\.MANUAL$/
            },
            set: {
              mode: "auto",
              role: "switch.mode.manual",
              type: "state",
              dp: "",
              regexp: /\.MANUAL$/
            }
          }
        }
      },
      {
        role: "button",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "power-standby" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "power-standby" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "switch.power",
              type: "triggered",
              dp: "",
              regexp: /\.POWER$/
            },
            set: {
              mode: "auto",
              role: "switch.power",
              type: "state",
              dp: "",
              regexp: /\.POWER$/
            }
          }
        }
      },
      //Boost
      {
        role: "button",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "fast-forward-60" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "fast-forward-60" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "switch.mode.boost",
              type: "triggered",
              dp: "",
              regexp: /\.BOOST$/
            },
            set: {
              mode: "auto",
              role: "switch.mode.boost",
              type: "state",
              dp: "",
              regexp: /\.BOOST$/
            }
          }
        }
      },
      //Fenster
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "window-open-variant" },
              color: { type: "const", constVal: import_Color.Color.open }
            },
            false: {
              value: { type: "const", constVal: "window-closed-variant" },
              color: { type: "const", constVal: import_Color.Color.close }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: ["state", "sensor.window"],
              type: "triggered",
              dp: "",
              regexp: /\.WINDOWOPEN$/
            }
          }
        }
      },
      //Party
      {
        role: "button",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "party-popper" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "party-popper" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "switch.mode.party",
              type: "triggered",
              dp: "",
              regexp: /\.PARTY$/
            },
            set: {
              mode: "auto",
              role: "switch.mode.boost",
              type: "state",
              dp: "",
              regexp: /\.PARTY$/
            }
          }
        }
      },
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "account-wrench" },
              color: { type: "const", constVal: import_Color.Color.bad }
            },
            false: {
              value: { type: "const", constVal: "account-wrench" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "indicator.maintenance",
              type: "triggered",
              dp: "",
              regexp: /\.MAINTAIN$/
            }
          }
        }
      },
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "wifi-off" },
              color: { type: "const", constVal: import_Color.Color.bad }
            },
            false: {
              value: { type: "const", constVal: "wifi" },
              color: { type: "const", constVal: import_Color.Color.good }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "indicator.maintenance.unreach",
              type: "triggered",
              dp: "",
              regexp: /\.UNREACH$/
            }
          }
        }
      },
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "account-wrench" },
              color: { type: "const", constVal: import_Color.Color.true }
            },
            false: {
              value: { type: "const", constVal: "account-wrench" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "indicator.maintenance",
              type: "triggered",
              dp: "",
              regexp: /\.MAINTAIN$/
            }
          }
        }
      },
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "battery-low" },
              color: { type: "const", constVal: import_Color.Color.bad }
            },
            false: {
              value: { type: "const", constVal: "battery-high" },
              color: { type: "const", constVal: import_Color.Color.good }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "indicator.maintenance.lowbat",
              type: "triggered",
              dp: "",
              regexp: /\.LOWBAT$/
            }
          }
        }
      },
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "alert-circle" },
              color: { type: "const", constVal: import_Color.Color.bad }
            },
            false: {
              value: { type: "const", constVal: "alert-circle" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "indicator.error",
              type: "triggered",
              dp: "",
              regexp: /\.ERROR$/
            }
          }
        }
      },
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "palm-tree" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "palm-tree" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "state",
              type: "triggered",
              dp: "",
              regexp: /\.VACATION$/
            }
          }
        }
      },
      {
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "briefcase-check" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "briefcase-check" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: {
              mode: "auto",
              role: "state",
              type: "triggered",
              dp: "",
              regexp: /\.WORKING$/
            }
          }
        }
      }
    ]
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cardTemplates
});
//# sourceMappingURL=card.js.map
