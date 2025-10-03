module.exports = {
    webpack: {
        output: {
            publicPath: './',
        },
        configure: webpackConfig => {
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
