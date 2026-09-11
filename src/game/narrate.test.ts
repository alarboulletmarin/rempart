import { describe, expect, it } from 'vitest'
import { createGame, resolveRound, submitChoice } from './engine'
import { chute, narrate } from './narrate'
import type { GameState } from './types'

const SIEGES = [
  { id: 'a', name: 'Léa', ci: 0 as const },
  { id: 'b', name: 'Malo', ci: 1 as const },
  { id: 'c', name: 'Nour', ci: 2 as const },
]

function neuve(): GameState {
  return { ...createGame(SIEGES, { format: 'chacun', roundCards: false }, 1), phase: 'choix' }
}

describe('le mur d’avant', () => {
  it('accompagne chaque joueur, pour que la révélation ait quelque chose à révéler', () => {
    let s = neuve()
    s = submitChoice(s, 'a', [{ card: 'frapper', target: 'b' }])
    s = submitChoice(s, 'b', [{ card: 'frapper', target: 'c' }])
    s = submitChoice(s, 'c', [{ card: 'bloquer' }])
    const apres = resolveRound(s)
    const o = apres.lastOutcome!.outcomes.find((x) => x.playerId === 'b')!
    // Le mur d'après porte le coup ; celui d'avant, non.
    expect(o.wallBefore.filter((x) => x === 'broken')).toHaveLength(0)
    expect(apres.players.find((p) => p.id === 'b')!.wall).toContain('broken')
  })
})

describe('la brique qui tombe', () => {
  it('ne tombe que là où une brique vient d’être cassée', () => {
    let s = neuve()
    s = submitChoice(s, 'a', [{ card: 'frapper', target: 'b' }])
    s = submitChoice(s, 'b', [{ card: 'frapper', target: 'c' }])
    s = submitChoice(s, 'c', [{ card: 'bloquer' }])
    const apres = resolveRound(s)
    // « b » a pris la frappe ; « c » avait bloqué, son mur n'a pas bougé.
    expect(chute(apres, apres.lastOutcome!, 'b').slots).toEqual([4])
    expect(chute(apres, apres.lastOutcome!, 'c').slots).toHaveLength(0)
  })

  it('tombe du côté opposé à celui d’où le coup est venu', () => {
    let s = neuve()
    // « a » est assis avant « b » : le coup vient de la gauche.
    s = submitChoice(s, 'a', [{ card: 'frapper', target: 'b' }])
    s = submitChoice(s, 'b', [{ card: 'frapper', target: 'c' }])
    s = submitChoice(s, 'c', [{ card: 'bloquer' }])
    const deGauche = resolveRound(s)
    expect(chute(deGauche, deGauche.lastOutcome!, 'b').sens).toBe(1)

    let s2 = neuve()
    // « c » est assis après « b » : le coup vient de la droite.
    s2 = submitChoice(s2, 'c', [{ card: 'frapper', target: 'b' }])
    s2 = submitChoice(s2, 'b', [{ card: 'frapper', target: 'a' }])
    s2 = submitChoice(s2, 'a', [{ card: 'bloquer' }])
    const deDroite = resolveRound(s2)
    expect(chute(deDroite, deDroite.lastOutcome!, 'b').sens).toBe(-1)
  })

  it('fait tomber la brique de l’attaquant quand son coup lui revient', () => {
    let s = neuve()
    s = submitChoice(s, 'a', [{ card: 'frapper', target: 'c' }])
    s = submitChoice(s, 'b', [{ card: 'bloquer' }])
    s = submitChoice(s, 'c', [{ card: 'pieger' }])
    const apres = resolveRound(s)
    const sur = chute(apres, apres.lastOutcome!, 'a')
    expect(sur.slots).toHaveLength(1)
    // Le piège de « c », assis après « a », lui renvoie la frappe de la droite.
    expect(sur.sens).toBe(-1)
    expect(chute(apres, apres.lastOutcome!, 'c').slots).toHaveLength(0)
  })
})

describe('le récit d’une frappe reçue', () => {
  function frappeSur(cible: 'a' | 'b') {
    let s = neuve()
    s = submitChoice(s, 'a', [{ card: 'frapper', target: cible === 'a' ? 'b' : 'a' }])
    s = submitChoice(s, 'b', [{ card: 'frapper', target: cible }])
    s = submitChoice(s, 'c', [{ card: 'pieger' }])
    return resolveRound(s)
  }

  it('parle au lecteur de son propre mur', () => {
    const s = frappeSur('a')
    const { headline, detail } = narrate(s, s.lastOutcome!, 'a')
    expect(headline).toContain('ta brique')
    expect(detail).toMatch(/^Tu perds/)
  })

  it('accorde le possessif avec le nombre de briques, pas avec la personne', () => {
    const s = frappeSur('a')
    // Deux briques cassées d'un coup : « tes briques », jamais « ta briques ».
    const double = {
      ...s,
      lastOutcome: {
        ...s.lastOutcome!,
        events: [{ t: 'frappe' as const, from: 'b', to: 'a', amount: 2 }],
      },
    }
    expect(narrate(double, double.lastOutcome!, 'a').headline).toContain('tes briques')
  })

  it('nomme le joueur quand le mur n’est pas celui du lecteur', () => {
    const s = frappeSur('a')
    // Pour « c », spectateur de la manche, la première frappe est celle de
    // Léa sur Malo : il lit un prénom, jamais un « tu ».
    expect(narrate(s, s.lastOutcome!, 'c').detail).toMatch(/^Malo perd/)
  })
})
