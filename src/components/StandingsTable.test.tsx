import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { StandingRow } from '../types/tournament'
import { StandingsTable } from './StandingsTable'

const row = (id: string): StandingRow => ({
  position: 1,
  team: { id, name: id, shortName: id, category: 'h10' },
  played: 0,
  won: 0,
  overtimeWon: 0,
  overtimeLost: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0,
  points: 0,
  tiebreakPending: true,
})

describe('StandingsTable', () => {
  it('should explain when equal positions still require the official draw', () => {
    render(<StandingsTable rows={[row('A'), row('B')]} bands={[]} />)

    expect(screen.getByText(/requieren el sorteo oficial/)).toBeInTheDocument()
  })

  it('should show regular-phase draws in their own column', () => {
    const tied = { ...row('A'), drawn: 1, tiebreakPending: undefined }
    render(<StandingsTable rows={[tied]} bands={[]} />)

    expect(screen.getByRole('columnheader', { name: 'E' })).toHaveAttribute('title', 'Empatados')
    expect(screen.getAllByRole('cell', { name: '1' })).toHaveLength(2)
  })
})
