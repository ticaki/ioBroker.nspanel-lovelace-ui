import { expect } from 'chai';
import type * as ShareConfig from '../types/adminShareConfig';
import { qrUsesPassword } from './admin';

/**
 * A QR entry with the fields the decision needs.
 *
 * @param over Type of the code and the wifi encryption.
 * @returns The entry for `qrUsesPassword`.
 */
function qrEntry(over: Partial<ShareConfig.QREntry>): ShareConfig.QREntry {
    return {
        card: 'cardQR',
        uniqueName: 'gastnetz',
        headline: 'Gastnetz',
        ssidUrlTel: 'Gast',
        wlanhidden: false,
        pwdhidden: false,
        setState: '',
        qrPass: 'geheim',
        ...over,
    };
}

describe('lib/configuration - qrUsesPassword', () => {
    it('uses the password for an encrypted wifi code', () => {
        for (const wlantype of ['WPA', 'WPA2', 'WPA3', 'WEP'] as const) {
            expect(qrUsesPassword(qrEntry({ selType: 1, wlantype })), wlantype).to.equal(true);
        }
    });

    it('drops the password for an open network', () => {
        expect(qrUsesPassword(qrEntry({ selType: 1, wlantype: 'nopass' }))).to.equal(false);
    });

    it('drops the password for the free text, url and telephone code', () => {
        for (const selType of [0, 2, 3]) {
            expect(qrUsesPassword(qrEntry({ selType, wlantype: 'WPA2' })), String(selType)).to.equal(false);
        }
    });

    it('treats a missing wifi type as encrypted and a missing code type as free text', () => {
        expect(qrUsesPassword(qrEntry({ selType: 1 }))).to.equal(true);
        expect(qrUsesPassword(qrEntry({ wlantype: 'WPA2' }))).to.equal(false);
    });
});
