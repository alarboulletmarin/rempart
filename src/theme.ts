/**
 * Jetons de la direction artistique « Établi ».
 *
 * Repris tels quels de la planche de design (Rempart-Etabli.dc.html, objets E et N).
 * Deux thèmes : `etabli` (clair, la table de jour) et `veillee` (sombre, le même
 * établi à la lampe). Aucune valeur de couleur ne doit être écrite en dur ailleurs
 * dans l'app — tout passe par ces jetons.
 *
 * Règles de la DA, portées ici pour mémoire :
 *  - épaisseur au lieu du contour : un chant sombre en bas (inset 0 -Npx 0) et une
 *    ombre dure sans flou (0 Npx 0). Jamais de blur, jamais de dégradé.
 *  - jamais de transparence pour porter un état : un état se lit à la matière.
 *  - la couleur ne fait que confirmer : forme + nom + position identifient un joueur.
 */

export type ThemeName = 'etabli' | 'veillee'

export interface Theme {
  name: ThemeName
  /** Le fond de l'app — la table. */
  table: string
  /** Panneaux posés sur la table. */
  panel: string
  /** Panneau creux / encart dans un panneau. */
  panel2: string
  /** Chant des panneaux. */
  edge: string
  /** Texte principal. */
  ink: string
  /** Texte secondaire (libellés, notes). */
  ink2: string
  /** Texte tertiaire. */
  ink3: string
  wood: string
  /** Terre cuite — les dégâts. */
  clay: string
  clayEdge: string
  /** Terre cuite porteuse de petit texte (contraste AA). */
  clayText: string
  clayTextEdge: string
  /** Vert atelier — les réparations. */
  green: string
  greenEdge: string
  /** Ocre — les cartes de manche, et rien d'autre. */
  ochre: string
  ochreEdge: string
  /** Texte sur ocre. */
  ochreInk: string
  /** Brique cassée : creuse et pâle, elle garde sa place. */
  off: string
  offEdge: string
  /** Le trait de fracture d'une brique cassée. */
  crack: string
  /** Le trait clair d'une brique réparée ce tour. */
  mend: string
  cardBg: string
  cardEdge: string
  /** Carte interdite : un carton plus pâle, pas une opacité. */
  cardOff: string
  cardOffEdge: string
  /** Carte choisie : pleine encre. */
  selBg: string
  selEdge: string
  selFg: string
  /** Les quatre couleurs de joueur, dans l'ordre des identités. */
  pc: readonly [string, string, string, string]
  /** Le chant de chaque couleur de joueur. */
  pe: readonly [string, string, string, string]
}

export const ETABLI: Theme = {
  name: 'etabli',
  table: '#E4D7BE',
  panel: '#FCF7EC',
  panel2: '#F1E5CE',
  edge: '#DCC9A6',
  ink: '#2E2418',
  ink2: '#5F5342',
  ink3: '#5F5342',
  wood: '#A9713C',
  clay: '#C0562F',
  clayEdge: '#8E3A1C',
  clayText: '#A8481F',
  clayTextEdge: '#7A3315',
  green: '#2F6B4F',
  greenEdge: '#1D4A35',
  ochre: '#E0A62E',
  ochreEdge: '#A9761A',
  ochreInk: '#4A3B10',
  off: '#EFE2C8',
  offEdge: '#DCC9A6',
  crack: '#C6AF88',
  mend: '#D7E6DD',
  cardBg: '#F3E7CE',
  cardEdge: '#D9C4A0',
  cardOff: '#EDE0C6',
  cardOffEdge: '#D4BF98',
  selBg: '#2E2418',
  selEdge: '#170F06',
  selFg: '#FCF7EC',
  pc: ['#C0562F', '#2F5D8C', '#1F6B4F', '#7A4A86'],
  pe: ['#8E3A1C', '#1F3F63', '#124B36', '#54305D'],
}

export const VEILLEE: Theme = {
  name: 'veillee',
  table: '#221A12',
  panel: '#2E2418',
  panel2: '#3A2E1F',
  edge: '#4A3B29',
  ink: '#F6EDDC',
  ink2: '#C0AE93',
  ink3: '#B8A78C',
  wood: '#C08B4E',
  clay: '#E0714A',
  clayEdge: '#A34A28',
  clayText: '#E0714A',
  clayTextEdge: '#A34A28',
  green: '#4E9370',
  greenEdge: '#2F6B4F',
  ochre: '#E6B85C',
  ochreEdge: '#A9761A',
  ochreInk: '#3A2810',
  off: '#3A2E1F',
  offEdge: '#4A3B29',
  crack: '#6B5942',
  mend: '#D7E6DD',
  cardBg: '#3A2E1F',
  cardEdge: '#191108',
  cardOff: '#332A1C',
  cardOffEdge: '#160F06',
  selBg: '#E0714A',
  selEdge: '#A34A28',
  selFg: '#2E2418',
  pc: ['#E0714A', '#7EA6D8', '#57A57E', '#B58AC4'],
  pe: ['#A34A28', '#4A6D96', '#2F6B4F', '#7C5A8C'],
}

export const THEMES: Record<ThemeName, Theme> = { etabli: ETABLI, veillee: VEILLEE }

/**
 * Rayons calibrés (planche 01 · La direction).
 * Jamais d'angle vif, jamais de coin à 24 px.
 */
export const R = {
  brique: 7,
  pastille: 12,
  carte: 15,
  panneau: 18,
  panneauLarge: 20,
  telephone: 30,
  pilule: 999,
} as const

/** Les deux familles, trois usages. */
export const TITRE = "'Bricolage Grotesque', Helvetica, sans-serif"
export const TEXTE = 'Outfit, Helvetica, sans-serif'

/**
 * Zone sûre en haut de chaque écran : laisse passer la Dynamic Island quand
 * l'app est installée en PWA plein écran. 44 px, plus l'inset réel du device.
 */
export const SAFE_TOP = 44
