import { describe, expect, it } from 'vitest'
import {
  acknowledgeRoundCard,
  advance,
  allSubmitted,
  beginRound,
  bricks,
  choicesRequired,
  createGame,
  doubleCardPlayer,
  legalCards,
  MORT_SUBITE_MAX,
  possibleTargets,
  readyCount,
  replay,
  resolveRound,
  score,
  standings,
  submitChoice,
  tiedLeaders,
  trancheeAuxPoints,
} from './engine'
import { roundCardById } from './roundCards'
import { WALL_SIZE, type Choice, type GameState, type PlayerId } from './types'

const SEATS = [
  { id: 'a', name: 'Léa', ci: 0 as const },
  { id: 'b', name: 'Malo', ci: 1 as const },
  { id: 'c', name: 'Nour', ci: 2 as const },
  { id: 'd', name: 'Iris', ci: 3 as const },
]

function game(over: Partial<GameState> = {}): GameState {
  const g = createGame(SEATS, { format: 'chacun', roundCards: false }, 1)
  return { ...g, phase: 'choix', ...over }
}

function play(state: GameState, moves: Record<PlayerId, Choice | Choice[]>): GameState {
  let s = state
  for (const [id, c] of Object.entries(moves)) s = submitChoice(s, id, Array.isArray(c) ? c : [c])
  return s
}

const wallOf = (s: GameState, id: PlayerId) => bricks(s.players.find((p) => p.id === id)!)

/** Casse `n` briques sur un mur, pour poser une situation de départ. */
function damage(s: GameState, id: PlayerId, n: number): GameState {
  return {
    ...s,
    players: s.players.map((p) =>
      p.id === id ? { ...p, wall: p.wall.map((w, i) => (i >= p.wall.length - n ? 'broken' : w)) } : p,
    ),
  }
}

describe('le mur', () => {
  it('part à cinq briques pour tout le monde', () => {
    const s = game()
    expect(s.players.map((p) => bricks(p))).toEqual([5, 5, 5, 5])
  })

  it('garde sa largeur quand une brique casse : l’emplacement reste, creux', () => {
    let s = play(game(), { a: { card: 'frapper', target: 'b' } })
    s = resolveRound(s)
    const malo = s.players.find((p) => p.id === 'b')!
    expect(malo.wall).toHaveLength(5)
    expect(malo.wall.filter((x) => x === 'broken')).toHaveLength(1)
  })
})

describe('les quatre cartes', () => {
  it('Frapper casse une brique chez la cible', () => {
    const s = resolveRound(play(game(), { a: { card: 'frapper', target: 'b' } }))
    expect(wallOf(s, 'b')).toBe(4)
    expect(wallOf(s, 'a')).toBe(5)
  })

  it('Bloquer annule toutes les frappes sur soi cette manche', () => {
    const s = resolveRound(
      play(game(), {
        a: { card: 'frapper', target: 'b' },
        b: { card: 'bloquer' },
        c: { card: 'frapper', target: 'b' },
      }),
    )
    // Un seul Bloquer annule les deux frappes — la carte la plus rentable
    // quand on est la cible évidente.
    expect(wallOf(s, 'b')).toBe(5)
    expect(s.lastOutcome!.events.filter((e) => e.t === 'annulee')).toHaveLength(2)
  })

  it('Piéger renvoie la frappe sur son auteur, et la cible ne perd rien', () => {
    const s = resolveRound(
      play(game(), { a: { card: 'frapper', target: 'c' }, c: { card: 'pieger' } }),
    )
    expect(wallOf(s, 'a')).toBe(4)
    expect(wallOf(s, 'c')).toBe(5)
  })

  it('Réparer remet une brique, mais ne défend pas', () => {
    let s = resolveRound(play(game(), { a: { card: 'frapper', target: 'b' } }))
    s = beginRound({ ...s, round: 2 })
    s = resolveRound(play(s, { b: { card: 'reparer' }, a: { card: 'bloquer' } }))
    expect(wallOf(s, 'b')).toBe(5)
  })

  it('Réparer un mur plein est jouable mais ne donne rien', () => {
    const s = resolveRound(play(game(), { a: { card: 'reparer' } }))
    expect(wallOf(s, 'a')).toBe(5)
  })
})

describe('l’ordre de résolution', () => {
  it('les réparations comptent en dernier : elles ne sauvent pas d’une frappe de la même manche', () => {
    let s = resolveRound(play(game(), { a: { card: 'frapper', target: 'b' } }))
    s = beginRound({ ...s, round: 2 })
    expect(wallOf(s, 'b')).toBe(4)
    // Malo répare pendant que Nour frappe : il encaisse puis répare, donc il reste à 4.
    s = resolveRound(play(s, { b: { card: 'reparer' }, c: { card: 'frapper', target: 'b' } }))
    expect(wallOf(s, 'b')).toBe(4)
  })

  it('le piège gagne toujours : deux joueurs qui se frappent, seul le piégeur ressort intact', () => {
    const s = resolveRound(
      play(game(), { a: { card: 'frapper', target: 'b' }, b: { card: 'pieger' } }),
    )
    expect(wallOf(s, 'b')).toBe(5)
    expect(wallOf(s, 'a')).toBe(4)
  })

  it('deux frappes sur le même mur s’additionnent', () => {
    const s = resolveRound(
      play(game(), {
        a: { card: 'frapper', target: 'd' },
        b: { card: 'frapper', target: 'd' },
      }),
    )
    expect(wallOf(s, 'd')).toBe(3)
  })
})

describe('le verrou', () => {
  it('interdit à la manche suivante la carte qu’on vient de jouer', () => {
    let s = resolveRound(play(game(), { a: { card: 'bloquer' } }))
    s = beginRound({ ...s, round: 2 })
    expect(legalCards(s, 'a')).not.toContain('bloquer')
    expect(legalCards(s, 'a')).toHaveLength(3)
  })

  it('rend impossible de bloquer deux fois de suite', () => {
    let s = resolveRound(play(game(), { a: { card: 'bloquer' } }))
    s = beginRound({ ...s, round: 2 })
    // Un choix illégal est simplement refusé.
    s = submitChoice(s, 'a', [{ card: 'bloquer' }])
    expect(s.choices['a']).toEqual([])
  })

  it('ne dure qu’une manche', () => {
    let s = resolveRound(play(game(), { a: { card: 'bloquer' } }))
    s = beginRound({ ...s, round: 2 })
    s = resolveRound(play(s, { a: { card: 'reparer' } }))
    s = beginRound({ ...s, round: 3 })
    expect(legalCards(s, 'a')).toContain('bloquer')
    expect(legalCards(s, 'a')).not.toContain('reparer')
  })
})

describe('les cartes de manche', () => {
  const withCard = (id: string) => {
    const s = game({ config: { format: 'chacun', roundCards: true }, round: 3 })
    return { ...s, activeRoundCard: roundCardById(id)!, phase: 'choix' as const }
  }

  it('Double frappe : Frapper casse deux briques, Réparer en remet deux', () => {
    let s = resolveRound(play(withCard('double-frappe'), { a: { card: 'frapper', target: 'b' } }))
    expect(wallOf(s, 'b')).toBe(3)
    s = { ...beginRound({ ...s, round: 4 }), activeRoundCard: roundCardById('double-frappe')! }
    s = resolveRound(play({ ...s, phase: 'choix' }, { b: { card: 'reparer' } }))
    expect(wallOf(s, 'b')).toBe(5)
  })

  it('Mur nu : Bloquer n’a aucun effet', () => {
    const s = resolveRound(
      play(withCard('mur-nu'), { a: { card: 'frapper', target: 'b' }, b: { card: 'bloquer' } }),
    )
    expect(wallOf(s, 'b')).toBe(4)
  })

  it('Trêve : Frapper est interdit à tout le monde', () => {
    const s = withCard('treve')
    expect(legalCards(s, 'a')).not.toContain('frapper')
    expect(legalCards(s, 'a')).toEqual(['bloquer', 'reparer', 'pieger'])
  })

  it('Ricochet : la frappe touche aussi le joueur assis juste après la cible', () => {
    const s = resolveRound(play(withCard('ricochet'), { a: { card: 'frapper', target: 'b' } }))
    expect(wallOf(s, 'b')).toBe(4)
    expect(wallOf(s, 'c')).toBe(4)
    expect(wallOf(s, 'd')).toBe(5)
  })

  it('Réquisition : la brique cassée passe sur le mur de l’attaquant', () => {
    let s = resolveRound(play(game(), { b: { card: 'frapper', target: 'a' } }))
    expect(wallOf(s, 'a')).toBe(4)
    // Léa est à 4 ; elle frappe Malo sous Réquisition et récupère la brique.
    s = { ...beginRound({ ...s, round: 3 }), activeRoundCard: roundCardById('requisition')!, phase: 'choix' }
    s = resolveRound(play(s, { a: { card: 'frapper', target: 'c' } }))
    expect(wallOf(s, 'c')).toBe(4)
    expect(wallOf(s, 'a')).toBe(5)
  })

  it('Mémoire courte : le verrou est levé, on peut rejouer la carte passée', () => {
    let s = resolveRound(play(game(), { a: { card: 'bloquer' } }))
    s = { ...beginRound({ ...s, round: 3 }), activeRoundCard: roundCardById('memoire-courte')!, phase: 'choix' }
    expect(legalCards(s, 'a')).toContain('bloquer')
  })

  it('Contre-attaque : les pièges renvoient deux briques', () => {
    const s = resolveRound(
      play(withCard('contre-attaque'), { a: { card: 'frapper', target: 'c' }, c: { card: 'pieger' } }),
    )
    expect(wallOf(s, 'a')).toBe(3)
  })

  it('Cartes sur table : la révélation va du mur le plus bas au plus haut', () => {
    let s = resolveRound(
      play(game(), { a: { card: 'frapper', target: 'd' }, b: { card: 'frapper', target: 'c' } }),
    )
    s = { ...beginRound({ ...s, round: 6 }), activeRoundCard: roundCardById('cartes-sur-table')!, phase: 'choix' }
    s = resolveRound(play(s, { a: { card: 'bloquer' } }))
    const order = s.lastOutcome!.revealOrder.map((id) => wallOf(s, id))
    expect(order).toEqual([...order].sort((x, y) => x - y))
  })

  it('Dernier mur : le joueur le plus bas joue deux cartes', () => {
    let s = resolveRound(
      play(game(), { a: { card: 'frapper', target: 'd' }, b: { card: 'frapper', target: 'd' } }),
    )
    s = { ...beginRound({ ...s, round: 6 }), activeRoundCard: roundCardById('dernier-mur')!, phase: 'choix' }
    expect(doubleCardPlayer(s)).toBe('d')
    expect(choicesRequired(s, 'd')).toBe(2)
    expect(choicesRequired(s, 'a')).toBe(1)
    // Nour n'a rien joué à la manche passée : Frapper lui est encore ouvert.
    s = play(s, { d: [{ card: 'reparer' }, { card: 'bloquer' }], c: { card: 'frapper', target: 'd' } })
    expect(allSubmitted(s)).toBe(false) // il manque encore Léa et Malo
    s = play(s, { a: { card: 'reparer' }, b: { card: 'reparer' } })
    expect(allSubmitted(s)).toBe(true)
    s = resolveRound(s)
    // Iris a bloqué la frappe et réparé : de 3 elle remonte à 4.
    expect(wallOf(s, 'd')).toBe(4)
    expect(s.players.find((p) => p.id === 'd')!.locked.slice().sort()).toEqual(['bloquer', 'reparer'])
  })

  it('une carte tirée ne revient pas dans la même partie', () => {
    let s = game({ config: { format: 'chacun', roundCards: true }, round: 3 })
    s = beginRound(s)
    const first = s.activeRoundCard!.id
    expect(s.phase).toBe('carte-manche')
    s = beginRound({ ...acknowledgeRoundCard(s), round: 6 })
    expect(s.activeRoundCard!.id).not.toBe(first)
    expect(s.usedRoundCards).toHaveLength(2)
  })

  it('n’apparaissent qu’aux manches 3, 6 et 9, et seulement si elles sont activées', () => {
    const on = game({ config: { format: 'chacun', roundCards: true }, round: 4 })
    expect(beginRound(on).activeRoundCard).toBeNull()
    const off = game({ config: { format: 'chacun', roundCards: false }, round: 3 })
    expect(beginRound(off).activeRoundCard).toBeNull()
  })
})

describe('le mode équipes', () => {
  const teamGame = () => {
    const g = createGame(
      [
        { id: 'a', name: 'Léa', ci: 0, team: 0 },
        { id: 'b', name: 'Malo', ci: 1, team: 1 },
        { id: 'c', name: 'Nour', ci: 2, team: 0 },
        { id: 'd', name: 'Iris', ci: 3, team: 1 },
      ],
      { format: 'equipes', roundCards: false },
      1,
    )
    return { ...g, phase: 'choix' as const }
  }

  it('Frapper ne vise que l’équipe d’en face', () => {
    expect(possibleTargets(teamGame(), 'a', 'frapper').sort()).toEqual(['b', 'd'])
  })

  it('Réparer peut viser le coéquipier', () => {
    expect(possibleTargets(teamGame(), 'a', 'reparer').sort()).toEqual(['a', 'c'])
  })

  it('un joueur répare le mur de son coéquipier', () => {
    let s = resolveRound(play(teamGame(), { b: { card: 'frapper', target: 'c' } }))
    expect(wallOf(s, 'c')).toBe(4)
    s = { ...beginRound({ ...s, round: 2 }), phase: 'choix' }
    s = resolveRound(play(s, { a: { card: 'reparer', target: 'c' } }))
    expect(wallOf(s, 'c')).toBe(5)
  })

  it('Bloquer protège le coéquipier', () => {
    const s = resolveRound(
      play(teamGame(), { a: { card: 'bloquer', target: 'c' }, b: { card: 'frapper', target: 'c' } }),
    )
    expect(wallOf(s, 'c')).toBe(5)
  })

  it('le score est commun : on additionne les deux murs', () => {
    const s = resolveRound(play(teamGame(), { b: { card: 'frapper', target: 'c' } }))
    const lea = s.players.find((p) => p.id === 'a')!
    expect(score(s, lea)).toBe(9)
  })
})

describe('les cas particuliers', () => {
  it('personne n’est éliminé : un mur à zéro continue de jouer et peut réparer', () => {
    let s = game()
    for (let r = 1; r <= 5; r++) {
      s = resolveRound(play({ ...s, choices: {} }, { a: { card: 'frapper', target: 'b' } }))
      s = { ...beginRound({ ...s, round: r + 1 }), phase: 'choix' }
      // Léa alterne pour ne pas buter sur son propre verrou.
      s = { ...s, players: s.players.map((p) => (p.id === 'a' ? { ...p, locked: [] } : p)) }
    }
    expect(wallOf(s, 'b')).toBe(0)
    expect(s.players.find((p) => p.id === 'b')!.connected).toBe(true)
    s = resolveRound(play(s, { b: { card: 'reparer' } }))
    expect(wallOf(s, 'b')).toBe(1)
  })

  it('un joueur déconnecté ne bloque pas la manche et son mur reste en place', () => {
    let s = game()
    s = { ...s, players: s.players.map((p) => (p.id === 'd' ? { ...p, connected: false } : p)) }
    expect(readyCount(s).total).toBe(3)
    s = play(s, {
      a: { card: 'frapper', target: 'b' },
      b: { card: 'bloquer' },
      c: { card: 'reparer' },
    })
    expect(allSubmitted(s)).toBe(true)
    s = resolveRound(s)
    expect(wallOf(s, 'd')).toBe(5)
    expect(s.lastOutcome!.events.some((e) => e.t === 'absent' && e.who === 'd')).toBe(true)
  })

  it('une frappe ne peut pas viser un joueur déconnecté', () => {
    const s = { ...game(), players: game().players.map((p) => (p.id === 'd' ? { ...p, connected: false } : p)) }
    expect(possibleTargets(s, 'a', 'frapper')).not.toContain('d')
  })
})

describe('la fin de partie', () => {
  it('classe par briques debout et désigne le gagnant', () => {
    let s = game()
    s = resolveRound(
      play(s, { a: { card: 'frapper', target: 'c' }, b: { card: 'frapper', target: 'c' } }),
    )
    const rows = standings(s)
    expect(rows[rows.length - 1].player.id).toBe('c')
    expect(rows[0].place).toBe(1)
  })

  it('à égalité à la dixième manche, on passe en mort subite', () => {
    let s = game({ round: 10 })
    s = resolveRound(play(s, { a: { card: 'reparer' } }))
    expect(tiedLeaders(s)).toHaveLength(4)
    s = advance(s)
    expect(s.phase).toBe('mort-subite')
    // Frapper obligatoire, cible libre parmi les joueurs à égalité.
    expect(legalCards(s, 'a')).toEqual(['frapper'])
    expect(possibleTargets(s, 'a', 'frapper').sort()).toEqual(['b', 'c', 'd'])
  })

  it('le premier qui perd une brique en mort subite perd la partie', () => {
    // Deux joueurs à 5, deux à 3 : l'égalité n'oppose que Léa et Malo, et elle
    // continue de ne concerner qu'eux même après qu'ils ont encaissé une brique.
    let s = damage(damage(game({ round: 10 }), 'c', 2), 'd', 2)
    s = resolveRound(play(s, { a: { card: 'reparer' }, b: { card: 'reparer' } }))
    s = advance(s)
    expect(s.phase).toBe('mort-subite')
    expect(
      tiedLeaders(s)
        .map((p) => p.id)
        .sort(),
    ).toEqual(['a', 'b'])

    // Ils se frappent mutuellement : les deux perdent une brique, toujours à
    // égalité — la mort subite se rejoue.
    s = resolveRound(
      play(s, { a: { card: 'frapper', target: 'b' }, b: { card: 'frapper', target: 'a' } }),
    )
    s = advance(s)
    expect(s.phase).toBe('mort-subite')

    // Cible libre : Léa vise ailleurs, Malo la vise. Léa perd la brique, donc
    // Malo gagne la partie.
    s = resolveRound(
      play(s, { a: { card: 'frapper', target: 'c' }, b: { card: 'frapper', target: 'a' } }),
    )
    s = advance(s)
    expect(s.phase).toBe('fin')
    expect(standings(s)[0].player.id).toBe('b')
  })

  it('en équipes, une équipe qui mène n’est pas prise pour une égalité', () => {
    // Les deux joueurs d'une même équipe partagent le score commun : sans
    // précaution, le classement les lit comme deux meneurs à égalité.
    const teams = createGame(
      [
        { id: 'a', name: 'Léa', ci: 0, team: 0 },
        { id: 'b', name: 'Malo', ci: 1, team: 1 },
        { id: 'c', name: 'Nour', ci: 2, team: 0 },
        { id: 'd', name: 'Iris', ci: 3, team: 1 },
      ],
      { format: 'equipes', roundCards: false },
      1,
    )
    let s: GameState = damage({ ...teams, round: 10, phase: 'choix' }, 'a', 2)
    s = resolveRound(s)
    expect(tiedLeaders(s)).toHaveLength(0)
    s = advance(s)
    expect(s.phase).toBe('fin')
    // L'équipe entière gagne, pas seulement le joueur le mieux classé.
    expect(s.vainqueurs!.sort()).toEqual(['b', 'd'])
  })

  it('la mort subite est bornée : au bout de trois manches, on tranche', () => {
    let s = game({ round: 10 })
    s = resolveRound(play(s, { a: { card: 'reparer' } }))
    s = advance(s)
    expect(s.phase).toBe('mort-subite')

    // Tout le monde vise le même mur déjà à zéro : rien ne bouge, l'égalité
    // ne peut pas se résoudre d'elle-même.
    s = { ...s, players: s.players.map((p) => (p.id === 'd' ? { ...p, wall: p.wall.map(() => 'broken' as const) } : p)) }
    for (let i = 0; i < MORT_SUBITE_MAX + 2 && s.phase !== 'fin'; i++) {
      s = resolveRound(
        play(s, {
          a: { card: 'frapper', target: 'd' },
          b: { card: 'frapper', target: 'd' },
          c: { card: 'frapper', target: 'd' },
        }),
      )
      s = advance(s)
    }
    expect(s.phase).toBe('fin')
    expect(s.mortSubite).toBeLessThanOrEqual(MORT_SUBITE_MAX)
    // Un seul vainqueur, désigné par la place à la table, et l'app le sait.
    expect(s.vainqueurs).toHaveLength(1)
    expect(trancheeAuxPoints(s)).toBe(true)
    expect(standings(s).filter((r) => r.winner)).toHaveLength(1)
  })

  it('une victoire nette n’est pas annoncée comme tranchée', () => {
    let s = damage(damage(damage(game({ round: 10 }), 'b', 1), 'c', 2), 'd', 3)
    s = advance(resolveRound(play(s, { a: { card: 'reparer' } })))
    expect(s.phase).toBe('fin')
    expect(trancheeAuxPoints(s)).toBe(false)
  })

  it('la partie s’arrête à la dixième manche quand il n’y a pas d’égalité', () => {
    let s = damage(damage(damage(game({ round: 10 }), 'b', 1), 'c', 2), 'd', 3)
    s = resolveRound(play(s, { a: { card: 'bloquer' } }))
    s = advance(s)
    expect(s.phase).toBe('fin')
    expect(standings(s)[0].player.id).toBe('a')
    expect(standings(s).map((r) => r.player.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('enchaîne les dix manches sans jamais dépasser', () => {
    let s = beginRound(game({ round: 1, config: { format: 'chacun', roundCards: true } }))
    for (let i = 0; i < 30 && s.phase !== 'fin' && s.phase !== 'mort-subite'; i++) {
      s = acknowledgeRoundCard(s)
      for (const p of s.players) {
        const legal = legalCards(s, p.id)
        const card = legal[0]
        const targets = possibleTargets(s, p.id, card)
        s = submitChoice(s, p.id, [{ card, target: targets[0] }])
      }
      s = resolveRound(s)
      s = advance(s)
    }
    expect(s.round).toBeLessThanOrEqual(10)
    expect(['fin', 'mort-subite']).toContain(s.phase)
  })
})

describe('la mémoire de la partie', () => {
  function troisManches(): GameState {
    let s = game()
    for (let i = 0; i < 3; i++) {
      // On alterne pour ne jamais rejouer une carte verrouillée.
      const mienne = i % 2 === 0 ? 'frapper' : 'reparer'
      s = submitChoice(s, 'a', [{ card: mienne, target: 'b' }])
      s = submitChoice(s, 'b', [{ card: i % 2 === 0 ? 'bloquer' : 'pieger' }])
      s = submitChoice(s, 'c', [{ card: i % 2 === 0 ? 'reparer' : 'frapper', target: 'a' }])
      s = submitChoice(s, 'd', [{ card: i % 2 === 0 ? 'pieger' : 'bloquer' }])
      s = advance(resolveRound(s))
    }
    return s
  }

  it('garde une entrée par manche jouée, dans l’ordre', () => {
    const s = troisManches()
    expect(s.history).toHaveLength(3)
    expect(s.history!.map((m) => m.round)).toEqual([1, 2, 3])
  })

  it('garde ce que chacun a joué et ce qu’il lui restait', () => {
    const s = troisManches()
    const premiere = s.history![0]
    expect(premiere.joue.a).toEqual(['frapper'])
    expect(premiere.joue.b).toEqual(['bloquer'])
    // « b » avait bloqué : son mur est intact au sortir de la manche 1.
    expect(premiere.briques.b).toBe(WALL_SIZE)
  })

  it('repart de zéro à la revanche : c’est une autre partie', () => {
    const s = troisManches()
    expect(replay(s, 2).history).toEqual([])
  })

  it('ne change rien à ce que le moteur décide', () => {
    // La mémoire est un état d'AFFICHAGE. Une manche résolue sur un état qui
    // n'en porte pas doit donner exactement les mêmes murs, les mêmes verrous
    // et la même phase.
    const depart = game()
    const avec = play(depart, {
      a: { card: 'frapper', target: 'b' },
      b: { card: 'bloquer' },
      c: { card: 'reparer' },
      d: { card: 'pieger' },
    })
    const sans = { ...avec, history: undefined }
    const r1 = resolveRound(avec)
    const r2 = resolveRound(sans)
    expect(r2.players).toEqual(r1.players)
    expect(r2.phase).toBe(r1.phase)
    expect(r2.lastOutcome).toEqual(r1.lastOutcome)
    // Et la mémoire démarre toute seule sur un état qui n'en avait pas.
    expect(r2.history).toHaveLength(1)
  })
})
