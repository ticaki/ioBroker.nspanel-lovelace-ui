import { expect } from 'chai';
import {
    finishPieSlices,
    fitPieText,
    formatPieValueText,
    PIE_NAME_BUDGET,
    PIE_TEXT_BUDGET,
    PIE_TEXT_BUDGET_WITH_PERCENT,
    pieCharWidth,
    pieTextBudget,
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
            expect(parsePieScriptString(example)).to.deep.equal([
                { name: 'Netzbezug', value: 5200, text: '5.20 kWh', color: '63488' },
                { name: 'Eigennutzung', value: 3100, text: '3.10 kWh', color: '2016' },
                { name: 'Einspeisung', value: 1500, text: '1.50 kWh', color: '2047' },
            ]);
        });

        it('drops an incomplete last group and handles empty input', () => {
            expect(parsePieScriptString(`${example}~Rest~1`)).to.have.length(3);
            expect(parsePieScriptString('')).to.deep.equal([]);
            expect(parsePieScriptString(null)).to.deep.equal([]);
        });

        it('returns every slice, the summary is left to finishPieSlices', () => {
            const eight = Array.from({ length: 8 }, (_, i) => `S${i + 1}~${i + 1}~${i + 1} W~${100 + i}`).join('~');
            expect(parsePieScriptString(eight)).to.have.length(8);
        });

        it('treats a non-numeric number as 0 and converts hex colors', () => {
            expect(parsePieScriptString('A~abc~-~#ff0000')).to.deep.equal([
                { name: 'A', value: 0, text: '-', color: '63488' },
            ]);
        });
    });

    describe('mergePieRest', () => {
        it('keeps exactly five slices, sums six or more up as "Other" from the fifth on', () => {
            const slice = (i: number): { name: string; value: number; text: string; color: string } => ({
                name: `S${i + 1}`,
                value: i + 1,
                text: `${i + 1} W`,
                color: String(100 + i),
            });
            const five = Array.from({ length: 5 }, (_, i) => slice(i));
            expect(mergePieRest(five, 'Sonstiges').map(s => s.name)).to.deep.equal(['S1', 'S2', 'S3', 'S4', 'S5']);

            const eight = Array.from({ length: 8 }, (_, i) => slice(i));
            const merged = mergePieRest(eight, 'Sonstiges');
            expect(merged).to.have.length(5);
            expect(merged[4]).to.deep.equal({ name: 'Sonstiges', value: 5 + 6 + 7 + 8, text: '', color: '104' });
        });

        it('ignores negative numbers in the sum of the rest', () => {
            const slices = Array.from({ length: 7 }, (_, i) => ({
                name: `S${i}`,
                value: i === 6 ? -100 : 10,
                text: '',
                color: String(i),
            }));
            const merged = mergePieRest(slices, 'Other');

            expect(merged[4]).to.deep.equal({ name: 'Other', value: 20, text: '', color: '4' });
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

        it('removes the separator from names and texts and sums the rest up as the fifth slice', () => {
            const slices = finishPieSlices(
                Array.from({ length: 8 }, (_, i) => ({ name: `a~b${i}`, value: 1, text: 'x~y', color: String(i) })),
                3,
                'Sonst~iges',
            );

            expect(slices).to.have.length(5);
            expect(slices[0].name).to.equal('a-b0');
            expect(slices[0].text).to.equal('x-y');
            expect(slices[4]).to.deep.equal({
                name: 'Sonst-iges',
                value: 4 * (PIE_TARGET_SUM / 8),
                text: '',
                color: '4',
            });
            expect(pieSlicesToPayload(slices).split('~')).to.have.length(20);
            // the default name of the summary slice
            expect(
                finishPieSlices(Array.from({ length: 7 }, () => ({ name: 'x', value: 1, text: '', color: '1' })))[4]
                    .name,
            ).to.equal('Other');
        });

        it('keeps a zero slice in the list (legend line without a piece)', () => {
            const slices = finishPieSlices([
                { name: 'A', value: 0, text: '0.00 W', color: '1' },
                { name: 'B', value: 3, text: '3.00 W', color: '2' },
            ]);

            expect(slices.map(s => s.value)).to.deep.equal([0, PIE_TARGET_SUM]);
        });
    });

    describe('fitPieText - the legend width measured on the panel', () => {
        const lower = (n: number): string => 'a'.repeat(n);
        const upper = (n: number): string => 'A'.repeat(n);
        const digits = (n: number): string => '1234567890'.repeat(2).slice(0, n);

        it('name: 20 lower case letters fit, 21 do not', () => {
            expect(fitPieText(lower(20), PIE_NAME_BUDGET)).to.equal(lower(20));
            expect(fitPieText(lower(21), PIE_NAME_BUDGET)).to.equal(lower(20));
        });

        it('name: 17 capitals fit', () => {
            expect(fitPieText(upper(17), PIE_NAME_BUDGET)).to.equal(upper(17));
            expect(fitPieText(upper(18), PIE_NAME_BUDGET)).to.equal(upper(17));
        });

        it('value text next to the percentage (mode 3): 14 digits fit, 15 do not; 13 capitals, 15 lower case', () => {
            expect(pieTextBudget(3)).to.equal(PIE_TEXT_BUDGET_WITH_PERCENT);
            expect(fitPieText(digits(14), PIE_TEXT_BUDGET_WITH_PERCENT)).to.equal(digits(14));
            expect(fitPieText(digits(15), PIE_TEXT_BUDGET_WITH_PERCENT)).to.equal(digits(14));
            expect(fitPieText(upper(13), PIE_TEXT_BUDGET_WITH_PERCENT)).to.equal(upper(13));
            expect(fitPieText(upper(14), PIE_TEXT_BUDGET_WITH_PERCENT)).to.equal(upper(13));
            expect(fitPieText(lower(15), PIE_TEXT_BUDGET_WITH_PERCENT)).to.equal(lower(15));
            expect(fitPieText(lower(16), PIE_TEXT_BUDGET_WITH_PERCENT)).to.equal(lower(15));
        });

        it('value text without the percentage (mode 1) keeps 20 lower case letters', () => {
            expect(pieTextBudget(1)).to.equal(PIE_TEXT_BUDGET);
            expect(pieTextBudget(0)).to.equal(PIE_TEXT_BUDGET);
            expect(pieTextBudget(2)).to.equal(PIE_TEXT_BUDGET);
            expect(pieTextBudget(9)).to.equal(PIE_TEXT_BUDGET_WITH_PERCENT);
            expect(fitPieText(lower(20), PIE_TEXT_BUDGET)).to.equal(lower(20));
            expect(fitPieText(lower(21), PIE_TEXT_BUDGET)).to.equal(lower(20));
        });

        it('narrow and wide characters count less or more', () => {
            expect(pieCharWidth('i')).to.equal(0.6);
            expect(pieCharWidth(' ')).to.equal(0.6);
            expect(pieCharWidth('m')).to.equal(1.5);
            expect(pieCharWidth('%')).to.equal(1.5);
            expect(pieCharWidth('7')).to.equal(1.1);
            expect(pieCharWidth('B')).to.equal(1.2);
            expect(pieCharWidth('ä')).to.equal(1);
            // 33 narrow characters are still under 20 units, 13 wide ones are not
            expect(fitPieText('i'.repeat(33), PIE_NAME_BUDGET)).to.equal('i'.repeat(33));
            expect(fitPieText('w'.repeat(14), PIE_NAME_BUDGET)).to.equal('w'.repeat(14));
            expect(fitPieText('w'.repeat(15), PIE_NAME_BUDGET)).to.equal('w'.repeat(14));
        });

        it('cuts hard without an ellipsis and trims trailing blanks, empty stays empty', () => {
            // E(1.2) i(0.6) gennuzung … t(0.6) = 20.0 after "Photovolt", the "a" starting there is cut
            expect(fitPieText('Eigennutzung Photovoltaik', PIE_NAME_BUDGET)).to.equal('Eigennutzung Photovolt');
            // the blank still fits (19.6 before it) but is trimmed once the cut lands behind it
            expect(fitPieText(`${lower(19)}f xyz`, PIE_NAME_BUDGET)).to.equal(`${lower(19)}f`);
            expect(fitPieText('abc   ', PIE_NAME_BUDGET)).to.equal('abc');
            expect(fitPieText('   ', PIE_NAME_BUDGET)).to.equal('');
            expect(fitPieText('', PIE_NAME_BUDGET)).to.equal('');
            expect(fitPieText('kurz', PIE_NAME_BUDGET)).to.equal('kurz');
        });

        it('finishPieSlices fits both texts for the legend mode, the summary slice included', () => {
            const long = { name: lower(25), value: 1, text: digits(16), color: '1' };
            const other = { name: 'Sonstiges und noch viel mehr Text', value: 1, text: '', color: '2' };
            const mode3 = finishPieSlices([long, other], 3);
            expect(mode3[0].name).to.equal(lower(20));
            expect(mode3[0].text).to.equal(digits(14));
            expect(mode3[1].name).to.equal(fitPieText(other.name, PIE_NAME_BUDGET));
            expect(mode3[1].text).to.equal('');

            const mode1 = finishPieSlices([long], 1);
            expect(mode1[0].text).to.equal(digits(16));
            // the default is mode 3
            expect(finishPieSlices([long])[0].text).to.equal(digits(14));
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
