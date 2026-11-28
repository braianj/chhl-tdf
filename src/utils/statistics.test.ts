import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { MatchEvent, MatchRosterEntry } from '../types/tournament'
import { calculatePlayerStatistics } from './statistics'

describe('calculatePlayerStatistics', () => {
  describe('when events include goals, assists and penalties', () => {
    let events: MatchEvent[]

    beforeEach(() => {
      events = [
        { id: '1', matchId: 'm1', category: 'h10', teamId: 'a', type: 'goal', playerName: 'Ana', assistName: 'Beto', secondAssistName: 'Carla' },
        { id: '2', matchId: 'm1', category: 'h10', teamId: 'a', type: 'major-penalty', playerName: 'Ana', penaltyMinutes: 5 },
      ]
    })

    afterEach(() => {
      events = []
    })

    it('should aggregate the scorer statistics', () => {
      expect(calculatePlayerStatistics('h10', events)[0]).toMatchObject({
        playerName: 'Ana', goals: 1, majorPenalties: 1, penaltyMinutes: 5,
      })
    })

    it('should credit the assist to a separate player', () => {
      expect(calculatePlayerStatistics('h10', events)[1].assists).toBe(1)
    })

    it('should credit a second assist', () => {
      expect(calculatePlayerStatistics('h10', events).find((row) => row.playerName === 'Carla')?.assists).toBe(1)
    })

    it('should calculate points from goals and assists', () => {
      expect(calculatePlayerStatistics('h10', events)[0].points).toBe(1)
    })
  })

  describe('when another tournament has events', () => {
    let events: MatchEvent[]

    beforeEach(() => {
      events = [
        { id: '1', matchId: 'm1', category: 'h10', teamId: 'a', type: 'goal', playerName: 'Alex' },
        { id: '2', matchId: 'w1', category: 'h12', teamId: 'b', type: 'goal', playerName: 'Alex' },
      ]
    })

    afterEach(() => {
      events = []
    })

    it('should keep tournament statistics independent', () => {
      expect(calculatePlayerStatistics('h12', events)[0].teamId).toBe('b')
    })
  })
})

describe('games played', () => {
  const roster = (matchId: string, playerName: string, overrides: Partial<MatchRosterEntry> = {}): MatchRosterEntry => ({
    id: `${matchId}-${playerName}`,
    matchId,
    category: 'h10',
    teamId: 'a',
    playerId: playerName,
    playerName,
    jerseyNumber: 9,
    ...overrides,
  })

  describe('when a player dressed for several matches', () => {
    it('should count one match each', () => {
      const rows = calculatePlayerStatistics('h10', [], [roster('m1', 'Ana'), roster('m2', 'Ana')])

      expect(rows.find((row) => row.playerName === 'Ana')?.played).toBe(2)
    })
  })

  describe('when shots were recorded by period', () => {
    it('should add every period and derive shooting percentage from goals', () => {
      const rows = calculatePlayerStatistics('h10', [
        { id: 'g1', matchId: 'm1', category: 'h10', teamId: 'a', type: 'goal', playerName: 'Ana' },
      ], [roster('m1', 'Ana', { shotsPeriod1: 2, shotsPeriod2: 1, shotsOvertime: 1 })])

      expect(rows[0]).toMatchObject({ shotsOnTarget: 4, shootingPercentage: 25 })
    })

    it('should leave shooting percentage unavailable when no shots were recorded', () => {
      expect(calculatePlayerStatistics('h10', [], [roster('m1', 'Ana')])[0])
        .toMatchObject({ shotsOnTarget: 0, shootingPercentage: undefined })
    })
  })

  describe('when the roster holds the same player twice for one match', () => {
    it('should still count a single match', () => {
      const rows = calculatePlayerStatistics('h10', [], [
        roster('m1', 'Ana'),
        { ...roster('m1', 'Ana'), id: 'duplicado' },
      ])

      expect(rows.find((row) => row.playerName === 'Ana')?.played).toBe(1)
    })
  })

  describe('when a player dressed but did nothing', () => {
    it('should still be listed with zeros', () => {
      const rows = calculatePlayerStatistics('h10', [], [roster('m1', 'Ana')])

      expect(rows).toHaveLength(1)
      expect(rows[0]).toMatchObject({ playerName: 'Ana', played: 1, goals: 0, points: 0 })
    })
  })

  describe('when the roster belongs to the other tournament', () => {
    it('should not be counted', () => {
      const rows = calculatePlayerStatistics('h10', [], [roster('m1', 'Ana', { category: 'h12' })])

      expect(rows).toHaveLength(0)
    })
  })

  describe('when a player scored without appearing on any roster', () => {
    it('should show no matches played rather than crash', () => {
      const rows = calculatePlayerStatistics('h10', [
        { id: 'e1', matchId: 'm1', category: 'h10', teamId: 'a', type: 'goal', playerName: 'Ana' },
      ], [])

      expect(rows[0]).toMatchObject({ playerName: 'Ana', goals: 1, played: 0 })
    })
  })
  describe('when the scoresheet number was never matched to a player', () => {
    it('should not invent a nameless row for the goal', () => {
      const rows = calculatePlayerStatistics('h10', [
        { id: 'e1', matchId: 'm1', category: 'h10', teamId: 'a', type: 'goal', playerName: '', jerseyNumber: 6 },
      ], [])

      expect(rows).toEqual([])
    })

    it('should still credit an assist that was matched', () => {
      const rows = calculatePlayerStatistics('h10', [
        { id: 'e1', matchId: 'm1', category: 'h10', teamId: 'a', type: 'goal', playerName: '', jerseyNumber: 6, assistName: 'Ana' },
      ], [])

      expect(rows).toHaveLength(1)
      expect(rows[0]).toMatchObject({ playerName: 'Ana', assists: 1, goals: 0 })
    })

    it('should not invent a nameless row for the penalty', () => {
      const rows = calculatePlayerStatistics('h10', [
        { id: 'e1', matchId: 'm1', category: 'h10', teamId: 'a', type: 'penalty', playerName: '', jerseyNumber: 6, penaltyMinutes: 2 },
      ], [])

      expect(rows).toEqual([])
    })
  })
})
