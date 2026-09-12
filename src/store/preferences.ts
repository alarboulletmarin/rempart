/**
 * Les préférences qui ne sont ni le thème ni la langue.
 *
 * Tout est gardé sur l'appareil, comme le reste : aucun compte, aucun envoi.
 * Le thème et la langue ont chacun leur magasin (`ui/theme.tsx`, `i18n`) parce
 * qu'ils sont des préférences à trois états dont le troisième suit le
 * téléphone ; ce qui vit ici est du texte simple.
 *
 * `effacerTout` est ici pour une raison de fond : la promesse « sans compte,
 * sans tracking » n'est tenue qu'à moitié si sortir coûte plus cher qu'entrer.
 * Une seule fonction efface tout ce que l'écran Réglages annonce garder — donc
 * un magasin ajouté un jour et oublié ici se remarque en un endroit, pas
 * quatre.
 */

import { effacer as effacerPalmares } from './palmares'

const CLE_NOM = 'rempart:nom'
/** Les mêmes clés que celles écrites par `ui/theme.tsx` et `i18n`. */
const CLE_THEME = 'rempart:theme'
const CLE_LANGUE = 'rempart:langue'

/** Le nom pré-rempli dans « Nouvelle partie » et « Rejoindre ». */
export function lireNom(): string {
  try {
    return localStorage.getItem(CLE_NOM) ?? ''
  } catch {
    // Navigation privée, stockage bloqué : on joue sans nom mémorisé.
    return ''
  }
}

export function ecrireNom(nom: string): void {
  try {
    if (nom) localStorage.setItem(CLE_NOM, nom)
    else localStorage.removeItem(CLE_NOM)
  } catch {
    /* le nom ne sera pas gardé, le jeu continue */
  }
}

/**
 * Tout ce que l'app garde, et rien d'autre.
 *
 * L'identité d'appareil (`rempart.clientId`) ne part PAS : elle ne dit rien de
 * qui joue, elle sert à retrouver son siège après un rechargement, et
 * l'effacer couperait une partie en cours. Elle n'est donc pas annoncée dans
 * la liste, puisqu'elle n'y est pas.
 */
export function effacerTout(): void {
  effacerPalmares()
  try {
    localStorage.removeItem(CLE_NOM)
    localStorage.removeItem(CLE_THEME)
    localStorage.removeItem(CLE_LANGUE)
  } catch {
    /* rien à faire */
  }
}
