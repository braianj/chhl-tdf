# Shots on Target and Official Tiebreaks Implementation Plan

1. Add failing domain tests for period shots, totals, percentages, reconciliation, optional jersey numbers, the official tiebreak order, pending draws, and blocked final seeding.
2. Extend tournament types and pure utilities until the domain tests pass.
3. Add component tests for public shot statistics, player records, shared standings positions, and pending-draw messaging, then update the UI.
4. Add administration tests and controls for shot entry, numberless players, reconciliation warnings, and team draw order.
5. Add a Supabase migration that permits the new roster and team fields without weakening existing row-level policies.
6. Document the supplied paper forms and generate the revised shots-on-target PDF with an overtime column.
7. Run formatting-equivalent lint, typecheck, targeted tests, the full existing suite, and the production build through the machine queue. Render the built site and PDF, inspect screenshots, then push the feature branch and open a pull request.
