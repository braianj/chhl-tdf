import { readFileSync, writeFileSync } from 'node:fs'

const [matchesPath, teamsPath, playersPath, outputPath] = process.argv.slice(2)
if (!outputPath) throw new Error('Usage: node scripts/generate-shots-sheet.mjs matches.json teams.json players.json output.html')

const documents = (path) => JSON.parse(readFileSync(path, 'utf8')).map((row) => row.data ?? row)
const matches = documents(matchesPath).sort((a, b) => a.startDateTime.localeCompare(b.startDateTime))
const teams = documents(teamsPath)
const players = documents(playersPath).filter((player) => player.active)
const escape = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
const teamName = (id, fallback) => teams.find((team) => team.id === id)?.name ?? fallback ?? 'A confirmar'
const roster = (teamId) => players.filter((player) => player.teamId === teamId).sort((a, b) =>
  (a.number ?? Number.MAX_SAFE_INTEGER) - (b.number ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name, 'es'))
const two = (value) => String(value).padStart(2, '0')
const dateParts = (value) => {
  const date = new Date(value)
  return { date: `${two(date.getUTCDate())}/${two(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`, time: value.slice(11, 16) }
}

const side = (id, fallback) => {
  const name = teamName(id, fallback)
  const rows = id ? roster(id) : []
  const blanks = Math.max(2, 15 - rows.length)
  const entries = [...rows.map((player) => ({ number: player.number ?? '', name: player.name })), ...Array.from({ length: blanks }, () => ({ number: '', name: '' }))]
  return `<section class="side"><h2>${escape(name)}</h2><table><thead><tr><th class="number">N°</th><th>Jugador/a</th><th>1.er T</th><th>2.º T</th><th>TE</th><th>Total</th></tr></thead><tbody>${entries.map((player) => `<tr><td>${escape(player.number)}</td><td class="player">${escape(player.name)}</td><td></td><td></td><td></td><td></td></tr>`).join('')}<tr class="total"><td colspan="2">TOTAL EQUIPO</td><td></td><td></td><td></td><td></td></tr></tbody></table></section>`
}

const pages = matches.map((match, index) => {
  const when = dateParts(match.startDateTime)
  return `<article class="page"><header><div><h1>CONTROL DE TIROS AL ARCO</h1><p>Partido ${two(index + 1)} · ${when.time} · ${when.date} · Río Grande</p></div><strong>${escape(match.category.toUpperCase())}</strong></header><p class="rule">Una marca por tiro al arco: gol o atajada. No contar tiros desviados, bloqueados fuera del arco ni intentos de definición por penales.</p><main>${side(match.homeTeamId, match.homeLabel)}${side(match.awayTeamId, match.awayLabel)}</main><footer>TE: tiempo extra. El total del equipo debe coincidir con atajadas + goles recibidos por el equipo rival.</footer></article>`
}).join('')

writeFileSync(outputPath, `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Control de tiros al arco · 29-11-2026</title><style>
@page { size: A4 landscape; margin: 8mm; }
* { box-sizing: border-box; } body { margin: 0; color: #0d2942; font-family: Arial, sans-serif; }
.page { break-after: page; height: 194mm; position: relative; } .page:last-child { break-after: auto; }
header { align-items: end; border-bottom: 3px solid #ef6c00; display: flex; justify-content: space-between; padding-bottom: 3mm; }
h1 { font-size: 20pt; margin: 0; } header p { font-size: 9pt; font-weight: 700; margin: 1mm 0 0; } header strong { background: #0d5d97; border-radius: 4px; color: white; font-size: 12pt; padding: 2mm 4mm; }
.rule { background: #eaf5fb; border-left: 4px solid #0d5d97; font-size: 8.5pt; margin: 3mm 0; padding: 2mm 3mm; }
main { display: grid; gap: 5mm; grid-template-columns: 1fr 1fr; } h2 { font-size: 13pt; margin: 0 0 2mm; text-align: center; text-transform: uppercase; }
table { border-collapse: collapse; font-size: 7.5pt; table-layout: fixed; width: 100%; } th { background: #0d5d97; color: white; } th, td { border: 1px solid #8298aa; height: 7.1mm; padding: 1mm; text-align: center; } .number { width: 10mm; } th:nth-child(n+3) { width: 14mm; } .player { font-weight: 600; text-align: left; } .total td { background: #eaf5fb; font-weight: 800; }
footer { bottom: 0; color: #52697a; font-size: 7.5pt; position: absolute; }
</style></head><body>${pages}</body></html>`)
