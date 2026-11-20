import { expect } from 'chai';
import { resolvePanelTargets, uniquePanelNames } from './panel-target';

describe('lib/controller/panel-target', () => {
    const panels = [
        { name: 'kitchen', friendlyName: 'Küche', topic: 'nspanel/kitchen' },
        { name: 'kitchen', friendlyName: 'Küche web', topic: 'web/kitchen' },
        { name: 'hall', friendlyName: 'Flur', topic: 'nspanel/hall' },
    ];

    it('without panel: all panels', () => {
        expect(resolvePanelTargets(panels, undefined).panels).to.deep.equal(panels);
        expect(resolvePanelTargets(panels, '').panels).to.deep.equal(panels);
    });

    it('finds by name, friendlyName or topic, string or array', () => {
        expect(resolvePanelTargets(panels, 'hall').panels).to.deep.equal([panels[2]]);
        expect(resolvePanelTargets(panels, 'Flur').panels).to.deep.equal([panels[2]]);
        expect(resolvePanelTargets(panels, 'nspanel/hall').panels).to.deep.equal([panels[2]]);
        expect(resolvePanelTargets(panels, ['Küche web', 'hall']).panels).to.deep.equal([panels[1], panels[2]]);
    });

    it('reports what it does not find', () => {
        expect(resolvePanelTargets(panels, ['x', 'hall', 3])).to.deep.equal({
            panels: [panels[2]],
            missing: ['x', '3'],
        });
    });

    it('names once per name (web clone)', () => {
        expect(uniquePanelNames(panels)).to.deep.equal(['kitchen', 'hall']);
    });
});
