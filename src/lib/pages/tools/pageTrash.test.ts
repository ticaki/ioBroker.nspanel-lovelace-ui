import { expect } from 'chai';
import { getNextTrashRefresh } from './pageTrash';

describe('lib/pages/tools/pageTrash - next daily update', () => {
    const realTz = process.env.TZ;

    afterEach(() => {
        if (realTz === undefined) {
            delete process.env.TZ;
        } else {
            process.env.TZ = realTz;
        }
    });

    const utc = (date: Date): string => date.toISOString();

    it('takes 00:01 of the next day on a normal day', () => {
        process.env.TZ = 'Europe/Berlin';
        expect(utc(getNextTrashRefresh(new Date('2026-06-10T10:00:00Z')))).to.equal('2026-06-10T22:01:00.000Z');
    });

    it('takes today shortly before 00:01 and tomorrow from 00:01 on', () => {
        process.env.TZ = 'Europe/Berlin';
        // local 00:00:59.999
        expect(utc(getNextTrashRefresh(new Date('2026-06-09T22:00:59.999Z')))).to.equal('2026-06-09T22:01:00.000Z');
        // local 00:01:00.000 - exactly due must not run a second time
        expect(utc(getNextTrashRefresh(new Date('2026-06-09T22:01:00.000Z')))).to.equal('2026-06-10T22:01:00.000Z');
        // local 00:01:00.001
        expect(utc(getNextTrashRefresh(new Date('2026-06-09T22:01:00.001Z')))).to.equal('2026-06-10T22:01:00.000Z');
    });

    it('stays on 00:01 local time over the DST changes of Europe (23 and 25 hour days)', () => {
        process.env.TZ = 'Europe/Berlin';
        const beforeSpring = getNextTrashRefresh(new Date('2026-03-28T12:00:00Z'));
        expect(utc(beforeSpring)).to.equal('2026-03-28T23:01:00.000Z');
        const afterSpring = getNextTrashRefresh(beforeSpring);
        expect(utc(afterSpring)).to.equal('2026-03-29T22:01:00.000Z');
        expect(afterSpring.getTime() - beforeSpring.getTime()).to.equal(23 * 3_600_000);

        const beforeAutumn = getNextTrashRefresh(new Date('2026-10-24T12:00:00Z'));
        expect(utc(beforeAutumn)).to.equal('2026-10-24T22:01:00.000Z');
        const afterAutumn = getNextTrashRefresh(beforeAutumn);
        expect(utc(afterAutumn)).to.equal('2026-10-25T23:01:00.000Z');
        expect(afterAutumn.getTime() - beforeAutumn.getTime()).to.equal(25 * 3_600_000);
    });

    it('moves behind a gap at midnight and runs once when 00:01 exists twice', () => {
        // Cuba changes at midnight: 2026-03-08 00:00 -> 01:00, 2026-11-01 01:00 -> 00:00
        process.env.TZ = 'America/Havana';
        const gap = getNextTrashRefresh(new Date('2026-03-07T17:00:00Z'));
        expect(gap.getHours()).to.equal(1);
        expect(gap.getMinutes()).to.equal(1);
        expect(gap.getDate()).to.equal(8);
        expect(getNextTrashRefresh(gap).getDate()).to.equal(9);

        const first = getNextTrashRefresh(new Date('2026-10-31T17:00:00Z'));
        expect(utc(first)).to.equal('2026-11-01T04:01:00.000Z');
        const next = getNextTrashRefresh(first);
        expect(next.getDate()).to.equal(2);
        expect(next.getHours()).to.equal(0);
    });
});
