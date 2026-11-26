import { requireSupabase, supabase } from '../supabase'
import type { Match, MatchEvent, MatchRosterEntry, Player, Team } from '../types/tournament'
import { adminDocId, type AdminRole } from '../utils/admins'

export type { User } from '@supabase/supabase-js'

export interface AdminEntry {
  email: string
  role: AdminRole
}

type Table = 'matches' | 'teams' | 'players' | 'match_rosters' | 'match_events'

export function subscribeToUser(onUser: (user: import('@supabase/supabase-js').User | null) => void) {
  const subscription = supabase?.auth.onAuthStateChange((_event, session) => onUser(session?.user ?? null))
  return () => subscription?.data.subscription.unsubscribe()
}

export async function signIn() {
  const { error } = await requireSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: new URL(import.meta.env.BASE_URL + '?admin=1', location.origin).href },
  })
  if (error) throw error
}

export async function signOut() {
  const { error } = await requireSupabase().auth.signOut()
  if (error) throw error
}

export async function getAdminRole(): Promise<AdminRole | null> {
  const { data, error } = await requireSupabase().rpc('current_tournament_role')
  if (error) throw error
  return data === 'owner' || data === 'editor' ? data : null
}

function refreshOnChange(read: () => Promise<void>, onError: () => void) {
  let active = true
  let reading = false
  let queued = false
  const refresh = async () => {
    if (!active) return
    if (reading) { queued = true; return }
    reading = true
    try {
      await read()
    } catch {
      if (active) onError()
    } finally {
      reading = false
      if (queued) { queued = false; void refresh() }
    }
  }
  const timer = window.setInterval(refresh, 30_000)
  window.addEventListener('chhl-data-changed', refresh)
  void refresh()
  return {
    active: () => active,
    stop: () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('chhl-data-changed', refresh)
    },
  }
}

async function readTable<T>(table: Table): Promise<T[]> {
  const rows: T[] = []
  const pageSize = 500
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await requireSupabase().from(table).select('data').order('id').range(offset, offset + pageSize - 1)
    if (error) throw error
    rows.push(...data.map(({ data }) => data as T))
    if (data.length < pageSize) return rows
  }
}

export function subscribeToTournamentData(
  onMatches: (matches: Match[]) => void,
  onTeams: (teams: Team[]) => void,
  onPlayers: (players: Player[]) => void,
  onRosters: (rosters: MatchRosterEntry[]) => void,
  onEvents: (events: MatchEvent[]) => void,
  onError: () => void,
) {
  if (!supabase) return () => {}
  const subscription = refreshOnChange(async () => {
    const [matches, teams, players, rosters, events] = await Promise.all([
      readTable<Match>('matches'), readTable<Team>('teams'), readTable<Player>('players'),
      readTable<MatchRosterEntry>('match_rosters'), readTable<MatchEvent>('match_events'),
    ])
    if (!subscription.active()) return
    onMatches(matches)
    onTeams(teams)
    onPlayers(players)
    onRosters(rosters)
    onEvents(events)
  }, onError)
  return subscription.stop
}

export function subscribeToAdmins(onAdmins: (entries: AdminEntry[]) => void, onError: () => void) {
  const subscription = refreshOnChange(async () => {
    const { data, error } = await requireSupabase().from('tournament_admins').select('email,role').order('email')
    if (error) throw error
    if (subscription.active()) onAdmins(data as AdminEntry[])
  }, onError)
  return subscription.stop
}

async function write(result: PromiseLike<{ error: unknown }>) {
  const { error } = await result
  if (error) throw error
  window.dispatchEvent(new Event('chhl-data-changed'))
}

function save(table: Table, data: { id: string }) {
  return write(requireSupabase().from(table).upsert({ id: data.id, data }))
}

function remove(table: Table, id: string) {
  return write(requireSupabase().from(table).delete().eq('id', id))
}

export const saveMatch = (match: Match) => write(requireSupabase().rpc('save_tournament_match', { document: match }))
export const saveTeam = (team: Team) => save('teams', team)
export const savePlayer = (player: Player) => save('players', player)
export const saveMatchEvent = (event: MatchEvent) => save('match_events', event)
export const saveMatchRosterEntry = (entry: MatchRosterEntry) => save('match_rosters', entry)
export const removeMatchEvent = (id: string) => remove('match_events', id)
export const removeMatchRosterEntry = (id: string) => remove('match_rosters', id)
export const saveAdmin = (email: string, role: AdminRole) =>
  write(requireSupabase().from('tournament_admins').upsert({ email: adminDocId(email), role }))
export const removeAdmin = (email: string) =>
  write(requireSupabase().from('tournament_admins').delete().eq('email', adminDocId(email)))
