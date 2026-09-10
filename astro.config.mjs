// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

// Phase 1: fully static. No CMS decision is baked in here — content lives in
// src/content (editorial) and src/data (structured), both of which map onto a
// headless CMS later without touching templates.
export default defineConfig({
  site: 'https://www.educationcompany.co.uk',
  integrations: [
    mdx(),
    sitemap({ filter: (page) => !page.includes('/prototype/') }),
    /*
      Icons are inlined as SVG at build — no runtime JS, no CDN, and they
      inherit currentColor so they pick up the theme tokens.
      `fa6-solid:name` etc. come from npm; a bare name is a file in src/icons/,
      which is where any Font Awesome Pro glyph gets exported to so that the
      licence token never has to reach the build server.
    */
    icon({ iconDir: 'src/icons' }),
  ],
  vite: { plugins: [tailwindcss()] },
});
