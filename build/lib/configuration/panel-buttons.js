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
var panel_buttons_exports = {};
__export(panel_buttons_exports, {
  applyAdminButtons: () => applyAdminButtons
});
module.exports = __toCommonJS(panel_buttons_exports);
var import_config_manager_const = require("../const/config-manager-const");
function applyAdminButtons(scriptButtons, admin) {
  const invalid = [];
  if (!admin || admin.buttonLeft === void 0 && admin.buttonRight === void 0) {
    return { buttons: scriptButtons != null ? scriptButtons : null, invalid };
  }
  const buttons = {
    left: scriptButtons ? scriptButtons.left : null,
    right: scriptButtons ? scriptButtons.right : null
  };
  const sides = [
    ["left", admin.buttonLeft],
    ["right", admin.buttonRight]
  ];
  for (const [side, action] of sides) {
    if (action === void 0) {
      continue;
    }
    if ((0, import_config_manager_const.isButton)(action)) {
      buttons[side] = action;
    } else {
      invalid.push(side);
    }
  }
  return { buttons, invalid };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  applyAdminButtons
});
//# sourceMappingURL=panel-buttons.js.map
