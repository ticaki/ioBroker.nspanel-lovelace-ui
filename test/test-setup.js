/**
 * Test setup that enables NSPanel simulation by providing MQTT client mock
 * This module must be loaded before any tests that use the adapter
 */

const { TestDataProvider } = require('./test-data-provider');

// Initialize test data provider
const testDataProvider = new TestDataProvider();

/**
 * Setup test environment with NSPanel MQTT simulation
 */
function setupTestEnvironment() {
    console.log('🔧 Setting up test environment for NSPanel simulation...');
    console.log('✅ Test environment configured for NSPanel testing');
}

/**
 * Create a simulated NSPanel MQTT client that responds to adapter commands
 * @param {any} mqttClient - The MQTT client instance to extend with simulation
 * @param {string} panelTopic - The topic prefix for the panel (e.g., 'test/123456')
 * @returns {Function} Cleanup function to remove simulation handlers
 */
function createNSPanelSimulation(mqttClient, panelTopic) {
    console.log(`🤖 Creating NSPanel simulation for topic: ${panelTopic}`);
    
    const subscriptionHandler = async (topic, message) => {
        console.log(`📩 Panel simulation received command: ${topic} -> ${message}`);
        
        // Respond to pageType~pageStartup command
        if (message === 'pageType~pageStartup') {
            console.log('   ↳ Responding with startup confirmation and event');
            await mqttClient.publish(`${panelTopic}/stat/RESULT`, testDataProvider.getCustomSendDone());
            await mqttClient.publish(`${panelTopic}/tele/RESULT`, testDataProvider.getStartupEvent());
        } 
        // Respond to STATUS0 command
        else if (topic === `${panelTopic}/cmnd/STATUS0`) {
            console.log('   ↳ Responding with STATUS0 data');
            await mqttClient.publish(`${panelTopic}/stat/STATUS0`, testDataProvider.getStatus0Response());
        }
        // For other commands, just acknowledge
        else if (topic.includes('/cmnd/')) {
            // Most commands don't need a response in the simulation
            console.log('   ↳ Command acknowledged (no response needed)');
        }
    };

    // Subscribe to all commands for this panel
    mqttClient.subscribe(`${panelTopic}/cmnd/#`, subscriptionHandler);
    
    // Return cleanup function
    return async () => {
        console.log(`🧹 Cleaning up NSPanel simulation for topic: ${panelTopic}`);
        await mqttClient.unsubscribe(`${panelTopic}/cmnd/#`, subscriptionHandler);
    };
}

// Auto-setup when this module is loaded
setupTestEnvironment();

module.exports = {
    setupTestEnvironment,
    testDataProvider,
    createNSPanelSimulation
};
