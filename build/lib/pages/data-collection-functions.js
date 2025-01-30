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
async function handleCardRole(adapter, cardRole, page) {
  if (!cardRole) {
    return null;
  }
  switch (cardRole) {
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
        let n = obj.common.titleLang && obj.common.titleLang[adapter.library.getLocalLanguage()];
        n = n ? n : obj.common.titleLang && obj.common.titleLang.en;
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
    case "AdapterUpdates": {
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
  }
  return null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handleCardRole
});
//# sourceMappingURL=data-collection-functions.js.map
