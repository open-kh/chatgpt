const { i18n } = require('./next-i18next.config');
const withPWA = require('next-pwa')

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  reactStrictMode: true,
  webpack(config, { isServer, dev }) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  }
};
// const nextConfig = withPWA();

module.exports = nextConfig;
