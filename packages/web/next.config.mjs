import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ['@nia/shared-ui', '@nia/shared'],
  // Serve the brand guidelines (static HTML in /public) at a clean /brand URL.
  async rewrites() {
    return [
      { source: '/brand', destination: '/brand.html' },
      { source: '/deck', destination: '/deck.html' },
    ];
  },
  outputFileTracingRoot: path.join(__dirname, '../../'),
  // Load Oia's editable .md brain (packages/shared/src/oia/*.md) as raw text so the
  // system prompt is composed from Markdown, not hard-coded in the route.
  webpack: (config) => {
    config.module.rules.push({ test: /\.md$/, type: 'asset/source' });
    return config;
  },
  experimental: {
    outputFileTracingIncludes: {
      '/api/**': [
        '../../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client/*.so.node',
      ],
    },
  },
};

export default config;
