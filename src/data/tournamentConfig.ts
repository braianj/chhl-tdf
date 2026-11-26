import type { Category, TournamentConfig } from '../types/tournament'

// Both tournaments run on the same rink, so every date and time is read in Ushuaia.
export const TIMEZONE = 'America/Argentina/Ushuaia'

export const categories = ['h10', 'h12', 'h14'] as const
export const categoryOptions = categories.map((value) => ({ value, label: value.toUpperCase() }))
export const tournamentScopes = { all: [...categories], h10: ['h10'], h12: ['h12'], h14: ['h14'] } satisfies Record<string, Category[]>

function categoryConfig(category: Category): TournamentConfig {
  const label = category.toUpperCase()
  return {
    category,
    name: `Categoría ${label}`,
    shortName: label,
    timezone: TIMEZONE,
    scoring: { win: 3, overtimeWin: 2, overtimeLoss: 1, shootoutWin: 2, shootoutLoss: 1, walkoverWin: 3, walkoverLoss: 0, loss: 0, draw: 1 },
    qualification: [{ from: 1, to: 2, label: 'Final', tone: 'primary' }],
  }
}

export const tournamentConfigs: Record<Category, TournamentConfig> = {
  h10: categoryConfig('h10'), h12: categoryConfig('h12'), h14: categoryConfig('h14'),
}

export const stageLabels = {
  regular: 'Fase regular',
  repechaje: 'Repechaje',
  'repechaje-a': 'Repechaje A',
  'repechaje-b': 'Repechaje B',
  'semifinal-1': 'Semifinal 1',
  'semifinal-2': 'Semifinal 2',
  'third-place': 'Tercer puesto',
  final: 'Final',
  'final-a': 'Final A',
  'final-b': 'Final B',
} as const

export const statusLabels = {
  upcoming: 'Próximo',
  live: 'En vivo',
  finished: 'Finalizado',
  postponed: 'Postergado',
  tbd: 'A confirmar',
} as const

export const eventTypeLabels = {
  goal: 'Gol',
  penalty: 'Falta',
  'major-penalty': 'Falta grave',
} as const
