import { expect } from 'chai';
import { describeErrorCauses, formatErrorForLog } from './error-format';

function errorWithCode(message: string, code: string, cause?: unknown): Error {
    const e = new Error(message, cause === undefined ? undefined : { cause });
    Object.assign(e, { code });
    return e;
}

describe('lib/tools/error-format', () => {
    it('resolves a nested cause chain with codes', () => {
        const inner = errorWithCode('connect ECONNREFUSED 10.10.10.196:80', 'ECONNREFUSED');
        const middle = new Error('socket error', { cause: inner });
        const e = new TypeError('fetch failed', { cause: middle });
        expect(describeErrorCauses(e)).to.equal(
            ' | cause: socket error | cause: ECONNREFUSED connect ECONNREFUSED 10.10.10.196:80',
        );
        const text = formatErrorForLog(e, true);
        expect(text.startsWith('TypeError: fetch failed\n')).to.equal(true);
        expect(text.endsWith('| cause: ECONNREFUSED connect ECONNREFUSED 10.10.10.196:80')).to.equal(true);
        expect(formatErrorForLog(e)).to.equal(
            'TypeError: fetch failed | cause: socket error | cause: ECONNREFUSED connect ECONNREFUSED 10.10.10.196:80',
        );
    });

    it('resolves the errors of an AggregateError', () => {
        const aggregate = new AggregateError(
            [
                errorWithCode('connect ECONNREFUSED ::1:80', 'ECONNREFUSED'),
                errorWithCode('connect EHOSTUNREACH 10.10.10.196:80', 'EHOSTUNREACH'),
            ],
            '',
        );
        Object.assign(aggregate, { code: 'ECONNREFUSED' });
        const e = new TypeError('fetch failed', { cause: aggregate });
        expect(formatErrorForLog(e)).to.equal(
            'TypeError: fetch failed | cause: ECONNREFUSED | errors: [ECONNREFUSED connect ECONNREFUSED ::1:80; EHOSTUNREACH connect EHOSTUNREACH 10.10.10.196:80]',
        );
    });

    it('stops at a cycle', () => {
        const a = new Error('a');
        const b = new Error('b', { cause: a });
        Object.assign(a, { cause: b });
        expect(describeErrorCauses(a)).to.equal(' | cause: b | cause: [circular]');
    });

    it('limits the depth of the chain', () => {
        let e: Error = new Error('e0');
        for (let i = 1; i <= 10; i++) {
            e = new Error(`e${i}`, { cause: e });
        }
        expect(describeErrorCauses(e).split('cause:').length - 1).to.equal(5);
    });

    it('handles non-error values', () => {
        expect(formatErrorForLog('plain text')).to.equal('plain text');
        expect(formatErrorForLog(undefined)).to.equal('undefined');
        expect(formatErrorForLog(42, true)).to.equal('42');
        expect(formatErrorForLog(new Error('x', { cause: 'just a string' }))).to.equal(
            'Error: x | cause: just a string',
        );
    });

    it('redacts secrets', () => {
        const e = new Error('GET http://1.2.3.4/cm?user=admin&password=secret failed', {
            cause: new Error('for http://1.2.3.4/cm?password=secret'),
        });
        expect(formatErrorForLog(e)).to.not.contain('secret');
    });
});
