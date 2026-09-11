import { describe, expect, it } from 'vitest'
import { choisirBot } from './bot'
import {
  advance,
  beginRound,
  createGame,
  isChoiceValid,
  playersToAct,
  resolveRound,
  submitChoice,
} from './engine'
import type { CardKey, GameState, Slot } from './types'

const SIEGES = [
  { id: 'a', name: 'Léa', ci: 0 as const },
  { id: 'b', name: 'Truelle', ci: 1 as const },
  { id: 'c', name: 'Maillet', ci: 2 as const },
]

function partie(seed = 7): GameState {
  return beginRound(createGame(SIEGES, { format: 'chacun', roundCards: false }, seed))
}

/** « IIBBB » : trois briques cassées à droite. */
const mur = (s: string): Slot[] => [...s].map((c) => (c === 'B' ? 'broken' : 'intact'))

function avecMurs(jeu: GameState, murs: Record<string, string>): GameState {
  return {
    ...jeu,
    players: jeu.players.map((p) => (murs[p.id] ? { ...p, wall: mur(murs[p.id]) } : p)),
  }
}

function avecVerrous(jeu: GameState, verrous: Record<string, CardKey[]>): GameState {
  return {
    ...jeu,
    players: jeu.players.map((p) => ({ ...p, locked: verrous[p.id] ?? p.locked })),
  }
}

/** Ce que le bot joue sur cent graines : la distribution, pas le coup. */
function surCentGraines(fabrique: (jeu: GameState) => GameState, qui = 'b'): CardKey[] {
  const cartes: CardKey[] = []
  for (let seed = 0; seed < 100; seed++) {
    const jeu = fabrique(partie(seed))
    cartes.push(...choisirBot(jeu, qui).map((c) => c.card))
  }
  return cartes
}

const part = (cartes: CardKey[], k: CardKey) => cartes.filter((c) => c === k).length / cartes.length

describe('le bot', () => {
  it('ne joue que des coups que le moteur accepte', () => {
    for (let seed = 0; seed < 200; seed++) {
      const jeu = partie(seed)
      for (const p of jeu.players) {
        for (const choix of choisirBot(jeu, p.id)) {
          expect(isChoiceValid(jeu, p.id, choix)).toBe(true)
        }
      }
    }
  })

  it('pose exactement une carte, et deux quand « Dernier mur » l’exige', () => {
    const jeu = partie()
    expect(choisirBot(jeu, 'b')).toHaveLength(1)

    const dernierMur: GameState = {
      ...avecMurs(jeu, { b: 'IBBBB' }),
      activeRoundCard: { id: 'dernier-mur', n: 'Dernier mur', axis: '', d: '', why: '' },
    }
    const deux = choisirBot(dernierMur, 'b')
    expect(deux).toHaveLength(2)
    // Deux fois la même carte serait jouable, et n'aurait aucun sens.
    expect(deux[0].card).not.toBe(deux[1].card)
  })

  it('ne rejoue jamais la carte verrouillée', () => {
    const cartes = surCentGraines((jeu) => avecVerrous(jeu, { b: ['frapper'] }))
    expect(part(cartes, 'frapper')).toBe(0)
  })

  it('ne part pas à l’attaque avec un mur à une brique', () => {
    const cartes = surCentGraines((jeu) => avecMurs(jeu, { b: 'IBBBB' }))
    expect(part(cartes, 'frapper')).toBeLessThan(0.1)
  })

  it('répare son mur troué quand la manche ne peut pas le frapper', () => {
    const cartes = surCentGraines((jeu) =>
      avecMurs(avecVerrous(jeu, { a: ['frapper'], c: ['frapper'] }), { b: 'IIBBB' }),
    )
    expect(part(cartes, 'reparer')).toBeGreaterThan(0.6)
  })

  /**
   * À la première manche, tous les murs sont pleins et personne n'a encore
   * frappé : un bot qui se barricade d'entrée donne une partie où il ne se
   * passe rien pendant trois manches.
   */
  it('ouvre la partie en frappant plus souvent qu’en se barricadant', () => {
    const cartes = surCentGraines((jeu) => jeu)
    expect(part(cartes, 'frapper')).toBeGreaterThan(part(cartes, 'pieger'))
    expect(part(cartes, 'frapper')).toBeGreaterThan(part(cartes, 'bloquer'))
  })

  it('ne répare pas un mur plein', () => {
    const cartes = surCentGraines((jeu) => jeu)
    expect(part(cartes, 'reparer')).toBeLessThan(0.1)
  })

  /**
   * Le verrou est la mémoire du jeu, et c'est une information publique : un
   * adversaire qui a frappé la manche passée ne peut pas frapper celle-ci. Un
   * bot qui bloque contre une table désarmée passe son tour.
   */
  it('ne se protège pas quand plus personne ne peut frapper', () => {
    const cartes = surCentGraines((jeu) =>
      avecMurs(avecVerrous(jeu, { a: ['frapper'], c: ['frapper'] }), { b: 'IIIIB' }),
    )
    expect(part(cartes, 'bloquer') + part(cartes, 'pieger')).toBeLessThan(0.15)
  })

  it('se protège quand la table peut frapper et qu’il est en tête', () => {
    const cartes = surCentGraines((jeu) => avecMurs(jeu, { a: 'IIIBB', c: 'IIIBB' }))
    expect(part(cartes, 'bloquer') + part(cartes, 'pieger')).toBeGreaterThan(0.3)
  })

  it('frappe le mur le plus haut, pas le plus commode', () => {
    const jeu = avecMurs(avecVerrous(partie(), { b: ['reparer'] }), {
      a: 'IIIII',
      b: 'IIIII',
      c: 'IBBBB',
    })
    const cibles: string[] = []
    for (let seed = 0; seed < 60; seed++) {
      const choix = choisirBot({ ...jeu, seed }, 'b').filter((c) => c.card === 'frapper')
      cibles.push(...choix.map((c) => c.target!))
    }
    expect(cibles.length).toBeGreaterThan(10)
    expect(cibles.filter((x) => x === 'a').length / cibles.length).toBeGreaterThan(0.6)
  })

  it('vise un joueur à égalité en mort subite, et non un mur déjà distancé', () => {
    const fini = avecMurs(partie(), { a: 'IIIII', b: 'IIIII', c: 'IIIBB' })
    const subite: GameState = {
      ...fini,
      round: 10,
      phase: 'revelation',
      lastOutcome: null,
    }
    const jeu = advance(subite)
    expect(jeu.phase).toBe('mort-subite')
    for (let seed = 0; seed < 40; seed++) {
      const choix = choisirBot({ ...jeu, seed }, 'b')
      expect(choix).toHaveLength(1)
      expect(choix[0].card).toBe('frapper')
      expect(choix[0].target).toBe('a')
    }
  })

  it('décide toujours la même chose sur le même état', () => {
    const jeu = avecMurs(partie(3), { b: 'IIIBB' })
    expect(choisirBot(jeu, 'b')).toEqual(choisirBot(jeu, 'b'))
  })

  it('mène une partie de dix manches jusqu’au bout, entre bots', () => {
    let jeu = partie(42)
    let garde = 0
    while (jeu.phase !== 'fin' && garde++ < 200) {
      if (jeu.phase === 'carte-manche') {
        jeu = { ...jeu, phase: 'choix' }
        continue
      }
      if (jeu.phase === 'revelation') {
        jeu = advance(jeu)
        continue
      }
      for (const p of playersToAct(jeu)) jeu = submitChoice(jeu, p.id, choisirBot(jeu, p.id))
      jeu = resolveRound(jeu)
    }
    expect(jeu.phase).toBe('fin')
    expect(jeu.vainqueurs?.length).toBeGreaterThan(0)
  })
})
