import { expect } from 'chai';
import { Panel } from './panel';

describe('Panel.checkedModel', () => {
    it('keeps every known model without a warning', () => {
        const warnings: string[] = [];
        for (const model of ['eu', 'us-l', 'us-p', 'web-p', 'web-l']) {
            expect(Panel.checkedModel(model, 'P', m => warnings.push(m))).to.equal(model);
        }
        expect(warnings).to.deep.equal([]);
    });

    it('uses eu for a missing model without a warning (old configurations)', () => {
        const warnings: string[] = [];
        expect(Panel.checkedModel(undefined, 'P', m => warnings.push(m))).to.equal('eu');
        expect(Panel.checkedModel('', 'P', m => warnings.push(m))).to.equal('eu');
        expect(warnings).to.deep.equal([]);
    });

    it('reports an unknown model and falls back to eu', () => {
        const warnings: string[] = [];
        expect(Panel.checkedModel('web-portrait', 'Tablet', m => warnings.push(m))).to.equal('eu');
        expect(warnings).to.have.length(1);
        expect(warnings[0]).to.contain('Tablet').and.contain('"web-portrait"').and.contain('web-p');
    });
});
