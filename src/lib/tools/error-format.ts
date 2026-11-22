/**
 * Formatiert Fehler für das Log inklusive ihrer Ursachenkette.
 *
 * Node-`fetch` (undici) wirft bei Netzwerkfehlern nur `TypeError: fetch failed`; der eigentliche
 * Grund (`ECONNREFUSED`, `EHOSTUNREACH`, ...) steckt in `cause`, ggf. verschachtelt, und bei
 * mehreren Verbindungsversuchen (IPv4/IPv6) in einem `AggregateError` mit `errors[]`.
 */

import { redactSecretsInText } from './redact';

/** Maximale Tiefe der Ursachenkette - schützt vor Zyklen und endlosen Ketten. */
const MAX_CAUSE_DEPTH = 5;

function isObject(value: unknown): value is object {
    return typeof value === 'object' && value !== null;
}

function getCode(value: unknown): string | undefined {
    if (isObject(value) && 'code' in value) {
        const code = value.code;
        if (typeof code === 'string' || typeof code === 'number') {
            return String(code);
        }
    }
    return undefined;
}

function getMessage(value: unknown): string {
    if (value instanceof Error) {
        return value.message;
    }
    if (isObject(value) && 'message' in value && typeof value.message === 'string') {
        return value.message;
    }
    return String(value);
}

function getErrors(value: object): unknown[] {
    if ('errors' in value) {
        const errors: unknown = value.errors;
        if (Array.isArray(errors)) {
            const list: unknown[] = errors;
            return list;
        }
    }
    return [];
}

function describeLink(value: unknown): string {
    const code = getCode(value);
    const message = getMessage(value);
    return [code, message].filter(part => part !== undefined && part !== '').join(' ');
}

/**
 * Sammelt `errors[]` und die `cause`-Kette unterhalb von `value`.
 *
 * @param value - das aktuelle Glied
 * @param depth - aktuelle Tiefe
 * @param seen - bereits besuchte Objekte (Zykluserkennung)
 * @returns die Teile in Reihenfolge, z. B. `cause: ECONNREFUSED connect ECONNREFUSED ...`
 */
function collectCauses(value: unknown, depth: number, seen: Set<object>): string[] {
    if (!isObject(value) || depth >= MAX_CAUSE_DEPTH) {
        return [];
    }
    seen.add(value);
    const parts: string[] = [];

    const errors = getErrors(value);
    if (errors.length > 0) {
        const items = errors.map(item => {
            if (isObject(item) && seen.has(item)) {
                return '[circular]';
            }
            const sub = collectCauses(item, depth + 1, seen);
            return sub.length > 0 ? `${describeLink(item)} (${sub.join(' | ')})` : describeLink(item);
        });
        parts.push(`errors: [${items.join('; ')}]`);
    }

    if ('cause' in value && value.cause !== undefined) {
        const cause: unknown = value.cause;
        if (isObject(cause) && seen.has(cause)) {
            parts.push('cause: [circular]');
        } else {
            parts.push(`cause: ${describeLink(cause)}`);
            parts.push(...collectCauses(cause, depth + 1, seen));
        }
    }
    return parts;
}

/**
 * Beschreibt die Ursachenkette eines Fehlers (ohne den Fehler selbst).
 *
 * @param e - der gefangene Wert
 * @returns z. B. ` | cause: ECONNREFUSED connect ECONNREFUSED 10.10.10.196:80` oder `''`
 */
export function describeErrorCauses(e: unknown): string {
    const parts = collectCauses(e, 0, new Set<object>());
    return parts.length > 0 ? ` | ${parts.join(' | ')}` : '';
}

/**
 * Formatiert einen gefangenen Wert für das Log: Fehlertext (oder Stack) plus Ursachenkette,
 * Zugangsdaten maskiert.
 *
 * @param e - der gefangene Wert
 * @param withStack - true: Stacktrace statt `Name: message`
 * @returns der log-taugliche Text
 */
export function formatErrorForLog(e: unknown, withStack = false): string {
    const head = e instanceof Error && withStack ? (e.stack ?? String(e)) : String(e);
    return redactSecretsInText(`${head}${describeErrorCauses(e)}`);
}
