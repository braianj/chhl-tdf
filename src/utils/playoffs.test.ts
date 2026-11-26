import { beforeEach, describe, expect, it } from 'vitest'
import type { Match, Team } from '../types/tournament'
import { resolvePlayoffParticipants } from './playoffs'

describe('when the H14 regular phase determines its finalists', () => {
  let teams: Team[]
  let regular: Match
  let final: Match

  beforeEach(() => {
    teams = ['cau', 'dragones'].map((id) => ({ id, category: 'h14', name: id, shortName: id }))
    regular = {
      id: 'regular', category: 'h14', startDateTime: '2026-11-29T09:00:00-03:00',
      stage: 'regular', homeTeamId: 'cau', awayTeamId: 'dragones',
      homeScore: 0, awayScore: 1, countsForStandings: true, status: 'finished',
    }
    final = {
      id: 'final', category: 'h14', startDateTime: '2026-11-29T15:36:00-03:00',
      stage: 'final', homeLabel: '1.º', awayLabel: '2.º',
      homeScore: null, awayScore: null, countsForStandings: false, status: 'tbd',
    }
  })

  it('should assign the first and second teams in standings order', () => {
    expect(resolvePlayoffParticipants([regular, final], teams)[1]).toMatchObject({
      homeTeamId: 'dragones', awayTeamId: 'cau',
    })
  })

  describe('and a regular game lacks a score', () => {
    beforeEach(() => { regular.awayScore = null })

    it('should keep the final unassigned', () => {
      expect(resolvePlayoffParticipants([regular, final], teams)[1]).toBe(final)
    })
  })
})
