import { expect } from 'chai';
import { Color } from './Color';
import { Icons } from './icon_mapping';
import { getShutterIconByPosition, pageItemDefaults, SHUTTER_POSITION_ICON } from './page-item-defaults';
import { getIconEntryValue } from './tools';
import type { Dataitem } from '../controller/data-item';

/**
 * Minimal stand-in for a const Dataitem - getIconEntryValue() only reads it via getString().
 *
 * @param value the string the item returns
 */
function constItem(value: string): Dataitem {
    const fake = { getString: async (): Promise<string> => value };
    return fake as unknown as Dataitem;
}

describe('lib/const/page-item-defaults', () => {
    describe('getShutterIconByPosition (0 = closed, 100 = open)', () => {
        it('keeps the icons of the end positions', () => {
            expect(getShutterIconByPosition(0)).to.equal(pageItemDefaults.blind.iconOff);
            expect(getShutterIconByPosition(100)).to.equal(pageItemDefaults.blind.iconOn);
            expect(pageItemDefaults.blind.iconOff).to.equal('window-shutter');
            expect(pageItemDefaults.blind.iconOn).to.equal('window-shutter-open');
        });
        it('counts 0-5 % as closed and 95-100 % as open', () => {
            expect(getShutterIconByPosition(5)).to.equal('window-shutter');
            expect(getShutterIconByPosition(5.1)).to.equal('window-shutter-75');
            expect(getShutterIconByPosition(94.9)).to.equal('window-shutter-25');
            expect(getShutterIconByPosition(95)).to.equal('window-shutter-open');
        });
        it('names the step icons after the closed part', () => {
            expect(getShutterIconByPosition(75)).to.equal('window-shutter-25');
            expect(getShutterIconByPosition(50)).to.equal('window-shutter-50');
            expect(getShutterIconByPosition(25)).to.equal('window-shutter-75');
        });
        it('picks the nearest step icon', () => {
            expect(getShutterIconByPosition(63)).to.equal('window-shutter-25'); // 37 % closed
            expect(getShutterIconByPosition(62.5)).to.equal('window-shutter-50'); // 37.5 % closed - tie rounds up
            expect(getShutterIconByPosition(38)).to.equal('window-shutter-50'); // 62 % closed
            expect(getShutterIconByPosition(37)).to.equal('window-shutter-75'); // 63 % closed
            expect(getShutterIconByPosition(10)).to.equal('window-shutter-75');
            expect(getShutterIconByPosition(90)).to.equal('window-shutter-25');
        });
        it('treats values beyond the range as end positions', () => {
            expect(getShutterIconByPosition(-10)).to.equal('window-shutter');
            expect(getShutterIconByPosition(120)).to.equal('window-shutter-open');
            expect(getShutterIconByPosition(Number.NaN)).to.equal('window-shutter-open');
        });
        it('works with an item inverted by its scale (minValueLevel 100 / maxValueLevel 0)', () => {
            // pageItem scales the raw value with Color.scale before; 20 raw = 80 % open = 20 % closed
            expect(getShutterIconByPosition(Color.scale(20, 100, 0, 0, 100))).to.equal('window-shutter-25');
            expect(getShutterIconByPosition(Color.scale(100, 100, 0, 0, 100))).to.equal('window-shutter');
            expect(getShutterIconByPosition(Color.scale(0, 100, 0, 0, 100))).to.equal('window-shutter-open');
        });
        it('works with the shutterClosedIsZero inversion (100 - raw)', () => {
            // shutterClosedIsZero = false: raw 0 is open, pageItem turns it into 100 - raw
            expect(getShutterIconByPosition(100 - 0)).to.equal('window-shutter-open');
            expect(getShutterIconByPosition(100 - 75)).to.equal('window-shutter-75');
        });
        it('the placeholder is no icon and all returned icons exist', () => {
            expect(Icons.GetIcon(SHUTTER_POSITION_ICON)).to.equal(SHUTTER_POSITION_ICON);
            for (const pos of [0, 25, 50, 75, 100]) {
                const name = getShutterIconByPosition(pos);
                expect(Icons.GetIcon(name), name).to.have.lengthOf(1);
            }
        });
    });

    describe('getIconEntryValue with the shutter placeholder', () => {
        it('resolves the placeholder by position', async () => {
            const icon = { true: { value: constItem(SHUTTER_POSITION_ICON) } };
            expect(await getIconEntryValue(icon, 50, 'window-open')).to.equal(Icons.GetIcon('window-shutter-50'));
            expect(await getIconEntryValue(icon, 0, 'window-open')).to.equal(Icons.GetIcon('window-shutter'));
            expect(await getIconEntryValue(icon, 100, 'window-open')).to.equal(Icons.GetIcon('window-shutter-open'));
        });
        it('resolves the placeholder for boolean values', async () => {
            const icon = { true: { value: constItem(SHUTTER_POSITION_ICON) } };
            expect(await getIconEntryValue(icon, true, '')).to.equal(Icons.GetIcon('window-shutter-open'));
            expect(await getIconEntryValue(icon, false, '')).to.equal(Icons.GetIcon('window-shutter'));
        });
        it('leaves an icon of the user unchanged', async () => {
            const icon = { true: { value: constItem('blinds-open') }, false: { value: constItem('blinds') } };
            expect(await getIconEntryValue(icon, 50, '')).to.equal(Icons.GetIcon('blinds-open'));
            expect(await getIconEntryValue(icon, 0, '')).to.equal(Icons.GetIcon('blinds'));
        });
    });
});
