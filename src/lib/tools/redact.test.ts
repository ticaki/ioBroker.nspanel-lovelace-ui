import { expect } from 'chai';
import { redactSecrets, redactSecretsInText, stringifyForLog } from './redact';

describe('lib/tools/redact', () => {
    describe('redactSecretsInText', () => {
        it('masks the password query parameter of a tasmota url', () => {
            expect(redactSecretsInText('http://1.2.3.4/cm?user=admin&password=secret&cmnd=status%205')).to.equal(
                'http://1.2.3.4/cm?user=admin&password=***&cmnd=status%205',
            );
        });
        it('masks an url encoded password parameter', () => {
            expect(redactSecretsInText('http://1.2.3.4/cm?user%3Dadmin%26password%3Dsecret')).to.equal(
                'http://1.2.3.4/cm?user%3Dadmin%26password%3D***',
            );
        });
        it('masks the MqttPassword of a backlog command', () => {
            expect(redactSecretsInText(' MqttUser nspanel; MqttPassword secret; MqttRetry 10')).to.equal(
                ' MqttUser nspanel; MqttPassword ***; MqttRetry 10',
            );
        });
        it('masks an url encoded MqttPassword of a backlog command', () => {
            expect(redactSecretsInText('Backlog%20MqttPassword%20se%3Ccret%3B%20MqttRetry%2010')).to.equal(
                'Backlog%20MqttPassword%20***%3B%20MqttRetry%2010',
            );
        });
        it('leaves text without credentials untouched', () => {
            expect(redactSecretsInText('http://1.2.3.4/cm?&cmnd=Restart%201')).to.equal(
                'http://1.2.3.4/cm?&cmnd=Restart%201',
            );
        });
    });

    describe('redactSecrets', () => {
        it('masks secret keys and keeps the rest', () => {
            expect(redactSecrets({ mqttUsername: 'user', mqttPassword: 'secret', tasmotaIP: '1.2.3.4' })).to.deep.equal(
                { mqttUsername: 'user', mqttPassword: '***', tasmotaIP: '1.2.3.4' },
            );
        });
        it('masks nested and array values', () => {
            expect(redactSecrets({ list: [{ token: 'abc' }], inner: { pwd: 'x' } })).to.deep.equal({
                list: [{ token: '***' }],
                inner: { pwd: '***' },
            });
        });
        it('does not modify the original object', () => {
            const source = { mqttPassword: 'secret' };
            redactSecrets(source);
            expect(source.mqttPassword).to.equal('secret');
        });
    });

    describe('stringifyForLog', () => {
        it('serializes without credentials', () => {
            expect(stringifyForLog({ command: 'nsPanelInitStep1', message: { mqttPassword: 'secret' } })).to.equal(
                '{"command":"nsPanelInitStep1","message":{"mqttPassword":"***"}}',
            );
        });
        it('survives circular structures', () => {
            const circular: Record<string, unknown> = {};
            circular.self = circular;
            expect(stringifyForLog(circular)).to.equal('[unserializable]');
        });
    });
});
