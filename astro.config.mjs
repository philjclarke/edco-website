// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import vercel from '@astrojs/vercel';

/*
  Static by default. The adapter exists only so the /admin publish console and
  its API routes can run server-side — every marketing page is still prerendered
  to HTML at build time, with no server involved.

  Content lives in src/content (editorial) and src/data (structured), both of
  which map onto a headless CMS later without touching templates.
*/
export default defineConfig({
  site: 'https://www.educationcompany.co.uk',
  integrations: [
    mdx(),
    sitemap({ filter: (page) => !page.includes('/prototype/') && !page.includes('/admin') }),
    /*
      Icons are inlined as SVG at build — no runtime JS, no CDN, and they
      inherit currentColor so they pick up the theme tokens.
      `fa6-solid:name` etc. come from npm; a bare name is a file in src/icons/,
      which is where any Font Awesome Pro glyph gets exported to so that the
      licence token never has to reach the build server.
    */
    icon({ iconDir: 'src/icons' }),
  ],
  adapter: vercel(),
  vite: { plugins: [tailwindcss()] },
});
