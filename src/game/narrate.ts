/**
 * Le récit de la révélation. C'est le moment fort de l'app : une phrase qui
 * dit ce qui vient de se passer, du point de vue de celui qui regarde.
 *
 * Le moteur ne produit que des faits (RoundEvent) ; le texte est fabriqué ici,
 * parce qu'il dépend de qui lit l'écran — « ta frappe » pour l'un est
 * « la frappe de Léa » pour l'autre.
 */
import { CARD_LABEL, type GameState, type PlayerId, type RoundEvent, type RoundOutcome } from './types'

export type Tone = 'clay' | 'green' | 'ink'

export interface Narration {
  /** Le titre du panneau, en Bricolage. */
  headline: string
  /** La ligne de détail sous le titre. */
  detail: string
  /** La matière du panneau : terre cuite pour un dégât, vert atelier pour une défense. */
  tone: Tone
}

export function narrate(
  state: GameState,
  outcome: RoundOutcome,
  viewerId: PlayerId | null,
): Narration {
  const name = (id: PlayerId) => state.players.find((p) => p.id === id)?.name ?? '?'
  /** « tu » quand c'est le lecteur, le prénom sinon. */
  const isMe = (id: PlayerId) => id === viewerId
  const subject = (id: PlayerId) => (isMe(id) ? 'Tu' : name(id))
  const poss = (id: PlayerId) => (isMe(id) ? 'ta' : `la`)
  const ofWhom = (id: PlayerId) => (isMe(id) ? '' : ` de ${name(id)}`)

  const ev = outcome.events
  const lockLine = (id: PlayerId) => {
    const cards = outcome.outcomes.find((o) => o.playerId === id)?.played.map((c) => CARD_LABEL[c.card])
    if (!cards || cards.length === 0) return ''
    const list = cards.join(' et ')
    return isMe(id)
      ? ` — et ${list} t’est interdit${cards.length > 1 ? 'es' : ''} la manche prochaine.`
      : ` — ${list} lui est interdit${cards.length > 1 ? 'es' : ''} la manche prochaine.`
  }

  // 1 · Un piège qui se retourne contre son attaquant : le fait le plus marquant.
  const reflected = ev.filter((e): e is Extract<RoundEvent, { t: 'retournee' }> => e.t === 'retournee')
  const mine = reflected.find((e) => isMe(e.from)) ?? reflected[0]
  if (mine) {
    return {
      headline: isMe(mine.from)
        ? `Le piège de ${name(mine.to)} a retourné ta frappe.`
        : `Le piège${ofWhom(mine.to)} a retourné la frappe de ${name(mine.from)}.`,
      detail: isMe(mine.from)
        ? `Tu perds ${briques(mine.amount)}, ${name(mine.to)} n’a rien perdu${lockLine(mine.from)}`
        : `${name(mine.from)} perd ${briques(mine.amount)} et ${isMe(mine.to) ? 'tu n’as' : `${name(mine.to)} n’a`} rien perdu.`,
      tone: 'clay',
    }
  }

  // 2 · Un blocage qui annule plusieurs frappes.
  const cancelledBy = new Map<PlayerId, number>()
  for (const e of ev) if (e.t === 'annulee') cancelledBy.set(e.to, (cancelledBy.get(e.to) ?? 0) + 1)
  const best = [...cancelledBy.entries()].sort((a, b) => b[1] - a[1])[0]
  if (best && best[1] > 0) {
    const [who, n] = best
    return {
      headline:
        n > 1
          ? `${subject(who)} ${isMe(who) ? 'as' : 'a'} tout arrêté d’un seul bloc.`
          : `${subject(who)} ${isMe(who) ? 'as' : 'a'} bloqué la frappe.`,
      detail:
        (n > 1
          ? `${n} frappes annulées. `
          : `La frappe est annulée. `) +
        `${isMe(who) ? 'Tu es' : `${name(who)} est`} maintenant à découvert : Bloquer ${isMe(who) ? 't’' : 'lui '}est interdit la manche prochaine.`,
      tone: 'green',
    }
  }

  // 3 · Des frappes qui passent.
  const landed = ev.filter((e): e is Extract<RoundEvent, { t: 'frappe' }> => e.t === 'frappe')
  if (landed.length > 0) {
    const onMe = landed.find((e) => isMe(e.to))
    const e = onMe ?? landed[0]
    const total = landed.filter((x) => x.to === e.to).reduce((n, x) => n + x.amount, 0)
    return {
      headline: onMe
        ? `${subject(e.from)} ${isMe(e.from) ? 'as' : 'a'} cassé ${poss(e.to)} ${total > 1 ? 'briques' : 'brique'}.`
        : `${subject(e.from)} ${isMe(e.from) ? 'as' : 'a'} frappé ${name(e.to)}.`,
      detail: `${name(e.to)} perd ${briques(total)}.${lockLine(e.from)}`,
      tone: 'clay',
    }
  }

  // 4 · Une manche sans dégâts : ce sont les réparations qui comptent.
  const repairs = ev.filter(
    (e): e is Extract<RoundEvent, { t: 'reparation' }> => e.t === 'reparation' && e.amount > 0,
  )
  if (repairs.length > 0) {
    const e = repairs.find((r) => isMe(r.who)) ?? repairs[0]
    const teamMate = e.by !== e.who
    return {
      headline: teamMate
        ? `${subject(e.by)} ${isMe(e.by) ? 'as' : 'a'} réparé le mur de ${isMe(e.who) ? 'ton équipe' : name(e.who)}.`
        : `${subject(e.who)} ${isMe(e.who) ? 'as' : 'a'} remonté ${isMe(e.who) ? 'ton' : 'son'} mur.`,
      detail: `+${e.amount} brique${e.amount > 1 ? 's' : ''}, et personne n’a frappé cette manche.`,
      tone: 'green',
    }
  }

  // 5 · Personne n'a rien fait passer.
  return {
    headline: 'Rien n’est tombé.',
    detail: 'Aucune frappe n’a porté. Les verrous changent quand même : trois choix au tour prochain.',
    tone: 'ink',
  }
}

function briques(n: number): string {
  return n > 1 ? `${n} briques` : 'une brique'
}

/** La ligne « Frapper sur Nour » affichée sur chaque joueur à la révélation. */
export function playedLabel(state: GameState, playerId: PlayerId, outcome: RoundOutcome): string {
  const o = outcome.outcomes.find((x) => x.playerId === playerId)
  if (!o || o.played.length === 0) return o ? 'n’a pas joué' : ''
  return o.played
    .map((c) => {
      const label = CARD_LABEL[c.card]
      if (c.card !== 'frapper' || !c.target) return label
      const target = state.players.find((p) => p.id === c.target)
      return target ? `${label} sur ${target.name}` : label
    })
    .join(' + ')
}
