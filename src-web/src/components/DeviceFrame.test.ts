import { describe, expect, it } from 'vitest';
import { DeviceFrame, offlineNotice } from './DeviceFrame';

describe('DeviceFrame offline state', () => {
    it('is offline whenever the connection is not open or a bye arrived', () => {
        expect(DeviceFrame.isOffline({ status: 'open', byeReason: undefined })).toBe(false);
        expect(DeviceFrame.isOffline({ status: 'connecting', byeReason: undefined })).toBe(true);
        expect(DeviceFrame.isOffline({ status: 'closed', byeReason: undefined })).toBe(true);
        expect(DeviceFrame.isOffline({ status: 'open', byeReason: 'shutdown' })).toBe(true);
    });

    it('tells the user what happens next', () => {
        expect(offlineNotice('open', undefined, 'en')).toBe('');
        expect(offlineNotice('connecting', undefined, 'en')).toBe('Connecting to the adapter …');
        expect(offlineNotice('closed', undefined, 'de')).toBe('Verbindung zum Adapter verloren – neuer Versuch …');
        // shutdown is followed by a reconnect - no "reload the page"
        expect(offlineNotice('closed', 'shutdown', 'de')).toBe('Der Adapter wurde beendet – warte auf Neustart …');
        expect(offlineNotice('closed', 'shutdown', 'en')).not.toContain('reload');
        expect(offlineNotice('closed', 'panel removed', 'en')).toBe(
            'The panel was removed from the adapter. Connection ended, reload the page.',
        );
        expect(offlineNotice('closed', 'something else', 'de')).toBe(
            'something else Verbindung beendet, Seite neu laden.',
        );
    });

    it('greys the stage out on top of the dim filter', () => {
        expect(DeviceFrame.offlineFilter('none')).toBe('grayscale(1) brightness(0.35)');
        expect(DeviceFrame.offlineFilter(DeviceFrame.dimFilter(50))).toBe(
            `${DeviceFrame.dimFilter(50)} grayscale(1) brightness(0.35)`,
        );
    });
});
