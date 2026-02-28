// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://colorautodetailing.com',

  // Enable server output so API routes deploy as Vercel functions
  output: 'server',

  adapter: vercel(),

  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !page.includes('/employee/') &&
        !page.includes('/customer/') &&
        !page.includes('/api/'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});