
import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      "next-intl/config": "./i18n/request.ts",
    },
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);