import { describe, expect, it } from 'vitest'
// `?raw` plutôt que `fs` : le projet n'embarque pas les types de Node, et
// Vite sait lire un fichier du dépôt comme une chaîne.
import html from '../index.html?raw'
import { ETABLI, VEILLEE } from './theme'

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
