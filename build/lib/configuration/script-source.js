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
var script_source_exports = {};
__export(script_source_exports, {
  MAX_SCRIPT_BACKUPS: () => MAX_SCRIPT_BACKUPS,
  backupName: () => backupName,
  clearButtonsInScript: () => clearButtonsInScript,
  clearScreensaverInScript: () => clearScreensaverInScript,
  planScriptBackup: () => planScriptBackup,
  removePagesFromScript: () => removePagesFromScript,
  scanScriptConfig: () => scanScriptConfig
});
module.exports = __toCommonJS(script_source_exports);
const MAX_SCRIPT_BACKUPS = 4;
const SCREENSAVER_ARRAY_PROPS = [
  "favoritScreensaverEntity",
  "alternateScreensaverEntity",
  "leftScreensaverEntity",
  "bottomScreensaverEntity",
  "indicatorScreensaverEntity",
  "notifyScreensaverEntity"
];
const SCREENSAVER_MR_PROPS = ["mrIcon1ScreensaverEntity", "mrIcon2ScreensaverEntity"];
const SCREENSAVER_ADVANCED_PROPS = /* @__PURE__ */ new Set(["screensaverSwipe", "screensaverIndicatorButtons"]);
const KIND_CODE = 0;
const KIND_COMMENT = 1;
const KIND_STRING = 2;
const KIND_TEMPLATE = 3;
const KIND_REGEX = 4;
const REGEX_KEYWORDS = /* @__PURE__ */ new Set([
  "return",
  "typeof",
  "case",
  "do",
  "else",
  "in",
  "of",
  "instanceof",
  "new",
  "delete",
  "void",
  "throw",
  "yield",
  "await"
]);
function isIdentChar(c) {
  return c !== "" && /[A-Za-z0-9_$]/.test(c);
}
function isSpace(c) {
  return c !== "" && /\s/.test(c);
}
function scanSource(src) {
  const n = src.length;
  const kind = new Uint8Array(n);
  const blankChars = new Array(n);
  let lastSig = "";
  let lastWord = "";
  function mark(from, to, k) {
    for (let p = from; p < to && p < n; p++) {
      kind[p] = k;
      blankChars[p] = src[p] === "\n" || src[p] === "\r" ? src[p] : " ";
    }
  }
  function scanRegex(start) {
    let i = start + 1;
    let inClass = false;
    while (i < n) {
      const c = src[i];
      if (c === "\n" || c === "\r") {
        return -1;
      }
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (inClass) {
        if (c === "]") {
          inClass = false;
        }
        i++;
        continue;
      }
      if (c === "[") {
        inClass = true;
        i++;
        continue;
      }
      if (c === "/") {
        i++;
        while (i < n && /[a-z]/i.test(src[i])) {
          i++;
        }
        return i;
      }
      i++;
    }
    return -1;
  }
  function scanTemplate(start) {
    mark(start, start + 1, KIND_TEMPLATE);
    let i = start + 1;
    while (i < n) {
      const c = src[i];
      if (c === "\\") {
        mark(i, i + 2, KIND_TEMPLATE);
        i += 2;
        continue;
      }
      if (c === "`") {
        mark(i, i + 1, KIND_TEMPLATE);
        return i + 1;
      }
      if (c === "$" && src[i + 1] === "{") {
        mark(i, i + 2, KIND_TEMPLATE);
        i = scanCode(i + 2, true);
        if (i < n) {
          mark(i, i + 1, KIND_TEMPLATE);
          i++;
        }
        continue;
      }
      mark(i, i + 1, KIND_TEMPLATE);
      i++;
    }
    return n;
  }
  function scanCode(start, stopAtBrace) {
    let i = start;
    let depth = 0;
    while (i < n) {
      const c = src[i];
      if (c === "/" && src[i + 1] === "/") {
        let j = i;
        while (j < n && src[j] !== "\n") {
          j++;
        }
        mark(i, j, KIND_COMMENT);
        i = j;
        continue;
      }
      if (c === "/" && src[i + 1] === "*") {
        const found = src.indexOf("*/", i + 2);
        const j = found < 0 ? n : found + 2;
        mark(i, j, KIND_COMMENT);
        i = j;
        continue;
      }
      if (c === "'" || c === '"') {
        let j = i + 1;
        while (j < n) {
          const d = src[j];
          if (d === "\\") {
            j += 2;
            continue;
          }
          if (d === c) {
            j++;
            break;
          }
          if (d === "\n") {
            break;
          }
          j++;
        }
        mark(i, j, KIND_STRING);
        i = Math.min(j, n);
        lastSig = c;
        lastWord = "";
        continue;
      }
      if (c === "`") {
        i = scanTemplate(i);
        lastSig = "`";
        lastWord = "";
        continue;
      }
      if (c === "/") {
        const isRegex = lastSig === "" || "(,=:[!&|?{};+-*%<>~^".includes(lastSig) || isIdentChar(lastSig) && REGEX_KEYWORDS.has(lastWord);
        if (isRegex) {
          const j = scanRegex(i);
          if (j > 0) {
            mark(i, j, KIND_REGEX);
            i = j;
            lastSig = "/";
            lastWord = "";
            continue;
          }
        }
      }
      if (isIdentChar(c)) {
        let j = i;
        while (j < n && isIdentChar(src[j])) {
          blankChars[j] = src[j];
          j++;
        }
        lastWord = src.slice(i, j);
        lastSig = src[j - 1];
        i = j;
        continue;
      }
      blankChars[i] = c;
      if (stopAtBrace) {
        if (c === "{") {
          depth++;
        } else if (c === "}") {
          if (depth === 0) {
            return i;
          }
          depth--;
        }
      }
      if (!isSpace(c)) {
        lastSig = c;
        lastWord = "";
      }
      i++;
    }
    return n;
  }
  scanCode(0, false);
  return { src, blank: blankChars.join(""), kind };
}
const OPENERS = "{[(";
const CLOSERS = "}])";
function findMatching(blank, open) {
  const stack = [];
  for (let i = open; i < blank.length; i++) {
    const c = blank[i];
    const oi = OPENERS.indexOf(c);
    if (oi >= 0) {
      stack.push(CLOSERS[oi]);
      continue;
    }
    if (CLOSERS.includes(c)) {
      if (stack.pop() !== c) {
        return -1;
      }
      if (stack.length === 0) {
        return i;
      }
    }
  }
  return -1;
}
function enclosingBrace(blank, pos) {
  let depth = 0;
  for (let i = pos - 1; i >= 0; i--) {
    const c = blank[i];
    if (CLOSERS.includes(c)) {
      depth++;
    } else if (OPENERS.includes(c)) {
      if (depth === 0) {
        return c === "{" ? i : -1;
      }
      depth--;
    }
  }
  return -1;
}
function skipTrivia(s, pos, limit) {
  let i = pos;
  while (i < limit && (s.kind[i] === KIND_COMMENT || s.kind[i] === KIND_CODE && isSpace(s.src[i]))) {
    i++;
  }
  return i;
}
function trimTrivia(s, pos, min) {
  let i = pos;
  while (i > min && (s.kind[i - 1] === KIND_COMMENT || s.kind[i - 1] === KIND_CODE && isSpace(s.src[i - 1]))) {
    i--;
  }
  return i;
}
function lineStart(src, pos) {
  const nl = src.lastIndexOf("\n", pos - 1);
  return nl < 0 ? 0 : nl + 1;
}
function lineEnd(src, pos) {
  const nl = src.indexOf("\n", pos);
  return nl < 0 ? src.length : nl;
}
function readStringLiteral(s, pos) {
  if (s.kind[pos] !== KIND_STRING) {
    return void 0;
  }
  let end = pos;
  while (end < s.src.length && s.kind[end] === KIND_STRING) {
    end++;
  }
  const raw = s.src.slice(pos, end);
  if (raw.length < 2 || raw[0] !== raw[raw.length - 1]) {
    return void 0;
  }
  return { value: raw.slice(1, -1).replace(/\\(.)/g, "$1"), end };
}
function parseObjectProperties(s, open, close) {
  const result = [];
  const nextComma = (from) => {
    let j = from;
    while (j < close) {
      const ch = s.blank[j];
      if (OPENERS.includes(ch)) {
        const m = findMatching(s.blank, j);
        if (m < 0 || m > close) {
          return -1;
        }
        j = m + 1;
        continue;
      }
      if (ch === ",") {
        return j;
      }
      j++;
    }
    return -1;
  };
  let i = open + 1;
  while (i < close) {
    i = skipTrivia(s, i, close);
    if (i >= close) {
      break;
    }
    const keyStart = i;
    let key;
    if (isIdentChar(s.blank[i])) {
      let j = i;
      while (j < close && isIdentChar(s.blank[j])) {
        j++;
      }
      key = s.src.slice(i, j);
      i = j;
    } else if (s.kind[i] === KIND_STRING) {
      const str = readStringLiteral(s, i);
      if (str) {
        key = str.value;
        i = str.end;
      }
    }
    i = skipTrivia(s, i, close);
    if (key === void 0 || s.blank[i] !== ":") {
      const c = nextComma(i);
      if (c < 0) {
        break;
      }
      i = c + 1;
      continue;
    }
    const valueStart = skipTrivia(s, i + 1, close);
    const comma = nextComma(valueStart);
    const rawEnd = comma < 0 ? close : comma;
    const valueEnd = trimTrivia(s, rawEnd, valueStart);
    result.push({ key, keyStart, valueStart, valueEnd, comma });
    i = comma < 0 ? close : comma + 1;
  }
  return result;
}
function parseArrayElements(s, open, close) {
  const result = [];
  let i = open + 1;
  while (i < close) {
    const start = skipTrivia(s, i, close);
    let j = start;
    while (j < close) {
      const ch = s.blank[j];
      if (OPENERS.includes(ch)) {
        const m = findMatching(s.blank, j);
        if (m < 0 || m > close) {
          return result;
        }
        j = m + 1;
        continue;
      }
      if (ch === ",") {
        break;
      }
      j++;
    }
    const comma = j < close ? j : -1;
    const end = trimTrivia(s, j, start);
    if (end > start) {
      result.push({ start, end, comma });
    }
    i = comma < 0 ? close : comma + 1;
  }
  return result;
}
function findConfigObject(s) {
  const re = /\b(?:const|let|var)\s+config\s*(?::[^=;{}()]*)?=\s*\{/g;
  for (const m of s.blank.matchAll(re)) {
    const open = m.index + m[0].length - 1;
    const close = findMatching(s.blank, open);
    if (close > open) {
      return { open, close };
    }
  }
  for (const m of s.blank.matchAll(/\bpanelTopic\s*:/g)) {
    const open = enclosingBrace(s.blank, m.index);
    if (open < 0) {
      continue;
    }
    const close = findMatching(s.blank, open);
    if (close < 0) {
      continue;
    }
    const props = parseObjectProperties(s, open, close);
    if (props.some((p) => p.key === "pages") && props.some((p) => p.key === "panelTopic")) {
      return { open, close };
    }
  }
  return void 0;
}
function arrayLiteralOf(s, prop) {
  if (s.src[prop.valueStart] !== "[") {
    return void 0;
  }
  const close = findMatching(s.blank, prop.valueStart);
  return close === prop.valueEnd - 1 ? { open: prop.valueStart, close } : void 0;
}
function objectLiteralOf(s, prop) {
  if (s.src[prop.valueStart] !== "{") {
    return void 0;
  }
  const close = findMatching(s.blank, prop.valueStart);
  return close === prop.valueEnd - 1 ? { open: prop.valueStart, close } : void 0;
}
function uniqueNameOf(s, obj) {
  const prop = parseObjectProperties(s, obj.open, obj.close).find((p) => p.key === "uniqueName");
  if (!prop) {
    return void 0;
  }
  const str = readStringLiteral(s, prop.valueStart);
  return str && str.end === prop.valueEnd ? str.value : void 0;
}
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function findDefinitions(s, id) {
  const result = [];
  const re = new RegExp(`\\b(?:const|let|var)\\s+${escapeRegExp(id)}\\s*(?::[^=;{}()]*)?=\\s*\\{`, "g");
  for (const m of s.blank.matchAll(re)) {
    const open = m.index + m[0].length - 1;
    const close = findMatching(s.blank, open);
    if (close < 0) {
      continue;
    }
    let p = close + 1;
    let valid = true;
    for (; ; ) {
      while (p < s.src.length && (s.src[p] === " " || s.src[p] === "	")) {
        p++;
      }
      if (p >= s.src.length || s.src[p] === "\n" || s.src[p] === "\r") {
        break;
      }
      if (s.kind[p] === KIND_COMMENT) {
        let q = p;
        while (q < s.src.length && s.kind[q] === KIND_COMMENT) {
          q++;
        }
        if (s.src.slice(p, q).includes("\n")) {
          break;
        }
        p = q;
        continue;
      }
      if (s.src[p] === ";") {
        p++;
        break;
      }
      if (s.src[p] === ",") {
        valid = false;
        break;
      }
      if (OPENERS.includes(s.blank[p])) {
        const mm = findMatching(s.blank, p);
        if (mm < 0) {
          valid = false;
          break;
        }
        p = mm + 1;
        continue;
      }
      p++;
    }
    if (valid) {
      result.push({ stmtStart: m.index, stmtEnd: trimTrivia(s, p, close + 1), body: { open, close } });
    }
  }
  return result;
}
function isReferencedOutside(s, id, exclude) {
  const re = new RegExp(`(^|[^A-Za-z0-9_$.])${escapeRegExp(id)}(?![A-Za-z0-9_$])`, "g");
  for (const m of s.blank.matchAll(re)) {
    const pos = m.index + m[1].length;
    if (pos < exclude.stmtStart || pos >= exclude.stmtEnd) {
      return true;
    }
  }
  return false;
}
function applyEdits(src, edits) {
  const deletions = edits.filter((e) => e.text === "" && e.end > e.start).sort((a, b) => a.start - b.start).reduce((acc, e) => {
    const last = acc[acc.length - 1];
    if (last && e.start <= last.end) {
      last.end = Math.max(last.end, e.end);
    } else {
      acc.push({ ...e });
    }
    return acc;
  }, []);
  const all = [...deletions, ...edits.filter((e) => e.text !== "")].sort((a, b) => b.start - a.start);
  let out = src;
  for (const e of all) {
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
  }
  return out;
}
function removalEdits(s, el) {
  const { src, kind } = s;
  let start = el.start;
  let end = el.end;
  let hasComma = false;
  for (; ; ) {
    let p = end;
    while (p < src.length && (src[p] === " " || src[p] === "	")) {
      p++;
    }
    if (!hasComma && src[p] === "," && kind[p] === KIND_CODE) {
      hasComma = true;
      end = p + 1;
      continue;
    }
    if (kind[p] === KIND_COMMENT) {
      let q = p;
      while (q < src.length && kind[q] === KIND_COMMENT) {
        q++;
      }
      if (!src.slice(p, q).includes("\n")) {
        end = q;
        continue;
      }
    }
    break;
  }
  const edits = [];
  if (hasComma) {
    while (end < src.length && (src[end] === " " || src[end] === "	")) {
      end++;
    }
  } else {
    let k = start - 1;
    while (k >= 0 && (kind[k] === KIND_COMMENT || kind[k] === KIND_CODE && isSpace(src[k]))) {
      k--;
    }
    if (k >= 0 && src[k] === "," && kind[k] === KIND_CODE) {
      const sameLine = !src.slice(k + 1, start).includes("\n");
      edits.push({ start: k, end: sameLine ? start : k + 1, text: "" });
    }
  }
  const ls = lineStart(src, start);
  const le = lineEnd(src, end);
  if (/^[ \t]*$/.test(src.slice(ls, start)) && /^[ \t\r]*$/.test(src.slice(end, le))) {
    start = ls;
    end = le < src.length ? le + 1 : le;
  }
  edits.push({ start, end, text: "" });
  return edits;
}
function markerEdit(src, pos, text) {
  const rest = src.slice(pos, lineEnd(src, pos));
  const asLine = /^[ \t\r]*$/.test(rest) || /^[ \t]*\/\//.test(rest);
  return { start: pos, end: pos, text: asLine ? ` // ${text}` : ` /* ${text} */` };
}
function replaceValueEdits(s, prop, value, marker) {
  const markerPos = prop.comma >= 0 ? prop.comma + 1 : prop.valueEnd;
  return [{ start: prop.valueStart, end: prop.valueEnd, text: value }, markerEdit(s.src, markerPos, marker)];
}
function commentOut(src, def, marker) {
  const ls = lineStart(src, def.stmtStart);
  const prefix = src.slice(ls, def.stmtStart);
  const indent = /^[ \t]*$/.test(prefix) ? prefix : "";
  const text = src.slice(def.stmtStart, def.stmtEnd);
  let replaced;
  if (text.includes("*/")) {
    const lines = text.split("\n").map(
      (line, i) => i === 0 ? `// ${line}` : line.startsWith(indent) ? `${indent}// ${line.slice(indent.length)}` : `// ${line}`
    );
    replaced = `// ${marker}
${indent}${lines.join("\n")}`;
  } else {
    replaced = `/* ${marker}
${indent}${text}
${indent}*/`;
  }
  return src.slice(0, def.stmtStart) + replaced + src.slice(def.stmtEnd);
}
function resolveElement(s, el) {
  const text = s.blank.slice(el.start, el.end).trim();
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(text)) {
    for (const def of findDefinitions(s, text)) {
      const uniqueName = uniqueNameOf(s, def.body);
      if (uniqueName !== void 0) {
        return { uniqueName, identifier: text };
      }
    }
    return { identifier: text };
  }
  if (s.src[el.start] === "{" && findMatching(s.blank, el.start) === el.end - 1) {
    return { uniqueName: uniqueNameOf(s, { open: el.start, close: el.end - 1 }) };
  }
  return {};
}
function scanScriptConfig(source) {
  const s = scanSource(source);
  const cfg = findConfigObject(s);
  if (!cfg) {
    return { found: false, pages: [], subPages: [] };
  }
  const props = parseObjectProperties(s, cfg.open, cfg.close);
  const entries = (key) => {
    const prop = props.find((p) => p.key === key);
    const arr = prop && arrayLiteralOf(s, prop);
    if (!arr) {
      return [];
    }
    return parseArrayElements(s, arr.open, arr.close).map((el) => {
      const text = s.src.slice(el.start, el.end);
      const resolved = resolveElement(s, el);
      return resolved.uniqueName !== void 0 ? { text, uniqueName: resolved.uniqueName } : { text };
    });
  };
  return { found: true, pages: entries("pages"), subPages: entries("subPages") };
}
function removePagesFromScript(source, uniqueNames, today) {
  const notes = [];
  const removed = [];
  const definitionKept = [];
  const wanted = [...new Set(uniqueNames)];
  let s = scanSource(source);
  const cfg = findConfigObject(s);
  if (!cfg) {
    notes.push("config object not found - script left unchanged");
    return { source, changed: false, notes, removed, notFound: wanted, definitionKept };
  }
  const props = parseObjectProperties(s, cfg.open, cfg.close);
  const edits = [];
  const found = /* @__PURE__ */ new Set();
  const identifiers = /* @__PURE__ */ new Map();
  for (const key of ["pages", "subPages"]) {
    const prop = props.find((p) => p.key === key);
    if (!prop) {
      notes.push(`${key} not found in the config object`);
      continue;
    }
    const arr = arrayLiteralOf(s, prop);
    if (!arr) {
      notes.push(`${key} is not an array literal - left unchanged`);
      continue;
    }
    for (const el of parseArrayElements(s, arr.open, arr.close)) {
      const resolved = resolveElement(s, el);
      if (resolved.uniqueName === void 0 || !wanted.includes(resolved.uniqueName)) {
        continue;
      }
      found.add(resolved.uniqueName);
      edits.push(...removalEdits(s, el));
      if (resolved.identifier) {
        identifiers.set(resolved.identifier, resolved.uniqueName);
      }
    }
  }
  const notFound = wanted.filter((name) => !found.has(name));
  removed.push(...wanted.filter((name) => found.has(name)));
  for (const name of notFound) {
    notes.push(`page "${name}" not found in pages/subPages - nothing removed`);
  }
  let out = applyEdits(source, edits);
  const marker = `NSPanel: converted to the admin page configuration on ${today}`;
  for (const [id, name] of identifiers) {
    s = scanSource(out);
    const def = findDefinitions(s, id).find((d) => uniqueNameOf(s, d.body) === name);
    if (!def) {
      definitionKept.push(name);
      notes.push(`definition of "${id}" (page "${name}") not found - left unchanged`);
      continue;
    }
    if (isReferencedOutside(s, id, def)) {
      definitionKept.push(name);
      notes.push(`"${id}" (page "${name}") is still referenced in the script - definition kept`);
      continue;
    }
    out = commentOut(out, def, marker);
  }
  return { source: out, changed: out !== source, notes, removed, notFound, definitionKept };
}
function clearScreensaverInScript(source, today) {
  const notes = [];
  const cleared = [];
  const s = scanSource(source);
  const cfg = findConfigObject(s);
  if (!cfg) {
    notes.push("config object not found - script left unchanged");
    return { source, changed: false, notes, cleared };
  }
  const marker = `NSPanel: moved to the admin screensaver on ${today}`;
  const props = parseObjectProperties(s, cfg.open, cfg.close);
  const edits = [];
  const valueText = (prop) => s.blank.slice(prop.valueStart, prop.valueEnd).trim();
  for (const key of SCREENSAVER_ARRAY_PROPS) {
    const prop = props.find((p) => p.key === key);
    if (!prop) {
      continue;
    }
    const arr = arrayLiteralOf(s, prop);
    if (!arr) {
      if (valueText(prop) !== "undefined") {
        notes.push(`${key} is not an array literal - left unchanged`);
      }
      continue;
    }
    if (parseArrayElements(s, arr.open, arr.close).length === 0) {
      continue;
    }
    edits.push(...replaceValueEdits(s, prop, "[]", marker));
    cleared.push(key);
  }
  for (const key of SCREENSAVER_MR_PROPS) {
    const prop = props.find((p) => p.key === key);
    if (!prop) {
      continue;
    }
    const text = valueText(prop);
    if (text === "undefined" || text === "null") {
      continue;
    }
    edits.push(...replaceValueEdits(s, prop, "undefined", marker));
    cleared.push(key);
  }
  const advanced = props.find((p) => p.key === "advancedOptions");
  if (advanced) {
    const obj = objectLiteralOf(s, advanced);
    if (!obj) {
      if (valueText(advanced) !== "undefined") {
        notes.push("advancedOptions is not an object literal - left unchanged");
      }
    } else {
      let any = false;
      for (const sub of parseObjectProperties(s, obj.open, obj.close)) {
        if (SCREENSAVER_ADVANCED_PROPS.has(sub.key)) {
          edits.push(...removalEdits(s, { start: sub.keyStart, end: sub.valueEnd }));
          cleared.push(`advancedOptions.${sub.key}`);
          any = true;
        }
      }
      if (any) {
        edits.push(markerEdit(s.src, advanced.comma >= 0 ? advanced.comma + 1 : advanced.valueEnd, marker));
      }
    }
  }
  const out = applyEdits(source, edits);
  return { source: out, changed: out !== source, notes, cleared };
}
function clearButtonsInScript(source, sides, today) {
  const notes = [];
  const s = scanSource(source);
  const cfg = findConfigObject(s);
  if (!cfg) {
    notes.push("config object not found - script left unchanged");
    return { source, changed: false, notes };
  }
  const marker = `NSPanel: moved to the admin panel configuration on ${today}`;
  const props = parseObjectProperties(s, cfg.open, cfg.close);
  const edits = [];
  for (const side of new Set(sides)) {
    const key = side === "left" ? "buttonLeft" : "buttonRight";
    const prop = props.find((p) => p.key === key);
    if (!prop) {
      notes.push(`${key} not found in the config object`);
      continue;
    }
    if (s.blank.slice(prop.valueStart, prop.valueEnd).trim() === "null") {
      continue;
    }
    edits.push(...replaceValueEdits(s, prop, "null", marker));
  }
  const out = applyEdits(source, edits);
  return { source: out, changed: out !== source, notes };
}
function planScriptBackup(scriptId, existingIds) {
  const re = new RegExp(`^${escapeRegExp(scriptId)}_([1-9]\\d*)_backup$`);
  const existing = [];
  for (const id of new Set(existingIds)) {
    const m = re.exec(id);
    if (m) {
      existing.push({ id, n: Number(m[1]) });
    }
  }
  existing.sort((a, b) => b.n - a.n);
  return {
    backupId: `${scriptId}_1_backup`,
    renames: existing.filter((e) => e.n < MAX_SCRIPT_BACKUPS).map((e) => ({ from: e.id, to: `${scriptId}_${e.n + 1}_backup` })),
    deletes: existing.filter((e) => e.n >= MAX_SCRIPT_BACKUPS).map((e) => e.id)
  };
}
function backupName(scriptName, n) {
  return `${scriptName.replace(/\s+backup\s+\d+$/, "")} backup ${n}`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MAX_SCRIPT_BACKUPS,
  backupName,
  clearButtonsInScript,
  clearScreensaverInScript,
  planScriptBackup,
  removePagesFromScript,
  scanScriptConfig
});
//# sourceMappingURL=script-source.js.map
