// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

import tailwindcss from '@tailwindcss/vite';
import { SITE_ORIGIN, isIndexableSitemapUrl } from './src/utils/seo.ts';

// https://astro.build/config
export default defineConfig({
  site: SITE_ORIGIN,
  trailingSlash: 'never',

  // Enable server output so API routes deploy as Vercel functions
  output: 'server',

  security: {
    checkOrigin: false,
  },

  adapter: vercel(),

  integrations: [
    react(),
    sitemap({
      filter: (page) => isIndexableSitemapUrl(page),
    }),
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});