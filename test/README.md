# NSPanel Lovelace UI - Test Infrastructure

This directory contains the test infrastructure for the NSPanel Lovelace UI adapter.

## Test Files

### Integration Tests
- **integration.js** - Main integration test file that runs during `npm run test:integration`
- **integration-nspanel.js** - Enhanced integration test with better structure and documentation

### Test Infrastructure
- **test-setup.js** - Test environment setup utilities
- **test-data-provider.js** - Provides simulated NSPanel MQTT response data

### Other Test Files
- **package.js** - Package validation tests
- **mocha.setup.js** - Mocha test configuration

## Test Configuration

The tests use the `@iobroker/testing` framework which provides:
- Database reset before each test suite
- Adapter lifecycle management
- State and object manipulation utilities
- Message sending capabilities

## Running Tests

```bash
# Run all tests
npm test

# Run only integration tests
npm run test:integration

# Run only package tests
npm run test:package

# Run TypeScript tests
npm run test:ts
```

## Test Structure

The integration tests follow this pattern:

1. **Setup Phase**
   - Configure adapter with test settings (testCase mode, MQTT settings, panel config)
   - Create test states in the database
   - Set initial state values

2. **Execution Phase**
   - Start the adapter
   - Wait for initialization (20 seconds)
   - Send test commands via sendTo

3. **Verification Phase**
   - Query adapter for test results
   - Verify expected behavior
   - Clean up resources

## NSPanel Simulation

The test infrastructure includes components for simulating an NSPanel device:

### TestDataProvider
Provides realistic NSPanel response data including:
- STATUS0 responses (Tasmota device status)
- Startup event messages
- CustomSend confirmations

### Test Setup
Environment configuration for offline testing without requiring real hardware.

## Future Enhancements

The test infrastructure is designed to be extended with:
- MQTT client simulation for more realistic panel behavior
- Additional test scenarios (page navigation, state changes, etc.)
- Unit tests for individual components
- Performance and stress testing

## Configuration Constants

Tests use these constants (can be modified in test files):
- `PANEL_TOPIC`: 'test/123456'
- `PANEL_MAC`: 'A0_B7_A5_54_C0_71'
- `PANEL_IP`: '1.1.1.1'
- `PANEL_MODEL`: 'eu'
- `MQTT_PORT`: 1883
- `MQTT_USERNAME`: 'test'
- `MQTT_PASSWORD`: '1234'

## Debugging Tests

To debug tests:
1. Increase timeout values in test files
2. Add `console.log` statements for visibility
3. Check adapter logs in test output
4. Use `await wait(ms)` for timing adjustments

## Notes

- Tests run against js-controller version 6.0.11
- Each test suite creates a fresh environment
- Tests have a 60-second timeout by default
- The adapter must build successfully before tests can run
