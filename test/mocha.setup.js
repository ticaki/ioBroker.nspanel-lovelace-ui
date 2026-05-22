'use strict';

// Makes ts-node ignore warnings, so mocha --watch does work
process.env.TS_NODE_IGNORE_WARNINGS = 'TRUE';
// Sets the correct tsconfig for testing (uses CommonJS module resolution
// so ts-node/register can load relative imports without explicit extensions)
process.env.TS_NODE_PROJECT = require('path').join(__dirname, 'tsconfig.test.json');
// Skip type checking during test runs - tsc --noEmit / npm run check handles that
process.env.TS_NODE_TRANSPILE_ONLY = 'TRUE';
// Make ts-node respect the "include" key in tsconfig.json
process.env.TS_NODE_FILES = 'TRUE';

// Don't silently swallow unhandled rejections
process.on('unhandledRejection', (e) => {
    throw e;
});

// enable the should interface with sinon
// and load chai-as-promised and sinon-chai by default
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');
const { should, use } = require('chai');

should();
use(sinonChai);
use(chaiAsPromised);
