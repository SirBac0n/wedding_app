# Wedding Website — Requirements Document

**Status:** Draft v1
**Last updated:** 2026-08-25

## 1. Overview

A custom wedding website that informs guests about the event, collects RSVPs and meal preferences, lets guests find their household via a name + code lookup, and supports photo sharing before/after the wedding. The couple gets an admin dashboard to manage guests, RSVPs, and photo moderation.

**Scale:** 200+ guests / households.
**Timeline:** Wedding is several months out — no hard launch deadline, but RSVP and travel-planning content should be live well before travel-booking season for guests.

## 2. Goals & Non-Goals

**Goals**
- Single source of truth for event info (date, venues, schedule, travel, registry).
- Let every household RSVP without creating a full account.
- Track attendance, meal choices, and plus-ones accurately at 200+ guest scale.
- Let guests contribute and view photos.
- Give the couple an admin view to manage all of the above without touching code.

**Non-Goals (v1)**
- No payment processing (registry links out to external registries).
- No guest-to-guest messaging/social features.
- No native mobile app — responsive web only.
- No multi-language support (unless flagged as needed later).

## 3. User Roles

| Role | Access |
|---|---|
| Guest | Public site + name/code RSVP lookup + photo upload/view |
| Couple (Admin) | Full admin dashboard: guest list, RSVP status, meal counts, photo moderation, CSV import/export |
| (Optional) Wedding party / family helper | Limited admin — view-only or RSVP-entry-only, TBD if needed |

## 4. Functional Requirements

### 4.1 Public Site (Informational)
- Home / landing page (names, date, countdown)
- Our story (optional text/photo blurb)
- Event details: ceremony + reception venue, date/time, dress code
- Schedule / itinerary (multi-day if applicable — rehearsal dinner, welcome party, brunch)
- Travel & lodging: hotel blocks, airport info, transportation
- Registry: links out to external registry site(s)
- FAQ
- Contact (couple or wedding-party contact info)

### 4.2 RSVP Flow
- Guest lookup by **last name + unique household code** (code distributed on paper/digital invite).
- On match, show all household members tied to that invite (supports plus-ones and kids as pre-loaded entries, not guest-added).
- Per-guest: attending / not attending, meal choice (from a defined set of options, incl. dietary restriction free-text), song request (optional).
- Household-level: total headcount confirmation, notes/allergies free-text.
- Confirmation screen + confirmation email to the household (if email captured).
- Guests can return and **edit their RSVP** until a cutoff date (admin-configurable).
- Handle edge cases: code not found, name mismatch, already-responded (show current answers, allow edit).

### 4.3 Guest Photo Sharing
- Authenticated-by-invite-code guests can upload photos (pre- and post-wedding).
- Simple gallery view, newest first, maybe grouped by album/event (engagement, wedding day).
- Admin moderation queue: approve/hide before public display (spam/inappropriate content protection).
- Reasonable per-upload file size/type limits (images only, e.g. JPEG/PNG/HEIC, video out of scope for v1 unless requested).

### 4.4 Admin Dashboard
- Guest list management: add/edit/remove households and members, generate/reset invite codes.
- CSV import (initial guest list bulk load) and CSV export (for caterer/venue headcounts).
- RSVP dashboard: response rate, attending/not/no-response counts, meal-choice breakdown, dietary-restriction list.
- Photo moderation: approve/reject/delete uploads.
- Content editing: update event details/schedule/FAQ text without a code deploy (basic CMS-style editing for key text fields).
- Admin authentication (real login — email/password, this is the one role that needs proper auth).

## 5. Non-Functional Requirements

- **Responsive design** — majority of guests will access via mobile.
- **Performance** — fast load on mobile networks; optimize/compress uploaded photos.
- **Data privacy** — guest PII (names, dietary info, contact info) stored securely; no public exposure of the full guest list or other households' data. Guests only ever see their own household after code entry.
- **Reliability at scale** — must hold up under bursty traffic (e.g., right after invites go out, or around RSVP deadline).
- **Backups** — RSVP and guest data backed up; this data is irreplaceable if lost.
- **Accessibility** — reasonable a11y basics (contrast, alt text, keyboard nav) since guests span a wide age range.
- **Low ongoing cost** — this is a personal project; prefer free-tier-friendly hosting/DB for a few-hundred-guest scale.

## 6. Proposed Tech Stack (recommendation)

Given the scope (RSVP + auth-lite + photo upload + admin dashboard) and months-long runway with no need for enterprise scale:

- **Framework:** Next.js (React) — single codebase for public site + admin dashboard, good deployment story.
- **Hosting:** Vercel (or similar) — free/cheap tier comfortably covers this traffic scale.
- **Database:** Postgres (e.g., via a managed free-tier provider like Neon/Supabase) — relational fit for households/guests/RSVPs.
- **File storage:** S3-compatible object storage (or the DB provider's built-in storage, e.g., Supabase Storage) for guest-uploaded photos.
- **Admin auth:** Simple email/password or magic-link auth (e.g., Auth.js) — only needed for the couple's admin role, not guests.
- **Guest "auth":** Not real auth — server-side lookup against last name + household code, sets a session/cookie scoped to that household.

This keeps everything in one deployable app, avoids per-seat SaaS costs, and stays within free-tier limits at 200-300 guests.

## 7. Open Questions

- Do we need a rehearsal dinner / multi-event schedule, or is it just ceremony + reception?
- Should household emails be collected (for confirmation emails) — if so, at RSVP time or pre-loaded from the guest list import?
- Does the wedding party or family need limited admin access, or is admin couple-only?
- RSVP cutoff date — when should editing lock?
- Any content moderation concerns for photo uploads beyond basic approve/reject (e.g., report abuse)?
- Domain name — already owned, or need to pick one?

## 8. Suggested Milestones

1. **Content & structure** — finalize page list, copy, wireframe layout.
2. **RSVP core** — guest list data model, code lookup, RSVP submit/edit flow.
3. **Admin dashboard v1** — guest CRUD, CSV import/export, RSVP stats.
4. **Photo sharing** — upload, gallery, moderation queue.
5. **Polish** — responsive QA, a11y pass, performance pass, backups configured.
6. **Launch** — go live well ahead of guests' travel-booking window.
