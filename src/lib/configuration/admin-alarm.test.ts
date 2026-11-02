import { expect } from 'chai';
import type * as ShareConfig from '../types/adminShareConfig';
import { alarmButtonData } from './admin';

/**
 * An alarm entry with all eight button texts empty.
 *
 * @param over Fields of the entry that the single test sets.
 * @returns The entry for `alarmButtonData`.
 */
function alarmEntry(over: Partial<ShareConfig.UnlockEntry>): ShareConfig.UnlockEntry {
    return {
        card: 'cardAlarm',
        uniqueName: 'alarm',
        headline: 'Alarm',
        alarmType: 'alarm',
        button1: '',
        button2: '',
        button3: '',
        button4: '',
        button5: '',
        button6: '',
        button7: '',
        button8: '',
        pin: 1234,
        ...over,
    };
}

describe('lib/configuration - alarmButtonData', () => {
    it('takes a disarm button over without the arm button of the same row', () => {
        // the panel shows button5..8 while the page is armed - a fresh alarm page starts there
        const data = alarmButtonData(alarmEntry({ button5: 'Aus', button7: 'Teil aus' }));

        expect(data.button5).to.deep.equal({ type: 'const', constVal: 'Aus' });
        expect(data.button7).to.deep.equal({ type: 'const', constVal: 'Teil aus' });
        expect(data.button1).to.equal(undefined);
        expect(data.button3).to.equal(undefined);
    });

    it('takes an arm button over without the disarm button of the same row', () => {
        const data = alarmButtonData(alarmEntry({ button1: 'Scharf' }));

        expect(data.button1).to.deep.equal({ type: 'const', constVal: 'Scharf' });
        expect(data.button5).to.equal(undefined);
    });

    it('fills both columns independently', () => {
        const data = alarmButtonData(
            alarmEntry({
                button1: 'A1',
                button2: 'A2',
                button3: 'A3',
                button4: 'A4',
                button5: 'D1',
                button6: 'D2',
                button7: 'D3',
                button8: 'D4',
            }),
        );

        expect(Object.values(data).map(b => b?.constVal)).to.deep.equal([
            'A1',
            'A2',
            'A3',
            'A4',
            'D1',
            'D2',
            'D3',
            'D4',
        ]);
    });

    it('leaves every empty button undefined', () => {
        const data = alarmButtonData(alarmEntry({}));

        expect(Object.values(data).every(b => b === undefined)).to.equal(true);
    });
});
