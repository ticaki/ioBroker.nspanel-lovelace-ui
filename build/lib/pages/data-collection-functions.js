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
var data_collection_functions_exports = {};
__export(data_collection_functions_exports, {
  handleCardRole: () => handleCardRole
});
module.exports = __toCommonJS(data_collection_functions_exports);
var import_Color = require("../const/Color");
var import_tools = require("../const/tools");
var import_pages = require("../types/pages");
async function handleCardRole(adapter, cardRole, page, _options) {
  var _a, _b, _c;
  if (!cardRole) {
    return null;
  }
  switch (cardRole) {
    /**
     * only for enabled adapters
     */
    case "AdapterConnection":
    case "AdapterStopped": {
      const list = await adapter.getObjectViewAsync("system", "instance", {
        startkey: `system.adapter`,
        endkey: `system.adapter}`
      });
      if (!list) {
        return null;
      }
      const result = [];
      for (const item of list.rows) {
        const obj = item.value;
        if (!obj.common.enabled || obj.common.mode !== "daemon") {
          continue;
        }
        let n = obj.common.titleLang && typeof obj.common.titleLang == "object" && obj.common.titleLang[adapter.library.getLocalLanguage()];
        n = n ? n : typeof obj.common.titleLang == "object" && obj.common.titleLang.en;
        n = n ? n : obj.common.name;
        if (item.id.split(".").slice(2).join(".") === adapter.namespace) {
          continue;
        }
        const stateID = cardRole === "AdapterConnection" ? `${item.id.split(".").slice(2).join(".")}.info.connection` : `${item.id}.alive`;
        const stateObj = await adapter.getForeignObjectAsync(stateID);
        if (!stateObj || !stateObj.common || stateObj.common.type !== "boolean") {
          continue;
        }
        const pi = {
          role: "",
          type: "text",
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "checkbox-intermediate" },
                color: { type: "const", constVal: import_Color.Color.good }
              },
              false: {
                value: { type: "const", constVal: "checkbox-intermediate" },
                color: {
                  type: "const",
                  constVal: cardRole === "AdapterConnection" ? import_Color.Color.good : import_Color.Color.bad
                }
              },
              scale: void 0,
              maxBri: void 0,
              minBri: void 0
            },
            entity1: {
              value: {
                type: "triggered",
                dp: stateID
              }
            },
            text: {
              true: { type: "const", constVal: n },
              false: void 0
            },
            text1: {
              true: { type: "const", constVal: obj.common.version },
              false: void 0
            }
          }
        };
        result.push(pi);
      }
      return result;
    }
    case "AdapterUpdates":
      {
        if (!page || page.card !== "cardEntities" || !("items" in page) || !page.items || page.items.card !== "cardEntities") {
          return null;
        }
        if (!page.items.data.list) {
          return null;
        }
        const value = await page.items.data.list.getObject();
        if (value && page.items.data.list.options.type !== "const") {
          const dp = page.items.data.list.options.dp;
          const result = [];
          for (const a in value) {
            const pi = {
              role: "",
              type: "text",
              dpInit: "",
              data: {
                icon: {
                  true: {
                    value: { type: "const", constVal: "checkbox-intermediate" },
                    color: { type: "const", constVal: import_Color.Color.good }
                  },
                  false: {
                    value: { type: "const", constVal: "checkbox-intermediate" },
                    color: { type: "const", constVal: import_Color.Color.bad }
                  }
                },
                entity1: {
                  value: {
                    type: "triggered",
                    dp,
                    read: `return !!val`
                  }
                },
                text: {
                  true: {
                    type: "const",
                    constVal: a
                  },
                  false: void 0
                },
                text1: {
                  true: {
                    type: "state",
                    dp,
                    read: `if (!val || !val.startsWith('{') || !val.endsWith('}')) return '';
                                    const v = JSON.parse(val)
                                    return (
                                        v['${a}'] ? ('v' + v['${a}'].installedVersion.trim() + "\\r\\nv" + (v['${a}'].availableVersion.trim() + '  ' )) : 'done'
                                    );`
                  },
                  false: void 0
                }
              }
            };
            result.push(pi);
          }
          return result;
        }
      }
      break;
    case "SonosSpeaker": {
      let result = null;
      const _tempArr = _options == null ? void 0 : _options.cardRoleList;
      if (!((!_tempArr || Array.isArray(_tempArr)) && page && page.directParentPage)) {
        return null;
      }
      if (page.directParentPage.card !== "cardMedia" || page.directParentPage.currentItem == null) {
        break;
      }
      const identifier = `${(_a = page.directParentPage.currentItem) == null ? void 0 : _a.ident}`;
      const searchPath = identifier.split(".").slice(0, 3).join(".");
      const view = await adapter.getObjectViewAsync("system", "channel", {
        startkey: `${searchPath}.`,
        endkey: `${searchPath}${String.fromCharCode(65533)}`
      });
      const selects = [];
      if (view && view.rows && view.rows.length !== 0) {
        if (_tempArr && _tempArr.length > 0) {
          view.rows.filter((v) => _tempArr.includes((0, import_tools.getStringFromStringOrTranslated)(adapter, v.value.common.name))).forEach((v) => {
            selects.push({
              name: (0, import_tools.getStringFromStringOrTranslated)(adapter, v.value.common.name),
              id: v.id
            });
          });
        } else {
          view.rows.forEach(
            (v) => selects.push({
              name: (0, import_tools.getStringFromStringOrTranslated)(adapter, v.value.common.name),
              id: v.id
            })
          );
        }
      }
      let arr = _tempArr && _tempArr.length > 0 ? selects.filter((t) => _tempArr.findIndex((s) => s === t.name) !== -1) : selects;
      arr = arr.concat((_tempArr != null ? _tempArr : []).map((n) => ({ name: n, id: `` })));
      const seen = /* @__PURE__ */ new Set();
      arr = arr.filter((item) => item && !seen.has(item.name) && seen.add(item.name));
      arr = arr.sort((a, b) => a.name.localeCompare(b.name));
      result = [];
      for (let i = 0; i < arr.length; i++) {
        const val = arr[i].name.trim();
        const id = arr[i].id.trim();
        if (!val) {
          continue;
        }
        result.push({
          role: "volume.mute",
          type: "light",
          dpInit: "",
          data: {
            entity1: {
              value: {
                type: "triggered",
                dp: `${identifier}.members`,
                read: `
                                            if (typeof val === 'string') {                                                    
                                                const t = val.split(',').map(s => s.trim());
                                                return t.includes('${val}');
                                            };
                                            return false;`
              }
            },
            headline: { type: "const", constVal: val },
            dimmer: {
              value: {
                //mode: 'auto',
                type: "triggered",
                //regexp: /\.volume$/,
                dp: `${id}.volume`
              },
              minScale: { type: "const", constVal: (_b = _options == null ? void 0 : _options.min) != null ? _b : 0 },
              maxScale: { type: "const", constVal: (_c = _options == null ? void 0 : _options.max) != null ? _c : 100 }
            },
            icon: {
              true: {
                value: { type: "const", constVal: "speaker" },
                color: { type: "const", constVal: import_Color.Color.on }
              },
              false: {
                value: { type: "const", constVal: "speaker" },
                color: { type: "const", constVal: import_Color.Color.off }
              }
            },
            setValue1: {
              type: "state",
              dp: `${identifier}.add_to_group`,
              write: `if (val) return '${val}'; else return '';`
            },
            setValue2: {
              type: "state",
              dp: `${identifier}.remove_from_group`,
              write: `if (val) return '${val}'; else return '';`
            }
          }
        });
      }
      return result;
    }
    default: {
      (0, import_pages.exhaustiveCheck)(cardRole);
      return null;
    }
  }
  return null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handleCardRole
});
//# sourceMappingURL=data-collection-functions.js.map
