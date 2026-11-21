import { expect } from 'chai';
import { buildPanelButtonAction, isPanelButtonDialogMode, type PanelButtonFields } from './panelButtonAction';

const fields = (over: Partial<PanelButtonFields>): PanelButtonFields => ({
    mode: 'none',
    page: '',
    target: 'next',
    stateId: '',
    delay: '',
    ...over,
});

describe('src-admin - buildPanelButtonAction', () => {
    it('builds the mode navigation with each target, other fields do not matter', () => {
        for (const target of ['next', 'prev', 'home', 'parent'] as const) {
            expect(
                buildPanelButtonAction(fields({ mode: 'navigation', target, page: 'x', stateId: 'a.0.b' })),
            ).to.deep.equal({ ok: true, action: { mode: 'navigation', target } });
        }
    });

    it('keeps the rules of the other modes', () => {
        expect(buildPanelButtonAction(fields({ mode: 'none' }))).to.deep.equal({ ok: true, action: undefined });
        expect(buildPanelButtonAction(fields({ mode: 'page', page: ' main ' }))).to.deep.equal({
            ok: true,
            action: { mode: 'page', page: 'main' },
        });
        expect(buildPanelButtonAction(fields({ mode: 'page' }))).to.deep.equal({ ok: false });
        expect(buildPanelButtonAction(fields({ mode: 'switch', stateId: 'a.0.' }))).to.deep.equal({ ok: false });
        expect(buildPanelButtonAction(fields({ mode: 'button', stateId: 'a.0.b' }))).to.deep.equal({
            ok: true,
            action: { mode: 'button', state: 'a.0.b' },
        });
        expect(buildPanelButtonAction(fields({ mode: 'buttonDelayOn', stateId: 'a.0.b', delay: '1,5' }))).to.deep.equal(
            { ok: true, action: { mode: 'buttonDelayOn', state: 'a.0.b', delay: 1.5 } },
        );
        expect(buildPanelButtonAction(fields({ mode: 'buttonDelayOn', stateId: 'a.0.b', delay: '0' }))).to.deep.equal({
            ok: false,
        });
    });

    it('knows the modes of the select', () => {
        expect(isPanelButtonDialogMode('navigation')).to.equal(true);
        expect(isPanelButtonDialogMode('none')).to.equal(true);
        expect(isPanelButtonDialogMode('dance')).to.equal(false);
    });
});
