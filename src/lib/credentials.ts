/**
 * Access to the central credentials of the admin (`system.credentials.<name>`, admin >= 7.9,
 * js-controller >= 7.2.2, read through `@iobroker/adapter-core/credentials`).
 *
 * The instance settings only store the object id of a credential; the values are read here,
 * decrypted by the controller and never written to the log. Every function falls back to the
 * legacy field of the instance settings, so configurations without a credential id keep working
 * exactly as before.
 */
import * as Credentials from '@iobroker/adapter-core/credentials';

/** Where a resolved value came from. */
export type CredentialSource = 'credential' | 'legacy' | 'none';

/** Result of {@link resolveLogin}. */
export interface LoginResolution {
    source: CredentialSource;
    login: string;
    password: string;
    /** Display name of the credential, only set for source 'credential'. */
    name?: string;
}

/** Result of {@link resolveSecret}. */
export interface SecretResolution {
    source: CredentialSource;
    secret: string;
    /** Display name of the credential, only set for source 'credential'. */
    name?: string;
}

/** The decrypted values of a credential; `form` is written by the admin, the rest depends on the form. */
type CredentialValues = { login?: unknown; password?: unknown; key?: unknown; form?: unknown };

/**
 * Checks whether a value is the id of a central credential.
 *
 * @param id - the value from the instance settings
 * @returns true for `system.credentials.<name>`
 */
export function isCredentialId(id: unknown): id is string {
    return (
        typeof id === 'string' &&
        id.startsWith(Credentials.CREDENTIALS_PREFIX) &&
        id.length > Credentials.CREDENTIALS_PREFIX.length
    );
}

function asText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

/**
 * Reads and decrypts a credential. Never throws: a missing object (deleted in the admin) or a
 * decryption error (object copied from a system with another secret) ends up as a warning.
 *
 * @param adapter - the adapter instance
 * @param id - the credential id
 * @returns name and values, or undefined if the credential is unusable
 */
async function readCredential(
    adapter: ioBroker.Adapter,
    id: string,
): Promise<{ name: string; values: CredentialValues } | undefined> {
    try {
        const info = await Credentials.getCredentials<CredentialValues>(adapter, id);
        return { name: info.name || id.substring(Credentials.CREDENTIALS_PREFIX.length), values: info.values ?? {} };
    } catch (e: unknown) {
        adapter.log.warn(`Cannot read credential "${id}": ${e instanceof Error ? e.message : String(e)}`);
        return undefined;
    }
}

/**
 * Resolves a login (user name + password), preferring the central credential.
 *
 * The picker in the admin does not filter by form, so a `key` credential can be selected here;
 * it has no login and is rejected with a warning. Without a usable credential the legacy fields
 * are returned.
 *
 * @param adapter - the adapter instance
 * @param credentialId - the id from the instance settings, may be empty
 * @param legacyLogin - the user name from the instance settings
 * @param legacyPassword - the password from the instance settings
 * @returns the login to use and where it came from
 */
export async function resolveLogin(
    adapter: ioBroker.Adapter,
    credentialId: unknown,
    legacyLogin: unknown,
    legacyPassword: unknown,
): Promise<LoginResolution> {
    if (isCredentialId(credentialId)) {
        const cred = await readCredential(adapter, credentialId);
        if (cred) {
            const login = asText(cred.values.login);
            const password = asText(cred.values.password);
            if (login && password) {
                return { source: 'credential', login, password, name: cred.name };
            }
            adapter.log.warn(
                `Credential "${cred.name}" (${credentialId}) has no ${login ? 'password' : 'login'} - it must be of the form "login & password"; using the fields of the instance settings instead`,
            );
        }
    } else if (typeof credentialId === 'string' && credentialId) {
        adapter.log.warn(`Ignoring invalid credential id "${credentialId}"`);
    }
    const login = asText(legacyLogin);
    const password = asText(legacyPassword);
    return login && password ? { source: 'legacy', login, password } : { source: 'none', login, password };
}

/**
 * Resolves a single secret (password or key), preferring the central credential.
 *
 * Both forms are accepted: `key` credentials deliver their key, `login & password` credentials
 * their password (the login is ignored). Without a usable credential the legacy value is returned.
 *
 * @param adapter - the adapter instance
 * @param credentialId - the id from the instance settings, may be empty
 * @param legacySecret - the value from the instance settings
 * @returns the secret to use and where it came from
 */
export async function resolveSecret(
    adapter: ioBroker.Adapter,
    credentialId: unknown,
    legacySecret: unknown,
): Promise<SecretResolution> {
    if (isCredentialId(credentialId)) {
        const cred = await readCredential(adapter, credentialId);
        if (cred) {
            const secret = asText(cred.values.key) || asText(cred.values.password);
            if (secret) {
                return { source: 'credential', secret, name: cred.name };
            }
            adapter.log.warn(
                `Credential "${cred.name}" (${credentialId}) is empty - using the field of the instance settings instead`,
            );
        }
    } else if (typeof credentialId === 'string' && credentialId) {
        adapter.log.warn(`Ignoring invalid credential id "${credentialId}"`);
    }
    const secret = asText(legacySecret);
    return secret ? { source: 'legacy', secret } : { source: 'none', secret: '' };
}
