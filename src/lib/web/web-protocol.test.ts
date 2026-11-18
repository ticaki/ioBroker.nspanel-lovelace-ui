import { expect } from 'chai';
import { parseClientFrame, parseWebBuildId } from './web-protocol';

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

describe('lib/web/web-protocol - parseWebBuildId', () => {
    it('reads the build id from the meta tag of index.html', () => {
        const html =
            '<head><meta charset="UTF-8" /><title>NSPanel</title>\n' +
            '<script type="module" crossorigin src="/assets/index-x.js"></script>\n' +
            '<meta name="nspanel-web-build" content="3000a0dbe3c7a0fb">\n</head>';
        expect(parseWebBuildId(html)).to.equal('3000a0dbe3c7a0fb');
        // attribute order and quotes do not matter
        expect(parseWebBuildId(`<meta content='abc' name='nspanel-web-build' />`)).to.equal('abc');
    });

    it('is undefined without the meta tag or with an empty one', () => {
        expect(parseWebBuildId('<meta name="theme-color" content="#000000"><title>x</title>')).to.equal(undefined);
        expect(parseWebBuildId('<meta name="nspanel-web-build" content="">')).to.equal(undefined);
        expect(parseWebBuildId('')).to.equal(undefined);
    });
});
