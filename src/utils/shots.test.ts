import { describe, expect, it } from 'vitest'
import type { MatchRosterEntry } from '../types/tournament'
import { reconcileMatchShots, shotsOnTarget } from './shots'

const entry = (id: string, teamId: string, overrides: Partial<MatchRosterEntry> = {}): MatchRosterEntry => ({
  id, matchId: 'm1', category: 'h10', teamId, playerId: id, playerName: id, ...overrides,
})

describe('shotsOnTarget', () => {
  it('should add regulation periods and overtime', () => {
    expect(shotsOnTarget(entry('a', 'home', { shotsPeriod1: 2, shotsPeriod2: 3, shotsOvertime: 1 }))).toBe(6)
  })
})

describe('reconcileMatchShots', () => {
  it('should match one team shots against the opposing goalkeeper line', () => {
    const rows = [
      entry('shooter', 'home', { shotsPeriod1: 3, shotsPeriod2: 2 }),
      entry('keeper', 'away', { saves: 4, goalsAgainst: 1 }),
    ]

    expect(reconcileMatchShots('home', 'away', rows)).toMatchObject({ status: 'matched', shooterTotal: 5, goalkeeperTotal: 5 })
  })

  it('should report a mismatch without changing either value', () => {
    const rows = [
      entry('shooter', 'home', { shotsPeriod1: 2 }),
      entry('keeper', 'away', { saves: 4, goalsAgainst: 1 }),
    ]

    expect(reconcileMatchShots('home', 'away', rows)).toMatchObject({ status: 'mismatch', shooterTotal: 2, goalkeeperTotal: 5 })
  })

  it('should stay incomplete until both sources contain data', () => {
    expect(reconcileMatchShots('home', 'away', [entry('shooter', 'home')])).toMatchObject({ status: 'incomplete' })
  })
})
