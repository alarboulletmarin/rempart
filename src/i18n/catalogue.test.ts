import { describe, expect, it } from 'vitest'
import type { MotifEtiquette } from '../game/types'
import { en } from './en'
import { fr } from './fr'
import type { Cle } from './fr.types'
import { direEtiquette, traducteur } from './index'

/**
 * Ce que le typage ne peut pas vérifier tout seul.
 *
 * `en.ts` est typé sur `fr.ts`, donc une clé manquante ou en trop arrête déjà
 * la compilation. Restent trois façons de casser une langue sans que le
 * compilateur s'en aperçoive : une phrase vide, un paramètre oublié dans la
 * traduction — « Tu perds » sans le nombre de briques — et une paire de
 * pluriel à moitié écrite.
 */

const cles = Object.keys(fr) as Cle[]

/** Les `{nom}` d'une phrase, dans l'ordre alphabétique. */
function parametres(modele: string): string[] {
  return [...modele.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
}

describe('le catalogue', () => {
  it('ne laisse aucune phrase vide', () => {
    // « rien » est le seul motif qui ne s'affiche pas : la ligne n'a pas
    // d'étiquette ce tour-là.
    const vides = cles.filter((c) => c !== 'etiquette.rien' && (!fr[c] || !en[c]))
    expect(vides).toEqual([])
  })

  it('porte les mêmes paramètres dans les deux langues', () => {
    const ecarts = cles.filter(
      (c) => parametres(fr[c]).join(',') !== parametres(en[c]).join(','),
    )
    expect(ecarts).toEqual([])
  })

  it('n’écrit jamais une paire de pluriel à moitié', () => {
    const orphelines = cles.filter((c) => {
      if (c.endsWith('_un')) return !cles.includes(`${c.slice(0, -3)}_autre` as Cle)
      if (c.endsWith('_autre')) return !cles.includes(`${c.slice(0, -6)}_un` as Cle)
      return false
    })
    expect(orphelines).toEqual([])
  })

  it('ne recopie pas le français en guise d’anglais', () => {
    // Une phrase un peu longue identique dans les deux langues est presque
    // toujours une traduction oubliée. Deux exceptions légitimes : les valeurs
    // courtes (un nom propre, un mot partagé) et les gabarits qui n'assemblent
    // que des paramètres et des séparateurs.
    const gabarit = (v: string) => v.replace(/\{\w+\}/g, '').trim().replace(/[·:,\-—\s]/g, '') === ''
    const identiques = cles.filter(
      (c) => fr[c] === en[c] && fr[c].length > 24 && !gabarit(fr[c]),
    )
    expect(identiques).toEqual([])
  })
})

describe('les étiquettes de révélation', () => {
  const MOTIFS: MotifEtiquette[] = [
    'absent',
    'retourne',
    'piegeDeclenche',
    'frappesAnnulees',
    'annule',
    'briquesPerdues',
    'briquesGagnees',
    'murPlein',
    'touche',
    'rien',
  ]

  it('ne laisse jamais un paramètre à l’écran', () => {
    // « retourné −{n} » s'est affiché tel quel : le motif porte un nombre
    // sans pour autant s'accorder, et le nombre ne lui était pas passé.
    for (const t of [traducteur('fr'), traducteur('en')]) {
      for (const motif of MOTIFS) {
        for (const n of [0, 1, 2]) {
          expect(direEtiquette(t, { motif, n })).not.toMatch(/\{\w+\}/)
        }
      }
    }
  })

  it('dit le nombre quand le motif en porte un', () => {
    const fr = traducteur('fr')
    expect(direEtiquette(fr, { motif: 'retourne', n: 2 })).toBe('retourné −2')
    expect(direEtiquette(fr, { motif: 'briquesPerdues', n: 1 })).toBe('−1 brique')
    expect(direEtiquette(fr, { motif: 'frappesAnnulees', n: 2 })).toBe('2 frappes annulées')
  })
})
