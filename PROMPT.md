# INFERNO — Game Design Prompt

> A production-ready prompt for planning **INFERNO**: a 2D cinematic platformer
> that plays like *Another World* (1991) but tells no story of its own — it
> follows Dante's *Inferno* canto by canto, re-staged as a **modern subway
> descent**: Hell is the transit system under the city, Virgil is a station
> attendant, and every circle is a deeper, stranger line.

---

## The Prompt

You are a veteran game designer. Plan a complete game design document for
**INFERNO**, a 2D cinematic platformer structured around the nine circles of
Hell from Dante's *Divine Comedy*.

**Scope of influences — keep them separate:**

- From ***Another World* (1991)** take ONLY the game concept, style, level
  design philosophy, and action set. Do **not** borrow its story, characters,
  or setting.
- From **Dante's *Inferno*** take the STRUCTURE and EVENTS. Same protagonist,
  same guide, same circles, same guardians, same encounters, same ending. No
  invented plot.
- From the **reference screenshot** take the setting: the poem is translated
  into a **modern subway system**. Every canonical figure, punishment, and
  crossing gets a transit-world counterpart. The events are the poem's; the
  staging is the metro's.

### 1. Game concept (the Another World part)

A side-view cinematic platformer built on these rules:

1. **No HUD, no text, no dialogue.** Everything is communicated through
   animation, staging, and the environment. The only text in the game is
   diegetic transit signage — and one ribbon plaque naming each circle as its
   title card (like the "LIMBO" banner in the reference image).
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
   - **Grab / Climb** (ledges, ladders, cables, bodies)
   - **Use / Push / Pull** (levers, gates, carts, doors)
   - **Follow / Signal Virgil** (a single context action to call or catch up
     to the guide)
   Each circle turns the same verbs against new physics: "run" fights the
   tunnel gale of Circle 2, "crawl" hides from Cerberus in Circle 3, "climb"
   descends Lucifer's body in Circle 9.
5. **Puzzle screens, not combat.** Threats are guardians, hazards, and the
   damned; Dante never fights. Progress means reading a screen, timing
   movement, positioning with Virgil, and manipulating the environment.

### 2. Story — by the book, staged in the metro

The narrative is Dante's *Inferno*, adapted scene for scene and told without
words. **Dante is a modern man** — overcoat, tired eyes, "midway through
life" — who descends into a subway that keeps going down. The design document
must map levels to the poem's actual events, each with its transit staging:

- **Prologue:** the dark wood is the city at night — a shuttered, overgrown
  surface station at the edge of a park. The three beasts (leopard, lion,
  she-wolf) bar the way home in an unwinnable chase that drives Dante
  underground. **Virgil** finds him there: a calm, gray-uniformed **station
  attendant** from another era, lamp in hand. The Gate of Hell is a rusted
  service entrance; "Abandon all hope" flickers past on a broken departures
  board, gone before it can be read.
- **Virgil is the companion for the whole game.** He punches tickets at each
  circle's fare gate, and — exactly as in the poem — he does all the talking:
  silent animated negotiations with each guardian while Dante waits or hides.
  He physically helps Dante through (boosting him over barriers, carrying him
  when the poem says so, covering his eyes at Medusa, arranging the ride down
  on Geryon).
- **Every canonical encounter appears, in modern dress:**
  - **Charon** ferries the dead across the Acheron — a graveyard-shift
    conductor poling a flooded maintenance flat-car through a drowned tunnel,
    waving off Dante until Virgil shows a ticket that cannot be refused.
  - **Minos** judges at the end of Limbo's platform — a monstrous ticket
    inspector whose coiling tail is the queue barrier itself, wrapping around
    each soul the number of times of its assigned line.
  - **Cerberus** is a three-headed stray guarding the flooded food court;
    Virgil quiets it the way the poem does, with a fistful of muck.
  - **Plutus** presides over a cargo hold of hoarded freight; **Phlegyas**
    runs the Styx ferry across a drowned parking level; the **walls of Dis**
    are a sealed interchange whose gates only the heaven-sent messenger — a
    figure who walks the third rail unharmed — can open.
  - **Geryon**, fraud's beautiful monster, is the descent into Malebolge: a
    gleaming, friendly-faced funicular whose underside is all stingers and
    rot. The flight down is a single scripted screen.
  - **The Malebranche** are a demon track-work crew who escort and betray;
    **Antaeus** is the last of the giants standing in the deep shafts, and he
    lowers the pair to the bottom in his hand — the only elevator to Cocytus.
  - **Lucifer** waits at the frozen center: a colossal three-faced figure
    fused into the machine heart of the system, wings spinning the turbines
    that freeze the lake, chewing the three great traitors.
- **The damned are modern contrapasso.** Ordinary people, punished in transit
  terms: the lustful blown forever through wind tunnels chasing scattered
  letters; gluttons queuing under black rain at shuttered kiosks; hoarders and
  wasters shoving cargo carts against each other; the wrathful brawling in
  floodwater between parked cars; heretics sealed in burning archive cabinets;
  the violent boiled in steam mains; the fraudulent in ten collapsing
  sub-basements of offices and call floors; traitors frozen in the ice like
  bodies in a walk-in freezer.
- **Ending, as written:** Dante and Virgil climb down Lucifer's frozen body,
  gravity inverts at the center of the earth, and a final service ladder
  brings them up — out of a humble sidewalk grate, onto a quiet dawn street,
  to see the stars fade into sunrise. One frame. No text.

### 3. Art direction — from the reference screenshot

- **World concept:** Hell as a **cutaway cross-section of descending metro
  strata** — each circle a layer beneath the platform above it, connected by
  escalators, stairwells, ventilation shafts, and tunnels that only go down.
  Trains still run on every level; where they go is never shown.
- **Style:** chunky, readable pixel art (~32–48 px characters), flat color
  fields, dioramic side-view layers, minimal outlines.
- **Palette:** one dominant color per circle. Limbo keeps the warm
  brick-red/orange and teal of the reference; deeper circles shift — rose and
  smoke (Lust), sickly green rain (Gluttony), gold (Greed), mud brown
  (Wrath), iron red (Heresy), blood crimson (Violence), bone and tar (Fraud),
  blue-white ice (Treachery).
- **Tone:** deadpan and melancholy. The damned are ordinary modern figures —
  commuters, brides, monks, kissing couples — and Hell is bureaucratic before
  it is monstrous: fare gates, waiting rooms, service notices. Guardians and
  monsters are the one scale-breaking element: Cerberus fills three tunnel
  mouths; Lucifer is the size of the final screen.

### 4. Levels — nine circles plus prologue

Each circle = one level (15–25 minutes): **one sin, one canonical guardian in
modern dress, one hazard, one mechanical twist on the fixed verbs**. Complete
this table in the design document:

| Lvl | Circle    | Guardian / encounter (poem → metro)                     | Environment (metro stratum)                    | Mechanical twist |
|-----|-----------|---------------------------------------------------------|------------------------------------------------|------------------|
| 0   | Dark Wood & Gate | Three beasts; Charon as the graveyard-shift conductor | Shuttered surface station at night; flooded turnstile hall as the Acheron crossing | Tutorial: all verbs; scripted unwinnable chase |
| 1   | Limbo     | Minos, the ticket inspector whose tail is the queue barrier | Endless terminus platform; trains that never depart | Crowds of the damned block and reveal paths |
| 2   | Lust      | The eternal storm                                        | Wind-torn ventilation shafts; souls and letters blown past like paper | Tunnel-gale physics alter every jump and landing |
| 3   | Gluttony  | Cerberus, three-headed stray of the food court           | Flooded, reeking concourse under black rain    | Crawl through filth to stay unseen; mud slows every verb |
| 4   | Greed     | Plutus; hoarders and wasters ramming cargo carts         | Vault caverns of hoarded freight               | Push/pull weights whose momentum can crush |
| 5   | Wrath     | Phlegyas' ferry across the Styx; walls of Dis, the Furies | Drowned parking levels; the Styx as black floodwater | Balance and stealth on the ferry; hide from the wrathful who grab at the hull |
| 6   | Heresy    | The burning tombs                                        | An archive level of red-hot filing-cabinet sepulchers | Fire timing; light and darkness as the navigation puzzle |
| 7   | Violence  | Minotaur, Centaurs, the wood of suicides; Geryon the funicular at the cliff | Boiling steam mains, a forest of dead wiring, burning sand | Chase set-pieces; end-of-level scripted descent riding Geryon |
| 8   | Fraud     | The Malebranche track-work crew; the ten bolgias         | Ten collapsing sub-basements descended in sequence | Terrain that lies — false floors, mirrored rooms, pursued by the Malebranche |
| 9   | Treachery | Antaeus, the last giant, lowers the pair; Lucifer in the machine heart | The frozen core at the bottom of everything    | Ice traction; final climb down Lucifer's body with the gravity flip |

### 5. Deliverables

1. **One-page concept** — logline, pillars, target platforms, scope estimate.
2. **Vertical-slice spec** — screen-by-screen breakdown of the Prologue and
   Circle 1: layouts, hazards, checkpoints, every death and what it teaches,
   and Virgil's first three silent interactions.
3. **Completed level table** — the table above with pacing, difficulty curve,
   and each circle's canonical encounter staged as a set-piece.
4. **Art & audio bible** — palette hex values per circle, sprite specs,
   animation priorities (rotoscoped-feel key poses for Dante and Virgil), and
   a music brief: sparse, diegetic transit sound — rails, ventilation, distant
   announcements in no language — with music only at circle-transition title
   cards.
5. **Risk list** — the three hardest design problems (wordless puzzle
   clarity, death-repetition fatigue, staging famous encounters readably in
   pixel scale) and a mitigation for each.

### 6. Constraints

- Solo-or-small-team scope: ~3–5 hours of gameplay, 2D, single resolution
  target, no procedural content.
- Faithfulness rule: if a scene isn't in the poem, it isn't in the game.
  Every set-piece must be traceable to a canto — the modern staging changes
  how it looks, never what happens.
- Every screen must answer: *what kills me here, what does it teach, and
  which lines of the poem is it staging?* If a screen answers none, cut it.
