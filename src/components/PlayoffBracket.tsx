import type { CSSProperties } from 'react'
import { stageLabels, statusLabels } from '../data/tournamentConfig'
import type { Match, MatchStage, Team } from '../types/tournament'
import styles from './PlayoffBracket.module.css'

interface Props {
  matches: Match[]
  teams: Team[]
}

interface BracketRound {
  label: string
  stages: MatchStage[]
}

const rounds: BracketRound[] = [{ label: 'Final', stages: ['final'] }]

export function PlayoffBracket({ matches, teams }: Props) {
  const playoffMatches = matches.filter((match) => match.stage !== 'regular')
  const teamName = (id?: string) => teams.find((team) => team.id === id)?.name
  if (!playoffMatches.some((match) => match.stage === 'final')) return null

  return (
    <section className={styles.section} aria-labelledby="playoffs-heading">
      <div className={styles.heading}>
        <p>Definición</p>
        <h2 id="playoffs-heading">Llave de finales</h2>
      </div>
      <div className={styles.bracket} style={{ '--columns': rounds.length } as CSSProperties}>
        {rounds.map((round) => (
          <div className={styles.round} key={round.label}>
            <span className={styles.roundLabel}>{round.label}</span>
            <div className={styles.games}>
              {round.stages.map((stage) => {
                const match = playoffMatches.find((candidate) => candidate.stage === stage)
                if (!match) return null
                return (
                  <article className={styles.game} key={match.id}>
                    <header>
                      <strong>{stageLabels[match.stage]}</strong>
                      <span>{statusLabels[match.status]}</span>
                    </header>
                    <Participant
                      label={teamName(match.homeTeamId) ?? match.homeLabel ?? 'A confirmar'}
                      score={match.homeScore}
                    />
                    <Participant
                      label={teamName(match.awayTeamId) ?? match.awayLabel ?? 'A confirmar'}
                      score={match.awayScore}
                    />
                  </article>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Participant({ label, score }: { label: string; score: number | null }) {
  return (
    <div className={styles.participant}>
      <span>{label}</span>
      <strong>{score ?? '—'}</strong>
    </div>
  )
}
