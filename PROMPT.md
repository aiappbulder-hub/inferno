# INFERNO — Game Design Prompt

> A production-ready prompt for planning **INFERNO**: a 2D cinematic platformer
> that plays like *Another World* (1991) but tells no story of its own — it
> follows Dante's *Inferno* by the book, canto by canto, with Virgil as the
> player's guide, rendered in the pixel-art "Circles of Hell" metro style of
> the reference illustration.

---

## The Prompt

You are a veteran game designer. Plan a complete game design document for
**INFERNO**, a 2D cinematic platformer structured around the nine circles of
Hell from Dante's *Divine Comedy*.

**Scope of influences — keep them separate:**

- From ***Another World* (1991)** take ONLY the game concept, style, level
  design philosophy, and action set. Do **not** borrow its story, characters,
  or setting.
- From **Dante's *Inferno*** take the ENTIRE story. The game adapts the poem
  faithfully: same protagonist, same guide, same circles, same guardians, same
  encounters, same ending. No invented plot.
- From the **reference screenshot** take the art direction: Hell as a
  pixel-art cutaway of descending metro strata, with Virgil depicted as a
  station attendant who guides Dante from level to level.

### 1. Game concept (the Another World part)

A side-view cinematic platformer built on these rules:

1. **No HUD, no text, no dialogue.** Everything is communicated through
   animation, staging, and the environment. The only text in the game is one
   ribbon plaque naming each circle as its title card (like the "LIMBO" banner
   in the reference image).
2. **One camera, one art style.** Gameplay and cutscenes are continuous;
   cuts, zooms, and silhouetted wide shots are used like film editing, with no
   breaks within a level.
3. **Death is the teacher.** Deaths are frequent, fast, and fair; each one
   teaches a rule of the current circle. Instant restart at generous
   checkpoints (one per screen or set-piece).
4. **A fixed action set, recontextualized per level.** The player's verbs
   never grow — no inventory, no upgrades, no combat system:
   - **Walk / Run**
   - **Jump** (running and standing)
   - **Crouch / Crawl**
   - **Grab / Climb** (ledges, ladders, ropes, bodies)
   - **Use / Push / Pull** (levers, gates, boats, boulders)
   - **Follow / Signal Virgil** (a single context action to call or catch up
     to the guide)
   Each circle turns the same verbs against new physics: "run" fights the
   gale of Circle 2, "crawl" hides from Cerberus in Circle 3, "climb"
   descends Lucifer's body in Circle 9.
5. **Puzzle screens, not combat.** Threats are guardians, hazards, and the
   damned; Dante never fights. Progress means reading a screen, timing
   movement, positioning with Virgil, and manipulating the environment.

### 2. Story — by the book

The narrative is Dante's *Inferno*, adapted scene for scene and told without
words. The design document must map levels to the poem's actual events:

- **Prologue:** Dante lost in the dark wood, barred by the three beasts
  (leopard, lion, she-wolf) in an unwinnable chase sequence; Virgil appears
  and leads him to the Gate of Hell ("Abandon all hope" rendered as imagery,
  not readable text).
- **Virgil is the companion for the whole game** — depicted as a calm,
  uniformed **station attendant**: he punches tickets at each circle's
  threshold, negotiates with guardians (Charon, Minos, Plutus, Phlegyas, the
  Malebranche) in silent animated exchanges while Dante waits or hides, and
  physically helps Dante past obstacles, exactly as in the poem (carrying him,
  shielding his eyes from Medusa, arranging the ride on Geryon's back).
- **The famous encounters happen where the book puts them:** Charon's
  crossing of Acheron; Minos judging the damned; Cerberus; Plutus; the Styx
  and Phlegyas' ferry; the walls of Dis, the Furies, and the heaven-sent
  messenger who opens the gate; the Minotaur, Centaurs, the wood of suicides,
  and the burning sand; the flight down to Malebolge on Geryon; the ten
  bolgias and the Malebranche pursuit; the giant Antaeus lowering the pair to
  Cocytus; Lucifer at the center chewing Judas, Brutus, and Cassius.
- **Ending, as written:** Dante and Virgil climb down Lucifer's frozen body,
  gravity inverts at the center of the earth, and they emerge to see the
  stars — a single sunrise frame, no text.

### 3. Art direction — from the reference screenshot

- **World concept:** Hell as a **cutaway cross-section of descending metro
  strata** — each circle a layer beneath the platform above it, connected by
  escalators, stairwells, ventilation shafts, and tunnels that only go down.
- **Style:** chunky, readable pixel art (~32–48 px characters), flat color
  fields, dioramic side-view layers, minimal outlines.
- **Palette:** one dominant color per circle. Limbo keeps the warm
  brick-red/orange and teal of the reference; deeper circles shift — rose and
  smoke (Lust), sickly green rain (Gluttony), gold (Greed), mud brown
  (Wrath), iron red (Heresy), blood crimson (Violence), bone and tar (Fraud),
  blue-white ice (Treachery).
- **Tone:** deadpan and melancholy. The damned are ordinary modern figures —
  commuters, brides, monks, kissing couples — suffering the poem's exact
  punishments in mundane transit spaces. Guardians and monsters are the one
  scale-breaking element: Cerberus fills three tunnel mouths; Lucifer is the
  size of the final screen.

### 4. Levels — nine circles plus prologue

Each circle = one level (15–25 minutes): **one sin, one canonical guardian,
one hazard, one mechanical twist on the fixed verbs**. Complete this table in
the design document:

| Lvl | Circle    | Guardian / encounter (from the poem) | Environment (metro stratum)                    | Mechanical twist |
|-----|-----------|--------------------------------------|------------------------------------------------|------------------|
| 0   | Dark Wood & Gate | Three beasts; Charon at Acheron | Overgrown surface station at night; flooded turnstile hall as the Acheron crossing | Tutorial: all verbs; scripted unwinnable chase |
| 1   | Limbo     | Minos judging at the far exit        | Endless terminus platform; trains that never depart | Crowds of the damned block and reveal paths |
| 2   | Lust      | The eternal storm                    | Wind-torn ventilation shafts; souls blown past like paper | Gale physics alter every jump and landing |
| 3   | Gluttony  | Cerberus                             | Flooded, reeking concourse under black rain    | Crawl through filth to stay unseen; mud slows every verb |
| 4   | Greed     | Plutus; the boulder-rollers          | Vault caverns of hoarded cargo                 | Push/pull weights whose momentum can crush |
| 5   | Wrath     | Phlegyas' ferry across the Styx; walls of Dis, the Furies | Drowned parking levels; the Styx as black floodwater | Balance and stealth on the ferry; hide from the wrathful who grab at the hull |
| 6   | Heresy    | The burning tombs                    | An archive level of red-hot filing-cabinet sepulchers | Fire timing; light and darkness as the navigation puzzle |
| 7   | Violence  | Minotaur, Centaurs, the wood of suicides, raining fire; Geryon at the cliff | Boiling utility mains, a forest of dead wiring, burning sand | Chase set-pieces; end-of-level descent riding Geryon (scripted flight screen) |
| 8   | Fraud     | The Malebranche; the ten bolgias     | Ten collapsing sub-basements descended in sequence | Terrain that lies — false floors, mirrored rooms, pursued by the Malebranche |
| 9   | Treachery | Antaeus lowers the pair; Lucifer     | The frozen machine heart at the bottom of everything | Ice traction; final climb down Lucifer's body with the gravity flip |

### 5. Deliverables

1. **One-page concept** — logline, pillars, target platforms, scope estimate.
2. **Vertical-slice spec** — screen-by-screen breakdown of the Prologue and
   Circle 1: layouts, hazards, checkpoints, every death and what it teaches,
   and Virgil's first three silent interactions.
3. **Completed level table** — the table above with pacing, difficulty curve,
   and each circle's canonical encounter staged as a set-piece.
4. **Art & audio bible** — palette hex values per circle, sprite specs,
   animation priorities (rotoscoped-feel key poses for Dante and Virgil), and
   a music brief: sparse, diegetic sound, music only at circle-transition
   title cards.
5. **Risk list** — the three hardest design problems (wordless puzzle
   clarity, death-repetition fatigue, staging famous encounters readably in
   pixel scale) and a mitigation for each.

### 6. Constraints

- Solo-or-small-team scope: ~3–5 hours of gameplay, 2D, single resolution
  target, no procedural content.
- Faithfulness rule: if a scene isn't in the poem, it isn't in the game.
  Every set-piece must be traceable to a canto.
- Every screen must answer: *what kills me here, what does it teach, and
  which lines of the poem is it staging?* If a screen answers none, cut it.
