import type { MatchRosterEntry } from '../types/tournament'

export const hasShotLine = (entry: MatchRosterEntry) =>
  entry.shotsPeriod1 !== undefined || entry.shotsPeriod2 !== undefined || entry.shotsOvertime !== undefined

export const shotsOnTarget = (entry: MatchRosterEntry) =>
  (entry.shotsPeriod1 ?? 0) + (entry.shotsPeriod2 ?? 0) + (entry.shotsOvertime ?? 0)

export type ShotReconciliation = {
  status: 'incomplete' | 'matched' | 'mismatch'
  shooterTotal?: number
  goalkeeperTotal?: number
}

export function reconcileMatchShots(shootingTeamId: string, defendingTeamId: string, entries: MatchRosterEntry[]): ShotReconciliation {
  const shooters = entries.filter((entry) => entry.teamId === shootingTeamId && hasShotLine(entry))
  const keepers = entries.filter((entry) => entry.teamId === defendingTeamId && (entry.saves !== undefined || entry.goalsAgainst !== undefined))
  if (!shooters.length || !keepers.length) return { status: 'incomplete' }
  const shooterTotal = shooters.reduce((total, entry) => total + shotsOnTarget(entry), 0)
  const goalkeeperTotal = keepers.reduce((total, entry) => total + (entry.saves ?? 0) + (entry.goalsAgainst ?? 0), 0)
  return { status: shooterTotal === goalkeeperTotal ? 'matched' : 'mismatch', shooterTotal, goalkeeperTotal }
}
