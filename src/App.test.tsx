import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Match, Team } from './types/tournament'
import App from './App'

const source = vi.hoisted(() => ({ matches: [] as Match[], teams: [] as Team[] }))
vi.mock('./data/tournamentStore', () => ({
  subscribeToTournamentData: (onMatches: (rows: Match[]) => void, onTeams: (rows: Team[]) => void) => {
    onMatches(source.matches)
    onTeams(source.teams)
    return () => {}
  },
}))

beforeEach(() => {
  localStorage.clear()
  source.matches = []
  source.teams = []
})

describe('when the data source is empty', () => {
  it('should render the tournament name and an empty schedule', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'CHHL TDF' })).toBeInTheDocument()
    expect(screen.getByText(/No hay partidos programados/)).toBeInTheDocument()
  })
})

describe('when multiple categories have a scheduled final', () => {
  beforeEach(() => {
    source.matches = (['h12', 'h14'] as const).map((category, index) => ({
      id: category, category, startDateTime: `2026-11-29T16:${index}0:00-03:00`,
      stage: 'final', homeLabel: '1.º', awayLabel: '2.º', homeScore: null, awayScore: null,
      status: 'tbd', countsForStandings: false,
    }))
  })

  it('should preserve pending participants while filtering to one category', () => {
    render(<App />)
    expect(screen.getAllByText('1.º')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'H14' }))
    expect(screen.getAllByText('1.º')).toHaveLength(1)
  })
})
