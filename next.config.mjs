import nextTranslate from 'next-translate-plugin';

/** @type {import("next").NextConfig} */
const config = {
    reactStrictMode: false,

    pageExtensions: ['tsx'],

    /**
     * If you have the "experimental: { appDir: true }" setting enabled, then you
     * must comment the below `i18n` config out.
     *
     * @see https://github.com/vercel/next.js/issues/41980
     */
    i18n: {
        locales: ['de', 'fr', 'en', 'ru'],
        defaultLocale: 'en',
    },

    eslint: {
        ignoreDuringBuilds: true,
    },

    images: {
        dangerouslyAllowSVG: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
            {
                protocol: 'http',
                hostname: '**',
            },
        ],
    },
};

export default nextTranslate(config);
