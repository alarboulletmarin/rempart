import { describe, expect, it } from 'vitest'
import { createGame, resolveRound, submitChoice } from './engine'
import { traducteur } from '../i18n'
import { chute, narrate } from './narrate'
import type { GameState } from './types'

const fr = traducteur('fr')
const en = traducteur('en')

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
    const { headline, detail } = narrate(s, s.lastOutcome!, 'a', fr)
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
    expect(narrate(double, double.lastOutcome!, 'a', fr).headline).toContain('tes briques')
  })

  it('nomme le joueur quand le mur n’est pas celui du lecteur', () => {
    const s = frappeSur('a')
    // Pour « c », spectateur de la manche, la première frappe est celle de
    // Léa sur Malo : il lit un prénom, jamais un « tu ».
    expect(narrate(s, s.lastOutcome!, 'c', fr).detail).toMatch(/^Malo perd/)
  })
})

describe('le récit dans les deux langues', () => {
  function frappeSurA(): GameState {
    let s = neuve()
    s = submitChoice(s, 'a', [{ card: 'frapper', target: 'b' }])
    s = submitChoice(s, 'b', [{ card: 'frapper', target: 'a' }])
    s = submitChoice(s, 'c', [{ card: 'pieger' }])
    return resolveRound(s)
  }

  it('parle au lecteur de son propre mur, en anglais aussi', () => {
    const s = frappeSurA()
    const { headline, detail } = narrate(s, s.lastOutcome!, 'a', en)
    expect(headline).toBe('Malo broke your brick.')
    expect(detail).toMatch(/^You lose one brick\./)
  })

  it('dit la même chose des deux côtés, sans jamais laisser une clé brute', () => {
    const s = frappeSurA()
    for (const t of [fr, en]) {
      for (const vue of ['a', 'b', 'c'] as const) {
        const r = narrate(s, s.lastOutcome!, vue, t)
        // Une clé manquante ressort telle quelle : elle porte un point et
        // aucune espace, ce qu'aucune phrase du récit ne fait.
        expect(r.headline).not.toMatch(/^recit\./)
        expect(r.detail).not.toMatch(/^recit\./)
        expect(r.headline.length).toBeGreaterThan(0)
      }
    }
  })

  it('nomme la carte verrouillée dans la langue de qui lit', () => {
    const s = frappeSurA()
    expect(narrate(s, s.lastOutcome!, 'a', fr).detail).toContain('Frapper')
    expect(narrate(s, s.lastOutcome!, 'a', en).detail).toContain('Strike')
  })

  it('accorde le verrou au nombre de cartes jouées', () => {
    const s = frappeSurA()
    const deux = {
      ...s,
      lastOutcome: {
        ...s.lastOutcome!,
        outcomes: s.lastOutcome!.outcomes.map((o) =>
          o.playerId === 'b'
            ? { ...o, played: [{ card: 'frapper' as const, target: 'a' }, { card: 'bloquer' as const }] }
            : o,
        ),
      },
    }
    // Deux cartes verrouillées : le verbe se met au pluriel, et les deux noms
    // s'énumèrent avec la liaison de la langue.
    expect(narrate(deux, deux.lastOutcome!, 'a', fr).detail).toContain('sont interdites')
    expect(narrate(deux, deux.lastOutcome!, 'a', en).detail).toContain('are locked')
  })
})
