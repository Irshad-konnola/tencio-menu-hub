/** @type {import('next').NextConfig} */
const nextConfig = process.env.MENUHUB_FIXTURE_PREVIEW === '1'
  ? {
      distDir: '.next-catering-preview',
      typescript: { tsconfigPath: '.next-catering-preview/tsconfig.json' },
    }
  : {};

export default nextConfig;
