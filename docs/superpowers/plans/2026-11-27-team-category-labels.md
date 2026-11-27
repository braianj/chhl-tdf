# Team Category Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the uppercase age category to every tournament team name.

**Architecture:** Update the canonical JSON team documents so all current and future consumers receive unambiguous names. Record the idempotent update in a new Supabase migration and apply the same transformation to the live database.

**Tech Stack:** PostgreSQL, Supabase PostgREST, React application verification

**Spec:** `docs/superpowers/specs/2026-11-27-team-category-labels-design.md`

## Global Constraints

- Preserve all existing team IDs, categories, fixtures, results, and relationships.
- Use `<club name> <uppercase category>` for both `name` and `shortName`.
- Do not append a category twice when the migration is reapplied.

## Review Focus

- Every one of the ten team records is updated exactly once.
- Each suffix matches the record's own `category` value.
- Existing IDs remain unchanged so fixture references keep resolving.
- Reapplying the migration leaves names unchanged.
- Public and administrative views read the updated names without component changes.

---

### Task 1: Persist category-qualified team names

**Files:**
- Create: `supabase/migrations/20261127193000_team_category_labels.sql`

**Interfaces:**
- Consumes: `public.teams(id text, data jsonb)` and the existing `data.category`, `data.name`, and `data.shortName` fields.
- Produces: the same ten team documents with category-qualified `name` and `shortName` values.

- [x] **Step 1: Capture the current team snapshot**

Query all team IDs, categories, names, and short names. Assert that there are ten records, all IDs are unique, and none already end with a category suffix.

- [x] **Step 2: Add the idempotent migration**

Create one `update public.teams` statement that removes an existing matching category suffix if present, then appends `upper(data->>'category')` to both `name` and `shortName`. Keep every other JSON key unchanged.

- [x] **Step 3: Apply the same transformation to the live database**

Update only the ten existing team documents through the authenticated Supabase connection. Do not insert, delete, or change IDs.

- [x] **Step 4: Verify persisted data**

Query the live table again. Assert ten records, ten unchanged IDs, categories unchanged, both name fields ending in the matching uppercase category, and no duplicated suffixes.

- [x] **Step 5: Verify the user-visible result**

Open the deployed public site and confirm representative teams from H10, H12, and H14 display the qualified names in the selector and roster view.

- [x] **Step 6: Run repository checks**

Run `npm run lint`, `npm run typecheck`, `npm test -- --run`, and `npm run build` through the required build queue wrapper.

- [x] **Step 7: Commit and push**

Commit the migration and documentation with an English conventional commit, push the feature branch, and open a pull request against `main`.
