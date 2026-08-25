# Wedding Website — Requirements Document

**Status:** Draft v3
**Last updated:** 2026-08-25

## 1. Overview

A custom wedding website for a single ceremony + reception event. It informs guests about the event, collects mailing addresses ahead of sending physical invites, and collects RSVPs and meal preferences via a simple name-based lookup (no code to lose). It also hosts a registry page that links to external registries and supports couple-managed "cash fund" items for things that don't have a registry — created quickly via a companion browser extension. The couple gets full admin access; select family members (e.g., parents) get a limited admin role for guest-list and RSVP help.

**Scale:** 200+ guests / households.
**Timeline:** Wedding is several months out — no hard launch deadline, but address collection needs to be live early enough to leave time for ordering and mailing physical invitations, and RSVP should be live well before travel-booking season for guests.

## 2. Goals & Non-Goals

**Goals**
- Single source of truth for event info (date, venue, dress code, travel, registry).
- Let the couple build and maintain the guest list from the admin UI, with CSV import supported for bulk-loading.
- Make collecting mailing addresses from guests easy, and make exporting that list for addressing invites fast (mail-merge-ready format).
- Let guests RSVP by name alone — no code to remember or lose.
- Track attendance, meal choices, and plus-ones accurately at 200+ guest scale.
- Give the couple (Full Admin) and trusted family (Family Admin) a shared view to manage the guest list, addresses, and RSVP/dietary details.
- Offer a registry page combining external registry links and custom "cash fund" items, with a browser extension to create a cash-fund item from any product page in seconds.

**Non-Goals (v1)**
- No photo upload/sharing.
- No in-site payment processing in v1 — cash funds link out to an external payment method (e.g., Venmo/PayPal/Zelle/CashApp); the site does not move money itself. Real payment processing is planned for v2 (see section 7).
- No guest-to-guest messaging/social features.
- No native mobile app — responsive web only.
- No multi-language support (unless flagged as needed later).
- No multi-day schedule/itinerary — single ceremony + reception only.

## 3. User Roles

| Role | Access |
|---|---|
| Guest | Public site + address-collection lookup + name-based RSVP lookup |
| Couple (Full Admin) | Everything: guest list CRUD, addresses, RSVP/dietary detail, CSV export, content editing, registry & cash-fund management, browser-extension access, manages other admins |
| Family Admin (Limited) | Guest list + address book (view/add/edit); RSVP status **and** dietary details (view/edit); **no** content editing, **no** registry/cash-fund management, **no** ability to manage other admins, **no** browser-extension access |

## 4. Functional Requirements

### 4.1 Public Site (Informational)
- Home / landing page (names, date, countdown)
- Our story (optional text/photo blurb)
- Event details: ceremony + reception venue, date/time, dress code
- Travel & lodging: hotel blocks, airport info, transportation
- Registry (see 4.5)
- FAQ
- Contact (couple or family contact info)

### 4.2 Guest List (admin UI + CSV import)
- Full Admin and Family Admin can add households and members directly in the dashboard (name, relationship/side, plus-one slots, kids, phone number).
- CSV import supported for bulk-loading a household/guest list (e.g., from an existing spreadsheet) — mapped to the same household/guest data model, with a preview/review step before committing the import. Phone number is an importable/editable field so RSVP disambiguation (4.4) works for households that never used the public address form.
- Each household is the unit RSVPs and addresses attach to, regardless of whether it was created manually or via import.
- Admin can edit or remove households/guests at any time.

### 4.3 Guest Address Collection (pre-invite phase)
- Guest-facing lookup: guest types their name, sees any close matches, and confirms which one is them (matches shown with minimal identifying info — e.g., first + last name and maybe a "side" hint — never the full guest list) before entering a mailing address and a **phone number (required)**, plus optional email.
- Phone is collected specifically so it can serve as the disambiguator/verification step for RSVP later (4.4) — flagged to the guest as "used to verify your RSVP," not for marketing/contact.
- "Can't find my name" case routes to a fallback contact link (e.g., "email us") rather than letting a guest self-register a new household, to keep the list clean.
- Admin **export** of the address list formatted for addressing invites (name + full mailing address per household, mail-merge/label-ready CSV).

### 4.4 RSVP Flow (name + phone, no code)
- Guest-facing lookup: guest enters their name. If multiple households match, guest is asked to confirm the **last 4 digits of their phone number** on file before the match is revealed — no invite code required.
- Edge case: if a name collision *and* last-4-digits collision both occur (rare but possible, e.g., same family phone plan), fall back to the full phone number; if still unresolved, route to the "contact us" fallback rather than guessing.
- Edge case: households with no phone on file (e.g., admin-entered directly, never went through address collection) can't use the disambiguation step if their name collides with another — admin should ensure phone is captured for every household during guest-list entry, not just via the public address form.
- On confirmed match, show all household members tied to that household (plus-ones/kids pre-loaded by admin, not guest-added).
- Per-guest: attending / not attending, meal choice (from a defined set of options, incl. dietary restriction free-text).
- Household-level: total headcount confirmation, notes/allergies free-text.
- Confirmation screen + confirmation email to the household (if email was captured).
- Guests can return and **edit their RSVP** until a cutoff date (admin-configurable).
- **Trade-off called out:** dropping the invite code makes RSVP more forgiving but weakens the guarantee that only the intended person can answer for a household. Using phone (something the guest inherently knows, not a token they were handed) as the verification step closes most of that gap without reintroducing a "thing to lose." Remaining mitigations: no public guest-list browsing, basic rate-limiting/bot protection on the lookup endpoint, and an admin-visible log of when/how each RSVP was submitted or changed so anomalies are easy to spot.

### 4.5 Registry
- **External registry links:** admin adds a title + URL (+ optional logo) per external registry (Amazon, Target, Crate & Barrel, etc.); public registry page lists them as simple link-out cards.
- **Cash funds:** custom items the couple wants without an existing registry — title, description, image, price/goal amount, and an external payment link (Venmo/PayPal/Zelle/CashApp, admin's choice) where guests actually send money. The site displays the fund; it does not process the payment.
- "Amount raised" / fulfilled status is admin-updated manually in v1 (no automatic payment tracking, since there's no in-site payment integration). Real payment processing and automatic progress bars are planned for v2 — see section 9.
- Registry and cash-fund management is **Full Admin only**.

### 4.6 Browser Extension (companion tool for cash funds)
- Small browser extension (Chrome / Chromium-based, Manifest V3) used only by the Full Admin to speed up creating cash-fund items.
- On any product page, the admin opens the extension, which scrapes page metadata (title, main image, price where detectable from common meta tags/structured data) and shows an editable preview.
- Admin reviews/edits the scraped fields, adds the external payment link and any notes, and submits — this creates a new cash-fund registry item via the site's admin API.
- Extension authenticates with a scoped API token (generated from the admin dashboard and pasted into the extension's settings) rather than a full login, to limit what's exposed inside browser-extension storage.
- Best-effort scraping only — always editable before submission; no guarantee of accurate extraction on every site.

### 4.7 Admin Dashboard
- Guest list management: add/edit/remove households and members; add/edit mailing addresses; both roles.
- CSV export: mailing-address list (for invites) and headcount/meal list (for caterer/venue).
- RSVP dashboard: response rate, attending/not/no-response counts, meal-choice breakdown, dietary-restriction list; both roles.
- Registry & cash-fund management: Full Admin only.
- Content editing (event details/FAQ text): Full Admin only.
- Role management: Full Admin can invite a Family Admin and revoke access.
- Real authentication (email/password or magic link) for both admin roles.

## 5. Non-Functional Requirements

- **Responsive design** — majority of guests will access via mobile.
- **Performance** — fast load on mobile networks.
- **Data privacy** — guest PII (names, addresses, dietary info, contact info) stored securely; no public exposure of the guest list or cross-household data. Guest-facing lookups reveal the minimum needed to confirm a match. Phone numbers are collected for RSVP verification purposes only and are never displayed publicly (only the last 4 digits are ever surfaced, during disambiguation).
- **Reliability at scale** — must hold up under bursty traffic (e.g., right after invites go out, or around the RSVP deadline).
- **Backups** — guest, address, RSVP, and registry data backed up; irreplaceable if lost.
- **Accessibility** — reasonable a11y basics (contrast, alt text, keyboard nav) since guests span a wide age range.
- **Low ongoing cost** — personal project; prefer free-tier-friendly hosting/DB at this guest scale.
- **Extension token security** — the browser-extension API token is scoped to registry/cash-fund creation only (not full admin) and revocable from the dashboard.

## 6. Proposed Tech Stack (recommendation)

- **Framework:** Next.js (React) — single codebase for the public site + admin dashboard.
- **Hosting:** Vercel (or similar) — free/cheap tier comfortably covers this traffic scale.
- **Database:** Postgres (e.g., managed free-tier provider like Neon/Supabase) — relational fit for households/guests/addresses/RSVPs/registry items.
- **Admin auth:** Email/password or magic-link auth (e.g., Auth.js) with a role field (`full_admin` / `family_admin`).
- **Guest lookup:** No real auth — name-based search with disambiguation, backed by a session/cookie scoped to the matched household once confirmed.
- **Browser extension:** Separate small Manifest V3 extension (vanilla JS/TS), calling a dedicated, scoped admin API endpoint via a long-lived token; no shared codebase needed with the main app beyond the API contract.

No object/file storage needed since photo upload is out of scope, keeping the stack simple and inexpensive.

## 7. Future (V2) Roadmap: Registry Payment Processing

Not built in v1, but the v1 data model (funds have a goal amount and a status) should stay compatible with this so v2 isn't a rewrite.

- **Real payment processing** for cash funds (e.g., Stripe) replacing the external Venmo/PayPal link, so contributions happen on-site.
- **Automatic progress bars** on each fund, driven by real contribution totals instead of admin manual updates.
- **Purchase record for thank-you notes:** every contribution/purchase (external-registry purchases where the platform supports it, and on-site cash-fund contributions) is logged — guest name, item/fund, amount, date — specifically so the couple can write accurate, personalized thank-you notes later.
- **Delayed visibility for the couple, by design:** the itemized guest-to-gift record is **not visible to Full Admin (the couple) in real time**. It unlocks automatically at an admin-configurable reveal date (default: the day after the wedding), at which point the couple gets full access to the log for thank-you-note writing. Before the reveal date, the couple (and Family Admin) only see **aggregate** figures — total raised, number of contributions — never who gave what or which specific item.
  - This is an intentional exception to the usual rule that the highest-privileged role sees everything — it's a self-imposed blind spot the couple is choosing for themselves, not a role-based restriction, so it needs to be enforced at the data layer (e.g., a reveal-date gate on the query) rather than just hidden in the UI.
  - Guests are unaffected by this — they still see live fund progress/goal amounts as normal.
  - **Known limitation:** this delayed-visibility guarantee only applies to data the site itself controls (on-site cash-fund contributions). Purchases made through external registries (Amazon, Target, etc.) are visible to the couple through those platforms directly, outside this site's control — worth being aware of if the "no early peeking" goal matters for external-registry gifts too.
- Open question for when this is built: should the reveal date be a fixed default (day after the wedding) that the couple can override, or something they set explicitly with no default?

## 8. Open Questions

Resolved: cash-fund tracking is manual for v1, with real payment processing + auto progress bars planned for v2 (section 7); extension is Chrome-only; guest list supports both manual entry and CSV import.

- **Bot/abuse protection:** comfortable with a lightweight rate-limit/CAPTCHA on the name-lookup endpoints given no code, or do you want something stronger?
- RSVP cutoff date — when should editing lock?
- Should household emails be collected during address collection, RSVP, or both? (Phone is now required at address collection per section 4.3.)
- Domain name — already owned, or need to pick one?
- How many Family Admins do you expect (just parents, or wedding party too)?
- V2 reveal date: fixed default (day after the wedding) with override, or admin sets it explicitly with no default?

## 9. Suggested Milestones

1. **Content & structure** — finalize page list, copy, wireframe layout.
2. **Guest data model + admin guest-list UI** — households/guests schema, add/edit UI for both admin roles, CSV import with preview/review step.
3. **Address collection** — public name-lookup + disambiguation flow, address form, mail-merge CSV export.
4. **RSVP core** — name-based lookup/disambiguation, RSVP submit/edit flow, RSVP dashboard.
5. **Registry** — external link cards + cash-fund CRUD in admin (Full Admin only), public registry page.
6. **Browser extension** — scoped API token issuance, extension scraping + submit flow.
7. **Admin roles & auth** — Full Admin / Family Admin login, permission boundaries.
8. **Polish** — responsive QA, a11y pass, performance pass, backups configured.
9. **Launch (address collection)** — go live early enough to leave mailing lead time.
10. **Launch (RSVP + registry)** — enabled once invites are physically sent, well ahead of guests' travel-booking window.
11. **(V2) Payment processing** — Stripe integration, auto progress bars, delayed-visibility purchase log for thank-you notes.
