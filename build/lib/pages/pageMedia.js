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
var tools = __toESM(require("../const/tools"));
var import_pageMenu = require("./pageMenu");
var import_Page = require("../classes/Page");
var import_getSpotify = require("./tools/getSpotify");
var import_getAlexa = require("./tools/getAlexa");
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
class PageMedia extends import_pageMenu.PageMenu {
  config;
  items = [];
  currentItems;
  step = 0;
  headlinePos = 0;
  titelPos = 0;
  artistPos = 0;
  playerName = "";
  currentPlayer;
  constructor(config, options) {
    var _a;
    super(config, options);
    this.config = options.config;
    this.currentPlayer = (_a = this.config.ident) != null ? _a : "";
    this.minUpdateInterval = 2e3;
  }
  async init() {
    var _a, _b;
    if (((_a = this.config) == null ? void 0 : _a.card) === "cardMedia") {
      const i = await this.createMainItems(this.config, this.enums, this.dpInit);
      i.ident = (_b = this.config.ident) != null ? _b : "";
      this.items.push(i);
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
    let index = this.items.findIndex((i) => i.ident === dp);
    if (index === -1) {
      if (((_a = this.config) == null ? void 0 : _a.card) === "cardMedia") {
        const reg = tools.getRegExp(`/^${dp.split(".").join("\\.")}/`) || dp;
        this.items.push(await this.createMainItems(this.config, "", reg));
        index = this.items.length - 1;
        this.items[index].ident = dp;
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
    let index = this.items.findIndex((i) => i.ident === this.currentPlayer);
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
      let duration = "", elapsed = "", title = "", album = "", artist = "";
      {
        const v = await tools.getValueEntryString(item.data.title);
        if (v !== null) {
          title = v;
        }
      }
      {
        const v = item.data.headline && await item.data.headline.getString();
        message.headline = v != null ? v : this.playerName ? `${this.playerName}: ${title}` : title;
      }
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
        if (item.data.stop || item.data.pause) {
          message.onoffbuttonColor = v.toUpperCase() !== "STOP" ? "65535" : "1374";
        } else {
          message.onoffbuttonColor = message.iconplaypause !== "pause" ? "65535" : "1374";
        }
      }
    } else if (item.data.isPlaying) {
      const v = await item.data.isPlaying.getBoolean();
      if (v !== null) {
        message.iconplaypause = v ? "pause" : "play";
        if (item.data.stop || item.data.pause) {
          message.onoffbuttonColor = v ? "65535" : "1374";
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
    const pageItems = (await this.getOptions([])).slice(0, this.maxItems);
    message.navigation = this.getNavigation();
    const msg = Object.assign(PageMediaMessageDefault, message, {
      id: "media",
      options: pageItems.concat(opts).slice(0, 5)
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
    await super.onButtonEvent(event);
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
        if (event.id === `${this.name}-logo`) {
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
      const msg2 = `Error in page ${page.uniqueName}: Not a media page!`;
      messages.push(msg2);
      adapter.log.warn(msg2);
      return { gridItem, messages };
    }
    if (!page.media.id || configManager.validStateId(page.media.id) === false) {
      const msg2 = configManager.validStateId(page.media.id) ? `${page.uniqueName}: Media page has no device id!` : `${page.uniqueName}: Media page id ${page.media.id} is not valid!`;
      messages.push(msg2);
      adapter.log.warn(msg2);
      return { gridItem, messages };
    }
    const view = await adapter.getObjectViewAsync("system", "instance", {
      startkey: `system.adapter.${page.media.id.split(".").slice(0, 1).join(".")}.`,
      endkey: `system.adapter.${page.media.id.split(".").slice(0, 1).join(".")}.\u9999`
    });
    if (!view || !view.rows || view.rows.length === 0 || view.rows.findIndex((v) => v.id === `system.adapter.${page.media.id.split(".").slice(0, 2).join(".")}`) === -1) {
      const msg2 = `${page.uniqueName}: Media page id - adapter: ${page.media.id.split(".").slice(0, 2).join(".")} has no instance - not exist - wrong id?!`;
      messages.push(msg2);
      adapter.log.error(msg2);
      return { gridItem, messages };
    }
    gridItem.config.card = "cardMedia";
    if (page.media.id.startsWith("spotify-premium.")) {
      return await (0, import_getSpotify.getPageSpotify)(configManager, page, gridItem, messages);
    }
    if (page.media.id.startsWith("alexa2.")) {
      return await (0, import_getAlexa.getPageAlexa)(configManager, page, gridItem, messages);
    }
    const msg = `${page.uniqueName}: Media page id ${page.media.id} is not supported - only alexa2 and spotify-premium!`;
    messages.push(msg);
    adapter.log.warn(msg);
    return { gridItem, messages };
  }
  async isPlaying() {
    var _a, _b, _c;
    return (_c = await ((_b = (_a = this.currentItems) == null ? void 0 : _a.data.isPlaying) == null ? void 0 : _b.getBoolean())) != null ? _c : false;
  }
  async delete() {
    await super.delete();
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
