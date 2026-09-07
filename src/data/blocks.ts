/*
  A deliberately small block vocabulary. Product and capability pages are built
  from these six shapes, which keeps the pages consistent and gives the eventual
  CMS an obvious component/blocks model to mirror. Resist adding a sixth type
  unless two pages genuinely need it.
*/

export type Block =
  | { type: 'prose'; paras: string[]; title?: string }
  | { type: 'list'; title: string; items: string[]; lead?: string; columns?: 2 | 3 }
  | { type: 'steps'; title?: string; lead?: string; steps: string[] }
  | { type: 'pull'; text: string; sub?: string }
  | {
      type: 'cards';
      title?: string;
      lead?: string;
      /** With `detail`, each card expands to reveal it plus a screenshot. */
      items: { title: string; body: string; detail?: string; shot?: string }[];
    }
  | { type: 'shots'; title?: string; lead?: string; shots: { caption: string; src?: string }[] };

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
  /**
   * The product's own website. An empty `href` means the site isn't live yet,
   * and the page shows a tracked placeholder rather than a dead link.
   * `href` sits in the copy deck's STRUCTURAL set, so URLs are never editable
   * there — only the label is.
   */
  externalSite?: { label: string; href: string };
}
