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
var pageMedia_exports = {};
__export(pageMedia_exports, {
  PageMedia: () => PageMedia,
  getValueFromBoolean: () => getValueFromBoolean
});
module.exports = __toCommonJS(pageMedia_exports);
var import_data_item = require("../classes/data-item");
var import_Color = require("../const/Color");
var import_icon_mapping = require("../const/icon_mapping");
var import_Page = require("../classes/Page");
var import_tools = require("../const/tools");
const PageMediaMessageDefault = {
  event: "entityUpd",
  headline: "",
  navigation: "~~~~~~~~~",
  id: "",
  name: "",
  titelColor: String(import_Color.Color.rgb_dec565(import_Color.Color.White)),
  artist: "",
  artistColor: String(import_Color.Color.rgb_dec565(import_Color.Color.White)),
  volume: "",
  iconplaypause: "",
  onoffbuttonColor: "",
  shuffle_icon: "",
  logo: "",
  options: ["", "", "", "", ""]
};
class PageMedia extends import_Page.Page {
  config;
  items = [];
  currentItems;
  step = 1;
  headlinePos = 0;
  titelPos = 0;
  nextArrow = false;
  currentPlayer;
  playerName = "";
  constructor(config, options) {
    if (options && options.pageItems) {
      options.pageItems.unshift({
        type: "button",
        dpInit: "",
        role: "button",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "arrow-right-bold-circle-outline" },
              color: { type: "const", constVal: { red: 205, green: 142, blue: 153 } }
            }
          },
          entity1: { value: { type: "const", constVal: true } }
        }
      });
    }
    super(config, options);
    if (typeof this.dpInit !== "string") {
      throw new Error("Media page must have a dpInit string");
    }
    this.currentPlayer = this.dpInit;
    this.config = options.config;
    this.minUpdateInterval = 2e3;
  }
  async init() {
    var _a;
    if (((_a = this.config) == null ? void 0 : _a.card) === "cardMedia") {
      this.items.push(await this.createMainItems(this.config, this.enums, this.dpInit));
    }
    await super.init();
  }
  async createMainItems(c, enums, dpInit) {
    const config = structuredClone(c);
    const tempConfig = enums || dpInit ? await this.basePanel.statesControler.getDataItemsFromAuto(dpInit, config, void 0, enums) : config;
    const tempItem = await this.basePanel.statesControler.createDataItems(
      tempConfig,
      this
    );
    if (tempItem) {
      tempItem.card = "cardMedia";
    }
    return {
      ...tempItem,
      dpInit: typeof dpInit === "string" ? dpInit : dpInit.toString()
    };
  }
  async onVisibilityChange(val) {
    await super.onVisibilityChange(val);
    if (val) {
      this.headlinePos = 0;
      this.titelPos = 0;
    }
  }
  async updateCurrentPlayer(dp, name) {
    var _a;
    if (this.currentPlayer === dp) {
      return;
    }
    let index = this.items.findIndex((i) => i.dpInit === dp);
    if (index === -1) {
      if (((_a = this.config) == null ? void 0 : _a.card) === "cardMedia") {
        this.items.push(await this.createMainItems(this.config, "", dp));
        index = this.items.length - 1;
      }
    }
    if (index === 0) {
      this.playerName = "";
    } else {
      this.playerName = name;
    }
    this.currentItems = this.items[index];
    this.currentPlayer = dp;
    await this.update();
  }
  async update() {
    var _a;
    if (!this.visibility) {
      return;
    }
    let index = this.items.findIndex((i) => i.dpInit === this.currentPlayer);
    index = index === -1 ? 0 : index;
    if (index === 0) {
      this.playerName = "";
    }
    this.currentItems = this.items[index];
    const item = this.currentItems;
    if (item === void 0) {
      return;
    }
    const message = {};
    {
      const test = {};
      test.bla = "dd";
      let duration = "0:00", elapsed = "0:00", title = "unknown";
      if (item.data.title && item.data.title.text) {
        const v = await item.data.title.text.getString();
        if (v !== null) {
          title = v;
        }
      }
      title = this.playerName ? `${this.playerName} - ${title}` : title;
      if (item.data.artist && item.data.artist.text) {
        const v = await item.data.artist.text.getString();
        if (v !== null) {
          message.artist = v;
        }
      }
      if (item.data.duration && item.data.elapsed) {
        const d = await item.data.duration.getNumber();
        if (d !== null) {
          const t = (/* @__PURE__ */ new Date()).setHours(0, 0, d, 0);
          duration = new Date(t).toLocaleTimeString("de-DE", { minute: "2-digit", second: "2-digit" });
        }
        if (item.data.elapsed.type === "string") {
          const e = await item.data.elapsed.getString();
          if (e !== null) {
            elapsed = e;
          }
        } else if (item.data.elapsed.type === "number") {
          const e = await item.data.elapsed.getNumber();
          if (e !== null) {
            const t = (/* @__PURE__ */ new Date()).setHours(0, 0, e, 0);
            elapsed = new Date(t).toLocaleTimeString("de-DE", { minute: "2-digit", second: "2-digit" });
          }
        }
      }
      message.headline = `${title}`;
      {
        const maxSize2 = 18;
        if (message.headline.length > maxSize2) {
          const s = `${message.headline}        `;
          this.headlinePos = this.headlinePos % s.length;
          message.headline = (s + message.headline).substring(this.headlinePos++ % (message.headline + s).length).substring(0, 23);
        }
      }
      const maxSize = 35;
      message.name = `(${elapsed}|${duration})`;
      if (item.data.album) {
        const v = await item.data.album.getString();
        if (v !== null) {
          if (`${v} ${message.name}`.length > maxSize) {
            const s = `${v}          `;
            this.titelPos = this.titelPos % s.length;
            message.name = `${v.substring(this.titelPos++ % `${v} ${message.name}${s}`.length).substring(0, 35)} ${message.name}`;
          } else {
            message.name = `${v} ${message.name}`;
          }
        }
      }
    }
    message.shuffle_icon = "";
    if (item.data.shuffle && item.data.shuffle.value && item.data.shuffle.value.type) {
      let value = null;
      if (!item.data.shuffle.enabled || await item.data.shuffle.enabled.getBoolean() === true) {
        switch (item.data.shuffle.value.type) {
          case "string": {
            const v = await item.data.shuffle.value.getString();
            if (v !== null) {
              value = ["OFF", "FALSE"].indexOf(v.toUpperCase()) === -1;
            }
            break;
          }
          case "number":
          case "boolean": {
            value = await item.data.shuffle.value.getBoolean();
            break;
          }
          case "object":
          case "array":
          case "mixed": {
            value = null;
            break;
          }
        }
      }
      if (value !== null) {
        message.shuffle_icon = value ? "shuffle-variant" : "shuffle-disabled";
      }
    }
    if (item.data.volume) {
      const v = await (0, import_tools.getScaledNumber)(item.data.volume);
      if (v !== null) {
        message.volume = String(v);
      }
    }
    if (item.data.mediaState) {
      const v = await item.data.mediaState.getString();
      if (v !== null) {
        message.iconplaypause = !await this.getMediaState() ? "play" : "pause";
        if (item.data.stop) {
          message.onoffbuttonColor = v.toUpperCase() !== "STOP" ? "65535" : "1374";
        } else {
          message.onoffbuttonColor = message.iconplaypause !== "pause" ? "65535" : "1374";
        }
      }
    }
    if (item.data.title && item.data.title.color) {
      const v = await getValueFromBoolean(item.data.title.color, "color");
      if (v !== null) {
        message.titelColor = v;
      }
    }
    if (item.data.logo) {
      message.logo = (0, import_tools.getPayload)(
        `media-OnOff`,
        `${this.name}-logo`,
        item.data.logo.icon && "true" in item.data.logo.icon && item.data.logo.icon.true ? (_a = await item.data.logo.icon.true.getString()) != null ? _a : "" : "",
        "4",
        "5",
        "6"
      );
    }
    const opts = ["~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~"];
    if (this.pageItems) {
      const localStep = this.pageItems.length > 6 ? 4 : 5;
      if (this.pageItems.length - 1 <= localStep * (this.step - 1)) {
        this.step = 1;
      }
      const maxSteps = localStep * this.step + 1;
      const minStep = localStep * (this.step - 1) + 1;
      let b = minStep;
      for (let a = minStep; a < maxSteps; a++) {
        const temp = this.pageItems[b++];
        if (temp) {
          const msg2 = await temp.getPageItemPayload();
          if (msg2) {
            opts[a - minStep] = await temp.getPageItemPayload();
          } else {
            a--;
          }
        } else {
          opts[a - minStep] = "~~~~~";
        }
      }
      if (localStep === 4) {
        this.nextArrow = true;
        const temp = this.pageItems[0];
        if (temp) {
          opts[4] = await temp.getPageItemPayload();
        }
      }
    }
    message.navigation = this.getNavigation();
    const msg = Object.assign(PageMediaMessageDefault, message, {
      id: "media",
      options: opts
    });
    this.sendToPanel(this.getMessage(msg), false);
  }
  async getMediaState() {
    if (!this.currentItems) {
      return null;
    }
    const item = this.currentItems.data.mediaState;
    if (item) {
      const v = await item.getString();
      if (v !== null) {
        return ["PLAY", "1", "TRUE"].indexOf(v.toUpperCase()) !== -1;
      }
      const b = await item.getBoolean();
      if (b !== null) {
        return b;
      }
    }
    return null;
  }
  async getOnOffState() {
    if (!this.currentItems) {
      return null;
    }
    const item = this.currentItems.data.mediaState;
    if (item) {
      const v = await item.getString();
      if (v !== null) {
        return ["STOP", "0", "FALSE"].indexOf(v.toUpperCase()) === -1;
      }
    }
    return null;
  }
  getMessage(message) {
    return (0, import_tools.getPayload)(
      "entityUpd",
      message.headline,
      message.navigation,
      message.id,
      message.name,
      message.titelColor,
      message.artist,
      message.artistColor,
      message.volume,
      import_icon_mapping.Icons.GetIcon(message.iconplaypause),
      message.onoffbuttonColor,
      import_icon_mapping.Icons.GetIcon(message.shuffle_icon),
      message.logo,
      //'~~~~~'
      (0, import_tools.getPayloadArray)(message.options)
    );
  }
  onStateTrigger = async () => {
    await this.update();
  };
  async reset() {
    this.step = 1;
    this.headlinePos = 0;
    this.titelPos = 0;
  }
  async onButtonEvent(event) {
    var _a;
    if (!this.getVisibility() || this.sleep) {
      return;
    }
    if ((0, import_Page.isMediaButtonActionType)(event.action)) {
      this.log.debug(`Receive event: ${JSON.stringify(event)}`);
    } else {
      return;
    }
    const items = this.currentItems;
    if (!items) {
      return;
    }
    switch (event.action) {
      case "media-back": {
        items.data.backward && await items.data.backward.setStateTrue();
        break;
      }
      case "media-pause": {
        if (items.data.pause && items.data.play) {
          if (await this.getMediaState()) {
            await items.data.pause.setStateTrue();
          } else {
            await items.data.play.setStateTrue();
          }
        } else if (items.data.mediaState) {
        }
        break;
      }
      case "media-next": {
        items.data.forward && await items.data.forward.setStateTrue();
        break;
      }
      case "media-shuffle": {
        items.data.shuffle && (items.data.shuffle.set && await items.data.shuffle.set.setStateFlip() || items.data.shuffle.value && await items.data.shuffle.value.setStateFlip());
        break;
      }
      case "volumeSlider": {
        if (items.data.volume) {
          const v = parseInt(event.opt);
          await (0, import_tools.setScaledNumber)(items.data.volume, v);
        } else {
          this.log.error(`Missing volumen controller. Report to dev`);
        }
        break;
      }
      case "mode-speakerlist": {
        break;
      }
      case "mode-playlist": {
        break;
      }
      case "mode-tracklist": {
        break;
      }
      case "mode-repeat": {
        break;
      }
      case "mode-equalizer": {
        break;
      }
      case "mode-seek": {
        break;
      }
      case "mode-crossfade": {
        break;
      }
      case "mode-favorites": {
        break;
      }
      case "mode-insel": {
        break;
      }
      case "media-OnOff": {
        if (items.data.stop) {
          if (await this.getOnOffState()) {
            await items.data.stop.setStateTrue();
          }
        }
        break;
      }
      case "button": {
        if (event.id === "0" && this.nextArrow) {
          this.step++;
          await this.update();
        } else if (event.id === `${this.name}-logo`) {
          let onoff = true;
          if (items.data.mediaState) {
            onoff = (_a = await this.getMediaState()) != null ? _a : true;
            if (items.data.mediaState.common.write === true) {
              await items.data.mediaState.setState(!onoff);
              break;
            }
          }
          if (onoff) {
            if (items.data.stop) {
              await items.data.stop.setStateTrue();
            } else if (items.data.pause) {
              await items.data.pause.setStateTrue();
            }
          } else if (items.data.play) {
            await items.data.play.setStateTrue();
          }
        }
        break;
      }
    }
  }
  static async getPage(configManager, page, gridItem, messages) {
    const adapter = configManager.adapter;
    if (page.type !== "cardMedia" || !gridItem.config || gridItem.config.card !== "cardMedia") {
      const msg = `Error in page ${page.uniqueName}: Not a media page!`;
      messages.push(msg);
      adapter.log.warn(msg);
      return { gridItem, messages };
    }
    if (!page.media.id) {
      const msg = `${page.uniqueName}: Media page has no device id!`;
      messages.push(msg);
      adapter.log.warn(msg);
      return { gridItem, messages };
    }
    gridItem.config.card = "cardMedia";
    let o;
    try {
      o = await adapter.getForeignObjectAsync(page.media.id);
    } catch {
    }
    if (!o) {
      const msg = `${page.uniqueName}: Media page id ${page.media.id} has no object!`;
      messages.push(msg);
      adapter.log.warn(msg);
      return { gridItem, messages };
    }
    gridItem.dpInit = page.media.id;
    gridItem = {
      ...gridItem,
      config: {
        card: "cardMedia",
        data: {
          headline: {
            type: "const",
            constVal: "home"
          },
          album: {
            mode: "auto",
            type: "state",
            role: "media.album",
            regexp: /.?\.Player\..?/,
            dp: ""
          },
          title: {
            on: {
              type: "const",
              constVal: true
            },
            text: {
              mode: "auto",
              type: "triggered",
              role: "media.title",
              regexp: /.?\.Player\..?/,
              dp: ""
            },
            color: {
              type: "const",
              constVal: { r: 250, g: 2, b: 3 }
            }
          },
          duration: {
            mode: "auto",
            type: "state",
            role: "media.duration",
            regexp: /.?\.Player\..?/,
            dp: ""
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
              scale: { min: 0, max: 100 },
              regexp: /.?\.Player\..?/,
              dp: ""
            },
            set: {
              mode: "auto",
              type: "state",
              role: ["level.volume"],
              scale: { min: 0, max: 100 },
              regexp: /.?\.Player\..?/,
              dp: ""
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
              role: "media.artist",
              regexp: /.?\.Player\..?/,
              dp: ""
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
        {
          //reminder
          role: "text.list",
          type: "text",
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "reminder" },
                color: { type: "const", constVal: import_Color.Color.attention }
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
              read: "return (val != null && lc <= Date.now() + 900000 ? true : false);"
            }
          }
        },
        {
          //speaker select
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
                color: { type: "const", constVal: import_Color.Color.good }
              },
              false: {
                value: { type: "const", constVal: "speaker-multiple" },
                color: { type: "const", constVal: import_Color.Color.bad }
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
            text: {
              true: void 0,
              false: void 0
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
        {
          //equalizer
          role: "",
          type: "number",
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "equalizer-outline" },
                color: { type: "const", constVal: import_Color.Color.activated }
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
              constVal: "mid"
            },
            heading3: {
              type: "const",
              constVal: "bass"
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
              constVal: -6
            },
            maxValue1: {
              type: "const",
              constVal: 6
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
              constVal: -6
            },
            maxValue2: {
              type: "const",
              constVal: 6
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
              constVal: -6
            },
            maxValue3: {
              type: "const",
              constVal: 6
            },
            text: {
              true: {
                type: "const",
                constVal: "equalizer"
              }
            }
          }
        },
        {
          // online
          role: "",
          type: "text",
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "wifi" },
                color: { type: "const", constVal: import_Color.Color.good }
              },
              false: {
                value: { type: "const", constVal: "wifi-off" },
                color: { type: "const", constVal: import_Color.Color.attention }
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
              },
              decimal: void 0,
              factor: void 0,
              unit: void 0
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
              },
              decimal: void 0,
              factor: void 0,
              unit: void 0
            },
            text: {
              true: void 0,
              false: void 0
            }
          }
        }
      ],
      uniqueID: page.uniqueName
    };
    return { gridItem, messages };
  }
}
async function getValueFromBoolean(item, type, value = true) {
  if (item) {
    if ((0, import_data_item.isDataItem)(item)) {
      const v = await getValueFromData(item, type);
      if (v !== null) {
        return v;
      }
    } else {
      const colorOn = item.true && await getValueFromData(item.true, type);
      const colorOff = !value && item.false && await getValueFromData(item.false, type);
      if (colorOff) {
        return colorOff;
      }
      return colorOn || null;
    }
  }
  return null;
}
async function getValueFromData(item, type) {
  switch (type) {
    case "string": {
      return item.getString();
    }
    case "color": {
      return item.getRGBDec();
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageMedia,
  getValueFromBoolean
});
//# sourceMappingURL=pageMedia.js.map
