/*
  Field specs for the single-instance pages and site settings in Prismic.

  Each entry is one Prismic field: its kind, the label editors see, the tab it
  sits on, and `path`: where the value lives in the shape the site's pages
  read (see src/data/pageCopy.ts). The same spec builds the Prismic models
  (prismic/models.ts), imported the original copy, and turns Prismic content
  back into that shape, so the page templates didn't need to change.

  Generated once from the old copy JSON (Oct 2026); edit by hand from here.
  No imports: this file is read by both the site build and the Node scripts.
*/

export type Kind = "text" | "link" | "boolean" | "bullets";
export interface Field {
  kind: Kind;
  label: string;
  tab: string;
  path: string;
}
export interface Group {
  kind: "group";
  label: string;
  tab: string;
  path: string;
  /** Item fields. `key` is the property name in the page's shape. */
  fields: Record<string, { kind: Kind; label: string; key?: string }>;
  /** Read back as a plain list of strings. */
  strings?: boolean;
  /** Read back as two parallel lists, e.g. items and their icons. */
  split?: Record<string, string>;
}
export interface DocSpec {
  id: string;
  label: string;
  fields: Record<string, Field | Group>;
}

export const specs: DocSpec[] = [
  {
    id: "free_analysis_page",
    label: "Free customer analysis",
    fields: {
      meta_title: {
        kind: "text",
        label: "Browser tab title",
        tab: "SEO",
        path: "metaTitle",
      },
      meta_description: {
        kind: "text",
        label: "Search engine description",
        tab: "SEO",
        path: "metaDescription",
      },
      hero_title: {
        kind: "text",
        label: "Heading",
        tab: "Banner",
        path: "heroTitle",
      },
      hero_eyebrow: {
        kind: "text",
        label: "Small label",
        tab: "Banner",
        path: "heroEyebrow",
      },
      hero_standfirst: {
        kind: "text",
        label: "Standfirst",
        tab: "Banner",
        path: "heroStandfirst",
      },
      hero_lead: {
        kind: "text",
        label: "Intro paragraph",
        tab: "Banner",
        path: "heroLead",
      },
      body: {
        kind: "text",
        label: "Text",
        tab: "Body",
        path: "body",
      },
      body2: {
        kind: "text",
        label: "Paragraph 2",
        tab: "Body",
        path: "body2",
      },
      body3: {
        kind: "text",
        label: "Paragraph 3",
        tab: "Body",
        path: "body3",
      },
      body4: {
        kind: "text",
        label: "Paragraph 4",
        tab: "Body",
        path: "body4",
      },
      body5: {
        kind: "text",
        label: "Paragraph 5",
        tab: "Body",
        path: "body5",
      },
      heading: {
        kind: "text",
        label: "Heading",
        tab: "Body",
        path: "heading",
      },
      findings: {
        kind: "group",
        label: "Findings",
        tab: "Body",
        path: "findings",
        fields: {
          text: {
            kind: "text",
            label: "Item",
          },
          icon: {
            kind: "text",
            label: "Icon",
          },
        },
        split: {
          text: "findings",
          icon: "findingIcons",
        },
      },
    },
  },
  {
    id: "contact_page",
    label: "Contact",
    fields: {
      meta_title: {
        kind: "text",
        label: "Browser tab title",
        tab: "SEO",
        path: "metaTitle",
      },
      meta_description: {
        kind: "text",
        label: "Search engine description",
        tab: "SEO",
        path: "metaDescription",
      },
      hero_title: {
        kind: "text",
        label: "Heading",
        tab: "Banner",
        path: "heroTitle",
      },
      hero_eyebrow: {
        kind: "text",
        label: "Small label",
        tab: "Banner",
        path: "heroEyebrow",
      },
      hero_standfirst: {
        kind: "text",
        label: "Standfirst",
        tab: "Banner",
        path: "heroStandfirst",
      },
      hero_lead: {
        kind: "text",
        label: "Intro paragraph",
        tab: "Banner",
        path: "heroLead",
      },
      body: {
        kind: "text",
        label: "Text",
        tab: "Body",
        path: "body",
      },
      body2: {
        kind: "text",
        label: "Paragraph 2",
        tab: "Body",
        path: "body2",
      },
      body3: {
        kind: "text",
        label: "Paragraph 3",
        tab: "Body",
        path: "body3",
      },
      body4: {
        kind: "text",
        label: "Paragraph 4",
        tab: "Body",
        path: "body4",
      },
      heading: {
        kind: "text",
        label: "Heading",
        tab: "Body",
        path: "heading",
      },
    },
  },
  {
    id: "customer_page",
    label: "Customer login",
    fields: {
      meta_title: {
        kind: "text",
        label: "Browser tab title",
        tab: "SEO",
        path: "metaTitle",
      },
      meta_description: {
        kind: "text",
        label: "Search engine description",
        tab: "SEO",
        path: "metaDescription",
      },
      body: {
        kind: "text",
        label: "Text",
        tab: "Body",
        path: "body",
      },
      heading: {
        kind: "text",
        label: "Heading",
        tab: "Body",
        path: "heading",
      },
      body2: {
        kind: "text",
        label: "Paragraph 2",
        tab: "Body",
        path: "body2",
      },
    },
  },
  {
    id: "for_educators_page",
    label: "For Educators",
    fields: {
      meta_title: {
        kind: "text",
        label: "Browser tab title",
        tab: "SEO",
        path: "metaTitle",
      },
      meta_description: {
        kind: "text",
        label: "Search engine description",
        tab: "SEO",
        path: "metaDescription",
      },
      hero_title: {
        kind: "text",
        label: "Heading",
        tab: "Banner",
        path: "heroTitle",
      },
      hero_eyebrow: {
        kind: "text",
        label: "Small label",
        tab: "Banner",
        path: "heroEyebrow",
      },
      hero_standfirst: {
        kind: "text",
        label: "Standfirst",
        tab: "Banner",
        path: "heroStandfirst",
      },
      hero_lead: {
        kind: "text",
        label: "Intro paragraph",
        tab: "Banner",
        path: "heroLead",
      },
      section_title: {
        kind: "text",
        label: "Heading",
        tab: "Sections",
        path: "sectionTitle",
      },
      section_eyebrow: {
        kind: "text",
        label: "Small label",
        tab: "Sections",
        path: "sectionEyebrow",
      },
      section_lead: {
        kind: "text",
        label: "Intro",
        tab: "Sections",
        path: "sectionLead",
      },
      section_title2: {
        kind: "text",
        label: "Second section heading",
        tab: "Sections",
        path: "sectionTitle2",
      },
      section_eyebrow2: {
        kind: "text",
        label: "Second section small label",
        tab: "Sections",
        path: "sectionEyebrow2",
      },
      heading: {
        kind: "text",
        label: "Heading",
        tab: "Body",
        path: "heading",
      },
      body: {
        kind: "text",
        label: "Text",
        tab: "Body",
        path: "body",
      },
    },
  },
  {
    id: "case_studies_hub",
    label: "Case studies (hub)",
    fields: {
      meta_title: {
        kind: "text",
        label: "Browser tab title",
        tab: "SEO",
        path: "metaTitle",
      },
      meta_description: {
        kind: "text",
        label: "Search engine description",
        tab: "SEO",
        path: "metaDescription",
      },
      hero_title: {
        kind: "text",
        label: "Heading",
        tab: "Banner",
        path: "heroTitle",
      },
      hero_eyebrow: {
        kind: "text",
        label: "Small label",
        tab: "Banner",
        path: "heroEyebrow",
      },
      hero_standfirst: {
        kind: "text",
        label: "Standfirst",
        tab: "Banner",
        path: "heroStandfirst",
      },
      hero_lead: {
        kind: "text",
        label: "Intro paragraph",
        tab: "Banner",
        path: "heroLead",
      },
      heading: {
        kind: "text",
        label: "Heading",
        tab: "Body",
        path: "heading",
      },
      body: {
        kind: "text",
        label: "Text",
        tab: "Body",
        path: "body",
      },
    },
  },
  {
    id: "search_page",
    label: "Search",
    fields: {
      meta_title: {
        kind: "text",
        label: "Browser tab title",
        tab: "SEO",
        path: "metaTitle",
      },
      heading: {
        kind: "text",
        label: "Heading",
        tab: "Body",
        path: "heading",
      },
      body: {
        kind: "text",
        label: "Text",
        tab: "Body",
        path: "body",
      },
    },
  },
  {
    id: "not_found_page",
    label: "Page not found",
    fields: {
      meta_title: {
        kind: "text",
        label: "Browser tab title",
        tab: "SEO",
        path: "metaTitle",
      },
      heading: {
        kind: "text",
        label: "Heading",
        tab: "Body",
        path: "heading",
      },
      body: {
        kind: "text",
        label: "Text",
        tab: "Body",
        path: "body",
      },
    },
  },
  {
    id: "site_settings",
    label: "Site settings",
    fields: {
      edco_model: {
        kind: "group",
        label: "Listen → Grow model",
        tab: "The EdCo model",
        path: "edcoModel",
        fields: {
          name: {
            kind: "text",
            label: "Name",
            key: "name",
          },
          summary: {
            kind: "text",
            label: "Summary",
            key: "summary",
          },
          methods: {
            kind: "bullets",
            label: "Methods",
            key: "methods",
          },
          icon: {
            kind: "text",
            label: "Icon",
            key: "icon",
          },
        },
      },
      proof_stats: {
        kind: "group",
        label: "Figures",
        tab: "Proof",
        path: "proofStats",
        fields: {
          value: {
            kind: "text",
            label: "Value",
            key: "value",
          },
          label: {
            kind: "text",
            label: "Label",
            key: "label",
          },
          verified: {
            kind: "boolean",
            label: "Verified",
            key: "verified",
          },
        },
      },
      logo_candidates: {
        kind: "group",
        label: "Client logo list",
        tab: "Proof",
        path: "logoCandidates",
        strings: true,
        fields: {
          text: {
            kind: "text",
            label: "Item",
          },
        },
      },
      testimonial_themes: {
        kind: "group",
        label: "Testimonial themes",
        tab: "Proof",
        path: "testimonialThemes",
        strings: true,
        fields: {
          text: {
            kind: "text",
            label: "Item",
          },
        },
      },
      case_study_themes: {
        kind: "group",
        label: "Case study themes",
        tab: "Proof",
        path: "caseStudyThemes",
        strings: true,
        fields: {
          text: {
            kind: "text",
            label: "Item",
          },
        },
      },
    },
  },
];
