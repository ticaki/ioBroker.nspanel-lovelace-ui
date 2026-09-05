/**
 * Hilfsfunktionen, um Zugangsdaten aus allem herauszuhalten, was ins Log geschrieben wird.
 */

/** Platzhalter, der anstelle eines Geheimnisses im Log steht. */
export const REDACTED = '***';

/** Schlüssel, deren Werte niemals im Klartext ins Log gehören. */
const SECRET_KEY_REGEX = /(pass(word|wd)?|pwd|secret|token|credential)/i;

/**
 * Ersetzt Zugangsdaten in einem Text - typischerweise einer Tasmota-URL oder einem Stacktrace,
 * in dem eine solche URL steckt.
 *
 * Abgedeckt sind der Query-Parameter `password=` der Tasmota-Weboberfläche und die
 * Backlog-Kommandos `MqttPassword` bzw. `WebPassword`, jeweils auch URL-kodiert.
 *
 * @param text - der zu bereinigende Text
 * @returns der Text mit maskierten Zugangsdaten
 */
export function redactSecretsInText(text: string): string {
    return (
        text
            // ...&password=geheim&... bzw. ...%26password%3Dgeheim
            .replace(/((?:pass(?:word)?|pwd)(?:=|%3D))[^&\s;]*/gi, `$1${REDACTED}`)
            // ...; MqttPassword geheim; ... - auch als %20/%3B kodiert
            .replace(
                /((?:mqtt|web)password(?:%20|\s)+)(?:(?!%3B|;|%20|\s).)*/gi,
                (_match: string, prefix: string) => `${prefix}${REDACTED}`,
            )
    );
}

/**
 * Baut eine Log-taugliche Kopie eines Objekts, in der alle Werte zu Schlüsseln wie `password`
 * oder `token` durch einen Platzhalter ersetzt sind. Das Original bleibt unverändert.
 *
 * @param value - der zu bereinigende Wert, beliebig verschachtelt
 * @returns eine Kopie ohne Zugangsdaten
 */
export function redactSecrets(value: unknown): unknown {
    if (typeof value === 'string') {
        return redactSecretsInText(value);
    }
    if (Array.isArray(value)) {
        return value.map(item => redactSecrets(item));
    }
    if (value && typeof value === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
            result[key] = SECRET_KEY_REGEX.test(key) ? REDACTED : redactSecrets(item);
        }
        return result;
    }
    return value;
}

/**
 * Serialisiert einen Wert für das Log und maskiert dabei alle Zugangsdaten.
 *
 * @param value - der zu serialisierende Wert
 * @returns das JSON ohne Zugangsdaten
 */
export function stringifyForLog(value: unknown): string {
    try {
        return JSON.stringify(redactSecrets(value)) ?? String(value);
    } catch {
        return '[unserializable]';
    }
}
