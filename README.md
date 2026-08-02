# The Chronicler's Table

A character creator and rules reference for a simplified tabletop RPG ruleset — six attributes scored 0–3,
every mechanic resolved by looking up one small table instead of doing arithmetic at the table.

**Live:** https://hoodedhacker32.github.io/simple-dnd/
**Editor:** https://hoodedhacker32.github.io/simple-dnd/editor/

## Changing the game without touching code

The game lives in [`src/content/pack.json`](src/content/pack.json). The **DM Screen** editor at `/editor/`
edits that file through a UI — races, classes, the rules themselves, the fields a character records, and
the Codex prose.

The flow is:

1. Open the editor and enter the passphrase.
2. Edit whatever you like — stat spreads, lore, hit points, multiplier tables, dodge targets, which fields a
   character even has. Changes are kept in your browser as you go.
3. On the **Publish** tab, describe the change, paste a GitHub token, and press **Propose these changes**.
4. The editor commits to a new branch and opens a pull request. Review the diff on GitHub, then merge it.
5. Merging to `main` redeploys the site automatically.

Nothing you do in the editor touches the live game until that pull request is merged.

### The passphrase is not security

The site is static, so the passphrase check runs in the browser and the phrase is readable in the page
source. It stops casual wandering and nothing more. The real boundary is the GitHub token, which lives only
in the visitor's own tab and is never committed.

### The token

Use a **fine-grained** personal access token, scoped to *only* this repository, with `Contents: read and
write` and `Pull requests: read and write`. Do not use a classic token — a classic `repo`-scoped token would
give the page access to every repository you own. The editor keeps the token in `sessionStorage`, so it is
forgotten when the tab closes.

## Running it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173.

## Building for the web

```bash
npm run build
```

This produces a fully static `dist/` folder with no backend. To publish it:

- **Netlify** — drag `dist/` onto the Netlify dashboard, or connect the repo with build command `npm run build` and publish directory `dist`.
- **GitHub Pages** — push `dist/` to a `gh-pages` branch, or use a Pages action. If the site is served from a
  subpath (e.g. `user.github.io/repo/`), set `base: '/repo/'` in `vite.config.ts` first.
- **Vercel / Cloudflare Pages** — framework preset "Vite", no further config needed.

## What's in it

- **Character tab** — pick a race and a class, fill in the details the DM has defined (by default name, age,
  gender, pronouns, alignment and backstory), and get a finished sheet with every derived number already
  worked out (hit points, weapon access, movement range, bow range, stealth targets, dodge table, class
  ability effects).
- **Codex tab** — every rule table in the game with a plain-English explanation, plus race and class reference
  matrices.
- **Party panel** — characters are kept in browser storage so they survive a refresh. Save any character to a
  `.dndchar.json` file and load it back later.
- **Exports** — JSON save file, PNG, PDF, Word (`.docx`) and spreadsheet (`.xlsx`).

## Where the game data lives

All rules content is data, not code — editing these files is enough to change the game:

| File | Contains |
| --- | --- |
| `src/content/pack.json` | All races, classes and Codex prose — edited via the DM Screen |
| `src/content/schema.ts` | Validation for the pack, shared by the app and the editor |
| `src/data/rules.ts` | Re-exports pack content; holds no rules of its own |

`src/engine/statCalculator.ts` combines those into final stats. It is written around a swappable strategy:
`raceClass` (the current mode — final stats are simply race + class) and a `pointBuy` mode that is already
wired up but unused, so adding a point-allocation step later does not require rewriting the engine.

The Codex's lookup tables are **generated** from `mechanics` in the pack, so what a player reads can never
disagree with what the app calculates. Change a multiplier on the Rules tab and both the sheet and the Codex
follow.

## Known gaps

- **Class effects come from a fixed set of kinds.** A class can carry real mechanics (unarmed damage, bow
  range, spell power, movement, social rolls, stealth), each a table keyed to a stat. An effect of a
  genuinely new *shape* — one that does not fit any of those — still needs code in
  `src/engine/statCalculator.ts`. The Rogue's Detect Traps and Perceptive, and the Cleric's Word of Recall,
  are ability text for the DM to adjudicate rather than computed values.
- **The Ranger's Archer wording is inconsistent in the source rules.** The card says "+0.5 to your existing
  Dexterity modifier", but its own worked table lists Dexterity 1 as `1x` (0.75 + 0.5 would be 1.25). The
  explicit table is treated as authoritative and is now editable on the class's Effects list.
- **PSD export is not implemented.** It was scoped as an optional stretch item.

## How this relates to official D&D

The race and class blurbs describe traditional D&D lore, and the ages and lifespans follow the 5e
Player's Handbook.

**The stat system is this ruleset's own.** Six attributes scored 0–3 is an invention; D&D uses six
different abilities on a 1–20 scale. Nothing here is meant to be compatible with an official character
sheet.

**The paladin's broken oath is a DM ruling, not a departure.** The PHB deliberately leaves the consequence
to the DM, listing options up to abandoning the class or taking the DMG's Oathbreaker subclass. Losing the
divine power is squarely within that discretion, so Oath Broken losing its spellcasting is this table's
answer to a question the rules ask the DM to answer.

Aarakocra is spelled with two a's, per the Elemental Evil Player's Companion. Its internal id stays
`arakocra` because saved characters point at it.
