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

describe('DeviceFrame stage scale', () => {
    // the hardware buttons take 68 px below the stage
    it('fits the portrait phone stage 320x640 into a phone viewport', () => {
        // 390x844 (20:9 phone): height limits, (844 - 68) / 640
        expect(DeviceFrame.stageScale('web-p', 390, 844)).toBeCloseTo(776 / 640);
        // width limits on a wide window
        expect(DeviceFrame.stageScale('web-p', 320, 2000)).toBe(1);
        expect(DeviceFrame.stageScale('web-p', 640, 708)).toBe(1);
    });

    it('fits the landscape phone stage 640x320 into a phone viewport', () => {
        // 844x390 (phone turned): height limits, (390 - 68) / 320
        expect(DeviceFrame.stageScale('web-l', 844, 390)).toBeCloseTo(322 / 320);
        // a narrow window: width limits
        expect(DeviceFrame.stageScale('web-l', 320, 1000)).toBe(0.5);
        expect(DeviceFrame.stageScale('web-l', 1280, 708)).toBe(2);
    });

    it('keeps the hardware stages', () => {
        expect(DeviceFrame.stageScale('eu', 480, 388)).toBe(1);
        expect(DeviceFrame.stageScale('us-p', 320, 548)).toBe(1);
        expect(DeviceFrame.stageScale('eu', 10, 10)).toBe(0.1);
    });
});

describe('DeviceFrame without hardware buttons', () => {
    it('gives the whole viewport height to the stage', () => {
        // 390x844: (844 - 0) / 640 instead of (844 - 68) / 640
        expect(DeviceFrame.stageScale('web-p', 390, 844, 0)).toBeCloseTo(390 / 320);
        expect(DeviceFrame.stageScale('web-p', 1000, 640, 0)).toBe(1);
        expect(DeviceFrame.stageScale('web-l', 844, 390, 0)).toBeCloseTo(390 / 320);
        expect(DeviceFrame.stageScale('eu', 480, 320, 0)).toBe(1);
        // the default keeps the buttons
        expect(DeviceFrame.stageScale('eu', 480, 388)).toBe(DeviceFrame.stageScale('eu', 480, 388, 68));
    });
});
