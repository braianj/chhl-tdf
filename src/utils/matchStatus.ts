import type { Match, MatchStatus } from '../types/tournament'

// How the game is actually played.
export const REGULATION_PERIODS = 2
export const PERIOD_MINUTES = 10
export const OVERTIME_MINUTES = 5
export const TIMEOUTS_PER_TEAM = 1
// The clock stops on every whistle, except once a team leads by this much.
export const RUNNING_CLOCK_LEAD = 5

// Any period past the regulation ones is the overtime period, which is shorter.
export const periodLengthMinutes = (period: number) =>
  period > REGULATION_PERIODS ? OVERTIME_MINUTES : PERIOD_MINUTES

// Each slot includes 5 minutes of warm-up and 3 minutes of intermission.
export const MATCH_DURATION_MINUTES = 5 + REGULATION_PERIODS * PERIOD_MINUTES + 3

export function getAutomaticMatchStatus(match: Match, now = new Date()): MatchStatus {
  if (match.status === 'postponed') return 'postponed'
  // A walkover is settled without anybody taking the ice, so the clock says nothing
  // about it. Without this it would show as live during its own slot.
  if (match.resolution === 'walkover' && match.homeScore !== null && match.awayScore !== null) return 'finished'
  if (!match.homeTeamId || !match.awayTeamId) return 'tbd'

  const start = new Date(match.startDateTime).getTime()
  const end = start + MATCH_DURATION_MINUTES * 60_000
  const current = now.getTime()

  if (current < start) return 'upcoming'
  if (current < end) return 'live'
  return 'finished'
}

export const applyAutomaticMatchStatuses = (matches: Match[], now = new Date()): Match[] =>
  matches.map((match) => ({ ...match, status: getAutomaticMatchStatus(match, now) }))
