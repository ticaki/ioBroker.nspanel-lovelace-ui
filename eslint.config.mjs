// ioBroker eslint template configuration file for js and ts files
// Please note that esm or react based modules need additional modules loaded.
import config from '@iobroker/eslint-config';
import pluginUnicorn from 'eslint-plugin-unicorn';

export default [
    ...config,

    {
        // specify files to exclude from linting here
        ignores: [
            '.dev-server/',
            '.vscode/',
            '*.test.js',
            'test/**/*.js',
            '*.config.mjs',
            'build',
            'admin/build',
            'admin/words.js',
            'admin/admin.d.ts',
            '**/adapter-config.d.ts',
            'img',
            'json',
            'script',
            'node_modules',
            'templates',
            '.dev-data',
            'script/**/*.ts',
            'testumgebung/**/*.ts',
            'doc'
        ]
    },

    {
        plugins: {
            unicorn: pluginUnicorn,   // <- wichtig: als Objekt
        },
        // you may disable some 'jsdoc' warnings - but using jsdoc is highly recommended
        // as this improves maintainability. jsdoc warnings will not block buiuld process.
        rules: {
            'jsdoc/require-jsdoc': 'off',
            "require-await": "off",
            "@typescript-eslint/require-await": "off",
            "no-unused-vars": "off",
            "unicorn/numeric-separators-style": [
                "warn",
                {
                    "number": { "minimumDigits": 5, "groupLength": 3 },
                    "hexadecimal": { "minimumDigits": 0, "groupLength": 2 },
                    "binary": { "minimumDigits": 0, "groupLength": 4 },
                    "octal": { "minimumDigits": 0, "groupLength": 3 }
                }
            ]
            // or "@typescript-eslint/no-unused-vars": "off",
        },
    },

];