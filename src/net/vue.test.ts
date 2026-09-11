import { describe, expect, it } from 'vitest'
import { createGame, resolveRound, submitChoice } from '../game/engine'
import type { GameState } from '../game/types'
import { vuePour } from './vue'

const SIEGES = [
  { id: 'a', name: 'Léa', ci: 0 as const },
  { id: 'b', name: 'Malo', ci: 1 as const },
  { id: 'c', name: 'Nour', ci: 2 as const },
]

function manche(): GameState {
  const g = createGame(SIEGES, { format: 'chacun', roundCards: false }, 1)
  let s: GameState = { ...g, phase: 'choix' }
  s = submitChoice(s, 'a', [{ card: 'frapper', target: 'b' }])
  s = submitChoice(s, 'b', [{ card: 'bloquer' }])
  return s
}

describe('le secret des choix', () => {
  it('ne transmet à chacun que son propre choix pendant la phase de choix', () => {
    const vueDeB = vuePour(manche(), 'b')
    expect(Object.keys(vueDeB.jeu.choices)).toEqual(['b'])
    expect(vueDeB.jeu.choices['a']).toBeUndefined()
  })

  it('ne transmet rien à celui qui n’a pas encore joué', () => {
    expect(vuePour(manche(), 'c').jeu.choices).toEqual({})
  })

  it('ne laisse pas fuiter la carte ni la cible avant la révélation', () => {
    // Le seul choix de la manche vise « b » avec Frapper : ni l'un ni l'autre
    // ne doit apparaître où que ce soit dans ce qui part sur le réseau.
    const brut = JSON.stringify(vuePour(manche(), 'c').jeu)
    expect(brut).not.toContain('frapper')
    expect(brut).not.toContain('bloquer')
  })

  it('partage tout de même qui a joué — c’est le « 3 / 4 ont joué »', () => {
    expect(vuePour(manche(), 'c').joues.sort()).toEqual(['a', 'b'])
  })

  it('révèle tous les choix une fois la manche résolue', () => {
    const v = vuePour(resolveRound(manche()), 'c')
    expect(Object.keys(v.jeu.choices).sort()).toEqual(['a', 'b'])
    expect(v.jeu.lastOutcome).not.toBeNull()
  })

  it('laisse tout voir à la fin de la partie', () => {
    const fini: GameState = { ...manche(), phase: 'fin' }
    expect(Object.keys(vuePour(fini, 'c').jeu.choices).sort()).toEqual(['a', 'b'])
  })

  it('ne touche à rien d’autre que les choix', () => {
    const s = manche()
    const v = vuePour(s, 'c')
    expect(v.jeu.players).toEqual(s.players)
    expect(v.jeu.round).toBe(s.round)
    expect(v.jeu.seq).toBe(s.seq)
  })
})
