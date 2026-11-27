# Team Category Labels Design

## Intent

Make teams with the same club name unambiguous by displaying the age category as part of every team name, for example `Dragones H14` and `CAU H10`.

## Constraints

- Preserve all existing team IDs, categories, fixtures, results, and relationships.
- Update both `name` and `shortName` for all ten tournament teams.
- Use the exact format `<club name> <uppercase category>`.
- Keep the database migration idempotent and retain the change in repository history.

## Approach

Update the canonical team documents rather than appending the category independently in each component. This makes every public and administrative view consistent without duplicating presentation logic. A display-only helper was rejected because stored team names would remain ambiguous in administration and future consumers.

## Verification

Confirm that all ten team documents retain their original IDs and categories, have names ending in their matching category, and appear correctly in the public team selector and roster view.
