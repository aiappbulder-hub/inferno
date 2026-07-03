# INFERNO — Game Design Prompt

> An improved, production-ready prompt for planning a cinematic platformer based on
> Dante's Inferno, in the style of *Another World* (Eric Chahi, 1991), using the
> pixel-art "Circles of Hell" metro-station illustration as the art-direction anchor.

---

## The Prompt

You are a veteran game designer and creative director. Plan a complete game design
document for **INFERNO**, a 2D cinematic platformer in the tradition of
*Another World* (1991), *Flashback*, and *Limbo*, structured around the nine
circles of Hell from Dante's *Divine Comedy*.

### 1. Core fantasy

The player is **Dante** — not a medieval poet, but a modern commuter. Mid-life,
gray suit, briefcase. One evening his late train never surfaces: the metro keeps
descending, and the doors open onto Limbo. To return to the world above he must
descend through all nine circles, because in Hell the only way out is through
the bottom. He is guided by **Virgil**, a silent, flickering station attendant
who appears at platforms, punches his ticket, and points the way — the game's
Buddy/companion figure, mirroring the alien friend in *Another World*.

Opening title card (the only text in the game):
*"In the middle of the journey of our life, I came to myself, in a dark wood..."*

### 2. Design pillars — what "like Another World" actually means

Honor these five rules from the 1991 original; every mechanic must pass them:

1. **No HUD, no text, no dialogue.** All storytelling is environmental,
   animated, and diegetic. Health, danger, and objectives are communicated
   through animation and staging only.
2. **Cinematic continuity.** Gameplay and cutscenes share one camera and one
   art style; cuts, zooms, and silhouetted wide shots are used like film
   editing. No loading-screen breaks between scenes within a circle.
3. **Death is the teacher.** Deaths are frequent, fast, spectacular, and
   fair — each one teaches a rule of the current circle. Instant restart at
   generous checkpoints (one per screen or set-piece).
4. **One verb set, recontextualized.** Run, jump, crouch, grab, use. No
   inventory, no upgrades. Each circle re-uses the verbs against new physics
   (e.g., "run" against the gale of Circle 2, "crouch" under the ice wind of
   Circle 9).
5. **A wordless companion.** Virgil solves what Dante cannot and vice versa;
   their cooperation is choreographed, never menu-driven. The emotional arc of
   the game is their relationship.

### 3. Art direction — from the reference screenshot

The visual bible is the pixel-art "Circles of Hell" infographic: Hell as a
**cutaway cross-section of a modern city**, each circle a geological stratum
beneath a metro platform.

- **Style:** chunky, readable pixel art (roughly 32–48 px characters), flat
  color fields, minimal outlines, dioramic side-view layers.
- **Palette:** each circle owns one dominant color. Limbo is the warm
  brick-red/orange of the reference image with teal train accents; deeper
  circles shift — rose/smoke (Lust), sickly green rain (Gluttony), gold
  (Greed), mud brown (Wrath), iron red (Heresy), blood crimson (Violence),
  bone/tar (Fraud), blue-white ice (Treachery).
- **Tone:** deadpan, satirical, melancholy. Sinners are ordinary modern
  people — brides on escalators, monks on platforms, kissing couples,
  commuters asleep on benches. Hell is bureaucratic and mundane before it is
  monstrous.
- **Signage:** gothic banner plaques (like the "LIMBO" ribbon in the
  reference) are the only environmental text, naming each circle as a level
  title card.

### 4. Structure — nine circles, nine mechanics

Each circle = one level (15–25 minutes), defined by **one sin, one hazard, one
mechanical twist, one famous damned soul as a set-piece encounter**. Fill in
this table completely in the design document:

| # | Circle    | Environment (metro-stratum theme)                  | Signature mechanic |
|---|-----------|-----------------------------------------------------|--------------------|
| 1 | Limbo     | Endless terminus platform; trains that never leave  | Tutorial; crowds block/reveal paths |
| 2 | Lust      | Wind-torn ventilation shafts; paper storms          | Gale physics alter every jump |
| 3 | Gluttony  | Flooded food courts; acid rain from burst pipes     | Rising/falling filth tides, timed routes |
| 4 | Greed     | Bank-vault caverns; hoarded cargo crushing halls    | Pushable weights that attract sinners |
| 5 | Wrath     | Drowned parking levels, the Styx as black floodwater| Stealth vs. the wrathful; ferry crossing (Phlegyas) |
| 6 | Heresy    | Burning archive/server farm; tombs of filing cabinets| Fire timing, light/dark navigation |
| 7 | Violence  | Boiling utility mains; a forest of hanged marionettes| Chase set-pieces; the Minotaur boss |
| 8 | Fraud     | Ten collapsing sub-basements (the Malebolge) as a descending gauntlet | Terrain that lies — false floors, mirrored rooms |
| 9 | Treachery | The frozen machine heart of the city; Lucifer as a colossal, three-faced generator | Ice traction; climbing Lucifer's body to exit (as Dante did) |

### 5. Narrative beats to plan

- Virgil's introduction (Limbo), three cooperative set-pieces (circles 3, 5, 8),
  and his departure at the edge of Circle 9 — he cannot go further, and the
  player must face Treachery alone.
- Recurring silent motifs: Dante's briefcase (abandoned in Circle 4, in the
  hoard), his reflection aging in windows of passing ghost-trains, Beatrice
  glimpsed on opposite platforms as an unreachable figure in red.
- Ending: Dante climbs down Lucifer's frozen body, gravity inverts, and he
  emerges on an ordinary morning platform — *"and thence we came forth to see
  again the stars"* rendered as a single sunrise frame. No text.

### 6. Deliverables

Produce, in order:

1. **One-page concept** — logline, pillars, target platforms, scope estimate.
2. **Vertical-slice spec** — full breakdown of Circle 1 (Limbo) and Circle 2
   (Lust): screen-by-screen layouts, hazards, checkpoints, deaths, and the
   first Virgil encounter.
3. **Nine-circle progression table** — the table above, completed with pacing,
   difficulty curve, and the famous soul featured in each circle.
4. **Art & audio bible** — palette hex values per circle, character sprite
   specs, animation priorities (rotoscoped-feel key poses), and a music brief
   (sparse, diegetic sound; music only at circle transitions, as in
   *Another World*).
5. **Risk list** — the three hardest design problems (e.g., wordless puzzle
   clarity, death-repetition fatigue, boss readability in pixel scale) and a
   mitigation for each.

### 7. Constraints

- Solo-or-small-team scope: ~3–5 hours of gameplay, 2D, single resolution
  target, no procedural content.
- Rating target T/PEGI-16: stylized, satirical depiction of sin; no gore
  fetishism.
- Every screen must answer: *what kills me here, what does it teach, and what
  does it say about this sin?* If a screen answers none, cut it.

---

## Why this version of the prompt is better

The original prompt — *"plan a game like Another World 1991, use this
screenshot from Inferno, game called Inferno, it follows Dante's 9 circles"* —
named the influences but not the extractable rules. This version:

- **Decodes "like Another World"** into five testable design pillars (no HUD,
  cinematic continuity, death-as-teacher, fixed verb set, wordless companion)
  instead of leaving the reference to interpretation.
- **Decodes the screenshot** into an art direction (hell as a cutaway modern
  metro stratum, one dominant color per circle, satirical mundane sinners)
  rather than just "use this image."
- **Turns "9 circles" into structure**: one sin = one level = one mechanic =
  one set-piece, with a fill-in table that forces concrete decisions.
- **Specifies deliverables and constraints**, so the output is a scoped,
  buildable plan instead of an open-ended brainstorm.
