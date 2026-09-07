/* Brief §27–§33. Products are introduced only after the broader proposition is
   clear. Words in ./copy/products.json — see outcomes.ts for the rationale. */

import type { ContentPage } from './blocks';
import data from './copy/products.json';

export const products: ContentPage[] = data as ContentPage[];

export const productBySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
