# Trackboxd — Daily Game Ideas

## Design rules (all games must satisfy)

1. **No login wall.** The game opens and plays. Anonymous by default. An account is
   offered, never required, and never before the player has something worth saving.
2. **No personalization.** Everyone gets the same puzzle on the same day. No lanes,
   no `user_interests`, no taste-based selection. One puzzle, one shared conversation.
3. **Objective right/wrong.** No crowd-relative scoring, no leaderboards, no rarity
   percentages. The platform doesn't have the player volume to make a percentage
   meaningful — a "2% pick" over 11 players is noise. Revisit only above ~200 daily
   players.
4. **Auto-generated daily**, deterministic from `hash(date)`, zero admin intervention.
5. No audio: Spotify returns `null` for `preview_url` on apps created after Nov 2024,
   and `audio-features` / `recommendations` / `related-artists` are deprecated.
6. One puzzle per day, no public archive. Spoiler-free share string designed before
   any game code. Visible streak, stored in `localStorage` for anonymous players.
7. A `daily_puzzle` table for anti-repeat and for caching generated puzzles
   (generate on a nightly cron, never on first request).

---

# Tier 1 — build these

## Tracklist ⭐ recommended first build

### Mechanic
An album's tracks, shuffled. Put them back in running order.

```
Album cover shown. 8 tracks, shuffled:

  [ Ivy ]  [ Nikes ]  [ Pink + White ]  [ Solo ]  ...

Guess 1 →  🟩⬜🟨⬜🟩⬜⬜🟨
```

Per-position feedback in Wordle's visual language: 🟩 correct position,
🟨 in the wrong position but adjacent to correct (±1), ⬜ wrong. Four attempts.

Album sequencing is the most album-brained thing a music app could possibly test,
and album-oriented listening *is* the culture of a Letterboxd-for-music. This is the
best fit of anything here for what Trackboxd is.

### Data
`spotify_items` for the album + one `GET /albums/{id}/tracks` call. `track_number`
is the answer key. `cover_url` is already stored. Nothing else needed.

### Daily generation
1. Seeded pick from albums with `popularity >= 55` and 6–10 tracks
   (over 10 is tedious to drag; under 6 is trivially guessable).
2. Exclude compilations, greatest-hits, live albums, and anything where
   `album_type != 'album'` — sequencing is meaningless there.
3. Fisher-Yates shuffle with the daily seed; reject and reshuffle if any track lands
   in its correct position (a free 🟩 on turn one deflates it).
4. Store the shuffled order + answer key in `daily_puzzle`.

### Difficulty control
Track count and album popularity are the two dials. Optional easy mode: show each
track's `duration_ms`, which gives real signal (interludes are short and usually
sit mid-record; closers run long).

### Share
```
Tracklist #12  ★★★☆
🟩⬜🟨⬜🟩⬜⬜🟨
🟩🟩🟨⬜🟩🟨⬜🟩
🟩🟩🟩🟩🟩🟩🟩🟩
```
Stars = attempts remaining. The grid shows the shape of the solve without leaking
the album.

### Risks
- Drag-and-drop on mobile has to be genuinely good or the game is unplayable. This
  is the main build risk and it's a UI risk, not a logic risk. Budget for it.
- Deluxe/regional editions have different tracklists — always pin a specific album ID
  and a specific market, and store the resolved tracklist rather than refetching.

---

## Deep Cut (objective rework)

### Mechanic
One artist per day. **Name 5 tracks by them that are not in their top 10 most
popular.** Every pick is instantly right or wrong — verified against Spotify's own
popularity ranking, not against other players.

```
Today: Pusha T                        outside the top 10

  Nosetalgia            ✗  (their #4)
  Blocka                ✓
  Trouble on My Mind    ✓
  ...
```

This is the original Deep Cut concept — rewarding knowledge past the hits — with the
crowd-rarity scoring replaced by a fixed, verifiable threshold. It works with a
single player.

### Data
`GET /artists/{id}/top-tracks` gives the excluded set. `GET /artists/{id}/albums` →
album tracks gives the valid pool. Cache the whole resolved pool in `daily_puzzle`;
it's one build at generation time and zero API calls at play time.

### Daily generation
1. Candidate artists: appear in `spotify_items`, have ≥ 25 tracks in catalog, and
   have `popularity >= 60` — the artist must be *widely known* even though the
   answers are obscure. This is the whole balance of the game.
2. Seeded pick. Store top-10 exclusion set + full valid-track set.
3. Anti-repeat over a 180-day window.

### The unknown-artist problem
Without lanes, some players will get an artist they've never heard of. Accept it and
soften it rather than solving it:

- **Discovery mode** — a browse-the-discography fallback. You see album covers and
  tracklists and pick 5 by instinct. It doesn't count as a win, but the streak
  survives and you end the day having found music. On a music discovery app that's
  arguably the better outcome. Add a "log it" button straight into a review/like.
- **Partial credit is a real result.** 3/5 is a score, not a failure. All-or-nothing
  is what makes people bail at an unfamiliar name.
- **Streak insurance** — one miss per week doesn't break the streak.
- **Measured demotion** — log start→finish rate per artist, auto-demote anyone under
  ~40%. The system learns the actual audience within a couple of months, which beats
  any upfront guess about who is "well known enough."

### Share
```
Deep Cut #142  4/5
🟩🟩⬜🟩🟩
```

### Risks
- **Popularity ranking drifts.** A track that was #11 at generation time can be #9 by
  evening, silently turning a correct answer wrong mid-day. Freeze the exclusion set
  at generation time and validate against the frozen snapshot, always.
- Title matching needs fuzzy resolution: remixes, remasters, `- Live`, feature
  suffixes, and "Pt. 2" vs "Part 2" all have to resolve to the right track or the
  game feels broken and unfair.

---

## The Thread

Already satisfies every rule — objective, identical for everyone, no login, and par
is a fixed target rather than a leaderboard position. The only change from the earlier
draft: **drop path-rarity scoring**, keep hops-vs-par.

### Mechanic
Two artists per day, a start and an end. Connect them in as few hops as possible,
where a hop is a shared credit — a feature or collaboration. Player types artist
names; each valid link locks in and advances the chain.

> Kendrick Lamar → ? → ? → ? → Phoebe Bridgers  (par: 4)

Publishing the BFS-optimal par lets players race the optimum rather than just finish.

### Data
Free — every track object returns an `artists[]` array. Any track with
`artists.length > 1` is an edge between every pair in it.

- Nodes: artists in `spotify_items`, plus artists one hop out.
- Edges: co-credit on any track, unweighted.
- Materialize as `artist_edges (artist_a, artist_b, via_track_id)`, rebuilt nightly,
  pairs deduped by sorting the two IDs.

### Daily generation
1. Take the largest connected component.
2. Seeded pick of a start node with degree ≥ 5.
3. BFS from start; collect nodes at exactly distance 3–5.
4. Seeded pick of an end node from that set, preferring higher-degree nodes.
5. Store `par = distance`. Solvability guaranteed by construction.

### Share
```
The Thread #88
Kendrick → Phoebe Bridgers
🔗🔗🔗 3 hops (par 4) −1
```

### Risks
- **Graph density is uneven.** Hip-hop and pop are richly connected; ambient,
  classical, metal and most non-Western catalogs are sparse. Mitigation: minimum
  degree threshold on start/end, and verify no node on the shortest path has
  degree < 3.
- **Adjacency to BandToBand.io.** Differentiators available: par-racing, and using
  producer/writer credits as edges instead of just performer features — a genuinely
  different and more interesting graph ("everything routes through Jack Antonoff").
  Needs a credits source beyond Spotify; MusicBrainz is the candidate.
- Needs solid artist-name autocomplete with alias handling or it dies on typos.

---

# Tier 2 — good, more build cost or more risk

## Odd One Out

### Mechanic
Five tracks. Four share a hidden property; one doesn't. Find the impostor, then name
the rule from a set of options. Two-stage answer, both objectively checkable.

```
  Bohemian Rhapsody · Stairway to Heaven · Free Bird
  Hotel California  · Smells Like Teen Spirit

  impostor: ______        rule: ______
```

The second stage is what makes it a real puzzle rather than a coin flip — and
revealing the rule teaches the player something, which suits a discovery product.

### Daily generation
1. Seeded pick a rule from the pool: same release year, same decade, over 6 minutes,
   same producer, debut singles, same album, all feature the same artist, same
   `genres[]` tag.
2. Sample 4 tracks satisfying it, 1 violating it.
3. **The critical step — verify uniqueness.** Cross-check every other rule in the
   pool against the 5 chosen tracks. If any *other* rule also isolates a single
   different track, the puzzle has two defensible answers. Reject and reroll.

### Risks
- Step 3 is the whole game and it's easy to get wrong. A puzzle with two valid
  answers is worse than no puzzle — it reads as broken and it's the fastest way to
  lose trust in a daily. Over-invest here.
- Rule pool needs to be wide or players learn the rules and the game collapses into
  pattern-matching the format instead of the music.

---

## Crate (objective rework)

### Mechanic
3×3 grid, three row and three column constraints. Fill each cell with a track or
album satisfying both. **Score is simply how many of the 9 you fill validly** — no
rarity, no comparison. 9/9 is the win condition.

```
                UK artist    Released 1990s   Over 6 minutes
  Shoegaze          ·              ·                ·
  Debut album       ·              ·                ·
  Rated 4.5+ here   ·              ·                ·
```

### Constraint pool
All available in `spotify_items` or one Spotify call away: `genres[]`, release decade,
`duration_ms`, `popularity` band, `avg_rating`, `like_count`, artist market,
solo vs band, debut album, title track, closing track.

The Trackboxd-native ones (`avg_rating >= 4.5`, `like_count`) are worth leaning on —
no other grid game can offer them, and they quietly teach players the ratings layer
exists.

### Daily generation
1. Seeded pick 3 row + 3 col constraints, with a category-collision rule (no two
   decade constraints, etc.).
2. Count valid answers for each of the 9 intersections.
3. Reject the whole grid if any cell has < ~15 valid answers. Reroll on the next seed
   increment. Budget for 20+ rerolls; run nightly, never on request.
4. Cache the grid plus per-cell valid-answer sets for fast play-time validation.

### Risks
- **Format is Immaculate Grid's**, unmodified — least original here.
- Validation is the real work: "Loveless" must resolve to a specific album ID and
  check against two constraints. Needs fuzzy resolution plus disambiguation UI.
- Without rarity scoring it loses its best quality — the taste-portrait. It becomes
  a competence test rather than an expression. **Consider holding Crate until player
  volume supports rarity**, since that was the point of it.

### Cadence
Suits a weekly rather than daily slot — generation cost is high and the "I want to
sit and think" pace fits 7 days.

---

# Tier 3 — cheap, filler, or bonus rounds

## Cover Story
Album art zoomed to a few pixels, zooming out on each wrong guess. Six attempts.
`cover_url` is already stored, so this is close to free to build and generates
infinitely. Objectively right/wrong, no login, no personalization.

Downside: it's Framed's mechanic applied to album art, so it's the least original
thing on this list. Value is that it's a weekend build and extremely visual — good
as a secondary game or a warm-up round attached to a bigger one.

## Discography
Six album covers by one artist, put them in chronological release order. Same
feedback grammar as Tracklist, much easier to solve (people know eras even when they
don't know tracklists), and it reuses Tracklist's entire drag-and-drop UI.

Best used as **Tracklist's easy mode** rather than a separate game.

## Feature Check
Given a track with multiple credited artists, name all the features. Free from
`artists[]`. Too thin to stand alone; fine as a 20-second bonus round.

---

# Recommendation

Build **Tracklist** first. Smallest defensible build, no crowd needed, works on day
one with a single player, most on-brand for an album-culture product, and the share
grid writes itself. **Deep Cut (objective)** second — it's the most distinctive idea
and the popularity-threshold rework makes it viable at current scale. **The Thread**
third, once the `artist_edges` table is worth maintaining.

Hold **Crate** until rarity scoring is viable; without it, it's a worse version of
itself.
