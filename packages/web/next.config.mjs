import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ['@nia/shared-ui', '@nia/shared'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  experimental: {
    outputFileTracingIncludes: {
      '/api/**': [
        '../../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client/*.so.node',
      ],
    },
  },
};

export default config;
