import { describe, expect, it } from 'vitest';
import { BUILD_RELOAD_KEY, pageBuildId, shouldReloadForBuild, type BuildStorage, WEB_BUILD_META } from './buildCheck';

function memoryStorage(): BuildStorage & { data: Map<string, string> } {
    const data = new Map<string, string>();
    return {
        data,
        getItem: (key: string): string | null => data.get(key) ?? null,
        setItem: (key: string, value: string): void => {
            data.set(key, value);
        },
        removeItem: (key: string): void => {
            data.delete(key);
        },
    };
}

describe('build check', () => {
    it('reads the build id from the meta tag of the page', () => {
        const doc = {
            querySelector: (selector: string): { getAttribute: (name: string) => string | null } | null =>
                selector === `meta[name="${WEB_BUILD_META}"]`
                    ? { getAttribute: (name: string): string | null => (name === 'content' ? 'abc' : null) }
                    : null,
        };
        expect(pageBuildId(doc as Pick<Document, 'querySelector'>)).toBe('abc');
        expect(pageBuildId({ querySelector: (): null => null })).toBeUndefined();
        expect(pageBuildId(undefined)).toBeUndefined();
    });

    it('reloads once when the adapter serves another build', () => {
        const storage = memoryStorage();
        expect(shouldReloadForBuild('new', 'old', storage)).toBe(true);
        expect(storage.data.get(BUILD_RELOAD_KEY)).toBe('new');
        // after the reload the page is still old (cache) - no loop
        expect(shouldReloadForBuild('new', 'old', storage)).toBe(false);
        // the next update reloads again
        expect(shouldReloadForBuild('newer', 'old', storage)).toBe(true);
    });

    it('clears the guard when the builds match', () => {
        const storage = memoryStorage();
        expect(shouldReloadForBuild('a', 'b', storage)).toBe(true);
        expect(shouldReloadForBuild('a', 'a', storage)).toBe(false);
        expect(storage.data.has(BUILD_RELOAD_KEY)).toBe(false);
        expect(shouldReloadForBuild('c', 'a', storage)).toBe(true);
    });

    it('does nothing without a build id on either side', () => {
        const storage = memoryStorage();
        // older adapter
        expect(shouldReloadForBuild(undefined, 'a', storage)).toBe(false);
        expect(shouldReloadForBuild('', 'a', storage)).toBe(false);
        // dev server page without meta tag
        expect(shouldReloadForBuild('a', undefined, storage)).toBe(false);
        expect(storage.data.size).toBe(0);
    });

    it('never reloads without a working storage (no loop guard)', () => {
        expect(shouldReloadForBuild('a', 'b', undefined)).toBe(false);
        const broken: BuildStorage = {
            getItem: (): string | null => {
                throw new Error('blocked');
            },
            setItem: (): void => {
                throw new Error('blocked');
            },
            removeItem: (): void => {
                throw new Error('blocked');
            },
        };
        expect(shouldReloadForBuild('a', 'b', broken)).toBe(false);
        expect(shouldReloadForBuild('a', 'a', broken)).toBe(false);
    });
});
