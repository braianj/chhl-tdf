# Shots on Target and Official Tiebreaks

## Source documents

The tournament uses two paper forms for the November 29, 2026 match day: the official match scoresheet and a separate shots-on-target control sheet. The match scoresheet records lineups, goals, assists, penalties, period results, overtime, shootouts, goalkeeper saves and goals against. The shot sheet records one mark for every shot that either becomes a goal or is saved; missed shots and shootout attempts do not count.

## Data model

Shots on target are stored on each `MatchRosterEntry` as `shotsPeriod1`, `shotsPeriod2`, and `shotsOvertime`. The match and tournament totals are derived. A roster jersey number is optional because some official team lists do not provide one. Goals remain match events and are not duplicated in the shot fields.

Player statistics derive `shotsOnTarget` and `shootingPercentage` from roster shots and goal events. Shooting percentage is unavailable when no shots were recorded and otherwise equals goals divided by shots on target. Player records show both tournament totals and per-match shots.

Goalkeeper shots faced remain derived from saves plus goals against. The administration panel compares the summed shooter shots for one team with the opposing goalkeeper totals. A mismatch is a visible warning, not a write blocker, because the paper may be incomplete and partial facts must remain publishable.

## Administration

The match roster form accepts a player without a jersey number and includes the three shot fields. Event entry supports selecting a player by name even when the player has no number. Lists and labels omit the number marker when it is absent.

## Official standings order

Teams tied on total points are ordered by:

1. Points earned in matches among the tied teams.
2. Goal difference in matches among the tied teams.
3. Overall goal difference.
4. Overall goals for.
5. Fewer overall goals against.
6. A manual draw order entered by an administrator.

If every sporting criterion is equal and a unique draw order is missing, tied teams share a position and carry a pending-draw state. Alphabetical order is only a stable display order and has no sporting meaning. A final cannot derive its participants while either qualifying position is pending a draw.

The draw order is stored as optional `Team.drawOrder`. The owner can edit it with the team name. Values only affect teams that remain tied after every sporting criterion.

## Paper output

The updated shots-on-target form contains player number, player name, first period, second period, overtime, and total columns. It retains the 15-match fixture and placeholder finalists. The repository documents the fields and counting rules; the generated PDF is verified visually page by page.
