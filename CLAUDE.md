# Güorld Coin — CLAUDE.md

## What is this project?

**Güorld Coin** is a phygital experience platform where physical coins with NFC tags travel the world, accumulating stories from different "Keepers." Each coin has a permanent digital identity — a public page that shows its full journey: every person, every location, every story.

The coin is never owned. It's passed. But once you're a Keeper, you're part of it forever.

- **Website & app:** `guorld.com` (single domain — no subdomain split)
- **Repo:** `crossfer/guorld`

---

## Core Concept

- A physical coin embeds an NFC tag (NTAG215)
- Tapping the coin opens `guorld.com/coin/:slug` — no app required
- The current Keeper adds their story (text + photo + GPS location)
- The coin is then passed to the next person
- All past Keepers stay connected — they receive notifications as the coin keeps traveling
- The business model is community + brand partnerships, not paywalls

---

## The "Keeper" Model

- Users are **Keepers**, not owners
- Passing the coin = the highest-status moment (generates the best shareable content)
- Keeping it too long = gentle social pressure (days held counter, avg comparison)
- Past Keepers stay engaged via notifications ("The coin you passed just reached Tokyo 🇯🇵")
- Every Keeper has a permanent profile showing their history with all coins they've held

---

## Monetization Strategy

- **Free forever** — zero friction, maximum adoption
- **Community & audience** is the asset
- Revenue comes from: sponsored posts, newsletter sponsorships, branded coins (airlines, hotels, hostels), influencer collabs
- No paywalls on core features — growth > revenue in early stage

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend / DB | Supabase (Postgres + RLS + Storage) |
| Photo Storage | Supabase Storage |
| Auth | Supabase Auth (magic link or anonymous) |
| Deployment | Vercel |
| NFC Tags | NTAG215 (programmed with NFC Tools app) |
| Maps | Mapbox GL JS or Leaflet |

---

## Database Schema

```sql
-- Physical coins
coins (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,       -- used in URL: /coin/ABC123
  name         text,                        -- e.g. "Güorld Coin #001"
  created_at   timestamptz DEFAULT now(),
  total_km     numeric DEFAULT 0,           -- updated on each new entry
  is_active    boolean DEFAULT true
)

-- Each story left by a Keeper
entries (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id        uuid REFERENCES coins(id) ON DELETE CASCADE,
  keeper_id      uuid REFERENCES keepers(id),
  story          text,
  photo_url      text,                      -- Supabase Storage URL
  lat            numeric,
  lng            numeric,
  location_name  text,                      -- e.g. "Budapest, Hungary"
  days_held      integer,                   -- days this keeper held the coin
  created_at     timestamptz DEFAULT now()
)

-- Keeper profiles (persist across coins)
keepers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name   text,
  instagram      text,
  email          text,                      -- for notifications
  total_km       numeric DEFAULT 0,         -- km generated across all coins
  created_at     timestamptz DEFAULT now()
)

-- Tracks who has held which coin and when
coin_keepers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id        uuid REFERENCES coins(id),
  keeper_id      uuid REFERENCES keepers(id),
  received_at    timestamptz DEFAULT now(),
  passed_at      timestamptz,               -- null = current keeper
  days_held      integer                    -- calculated on pass
)
```

---

## App Routes

```
/                        → Landing / global map of all active coins
/coin/:slug              → Public coin page: map + timeline of all entries
/coin/:slug/add          → Add your story as new Keeper
/coin/:slug/pass         → Handoff screen — pass coin to next Keeper
/keeper/:id              → Public Keeper profile
/admin                   → Superadmin dashboard (all coins, all keepers)
```

---

## Key UX Principles

1. **Tap → story in under 60 seconds** — the add flow must be minimal
2. **Every action generates a shareable card** — optimized for Instagram Stories
3. **The map is the hero** — always show where the coin has been
4. **Gentle pressure, never shame** — days held counter is informational, not punitive
5. **Past Keepers stay alive** — notifications keep them engaged long after passing

---

## Shareable Content Strategy

- On entry submission → auto-generate a share card: photo + location + coin stats
- On handoff → generate a "I was Keeper #N" card
- On milestones → "This coin just crossed 10,000 km" auto-post
- Always prompt to tag @guorldcoin and use #GüorldCoin + #GüorldCoin[slug]

---

## Instagram / Community Growth Loop

```
Keeper leaves story on guorld.com
        ↓
Supabase webhook → n8n → Claude API (content agent)
        ↓
Agent reads full coin history from guorld.com/coin/:slug
Generates caption, tone, hashtags, detects milestones
        ↓
n8n → Instagram Graph API → auto-post to @guorldcoin
        ↓
Followers see post → visit guorld.com/coin/:slug
        ↓
New people discover → want their own coin →
community grows → brands pay to reach audience
```

**Each coin has its own hashtag:** `#GüorldCoin007`
Followers can follow the hashtag to track a specific coin natively in Instagram — no app, no email, pure Instagram behavior.

---

## Notification Channels

| Channel | How | When |
|---|---|---|
| Instagram | Auto-post to @guorldcoin | Every new entry |
| Email | Resend / Postmark | New entry on coins you've held |
| WhatsApp | n8n + Kapso (same as PickyMenu) | New entry on coins you've held |
| Push (PWA) | Web Push API | Android native; iPhone only if installed |

**At story submission, Keeper chooses:**
```
How do you want to follow your coin's journey?
📧 Email  |  💬 WhatsApp  |  🔔 Both
```

**Notification triggers:**
- New story on a coin you've held
- Coin crossed km milestone (1k, 5k, 10k...)
- Coin reached a new country or continent
- Keeper #N milestone (10th, 25th, 50th...)
- Coin has been stationary too long → nudge to current Keeper only

---

## AI Content Agent (Instagram)

The agent is the social media manager of @guorldcoin. It reads the full coin history and writes posts like a thoughtful human — not a template filler.

**Stack:** Supabase webhook → n8n → Anthropic API (Claude Haiku) → Instagram Graph API

**What the agent detects automatically:**
- 🌍 First time in a new continent
- 🎯 Round keeper number (10th, 25th, 50th...)
- 📏 Km milestones
- 🌐 Country count milestones
- ⏱️ Fastest / longest keeper
- 💬 Especially emotional story → gives it more prominence

**System prompt:**
```
You are the social media voice of Güorld Coin — a platform where
physical coins travel the world collecting human stories.
Write Instagram posts when a coin gets a new entry.
Rules:
- Write like a thoughtful human, not a bot
- Vary tone: sometimes poetic, sometimes playful, sometimes moving
- Always include km traveled and keeper count
- Max 3 relevant hashtags + #GüorldCoin + #GüorldCoin[slug]
- If something special happened (milestone, new continent,
  emotional story), lead with that
- Never use corporate language
- The coin has a voice — it's been places, it has seen things
```

**Cost:** ~$0.001–0.005 USD per post. Negligible.

---

## Meta / Instagram Requirements

- Meta Business Account (pending creation)
- Instagram Graph API (post photos and reels)
- n8n has native Instagram node ✅
- Cost: free within API limits

---

## Audience & Permissions

| Action | Spectator | Past Keeper | Active Keeper |
|---|---|---|---|
| View stories and photos | ✅ | ✅ | ✅ |
| View map and route | ✅ | ✅ | ✅ |
| Read Story So Far (AI) | ✅ | ✅ | ✅ |
| Follow coin (notifications) | ✅ opt-in | ✅ auto | ✅ auto |
| Leave a story | ❌ | ❌ | ✅ |
| Pass the coin | ❌ | ❌ | ✅ |

**Spectator conversion CTA** (bottom of every coin page):
> *"Want your own coin to start its journey?"* → `[Join the waitlist]`

---

## AI Translation Layer

Every story is saved in its original language — always. On display, the reader's browser language is detected and a translation is served automatically. Original language always available via toggle.

**Additional:** A "Story So Far" narrative is generated by Claude after each new entry — written in first person as if the coin is telling its own story.

```sql
-- Translations per entry
entries_translations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id    uuid REFERENCES entries(id),
  language    text,        -- 'en', 'es', 'fr', 'ja', etc.
  story       text,
  created_at  timestamptz DEFAULT now()
)

-- Add to coins table:
ALTER TABLE coins ADD COLUMN story_so_far text;
ALTER TABLE coins ADD COLUMN story_so_far_updated_at timestamptz;
```

**Story So Far prompt:**
```
You are the voice of a physical coin that travels the world.
Given the following entries left by Keepers, write a vivid
2-3 paragraph narrative of this coin's journey so far.
Write in first person present tense, as if the coin is telling its story.
Be poetic but concise. Mention real places and real emotions.

Entries (chronological): {entries}
Total distance: {total_km} km | Keepers: {keeper_count}
```

**Translation cost:** ~$0.001 USD per story. Negligible.

---

Use the **Haversine formula** to calculate km between consecutive entries.
Update `coins.total_km` and `keepers.total_km` on each new entry.

```typescript
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

---

## Commit Convention

```
feat: description
fix: description
chore: description
```

---

## Dev Preferences

- Complete file replacements over partial diffs
- Simplest viable solution first — complexity only when needed
- Explain tradeoffs before implementing
- All code and UI in English
- HTTP Request nodes over Supabase nodes in n8n (if applicable)
- VS Code + Claude Code for implementation, Claude Chat for architecture/SQL/prompts
