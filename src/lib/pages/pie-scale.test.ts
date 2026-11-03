import { expect } from 'chai';
import {
    finishPieSlices,
    formatPieValueText,
    mergePieRest,
    parsePieScriptString,
    pieColorToDec,
    pieLegendMode,
    pieSlicesToPayload,
    PIE_TARGET_SUM,
    sanitizePieText,
    scalePieValues,
} from './pie-scale';

describe('lib/pages - pie-scale', () => {
    describe('scalePieValues', () => {
        it('scales with one factor so that the sum is about the target and stays far below 2 000 000', () => {
            const scaled = scalePieValues([5200, 3100, 1500]);
            const sum = scaled.reduce((a, b) => a + b, 0);

            expect(sum).to.be.closeTo(PIE_TARGET_SUM, 3);
            expect(sum).to.be.below(2_000_000);
            // proportions are kept: 5200 : 1500 = 3.4667
            expect(scaled[0] / scaled[2]).to.be.closeTo(5200 / 1500, 0.001);
            expect(scaled.every(v => Number.isInteger(v))).to.equal(true);
        });

        it('turns negative, NaN and infinite values into 0', () => {
            expect(scalePieValues([-5, NaN, Infinity, 10])).to.deep.equal([0, 0, 0, PIE_TARGET_SUM]);
        });

        it('keeps everything at 0 when nothing is positive (legend without pie)', () => {
            expect(scalePieValues([0, -1, 0])).to.deep.equal([0, 0, 0]);
            expect(scalePieValues([])).to.deep.equal([]);
        });

        it('never rounds a positive value down to 0', () => {
            const scaled = scalePieValues([1_000_000_000, 0.01]);

            expect(scaled[1]).to.equal(1);
            expect(scaled[0] + scaled[1]).to.be.below(2_000_000);
        });

        it('scales big sums down as well (kWh over a year, Wh over a day)', () => {
            const scaled = scalePieValues([123_456_789, 987_654_321]);

            expect(scaled.reduce((a, b) => a + b, 0)).to.be.closeTo(PIE_TARGET_SUM, 2);
        });
    });

    describe('formatPieValueText', () => {
        it('prints the decimals of the page and the unit', () => {
            expect(formatPieValueText(5.2, 2, 'kWh')).to.equal('5.20 kWh');
            expect(formatPieValueText(1500, 0, 'W')).to.equal('1500 W');
            expect(formatPieValueText(3.141_59, 1, '')).to.equal('3.1');
            expect(formatPieValueText(3.141_59, 1, undefined)).to.equal('3.1');
        });

        it('falls back to 2 decimals and removes the separator from the unit', () => {
            expect(formatPieValueText(1, NaN, 'a~b')).to.equal('1.00 a-b');
            expect(formatPieValueText(NaN, 2, 'W')).to.equal('0.00 W');
        });
    });

    describe('pieColorToDec', () => {
        it('passes RGB565 decimals through and converts hex colors', () => {
            expect(pieColorToDec('63488')).to.equal('63488');
            expect(pieColorToDec('#ff0000')).to.equal('63488');
            expect(pieColorToDec('#00ff00')).to.equal('2016');
            expect(pieColorToDec('#0000ff')).to.equal('31');
        });

        it('falls back to white', () => {
            expect(pieColorToDec('')).to.equal('65535');
            expect(pieColorToDec(undefined)).to.equal('65535');
        });
    });

    describe('parsePieScriptString', () => {
        const example = 'Netzbezug~5200~5.20 kWh~63488~Eigennutzung~3100~3.10 kWh~2016~Einspeisung~1500~1.50 kWh~2047';

        it('reads four fields per slice', () => {
            expect(parsePieScriptString(example, 'Other')).to.deep.equal([
                { name: 'Netzbezug', value: 5200, text: '5.20 kWh', color: '63488' },
                { name: 'Eigennutzung', value: 3100, text: '3.10 kWh', color: '2016' },
                { name: 'Einspeisung', value: 1500, text: '1.50 kWh', color: '2047' },
            ]);
        });

        it('drops an incomplete last group and handles empty input', () => {
            expect(parsePieScriptString(`${example}~Rest~1`, 'Other')).to.have.length(3);
            expect(parsePieScriptString('', 'Other')).to.deep.equal([]);
            expect(parsePieScriptString(null, 'Other')).to.deep.equal([]);
        });

        it('keeps exactly six slices, sums seven or more up as "Other" from the sixth on', () => {
            const six = Array.from({ length: 6 }, (_, i) => `S${i + 1}~${i + 1}~${i + 1} W~${100 + i}`).join('~');
            expect(parsePieScriptString(six, 'Sonstiges').map(s => s.name)).to.deep.equal([
                'S1',
                'S2',
                'S3',
                'S4',
                'S5',
                'S6',
            ]);

            const eight = `${six}~S7~7~7 W~106~S8~8~8 W~107`;
            const slices = parsePieScriptString(eight, 'Sonstiges');
            expect(slices).to.have.length(6);
            expect(slices[5]).to.deep.equal({ name: 'Sonstiges', value: 6 + 7 + 8, text: '', color: '105' });
        });

        it('treats a non-numeric number as 0 and converts hex colors', () => {
            expect(parsePieScriptString('A~abc~-~#ff0000', 'Other')).to.deep.equal([
                { name: 'A', value: 0, text: '-', color: '63488' },
            ]);
        });
    });

    describe('mergePieRest', () => {
        it('ignores negative numbers in the sum of the rest', () => {
            const slices = Array.from({ length: 7 }, (_, i) => ({
                name: `S${i}`,
                value: i === 6 ? -100 : 10,
                text: '',
                color: String(i),
            }));
            const merged = mergePieRest(slices, 'Other');

            expect(merged[5]).to.deep.equal({ name: 'Other', value: 10, text: '', color: '5' });
        });
    });

    describe('finishPieSlices and pieSlicesToPayload', () => {
        it('builds the fields from 17 on: Name~Number~Value text~Color per slice', () => {
            const slices = finishPieSlices([
                { name: 'Netzbezug', value: 50, text: '5.00 kWh', color: '63488' },
                { name: 'Einspeisung', value: 50, text: '5.00 kWh', color: '2047' },
            ]);

            expect(pieSlicesToPayload(slices)).to.equal(
                `Netzbezug~${PIE_TARGET_SUM / 2}~5.00 kWh~63488~Einspeisung~${PIE_TARGET_SUM / 2}~5.00 kWh~2047`,
            );
        });

        it('removes the separator from names and texts and cuts to six slices', () => {
            const slices = finishPieSlices(
                Array.from({ length: 8 }, (_, i) => ({ name: `a~b${i}`, value: 1, text: 'x~y', color: '1' })),
            );

            expect(slices).to.have.length(6);
            expect(slices[0].name).to.equal('a-b0');
            expect(slices[0].text).to.equal('x-y');
            expect(pieSlicesToPayload(slices).split('~')).to.have.length(24);
        });

        it('keeps a zero slice in the list (legend line without a piece)', () => {
            const slices = finishPieSlices([
                { name: 'A', value: 0, text: '0.00 W', color: '1' },
                { name: 'B', value: 3, text: '3.00 W', color: '2' },
            ]);

            expect(slices.map(s => s.value)).to.deep.equal([0, PIE_TARGET_SUM]);
        });
    });

    it('sanitizes texts and legend modes', () => {
        expect(sanitizePieText(' a~b ')).to.equal('a-b');
        expect(sanitizePieText(undefined)).to.equal('');
        expect(pieLegendMode(0)).to.equal(0);
        expect(pieLegendMode(2)).to.equal(2);
        expect(pieLegendMode(4)).to.equal(3);
        expect(pieLegendMode(null)).to.equal(3);
        expect(pieLegendMode(1.5)).to.equal(3);
    });
});
