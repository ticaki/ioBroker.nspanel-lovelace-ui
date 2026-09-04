import { expect } from 'chai';
import { collectNavigationTargets } from './page-targets';
import { shortStateLabel, stateRefNodeId } from '../types/adminShareConfig';

/**
 * A `data` object of a page item with the given navigation targets.
 *
 * @param short Target of a short press, if any.
 * @param long Target of a long press, if any.
 * @returns The data object.
 */
function itemData(short?: string, long?: string): Record<string, any> {
    const data: Record<string, any> = {};
    if (short !== undefined) {
        data.setNavi = { type: 'const', constVal: short };
    }
    if (long !== undefined) {
        data.setNaviLongPress = { type: 'const', constVal: long };
    }
    return data;
}

describe('lib/configuration - collectNavigationTargets', () => {
    it('reads short and long press targets separately', () => {
        // The button of the vacuum room page: short press goes back, long press opens the details.
        const sources = [itemData('Saugroboter', 'Saugroboter-CleanDetails')];

        expect(collectNavigationTargets(sources, 'setNavi').pages).to.deep.equal(['Saugroboter']);
        expect(collectNavigationTargets(sources, 'setNaviLongPress').pages).to.deep.equal(['Saugroboter-CleanDetails']);
    });

    it('collects the targets of all items and of the page itself', () => {
        const sources = [itemData('a'), itemData('b'), itemData('c')];

        expect(collectNavigationTargets(sources, 'setNavi').pages).to.deep.equal(['a', 'b', 'c']);
    });

    it('reports a page only once when several items point at it', () => {
        const sources = [itemData('a'), itemData('a')];

        expect(collectNavigationTargets(sources, 'setNavi').pages).to.deep.equal(['a']);
    });

    it('reports the state a target is read from instead of a page', () => {
        // Which page this leads to is only known while the panel runs - the state is what we know.
        const sources = [{ setNavi: { type: 'triggered', dp: 'some.state' } }];

        const targets = collectNavigationTargets(sources, 'setNavi');

        expect(targets.pages).to.deep.equal([]);
        expect(targets.stateRefs).to.deep.equal(['some.state']);
    });

    it('reports a state only once when several items read from it', () => {
        const sources = [
            { setNavi: { type: 'triggered', dp: 'some.state' } },
            { setNavi: { type: 'state', dp: 'some.state' } },
        ];

        expect(collectNavigationTargets(sources, 'setNavi').stateRefs).to.deep.equal(['some.state']);
    });

    it('ignores missing, empty and non-string entries', () => {
        const sources = [
            undefined,
            null,
            {},
            { setNavi: undefined },
            { setNavi: { type: 'const', constVal: 7 } },
            { setNavi: { type: 'triggered' } },
        ];

        const targets = collectNavigationTargets(sources, 'setNavi');

        expect(targets.pages).to.deep.equal([]);
        expect(targets.stateRefs).to.deep.equal([]);
    });

    it('does not mix up the two fields', () => {
        const sources = [itemData(undefined, 'onlyLong')];

        expect(collectNavigationTargets(sources, 'setNavi').pages).to.deep.equal([]);
        expect(collectNavigationTargets(sources, 'setNaviLongPress').pages).to.deep.equal(['onlyLong']);
    });
});

describe('lib/types - state reference nodes', () => {
    it('keeps a state node apart from the page ids', () => {
        // Page ids come from the configuration; the prefix makes a collision practically impossible.
        expect(stateRefNodeId('alias.0.foo.bar')).to.equal('dp:alias.0.foo.bar');
    });

    it('shortens a long state id to its last two segments', () => {
        expect(shortStateLabel('alias.0.zuhause.og.Technik.Saugroboter.Raeme.Reinigung')).to.equal('…Raeme.Reinigung');
    });

    it('leaves a short state id alone', () => {
        expect(shortStateLabel('foo.bar')).to.equal('foo.bar');
        expect(shortStateLabel('foo')).to.equal('foo');
    });
});
