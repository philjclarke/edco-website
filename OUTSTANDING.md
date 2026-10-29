# Outstanding — phase 1

Everything below is either a decision, an asset, or content that must come from EdCo.
Nothing on this list blocks further build work; all of it blocks launch.

Regenerate the live list at any time:

```bash
grep -rn "<Placeholder" src/          # outstanding content items, in place
grep -rn "verified: false" src/data/  # unconfirmed statistics
```

---

## 1. Blocks launch — must be resolved

### Brand assets

| # | Item | Why it matters |
| --- | --- | --- |
| 1.1 | **Logo as SVG** (positive) | The reversed SVG arrived on 29 October 2026 and is used in the footer and dark header. The positive one is still a 1106×451 PNG, upscaled at large sizes. |
| 1.2 | **Brand typeface + web licence** | Poppins/Inter are stand-ins loaded from Google Fonts. If EdCo has a licensed face (the deck looks like a Gilroy/Poppins-class geometric sans), we need the webfont files and the licence. |
| 1.3 | **Ribbon device as SVG** | Currently four PNGs with baked-in shadows. SVG would let it scale, animate and recolour cleanly. |
| 1.4 | **Written brand guidelines**, if they exist | The palette, type scale and ribbon rules in `global.css` were reverse-engineered from the logo and one deck. If there's a document, the system should follow it rather than my reading of it. |

### Verified proof — brief §16, §76

Nothing here is on the site as fact. Each renders a `[VERIFY]` chip until confirmed in
writing, then `verified: true` in `src/data/proof.ts`.

| # | Claim | Status |
| --- | --- | --- |
| 1.5 | 35 years working in education | Unverified |
| 1.6 | 50+ people | Unverified |
| 1.7 | 95%+ customer retention, year after year | Unverified |
| 1.8 | 250,000+ post-16 students using Navigate | Unverified |
| 1.9 | Customer relationships lasting more than 28 years | Unverified |

### Client logos — brief §17, §76

Ten candidates are listed from the brief: Cambridge University Press, Collins, Encyclopaedia
Britannica, The Education People, Timstar, Edustaff, Raintree, Gatsby, British Red Cross,
The Big Plastic Count.

| # | Need |
| --- | --- |
| 1.10 | Which of these are **current** relationships (the brief is explicit that historical ones must not be implied as current) |
| 1.11 | Written **logo permission** for each |
| 1.12 | Logo files, SVG preferred. Nine arrived on 29 October 2026 and are in Site settings. Still needed: **Gatsby**. Worth replacing with SVG or larger files: Raintree (200px wide), Encyclopaedia Britannica (269px), Edustaff (446px) |
| 1.13 | Any 11th–15th logos to reach the 10–15 the brief asks for |

### Product logos

Added on 29 October 2026 to each product's Preview tab: Education IQ (both
versions), The Curriculum Network (both), International Schools Network (dark
only, so light cards show it on a navy panel).

| # | Need |
| --- | --- |
| 1.13a | **SPIRIT** logo, light and dark versions |
| 1.13b | **Engagement Hub** logo, or a decision that EdNet's stays (see the rename note below) |
| 1.13c | **International Schools Network** logo for light backgrounds |
| 1.13d | **Navigate**: we have its logos, but it has no page. It's mentioned on Bespoke technology and in the 250,000+ students figure. Does it need a page, or the logo on Bespoke technology? |

### External destinations

| # | Item |
| --- | --- |
| 1.14 | Education IQ login URL |
| 1.15 | SPIRIT login URL |
| 1.16 | EdNet administration URL |
| 1.17 | International Schools Network URL (public + admin) |
| 1.18 | The Curriculum Network URL (public + admin) |
| 1.19 | Support email / ticket destination |
| 1.20 | General enquiries email address |

### Legal and compliance

| # | Item |
| --- | --- |
| 1.21 | Privacy policy, cookie policy, terms |
| 1.22 | Company number and VAT number for the footer |
| 1.23 | Consent wording on the contact form and the subscribe form |
| 1.24 | **Data-handling statement for the free customer analysis** — clients upload a customer list, so this needs proper sign-off before that offer goes live |
| 1.25 | Confirm the registered address is still Denne Court, Kent (carried over from the current site) |

### Technical decisions

| # | Decision | Note |
| --- | --- | --- |
| 1.26 | **Where the contact form posts** | Currently no endpoint. Options: a form service (Netlify/Formspree), an email relay, or straight into SPIRIT/HubSpot. This is the only thing forcing any server-side consideration. |
| 1.27 | **Where the subscriber list lives** | Brief §52 wants name + email now, interest personalisation later. Needs a marketing platform. |
| 1.28 | **Hosting** | The proof of concept runs on Vercel, in Phil's own account, on the Hobby plan. Before launch it moves to an account EdCo own, on Pro. See *Hosting handover* below. The domain also needs DNS access. |
| 1.29 | **Analytics** | None installed. Brief implies measuring relationships over traffic — worth a conversation about what's actually being measured. |
| 1.30 | **CMS** | Decided: **Prismic** (repository `66bbee42`). All content is in it; see README *Prismic* and the editor guide. Draft previews work for every page type. |

### Hosting handover

The proof of concept stays in Phil's Vercel account for now. Before launch, move it to an account EdCo own. Nothing in the code depends on the account or the `.vercel.app` address, so this is a short job.

1. **Create the account** with a shared EdCo mailbox (e.g. `web@educationcompany.co.uk`) rather than a personal address, so it survives staff changes. Turn on two-factor authentication and keep the recovery codes where EdCo can reach them.
2. **Choose the plan.**
   - **Pro is required at launch:** Hobby is for non-commercial use only. A new account gets a free Pro trial.
   - **Pro is also needed** to add team members, or to deploy a private repo owned by a GitHub organisation (if the repo moves into one).
3. **Import the repo** (`philjclarke/edco-website`) in the new account, and give Vercel's GitHub app access to it.
4. **Environment variables:** none are needed. The site reads published Prismic content without a token.
5. **Point Prismic at the new deployment:**
   - **Deploy hook:** create one in the new Vercel project (Settings → Git → Deploy Hooks, branch `main`). Then, in Prismic, replace the webhook's URL with it (`npx prismic webhook` or Settings → Webhooks).
   - **Previews and simulator:** once the domain changes, update the preview URL and the slice simulator URL in Prismic.
6. **Check the new deployment:** the site, `/v1/`, `/v2/`, a Prismic preview, and a test publish.
7. **Delete the old project.** Until then, both rebuild on every change. The `edco-website.vercel.app` name only frees up once the old project is deleted, so anyone with the old link needs the new one.
8. **Add the custom domain** and update DNS.

---

## 2. Content EdCo needs to write or approve

| # | Item | Brief |
| --- | --- | --- |
| 2.1 | **Sign off the site copy.** Roughly 60% is verbatim from the brief; the rest I wrote to its voice. It all needs reading. | §7, §80 |
| 2.2 | **8–12 case studies.** Two placeholder shells exist with the required seven-part structure. Twelve themes to source are listed on `/case-studies/`. | §56–57 |
| 2.3 | **Testimonials against four themes** — challenging the brief, understanding education *and* the client's business, feeling like part of the team, long relationships. Not "they were great to work with". | §59 |
| 2.4 | **Three launch "What we're hearing" items.** Each answers: what we're hearing, where, why it matters, what it means for organisations. | §18, §47 |
| 2.5 | **Opinion articles + named authors.** Nine title territories are given in the brief. One sample article is in the repo, clearly marked as a sample. | §48 |
| 2.6 | **Research & Insight pieces.** One sample in the repo. | §49 |
| 2.7 | **Four leadership profiles** — photo, name, role, one line on what they actually know about. | §63 |
| 2.8 | **Partner ecosystem** — logo, name, one sentence, for approved relationships only. | §45 |
| 2.9 | **Current events** for `/for-educators/` and the homepage free-value section. | §19, §54 |
| 2.10 | **Free customer analysis mechanics** — what you need from the client, file format, turnaround. | §29 |
| 2.11 | **Editorial cadence.** How often does What We Think publish, and who writes it? This determines whether a CMS is genuinely needed. | §46 |

---

## 3. Photography

One classroom image was supplied and is currently doing all the work on the homepage.
Twenty-four pages need more. Worth commissioning or licensing:

- 3.1 Educators in real settings — primary, secondary, FE, international
- 3.2 Trust/MAT leadership and business-operations contexts (for the MAT-focused material)
- 3.3 EdCo people at work — research sessions, events, the office
- 3.4 Event and CPD photography
- 3.5 Abstract/data-led imagery for the Education IQ and Data Services pages

Every hero now carries a treated photograph (fade + duotone) in place of the
ribbon. Nine Unsplash stand-ins cover roughly thirty heroes, so images repeat
across sections — acceptable while the copy is being reviewed, not at launch.
Commissioning around a dozen would remove the repetition entirely; each one is a
file in `src/assets/banners/`, a line in `src/data/banners.ts`, and a key in the
page's JSON.

### Product screenshots — EdCo feedback, Sept 2026

Every product page now has framed slots waiting for real captures. Until they
arrive each renders a `[SCREENSHOT]` placeholder at the right aspect ratio, so
dropping an image in needs no layout work — just a `src` in `products.json`.

Education IQ is **provisionally filled** with eight design-prototype captures
taken from the Education IQ marketing repo. They carry a "design prototype"
footer and example data, and one of them names a real school against invented
staff and commentary — fine as a reference point, worth replacing before launch.

| Product | Shots needed |
| --- | --- |
| Education IQ | Prototype captures in place. Replace with the live product, and add one for **Find lookalikes**, which has no capture yet |
| EdNet | An EdNet site as a visitor sees it; the engagement-intelligence admin view |
| SPIRIT | The pipeline view; an education organisation record |
| International Schools Network | The network site |
| The Curriculum Network | The network site |

Also outstanding from the same feedback: **detail copy for the nine Education IQ
use cases.** Each expandable card shows a `[DETAIL COPY]` placeholder — I have
not written these, because they are specific product claims rather than
positioning.

Note the brand's faded-photo treatment (supplied as `faded img.png`) is a light-section
device — that pattern is in the design system but currently unused.

---

## 4. Deliberately deferred to phase 2

Not oversights. Each has a route reserved or a placeholder holding its place.

| Item | Why deferred |
| --- | --- |
| `/resources/` library | Needs real resources to organise |
| `/events/` listing for prospective customers | Needs a real events programme |
| Interactive tools and diagnostics | Brief §55 explicitly says these needn't exist at launch |
| Personalisation | Brief §65 — future ambition, content is tagged so it stays possible |
| SEO landing pages for high-intent terms | Brief §66 — after the core proposition is signed off |
| Campaign landing-page templates | Brief §67 — needs a first campaign to design against |

---

## 5. Open from the Sept 2026 snag list

Every annotation is now actioned. "Remove, hearing will pick this up" meant
Research & insight, out of the nav dropdown; "remove — we need the space" meant
For Educators, moved to the utility bar to make room for Capabilities. Both
pages stay and stay reachable.

Two structural questions remain, neither of them blocking.

| Item | What I need |
| --- | --- |
| **EdNet is now the Engagement Hub in name only** | Every visible mention is renamed; the URL stays `/products/ednet/` by decision. Worth revisiting before launch — a visitor who notices the mismatch reads it as an unfinished rebrand, and changing it later costs a redirect that is free to add now. |
| **Education IQ now says the same thing twice** | "What people use it for" (nine expandable cards, written from the brief) and "Ten ways to use it" (EdCo's own slide) cover much the same ground — analyse customers, identify risk, enrich CRM, improve targeting. I have kept both because only one was asked about. They should almost certainly merge, with EdCo's ten as the spine and the screenshots attached to them. |

Also: the ten-ways slide reads "connect it your systems". I have restored the
missing word on the site; worth fixing in the source deck too.

## 6. From the component deck (Oct 2026)

Every page is now built from the deck's page types and components. Left to decide:

| Item | What I need |
| --- | --- |
| **Insights & Opinion copy** | The section's banner still says “Three different things, kept deliberately separate”. Research & insight merged into What we're hearing, so it's now two. |
| **Pages below About and Agencies & Partners** | The types exist; no pages yet. |
| **Provision blueprints** | The type exists at `/provision-blueprints/<name>/`; no pages yet, and nothing links to them. |
| **Case studies** | The case studies list and case study pages are not yet converted to components. |
| **For Educators network links** | The two network cards link to the product pages. If the networks' own sites should be the destination, change the card links in Prismic. |
| **How we do it colours** | The deck shows each panel's icon in a different colour (indigo, teal, blue…). Those aren't brand colours, so every icon uses the orange-to-pink gradient. |

## 7. Questions I'd want answered

1. **Is the six-outcome navigation right?** It's the brief's spine and it's the biggest
   single bet in the design. Everything else follows from it.
2. **Does "Education Intelligence & Engagement" earn its place in the hero eyebrow?** The
   brief says not to force the category. It's currently prominent — easy to remove.
3. **How commercially blunt should the tone be?** The brief pushes hard on "leads",
   "pipeline", "then you sell". I've written it that way. It's a choice worth confirming
   with EdCo before it's shown widely.
4. **Is `/customer/` the right home for logins,** or should product logins be reachable
   from the top-level utility bar directly?
5. **Does SPIRIT need more prominence than this?** The brief says "an option, not an
   agenda", so it's positioned as one product among five. Commercially that may sting.
