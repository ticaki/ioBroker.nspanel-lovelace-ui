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
var import_Page2 = require("../classes/Page");
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
class PageMedia extends import_Page2.Page {
  config;
  items;
  step = 1;
  headlinePos = 0;
  titelPos = 0;
  nextArrow = false;
  constructor(config, options) {
    if (options && options.pageItems)
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
    super(config, options);
    this.config = options.config;
    if (this.items && this.items.card === "cardMedia")
      this.items = options.items;
    this.minUpdateInterval = 2e3;
  }
  async init() {
    const config = structuredClone(this.config);
    const tempConfig = this.enums || this.dpInit ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
    const tempItem = await this.panel.statesControler.createDataItems(
      tempConfig,
      this
    );
    if (tempItem)
      tempItem.card = "cardMedia";
    this.items = tempItem;
    await super.init();
  }
  async onVisibilityChange(val) {
    await super.onVisibilityChange(val);
    if (val) {
      this.headlinePos = 0;
      this.titelPos = 0;
    }
  }
  async update() {
    if (!this.visibility)
      return;
    const item = this.items;
    if (item === void 0)
      return;
    const message = {};
    {
      if (item.card !== "cardMedia")
        return;
      const test = {};
      test.bla = "dd";
      let duration = "0:00", elapsed = "0:00", title = "unknown";
      if (item.data.title && item.data.title.text) {
        const v = await item.data.title.text.getString();
        if (v !== null) {
          title = v;
        }
      }
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
          const s = message.headline + "        ";
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
            const s = v + "          ";
            this.titelPos = this.titelPos % s.length;
            message.name = v.substring(this.titelPos++ % (`${v} ${message.name}` + s).length).substring(0, 35) + ` ${message.name}`;
          } else {
            message.name = `${v} ${message.name}`;
          }
        }
      }
    }
    message.shuffle_icon = "";
    if (item.data.shuffle && item.data.shuffle.value && item.data.shuffle.value.type) {
      let value = null;
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
        case "mixed":
        case "file": {
          value = null;
          break;
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
        if (await item.data.stop) {
          message.onoffbuttonColor = v.toUpperCase() !== "STOP" ? "65535" : "1374";
        } else {
          message.onoffbuttonColor = message.iconplaypause !== "pause" ? "65535" : "1374";
        }
      }
    }
    if (item.data.title && item.data.title.color) {
      const v = await getValueFromBoolean(item.data.title.color, "color");
      if (v !== null)
        message.titelColor = v;
    }
    if (item.data.logo) {
      message.logo = "~~~~~";
    }
    {
    }
    const opts = ["~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~"];
    if (this.pageItems) {
      const localStep = this.pageItems.length > 6 ? 4 : 5;
      if (this.pageItems.length - 1 <= localStep * (this.step - 1))
        this.step = 1;
      const maxSteps = localStep * this.step + 1;
      const minStep = localStep * (this.step - 1) + 1;
      for (let a = minStep; a < maxSteps; a++) {
        const temp = this.pageItems[a];
        if (temp)
          opts[a - minStep] = await temp.getPageItemPayload();
      }
      if (localStep === 4) {
        this.nextArrow = true;
        const temp = this.pageItems[0];
        if (temp)
          opts[4] = await temp.getPageItemPayload();
      }
    }
    message.navigation = this.getNavigation();
    const msg = Object.assign(PageMediaMessageDefault, message, {
      id: "media",
      options: opts
    });
    this.sendToPanel(this.getMessage(msg));
  }
  async getMediaState() {
    if (!this.items || this.items.card !== "cardMedia")
      return null;
    const item = this.items.data.mediaState;
    if (item) {
      const v = await item.getString();
      if (v !== null) {
        return ["PLAY", "1", "TRUE"].indexOf(v.toUpperCase()) !== -1;
      }
    }
    return null;
  }
  async getOnOffState() {
    if (!this.items || this.items.card !== "cardMedia")
      return null;
    const item = this.items.data.mediaState;
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
    this.step = 0;
    this.headlinePos = 0;
    this.titelPos = 0;
  }
  async onButtonEvent(event) {
    if (!this.getVisibility() || this.sleep)
      return;
    if ((0, import_Page.isMediaButtonActionType)(event.action)) {
      this.log.debug("Receive event: " + JSON.stringify(event));
    } else
      return;
    const items = this.items;
    if (!items || items.card !== "cardMedia")
      return;
    switch (event.action) {
      case "media-back": {
        items.data.backward && await items.data.backward.setStateTrue();
        break;
      }
      case "media-pause": {
        if (items.data.pause && items.data.play) {
          if (await this.getMediaState())
            await items.data.pause.setStateTrue();
          else
            await items.data.play.setStateTrue();
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
          if (await this.getOnOffState())
            await items.data.stop.setStateTrue();
        }
        break;
      }
      case "button": {
        if (event.id === "0" && this.nextArrow) {
          this.step++;
          await this.update();
        }
        break;
      }
    }
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
      } else {
        return colorOn || null;
      }
    }
  }
  return null;
}
async function getValueFromData(item, type) {
  switch (type) {
    case "string": {
      return item.getString();
      break;
    }
    case "color": {
      return item.getRGBDec();
      break;
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageMedia,
  getValueFromBoolean
});
//# sourceMappingURL=pageMedia.js.map
