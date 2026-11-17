import { expect } from 'chai';
import {
    ALL_PANELS_SPECIAL_ID,
    type MenuEntry,
    type NavigationOverride,
    type ScreensaverEntry,
} from './adminShareConfig';
import { migratePanelTopic, type PanelTopicMigrationNative } from './panelTopicMigration';

const OLD = 'nspanel/old';
const NEW = 'nspanel/new';
const OTHER = 'nspanel/other';

function menu(uniqueName: string, assignment?: MenuEntry['navigationAssignment']): MenuEntry {
    return { card: 'cardGrid', uniqueName, headline: uniqueName, pageItems: [], navigationAssignment: assignment };
}

function screensaver(name: string, panels: string[]): ScreensaverEntry {
    return { name, mode: 'standard', panels } as ScreensaverEntry;
}

function override(panelTopic: string, page: string): NavigationOverride {
    return { panelTopic, page, navigation: { next: 'x' }, scriptLinks: {} };
}

describe('lib/types/panelTopicMigration', () => {
    describe('migratePanelTopic', () => {
        it('returns nothing when the topics are equal or empty', () => {
            const native: PanelTopicMigrationNative = { pageConfig: [menu('a', [{ topic: OLD }])] };
            expect(migratePanelTopic(native, OLD, OLD)).to.deep.equal({});
            expect(migratePanelTopic(native, '', NEW)).to.deep.equal({});
            expect(migratePanelTopic(native, OLD, '')).to.deep.equal({});
        });

        it('returns nothing when no table refers to the old topic', () => {
            const native: PanelTopicMigrationNative = {
                pageConfig: [menu('a', [{ topic: OTHER }]), menu('b')],
                screensaverConfig: [screensaver('s', [OTHER])],
                navigationOverrides: [override(OTHER, 'a')],
            };
            expect(migratePanelTopic(native, OLD, NEW)).to.deep.equal({});
        });

        it('moves the page assignments and keeps navigation, other topics and all panels', () => {
            const native: PanelTopicMigrationNative = {
                pageConfig: [
                    menu('a', [{ topic: OLD, navigation: { next: 'b' } }, { topic: OTHER }]),
                    menu('b', [{ topic: ALL_PANELS_SPECIAL_ID }]),
                ],
            };
            const result = migratePanelTopic(native, OLD, NEW);
            expect(result.pageConfig).to.deep.equal([
                menu('a', [{ topic: NEW, navigation: { next: 'b' } }, { topic: OTHER }]),
                menu('b', [{ topic: ALL_PANELS_SPECIAL_ID }]),
            ]);
            expect(result.pageConfig?.[1]).to.equal(native.pageConfig?.[1]);
            expect(result).to.not.have.property('screensaverConfig');
            expect(result).to.not.have.property('navigationOverrides');
        });

        it('only removes the old page assignment when the new topic is assigned already', () => {
            const native: PanelTopicMigrationNative = {
                pageConfig: [menu('a', [{ topic: OLD, navigation: { next: 'x' } }, { topic: NEW }])],
            };
            expect(migratePanelTopic(native, OLD, NEW).pageConfig).to.deep.equal([menu('a', [{ topic: NEW }])]);
        });

        it('moves the screensaver panels without duplicates', () => {
            const native: PanelTopicMigrationNative = {
                screensaverConfig: [
                    screensaver('one', [OTHER, OLD]),
                    screensaver('two', [OLD, NEW]),
                    screensaver('three', [OTHER]),
                ],
            };
            expect(migratePanelTopic(native, OLD, NEW).screensaverConfig).to.deep.equal([
                screensaver('one', [OTHER, NEW]),
                screensaver('two', [NEW]),
                screensaver('three', [OTHER]),
            ]);
        });

        it('moves the navigation overrides, the override of the new topic wins for the same page', () => {
            const kept = override(NEW, 'b');
            const native: PanelTopicMigrationNative = {
                navigationOverrides: [override(OLD, 'a'), override(OLD, 'b'), kept, override(OTHER, 'a')],
            };
            expect(migratePanelTopic(native, OLD, NEW).navigationOverrides).to.deep.equal([
                override(NEW, 'a'),
                kept,
                override(OTHER, 'a'),
            ]);
        });

        it('does not change the input', () => {
            const native: PanelTopicMigrationNative = {
                pageConfig: [menu('a', [{ topic: OLD }])],
                screensaverConfig: [screensaver('s', [OLD])],
                navigationOverrides: [override(OLD, 'a')],
            };
            const copy = structuredClone(native);
            migratePanelTopic(native, OLD, NEW);
            expect(native).to.deep.equal(copy);
        });
    });
});
