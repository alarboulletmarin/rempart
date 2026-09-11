import { describe, expect, it } from 'vitest'
import {
  BULLES_MAX,
  Discussion,
  EVENTAIL,
  REPOS_ENVOI_MS,
  VIE_BULLE_MS,
  bullesVivantes,
  estReaction,
  nettoyer,
} from './discussion'

describe('le frein de l’émetteur', () => {
  it('laisse partir le premier message', () => {
    expect(new Discussion().peutEnvoyer(1000)).toBe(true)
  })

  it('retient le suivant pendant sept dixièmes de seconde', () => {
    const d = new Discussion()
    d.noterEnvoi(1000)
    expect(d.peutEnvoyer(1000 + REPOS_ENVOI_MS - 1)).toBe(false)
    expect(d.peutEnvoyer(1000 + REPOS_ENVOI_MS)).toBe(true)
  })
})

describe('le frein du récepteur', () => {
  const arrive = (d: Discussion, n: number, at: number) =>
    d.recevoir({ id: `b:${n}`, de: 'b', texte: '😂' }, at)

  it('accepte trois bulles simultanées d’un même joueur, pas la quatrième', () => {
    const d = new Discussion()
    for (let i = 0; i < BULLES_MAX; i++) expect(arrive(d, i, 1000 + i)).toBe(true)
    expect(arrive(d, 99, 1000)).toBe(false)
  })

  it('n’archive pas ce qu’il n’a pas montré', () => {
    const d = new Discussion()
    for (let i = 0; i < BULLES_MAX + 4; i++) arrive(d, i, 1000)
    expect(d.liste()).toHaveLength(BULLES_MAX)
  })

  it('rouvre la porte quand les bulles se sont effacées', () => {
    const d = new Discussion()
    for (let i = 0; i < BULLES_MAX; i++) arrive(d, i, 1000)
    expect(arrive(d, 50, 1000 + VIE_BULLE_MS)).toBe(true)
  })

  it('compte les bulles joueur par joueur', () => {
    const d = new Discussion()
    for (let i = 0; i < BULLES_MAX; i++) arrive(d, i, 1000)
    // Le frein de l'un ne bâillonne pas l'autre.
    expect(d.recevoir({ id: 'c:1', de: 'c', texte: '🎉' }, 1000)).toBe(true)
  })

  // Le frein de l'émetteur vit chez quelqu'un d'autre : un client bricolé peut
  // l'enlever. Celui-ci est posé là où le tort serait fait.
  it('tient même si l’émetteur n’a pas respecté son repos', () => {
    const d = new Discussion()
    for (let i = 0; i < 30; i++) arrive(d, i, 1000 + i)
    expect(d.liste()).toHaveLength(BULLES_MAX)
  })
})

describe('un seul canal', () => {
  it('range la réaction et la phrase dans la même ligne d’historique', () => {
    const d = new Discussion()
    d.recevoir({ id: 'b:1', de: 'b', texte: 'j’arrive' }, 1000)
    d.recevoir({ id: 'c:1', de: 'c', texte: '👏' }, 1100)
    expect(d.liste().map((m) => m.texte)).toEqual(['j’arrive', '👏'])
  })

  it('reconnaît une réaction de l’éventail', () => {
    expect(estReaction('😱')).toBe(true)
    expect(estReaction('bien joué')).toBe(false)
    expect(EVENTAIL).toHaveLength(6)
  })

  it('ne double pas un message livré deux fois', () => {
    const d = new Discussion()
    expect(d.recevoir({ id: 'b:1', de: 'b', texte: '🙏' }, 1000)).toBe(true)
    expect(d.recevoir({ id: 'b:1', de: 'b', texte: '🙏' }, 1200)).toBe(false)
    expect(d.liste()).toHaveLength(1)
  })

  it('donne des identifiants qui ne se répètent pas', () => {
    const d = new Discussion()
    expect(d.prochainId('moi')).not.toBe(d.prochainId('moi'))
  })
})

describe('la liste que lit l’écran', () => {
  it('change de référence à chaque message retenu, et pas autrement', () => {
    const d = new Discussion()
    const vide = d.liste()
    expect(d.recevoir({ id: 'b:1', de: 'b', texte: '😂' }, 1000)).toBe(true)
    const apres = d.liste()
    expect(apres).not.toBe(vide)
    // Refusé : rien n'a changé, et la référence non plus.
    d.recevoir({ id: 'b:1', de: 'b', texte: '😂' }, 1100)
    expect(d.liste()).toBe(apres)
  })
})

describe('le texte', () => {
  it('replie les blancs et coupe ce qui dépasse', () => {
    expect(nettoyer('  bien \n\n joué  ')).toBe('bien joué')
    expect(nettoyer('a'.repeat(400))).toHaveLength(140)
  })

  it('refuse un message vide', () => {
    const d = new Discussion()
    expect(d.recevoir({ id: 'b:1', de: 'b', texte: '   ' }, 1000)).toBe(false)
  })
})

describe('les bulles à l’écran', () => {
  it('ne rend que ce qui n’a pas encore fini de monter', () => {
    const d = new Discussion()
    d.recevoir({ id: 'b:1', de: 'b', texte: '😂' }, 1000)
    d.recevoir({ id: 'c:1', de: 'c', texte: '😱' }, 1000 + VIE_BULLE_MS)
    const vivantes = bullesVivantes(d.liste(), 1000 + VIE_BULLE_MS)
    expect(vivantes.get('b')).toBeUndefined()
    expect(vivantes.get('c')).toHaveLength(1)
  })
})
