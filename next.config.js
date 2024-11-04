const modules = {
    sassOptions: {
        additionalData: `@import "scss/_scoped";`,
    },
    i18n: {
        locales: ['en'],
        defaultLocale: 'en',
        localeDetection: false,
    },
    images: {
        domains: ['picsum.photos', 'image.tmdb.org'],
    },
};

module.exports = modules;
