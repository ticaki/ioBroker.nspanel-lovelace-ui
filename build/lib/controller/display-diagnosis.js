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
var display_diagnosis_exports = {};
__export(display_diagnosis_exports, {
  DISPLAY_DIAGNOSIS_ANSWER_TIMEOUT_MS: () => DISPLAY_DIAGNOSIS_ANSWER_TIMEOUT_MS,
  DISPLAY_DIAGNOSIS_DELAY_MS: () => DISPLAY_DIAGNOSIS_DELAY_MS,
  DISPLAY_DIAGNOSIS_RETRY_MS: () => DISPLAY_DIAGNOSIS_RETRY_MS,
  GPIO_OUTPUT_LO: () => GPIO_OUTPUT_LO,
  NSPANEL_TEMPLATE_GPIO: () => NSPANEL_TEMPLATE_GPIO,
  buildDisplayDiagnosisMessage: () => buildDisplayDiagnosisMessage,
  evaluateDisplayDiagnosis: () => evaluateDisplayDiagnosis,
  parseGpio4Answer: () => parseGpio4Answer,
  parseModuleAnswer: () => parseModuleAnswer
});
module.exports = __toCommonJS(display_diagnosis_exports);
const GPIO_OUTPUT_LO = 3872;
const NSPANEL_TEMPLATE_GPIO = "[0,0,0,0,3872,0,0,0,0,0,32,0,0,0,0,225,0,480,224,1,0,0,0,33,0,0,0,0,0,0,0,0,0,0,4736,0]";
const DISPLAY_DIAGNOSIS_DELAY_MS = 6e4;
const DISPLAY_DIAGNOSIS_ANSWER_TIMEOUT_MS = 1e4;
const DISPLAY_DIAGNOSIS_RETRY_MS = 3e5;
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseModuleAnswer(msg) {
  if (!isRecord(msg) || !isRecord(msg.Module)) {
    return null;
  }
  const entries = Object.entries(msg.Module);
  if (entries.length !== 1) {
    return null;
  }
  const [id, name] = entries[0];
  return { id, name: typeof name === "string" ? name : String(name) };
}
function parseGpio4Answer(msg) {
  if (!isRecord(msg) || !isRecord(msg.GPIO4)) {
    return null;
  }
  const entries = Object.entries(msg.GPIO4);
  if (entries.length !== 1) {
    return null;
  }
  const [name, code] = entries[0];
  const num = typeof code === "number" ? code : parseInt(String(code));
  return { name, code: Number.isNaN(num) ? -1 : num };
}
function evaluateDisplayDiagnosis(answers) {
  const { module: module2, gpio4 } = answers;
  if (!module2 && !gpio4) {
    return { result: "noAnswer" };
  }
  const problems = [];
  if (module2 && module2.id !== "0") {
    problems.push(`Module is ${module2.id} (${module2.name}) instead of 0 (NSPanel template)`);
  }
  if (gpio4 && gpio4.code !== GPIO_OUTPUT_LO) {
    problems.push(`GPIO4 is "${gpio4.name}" (${gpio4.code}) instead of "Output Lo" (${GPIO_OUTPUT_LO})`);
  }
  return problems.length > 0 ? { result: "misconfigured", problems } : { result: "tasmotaOk" };
}
function buildDisplayDiagnosisMessage(result, topic, seconds) {
  switch (result.result) {
    case "noAnswer":
      return null;
    case "misconfigured":
      return `Panel with topic ${topic}: Tasmota is online, but the display has not answered for ${seconds} s. Wrong Tasmota configuration: ${result.problems.join("; ")}. Without GPIO4 = "Output Lo" the display gets no power and stays black. Fix: run in the Tasmota console: Backlog template {"NAME":"NSPanel","GPIO":${NSPANEL_TEMPLATE_GPIO},"FLAG":0,"BASE":1}; Module 0 - Tasmota restarts and the display should start.`;
    case "tasmotaOk":
      return `Panel with topic ${topic}: Tasmota is online and its configuration looks correct (Module 0 / GPIO4 "Output Lo"), but the display has not answered for ${seconds} s. Check the display firmware (flash the TFT again), the connection between ESP32 and display and the power supply.`;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DISPLAY_DIAGNOSIS_ANSWER_TIMEOUT_MS,
  DISPLAY_DIAGNOSIS_DELAY_MS,
  DISPLAY_DIAGNOSIS_RETRY_MS,
  GPIO_OUTPUT_LO,
  NSPANEL_TEMPLATE_GPIO,
  buildDisplayDiagnosisMessage,
  evaluateDisplayDiagnosis,
  parseGpio4Answer,
  parseModuleAnswer
});
//# sourceMappingURL=display-diagnosis.js.map
