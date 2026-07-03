# INFERNO — Risk List

The three hardest design problems, with mitigations. Each has a named
kill-criterion: the playtest signal that tells us the mitigation failed and
the design must change, not the polish.

---

## Risk 1 — Wordless puzzle clarity

**Problem.** With no HUD, no text, and no dialogue, every puzzle must be
communicated by staging alone. One opaque screen doesn't just stall
progress — it breaks the fiction, because confusion in a wordless game reads
as the game's fault, not the player's. Fraud (Circle 8) deliberately makes
the environment lie, which doubles the danger: a level *about* misdirection
must still be fair.

**Mitigations.**
- **The three-read rule:** every screen must communicate, in order, (1) what
  kills, (2) what moves, (3) where the exit is — verified in grayscale
  thumbnail review before any screen gets final art. If a grayscale
  thumbnail can't be read, color and animation are not allowed to rescue it.
- **Telegraph vocabulary is global:** a hazard type telegraphs the same way
  in every circle (teeter = collapse, two-lights = train, shoulder-drop =
  lunge). Fraud is permitted to *re-skin* telegraphs, never to invert them —
  its lies live in level layout and signage, which the player has been
  taught to distrust by then.
- **Virgil as the hint system:** if the player dies 5+ times on one screen,
  Virgil's idle acting escalates — he looks toward the relevant element,
  walks partway, waits. Diegetic, optional, no popup. (Budgeted as an
  acting pass, not an afterthought.)
- **Kill-criterion:** in playtests, any screen where the median
  first-completion time exceeds 4 minutes or testers report "I didn't know
  what it wanted" gets redesigned at the layout level. No tooltip patches —
  the pillar is load-bearing.

## Risk 2 — Death-repetition fatigue

**Problem.** Death-as-teacher is the core loop, but the line between
"instructive" and "punishing" is thin. *Another World* got away with
brutality partly through novelty and brevity; at 3–5 hours with set-piece
choreography (Minos, the Malebranche pursuit, the Lucifer climb), repeated
long retries can curdle the tone from dread to irritation.

**Mitigations.**
- **The one-second contract:** death → desaturation beat → control restored
  in ≤ 1 second, checkpoint always on the same screen. This is an
  engineering requirement, tested in CI with a timing harness, not an
  aspiration.
- **Checkpoints per phase, not per set-piece:** Minos checkpoints at phase 3;
  the Geryon and Antaeus scripted descents are unfailable travel, never
  retried; the Lucifer climb checkpoints at the gravity flip.
- **Deaths must spend the player's time only once:** no re-watching Virgil
  negotiations — all threshold cutscenes are skip-on-respawn automatically.
- **Variety audit:** no two consecutive screens may kill with the same
  hazard class; enforced in the level-design spreadsheet before build.
- **Kill-criterion:** if per-screen retry counts in the 75th percentile
  exceed 8 on non-set-piece screens, the screen's lethality (not the
  checkpoint density) gets redesigned — moving checkpoints closer is
  treated as masking the problem, allowed only on set-pieces.

## Risk 3 — Staging famous encounters readably at pixel scale

**Problem.** The game's promise is the poem: Francesca, Farinata, Ulysses,
Ugolino, Lucifer — rendered in ~40 px characters with no words. Done badly,
the anthology of the damned becomes indistinct background NPCs and the
adaptation evaporates. The guardians have scale to lean on; the famous souls
are human-sized and must land through acting alone.

**Mitigations.**
- **One screen, one soul, one device:** each famous soul owns a full screen
  with a single bespoke storytelling device — Francesca's wind-shadow duet,
  Ciacco's direct look at camera, Farinata's waist-high disdain, Ulysses as
  a flame that leans and flickers through a story-shape, Ugolino in
  silhouette through the ice. The device, not the sprite, carries the
  identity. These screens are budgeted as cutscene-grade animation
  (Ulysses' flame is the single longest animation in the game, and is
  planned as such).
- **Camera privilege:** famous-soul screens are the only places the camera
  may push in past the standard framing — a deliberate grammar break the
  player learns to read as "this one matters."
- **Restraint rule as protection:** no reprises, no collectible-style
  "soul gallery," nothing that turns the damned into content. Scarcity is
  what keeps 40 pixels heavy.
- **External check:** two validation passes with testers who have never
  read the *Inferno* — they must be able to say what each famous-soul
  screen made them feel and what they think the figure's story was. We are
  adapting for them, not only for readers; if the Francesca screen doesn't
  land without the footnote, the staging (not the player) is wrong.
- **Kill-criterion:** any famous-soul screen that non-reader testers
  describe as "some NPCs" in two consecutive playtests is rebuilt around a
  new device or cut entirely — a missing canto is better than a mumbled one.
