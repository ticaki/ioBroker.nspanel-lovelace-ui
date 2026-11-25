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
var media_headline_exports = {};
__export(media_headline_exports, {
  mediaHeadline: () => mediaHeadline,
  mediaServiceLabel: () => mediaServiceLabel
});
module.exports = __toCommonJS(media_headline_exports);
function mediaServiceLabel(ident) {
  if (!ident) {
    return "";
  }
  const first = ident.split(".")[0];
  switch (first) {
    case "alexa2":
      return "Alexa";
    case "spotify-premium":
      return "Spotify";
    case "mpd":
      return "MPD";
    case "sonos":
      return "Sonos";
    case "squeezeboxrpc":
      return "Squeezebox";
    default:
      return first;
  }
}
function mediaHeadline(input) {
  const { title, ident, playerName, originalName } = input;
  if (input.mode === "device") {
    return playerName || input.deviceName || mediaServiceLabel(ident);
  }
  let suffix = title;
  if (!suffix && ident) {
    suffix = mediaServiceLabel(ident);
    if (!playerName && originalName) {
      suffix += `: ${originalName}`;
    }
  }
  return playerName ? `${playerName}: ${suffix}` : suffix;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  mediaHeadline,
  mediaServiceLabel
});
//# sourceMappingURL=media-headline.js.map
