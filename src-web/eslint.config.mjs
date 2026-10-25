// ioBroker eslint template configuration file for js and ts files
import config from '@iobroker/eslint-config';

export default [
    ...config,

    {
        ignores: ['node_modules/', 'src/icons/*.json', '*.config.mjs', '../www/'],
    },
    {
        rules: {
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-param': 'off',
            'jsdoc/require-param-description': 'off',
            'jsdoc/require-returns-description': 'off',
            'jsdoc/require-returns-check': 'off',
        },
    },
];
