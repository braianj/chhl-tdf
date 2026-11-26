import { tournamentConfigs } from '../data/tournamentConfig'
import type { Match, Team } from '../types/tournament'
import { calculateStandings } from './standings'

export function resolvePlayoffParticipants(matches: Match[], teams: Team[]): Match[] {
  return matches.map((match) => {
    if (match.stage !== 'final' || (match.homeTeamId && match.awayTeamId)) return match
    const regular = matches.filter((other) => other.category === match.category && other.stage === 'regular')
    if (!regular.length || regular.some((other) => other.status !== 'finished'
      || other.homeScore === null || other.awayScore === null || !other.homeTeamId || !other.awayTeamId)) return match
    const categoryTeams = teams.filter((team) => team.category === match.category)
    const standings = calculateStandings(match.category, categoryTeams, regular, tournamentConfigs[match.category].scoring)
    return {
      ...match,
      homeTeamId: match.homeTeamId ?? standings[0]?.team.id,
      awayTeamId: match.awayTeamId ?? standings[1]?.team.id,
    }
  })
}
