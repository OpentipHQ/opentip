/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ hostname: "avatars.githubusercontent.com" }] },
  transpilePackages: ["wagmi", "@wagmi/core", "@wagmi/connectors"],
  // Fix @coinbase/cdp-sdk -> @x402/evm/upto/client missing (wagmi baseAccount pulls @base-org/account)
  webpack: (config, { webpack }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.plugins.push(
      new webpack.IgnorePlugin({ resourceRegExp: /@x402\/evm\/upto\/client/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /@base-org\/account/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /@react-native-async-storage\/async-storage/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /@metamask\/sdk/ })
    );
    return config;
  },
};
export default nextConfig;
