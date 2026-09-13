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
  transpilePackages: ["wagmi", "@wagmi/core", "@wagmi/connectors"],
  turbopack: {
    resolveAlias: {
      "@x402/evm/upto/client": "./lib/stub.ts",
      "@x402/svm/exact/client": "./lib/stub.ts",
      "@base-org/account": "./lib/stub.ts",
      "@react-native-async-storage/async-storage": "./lib/stub.ts",
      "@metamask/sdk": "./lib/stub.ts",
    },
  },
  webpack: (config, { webpack }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.plugins.push(
      new webpack.IgnorePlugin({ resourceRegExp: /@x402\/evm\/upto\/client/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /@x402\/svm\/exact\/client/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /@base-org\/account/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /@react-native-async-storage\/async-storage/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /@metamask\/sdk/ })
    );
    return config;
  },
};
export default nextConfig;
