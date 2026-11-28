import { beforeEach, describe, expect, it } from 'vitest'
import type { Match, ScoringRules, StandingRow, Team } from '../types/tournament'
import { calculateStandings } from './standings'

const createMatch = (overrides: Partial<Match> = {}): Match => ({
  id: 'match',
  category: 'h10',
  startDateTime: '2026-07-24T10:00:00-03:00',
  stage: 'regular',
  homeTeamId: 'a',
  awayTeamId: 'b',
  homeScore: 2,
  awayScore: 1,
  status: 'finished',
  countsForStandings: true,
  ...overrides,
})

describe('calculateStandings', () => {
  let scoring: ScoringRules
  let teams: Team[]

  beforeEach(() => {
    scoring = { win: 3, overtimeWin: 2, overtimeLoss: 1, shootoutWin: 2, shootoutLoss: 1, walkoverWin: 3, walkoverLoss: 0, loss: 0, draw: 1 }
    teams = [
      { id: 'a', name: 'A', shortName: 'A', category: 'h10' },
      { id: 'b', name: 'B', shortName: 'B', category: 'h10' },
      { id: 'c', name: 'C', shortName: 'C', category: 'h10' },
      { id: 'd', name: 'D', shortName: 'D', category: 'h10' },
      { id: 'w', name: 'W', shortName: 'W', category: 'h12' },
    ]
  })

  describe('when processing a win', () => {
    let standings: StandingRow[]

    beforeEach(() => {
      standings = calculateStandings('h10', teams, [createMatch()], scoring)
    })

    it('should award three points to the winner', () => {
      expect(standings.find((row) => row.team.id === 'a')).toMatchObject({ won: 1, points: 3 })
    })

    it('should record one loss for the defeated team', () => {
      expect(standings.find((row) => row.team.id === 'b')).toMatchObject({ lost: 1, points: 0 })
    })
  })

  describe('when a match is decided in overtime', () => {
    let standings: StandingRow[]

    beforeEach(() => {
      standings = calculateStandings('h10', teams, [createMatch({ resolution: 'overtime' })], scoring)
    })

    it('should award two points to the overtime winner', () => {
      expect(standings.find((row) => row.team.id === 'a')).toMatchObject({ overtimeWon: 1, won: 0, points: 2 })
    })

    it('should award one point to the overtime loser', () => {
      expect(standings.find((row) => row.team.id === 'b')).toMatchObject({ overtimeLost: 1, lost: 0, points: 1 })
    })

    it('should rank a regulation win above two overtime wins on points', () => {
      const rows = calculateStandings('h10', teams, [
        createMatch({ id: 'ot-1', homeTeamId: 'a', awayTeamId: 'c', resolution: 'overtime' }),
        createMatch({ id: 'ot-2', homeTeamId: 'a', awayTeamId: 'd', resolution: 'overtime' }),
        createMatch({ id: 'reg', homeTeamId: 'b', awayTeamId: 'c' }),
      ], scoring)

      expect(rows.find((row) => row.team.id === 'a')?.points).toBe(4)
      expect(rows.find((row) => row.team.id === 'b')?.points).toBe(3)
    })
  })

  describe('when the direct match between two tied teams went to overtime', () => {
    it('should rank the overtime winner first', () => {
      const rows = calculateStandings('h10', teams, [
        // A beats B in overtime: 2 vs 1 between them.
        createMatch({ id: 'h2h', homeTeamId: 'a', awayTeamId: 'b', homeScore: 3, awayScore: 2, resolution: 'overtime' }),
        // B outscores C heavily so its overall goal difference beats A's.
        createMatch({ id: 'b-c', homeTeamId: 'b', awayTeamId: 'c', homeScore: 9, awayScore: 0 }),
        // A only edges D in overtime, which keeps both teams level on 4 points.
        createMatch({ id: 'a-d', homeTeamId: 'a', awayTeamId: 'd', homeScore: 1, awayScore: 0, resolution: 'overtime' }),
      ], scoring)

      const [first, second] = rows.filter((row) => ['a', 'b'].includes(row.team.id))

      expect(first.team.id).toBe('a')
      expect(second.team.id).toBe('b')
      expect(first.points).toBe(second.points)
      expect(first.goalDifference).toBeLessThan(second.goalDifference)
    })
  })

  describe('when a match is settled by a shootout', () => {
    it('should pay the same as an overtime result', () => {
      const standings = calculateStandings('h10', teams, [createMatch({ resolution: 'shootout' })], scoring)

      expect(standings.find((row) => row.team.id === 'a')).toMatchObject({ overtimeWon: 1, won: 0, points: 2 })
      expect(standings.find((row) => row.team.id === 'b')).toMatchObject({ overtimeLost: 1, lost: 0, points: 1 })
    })
  })

  describe('when a tied score is flagged as settled beyond regulation', () => {
    it('should ignore the flag and award the draw points', () => {
      const standings = calculateStandings(
        'h10',
        teams,
        [createMatch({ homeScore: 2, awayScore: 2, resolution: 'overtime' })],
        scoring,
      )

      expect(standings.find((row) => row.team.id === 'a')).toMatchObject({ drawn: 1, overtimeWon: 0, points: 1 })
    })
  })

  describe('when processing a draw', () => {
    let standings: StandingRow[]

    beforeEach(() => {
      standings = calculateStandings(
        'h10',
        teams,
        [createMatch({ homeScore: 2, awayScore: 2 })],
        scoring,
      )
    })

    it('should award one point to both teams', () => {
      expect(
        standings
          .filter((row) => ['a', 'b'].includes(row.team.id))
          .map((row) => row.points),
      ).toEqual([1, 1])
    })
  })

  describe('when processing a zero-zero result', () => {
    let standings: StandingRow[]

    beforeEach(() => {
      standings = calculateStandings(
        'h10',
        teams,
        [createMatch({ homeScore: 0, awayScore: 0 })],
        scoring,
      )
    })

    it('should count the match as a draw', () => {
      expect(standings.find((row) => row.team.id === 'a')).toMatchObject({ played: 1, drawn: 1 })
    })
  })

  describe('when a match has no complete result', () => {
    let standings: StandingRow[]

    beforeEach(() => {
      standings = calculateStandings(
        'h10',
        teams,
        [createMatch({ awayScore: null })],
        scoring,
      )
    })

    it('should ignore the match', () => {
      expect(standings.every((row) => row.played === 0)).toBe(true)
    })
  })

  describe('when a match does not count for standings', () => {
    let standings: StandingRow[]

    beforeEach(() => {
      standings = calculateStandings(
        'h10',
        teams,
        [createMatch({ stage: 'final-a', countsForStandings: false })],
        scoring,
      )
    })

    it('should ignore the playoff result', () => {
      expect(standings.every((row) => row.played === 0)).toBe(true)
    })
  })

  describe('when calculating the women’s tournament', () => {
    let standings: StandingRow[]

    beforeEach(() => {
      standings = calculateStandings(
        'h12',
        teams,
        [
          createMatch(),
          createMatch({
            id: 'h12',
            category: 'h12',
            homeTeamId: 'w',
            awayTeamId: 'w',
          }),
        ],
        scoring,
      )
    })

    it('should keep the tournament categories independent', () => {
      expect(standings.map((row) => row.team.id)).toEqual(['w'])
    })
  })

  describe('when teams have different points', () => {
    let standings: StandingRow[]

    beforeEach(() => {
      standings = calculateStandings('h10', teams, [createMatch()], scoring)
    })

    it('should rank the team with more points first', () => {
      expect(standings[0].team.id).toBe('a')
    })

    it('should never share a position across different point totals', () => {
      expect(standings.find((row) => row.team.id === 'a')?.position).toBe(1)
      expect(standings.find((row) => row.team.id === 'b')?.position).not.toBe(1)
    })
  })

  describe('when exactly two teams have equal points', () => {
    let standings: StandingRow[]

    beforeEach(() => {
      const matches = [
        createMatch({
          id: 'b-beats-a',
          homeTeamId: 'b',
          awayTeamId: 'a',
          homeScore: 1,
          awayScore: 0,
        }),
        createMatch({
          id: 'a-big-win-c',
          homeTeamId: 'a',
          awayTeamId: 'c',
          homeScore: 8,
          awayScore: 0,
        }),
        createMatch({
          id: 'a-big-win-d',
          homeTeamId: 'a',
          awayTeamId: 'd',
          homeScore: 8,
          awayScore: 0,
        }),
        createMatch({
          id: 'b-small-win-d',
          homeTeamId: 'b',
          awayTeamId: 'd',
          homeScore: 1,
          awayScore: 0,
        }),
        createMatch({
          id: 'b-loses-c',
          homeTeamId: 'b',
          awayTeamId: 'c',
          homeScore: 0,
          awayScore: 1,
        }),
      ]
      standings = calculateStandings('h10', teams, matches, scoring)
    })

    it('should rank the direct-match winner above the team with better overall goal difference', () => {
      expect(standings.slice(0, 2).map((row) => row.team.id)).toEqual(['b', 'a'])
    })
  })

  describe('when exactly three teams have equal points', () => {
    let internalMatches: Match[]

    beforeEach(() => {
      internalMatches = [
        createMatch({
          id: 'a-b',
          homeTeamId: 'a',
          awayTeamId: 'b',
          homeScore: 3,
          awayScore: 1,
        }),
        createMatch({
          id: 'b-c',
          homeTeamId: 'b',
          awayTeamId: 'c',
          homeScore: 2,
          awayScore: 0,
        }),
        createMatch({
          id: 'c-a',
          homeTeamId: 'c',
          awayTeamId: 'a',
          homeScore: 1,
          awayScore: 0,
        }),
      ]
    })

    describe('and the internal wins form a cycle', () => {
      let standings: StandingRow[]

      beforeEach(() => {
        standings = calculateStandings('h10', teams, internalMatches, scoring)
      })

      it('should rank teams by goal difference from only the tied-team matches', () => {
        expect(standings.slice(0, 3).map((row) => row.team.id)).toEqual(['a', 'b', 'c'])
      })
    })

    describe('and matches against a fourth team change overall goal difference', () => {
      let standings: StandingRow[]

      beforeEach(() => {
        const externalMatches = [
          createMatch({
            id: 'a-d',
            homeTeamId: 'a',
            awayTeamId: 'd',
            homeScore: 1,
            awayScore: 0,
          }),
          createMatch({
            id: 'b-d',
            homeTeamId: 'b',
            awayTeamId: 'd',
            homeScore: 1,
            awayScore: 0,
          }),
          createMatch({
            id: 'c-d',
            homeTeamId: 'c',
            awayTeamId: 'd',
            homeScore: 10,
            awayScore: 0,
          }),
        ]
        standings = calculateStandings(
          'h10',
          teams,
          [...internalMatches, ...externalMatches],
          scoring,
        )
      })

      it('should ignore the external goals in the three-team mini-table', () => {
        expect(standings.slice(0, 3).map((row) => row.team.id)).toEqual(['a', 'b', 'c'])
      })
    })
  })
  describe('when four teams are level on points', () => {
    let standings: StandingRow[]

    beforeEach(() => {
      // A, B, C and D all finish on 6. Among themselves A wins two of three, so the
      // mini-table puts it first. Its overall goal difference is the worst of the four
      // only because a team outside the tie thrashed it, which the tie must ignore.
      const outsiders: Team[] = [
        { id: 'e', name: 'E', shortName: 'E', category: 'h10' },
        { id: 'f', name: 'F', shortName: 'F', category: 'h10' },
      ]
      standings = calculateStandings('h10', [...teams, ...outsiders], [
        createMatch({ id: 'm1', homeTeamId: 'a', awayTeamId: 'b', homeScore: 1, awayScore: 0 }),
        createMatch({ id: 'm2', homeTeamId: 'a', awayTeamId: 'c', homeScore: 1, awayScore: 0 }),
        createMatch({ id: 'm3', homeTeamId: 'd', awayTeamId: 'a', homeScore: 1, awayScore: 0 }),
        createMatch({ id: 'm4', homeTeamId: 'b', awayTeamId: 'c', homeScore: 1, awayScore: 0 }),
        createMatch({ id: 'm5', homeTeamId: 'b', awayTeamId: 'd', homeScore: 1, awayScore: 0 }),
        createMatch({ id: 'm6', homeTeamId: 'c', awayTeamId: 'd', homeScore: 1, awayScore: 0 }),
        createMatch({ id: 'm7', homeTeamId: 'e', awayTeamId: 'a', homeScore: 9, awayScore: 0 }),
        createMatch({ id: 'm8', homeTeamId: 'f', awayTeamId: 'b', homeScore: 1, awayScore: 0 }),
        createMatch({ id: 'm9', homeTeamId: 'c', awayTeamId: 'e', homeScore: 1, awayScore: 0 }),
        createMatch({ id: 'm10', homeTeamId: 'd', awayTeamId: 'f', homeScore: 1, awayScore: 0 }),
      ], scoring)
    })

    it('should use the official direct points and direct goal difference criteria', () => {
      expect(standings.slice(0, 4).every((row) => row.points === 6)).toBe(true)
      expect(standings.slice(0, 4).map((row) => row.team.id)).toEqual(['b', 'a', 'c', 'd'])
    })

    it('should use overall goal difference when direct criteria remain equal', () => {
      const [first] = standings
      expect(first.team.id).toBe('b')
      expect(first.goalDifference).toBeGreaterThan(standings[1].goalDifference)
    })
  })

  describe('when the whole group is level and the mini-table says nothing', () => {
    it('should keep equal teams pending a draw instead of deciding alphabetically', () => {
      // A perfect cycle: each beat the next by one goal, so the mini-table is identical
      // for all three. Only the goals scored outside it can tell them apart.
      const standings = calculateStandings('h10', teams, [
        createMatch({ id: 'm1', homeTeamId: 'a', awayTeamId: 'b', homeScore: 1, awayScore: 0 }),
        createMatch({ id: 'm2', homeTeamId: 'b', awayTeamId: 'c', homeScore: 1, awayScore: 0 }),
        createMatch({ id: 'm3', homeTeamId: 'c', awayTeamId: 'a', homeScore: 1, awayScore: 0 }),
      ], scoring)

      expect(standings.slice(0, 3).map((row) => row.position)).toEqual([1, 1, 1])
      expect(standings.slice(0, 3).every((row) => row.tiebreakPending)).toBe(true)
    })
  })

  describe('when direct criteria remain equal', () => {
    it('should use unique manual draw order only after every sporting criterion', () => {
      teams[0].drawOrder = 2
      teams[1].drawOrder = 1
      const rows = calculateStandings('h10', teams.slice(0, 2), [], scoring)

      expect(rows.map((row) => row.team.id)).toEqual(['b', 'a'])
      expect(rows.every((row) => !row.tiebreakPending)).toBe(true)
    })
  })

  describe('when a mini-table separates only some of the tied teams', () => {
    it('should re-compare the ones still level among themselves', () => {
      // A, B and C finish on 3. C lost to both, so it drops. A and B are left level on
      // the first mini-table and are separated by their own match, which B won.
      const standings = calculateStandings('h10', teams, [
        createMatch({ id: 'm1', homeTeamId: 'a', awayTeamId: 'c', homeScore: 1, awayScore: 0 }),
        createMatch({ id: 'm2', homeTeamId: 'b', awayTeamId: 'c', homeScore: 1, awayScore: 0 }),
        createMatch({ id: 'm3', homeTeamId: 'b', awayTeamId: 'a', homeScore: 1, awayScore: 0 }),
        createMatch({ id: 'm4', homeTeamId: 'a', awayTeamId: 'd', homeScore: 0, awayScore: 1 }),
        createMatch({ id: 'm5', homeTeamId: 'b', awayTeamId: 'd', homeScore: 0, awayScore: 1 }),
      ], scoring)

      const order = standings.map((row) => row.team.id)
      expect(order.indexOf('b')).toBeLessThan(order.indexOf('a'))
      expect(order.indexOf('a')).toBeLessThan(order.indexOf('c'))
    })
  })
  describe('when a team does not turn up', () => {
    it('should pay the winner like a regulation win and the absent side nothing', () => {
      const standings = calculateStandings('h10', teams, [
        createMatch({ homeTeamId: 'a', awayTeamId: 'b', homeScore: 1, awayScore: 0, resolution: 'walkover' }),
      ], scoring)

      expect(standings[0]).toMatchObject({ team: { id: 'a' }, points: 3, won: 1, lost: 0 })
      expect(standings.find((row) => row.team.id === 'b')).toMatchObject({ points: 0, lost: 1, won: 0 })
    })

    it('should not count it as an overtime result', () => {
      const [first] = calculateStandings('h10', teams, [
        createMatch({ homeTeamId: 'a', awayTeamId: 'b', homeScore: 1, awayScore: 0, resolution: 'walkover' }),
      ], scoring)

      expect(first).toMatchObject({ overtimeWon: 0, overtimeLost: 0 })
    })

    it('should let the organisation price it apart from a regulation win', () => {
      const [first] = calculateStandings('h10', teams, [
        createMatch({ homeTeamId: 'a', awayTeamId: 'b', homeScore: 1, awayScore: 0, resolution: 'walkover' }),
      ], { ...scoring, walkoverWin: 2 })

      expect(first.points).toBe(2)
    })

    it('should settle a tie on points like any other result', () => {
      // A wins by walkover, B wins on the ice; they meet and B wins that too.
      const standings = calculateStandings('h10', teams, [
        createMatch({ id: 'm1', homeTeamId: 'a', awayTeamId: 'c', homeScore: 1, awayScore: 0, resolution: 'walkover' }),
        createMatch({ id: 'm2', homeTeamId: 'b', awayTeamId: 'd', homeScore: 5, awayScore: 0 }),
        createMatch({ id: 'm3', homeTeamId: 'b', awayTeamId: 'a', homeScore: 2, awayScore: 1 }),
      ], scoring)

      const order = standings.map((row) => row.team.id)
      expect(order.indexOf('b')).toBeLessThan(order.indexOf('a'))
    })
  })
})
