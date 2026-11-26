import { useEffect, useState } from 'react'
import { subscribeToTournamentData } from '../data/tournamentStore'
import type { Match, MatchEvent, MatchRosterEntry, Player, Team } from '../types/tournament'
import { applyAutomaticMatchStatuses } from '../utils/matchStatus'
import { resolvePlayoffParticipants } from '../utils/playoffs'

export function useTournamentData() {
  const [storedMatches, setStoredMatches] = useState<Match[]>([])
  const [now, setNow] = useState(() => new Date())
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [rosters, setRosters] = useState<MatchRosterEntry[]>([])
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [usingLiveData, setUsingLiveData] = useState(false)

  useEffect(() => subscribeToTournamentData(
    (nextMatches) => {
      setStoredMatches(nextMatches)
      setUsingLiveData(true)
    },
    setTeams,
    setPlayers,
    setRosters,
    setEvents,
    () => setUsingLiveData(false),
  ), [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  // Write back the stored record so a score correction cannot freeze derived playoff participants.
  const matchesWithStatuses = applyAutomaticMatchStatuses(storedMatches, now)
  const matches = applyAutomaticMatchStatuses(resolvePlayoffParticipants(matchesWithStatuses, teams), now)
  return { matches, publishedMatches: storedMatches, teams, players, rosters, events, usingLiveData }
}
