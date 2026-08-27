# Wedding Website — Requirements Document

**Status:** Draft v8
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
- Let guests RSVP by name plus contact info they already know (email and/or phone) — no code to remember or lose.
- Track attendance, meal choices, and plus-ones accurately at 200+ guest scale.
- Give the couple (Full Admin) and trusted family (Family Admin) a shared view to manage the guest list, addresses, and RSVP/dietary details.
- Offer a registry page combining external registry links and custom "cash fund" items, with a browser extension to create a cash-fund item from any product page in seconds.

**Non-Goals (v1)**
- No photo upload/sharing.
- No in-site payment processing in v1 — cash funds link out to an external payment method (e.g., Venmo/PayPal/Zelle/CashApp); the site does not move money itself. Real payment processing is planned for v2 (see section 8).
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
- Event details: ceremony + reception venue, date/time, dress code, **add-to-calendar button** (Google/Apple/Outlook + ICS download)
- Venue map/directions embed (ceremony and reception, if different locations)
- Wedding party page (names, photos, role — bridesmaids/groomsmen/etc.)
- Travel & lodging: hotel blocks, airport info, transportation
- Local recommendations: restaurants, activities, things to do near the venue/hotel block
- Registry (see 4.7)
- FAQ
- Contact (couple or family contact info)

### 4.2 Guest List (admin UI + CSV import)
- Full Admin and Family Admin can add households and members directly in the dashboard (name, relationship/side, plus-one slots, kids, **email and/or phone number** — whatever contact info the couple already has, even before the guest has self-submitted anything).
- CSV import supported for bulk-loading a household/guest list (e.g., from an existing spreadsheet) — mapped to the same household/guest data model, with a preview/review step before committing the import. Email/phone are importable/editable fields so RSVP disambiguation (4.5) and guest outreach (4.4) work for households that never used the public address form.
- Each household is the unit RSVPs and addresses attach to, regardless of whether it was created manually or via import.
- Admin can edit or remove households/guests at any time.
- **Divorced/blended families:** nothing in the data model forces one household per surname — admin can create two separate household records for the same last name (e.g., each parent at their own address), each with its own contact info, address, and RSVP. Worth calling out explicitly in the admin UI (e.g., an easy "split into two households" action) rather than leaving it as an implicit capability.
- **Name aliases:** admin can optionally store a nickname/maiden-name/alternate spelling per guest, used by the name-lookup matching in 4.3/4.5 so "Bob" finds "Robert" and a married name finds a guest still listed under their maiden name.

### 4.3 Guest Address Collection (pre-invite phase)
- Guest-facing lookup: guest types their name, sees any close matches, and confirms which one is them (matches shown with minimal identifying info — e.g., first + last name and maybe a "side" hint — never the full guest list) before entering a mailing address and contact info.
- **Contact info: email and/or phone, guest's choice** — at least one of the two is required, neither is forced. Whichever is provided becomes that household's identity-verification method for RSVP (4.5) and the channel used for outreach/reminders (4.4). A household that gives both gets both as fallback options.
- "Can't find my name" case routes to a fallback contact link (e.g., "email us") rather than letting a guest self-register a new household, to keep the list clean.
- Admin **export** of the address list formatted for addressing invites (name + full mailing address per household, mail-merge/label-ready CSV).

### 4.4 Guest Outreach (Email/SMS Invites & Reminders)
- Admin can send a household a message — email or text, whichever contact method is on file — containing a **personalized link** straight to the address-collection form (4.3) or RSVP form (4.5), so the guest doesn't have to search for their own name at all.
- This is most useful for households the couple already has some contact info for (family, close friends) even before a mailing address is known — it complements, not replaces, the self-service name-lookup flow for guests the couple has no contact info for.
- The link's token is different in kind from the "no code to lose" RSVP design: it's generated and sent directly by the admin to a contact method the admin already trusts, not something the guest has to receive, keep track of, and type in later — so it doesn't reopen the "guest might lose it" problem. Tokens are single-purpose (address collection or RSVP) and admin-revocable.
- Bulk send supported (e.g., "send an address-collection invite to every household missing an address") alongside one-off sends per household.
- RSVP reminders (previously its own item) are a special case of this same outreach mechanism, targeted at non-responders as the cutoff approaches — see 4.9 for the default cadence.
- Households with no email or phone on file at all can only be reached via the self-service name-lookup flow (4.3/4.5) or manually (phone call, mailed note) — flagged in the admin dashboard.

### 4.5 RSVP Flow (name + email/phone, no code)
- Guest-facing lookup: guest enters their name. If multiple households match, guest is asked to confirm a disambiguator drawn from whichever contact method the household provided in 4.3/4.2: the **last 4 digits of their phone number** if phone is on file, or their **full email address** if only email is on file — no invite code required either way.
- Edge case: if a disambiguator collision also occurs (rare — e.g., a shared family phone line), fall back to asking for the other contact method if one exists, or full phone number; if still unresolved, route to the "contact us" fallback rather than guessing.
- Edge case: households with neither phone nor email on file (shouldn't happen given 4.3 requires at least one, but possible for admin-entered households where it was skipped) can't use the disambiguation step if their name collides with another — admin should ensure at least one contact method is captured for every household.
- On confirmed match, show all household members tied to that household (plus-ones/kids pre-loaded by admin, not guest-added).
- Per-guest: attending / not attending, meal choice (from a defined set of options, incl. dietary restriction free-text).
- Household-level: total headcount confirmation, notes/allergies free-text, **song request (optional, free-text, one per household)**.
- **Partial/draft responses allowed:** a household doesn't have to answer for every member in one sitting — the form saves progress per guest and shows "X of Y answered," and the household can return and finish later (still before the cutoff).
- **Concurrent-edit handling:** if two members of the same household submit changes around the same time, the second save shows a brief "this was just updated — here's the current version" check rather than silently overwriting the first.
- Confirmation screen + confirmation email to the household (if email was captured).
- Guests can return and **edit their RSVP** until a cutoff date (admin-configurable). **Cutoff should include a buffer before any vendor deadline** (e.g., caterer final-count due date) — recommend setting the guest-facing cutoff at least a week ahead of the actual vendor deadline, to leave time to compile and submit the count.
- **Admin proxy-entry:** Full Admin or Family Admin can submit or edit an RSVP directly from the admin dashboard on a household's behalf (e.g., after a phone call with a guest who won't use the site) — bypasses the guest-facing lookup entirely and is recorded in the audit log as admin-entered, not guest-submitted.
- **Trade-off called out:** dropping the invite code makes RSVP more forgiving but weakens the guarantee that only the intended person can answer for a household. Using contact info the guest inherently knows (not a token they were handed) as the verification step closes most of that gap without reintroducing a "thing to lose." Remaining mitigations: no public guest-list browsing and an admin-visible log of when/how each RSVP was submitted or changed so anomalies are easy to spot — plus the bot/abuse protections in section 5 (invisible CAPTCHA, rate-limiting/lockout, noindex, anomaly alerting) applied to both the address-collection (4.3) and RSVP lookup endpoints.

### 4.6 Table / Seating Lookup
- Admin (either role) assigns each household/guest to a table from the guest list view — realistically only meaningful once RSVPs are mostly closed and final headcount is known.
- Guest-facing lookup reuses the exact same name + disambiguator flow as RSVP (4.5), so guests don't have to learn a second pattern — they look themselves up and see their table assignment.
- **Not visible until assignments exist:** the table lookup page/link is entirely absent from the public site until the admin has assigned at least one table — no "not assigned yet" placeholder state, no early link to a feature that isn't ready yet. It appears automatically once assignments begin (or the admin can gate it further, e.g., only reveal once all households are assigned).
- Admin can export a table/seating chart (household + table number) for the venue/caterer.

### 4.7 Registry
- **External registry links:** admin adds a title + URL (+ optional logo) per external registry (Amazon, Target, Crate & Barrel, etc.); public registry page lists them as simple link-out cards.
- **Cash funds:** custom items the couple wants without an existing registry — title, description, image, price/goal amount, and an external payment link (Venmo/PayPal/Zelle/CashApp, admin's choice) where guests actually send money. The site displays the fund; it does not process the payment.
- "Amount raised" / fulfilled status is admin-updated manually in v1 (no automatic payment tracking, since there's no in-site payment integration). Real payment processing and automatic progress bars are planned for v2 — see section 8. See also section 7 for the double-purchase risk this manual process carries.
- Registry and cash-fund management is **Full Admin only**.

### 4.8 Browser Extension (companion tool for cash funds)
- Small browser extension (Chrome / Chromium-based, Manifest V3) used only by the Full Admin to speed up creating cash-fund items.
- On any product page, the admin opens the extension, which scrapes page metadata (title, main image, price where detectable from common meta tags/structured data) and shows an editable preview.
- Admin reviews/edits the scraped fields, adds the external payment link and any notes, and submits — this creates a new cash-fund registry item via the site's admin API.
- Extension authenticates with a scoped API token (generated from the admin dashboard and pasted into the extension's settings) rather than a full login, to limit what's exposed inside browser-extension storage.
- Best-effort scraping only — always editable before submission; no guarantee of accurate extraction on every site.

### 4.9 Admin Dashboard
- **Event settings: Full Admin sets the RSVP cutoff date** (and can change it later if plans shift) — drives the edit-lock in 4.5, the reminder schedule in this section, and the table-lookup timing in 4.6. No hardcoded date; nothing works until the admin sets one, and the RSVP form/reminders stay dormant until it's configured.
- Guest list management: add/edit/remove households and members; add/edit mailing addresses and contact info; both roles.
- Table/seating assignment tool (see 4.6): both roles.
- CSV export: mailing-address list (for invites), headcount/meal list (for caterer/venue), and table/seating chart.
- RSVP dashboard: response rate, attending/not/no-response counts, meal-choice breakdown, dietary-restriction list, song requests; both roles.
- RSVP proxy-entry on behalf of a household (see 4.5): both roles.
- **Guest outreach (see 4.4):** send/schedule address-collection invites and RSVP reminders via whichever contact method (email/SMS) each household has on file, one-off or in bulk. Households missing both are flagged so admin knows to follow up manually (phone call, mailed note). Default RSVP-reminder cadence (adjustable in admin settings, not hardcoded): **3 automatic reminders** to non-responders — 6 weeks before the RSVP cutoff, 3 weeks before, and 3 days before.
- **Thank-you-sent tracking:** a simple per-household toggle ("thank-you sent: yes/no") in the guest list, filterable and exportable — works today, independent of the v2 gift-purchase log (section 8).
- Registry & cash-fund management: Full Admin only.
- Content editing (event details/FAQ text): Full Admin only.
- Role management: Full Admin can invite a Family Admin and revoke access.
- Real authentication (email/password or magic link) for both admin roles.

## 5. Non-Functional Requirements

- **Responsive design** — majority of guests will access via mobile.
- **Performance** — fast load on mobile networks.
- **Data privacy** — guest PII (names, addresses, dietary info, contact info) stored securely; no public exposure of the guest list or cross-household data. Guest-facing lookups reveal the minimum needed to confirm a match. Email/phone are collected for RSVP verification and outreach purposes only and are never displayed publicly (only the last 4 digits of phone are ever surfaced during disambiguation; email is only ever entered by the guest themselves, never shown back to a different guest).
- **Reliability at scale** — must hold up under bursty traffic (e.g., right after invites go out, or around the RSVP deadline).
- **Bot/abuse protection on lookup endpoints** (address collection 4.3 and RSVP 4.5, since both trade a code for name-based lookup): invisible CAPTCHA (e.g., Cloudflare Turnstile) on the lookup form; progressive lockout/step-up challenge after repeated failed match attempts from the same IP/session; `noindex`/`robots.txt` so the site and guest names aren't crawlable/searchable; admin-facing anomaly alerting when lookup-failure volume spikes. Chosen to stay invisible to legitimate guests (no visible CAPTCHA puzzles, no accounts) while closing the brute-force gap opened by dropping invite codes.
- **Backups** — guest, address, RSVP, and registry data backed up; irreplaceable if lost.
- **Accessibility** — reasonable a11y basics (contrast, alt text, keyboard nav) since guests span a wide age range.
- **Low ongoing cost** — personal project; prefer free-tier-friendly hosting/DB at this guest scale.
- **Extension token security** — the browser-extension API token is scoped to registry/cash-fund creation only (not full admin) and revocable from the dashboard.
- **Phone number normalization** — phone numbers are normalized to a consistent format (E.164) on save, regardless of how the guest typed it (dashes, parens, spaces, with/without country code) — otherwise last-4-digit matching in 4.5 silently fails for inconsistently formatted numbers.
- **Timezone correctness** — the countdown, event date/time, and RSVP cutoff are all pinned to the venue's timezone, not each guest's browser timezone, so out-of-town guests see accurate numbers.

## 6. Proposed Tech Stack (recommendation)

- **Framework:** Next.js (React) — single codebase for the public site + admin dashboard.
- **Hosting:** Vercel (or similar) — free/cheap tier comfortably covers this traffic scale.
- **Database:** Postgres (e.g., managed free-tier provider like Neon/Supabase) — relational fit for households/guests/addresses/RSVPs/registry items.
- **Admin auth:** Email/password or magic-link auth (e.g., Auth.js) with a role field (`full_admin` / `family_admin`).
- **Guest lookup:** No real auth — name-based search with disambiguation, backed by a session/cookie scoped to the matched household once confirmed.
- **Browser extension:** Separate small Manifest V3 extension (vanilla JS/TS), calling a dedicated, scoped admin API endpoint via a long-lived token; no shared codebase needed with the main app beyond the API contract.
- **Transactional email:** a provider like Resend or SendGrid for RSVP confirmations, guest-outreach invites, and RSVP reminder emails (free tier is plenty at this guest scale).
- **SMS:** a provider like Twilio for households reached by text instead of/in addition to email (guest outreach, 4.4).
- **Bot protection:** Cloudflare Turnstile (or equivalent) on the lookup forms, plus app-level rate-limiting/lockout on the lookup API routes.

No object/file storage needed since photo upload is out of scope, keeping the stack simple and inexpensive.

## 7. Known Edge Cases & Operational Notes

Cross-referenced from the sections above; collected here so they're not lost in the middle of a feature spec.

- **Email deliverability:** transactional email from a brand-new domain often lands in spam. Set up SPF/DKIM/DMARC for whichever provider is chosen (Resend/SendGrid) before relying on confirmation or reminder emails actually being seen.
- **SMS consent:** since outreach texts (4.4) are admin-initiated rather than guest-opted-in, include a brief consent/opt-out line in the first text to each household (e.g., "Reply STOP to opt out") as a baseline courtesy/compliance measure.
- **Post-wedding data retention (resolved):** guest PII (addresses, phone, email, dietary notes) is retained for **6 months after the wedding date by default** — long enough to comfortably cover thank-you-note writing/sending (including the delayed gift-visibility reveal in section 8) with a buffer. Admin-configurable, not hardcoded. At the 6-month mark, the admin gets a dashboard prompt to review and either purge or explicitly extend retention (e.g., if the couple wants to keep addresses for future holiday cards) — nothing is auto-deleted without an admin decision.
- **Meal-option validation:** meal choices should be scoped appropriately per guest (e.g., a kids' meal option shouldn't be selectable for an adult guest, if such a distinction exists on the menu).
- **Registry double-purchase risk (v1):** since v1 fund tracking is manual (see section 8, Future Roadmap, for the v2 automated version), there's a window where two guests could buy the same off-registry item if the admin hasn't updated status yet. Mitigate by updating fund status promptly, or marking an item "reserved" as soon as the admin is notified of a purchase, even before formally marking it fulfilled.

## 8. Future (V2) Roadmap: Registry Payment Processing

Not built in v1, but the v1 data model (funds have a goal amount and a status) should stay compatible with this so v2 isn't a rewrite.

- **Real payment processing** for cash funds (e.g., Stripe) replacing the external Venmo/PayPal link, so contributions happen on-site.
- **Automatic progress bars** on each fund, driven by real contribution totals instead of admin manual updates.
- **Purchase record for thank-you notes:** every contribution/purchase (external-registry purchases where the platform supports it, and on-site cash-fund contributions) is logged — guest name, item/fund, amount, date — specifically so the couple can write accurate, personalized thank-you notes later.
- **Delayed visibility for the couple, by design:** the itemized guest-to-gift record is **not visible to Full Admin (the couple) in real time**. It unlocks automatically at an admin-configurable reveal date (default: the day after the wedding), at which point the couple gets full access to the log for thank-you-note writing. Before the reveal date, the couple (and Family Admin) only see **aggregate** figures — total raised, number of contributions — never who gave what or which specific item.
  - This is an intentional exception to the usual rule that the highest-privileged role sees everything — it's a self-imposed blind spot the couple is choosing for themselves, not a role-based restriction, so it needs to be enforced at the data layer (e.g., a reveal-date gate on the query) rather than just hidden in the UI.
  - Guests are unaffected by this — they still see live fund progress/goal amounts as normal.
  - **Known limitation:** this delayed-visibility guarantee only applies to data the site itself controls (on-site cash-fund contributions). Purchases made through external registries (Amazon, Target, etc.) are visible to the couple through those platforms directly, outside this site's control — worth being aware of if the "no early peeking" goal matters for external-registry gifts too.
- **Resolved:** reveal date defaults to the day after the wedding, with the couple able to override it in admin settings if they want it later (e.g., after a honeymoon).

## 9. Open Questions

Resolved: cash-fund tracking is manual for v1, with real payment processing + auto progress bars planned for v2 (section 8); extension is Chrome-only; guest list supports both manual entry and CSV import; table lookup stays hidden entirely until assignments exist; song request is one per household; RSVP reminders default to 3 auto-sends (6wk/3wk/3d before cutoff), adjustable in admin settings; bot/abuse protection is invisible CAPTCHA + rate-limiting/lockout + noindex + anomaly alerting (section 5); contact info is email and/or phone, guest's choice, collected either via self-service (4.3) or admin-entered upfront to enable outreach invites (4.4/4.2); household splitting, name aliases, admin proxy-entry, partial-save RSVPs, phone normalization, and cutoff buffer are all now in scope (sections 4.2, 4.5, 5, 7); Family Admin count is 4 (parents); v2 reveal date defaults to the day after the wedding, overridable (section 8); data retention defaults to 6 months post-wedding with an admin review prompt before anything is purged (section 7); RSVP cutoff date is admin-set (no hardcoded date), with a nudge to leave a buffer before any vendor deadline (section 4.9/7).

All v1 open questions are now resolved except:

- **Domain name — not yet chosen.** Needs to be picked and registered before launch; added as a pre-launch task in the milestones below.

## 10. Suggested Milestones

1. **Content & structure** — finalize page list, copy, wireframe layout (including wedding party, map/directions, local recommendations pages). Choose and register a domain name before launch (currently unresolved).
2. **Guest data model + admin guest-list UI** — households/guests schema (incl. email/phone fields, aliases, household-split support), add/edit UI for both admin roles, CSV import with preview/review step, thank-you-sent toggle, phone normalization on save.
3. **Address collection** — public name-lookup + disambiguation flow, address form (email and/or phone), mail-merge CSV export.
4. **Guest outreach** — email/SMS provider integration (with SPF/DKIM setup + SMS opt-out language), personalized-link generation, one-off + bulk send UI.
5. **RSVP core** — name-based lookup/disambiguation (phone or email fallback), RSVP submit/edit flow (incl. song request, partial-save, concurrent-edit check), RSVP dashboard, RSVP reminders (built on the outreach system from step 4), admin proxy-entry.
6. **Table/seating lookup** — admin assignment tool, guest-facing lookup (reuses RSVP lookup), seating chart export.
7. **Registry** — external link cards + cash-fund CRUD in admin (Full Admin only), public registry page.
8. **Browser extension** — scoped API token issuance, extension scraping + submit flow.
9. **Admin roles & auth** — Full Admin / Family Admin login, permission boundaries.
10. **Polish** — responsive QA, a11y pass, performance pass, backups configured, add-to-calendar button.
11. **Launch (address collection)** — go live early enough to leave mailing lead time.
12. **Launch (RSVP + registry)** — enabled once invites are physically sent, well ahead of guests' travel-booking window.
13. **(V2) Payment processing** — Stripe integration, auto progress bars, delayed-visibility purchase log for thank-you notes.
