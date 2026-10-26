// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import vercel from '@astrojs/vercel';

/*
  Static by default: every page is prerendered at build time from Prismic
  content. The adapter exists for the few routes that must run on request:
  Prismic draft previews (/api/preview, /preview/…) and the slice simulator's
  render route.
*/
export default defineConfig({
  site: 'https://www.educationcompany.co.uk',
  integrations: [
    mdx(),
    sitemap({ filter: (page) => !/\/(prototype|slice-simulator|preview|v\d+)\//.test(page) }),
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
  /*
    Astro's origin check compares Origin against its own request URL, which is
    wrong behind Vercel's proxy and 403s legitimate posts. Routes that accept
    posts do the equivalent check on hosts instead — see src/lib/http.ts.
  */
  security: { checkOrigin: false },
  vite: { plugins: [tailwindcss()] },
});
