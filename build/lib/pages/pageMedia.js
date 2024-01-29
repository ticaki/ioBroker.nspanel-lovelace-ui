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
  PageMedia1: () => PageMedia1,
  commands: () => commands,
  getValueFromBoolean: () => getValueFromBoolean,
  testConfigMedia: () => testConfigMedia
});
module.exports = __toCommonJS(pageMedia_exports);
var import_data_item = require("../classes/data-item");
var import_color = require("../const/color");
var import_icon_mapping = require("../const/icon_mapping");
var import_Page = require("./Page");
const commands = {
  cardMedia: {
    on: "1374",
    pause: "65535"
  }
};
const PageMediaMessageDefault = {
  event: "entityUpd",
  headline: "",
  getNavigation: "~~~~~~~~~",
  id: "",
  title: "",
  titelColor: String((0, import_color.rgb_dec565)(import_color.White)),
  artist: "",
  artistColor: String((0, import_color.rgb_dec565)(import_color.White)),
  volume: "",
  iconplaypause: "",
  onoffbutton: "",
  shuffle_icon: "",
  logo: "",
  options: ["", "", "", "", ""]
};
const messageItemDefault = {
  event: "input_sel",
  pageId: "",
  icon: "",
  color: "",
  name: "",
  ident: ""
};
const ArrayPlayerTypeWithMediaDevice = ["alexa2", "sonos", "squeezeboxrpc"];
const ArrayPlayerTypeWithOutMediaDevice = ["spotify-premium", "volumio", "bosesoundtouch"];
const steps = 4;
class PageMedia1 extends import_Page.Page {
  config;
  initMode;
  dpInit;
  panel;
  items;
  writeItems;
  step = 0;
  headlinePos = 0;
  volume = 0;
  constructor(adapter, panel, options, name) {
    super(adapter, panel.panelSend, options.config.card, name);
    this.config = options.config;
    this.panel = panel;
    this.writeItems = options.writeItems;
    this.items = options.items;
    this.initMode = options.initMode;
    this.dpInit = options.dpInit;
    this.minUpdateInterval = 2e3;
  }
  async init() {
    const config = { ...this.config };
    const tempConfig = this.initMode === "auto" ? await this.panel.readOnlyDB.getDataItemsFromAuto(this.dpInit, config) : {};
    const tempItem = await this.panel.readOnlyDB.createDataItems(
      tempConfig,
      this
    );
    this.items = tempItem;
    for (const g in this.writeItems) {
      const d = g;
      const item = this.writeItems[d];
      if (item === void 0)
        continue;
      if (!item.dp || !await this.panel.readOnlyDB.existsState(item.dp)) {
        this.log.warn(`State ${item.dp} was not found!`);
        this.writeItems[d] = void 0;
      }
    }
  }
  sendType() {
    this.sendToPanel("pageType~cardMedia");
  }
  async onVisibilityChange(val) {
    if (val) {
      this.sendType();
      this.update();
    }
  }
  async update() {
    const item = this.items;
    if (item === void 0)
      return;
    const message = {};
    {
      let duration = "0:00", elapsed = "0:00", title = "unknown";
      if (item.album) {
        const v = await item.album.getString();
        if (v !== null) {
          const maxSize = 18;
          if (v.length > maxSize) {
            const s = v + "          ";
            this.headlinePos = this.headlinePos % s.length;
            message.headline = (s + v).substring(this.headlinePos++ % (v + s).length).substring(0, 23);
          } else {
            message.headline = v;
          }
        }
      }
      if (item.titel && item.titel.text) {
        const v = await item.titel.text.getString();
        if (v !== null) {
          title = v;
        }
      }
      if (item.artist && item.artist.text) {
        const v = await item.artist.text.getString();
        if (v !== null) {
          message.artist = v;
        }
      }
      if (item.duration && item.elapsed) {
        const d = await item.duration.getNumber();
        if (d !== null) {
          const t = new Date().setHours(0, 0, d, 0);
          duration = new Date(t).toLocaleTimeString("de-DE", { minute: "2-digit", second: "2-digit" });
        }
        if (item.elapsed.type === "string") {
          const e = await item.elapsed.getString();
          if (e !== null) {
            elapsed = e;
          }
        } else if (item.elapsed.type === "number") {
          const e = await item.elapsed.getNumber();
          if (e !== null) {
            const t = new Date().setHours(0, 0, e, 0);
            elapsed = new Date(t).toLocaleTimeString("de-DE", { minute: "2-digit", second: "2-digit" });
          }
        }
      }
      message.title = `${title} (${elapsed}|${duration})`;
    }
    message.shuffle_icon = "";
    if (item.shuffle && item.shuffle.type) {
      let value = null;
      switch (item.shuffle.type) {
        case "string": {
          const v = await item.shuffle.getString();
          if (v !== null) {
            value = ["OFF", "FALSE"].indexOf(v.toUpperCase()) !== -1;
          }
          break;
        }
        case "number":
        case "boolean": {
          value = await item.shuffle.getBoolean();
          break;
        }
        case "undefined":
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
    if (item.volume) {
      const v = await item.volume.getNumber();
      if (v !== null) {
        this.volume = v;
        message.volume = String(v);
      }
    }
    if (item.mediaState) {
      const v = await item.mediaState.getString();
      if (v !== null) {
        message.iconplaypause = await this.getMediaState() ? "play" : "pause";
        if (await item.stop) {
          message.onoffbutton = v.toUpperCase() === "STOP" ? "65535" : "1374";
        } else {
          message.onoffbutton = message.iconplaypause;
        }
      }
    }
    if (item.titel && item.titel.color) {
      const v = await getValueFromBoolean(item.titel.color, "color");
      if (v !== null)
        message.titelColor = v;
    }
    message.options = [void 0, void 0, void 0, void 0, void 0];
    if (item.toolbox && Array.isArray(item.toolbox)) {
      const localStep = item.toolbox.length > 5 ? steps : 5;
      if (item.toolbox.length > localStep * this.step)
        this.step = 1;
      const maxSteps = localStep * this.step;
      for (let a = maxSteps - localStep; a < maxSteps; a++) {
        message.options[a] = await this.getToolItem(item.toolbox[a], String(a), a % localStep + 1);
      }
      if (localStep === 4) {
        const color = String((0, import_color.rgb_dec565)(import_color.White));
        const icon = "arrow-right";
        message.options[4] = {
          pageId: `5`,
          iconNumber: 5,
          icon: import_icon_mapping.Icons.GetIcon(icon),
          color,
          mode: "nexttool",
          name: "next"
        };
      }
    }
    if (item.logo) {
      message.logo = this.getBottomMessages(await this.getToolItem(item.logo, "logo", 5));
    }
    {
    }
    const opts = [];
    for (const a in message.options) {
      const temp = message.options[a];
      if (typeof temp === "object")
        opts.push(this.getBottomMessages(temp));
    }
    const msg = Object.assign(PageMediaMessageDefault, message, {
      getNavigation: "button~bSubPrev~~~~~button~bSubNext~~~~",
      id: "media",
      options: opts
    });
    this.sendToPanel(this.getMessage(msg));
  }
  async getMediaState() {
    if (!this.items)
      return null;
    const item = this.items.mediaState;
    if (item) {
      const v = await item.getString();
      if (v !== null) {
        return ["PLAY", "1", "TRUE"].indexOf(v.toUpperCase()) !== -1;
      }
    }
    return null;
  }
  async getOnOffState() {
    if (!this.items)
      return null;
    const item = this.items.mediaState;
    if (item) {
      const v = await item.getString();
      if (v !== null) {
        return ["STOP", "0", "FALSE"].indexOf(v.toUpperCase()) === -1;
      }
    }
    return null;
  }
  async getToolItem(i, id, iconNumber) {
    if (i) {
      if (i.on && i.text && i.color && i.icon) {
        const v = await i.on.getBoolean();
        const color = await getValueFromBoolean(i.color, "color", !!v);
        const icon = await getValueFromBoolean(i.icon, "string", !!v);
        const text = await i.text.getString();
        const list = i.list ? await i.list.getString() : null;
        if (list)
          this.log.debug(JSON.stringify(list));
        if (color && icon && text) {
          const tool = {
            pageId: `${id}`,
            iconNumber,
            icon: import_icon_mapping.Icons.GetIcon(icon),
            color,
            mode: i.action,
            name: this.adapter.library.getLocalTranslation("media", text)
          };
          return tool;
        }
      }
    }
    return void 0;
  }
  getMessage(message) {
    return this.getPayload(
      "entityUpd",
      message.headline,
      message.getNavigation,
      message.id,
      message.title,
      message.titelColor,
      message.artist,
      message.artistColor,
      message.volume,
      import_icon_mapping.Icons.GetIcon(message.iconplaypause),
      import_icon_mapping.Icons.GetIcon(message.onoffbutton),
      import_icon_mapping.Icons.GetIcon(message.shuffle_icon),
      message.logo,
      this.getPayloadArray(message.options)
    );
  }
  getBottomMessages(msg) {
    if (!msg || !msg.pageId || !msg.icon || msg.event === "")
      return "~~~~~";
    msg.event = msg.event === void 0 ? "input_sel" : msg.event;
    msg.pageId = `${this.id}?${msg.pageId}?${msg.mode}`;
    const iconNumber = msg.iconNumber;
    const temp = msg;
    delete temp.mode;
    delete temp.iconNumber;
    msg.ident = msg.ident || "media0";
    const message = Object.assign(messageItemDefault, temp);
    switch (iconNumber) {
      case 0: {
        message.ident = "media0";
        break;
      }
      case 1: {
        message.ident = "media1";
        break;
      }
      case 2: {
        message.ident = "media2";
        break;
      }
      case 3: {
        message.ident = "media3";
        break;
      }
      case 4: {
        message.ident = "media4";
        break;
      }
      case 5: {
        message.ident = "media5";
        break;
      }
    }
    return this.getPayload(message.event, message.pageId, message.icon, message.color, message.name, message.ident);
  }
  onStateTrigger = async () => {
    this.update();
  };
  async onButtonEvent(event) {
    if (event.mode !== "media")
      return;
    if (isMediaButtonActionType(event.command)) {
      this.log.debug("Receive event: " + JSON.stringify(event));
    } else
      return;
    const items = this.items;
    if (!items)
      return;
    switch (event.command) {
      case "media-back": {
        items.backward && await items.backward.setStateTrue();
        break;
      }
      case "media-pause": {
        if (items.pause && items.play) {
          if (await this.getMediaState())
            await items.pause.setStateTrue();
          else
            await items.play.setStateTrue();
        } else if (items.mediaState) {
        }
        break;
      }
      case "media-next": {
        items.forward && await items.forward.setStateTrue();
        break;
      }
      case "media-shuffle": {
        items.shuffle && await items.shuffle.setStateTrue();
        break;
      }
      case "volumeSlider": {
        if (items.volume) {
          let v = parseInt(event.opt);
          if (v > 100)
            v = 100;
          else if (v < 0)
            v = 0;
          await items.volume.setStateAsync(v);
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
        if (items.stop) {
          if (await this.getOnOffState())
            await items.stop.setStateTrue();
        }
        break;
      }
    }
  }
}
const testConfigMedia = {
  dpInit: "alexa2.0.Echo-Devices.G091EV0704641J8R.Player",
  initMode: "auto",
  config: {
    card: "cardMedia",
    heading: {
      type: "const",
      constVal: "test"
    },
    alwaysOnDisplay: {
      type: "const",
      constVal: "test"
    },
    album: {
      mode: "auto",
      type: "state",
      role: "media.album",
      dp: ""
    },
    titel: {
      on: {
        type: "const",
        constVal: true
      },
      text: {
        mode: "auto",
        type: "triggered",
        role: "media.title",
        dp: ""
      },
      color: {
        type: "const",
        constVal: { red: 250, green: 2, blue: 3 }
      },
      icon: void 0,
      list: void 0
    },
    duration: {
      mode: "auto",
      type: "state",
      role: "media.duration",
      dp: ""
    },
    elapsed: {
      mode: "auto",
      type: "triggered",
      role: ["media.elapsed", "media.elapsed.text"],
      dp: ""
    },
    volume: {
      mode: "auto",
      type: "triggered",
      role: ["level.volume"],
      dp: ""
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
      mode: "auto",
      type: "state",
      role: "media.mode.shuffle",
      dp: ""
    },
    icon: {
      type: "const",
      constVal: "dialpad"
    },
    play: {
      mode: "auto",
      type: "state",
      role: ["button.play"],
      dp: ""
    },
    mediaState: {
      mode: "auto",
      type: "triggered",
      role: ["media.state"],
      dp: ""
    },
    stop: {
      mode: "auto",
      type: "state",
      role: ["button.stop"],
      dp: ""
    },
    pause: {
      mode: "auto",
      type: "state",
      role: "button.pause",
      dp: ""
    },
    forward: {
      mode: "auto",
      type: "state",
      role: "button.next",
      dp: ""
    },
    backward: {
      mode: "auto",
      type: "state",
      role: "button.prev",
      dp: ""
    },
    logo: {
      on: {
        type: "const",
        constVal: true
      },
      text: { type: "const", constVal: "1" },
      icon: { type: "const", constVal: "home" },
      color: { type: "const", constVal: { red: 250, blue: 250, green: 0 } },
      list: void 0,
      action: "cross"
    },
    toolbox: [
      {
        on: {
          type: "const",
          constVal: true
        },
        text: { type: "const", constVal: "Repeat" },
        icon: { type: "const", constVal: "repeat" },
        color: { type: "const", constVal: { red: 123, blue: 112, green: 0 } },
        list: { type: "state", dp: "", mode: "auto", role: "media.playlist" },
        action: "cross"
      },
      {
        on: {
          type: "const",
          constVal: true
        },
        text: { type: "const", constVal: "1" },
        icon: { type: "const", constVal: "home" },
        color: { type: "const", constVal: { red: 123, blue: 112, green: 0 } },
        list: void 0,
        action: "cross"
      },
      {
        on: {
          type: "const",
          constVal: true
        },
        text: { type: "const", constVal: "1" },
        icon: { type: "const", constVal: "home" },
        color: { type: "const", constVal: { red: 123, blue: 112, green: 0 } },
        list: void 0,
        action: "cross"
      },
      {
        on: {
          type: "const",
          constVal: false
        },
        text: { type: "const", constVal: "1" },
        icon: { true: { type: "const", constVal: "reply" }, false: { type: "const", constVal: "replay" } },
        color: { type: "const", constVal: { red: 123, blue: 112, green: 0 } },
        list: void 0,
        action: "cross"
      },
      {
        on: {
          type: "const",
          constVal: false
        },
        text: { type: "const", constVal: "1" },
        icon: { type: "const", constVal: "home" },
        color: { type: "const", constVal: { red: 123, blue: 112, green: 0 } },
        list: void 0,
        action: "cross"
      }
    ]
  },
  items: void 0,
  writeItems: void 0
};
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
function isMediaButtonActionType(F) {
  switch (F) {
    case "media-back":
    case "media-pause":
    case "media-next":
    case "media-shuffle":
    case "volumeSlider":
    case "mode-speakerlist":
    case "mode-playlist":
    case "mode-tracklist":
    case "mode-repeat":
    case "mode-equalizer":
    case "mode-seek":
    case "mode-crossfade":
    case "mode-favorites":
    case "mode-insel":
    case "media-OnOff":
      return true;
  }
  console.error(`${F} isMediaButtonActionType === false`);
  return false;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageMedia1,
  commands,
  getValueFromBoolean,
  testConfigMedia
});
//# sourceMappingURL=pageMedia.js.map
