// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Phase 1: fully static. No CMS decision is baked in here — content lives in
// src/content (editorial) and src/data (structured), both of which map onto a
// headless CMS later without touching templates.
export default defineConfig({
  site: 'https://www.educationcompany.co.uk',
  integrations: [mdx(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
