/*
  Editors mark content still to come with square brackets, as the brief does:
  "[VERIFIED METRIC: 28 years]" inside text, or a card titled "[CURRENT EVENT]".
  These turn that into the same placeholder chip Placeholder.astro renders.
*/
const CLASSES =
  'rounded border border-dashed border-orange/60 bg-orange/10 font-sans text-[0.8125rem] font-medium tracking-wide text-orange inline-block px-2 py-0.5';

/** In rich text HTML: [UPPER CASE LABEL] or [UPPER CASE LABEL: note] becomes an inline chip. */
export const withPlaceholders = (html: string) =>
  html.replace(/\[([A-Z0-9][A-Z0-9 &’'\-—/]*?)(?::\s*([^\]]+?))?\]/g, (_, label: string, note?: string) =>
    `<span data-placeholder class="${CLASSES}"${note ? ` title="${note}"` : ''}>[${label}]${
      note ? `<span class="ml-2 font-normal opacity-70">${note}</span>` : ''
    }</span>`
  );

/** A whole field in brackets, e.g. a card title "[CURRENT EVENT]": its label, or undefined. */
export const placeholderLabel = (text: string | null | undefined) => /^\s*\[(.+)\]\s*$/.exec(text ?? '')?.[1];
