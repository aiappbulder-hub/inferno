# INFERNO — Art & Audio Bible

**Style target: flat vector, in the spirit of the *Another World* 20th
Anniversary remaster.** Smooth flat polygon shapes, soft vertical gradients,
heavy silhouettes, rim light, **no outlines**. Chosen deliberately for a
solo hobby developer: flat shapes are fast to produce in any vector tool,
animate by transform rather than redraw, and scale to any resolution.

## 1. Global visual rules

- **Rendering:** resolution-independent vector (SVG or engine polygons),
  authored on a 16:9 stage (design coordinates 1280×720). Side-view
  dioramic screens; parallax limited to 3 layers (far stratum wall / play
  plane / foreground silhouette) so screens stay readable as single
  compositions.
- **Shape discipline:** no outlines, no texture fills. Forms are built from
  a few large flat polygons; detail comes from silhouette and one lit edge,
  never from interior drawing. Gradients are broad and vertical (walls,
  sky, water) — never on characters.
- **One dominant color per circle** (below). Within a circle, hue may not
  leave its family; contrast comes from value, not palette breadth. The
  *only* cross-circle constants: Virgil's uniform gray, Dante's coat, and
  the cream of transit signage — so the player's eye always finds the
  actors and the wayfinding first.
- **Scale-break rule:** everything human-sized except guardians. A guardian
  must break the screen's established scale the moment it appears (Cerberus
  fills three tunnel mouths; Minos's tail spans the hall; Lucifer *is* the
  final screen).
- **Signage** is the one sanctioned text surface: pictogram-first, cream on
  the circle color, austere letterspaced caps for circle title cards only.

## 2. Palette — one swatch card per circle

Values are the dominant field, the deep shadow, the accent, and the signage
cream (constant). Each circle ships as a 12-color ramp built from these.

| Circle | Dominant | Shadow | Accent | Notes |
|--------|----------|--------|--------|-------|
| Prologue | `#1A2418` night green | `#0D120C` | `#E8A33D` sodium lamp | The only level lit by the surface world |
| 1 Limbo | `#B33A26` brick red | `#6E1F12` | `#2E7F8C` teal (trains) | Matches the reference illustration |
| 2 Lust | `#C4788A` rose | `#5C3140` | `#D9D3C8` paper white | Paper/letters are the moving accent |
| 3 Gluttony | `#6B7F4A` sick green | `#3A452A` | `#1C1C1C` grease black | Rain reads black against green |
| 4 Greed | `#C9A227` gold | `#6E5713` | `#8C8C94` steel | Gold hoards, gray flesh |
| 5 Wrath | `#5C4632` mud brown | `#2E2218` | `#B33A26` brake-light red | Dis reads in Limbo's red — rhyme, corrupted |
| 6 Heresy | `#8C3B2E` iron red | `#3F1B14` | `#F2B441` tomb-glow | Light sources are the puzzle |
| 7 Violence | `#8F1D1D` blood crimson | `#420D0D` | `#E86A2B` fire | Hottest ramp in the game |
| 8 Fraud | `#B8AE96` bone | `#4A4436` | `#20201C` tar | Bright but wrong; the palette itself feels like a lie |
| 9 Treachery | `#BFD5DB` ice white-blue | `#5A7680` | `#12161A` machine black | Coldest ramp; near-monochrome |
| Stars ending | `#2B3A5C` pre-dawn | `#141B2B` | `#F2E3B3` sunrise | One screen, one gradient |
| Constants | — | — | `#EFE3C0` signage cream; `#6E6E73` Virgil gray; `#3A3F4A` Dante coat | Never re-tinted per circle |

## 3. Characters

### Dante
- **Size:** ~1/7 of screen height. Overcoat, loosened tie, tired posture —
  readable at one glance as *a man on his way home*. Built as a flat-shape
  cutout rig (head / torso / two arms / two legs as separate polygons) so
  animation is joint transforms, not frame-by-frame redraw.
- **Animation priorities (rotoscoped-feel key poses, in production order):**
  1. Run cycle (10 frames) — the game's signature motion; weight in the
     coat.
  2. Running jump / standing jump / land-stumble.
  3. Crouch-crawl cycle.
  4. Ledge grab → mantle (shared rig with climb).
  5. Deaths: swept, grabbed, fall, electrocution silhouette, freeze —
     each ≤ 20 frames, spectacular but instant.
  6. Contextual acting set: hesitate at edge, shield face, faint (used
     thrice: Acheron, Francesca, and the final grate climb-out exhaustion).

### Virgil
- **Size:** one head taller than Dante, always slightly ahead. Same cutout
  rig, shared skeleton.
- **Kit:** gray uniform, brass buttons, peaked cap (the crowd landmark),
  hand lamp, ticket punch. The *ticket* gets its own 2-frame glint so the
  threshold gag lands on every guardian.
- **Animation priorities:** walk-and-beckon; lamp raise; ticket
  presentation (one master, ten guardian-specific reaction holds); boost /
  carry / eye-shield assists; the Dis failure slump — his one broken-posture
  animation, budgeted like a boss.

### The damned (crowd system)
- A dozen civilian archetypes (commuter, bride, monk, kissing couple,
  tourist, child — reference-image cast), 3 palette-slots each so every
  circle re-dresses the same humanity in its own color. Crowd figures are
  near-silhouettes with one rim-lit edge; individuality comes from
  silhouette shape, not detail.

### Guardians
- Each guardian is a one-off rig sized to its screen, budgeted as
  mini-boss art: Charon (pole cycle, refusal head-shake), Minos (tail as a
  segmented spline — tech feature, not sprite), Cerberus (three
  independent head timelines), Geryon (façade smile layer / underside
  layer), Lucifer (three jaw cycles + wing turbine loop; built as
  background architecture with animated regions).

## 4. Effects & readability

- Hazard telegraphs are **animation-first, particle-second**: everything
  that can kill has a ≥ 12-frame telegraph unique to it.
- Water, fire-rain, gale streaks, and ice-sheen are shader-tinted screen
  layers, never palette exceptions.
- Deaths desaturate the screen for 6 frames, then instant respawn — the
  *Another World* rhythm: failure is a beat, not a scene.

## 5. Audio direction

**Principle: the subway is the score.** Diegetic sound carries every level;
composed music appears only at circle title cards and the finale.

- **Sound families per circle:** Prologue = surface night (traffic wash,
  wind in fences); Limbo = platform roomtone, idle motors, a PA that
  breathes but never speaks; Lust = tunnel gale as a pitched choir of duct
  resonances; Gluttony = rain on steel, wet queues; Greed = rolling stock,
  strained cables; Wrath = water slap in a concrete void, distant shouting
  blunted to rumble; Heresy = fire draw and cabinet tick (metal cooling);
  Violence = steam mains as percussion, the forest's electrical whine;
  Fraud = fluorescent hum, phones ringing on dead floors, structural
  groans; Treachery = wind, wing-turbine subharmonic at the threshold of
  hearing, ice creak. The mix thins as the system dies — by Circle 9,
  near-silence is the loudest thing in the game.
- **Announcements in no language:** a formant-synthesized PA voice, warm
  and procedural, phonemes from no real tongue. It is Limbo's comfort and
  Fraud's weapon (misleading chimes near lying signage).
- **Virgil's leitmotif** is not musical: it is the *ticket punch* — a
  bright, mechanical double-click, the same sample at every threshold. The
  game's most repeated sound; by Circle 9 it means safety.
- **Title-card music:** one composer, one rule — each circle's cue is a
  variation of the same 8-bar theme in that circle's mode/tempo, ≤ 25
  seconds, solo or duo instrumentation (the *Another World* economy).
  The finale reprises the theme in full for the only time, over the stars.
- **Death sting:** none. Silence and the desaturation frame. Respawn brings
  the roomtone back — the world resuming is the punishment.
