const { processEnv } = require("@next/env");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    emotion: true,
  },
  publicRuntimeConfig: {
    redashURL: processEnv.REDASH__URL.replace(/\/$/, ""),
  },
};

module.exports = nextConfig;
