/**
 * La structure des écrans de règles : quelles entrées, dans quel ordre.
 *
 * Le TEXTE, lui, n'est plus ici — il vit au catalogue (`i18n/fr.ts`,
 * `i18n/en.ts`), sous une clé par entrée. Ce qui reste dans ce fichier est la
 * seule chose que la traduction ne change pas : combien d'étapes compte une
 * manche, dans quel ordre se résout un tour, quels chapitres existent.
 *
 * Un seul endroit pour l'ordre, un seul endroit pour les mots : les écrans de
 * règles, l'accueil et l'aide en jeu lisent tous les mêmes clés, donc le
 * vocabulaire ne peut pas diverger d'un écran à l'autre.
 */

/** Les trois temps d'une manche. */
export const TURN_STEPS = [1, 2, 3] as const

/** Les quatre temps de la résolution, toujours dans cet ordre. */
export const RESOLUTION_ORDER = [1, 2, 3, 4] as const

/** Les cas particuliers, dans l'ordre de lecture. */
export const EDGE_CASES = [
  'murZero',
  'deuxFrappes',
  'piegeFrappe',
  'murPlein',
  'egalite',
] as const

export type EdgeCaseId = (typeof EDGE_CASES)[number]

/** Les chapitres du sommaire des règles, dans l'ordre de lecture. */
export type ChapitreId = 'but' | 'manche' | 'verrou' | 'cartes' | 'ordre' | 'cas' | 'fin' | 'manches'

export const SOMMAIRE: readonly ChapitreId[] = [
  'but',
  'manche',
  'verrou',
  'cartes',
  'ordre',
  'cas',
  'fin',
  'manches',
]
