const { i18n } = require('./next-i18next.config');
const withPWA = require('next-pwa')

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  i18n,
  reactStrictMode: true,
  pwa: {
    dest: 'public',
    mode: 'standalone',
    // swSrc: '',
    disable: process.env.NODE_ENV === 'development'
  },
  webpack(config, { isServer, dev }) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  }
});

module.exports = nextConfig;
