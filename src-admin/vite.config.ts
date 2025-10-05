import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';
import vitetsConfigPaths from 'vite-tsconfig-paths';
import { federation } from '@module-federation/vite';
import { moduleFederationShared } from '@iobroker/adapter-react-v5/modulefederation.admin.config';
import { readFileSync } from 'node:fs';

const config = {
    plugins: [
        federation({
            manifest: true,
            name: 'AdminComponentEasyAccessSet',
            filename: 'customComponents.js',
            exposes: {
                './Components': './src/Components.tsx',
            },
            remotes: {},
            shared: moduleFederationShared(JSON.parse(readFileSync('./package.json').toString())),
        }),
        react(),
        vitetsConfigPaths(),
        commonjs(),
    ],
    server: {
        port: 3000,
    },
    base: './',
    build: {
        target: 'chrome89',
        outDir: './build',
    },
};

export default config;
