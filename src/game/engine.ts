/**
 * Le moteur de Rempart. Fonctions pures, aucun accès au DOM ni au réseau :
 * l'hôte fait autorité et rejoue exactement ce code pour chaque manche.
 *
 * L'ordre de résolution est fixe, jamais celui des joueurs (planche 5) :
 *   1. les blocages se posent
 *   2. les pièges s'arment
 *   3. les frappes partent
 *   4. les réparations comptent
 *
 * C'est ce qui fait qu'une réparation ne sauve jamais d'une frappe de la
 * même manche, et que le piège gagne toujours contre la frappe.
 */
import {
  CARD_KEYS,
  ROUNDS,
  ROUND_CARD_ROUNDS,
  WALL_SIZE,
  type CardKey,
  type Choice,
  type GameConfig,
  type GameState,
  type Player,
  type PlayerId,
  type PlayerOutcome,
  type RoundCard,
  type RoundEvent,
  type RoundOutcome,
  type Slot,
} from './types'
import { ROUND_CARDS } from './roundCards'

/* ---------------------------------------------------------------- aléatoire */

/** PRNG déterministe : même graine, même partie. L'hôte partage la graine. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* -------------------------------------------------------------------- murs */

export function emptyWall(): Slot[] {
  return Array.from({ length: WALL_SIZE }, () => 'intact' as Slot)
}

/** Le score d'un joueur : les briques encore debout. */
export function bricks(p: Player): number {
  return p.wall.filter((s) => s !== 'broken').length
}

/** En équipes, le score est commun : on additionne les deux murs. */
export function score(state: GameState, p: Player): number {
  if (p.team === null) return bricks(p)
  return state.players.filter((o) => o.team === p.team).reduce((n, o) => n + bricks(o), 0)
}

/**
 * Casse `n` briques en partant de la droite. Le mur garde sa largeur :
 * l'emplacement reste, creux et pâle. Renvoie le nombre réellement cassé.
 */
function breakBricks(wall: Slot[], n: number): number {
  let done = 0
  for (let i = wall.length - 1; i >= 0 && done < n; i--) {
    if (wall[i] !== 'broken') {
      wall[i] = 'broken'
      done++
    }
  }
  return done
}

/**
 * Remet `n` briques en partant de la gauche, jusqu'à cinq maximum.
 * Elles sont marquées « réparé ce tour » pour la révélation.
 * Réparer un mur plein est jouable mais ne donne rien.
 */
function repairBricks(wall: Slot[], n: number): number {
  let done = 0
  for (let i = 0; i < wall.length && done < n; i++) {
    if (wall[i] === 'broken') {
      wall[i] = 'repaired'
      done++
    }
  }
  return done
}

/** Les marques « réparé ce tour » ne durent qu'une révélation. */
function clearMarks(wall: Slot[]): Slot[] {
  return wall.map((s) => (s === 'repaired' ? 'intact' : s))
}

/* ------------------------------------------------------------ création */

export interface SeatSpec {
  id: PlayerId
  name: string
  ci: 0 | 1 | 2 | 3
  team?: 0 | 1
}

export function createGame(seats: SeatSpec[], config: GameConfig, seed: number): GameState {
  return {
    config,
    players: seats.map((s, i) => ({
      id: s.id,
      name: s.name,
      ci: s.ci,
      seat: i,
      wall: emptyWall(),
      locked: [],
      team: config.format === 'equipes' ? (s.team ?? ((i % 2) as 0 | 1)) : null,
      connected: true,
    })),
    round: 1,
    phase: 'salon',
    activeRoundCard: null,
    usedRoundCards: [],
    choices: {},
    lastOutcome: null,
    seed,
    seq: 0,
    mortSubite: 0,
    vainqueurs: null,
  }
}

/** Relance une partie avec les mêmes joueurs : murs remis à cinq. */
export function replay(state: GameState, seed: number): GameState {
  return {
    ...state,
    players: state.players.map((p) => ({ ...p, wall: emptyWall(), locked: [], connected: true })),
    round: 1,
    phase: 'salon',
    activeRoundCard: null,
    usedRoundCards: [],
    choices: {},
    lastOutcome: null,
    seed,
    seq: 0,
    mortSubite: 0,
    vainqueurs: null,
  }
}

/* ------------------------------------------------------- cartes de manche */

const has = (state: GameState, id: string) => state.activeRoundCard?.id === id

/** Tire la carte de manche de la manche courante, si elle en porte une. */
export function drawRoundCard(state: GameState): RoundCard | null {
  if (!state.config.roundCards) return null
  if (!ROUND_CARD_ROUNDS.includes(state.round)) return null
  const pool = ROUND_CARDS.filter((c) => !state.usedRoundCards.includes(c.id))
  if (pool.length === 0) return null
  const pick = rng(state.seed + state.round * 7919)()
  return pool[Math.floor(pick * pool.length)]
}

/** Démarre la manche : annonce la carte de manche AVANT les choix. */
export function beginRound(state: GameState): GameState {
  const card = drawRoundCard(state)
  return {
    ...state,
    players: state.players.map((p) => ({ ...p, wall: clearMarks(p.wall) })),
    activeRoundCard: card,
    usedRoundCards: card ? [...state.usedRoundCards, card.id] : state.usedRoundCards,
    choices: {},
    lastOutcome: null,
    phase: card ? 'carte-manche' : 'choix',
  }
}

/** Passe du bandeau de carte de manche au choix des cartes. */
export function acknowledgeRoundCard(state: GameState): GameState {
  return state.phase === 'carte-manche' ? { ...state, phase: 'choix' } : state
}

/* ------------------------------------------------------------ légalité */

/** Le joueur qui doit jouer deux cartes cette manche (« Dernier mur »). */
export function doubleCardPlayer(state: GameState): PlayerId | null {
  if (!has(state, 'dernier-mur')) return null
  const active = state.players.filter((p) => p.connected)
  if (active.length === 0) return null
  const low = Math.min(...active.map(bricks))
  const lowest = active.filter((p) => bricks(p) === low)
  // À égalité de mur bas, c'est la première place à la table qui joue deux cartes.
  return lowest.sort((a, b) => a.seat - b.seat)[0].id
}

export function choicesRequired(state: GameState, id: PlayerId): number {
  return doubleCardPlayer(state) === id ? 2 : 1
}

/**
 * Les joueurs dont on attend un choix : les connectés, réduits aux joueurs
 * à égalité pendant une manche de mort subite.
 */
export function playersToAct(state: GameState): Player[] {
  const connected = state.players.filter((p) => p.connected)
  if (state.phase !== 'mort-subite') return connected
  const tied = new Set(tiedLeaders(state).map((p) => p.id))
  return connected.filter((p) => tied.has(p.id))
}

/** Les cartes jouables par ce joueur cette manche, verrou et carte de manche compris. */
export function legalCards(state: GameState, id: PlayerId): CardKey[] {
  const p = state.players.find((x) => x.id === id)
  if (!p) return []
  // Mort subite : Frapper obligatoire, aucun verrou.
  if (state.phase === 'mort-subite') return ['frapper']
  // « Mémoire courte » lève le verrou : chacun peut rejouer la carte passée.
  const locked = has(state, 'memoire-courte') ? [] : p.locked
  return CARD_KEYS.filter((k) => {
    if (locked.includes(k)) return false
    // « Trêve » : Frapper est interdit à tout le monde.
    if (k === 'frapper' && has(state, 'treve')) return false
    return true
  })
}

/** Une carte est-elle interdite par le verrou (et non par une carte de manche) ? */
export function isLocked(state: GameState, id: PlayerId, card: CardKey): boolean {
  if (has(state, 'memoire-courte')) return false
  return state.players.find((x) => x.id === id)?.locked.includes(card) ?? false
}

/**
 * Les murs que ce joueur peut viser avec cette carte.
 * Frapper ne vise jamais son camp ; en équipes, Bloquer et Réparer peuvent
 * viser le coéquipier.
 */
export function possibleTargets(state: GameState, id: PlayerId, card: CardKey): PlayerId[] {
  const me = state.players.find((x) => x.id === id)
  if (!me) return []
  // Mort subite : la cible est libre — n'importe quel mur, pas seulement ceux
  // des joueurs à égalité. C'est ce qui permet de départager : si les seuls
  // choix possibles étaient les adversaires à égalité, deux joueurs qui se
  // frappent mutuellement resteraient à égalité indéfiniment.
  if (state.phase === 'mort-subite') {
    return state.players.filter((p) => p.connected && p.id !== id).map((p) => p.id)
  }
  const others = state.players.filter((p) => p.connected)
  if (card === 'frapper') {
    return others
      .filter((p) => (me.team === null ? p.id !== id : p.team !== me.team))
      .map((p) => p.id)
  }
  if (card === 'bloquer' || card === 'reparer') {
    if (me.team === null) return [id]
    return others.filter((p) => p.team === me.team).map((p) => p.id)
  }
  // Piéger ne vise que soi-même.
  return [id]
}

export function needsTarget(state: GameState, id: PlayerId, card: CardKey): boolean {
  return possibleTargets(state, id, card).length > 1
}

/** Le choix est-il complet et jouable ? */
export function isChoiceValid(state: GameState, id: PlayerId, choice: Choice): boolean {
  if (!legalCards(state, id).includes(choice.card)) return false
  const targets = possibleTargets(state, id, choice.card)
  if (targets.length === 0) return false
  if (needsTarget(state, id, choice.card)) return !!choice.target && targets.includes(choice.target)
  return !choice.target || targets.includes(choice.target)
}

/**
 * Enregistre le choix d'un joueur. Modifiable jusqu'à la révélation :
 * on remplace, on n'empile pas — sauf quand deux cartes sont demandées.
 */
export function submitChoice(state: GameState, id: PlayerId, choices: Choice[]): GameState {
  const need = choicesRequired(state, id)
  const kept = choices.slice(0, need).filter((c) => isChoiceValid(state, id, c))
  return { ...state, choices: { ...state.choices, [id]: kept } }
}

export function hasPlayed(state: GameState, id: PlayerId): boolean {
  return (state.choices[id]?.length ?? 0) === choicesRequired(state, id)
}

/** Les joueurs déconnectés ne bloquent pas la manche : leurs cartes ne sont plus jouées. */
export function readyCount(state: GameState): { played: number; total: number } {
  const active = playersToAct(state)
  return { played: active.filter((p) => hasPlayed(state, p.id)).length, total: active.length }
}

export function allSubmitted(state: GameState): boolean {
  const { played, total } = readyCount(state)
  return total > 0 && played === total
}

/* ---------------------------------------------------------- résolution */

interface Strike {
  from: PlayerId
  to: PlayerId
}

/**
 * Résout la manche et renvoie le nouvel état, en phase révélation.
 * L'ordre des quatre étapes ne dépend jamais des joueurs.
 */
export function resolveRound(state: GameState): GameState {
  const players = state.players.map((p) => ({ ...p, wall: [...p.wall] }))
  const byId = new Map(players.map((p) => [p.id, p]))
  const before = new Map(players.map((p) => [p.id, bricks(p)]))
  // Le mur d'avant, emplacement par emplacement : c'est de là que part la
  // révélation, et c'est lui qui dit quelle brique tombe.
  const murAvant = new Map(players.map((p) => [p.id, [...p.wall]]))
  const events: RoundEvent[] = []

  const acting = new Set(playersToAct(state).map((p) => p.id))
  const active = players.filter((p) => acting.has(p.id))
  const played = new Map<PlayerId, Choice[]>()
  for (const p of active) played.set(p.id, state.choices[p.id] ?? [])
  for (const p of players) if (!p.connected) events.push({ t: 'absent', who: p.id })

  const cardsOf = (id: PlayerId, k: CardKey) => (played.get(id) ?? []).filter((c) => c.card === k)

  const strikeDamage = has(state, 'double-frappe') ? 2 : 1
  const repairAmount = has(state, 'double-frappe') ? 2 : 1
  const trapDamage = has(state, 'contre-attaque') ? 2 : 1

  // 1 · Les blocages se posent. Chaque joueur ayant joué Bloquer devient
  //     intouchable — ou rend son coéquipier intouchable en mode équipes.
  const blocked = new Set<PlayerId>()
  const blockerOf = new Map<PlayerId, PlayerId>()
  if (!has(state, 'mur-nu')) {
    for (const p of active) {
      for (const c of cardsOf(p.id, 'bloquer')) {
        const who = c.target ?? p.id
        blocked.add(who)
        blockerOf.set(who, p.id)
      }
    }
  }

  // 2 · Les pièges s'arment. Le piège renverra la frappe reçue sur son auteur.
  const trapped = new Set<PlayerId>()
  for (const p of active) if (cardsOf(p.id, 'pieger').length > 0) trapped.add(p.id)

  // 3 · Les frappes partent.
  const strikes: Strike[] = []
  for (const p of active) {
    for (const c of cardsOf(p.id, 'frapper')) {
      if (!c.target) continue
      strikes.push({ from: p.id, to: c.target })
      // « Ricochet » : la frappe touche aussi le joueur assis juste après la cible.
      if (has(state, 'ricochet')) {
        const target = byId.get(c.target)
        if (target) {
          const seats = [...active].sort((a, b) => a.seat - b.seat)
          const at = seats.findIndex((s) => s.id === target.id)
          const next = seats[(at + 1) % seats.length]
          if (next && next.id !== target.id) strikes.push({ from: p.id, to: next.id })
        }
      }
    }
  }

  for (const s of strikes) {
    const target = byId.get(s.to)
    const attacker = byId.get(s.from)
    if (!target || !attacker) continue
    if (blocked.has(s.to)) {
      events.push({ t: 'annulee', from: s.from, to: s.to })
      continue
    }
    if (trapped.has(s.to)) {
      // Le piège gagne toujours : l'attaquant prend le coup à sa place.
      const n = breakBricks(attacker.wall, trapDamage)
      events.push({ t: 'retournee', from: s.from, to: s.to, amount: n })
      continue
    }
    const n = breakBricks(target.wall, strikeDamage)
    events.push({ t: 'frappe', from: s.from, to: s.to, amount: n })
    // « Réquisition » : la brique cassée passe sur le mur de l'attaquant.
    if (has(state, 'requisition') && n > 0) {
      const got = repairBricks(attacker.wall, n)
      if (got > 0) events.push({ t: 'requisition', from: s.from, amount: got })
    }
  }

  // 4 · Les réparations comptent — en dernier, donc elles ne sauvent jamais
  //     d'une frappe de la même manche.
  for (const p of active) {
    for (const c of cardsOf(p.id, 'reparer')) {
      const who = byId.get(c.target ?? p.id)
      if (!who) continue
      const n = repairBricks(who.wall, repairAmount)
      events.push({ t: 'reparation', who: who.id, by: p.id, amount: n })
    }
  }

  // Le verrou : chaque carte jouée est interdite à la manche suivante.
  for (const p of players) {
    p.locked = p.connected ? (played.get(p.id) ?? []).map((c) => c.card) : []
  }

  const outcomes: PlayerOutcome[] = players.map((p) => {
    const delta = bricks(p) - (before.get(p.id) ?? 0)
    const { tag, hot } = tagFor(p.id, events, delta, p.connected)
    return {
      playerId: p.id,
      played: state.choices[p.id] ?? [],
      wallBefore: murAvant.get(p.id) ?? [...p.wall],
      tag,
      hot,
      delta,
    }
  })

  // « Cartes sur table » : on révèle du mur le plus bas au plus haut.
  const revealOrder = has(state, 'cartes-sur-table')
    ? [...players].sort((a, b) => bricks(a) - bricks(b) || a.seat - b.seat).map((p) => p.id)
    : [...players].sort((a, b) => a.seat - b.seat).map((p) => p.id)

  const outcome: RoundOutcome = { round: state.round, outcomes, events, revealOrder }
  return { ...state, players, phase: 'revelation', lastOutcome: outcome }
}

/** L'étiquette qui résume le sort d'un joueur, sur sa ligne de révélation. */
function tagFor(
  id: PlayerId,
  events: RoundEvent[],
  delta: number,
  connected: boolean,
): { tag: string; hot: boolean } {
  if (!connected) return { tag: 'absent', hot: false }

  const reflectedOnMe = events.find((e) => e.t === 'retournee' && e.from === id)
  if (reflectedOnMe && reflectedOnMe.t === 'retournee') {
    return { tag: `retourné −${reflectedOnMe.amount}`, hot: true }
  }
  if (events.some((e) => e.t === 'retournee' && e.to === id)) {
    return { tag: 'piège déclenché', hot: true }
  }

  const cancelled = events.filter((e) => e.t === 'annulee' && e.to === id).length
  if (cancelled > 0) {
    return { tag: cancelled === 1 ? '1 frappe annulée' : `${cancelled} frappes annulées`, hot: true }
  }
  if (events.some((e) => e.t === 'annulee' && e.from === id)) return { tag: 'annulé', hot: false }

  if (delta < 0) return { tag: `−${-delta} brique${-delta > 1 ? 's' : ''}`, hot: true }
  if (delta > 0) return { tag: `+${delta} brique${delta > 1 ? 's' : ''}`, hot: false }

  if (events.some((e) => e.t === 'reparation' && e.who === id)) return { tag: 'mur plein', hot: false }
  if (events.some((e) => e.t === 'frappe' && e.from === id)) return { tag: 'touché', hot: false }
  return { tag: '', hot: false }
}

/* --------------------------------------------------------------- fin */

export interface Standing {
  player: Player
  bricks: number
  /** Le score qui classe : le mur, ou la somme des deux murs en équipes. */
  score: number
  place: number
  winner: boolean
}

/** Le classement final. Le mur est le score. */
export function standings(state: GameState): Standing[] {
  const rows = state.players
    .map((p) => ({ player: p, bricks: bricks(p), score: score(state, p) }))
    .sort((a, b) => b.score - a.score || b.bricks - a.bricks || a.player.seat - b.player.seat)
  const top = rows.length > 0 ? rows[0].score : 0
  // Une partie terminée porte ses vainqueurs : après une mort subite bornée,
  // ils peuvent être plus restreints que « tous ceux au meilleur score ».
  const fixes = state.vainqueurs
  return rows.map((r, i) => ({
    ...r,
    place: i + 1,
    winner: fixes ? fixes.includes(r.player.id) : r.score === top,
  }))
}

/**
 * Combien de manches de mort subite on accepte de jouer.
 *
 * Les choix sont simultanés : deux joueurs à égalité qui se frappent
 * mutuellement perdent tous les deux une brique et restent à égalité. Sans
 * borne, la partie ne se termine jamais. Au-delà, on tranche.
 */
export const MORT_SUBITE_MAX = 3

/**
 * Clôt la partie et fixe les vainqueurs.
 *
 * `trancher` force un vainqueur unique — l'équipe entière en mode équipes —
 * quand la mort subite n'a pas départagé : le meilleur mur, puis la place à
 * la table. C'est arbitraire, mais c'est fini, et c'est écrit dans les règles.
 */
function terminer(state: GameState, trancher: boolean): GameState {
  const rows = standings({ ...state, vainqueurs: null })
  if (rows.length === 0) return { ...state, phase: 'fin', choices: {}, activeRoundCard: null }
  const top = rows[0].score
  const exaequo = rows.filter((r) => r.score === top)
  const retenus = trancher && exaequo.length > 1 ? [rows[0]] : exaequo
  const equipe = retenus[0].player.team
  const vainqueurs =
    equipe === null
      ? retenus.map((r) => r.player.id)
      : state.players.filter((p) => p.team === equipe).map((p) => p.id)
  return { ...state, phase: 'fin', choices: {}, activeRoundCard: null, vainqueurs }
}

/** La partie s'est-elle terminée sur une égalité que la mort subite n'a pas tranchée ? */
export function trancheeAuxPoints(state: GameState): boolean {
  if (state.phase !== 'fin' || !state.vainqueurs) return false
  const rows = standings({ ...state, vainqueurs: null })
  const top = rows.length > 0 ? rows[0].score : 0
  return rows.filter((r) => r.score === top).length > state.vainqueurs.length
}

/** Les joueurs à égalité en tête, s'ils sont plusieurs. */
export function tiedLeaders(state: GameState): Player[] {
  // On repart du classement brut : `vainqueurs`, une fois fixé, est justement
  // ce que cette fonction sert à décider.
  const rows = standings({ ...state, vainqueurs: null })
  if (rows.length === 0) return []
  const top = rows[0].score
  const meneurs = rows.filter((r) => r.score === top).map((r) => r.player)

  if (state.config.format === 'equipes') {
    // Les deux joueurs d'une même équipe partagent forcément le score commun :
    // ce n'est une égalité que si les DEUX équipes sont à hauteur.
    const equipes = new Set(meneurs.map((p) => p.team))
    return equipes.size > 1 ? meneurs : []
  }
  return meneurs.length > 1 ? meneurs : []
}

/**
 * Passe à la suite après une révélation : manche suivante, mort subite en cas
 * d'égalité à la dixième, ou fin de partie.
 */
export function advance(state: GameState): GameState {
  // On arrive ici depuis une révélation : la phase vaut déjà « revelation »,
  // donc c'est le compteur, pas la phase, qui dit qu'on est en mort subite.
  if (state.mortSubite > 0) {
    // Elle s'arrête dès qu'un seul des joueurs à égalité est encore en tête —
    // ou au bout de MORT_SUBITE_MAX manches, où l'on tranche.
    if (tiedLeaders(state).length <= 1) return terminer(state, false)
    if (state.mortSubite >= MORT_SUBITE_MAX) return terminer(state, true)
    return beginSuddenDeath(state)
  }
  if (state.round >= ROUNDS) {
    return tiedLeaders(state).length > 1 ? beginSuddenDeath(state) : terminer(state, false)
  }
  return beginRound({ ...state, round: state.round + 1 })
}

/**
 * Mort subite : Frapper obligatoire, cible libre parmi les joueurs à égalité.
 * Le premier qui perd une brique perd la partie.
 */
export function beginSuddenDeath(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((p) => ({ ...p, wall: clearMarks(p.wall), locked: [] })),
    phase: 'mort-subite',
    activeRoundCard: null,
    choices: {},
    lastOutcome: null,
    mortSubite: state.mortSubite + 1,
  }
}

/** En mort subite, seuls les joueurs à égalité jouent, et seulement Frapper. */
export function suddenDeathPlayers(state: GameState): PlayerId[] {
  return tiedLeaders(state).map((p) => p.id)
}

export function isOver(state: GameState): boolean {
  return state.phase === 'fin'
}
