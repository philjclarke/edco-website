/* Brief §27–§33. Products are introduced only after the broader proposition is
   clear. Content lives in Prismic (page type "product"); see sectionPages.ts. */
import { loadSection } from './sectionPages';

export const products = await loadSection('product');
export const productBySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
