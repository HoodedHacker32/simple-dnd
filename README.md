# The Chronicler's Table

A character creator and rules reference for a simplified tabletop RPG ruleset — six attributes scored 0–3,
every mechanic resolved by looking up one small table instead of doing arithmetic at the table.

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

- **Character tab** — pick a race and a class, fill in name/age/gender/pronouns/alignment/backstory, and get a
  finished sheet with every derived number already worked out (hit points, weapon access, movement range, bow
  range, stealth targets, dodge table, class ability text).
- **Codex tab** — every rule table in the game with a plain-English explanation, plus race and class reference
  matrices.
- **Party panel** — characters are kept in browser storage so they survive a refresh. Save any character to a
  `.dndchar.json` file and load it back later.
- **Exports** — JSON save file, PNG, PDF, Word (`.docx`) and spreadsheet (`.xlsx`).

## Where the game data lives

All rules content is data, not code — editing these files is enough to change the game:

| File | Contains |
| --- | --- |
| `src/data/races.ts` | Race stat modifiers, lore text, typical age and lifespan |
| `src/data/classes.ts` | Class stat modifiers, ability text, lore, oath-state links |
| `src/data/rules.ts` | Every lookup table, and the constants the engine reads |

`src/engine/statCalculator.ts` combines those into final stats. It is written around a swappable strategy:
`raceClass` (the current mode — final stats are simply race + class) and a `pointBuy` mode that is already
wired up but unused, so adding a point-allocation step later does not require rewriting the engine.

## Known gaps

- **Rogue is a placeholder.** Its card is visible but locked, because the stat block has not been designed
  yet. Fill in `modifiers` and `abilities` in `src/data/classes.ts` and delete the `placeholder` flag to
  enable it.
- **The Ranger's Archer wording is inconsistent in the source rules.** The card says "+0.5 to your existing
  Dexterity modifier", but its own worked table lists Dexterity 1 as `1x` (0.75 + 0.5 would be 1.25). The
  explicit table is treated as authoritative; see the comment in `src/engine/statCalculator.ts`.
- **PSD export is not implemented.** It was scoped as an optional stretch item.
