import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// STATIC_EXPORT=1 builds the marketing pages only, as plain files for GitHub
// Pages (see .github/workflows/pages.yml). The app (chat, intake, API) is left out.
const isStatic = process.env.STATIC_EXPORT === '1';

/** @type {import('next').NextConfig} */
const config = {
  ...(isStatic ? { output: 'export', trailingSlash: true, images: { unoptimized: true } } : {}),
  transpilePackages: ['@nia/shared-ui', '@nia/shared'],
  // Serve the brand guidelines (static HTML in /public) at a clean /brand URL.
  ...(isStatic ? {} : { async rewrites() {
    return [
      { source: '/brand', destination: '/brand.html' },
      { source: '/deck', destination: '/deck.html' },
    ];
  } }),
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
