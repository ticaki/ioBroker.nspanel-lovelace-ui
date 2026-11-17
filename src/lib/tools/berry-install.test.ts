import { expect } from 'chai';
import {
    findBerryInstallTopic,
    getBerryCommitCommand,
    getBerryDownloadCommand,
    getBerryLegacyInstallCommand,
    getBerryRestoreCommand,
    getTasmotaCommandUrl,
    parseUrlFetchResult,
} from './berry-install';

const berryUrl = 'https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/tasmota/berry';

describe('lib/tools/berry-install', () => {
    describe('commands', () => {
        it('download: backs up autoexec.be to autoexec.bak and leaves autoexec.old alone', () => {
            const cmd = getBerryDownloadCommand(berryUrl, '11');
            expect(cmd).to.equal(
                `Backlog UfsDelete autoexec.bak; UfsRename autoexec.be,autoexec.bak; UrlFetch ${berryUrl}/11/autoexec.be`,
            );
            expect(cmd).to.not.contain('autoexec.old');
        });
        it('success: backup becomes autoexec.old, restart at the end of the same backlog', () => {
            expect(getBerryCommitCommand(true)).to.equal(
                'Backlog UfsDelete autoexec.old; UfsRename autoexec.bak,autoexec.old; Restart 1',
            );
            expect(getBerryCommitCommand(false)).to.equal(
                'Backlog UfsDelete autoexec.old; UfsRename autoexec.bak,autoexec.old',
            );
        });
        it('failure: partial autoexec.be is deleted, backup restored, autoexec.old untouched', () => {
            const cmd = getBerryRestoreCommand();
            expect(cmd).to.equal('Backlog UfsDelete autoexec.be; UfsRename autoexec.bak,autoexec.be');
            expect(cmd).to.not.contain('autoexec.old');
        });
    });

    describe('getTasmotaCommandUrl', () => {
        it('without admin login', () => {
            expect(
                getTasmotaCommandUrl('192.168.1.5', getBerryRestoreCommand(), { useAdmin: false, password: 'x' }),
            ).to.equal(
                'http://192.168.1.5/cm?&cmnd=Backlog%20UfsDelete%20autoexec.be%3B%20UfsRename%20autoexec.bak%2Cautoexec.be',
            );
        });
        it('with admin login, password url encoded', () => {
            const url = getTasmotaCommandUrl('192.168.1.5', getBerryCommitCommand(true), {
                useAdmin: true,
                password: 'p&w=1 #',
            });
            expect(url).to.equal(
                'http://192.168.1.5/cm?user=admin&password=p%26w%3D1%20%23' +
                    '&cmnd=Backlog%20UfsDelete%20autoexec.old%3B%20UfsRename%20autoexec.bak%2Cautoexec.old%3B%20Restart%201',
            );
            const parsed = new URL(url);
            expect(parsed.searchParams.get('password')).to.equal('p&w=1 #');
            expect(parsed.searchParams.get('cmnd')).to.equal(getBerryCommitCommand(true));
        });
        it('download url survives encoding', () => {
            const cmd = getBerryDownloadCommand(berryUrl, '11');
            const url = getTasmotaCommandUrl('10.0.0.1', cmd, { useAdmin: false, password: '' });
            expect(new URL(url).searchParams.get('cmnd')).to.equal(cmd);
        });
    });

    describe('parseUrlFetchResult', () => {
        it('detects Done', () => {
            expect(parseUrlFetchResult('{"UrlFetch":"Done"}')).to.equal('done');
        });
        it('detects Failed', () => {
            expect(parseUrlFetchResult('{"UrlFetch":"Failed"}')).to.equal('failed');
        });
        it('ignores answers of the other backlog commands, also failed renames on a first install', () => {
            expect(parseUrlFetchResult('{"UfsRename":"Failed"}')).to.equal('none');
            expect(parseUrlFetchResult('{"UfsDelete":"Done"}')).to.equal('none');
            expect(parseUrlFetchResult('{"Command":"Unknown","Input":"UfsRename"}')).to.equal('none');
        });
        it('ignores invalid json', () => {
            expect(parseUrlFetchResult('not json')).to.equal('none');
            expect(parseUrlFetchResult('null')).to.equal('none');
        });
    });
});

describe('lib/tools/berry-install selection', () => {
    const panels = [
        { topic: 'web/panel', ip: '10.0.0.9', kind: 'web' as const },
        { topic: 'nspanel/kitchen', ip: '10.0.0.5' },
        { topic: 'nspanel/hall', ip: '10.0.0.6', kind: 'tasmota' as const },
    ];
    it('prefers the topic of the request', () => {
        expect(findBerryInstallTopic('nspanel/x', '10.0.0.5', panels)).to.equal('nspanel/x');
    });
    it('finds a tasmota panel by ip, kind missing or tasmota', () => {
        expect(findBerryInstallTopic(undefined, '10.0.0.5', panels)).to.equal('nspanel/kitchen');
        expect(findBerryInstallTopic('', '10.0.0.6', panels)).to.equal('nspanel/hall');
    });
    it('ignores web panels and unknown ips', () => {
        expect(findBerryInstallTopic(undefined, '10.0.0.9', panels)).to.equal(undefined);
        expect(findBerryInstallTopic(undefined, '10.0.0.1', panels)).to.equal(undefined);
        expect(findBerryInstallTopic(undefined, '10.0.0.5', undefined)).to.equal(undefined);
    });
    it('legacy command without topic is the old sequence', () => {
        expect(getBerryLegacyInstallCommand(berryUrl, '11')).to.equal(
            `Backlog UfsDelete autoexec.old; UfsRename autoexec.be,autoexec.old; UrlFetch ${berryUrl}/11/autoexec.be`,
        );
    });
});
