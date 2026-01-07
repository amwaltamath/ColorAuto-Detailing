// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Enable server output so API routes deploy as Vercel functions
  output: 'server',

  adapter: vercel({
    webAnalytics: { enabled: false },
  }),

  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});