import type { Category, Match, MatchResolution, ScoringRules, StandingRow, Team } from '../types/tournament'

type ResultMatch = Match & { homeTeamId: string; awayTeamId: string; homeScore: number; awayScore: number }
type MiniTableRow = { points: number; goalDifference: number }
type RankedRow = { row: StandingRow; sportingKey: string; pending: boolean }

const isBeyondRegulation = (match: Match) => match.resolution === 'overtime' || match.resolution === 'shootout'

function awardPoints(match: ResultMatch, scoring: ScoringRules) {
  if (match.homeScore === match.awayScore) return { home: scoring.draw, away: scoring.draw }
  const rewards: Record<MatchResolution, { winner: number; loser: number }> = {
    regulation: { winner: scoring.win, loser: scoring.loss },
    overtime: { winner: scoring.overtimeWin, loser: scoring.overtimeLoss },
    shootout: { winner: scoring.shootoutWin, loser: scoring.shootoutLoss },
    walkover: { winner: scoring.walkoverWin, loser: scoring.walkoverLoss },
  }
  const { winner, loser } = rewards[match.resolution ?? 'regulation']
  return match.homeScore > match.awayScore ? { home: winner, away: loser } : { home: loser, away: winner }
}

const isResultMatch = (match: Match): match is ResultMatch => match.status === 'finished'
  && match.countsForStandings && Boolean(match.homeTeamId) && Boolean(match.awayTeamId)
  && match.homeScore !== null && match.awayScore !== null

function createMiniTable(rows: StandingRow[], matches: ResultMatch[], scoring: ScoringRules) {
  const ids = new Set(rows.map((row) => row.team.id))
  const table = new Map(rows.map((row) => [row.team.id, { points: 0, goalsFor: 0, goalsAgainst: 0 }]))
  matches.filter((match) => ids.has(match.homeTeamId) && ids.has(match.awayTeamId)).forEach((match) => {
    const home = table.get(match.homeTeamId)!
    const away = table.get(match.awayTeamId)!
    const points = awardPoints(match, scoring)
    home.points += points.home; away.points += points.away
    home.goalsFor += match.homeScore; home.goalsAgainst += match.awayScore
    away.goalsFor += match.awayScore; away.goalsAgainst += match.homeScore
  })
  return new Map<string, MiniTableRow>([...table].map(([id, row]) => [id, {
    points: row.points,
    goalDifference: row.goalsFor - row.goalsAgainst,
  }]))
}

function rankPointsGroup(rows: StandingRow[], matches: ResultMatch[], scoring: ScoringRules): RankedRow[] {
  const mini = createMiniTable(rows, matches, scoring)
  const sportingKey = (row: StandingRow) => {
    const direct = mini.get(row.team.id)!
    return [row.points, direct.points, direct.goalDifference, row.goalDifference, row.goalsFor, -row.goalsAgainst].join('|')
  }
  const compareSporting = (a: StandingRow, b: StandingRow) => {
    const left = mini.get(a.team.id)!
    const right = mini.get(b.team.id)!
    return right.points - left.points || right.goalDifference - left.goalDifference
      || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || a.goalsAgainst - b.goalsAgainst
  }
  const groups = new Map<string, StandingRow[]>()
  rows.forEach((row) => groups.set(sportingKey(row), [...(groups.get(sportingKey(row)) ?? []), row]))
  return [...groups.values()].sort((a, b) => compareSporting(a[0], b[0])).flatMap((group) => {
    const orders = group.map((row) => row.team.drawOrder)
    const validDraw = group.length < 2 || (orders.every((value) => Number.isFinite(value)) && new Set(orders).size === group.length)
    const ordered = [...group].sort((a, b) => validDraw && group.length > 1
      ? a.team.drawOrder! - b.team.drawOrder!
      : a.team.name.localeCompare(b.team.name, 'es'))
    return ordered.map((row) => ({ row, sportingKey: sportingKey(row), pending: !validDraw }))
  })
}

export function calculateStandings(category: Category, teams: Team[], matches: Match[], scoring: ScoringRules): StandingRow[] {
  const rows = new Map<string, StandingRow>()
  const resultMatches = matches.filter((match): match is ResultMatch => match.category === category && isResultMatch(match))
  teams.filter((team) => team.category === category).forEach((team) => rows.set(team.id, {
    position: 0, team, played: 0, won: 0, overtimeWon: 0, overtimeLost: 0, drawn: 0,
    lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
  }))
  resultMatches.forEach((match) => {
    const home = rows.get(match.homeTeamId); const away = rows.get(match.awayTeamId)
    if (!home || !away) return
    const points = awardPoints(match, scoring)
    home.played += 1; away.played += 1
    home.goalsFor += match.homeScore; home.goalsAgainst += match.awayScore
    away.goalsFor += match.awayScore; away.goalsAgainst += match.homeScore
    home.points += points.home; away.points += points.away
    if (match.homeScore === match.awayScore) { home.drawn += 1; away.drawn += 1; return }
    const [winner, loser] = match.homeScore > match.awayScore ? [home, away] : [away, home]
    if (isBeyondRegulation(match)) { winner.overtimeWon += 1; loser.overtimeLost += 1; return }
    winner.won += 1; loser.lost += 1
  })
  const completed = [...rows.values()].map((row) => ({ ...row, goalDifference: row.goalsFor - row.goalsAgainst }))
  const byPoints = new Map<number, StandingRow[]>()
  completed.forEach((row) => byPoints.set(row.points, [...(byPoints.get(row.points) ?? []), row]))
  const ranked = [...byPoints.entries()].sort(([a], [b]) => b - a)
    .flatMap(([, group]) => rankPointsGroup(group, resultMatches, scoring))
  let position = 0
  return ranked.map((item, index) => {
    const previous = ranked[index - 1]
    if (!item.pending || !previous?.pending || previous.sportingKey !== item.sportingKey) position = index + 1
    return { ...item.row, position, tiebreakPending: item.pending || undefined }
  })
}
