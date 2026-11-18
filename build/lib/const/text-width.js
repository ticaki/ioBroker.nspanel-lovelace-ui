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
var text_width_exports = {};
__export(text_width_exports, {
  ELLIPSIS: () => ELLIPSIS,
  ELLIPSIS_FALLBACK: () => ELLIPSIS_FALLBACK,
  NOTIFY_ICON_FONT: () => NOTIFY_ICON_FONT,
  charAdvance: () => charAdvance,
  fitText: () => fitText,
  fontHeight: () => fontHeight,
  fontWidthModel: () => fontWidthModel,
  hasGlyph: () => hasGlyph,
  isFontId: () => isFontId,
  textWidth: () => textWidth,
  wrapText: () => wrapText
});
module.exports = __toCommonJS(text_width_exports);
var import_font_widths = require("./font-widths");
const ELLIPSIS = "\u2026";
const ELLIPSIS_FALLBACK = "...";
const NOTIFY_ICON_FONT = 9;
const NOTIFY_ICON_SIZE = 255;
const ICON_FIRST = 57344;
const ICON_LAST = 65023;
const notifyIconFont = {
  advance: (cp) => cp >= ICON_FIRST && cp <= ICON_LAST ? NOTIFY_ICON_SIZE : void 0,
  missing: 0,
  height: NOTIFY_ICON_SIZE,
  maxChars: 1
};
const lookups = /* @__PURE__ */ new Map();
function fontWidthModel(model) {
  switch (model) {
    case "web-l":
      return "eu";
    case "web-p":
      return "us-p";
    default:
      return model;
  }
}
function decodeTable(table) {
  const advances = /* @__PURE__ */ new Map();
  let cp = 0;
  for (const segment of table.data.join(" ").split(" ")) {
    const [gap, items] = segment.split(":");
    cp += parseInt(gap, 36);
    for (const item of (items != null ? items : "").split(",")) {
      const [advance, count] = item.split("*");
      const a = parseInt(advance, 36);
      const n = count === void 0 ? 1 : parseInt(count, 36);
      for (let i = 0; i < n; i++) {
        advances.set(cp++, a);
      }
    }
  }
  if (advances.size !== table.count) {
    throw new Error(`text-width: font table ${table.name} decodes to ${advances.size} instead of ${table.count}`);
  }
  return { advance: (cp2) => advances.get(cp2), missing: table.missing, height: table.height };
}
function getFont(fontId, model) {
  var _a;
  if (fontId === NOTIFY_ICON_FONT) {
    return notifyIconFont;
  }
  const table = import_font_widths.FONT_WIDTH_TABLES[(_a = import_font_widths.FONT_WIDTH_MODELS[fontWidthModel(model)][fontId]) != null ? _a : -1];
  if (!table) {
    throw new RangeError(`text-width: unknown font id ${fontId}`);
  }
  let lookup = lookups.get(table);
  if (!lookup) {
    lookup = decodeTable(table);
    lookups.set(table, lookup);
  }
  return lookup;
}
function isFontId(fontId) {
  return typeof fontId === "number" && Number.isInteger(fontId) && (fontId >= 0 && fontId < import_font_widths.FONT_WIDTH_MODELS.eu.length || fontId === NOTIFY_ICON_FONT);
}
function fontHeight(fontId, model) {
  return getFont(fontId, model).height;
}
function hasGlyph(codePoint, fontId, model) {
  return getFont(fontId, model).advance(codePoint) !== void 0;
}
function advanceOf(font, codePoint) {
  var _a;
  return (_a = font.advance(codePoint)) != null ? _a : font.missing;
}
function charAdvance(codePoint, fontId, model) {
  return advanceOf(getFont(fontId, model), codePoint);
}
function codePoints(text) {
  var _a;
  const out = [];
  for (const ch of text) {
    out.push((_a = ch.codePointAt(0)) != null ? _a : 0);
  }
  return out;
}
function widthOf(cps, font, spax) {
  let sum = 0;
  for (const cp of cps) {
    sum += advanceOf(font, cp);
  }
  return sum + (cps.length > 1 ? spax * (cps.length - 1) : 0);
}
function textWidth(text, fontId, model, spax = 0) {
  return widthOf(codePoints(text), getFont(fontId, model), spax);
}
function resolveEllipsis(font, ellipsis) {
  var _a;
  if (ellipsis !== void 0) {
    return ellipsis;
  }
  return font.advance((_a = ELLIPSIS.codePointAt(0)) != null ? _a : 0) !== void 0 ? ELLIPSIS : ELLIPSIS_FALLBACK;
}
function fittingPrefix(cps, suffix, font, maxWidth, spax) {
  const suffixWidth = widthOf(suffix, font, spax);
  let width = 0;
  let n = 0;
  for (const cp of cps) {
    const next = width + advanceOf(font, cp) + (n > 0 ? spax : 0);
    const total = next + (suffix.length > 0 ? spax + suffixWidth : 0);
    if (total > maxWidth) {
      break;
    }
    width = next;
    n++;
  }
  return n;
}
function cutWithEllipsis(cps, font, maxWidth, ellipsis, spax, force) {
  if (!force && widthOf(cps, font, spax) <= maxWidth) {
    return String.fromCodePoint(...cps);
  }
  const suffix = codePoints(ellipsis);
  if (suffix.length > 0 && widthOf(suffix, font, spax) <= maxWidth) {
    let n = fittingPrefix(cps, suffix, font, maxWidth, spax);
    while (n > 0 && cps[n - 1] === 32) {
      n--;
    }
    return String.fromCodePoint(...cps.slice(0, n)) + ellipsis;
  }
  return String.fromCodePoint(...cps.slice(0, fittingPrefix(cps, [], font, maxWidth, spax)));
}
function fitLimited(cps, font, maxChars, maxWidth, spax) {
  const head = cps.slice(0, maxChars);
  return String.fromCodePoint(...head.slice(0, fittingPrefix(head, [], font, maxWidth, spax)));
}
function fitText(text, fontId, model, maxWidth, opts) {
  var _a, _b;
  const font = getFont(fontId, model);
  if (font.maxChars !== void 0) {
    return fitLimited(codePoints(text), font, font.maxChars, maxWidth, (_a = opts == null ? void 0 : opts.spax) != null ? _a : 0);
  }
  const ellipsis = resolveEllipsis(font, opts == null ? void 0 : opts.ellipsis);
  return cutWithEllipsis(codePoints(text), font, maxWidth, ellipsis, (_b = opts == null ? void 0 : opts.spax) != null ? _b : 0, false);
}
function wrapParagraph(cps, font, maxWidth, spax) {
  const space = 32;
  const lines = [];
  let line = null;
  let i = 0;
  while (i <= cps.length) {
    let j = i;
    while (j < cps.length && cps[j] !== space) {
      j++;
    }
    const start = line ? line.start : i;
    if (widthOf(cps.slice(start, j), font, spax) <= maxWidth) {
      line = { start, end: j };
    } else if (line && i === j) {
    } else {
      if (line) {
        lines.push(line);
        line = null;
      }
      let k = i;
      while (widthOf(cps.slice(k, j), font, spax) > maxWidth) {
        const n = Math.max(1, fittingPrefix(cps.slice(k, j), [], font, maxWidth, spax));
        lines.push({ start: k, end: k + n });
        k += n;
      }
      line = { start: k, end: j };
    }
    i = j + 1;
  }
  if (line) {
    lines.push(line);
  }
  return lines;
}
function wrapText(text, fontId, model, maxWidth, maxLines, opts) {
  var _a, _b;
  const font = getFont(fontId, model);
  if (maxLines < 1) {
    return [];
  }
  const spax = (_a = opts == null ? void 0 : opts.spax) != null ? _a : 0;
  if (font.maxChars !== void 0) {
    return [fitLimited(codePoints((_b = text.split(/\r?\n/)[0]) != null ? _b : ""), font, font.maxChars, maxWidth, spax)];
  }
  const lines = [];
  for (const paragraph of text.split(/\r?\n/)) {
    const cps = codePoints(paragraph);
    for (const span of wrapParagraph(cps, font, maxWidth, spax)) {
      lines.push({ cps, span });
    }
  }
  const out = lines.slice(0, maxLines).map((l) => String.fromCodePoint(...l.cps.slice(l.span.start, l.span.end)));
  const last = lines[maxLines - 1];
  const next = lines[maxLines];
  if (last && next) {
    const ellipsis = resolveEllipsis(font, opts == null ? void 0 : opts.ellipsis);
    const sameParagraph = next.cps === last.cps;
    const rest = sameParagraph ? last.cps.slice(last.span.start) : last.cps.slice(last.span.start, last.span.end);
    out[maxLines - 1] = cutWithEllipsis(rest, font, maxWidth, ellipsis, spax, true);
  }
  return out;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ELLIPSIS,
  ELLIPSIS_FALLBACK,
  NOTIFY_ICON_FONT,
  charAdvance,
  fitText,
  fontHeight,
  fontWidthModel,
  hasGlyph,
  isFontId,
  textWidth,
  wrapText
});
//# sourceMappingURL=text-width.js.map
