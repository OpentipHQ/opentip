/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "*.blob.core.windows.net" },
    ],
  },
  transpilePackages: ["wagmi", "@wagmi/core", "@wagmi/connectors", "ox", "@coinbase/cdp-hooks", "@coinbase/cdp-core", "@coinbase/cdp-api-client"],
  async rewrites() {
    return [
      // CDP fetches /.well-known/jwks.json server-side — dot-folders can 404/redirect
      // on some hosts, so rewrite to a plain /api route that always returns 200 JSON.
      { source: "/.well-known/jwks.json", destination: "/api/jwks" },
    ];
  },
  turbopack: {
    resolveAlias: {
      "@x402/evm/upto/client": "./lib/stub.ts",
      "@x402/svm/exact/client": "./lib/stub.ts",
      "@react-native-async-storage/async-storage": "./lib/stub.ts",
      "@metamask/sdk": "./lib/stub.ts",
    },
  },
  webpack: (config, { webpack }) => {
    if (!config.externals) config.externals = [];
    if (!Array.isArray(config.externals)) config.externals = [config.externals];
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.plugins.push(
      new webpack.IgnorePlugin({ resourceRegExp: /@x402\/evm\/upto\/client/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /@x402\/svm\/exact\/client/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /@react-native-async-storage\/async-storage/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /@metamask\/sdk/ })
    );
    return config;
  },
};
export default nextConfig;
