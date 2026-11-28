# CHHL TDF

Public fixture, standings, rosters and statistics for the Tierra del Fuego provincial inline hockey tournament. The November 29, 2026 fixture includes 12 round-robin games and one final each for H10, H12 and H14.

## Development

Run `npm ci` and `npm run dev`. Use `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` to connect to project `bahbxcwpkqpmdjwdshot`. Without a key the app renders its empty state.

## Deployment

GitHub Actions publishes `main` to [GitHub Pages](https://braianj.github.io/chhl-tdf/). The build gets its public key from the repository variable `SUPABASE_PUBLISHABLE_KEY`. Apply the SQL migrations in order when setting up a new database.

The administration panel uses Supabase Auth with Google. Enable the Google provider in that project and allow `https://braianj.github.io/chhl-tdf/?admin=1` in the Supabase redirect URL configuration. Database policies authorize confirmed accounts with an owner or editor role. The founding owner is defined in the schema migration.

Scoring, the official tiebreak order, the schedule, age groups, duration and final format follow the tournament material. A tie that reaches the final draw criterion stays visibly pending until an owner records the draw order; finals are not seeded from an unresolved table.

Shots on target are loaded per player and period from the separate control sheet. Tournament totals and shooting percentages are derived, and the administration panel compares each team total with the opposing goalkeeper's saves plus goals against. See [docs/forms-2026.md](docs/forms-2026.md) for the paper-to-data rules and use `npm run generate:shots-sheet -- matches.json teams.json players.json output.html` to regenerate the printable form before printing it to PDF.
