/**
 * Diagnosis for a hardware panel whose Tasmota is online but whose display never answers
 * `pageType~pageStartup`. The most common cause is a missing NSPanel template (`Module 1` /
 * ESP32-DevKit instead of `Module 0`): then GPIO4 is not `Output Lo` and the display gets no power.
 *
 * The functions here are pure - the panel sends `Module` and `Gpio 255`, collects the answers
 * from `stat/RESULT` and lets {@link evaluateDisplayDiagnosis} decide what to report.
 */

/** Tasmota GPIO code of `Output Lo` - GPIO4 must use it, it switches the power of the display on */
export const GPIO_OUTPUT_LO = 3872;

/** GPIO list of the NSPanel template (same for eu, us-p and us-l), see panel setup in main.ts */
export const NSPANEL_TEMPLATE_GPIO =
    '[0,0,0,0,3872,0,0,0,0,0,32,0,0,0,0,225,0,480,224,1,0,0,0,33,0,0,0,0,0,0,0,0,0,0,4736,0]';

/** Time without a startup event from the display before the Tasmota configuration is checked */
export const DISPLAY_DIAGNOSIS_DELAY_MS = 60_000;
/** Time to wait for the answers to `Module` and `Gpio 255` */
export const DISPLAY_DIAGNOSIS_ANSWER_TIMEOUT_MS = 10_000;
/** Minimum time between two queries while Tasmota does not answer at all */
export const DISPLAY_DIAGNOSIS_RETRY_MS = 300_000;

/** Active module as reported by Tasmota for `Module` */
export interface TasmotaModuleInfo {
    /** module id, `0` means the user template is active */
    id: string;
    /** module or template name */
    name: string;
}

/** Function of GPIO4 as reported by Tasmota for `Gpio 255` */
export interface TasmotaGpioInfo {
    /** function name, e.g. `Output Lo` or `None` */
    name: string;
    /** function code, e.g. 3872 */
    code: number;
}

/** Collected answers of one diagnosis run */
export interface DisplayDiagnosisAnswers {
    module?: TasmotaModuleInfo;
    gpio4?: TasmotaGpioInfo;
}

/** Result of one diagnosis run */
export type DisplayDiagnosisResult =
    | { result: 'noAnswer' }
    | { result: 'misconfigured'; problems: string[] }
    | { result: 'tasmotaOk' };

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Reads the answer to `Module`, e.g. `{"Module":{"0":"NSPanel"}}` or `{"Module":{"1":"ESP32-DevKit"}}`.
 *
 * @param msg parsed `stat/RESULT` payload
 * @returns the active module, null if the payload is no module answer
 */
export function parseModuleAnswer(msg: unknown): TasmotaModuleInfo | null {
    if (!isRecord(msg) || !isRecord(msg.Module)) {
        return null;
    }
    const entries = Object.entries(msg.Module);
    if (entries.length !== 1) {
        return null;
    }
    const [id, name] = entries[0];
    return { id, name: typeof name === 'string' ? name : String(name) };
}

/**
 * Reads GPIO4 from the answer to `Gpio 255`, e.g. `{"GPIO0":{"None":0},…,"GPIO4":{"Output Lo":3872},…}`.
 * Tasmota may split the answer into several messages, only the one with GPIO4 counts.
 *
 * @param msg parsed `stat/RESULT` payload
 * @returns the function of GPIO4, null if the payload does not contain GPIO4
 */
export function parseGpio4Answer(msg: unknown): TasmotaGpioInfo | null {
    if (!isRecord(msg) || !isRecord(msg.GPIO4)) {
        return null;
    }
    const entries = Object.entries(msg.GPIO4);
    if (entries.length !== 1) {
        return null;
    }
    const [name, code] = entries[0];
    const num = typeof code === 'number' ? code : parseInt(String(code));
    return { name, code: Number.isNaN(num) ? -1 : num };
}

/**
 * Decides whether the Tasmota configuration explains a display that does not answer.
 *
 * @param answers collected answers to `Module` and `Gpio 255`
 * @returns `noAnswer` if Tasmota did not answer, `misconfigured` with the problems found or `tasmotaOk`
 */
export function evaluateDisplayDiagnosis(answers: DisplayDiagnosisAnswers): DisplayDiagnosisResult {
    const { module, gpio4 } = answers;
    if (!module && !gpio4) {
        return { result: 'noAnswer' };
    }
    const problems: string[] = [];
    if (module && module.id !== '0') {
        problems.push(`Module is ${module.id} (${module.name}) instead of 0 (NSPanel template)`);
    }
    if (gpio4 && gpio4.code !== GPIO_OUTPUT_LO) {
        problems.push(`GPIO4 is "${gpio4.name}" (${gpio4.code}) instead of "Output Lo" (${GPIO_OUTPUT_LO})`);
    }
    return problems.length > 0 ? { result: 'misconfigured', problems } : { result: 'tasmotaOk' };
}

/**
 * Builds the log message for a diagnosis result.
 *
 * @param result result of {@link evaluateDisplayDiagnosis}
 * @param topic mqtt topic of the panel
 * @param seconds time without an answer from the display
 * @returns the message, null for `noAnswer` (Tasmota offline - nothing to report)
 */
export function buildDisplayDiagnosisMessage(
    result: DisplayDiagnosisResult,
    topic: string,
    seconds: number,
): string | null {
    switch (result.result) {
        case 'noAnswer':
            return null;
        case 'misconfigured':
            return (
                `Panel with topic ${topic}: Tasmota is online, but the display has not answered for ${seconds} s. ` +
                `Wrong Tasmota configuration: ${result.problems.join('; ')}. ` +
                `Without GPIO4 = "Output Lo" the display gets no power and stays black. ` +
                `Fix: run in the Tasmota console: ` +
                `Backlog template {"NAME":"NSPanel","GPIO":${NSPANEL_TEMPLATE_GPIO},"FLAG":0,"BASE":1}; Module 0 ` +
                `- Tasmota restarts and the display should start.`
            );
        case 'tasmotaOk':
            return (
                `Panel with topic ${topic}: Tasmota is online and its configuration looks correct (Module 0 / GPIO4 "Output Lo"), ` +
                `but the display has not answered for ${seconds} s. ` +
                `Check the display firmware (flash the TFT again), the connection between ESP32 and display and the power supply.`
            );
    }
}
