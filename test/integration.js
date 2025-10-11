// Load test setup FIRST to configure environment
require('./test-setup');

const path = require('path');
const { tests } = require('@iobroker/testing');

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Test configuration constants
const PANEL_TOPIC = 'test/123456';
const PANEL_MAC = 'A0_B7_A5_54_C0_71';
const PANEL_IP = '1.1.1.1';
const PANEL_MODEL = 'eu';
const MQTT_PORT = 1883;
const MQTT_USERNAME = 'test';
const MQTT_PASSWORD = '1234';

// Run integration tests - See https://github.com/ioBroker/testing for a detailed explanation and further options
tests.integration(path.join(__dirname, '..'), {
    //            ~~~~~~~~~~~~~~~~~~~~~~~~~
    // This should be the adapter's root directory

    // To test against a different version of JS-Controller, you can change the version or dist-tag here.
    // Make sure to remove this setting when you're done testing.
    controllerVersion: "6.0.11",

    // Define your own tests inside defineAdditionalTests
    defineAdditionalTests ({ suite }) {
        // Test suite for NSPanel integration with simulated panel
        suite("Test adapter with simulated NSPanel", (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should start adapter with NSPanel configuration and complete test workflow', () => new Promise(async (resolve, reject) => {
                try {
                    console.log('📝 Configuring adapter for NSPanel testing...');
                    
                    // Get adapter object and configure it
                    const obj = await harness.objects.getObject('system.adapter.nspanel-lovelace-ui.0');
                    
                    // Set test configuration
                    Object.assign(obj.native, {
                        testCase: true,
                        mqttServer: true,
                        mqttPassword: MQTT_PASSWORD,
                        mqttUsername: MQTT_USERNAME,
                        mqttIp: '',
                        mqttPort: MQTT_PORT,
                        panels: [
                            { 
                                id: PANEL_MAC, 
                                name: 'test', 
                                topic: PANEL_TOPIC, 
                                ip: PANEL_IP, 
                                model: PANEL_MODEL 
                            },
                        ],
                    });

                    // Save configuration
                    await harness.objects.setObject(obj._id, obj);
                    console.log('✅ Configuration saved');

                    console.log('📝 Creating test states...');
                    
                    // Create test states
                    await harness.objects.setObject('0_userdata.0.boolean', {
                        type: 'state',
                        common: { 
                            name: 'boolean', 
                            type: 'boolean',
                            role: 'state',
                            read: true,
                            write: true
                        },
                        native: {},
                    });

                    await harness.objects.setObject('0_userdata.0.number', {
                        type: 'state',
                        common: { 
                            name: 'number', 
                            type: 'number',
                            role: 'state',
                            read: true,
                            write: true
                        },
                        native: {},
                    });

                    await harness.objects.setObject('0_userdata.0.string', {
                        type: 'state',
                        common: { 
                            name: 'string', 
                            type: 'string',
                            role: 'state',
                            read: true,
                            write: true
                        },
                        native: {},
                    });

                    // Set initial state values
                    await harness.states.setState('0_userdata.0.boolean', true);
                    await harness.states.setState('0_userdata.0.number', 1);
                    await harness.states.setState('0_userdata.0.string', 'test');
                    
                    console.log('✅ Test states created');

                    console.log('📝 Starting adapter...');
                    await harness.startAdapterAndWait();
                    console.log('✅ Adapter started');
                    
                    // Wait for adapter to initialize
                    console.log('⏳ Waiting for adapter initialization (20s)...');
                    await wait(20000);
                    
                    console.log('📝 Requesting test results...');
                    
                    // Query adapter for test results
                    setTimeout(() => {
                        harness.sendTo('nspanel-lovelace-ui.0', 'testCase', 'test', (res) => {
                            console.log('📊 Test results:', JSON.stringify(res));
                            if (res && res.testSuccessful === true) {
                                console.log('✅ Test completed successfully');
                                resolve('ok');
                            } else {
                                console.error('❌ Test failed');
                                reject(new Error('Test failed: testSuccessful was not true'));
                            }
                        });
                    }, 100);
                    
                    // Safety timeout
                    await wait(3000);
                    reject(new Error('Test timeout: No response from adapter'));
                    
                } catch (error) {
                    console.error('❌ Test error:', error);
                    reject(error);
                }
            })).timeout(60000);
        });
    }
});
