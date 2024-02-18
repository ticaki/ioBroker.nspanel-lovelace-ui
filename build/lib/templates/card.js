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
var card_exports = {};
__export(card_exports, {
  cardTemplates: () => cardTemplates
});
module.exports = __toCommonJS(card_exports);
const cardTemplates = [
  {
    template: "waste-calendar.entities",
    adapter: "0_userdata.0",
    card: "cardEntities",
    alwaysOn: "none",
    useColor: false,
    config: {
      card: "cardEntities",
      data: {
        headline: {
          type: "const",
          constVal: "Abfalltermine"
        }
      }
    },
    pageItems: [
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "trash-can" },
              color: { type: "state", dp: ".1.color", mode: "auto", role: "state" }
            }
          },
          entity1: {
            value: { type: "const", constVal: true }
          },
          text: {
            true: { type: "state", dp: ".1.event", mode: "auto", role: "state" },
            false: void 0
          },
          text1: {
            true: { type: "state", dp: ".1.date", mode: "auto", role: "state" },
            false: void 0
          }
        }
      },
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "trash-can" },
              color: { type: "state", dp: ".2.color", mode: "auto", role: "state" }
            }
          },
          entity1: {
            value: { type: "const", constVal: true }
          },
          text: {
            true: { type: "state", dp: ".2.event", mode: "auto", role: "state" },
            false: void 0
          },
          text1: {
            true: { type: "state", dp: ".2.date", mode: "auto", role: "state" },
            false: void 0
          }
        }
      },
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "trash-can" },
              color: { type: "state", dp: ".3.color", mode: "auto", role: "state" }
            }
          },
          entity1: {
            value: { type: "const", constVal: true }
          },
          text: {
            true: { type: "state", dp: ".3.event", mode: "auto", role: "state" },
            false: void 0
          },
          text1: {
            true: { type: "state", dp: ".3.date", mode: "auto", role: "state" },
            false: void 0
          }
        }
      },
      {
        role: "text.list",
        type: "text",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "trash-can" },
              color: { type: "state", dp: ".4.color", mode: "auto", role: "state" }
            }
          },
          entity1: {
            value: { type: "const", constVal: true }
          },
          text: {
            true: { type: "state", dp: ".4.event", mode: "auto", role: "state" },
            false: void 0
          },
          text1: {
            true: { type: "state", dp: ".4.date", mode: "auto", role: "state" },
            false: void 0
          }
        }
      }
    ],
    items: void 0
  }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cardTemplates
});
//# sourceMappingURL=card.js.map
