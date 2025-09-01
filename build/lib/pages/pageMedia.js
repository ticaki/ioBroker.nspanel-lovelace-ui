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
var tools = __toESM(require("../const/tools"));
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
  step = 0;
  headlinePos = 0;
  titelPos = 0;
  artistPos = 0;
  nextArrow = false;
  playerName = "";
  tempItems;
  currentPlayer;
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
      this.step = 0;
      this.headlinePos = 0;
      this.titelPos = 0;
    } else {
      this.tempItems = [];
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
        await this.controller.statesControler.activateTrigger(this);
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
      let duration = "", elapsed = "", title = "unknown", album = "", artist = "";
      {
        const v = await tools.getValueEntryString(item.data.title);
        if (v !== null) {
          title = v;
        }
      }
      message.headline = item.data.headline && await item.data.headline.getString() || this.playerName ? `${this.playerName}: ${title}` : title;
      {
        const v = await tools.getValueEntryString(item.data.artist);
        if (v !== null) {
          artist = v;
        }
      }
      if (item.data.duration && item.data.elapsed) {
        const d = await item.data.duration.getNumber();
        if (d) {
          const t = (/* @__PURE__ */ new Date()).setHours(0, 0, d, 0);
          duration = new Date(t).toLocaleTimeString("de-DE", { minute: "numeric", second: "2-digit" });
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
            elapsed = new Date(t).toLocaleTimeString("de-DE", { minute: "numeric", second: "2-digit" });
          }
        }
      }
      if (item.data.album) {
        const v = await item.data.album.getString();
        if (v !== null) {
          album = v;
        }
      }
      {
        const maxSize2 = 18;
        if (message.headline.length > maxSize2) {
          const s = `${message.headline}        `;
          this.headlinePos = this.headlinePos % s.length;
          message.headline = (s + message.headline).substring(this.headlinePos++ % (message.headline + s).length).substring(0, 23);
        }
      }
      const maxSize = 38;
      message.name = `|${elapsed}${duration ? `-${duration}` : ""}`;
      const { text, nextPos } = tools.buildScrollingText(title, {
        maxSize,
        // wie bisher: 35
        suffix: message.name,
        // der feste rechte Block (elapsed|duration)
        sep: " ",
        // Trenner zwischen Titel und Suffix
        pos: this.titelPos
        // aktuelle Scrollposition übernehmen
      });
      message.name = text;
      this.titelPos = nextPos;
      if (album || artist) {
        const div = album && artist ? " | " : "";
        const scrollText = album + div + artist;
        const { text: text2, nextPos: nextPos2 } = tools.buildScrollingText(scrollText, {
          maxSize,
          // Gesamtbreite wie gehabt
          pos: this.artistPos
          // eigene Scrollposition für Artist/Album
        });
        message.artist = text2;
        this.artistPos = nextPos2;
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
      const v = await tools.getScaledNumber(item.data.volume);
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
    if (item.data.title) {
      const v = await tools.getIconEntryColor(item.data.title, await this.isPlaying(), import_Color.Color.Red, import_Color.Color.Gray);
      if (v !== null) {
        message.titelColor = v;
      }
    }
    if (item.data.artist) {
      const v = await tools.getIconEntryColor(item.data.artist, await this.isPlaying(), import_Color.Color.White, import_Color.Color.Gray);
      if (v !== null) {
        message.artistColor = v;
      }
    }
    if (item.data.logo) {
      message.logo = tools.getPayload(
        `media-OnOff`,
        `${this.name}-logo`,
        item.data.logo.icon && "true" in item.data.logo.icon && item.data.logo.icon.true ? (_a = await item.data.logo.icon.true.getString()) != null ? _a : "" : "",
        "4",
        "5",
        "6"
      );
    }
    if (item.data.onOffColor) {
      const v = await tools.getIconEntryColor(item.data.onOffColor, await this.isPlaying(), import_Color.Color.White);
      if (v !== null) {
        message.onoffbuttonColor = v;
      } else {
        message.onoffbuttonColor = "disable";
      }
    }
    const opts = ["~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~"];
    if (!this.tempItems || this.tempItems.length === 0 || this.step <= 0) {
      this.tempItems = await this.getEnabledPageItems();
    }
    if (this.tempItems) {
      const showArrow = this.tempItems.length > 6;
      const visibleSlots = showArrow ? 4 : 5;
      const start = this.step * visibleSlots + 1;
      if (start >= this.tempItems.length) {
        this.step = 0;
      }
      for (let i = 0; i < visibleSlots; i++) {
        const idx = this.step * visibleSlots + 1 + i;
        const temp = this.tempItems[idx];
        if (temp && !temp.unload) {
          if (!this.visibility) {
            return;
          }
          const msg2 = await temp.getPageItemPayload();
          opts[i] = msg2 || "~~~~~";
        } else {
          opts[i] = "~~~~~";
        }
      }
      if (showArrow) {
        this.nextArrow = true;
        const arrowItem = this.tempItems[0];
        opts[visibleSlots] = arrowItem ? await arrowItem.getPageItemPayload() : "~~~~~";
      } else {
        this.nextArrow = false;
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
    return tools.getPayload(
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
      tools.getPayloadArray(message.options)
    );
  }
  onStateTrigger = async () => {
    await this.update();
  };
  async reset() {
    this.step = 0;
    this.headlinePos = 0;
    this.titelPos = 0;
  }
  async onButtonEvent(event) {
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
          if (await this.isPlaying()) {
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
          await tools.setScaledNumber(items.data.volume, v);
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
          const onoff = await this.isPlaying();
          if (items.data.mediaState) {
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
            dp: ""
          },
          onOffColor: {
            true: page.media.colorMediaIcon ? { color: await configManager.getFieldAsDataItemConfig(page.media.colorMediaIcon) } : void 0
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
            value: {
              mode: "auto",
              type: "state",
              role: "media.artist",
              regexp: /.?\.Player\..?/,
              dp: ""
            },
            true: page.media.colorMediaArtist ? {
              color: await configManager.getFieldAsDataItemConfig(page.media.colorMediaArtist)
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
              read: "return (val != null && lc <= Date.now() + 120000 ? true : false);"
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
        {
          role: "alexa-playlist",
          type: "input_sel",
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "playlist-play" },
                color: { type: "const", constVal: import_Color.Color.activated }
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
        {
          // repeat
          role: "",
          type: "text",
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "repeat-variant" },
                color: { type: "const", constVal: import_Color.Color.activated }
              },
              false: {
                value: { type: "const", constVal: "repeat" },
                color: { type: "const", constVal: import_Color.Color.deactivated }
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
  async isPlaying() {
    var _a, _b, _c;
    return (_c = await ((_b = (_a = this.currentItems) == null ? void 0 : _a.data.isPlaying) == null ? void 0 : _b.getBoolean())) != null ? _c : false;
  }
  async delete() {
    await super.delete();
    this.tempItems = void 0;
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
