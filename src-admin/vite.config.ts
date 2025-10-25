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
        chunkSizeWarningLimit: 3000,
        /*rollupOptions: {
            output: {
                manualChunks: (id: string): string | undefined => {
                    // Material-UI icons (very large) in separate chunk
                    if (id.includes('node_modules/@mui/icons-material')) {
                        return 'mui-icons';
                    }
                    // Material-UI components in separate chunk
                    if (id.includes('node_modules/@mui/material')) {
                        return 'mui-material';
                    }
                    // Other MUI packages
                    if (id.includes('node_modules/@mui/')) {
                        return 'mui-core';
                    }
                    // React Flow (large graph library)
                    if (id.includes('node_modules/reactflow') || id.includes('node_modules/@xyflow')) {
                        return 'reactflow-lib';
                    }
                    // D3 libraries
                    if (id.includes('node_modules/d3-')) {
                        return 'd3-lib';
                    }
                    // React and related in separate chunk
                    if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                        return 'react-vendor';
                    }
                    // ioBroker adapter-react in separate chunk
                    if (id.includes('node_modules/@iobroker/adapter-react')) {
                        return 'iobroker-adapter-react';
                    }
                    // Other large vendor libs
                    if (id.includes('node_modules/')) {
                        return 'vendor';
                    }
                    if (id.includes('/src/icons.json') || id.endsWith('/icons.json')) {
                        return 'icons-json';
                    }
                    return undefined;
                },
            },
        },*/
    },
};

export default config;
