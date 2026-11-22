import { expect } from 'chai';
import { requiredScriptDataPoints } from '../../src/lib/types/adminShareConfig';
import { isChannelStatesProblem } from './channelDatapointCheck';

describe('src-admin - isChannelStatesProblem', () => {
    it('accepts an empty channel of level.timer (all datapoints optional, internal timer)', () => {
        expect(isChannelStatesProblem(requiredScriptDataPoints['level.timer'].data, 0)).to.equal(false);
    });

    it('marks an empty channel of a role with a required datapoint as problem', () => {
        expect(isChannelStatesProblem(requiredScriptDataPoints.socket.data, 0)).to.equal(true);
    });

    it('marks a role without definition as problem, with or without states', () => {
        expect(isChannelStatesProblem(undefined, 0)).to.equal(true);
        expect(isChannelStatesProblem(undefined, 3)).to.equal(true);
    });

    it('leaves a channel with states to the datapoint check', () => {
        expect(isChannelStatesProblem(requiredScriptDataPoints.socket.data, 2)).to.equal(false);
        expect(isChannelStatesProblem(requiredScriptDataPoints['level.timer'].data, 1)).to.equal(false);
    });
});
