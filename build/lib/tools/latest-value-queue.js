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
var latest_value_queue_exports = {};
__export(latest_value_queue_exports, {
  LatestValueQueue: () => LatestValueQueue
});
module.exports = __toCommonJS(latest_value_queue_exports);
class LatestValueQueue {
  /**
   * @param job the async job for one value
   * @param onError gets the error of a failing job
   */
  constructor(job, onError) {
    this.job = job;
    this.onError = onError;
  }
  running = false;
  pending;
  /**
   * Adds a value. While a job runs, it only replaces the waiting value and returns at once.
   * Otherwise it runs the job and resolves when no value is waiting anymore. Never rejects.
   *
   * @param value the new value
   */
  async push(value) {
    this.pending = { value };
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      while (this.pending) {
        const next = this.pending.value;
        this.pending = void 0;
        try {
          await this.job(next);
        } catch (e) {
          this.onError(next, e);
        }
      }
    } finally {
      this.running = false;
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LatestValueQueue
});
//# sourceMappingURL=latest-value-queue.js.map
