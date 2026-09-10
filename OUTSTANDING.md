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
| 1.1 | **Logo as SVG** (positive + reversed) | We have 1106×451 PNGs. They're upscaled at large sizes and can't be recoloured. The starburst is vector artwork somewhere. |
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
| 1.12 | Logo files, SVG preferred |
| 1.13 | Any 11th–15th logos to reach the 10–15 the brief asks for |

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
| 1.28 | **Hosting** | Netlify or Cloudflare Pages both work as-is, free. Needs a decision plus DNS access. |
| 1.29 | **Analytics** | None installed. Brief implies measuring relationships over traffic — worth a conversation about what's actually being measured. |
| 1.30 | **CMS** | Deliberately deferred. See the content-model table in the README when it's decided. |

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
| Three capability detail pages — CSR programmes, education strategy, proposition development | Summarised on `/capabilities/`; nothing links to them yet, and the brief marks capabilities as a secondary route |
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

## 6. Questions I'd want answered

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
