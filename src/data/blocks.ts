/*
  A deliberately small block vocabulary. Product and capability pages are built
  from these five shapes, which keeps the pages consistent and gives the eventual
  CMS an obvious component/blocks model to mirror. Resist adding a sixth type
  unless two pages genuinely need it.
*/

export type Block =
  | { type: 'prose'; paras: string[]; title?: string }
  | { type: 'list'; title: string; items: string[]; lead?: string; columns?: 2 | 3 }
  | { type: 'steps'; title?: string; lead?: string; steps: string[] }
  | { type: 'pull'; text: string; sub?: string }
  | { type: 'cards'; title?: string; lead?: string; items: { title: string; body: string }[] };

export interface ContentPage {
  slug: string;
  navLabel: string;
  title: string;
  standfirst?: string;
  summary: string;
  lead?: string;
  blocks: Block[];
  /** Brief §70 — "Where might you go next?" */
  next: { label: string; href: string; blurb?: string }[];
  /** Brief §58 — proof sits beside the claim, on every product/capability page. */
  testimonialTheme?: string;
}
