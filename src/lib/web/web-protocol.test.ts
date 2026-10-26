import { expect } from 'chai';
import { parseClientFrame } from './web-protocol';

describe('lib/web/web-protocol - parseClientFrame', () => {
    it('parses ack with and without seq', () => {
        expect(parseClientFrame('{"t":"ack","seq":17}')).to.deep.equal({ t: 'ack', seq: 17 });
        expect(parseClientFrame('{"t":"ack"}')).to.deep.equal({ t: 'ack' });
        // a seq that is not an integer is treated like a missing one
        expect(parseClientFrame('{"t":"ack","seq":"17"}')).to.deep.equal({ t: 'ack' });
        expect(parseClientFrame('{"t":"ack","seq":1.5}')).to.deep.equal({ t: 'ack' });
    });

    it('parses recv and rejects everything else', () => {
        expect(parseClientFrame('{"t":"recv","p":"event,startup,55,eu,5.1.1"}')).to.deep.equal({
            t: 'recv',
            p: 'event,startup,55,eu,5.1.1',
        });
        expect(parseClientFrame('{"t":"recv","p":""}')).to.equal(undefined);
        expect(parseClientFrame('{"t":"cmd","p":"x"}')).to.equal(undefined);
        expect(parseClientFrame('not json')).to.equal(undefined);
        expect(parseClientFrame('42')).to.equal(undefined);
    });
});
