import { describe, expect, it } from 'vitest'
// `?raw` plutôt que `fs` : le projet n'embarque pas les types de Node, et
// Vite sait lire un fichier du dépôt comme une chaîne.
import html from '../index.html?raw'
import { ETABLI, VEILLEE, type Theme } from './theme'

/**
 * La couleur que le système peint autour de l'app.
 *
 * `theme-color` est la seule couleur du jeu qui vive HORS du thème : elle est
 * écrite dans le HTML, lue par le navigateur avant que React n'existe. Rien
 * n'empêche donc les deux de diverger, et personne ne le verrait avant
 * d'installer l'app sur un téléphone — c'est exactement le genre d'écart
 * qu'un test attrape pour rien.
 */
describe('la couleur de la barre système', () => {
  const meta = (schema: string) =>
    html.match(
      new RegExp(`content="([^"]+)"\\s+media="\\(prefers-color-scheme: ${schema}\\)"`),
    )?.[1]

  it('suit le fond du thème clair', () => {
    expect(meta('light')?.toUpperCase()).toBe(ETABLI.table.toUpperCase())
  })

  it('suit le fond du thème sombre', () => {
    expect(meta('dark')?.toUpperCase()).toBe(VEILLEE.table.toUpperCase())
  })
})

describe('les deux thèmes', () => {
  it('portent exactement les mêmes jetons', () => {
    // Un jeton ajouté d'un seul côté passe le typage tant qu'il est optionnel
    // nulle part — mais il vaut `undefined` à l'écran, et c'est en veillée
    // qu'on s'en aperçoit, six mois plus tard.
    expect(Object.keys(ETABLI).sort()).toEqual(Object.keys(VEILLEE).sort())
    for (const [cle, valeur] of Object.entries(ETABLI)) {
      expect(VEILLEE[cle as keyof typeof VEILLEE], cle).toBeDefined()
      expect(typeof VEILLEE[cle as keyof typeof VEILLEE], cle).toBe(typeof valeur)
    }
  })
})

/**
 * Le contraste, mesuré plutôt que jugé à l'œil.
 *
 * Deux paires ont passé des mois sous le seuil sans que personne ne le voie :
 * l'anneau d'un bouton radio non coché, à 1,41 contre 1 sur le carton de
 * veillée, et le détail d'une carte sélectionnée. C'est mesurable, donc c'est
 * un test — et pas une relecture à refaire à chaque fois qu'un jeton bouge.
 *
 * Deux seuils, ceux de WCAG AA : 4,5 pour du texte courant, 3 pour du texte
 * large et pour ce qui n'est pas du texte — un anneau, un contour.
 */
const TEXTE_AA = 4.5
const INTERFACE_AA = 3

function canal(v: number): number {
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

function luminance(couleur: string): number {
  const h = couleur.replace('#', '')
  const [r, v, b] = [0, 2, 4].map((i) => canal(parseInt(h.slice(i, i + 2), 16) / 255))
  return 0.2126 * r + 0.7152 * v + 0.0722 * b
}

function contraste(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/** Ce qui se pose sur quoi, et sous quel seuil ça ne doit jamais descendre. */
function paires(t: Theme): [string, string, string, number][] {
  return [
    ['texte courant sur la table', t.ink, t.table, TEXTE_AA],
    ['texte courant sur un panneau', t.ink, t.panel, TEXTE_AA],
    ['texte secondaire sur la table', t.ink2, t.table, TEXTE_AA],
    ['texte secondaire sur un panneau', t.ink2, t.panel, TEXTE_AA],
    // Le segment non retenu du contrôle segmenté : sa piste est un creux.
    ['texte secondaire sur un creux', t.ink2, t.panel2, TEXTE_AA],
    ['texte secondaire sur un carton pâle', t.ink2, t.cardOff, TEXTE_AA],
    ['le segment retenu', t.choixInk, t.choix, TEXTE_AA],
    ['une issue en terre cuite', t.clayText, t.panel, TEXTE_AA],
    ['une confirmation en vert', t.greenText, t.panel, TEXTE_AA],
    ['texte sur pleine encre', t.selFg, t.selBg, TEXTE_AA],
    ['texte sur ocre', t.ochreInk, t.ochre, TEXTE_AA],
    // Pas du texte : un anneau vide, et le contour d'une carte retenue.
    ['l’anneau vide sur un panneau', t.anneau, t.panel, INTERFACE_AA],
    ['l’anneau vide sur un creux', t.anneau, t.panel2, INTERFACE_AA],
    ['le contour du choix retenu', t.choix, t.panel, INTERFACE_AA],
  ]
}

describe('le contraste', () => {
  for (const theme of [ETABLI, VEILLEE]) {
    describe(theme.name, () => {
      for (const [quoi, devant, derriere, seuil] of paires(theme)) {
        it(quoi, () => {
          expect(contraste(devant, derriere), `${quoi} — ${devant} sur ${derriere}`)
            .toBeGreaterThanOrEqual(seuil)
        })
      }
    })
  }
})
