declare namespace App {
  interface Locals {
    /** Set while rendering a Prismic draft preview (see src/pages/preview/). */
    prismicPreview?: {
      /** The preview session's ref: content is read at this ref instead of published. */
      ref: string;
      /** The published address of the page being previewed. */
      path: string;
    };
  }
}
