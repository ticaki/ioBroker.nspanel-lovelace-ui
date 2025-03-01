const path = require('path');
const { tests } = require('@iobroker/testing');
const assert = require('assert');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Run integration tests - See https://github.com/ioBroker/testing for a detailed explanation and further options
tests.integration(path.join(__dirname, '..'), {
    //            ~~~~~~~~~~~~~~~~~~~~~~~~~
    // This should be the adapter's root directory

    // If the adapter may call process.exit during startup, define here which exit codes are allowed.
    // By default, termination during startup is not allowed.
    //allowedExitCodes: [11],

    // To test against a different version of JS-Controller, you can change the version or dist-tag here.
    // Make sure to remove this setting when you're done testing.
    controllerVersion: "6.0.11", // or a specific version like "4.0.1"

    // Define your own tests inside defineAdditionalTests
    defineAdditionalTests ({ suite }) {
        // All tests (it, describe) must be grouped in one or more suites. Each suite sets up a fresh environment for the adapter tests.
        // At the beginning of each suite, the databases will be reset and the adapter will be started.
        // The adapter will run until the end of each suite.

        // Since the tests are heavily instrumented, each suite gives access to a so called "harness" to control the tests.
        // The harness provides methods to interact with the adapter and the system under test.
        suite("Test: Test with testdata", (getHarness) => {
            // For convenience, get the current suite's harness before all tests
            let harness;
            before(() => {
                harness = getHarness();
            });
            // eslint-disable-next-line no-undef
            it('Test: Start with testdata', () => new Promise(async (resolve, reject) => {
                await harness.objects.getObject('system.adapter.nspanel-lovelace-ui.0', async (err, obj) => {
                    obj.native.testCase = true;
                    obj.native.mqttServer = true;
                    obj.native.mqttPassword = '';
                    obj.native.mqttUsername = 'test';
                    obj.native.mqttIp = '';
                    obj.native.mqttPort = 1883;
                    obj.native.mqttTopic = 'test';
                    obj.native.panels = [
                        { id: 'A0_B7_A5_54_C0_71', name: 'test', topic: 'test/123456', removeIt: false },
                    ];

                    harness.objects.setObject(obj._id, obj)
                });
                // Start the adapter and wait until it has started


                await harness.objects.getObject('0_userdata.0.boolean', async (err, obj) => {
                    obj.type = 'state';
                    obj.common.name = 'example_state';
                    obj.common.role = 'state';
                    obj.common.type = 'number';
                    obj.common.read = true;
                    obj.common.write = true;
                    harness.objects.setObject(obj._id, obj)
                });

                await harness.objects.getObject('0_userdata.0.number', async (err, obj) => {
                    obj.type = 'state';
                    obj.common.name = 'example_state';
                    obj.common.role = 'state';
                    obj.common.type = 'number';
                    obj.common.read = true;
                    obj.common.write = true;
                    harness.objects.setObject(obj._id, obj)
                });

                await harness.objects.getObject('0_userdata.0.string', async (err, obj) => {
                    obj.type = 'state';
                    obj.common.name = 'example_state';
                    obj.common.role = 'state';
                    obj.common.type = 'number';
                    obj.common.read = true;
                    obj.common.write = true;
                    harness.objects.setObject(obj._id, obj)
                });

                await harness.states.setState('0_userdata.0.boolean', true);
                await harness.states.setState('0_userdata.0.number', 1);
                await harness.states.setState('0_userdata.0.string', 'test');
                await harness.startAdapterAndWait();
                await wait(20000);
                
                setTimeout(() => {
                    harness.sendTo('nspanel-lovelace-ui.0', 'testCase', 'test', (res) => {
                        console.log(JSON.stringify(res));
                        if (res.testSuccessful) {
                            resolve('ok');
                        }
                        else {
                            reject('Test failed');
                        }
                    });
                }, 10);
                await wait(3000);
                return reject('Adapter not running');
            })).timeout(2000000);
        });
    }
});
