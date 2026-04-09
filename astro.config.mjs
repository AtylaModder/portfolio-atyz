import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';
import vercel from '@astrojs/vercel';

const isVercelBuild = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV;

export default defineConfig({
  site: 'https://atyzmodder.com',
  integrations: [sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },

  // Keep Cloudflare for Wrangler deploys, but build with the Vercel adapter inside Vercel.
  adapter: isVercelBuild ? vercel() : cloudflare(),
});