const modules = {
    transpilePackages: ['three'],
    sassOptions: {
        additionalData: `@import "scss/_scoped";`,
        silenceDeprecations: ['legacy-js-api'],
    },
    i18n: {
        locales: ['en'],
        defaultLocale: 'en',
        localeDetection: false,
    },
    images: {
        domains: ['picsum.photos'],
    },
};

module.exports = modules;
