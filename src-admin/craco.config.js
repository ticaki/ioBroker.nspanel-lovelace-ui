const path = require('path');

module.exports = {
    webpack: {
        configure: webpackConfig => {
            // Set output directory to admin/custom
            webpackConfig.output = {
                ...webpackConfig.output,
                path: path.resolve(__dirname, '../admin/custom'),
                filename: 'customComponents.js',
                publicPath: './',
            };

            // Disable chunk splitting for admin components
            webpackConfig.optimization.splitChunks = {
                cacheGroups: {
                    default: false,
                },
            };
            webpackConfig.optimization.runtimeChunk = false;

            return webpackConfig;
        },
    },
};
