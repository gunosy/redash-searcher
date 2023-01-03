const { processEnv } = require("@next/env");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    emotion: true,
  },
  privateRuntimeConfig: {
    openSearchURL: (processEnv.OPEN_SEARCH__URL || "localhost:9200").replace(
      /\/$/,
      ""
    ),
    openSearchUserName: processEnv.OPEN_SEARCH__USER_NAME,
    openSearchPassword: processEnv.OPEN_SEARCH__PASSWORD,
  },
  publicRuntimeConfig: {
    redashURL: (processEnv.REDASH__URL || "").replace(/\/$/, ""),
  },
  output: "standalone",
};

module.exports = nextConfig;
