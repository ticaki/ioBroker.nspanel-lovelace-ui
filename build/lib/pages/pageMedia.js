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
var types = __toESM(require("../types/types"));
var tools = __toESM(require("../const/tools"));
var import_pageMenu = require("./pageMenu");
var import_Page = require("../classes/Page");
var import_getSpotify = require("./tools/getSpotify");
var import_getAlexa = require("./tools/getAlexa");
var import_getMpd = require("./tools/getMpd");
var import_getSonos = require("./tools/getSonos");
var import_pageItem = require("./pageItem");
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
  logo: "~~~~~",
  options: ["", "", "", "", ""]
};
class PageMedia extends import_pageMenu.PageMenu {
  config;
  items = [];
  currentItem;
  step = 0;
  headlinePos = 0;
  titelPos = 0;
  artistPos = 0;
  originalName = "";
  playerName = "";
  currentPlayer;
  get logo() {
    var _a;
    return (_a = this.currentItem) == null ? void 0 : _a.logoItem;
  }
  constructor(config, options) {
    var _a;
    super(config, options);
    this.config = options.config;
    this.currentPlayer = (_a = this.config.ident) != null ? _a : "";
    this.minUpdateInterval = 2e3;
  }
  async init() {
    var _a, _b, _c, _d, _e;
    if (((_a = this.config) == null ? void 0 : _a.card) === "cardMedia") {
      const i = await this.createMainItems(this.config, this.enums, this.dpInit);
      i.ident = (_b = this.config.ident) != null ? _b : "";
      this.items.push(i);
      const id = (_c = this.config.ident) != null ? _c : "";
      const o = id ? await this.controller.adapter.getForeignObjectAsync(id) : null;
      this.originalName = (o == null ? void 0 : o.common) && ((_d = o.common) == null ? void 0 : _d.name) && (typeof o.common.name === "object" ? o.common.name.de || o.common.name.en : (_e = o == null ? void 0 : o.common) == null ? void 0 : _e.name) || "";
    }
    await super.init();
  }
  async createMainItems(c, enums, dpInit) {
    var _a;
    const config = structuredClone(c);
    const tempConfig = enums || dpInit ? await this.basePanel.statesControler.getDataItemsFromAuto(dpInit, config, void 0, enums) : config;
    const tempItems = await this.basePanel.statesControler.createDataItems(
      tempConfig == null ? void 0 : tempConfig.data,
      this
    );
    const logo = await this.initPageItems(config.logo);
    return {
      card: "cardMedia",
      ident: (_a = config.ident) != null ? _a : "",
      logo,
      logoItem: void 0,
      dpInit,
      data: tempItems
    };
  }
  async onVisibilityChange(val) {
    if (val) {
      let index = this.items.findIndex((i) => i.ident === this.currentPlayer);
      index = index === -1 ? 0 : index;
      if (index === 0) {
        this.playerName = "";
      }
      this.currentItem = this.items[index];
      if (this.currentItem && this.currentItem.logo) {
        if (!this.currentItem.logoItem) {
          const logoItems = await this.createPageItems(this.currentItem.logo, "logo");
          this.currentItem.logoItem = logoItems && logoItems.length > 0 ? logoItems[0] : void 0;
        }
      }
      this.headlinePos = 0;
      this.titelPos = 0;
      this.artistPos = 0;
    } else {
      for (const item of this.items) {
        if (item.logoItem) {
          await item.logoItem.delete();
          item.logoItem = void 0;
        }
      }
    }
    await super.onVisibilityChange(val);
  }
  async updateCurrentPlayer(dp, name) {
    var _a;
    if (this.currentPlayer === dp) {
      return;
    }
    let index = this.items.findIndex((i) => i.ident === dp);
    let newOne = false;
    if (index === -1) {
      if (((_a = this.config) == null ? void 0 : _a.card) === "cardMedia") {
        const reg = tools.getRegExp(`/^${dp.split(".").join("\\.")}/`) || dp;
        this.items.push(await this.createMainItems(this.config, "", reg));
        index = this.items.length - 1;
        this.items[index].ident = dp;
        await this.controller.statesControler.activateTrigger(this);
        newOne = true;
      }
    }
    if (index === 0) {
      this.playerName = "";
    } else {
      this.playerName = name;
    }
    this.currentItem = this.items[index];
    if (newOne) {
      if (this.currentItem && this.currentItem.logo) {
        if (!this.currentItem.logoItem) {
          const logoItems = await this.createPageItems(this.currentItem.logo, "logo");
          this.currentItem.logoItem = logoItems && logoItems.length > 0 ? logoItems[0] : void 0;
        }
      }
    }
    this.currentPlayer = dp;
    await this.update();
  }
  async update() {
    var _a, _b;
    if (!this.visibility) {
      return;
    }
    let index = this.items.findIndex((i) => i.ident === this.currentPlayer);
    index = index === -1 ? 0 : index;
    if (index === 0) {
      this.playerName = "";
    }
    this.currentItem = this.items[index];
    const item = this.currentItem;
    if (!item) {
      return;
    }
    const message = {};
    let duration = "", elapsed = "", title = "", album = "", artist = "";
    const isPlaying = await this.isPlaying();
    {
      const v = await tools.getValueEntryString(item.data.title);
      if (v !== null) {
        title = v;
      }
    }
    {
      const v = item.data.headline && await item.data.headline.getString();
      let headline = v != null ? v : "";
      if (!headline) {
        let suffix = title;
        if (!suffix && this.currentItem.ident) {
          const first = this.currentItem.ident.split(".")[0];
          switch (first) {
            case "alexa2":
              suffix = "Alexa";
              break;
            case "spotify-premium":
              suffix = "Spotify";
              break;
            case "mpd":
              suffix = "MPD";
              break;
            case "sonos":
              suffix = "Sonos";
              break;
            default:
              suffix = first;
              break;
          }
          if (!this.playerName && this.originalName) {
            suffix += `: ${this.originalName}`;
          }
        }
        headline = this.playerName ? `${this.playerName}: ${suffix}` : suffix;
      }
      message.headline = headline;
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
        duration = tools.formatHMS(d);
      }
      if (item.data.elapsed.type === "string") {
        const e = await item.data.elapsed.getString();
        if (e !== null) {
          elapsed = e;
        }
      } else if (item.data.elapsed.type === "number") {
        const e = await item.data.elapsed.getNumber();
        if (e != null) {
          elapsed = tools.formatHMS(e);
        }
      }
    }
    if (item.data.album) {
      const v = await item.data.album.getString();
      if (v !== null) {
        album = v;
      }
    }
    if (message.headline) {
      const { text, nextPos } = tools.buildScrollingText(message.headline, {
        maxSize: 28,
        pos: this.headlinePos
      });
      message.headline = text;
      this.headlinePos = nextPos;
    }
    {
      const suffix = `| ${elapsed}${duration ? `-${duration}` : ""}`;
      const { text, nextPos } = tools.buildScrollingText(title, {
        maxSize: 37,
        suffix,
        sep: " ",
        pos: this.titelPos
      });
      message.name = text;
      this.titelPos = nextPos;
    }
    if (album || artist) {
      const div = album && artist ? " | " : "";
      const scrollText = album + div + artist;
      const { text, nextPos } = tools.buildScrollingText(scrollText, {
        maxSize: 37,
        pos: this.artistPos
      });
      message.artist = text;
      this.artistPos = nextPos;
    }
    message.shuffle_icon = "";
    if ((_b = (_a = item.data.shuffle) == null ? void 0 : _a.value) == null ? void 0 : _b.type) {
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
          default: {
            value = null;
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
    } else {
      message.iconplaypause = isPlaying ? "pause" : "play";
      if (item.data.stop || item.data.pause) {
        message.onoffbuttonColor = isPlaying ? "65535" : "1374";
      } else {
        message.onoffbuttonColor = message.iconplaypause !== "pause" ? "65535" : "1374";
      }
    }
    if (item.data.title) {
      const v = await tools.getIconEntryColor(item.data.title, isPlaying, import_Color.Color.Red, import_Color.Color.Gray);
      if (v !== null) {
        message.titelColor = v;
      }
    }
    if (item.data.artist) {
      const v = await tools.getIconEntryColor(item.data.artist, isPlaying, import_Color.Color.White, import_Color.Color.Gray);
      if (v !== null) {
        message.artistColor = v;
      }
    }
    if (item.data.onOffColor) {
      const v = await tools.getIconEntryColor(item.data.onOffColor, isPlaying, import_Color.Color.White);
      message.onoffbuttonColor = v !== null ? v : "disable";
    }
    if (item.logoItem) {
      message.logo = tools.getPayload(await item.logoItem.getPageItemPayload());
    }
    const opts = ["~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~"];
    const pageItems = (await this.getOptions([])).slice(0, this.maxItems);
    message.navigation = this.getNavigation();
    const msg = {
      ...PageMediaMessageDefault,
      ...message,
      id: "media",
      options: pageItems.concat(opts).slice(0, 5).map((o) => o ? o : "~~~~~")
    };
    this.sendToPanel(this.getMessage(msg), false);
  }
  async getMediaState() {
    if (!this.currentItem) {
      return null;
    }
    const item = this.currentItem.data.mediaState;
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
    if (!this.currentItem) {
      return null;
    }
    const item = this.currentItem.data.mediaState;
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
    var _a, _b, _c, _d;
    if (!this.getVisibility() || this.sleep) {
      return;
    }
    await super.onButtonEvent(event);
    if ((0, import_Page.isMediaButtonActionType)(event.action)) {
      this.log.debug(`Receive event: ${JSON.stringify(event)}`);
    } else {
      return;
    }
    const items = this.currentItem;
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
        if ((_b = (_a = items.data.shuffle) == null ? void 0 : _a.set) == null ? void 0 : _b.writeable) {
          await items.data.shuffle.set.setStateFlip();
        } else if ((_d = (_c = items.data.shuffle) == null ? void 0 : _c.value) == null ? void 0 : _d.writeable) {
          await items.data.shuffle.value.setStateFlip();
        } else {
          this.log.error(`Missing shuffle controller. Report to dev`);
        }
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
      case "media-OnOff":
      case "button": {
        if (event.id === `${this.name}-logo`) {
          const onoff = await this.isPlaying();
          if (items.data.mediaState) {
            if (items.data.mediaState.writeable) {
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
  static async getPage(configManager, page, gridItem, messages, justCheck = false) {
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
    const parts = page.media.id.split(".");
    const adapterName = parts[0];
    const view = await adapter.getObjectViewAsync("system", "instance", {
      startkey: `system.adapter.${adapterName}.`,
      endkey: `system.adapter.${adapterName}.\u9999`
    });
    if (!view || !view.rows || view.rows.length === 0) {
      const msg2 = `${page.uniqueName}: Media page id - adapter: ${adapterName} has no instance - not exist - wrong id?!`;
      messages.push(msg2);
      if (!justCheck) {
        adapter.log.error(msg2);
      }
      return { gridItem, messages };
    }
    if (parts.length === 1) {
      const instanceNums = view.rows.map((r) => r.id.split(".").pop()).filter((n) => n && /^\d+$/.test(n)).map((n) => parseInt(n, 10)).sort((a, b) => a - b);
      if (instanceNums.length > 0) {
        const chosen = String(instanceNums[0]);
        page.media.id = `${adapterName}.${chosen}`;
        adapter.log.debug(
          `${page.uniqueName}: No instance in media id provided, using lowest available: ${page.media.id}`
        );
        parts.push(chosen);
      } else {
        const msg2 = `${page.uniqueName}: No numeric instance found for adapter ${adapterName}.`;
        messages.push(msg2);
        if (!justCheck) {
          adapter.log.error(msg2);
        }
        return { gridItem, messages };
      }
    }
    const instanceId = `system.adapter.${parts.slice(0, 2).join(".")}`;
    if (view.rows.findIndex((v) => v.id === instanceId) === -1) {
      const msg2 = `${page.uniqueName}: Media page id - adapter: ${parts.slice(0, 2).join(".")} has no instance - not exist - wrong id?!`;
      messages.push(msg2);
      if (!justCheck) {
        adapter.log.error(msg2);
      }
      return { gridItem, messages };
    }
    gridItem.config.card = "cardMedia";
    if (page.media.id.startsWith("spotify-premium.")) {
      return await (0, import_getSpotify.getPageSpotify)(configManager, page, gridItem, messages, justCheck);
    }
    if (page.media.id.startsWith("alexa2.")) {
      return await (0, import_getAlexa.getPageAlexa)(configManager, page, gridItem, messages, justCheck);
    }
    if (page.media.id.startsWith("mpd.")) {
      return await (0, import_getMpd.getPageMpd)(configManager, page, gridItem, messages, justCheck);
    }
    if (page.media.id.startsWith("sonos.")) {
      return await (0, import_getSonos.getPageSonos)(configManager, page, gridItem, messages, justCheck);
    }
    const msg = `${page.uniqueName}: Media page id ${page.media.id} is not supported - only alexa2, spotify-premium, mpd, and sonos!`;
    messages.push(msg);
    adapter.log.warn(msg);
    return { gridItem, messages };
  }
  async isPlaying() {
    var _a, _b, _c;
    return (_c = await ((_b = (_a = this.currentItem) == null ? void 0 : _a.data.isPlaying) == null ? void 0 : _b.getBoolean())) != null ? _c : false;
  }
  /**
   * Handles a popup request.
   *
   * @param id - The ID of the item.
   * @param popup - The popup type.
   * @param action - The action to be performed.
   * @param value - The value associated with the action.
   * @param _event - The incoming event.
   * @returns A promise that resolves when the popup request is handled.
   */
  async onPopupRequest(id, popup, action, value, _event = null) {
    if (!this.pageItems || id == "") {
      this.log.debug(
        `onPopupRequest: No pageItems or id this is only a warning if u used a pageitem except: 'arrow': ${id}`
      );
      return;
    }
    let item;
    if (isNaN(Number(id)) && typeof id === "string") {
      if (id === "media") {
        return;
      }
      if (!(id in this)) {
        return;
      }
      const temp = this[id];
      if (!(temp instanceof import_pageItem.PageItem)) {
        this.log.error(`onPopupRequest: id ${id} is not a PageItem!`);
        return;
      }
      item = temp;
    } else {
      await super.onPopupRequest(id, popup, action, value, _event);
      return;
    }
    if (!item) {
      this.log.error(`onPopupRequest: Cannot find PageItem for id ${id}`);
      return;
    }
    let msg = null;
    if (action && value !== void 0 && await item.onCommand(action, value)) {
      return;
    } else if (types.isPopupType(popup) && action !== "bExit") {
      this.basePanel.lastCard = "";
      msg = await item.GeneratePopup(popup);
    }
    if (msg !== null) {
      this.sleep = true;
      this.sendToPanel(msg, false);
    }
  }
  async delete() {
    await super.delete();
    for (const item of this.items) {
      if (item.logoItem) {
        await item.logoItem.delete();
        item.logoItem = void 0;
      }
    }
    this.items = [];
    this.currentItem = void 0;
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
