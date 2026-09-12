import { describe, expect, it } from 'vitest'
import { bricks, legalCards, playersToAct, possibleTargets, standings } from '../game/engine'
import type { CardKey, Choice, PlayerId } from '../game/types'
import { creerTable, salonNeuf, type Table } from './table'

function table4(): Table {
  const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
  t.admettre('b', 'Malo', 'peer-b')
  t.admettre('c', 'Nour', 'peer-c')
  t.admettre('d', 'Iris', 'peer-d')
  return t
}

/** Fait jouer un choix légal à chaque joueur dont on attend encore la carte. */
function toutLeMondeJoue(
  t: Table,
  preference: CardKey[] = ['frapper', 'reparer', 'bloquer', 'pieger'],
) {
  const s = t.jeu!
  for (const p of playersToAct(s)) {
    const legales = legalCards(s, p.id)
    const carte = preference.find((k) => legales.includes(k)) ?? legales[0]
    const choix: Choice[] = [{ card: carte, target: possibleTargets(s, p.id, carte)[0] }]
    const seconde = legales.find((k) => k !== carte)
    if (seconde) choix.push({ card: seconde, target: possibleTargets(s, p.id, seconde)[0] })
    t.appliquer(p.id, { t: 'choix', choix })
  }
}

const mur = (t: Table, id: PlayerId) => bricks(t.jeu!.players.find((p) => p.id === id)!)

describe('le salon', () => {
  it('accueille jusqu’à quatre joueurs, chacun avec une forme distincte', () => {
    const t = table4()
    expect(t.salon.joueurs).toHaveLength(4)
    expect(new Set(t.salon.joueurs.map((j) => j.ci)).size).toBe(4)
  })

  it('refuse un cinquième joueur', () => {
    const t = table4()
    expect(t.admettre('e', 'Sam', null).admis).toBe(false)
    expect(t.salon.joueurs).toHaveLength(4)
  })

  it('refuse d’asseoir quelqu’un une fois la partie lancée', () => {
    const t = table4()
    t.lancer(1)
    expect(t.admettre('e', 'Sam', null).admis).toBe(false)
  })

  it('respecte le nombre de places réglé par l’hôte', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    t.reglerPlaces(2)
    expect(t.admettre('b', 'Malo', null).admis).toBe(true)
    expect(t.admettre('c', 'Nour', null).admis).toBe(false)
  })

  it('ne laisse pas voler une forme déjà prise', () => {
    const t = table4()
    expect(t.appliquer('b', { t: 'identite', ci: 0 })).toBe(false)
    expect(t.salon.joueurs.find((j) => j.clientId === 'b')!.ci).toBe(1)
  })

  it('laisse prendre une forme libre', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    t.admettre('b', 'Malo', null)
    expect(t.appliquer('b', { t: 'identite', ci: 3 })).toBe(true)
    expect(t.salon.joueurs.find((j) => j.clientId === 'b')!.ci).toBe(3)
  })

  it('ne change plus d’identité une fois la partie lancée', () => {
    const t = table4()
    t.lancer(1)
    expect(t.appliquer('b', { t: 'identite', ci: 1 })).toBe(false)
  })

  it('renomme un joueur, jusque dans la partie en cours', () => {
    const t = table4()
    t.lancer(1)
    expect(t.appliquer('b', { t: 'nom', nom: '  Maloune  ' })).toBe(true)
    expect(t.jeu!.players.find((p) => p.id === 'b')!.name).toBe('Maloune')
  })

  it('refuse un nom vide plutôt que d’effacer celui qu’on avait', () => {
    const t = table4()
    expect(t.appliquer('b', { t: 'nom', nom: '   ' })).toBe(false)
    expect(t.salon.joueurs.find((j) => j.clientId === 'b')!.nom).toBe('Malo')
  })

  it('ne lance pas une partie à un seul joueur', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    t.lancer(1)
    expect(t.jeu).toBeNull()
    expect(t.salon.lancee).toBe(false)
  })

  it('ne lance pas un deux contre deux à trois joueurs', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    t.admettre('b', 'Malo', null)
    t.admettre('c', 'Nour', null)
    t.reglerFormat('equipes')
    t.lancer(1)
    expect(t.jeu).toBeNull()
  })

  it('un joueur qui part avant le lancement libère sa place', () => {
    const t = table4()
    t.sortir('d')
    expect(t.salon.joueurs).toHaveLength(3)
    expect(t.admettre('e', 'Sam', null).admis).toBe(true)
  })
})

describe('le numéro d’état', () => {
  it('avance à chaque changement — c’est lui qui date un état', () => {
    const t = table4()
    t.lancer(7)
    const debut = t.jeu!.seq
    t.appliquer('a', { t: 'choix', choix: [{ card: 'reparer' }] })
    expect(t.jeu!.seq).toBe(debut + 1)
  })

  it('repart de zéro à la revanche — c’est le numéro de partie qui prend le relais', () => {
    const t = table4()
    t.lancer(7)
    t.appliquer('a', { t: 'choix', choix: [{ card: 'reparer' }] })
    const partie = t.salon.round
    t.rejouer(9)
    expect(t.jeu!.seq).toBe(0)
    expect(t.salon.round).toBe(partie + 1)
  })
})

describe('une partie complète', () => {
  it('va de la première manche à la fin, cartes de manche comprises', () => {
    const t = table4()
    t.reglerCartesManche(true)
    t.lancer(42)

    let gardeFou = 0
    while (t.jeu!.phase !== 'fin' && gardeFou++ < 60) {
      const phase = t.jeu!.phase
      if (phase === 'carte-manche' || phase === 'revelation') t.appliquer('a', { t: 'suite' })
      else toutLeMondeJoue(t)
    }

    const s = t.jeu!
    expect(s.phase).toBe('fin')
    expect(s.round).toBeLessThanOrEqual(10)
    // Trois cartes de manche tirées, toutes différentes.
    expect(s.usedRoundCards).toHaveLength(3)
    expect(new Set(s.usedRoundCards).size).toBe(3)
    const rangs = standings(s)
    expect(rangs).toHaveLength(4)
    expect(rangs.filter((r) => r.winner).length).toBeGreaterThanOrEqual(1)
  })

  it('la manche se résout d’elle-même dès que le dernier joueur a choisi', () => {
    const t = table4()
    t.reglerCartesManche(false)
    t.lancer(7)
    expect(t.jeu!.phase).toBe('choix')

    for (const id of ['a', 'b', 'c']) t.appliquer(id, { t: 'choix', choix: [{ card: 'reparer' }] })
    expect(t.jeu!.phase).toBe('choix') // il manque encore Iris

    t.appliquer('d', { t: 'choix', choix: [{ card: 'reparer' }] })
    expect(t.jeu!.phase).toBe('revelation')
    expect(t.jeu!.lastOutcome).not.toBeNull()
  })

  it('refuse un choix illégal venu d’un client bricolé, et le dit', () => {
    const t = table4()
    t.reglerCartesManche(false)
    t.lancer(7)
    for (const id of ['a', 'b', 'c', 'd']) {
      t.appliquer(id, { t: 'choix', choix: [{ card: 'bloquer' }] })
    }
    t.appliquer('a', { t: 'suite' })
    // Bloquer est maintenant verrouillé : le rejouer doit être refusé.
    expect(t.appliquer('a', { t: 'choix', choix: [{ card: 'bloquer' }] })).toBe(false)
    expect(t.jeu!.choices['a']).toBeUndefined()
  })

  it('ne laisse pas frapper son propre mur', () => {
    const t = table4()
    t.lancer(7)
    expect(t.appliquer('a', { t: 'choix', choix: [{ card: 'frapper', target: 'a' }] })).toBe(false)
  })

  it('ne laisse pas passer la révélation quand il n’y a rien à passer', () => {
    const t = table4()
    t.lancer(7)
    expect(t.appliquer('a', { t: 'suite' })).toBe(false)
  })

  it('un départ en pleine manche débloque la résolution', () => {
    const t = table4()
    t.reglerCartesManche(false)
    t.lancer(7)
    for (const id of ['a', 'b', 'c']) t.appliquer(id, { t: 'choix', choix: [{ card: 'reparer' }] })
    expect(t.jeu!.phase).toBe('choix')
    t.sortir('d')
    expect(t.jeu!.phase).toBe('revelation')
    // Son mur reste en place.
    expect(mur(t, 'd')).toBe(5)
  })

  it('un joueur revenu retrouve sa place et son mur', () => {
    const t = table4()
    t.reglerCartesManche(false)
    t.lancer(7)
    for (const id of ['a', 'b', 'c']) {
      t.appliquer(id, { t: 'choix', choix: [{ card: 'frapper', target: 'd' }] })
    }
    t.sortir('d')
    expect(mur(t, 'd')).toBe(2) // trois frappes sont passées

    t.revenir('d', 'Iris', 'peer-d2')
    const iris = t.jeu!.players.find((p) => p.id === 'd')!
    expect(iris.connected).toBe(true)
    expect(bricks(iris)).toBe(2)
    expect(t.salon.joueurs.find((j) => j.clientId === 'd')!.peerId).toBe('peer-d2')
  })

  it('« Rejouer avec les mêmes » remet les murs à cinq et garde le salon', () => {
    const t = table4()
    t.reglerCartesManche(false)
    t.lancer(7)
    for (const id of ['a', 'b', 'c']) {
      t.appliquer(id, { t: 'choix', choix: [{ card: 'frapper', target: 'd' }] })
    }
    t.appliquer('d', { t: 'choix', choix: [{ card: 'reparer' }] })
    t.rejouer(9)
    const s = t.jeu!
    expect(s.round).toBe(1)
    expect(s.players.map(bricks)).toEqual([5, 5, 5, 5])
    expect(s.players.every((p) => p.locked.length === 0)).toBe(true)
    expect(t.salon.joueurs).toHaveLength(4)
  })

  it('joue une partie en équipes de bout en bout, score commun compris', () => {
    const t = table4()
    t.reglerFormat('equipes')
    t.reglerCartesManche(false)
    t.lancer(11)
    expect(t.jeu!.players.map((p) => p.team)).toEqual([0, 1, 0, 1])

    let gardeFou = 0
    while (t.jeu!.phase !== 'fin' && gardeFou++ < 40) {
      if (t.jeu!.phase === 'revelation') t.appliquer('a', { t: 'suite' })
      else toutLeMondeJoue(t)
    }
    expect(t.jeu!.phase).toBe('fin')

    const parEquipe = new Map<number, number[]>()
    for (const r of standings(t.jeu!)) {
      const eq = r.player.team!
      parEquipe.set(eq, [...(parEquipe.get(eq) ?? []), r.score])
    }
    for (const scores of parEquipe.values()) expect(new Set(scores).size).toBe(1)
  })
})
