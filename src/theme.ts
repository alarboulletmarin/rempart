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
 *
 * ## Ce que dit chaque accent — une ligne chacun, et pas deux
 *
 * Une couleur qui sert à deux choses ne dit plus rien. Le jaune a servi à la
 * fois à la victoire, à un bouton radio et à un bloc de réglage ; la terre
 * cuite à la fois à « tu as perdu une brique » et à « ton piège a fonctionné »,
 * c'est-à-dire à un dégât et à son contraire.
 *
 *  - **terre cuite** — une brique tombe. Rien d'autre : ni une défense qui a
 *    marché, ni un piège qui s'est déclenché sans rien coûter à personne.
 *  - **vert atelier** — une défense a tenu, ou un mur est remonté.
 *  - **ocre** — ce qui concerne toute la table à la fois : la carte de manche,
 *    et la fin de partie.
 *  - **encre pleine** — ce que TU as choisi. Un choix n'est pas un accent : il
 *    se lit à la matière du carton, pas à une couleur de plus.
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
  /** Vert atelier porteur de petit texte (contraste AA). */
  greenText: string
  /** Ocre — les cartes de manche, et rien d'autre. */
  ochre: string
  ochreEdge: string
  /** Texte sur ocre. */
  ochreInk: string
  /**
   * La pièce sombre posée SUR l'ocre, et son encre.
   *
   * L'ocre est clair dans les deux thèmes — c'est la même bande de carte de
   * manche —, donc ce qui se pose dessus ne suit pas le thème : une pastille
   * « Retour » en `panel` devenait, en veillée, du brun sur du brun, à 1,08
   * contre 1.
   */
  ochreFort: string
  ochreFortInk: string
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
  /**
   * L'anneau d'un contrôle NON coché.
   *
   * Le seul jeton dont le travail est d'être vu sans rien dire : il dessine le
   * cercle vide d'un bouton radio, donc il porte à lui seul « ceci est un
   * choix ». En `edge`, comme il l'était, il mesurait 1,4 contre 1 sur le
   * carton de veillée — du brun sur du brun, c'est-à-dire rien. Il tient le
   * 3:1 des éléments d'interface sur `panel` ET sur `panel2`.
   */
  anneau: string
  /**
   * Ce que TU as choisi, en pleine encre — et l'encre qui se pose dessus.
   *
   * Distinct de `selBg` : celui-là vaut terre cuite en veillée, c'est-à-dire
   * la couleur d'une brique qui tombe et celle des boutons d'action. Un
   * réglage coché n'est ni un dégât ni un appel à l'action, donc il prend
   * l'encre du thème et rien d'autre.
   */
  choix: string
  choixInk: string
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
  greenText: '#2F6B4F',
  ochre: '#E0A62E',
  ochreEdge: '#A9761A',
  ochreInk: '#4A3B10',
  ochreFort: '#2E2418',
  ochreFortInk: '#FCF7EC',
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
  anneau: '#8A7B63',
  choix: '#2E2418',
  choixInk: '#FCF7EC',
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
  // Plus clair que le vert des briques : à dix pixels sur le carton de nuit,
  // celui-ci tombait à 4,15 contre 1.
  greenText: '#6FBE95',
  ochre: '#E6B85C',
  ochreEdge: '#A9761A',
  ochreInk: '#3A2810',
  ochreFort: '#2E2418',
  ochreFortInk: '#FCF7EC',
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
  anneau: '#9A886E',
  choix: '#F6EDDC',
  choixInk: '#221A12',
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
 * Zone sûre en haut de chaque écran : ce que l'appareil impose de laisser
 * libre, et rien de plus.
 *
 * Installée en PWA plein écran sur un iPhone, l'app passe sous la Dynamic
 * Island : `env(safe-area-inset-top)` vaut alors une quarantaine de pixels et
 * il ne doit rien y avoir. Partout ailleurs — navigateur de bureau, Android,
 * Safari avec sa barre d'adresse — cette bande existe déjà au-dessus de l'app
 * et l'inset vaut zéro.
 *
 * Réserver 44 px en dur, comme on le faisait, revenait donc à dessiner une
 * seconde barre d'état sur des écrans qui en avaient déjà une : c'était le
 * grand vide en haut de tous les écrans. L'air au-dessus du premier élément
 * n'est pas ici, il est dans la marge propre de chaque écran.
 */
export const SAFE_TOP = 'env(safe-area-inset-top, 0px)'

/**
 * La barre d'état dessinée sur la planche.
 *
 * Les hauteurs d'en-tête reprises de la planche (90 à 106) la comprennent : le
 * cadre de design dessinait un téléphone entier. On la retranche à l'affichage
 * et on lui substitue la zone sûre réelle — la géométrie de la planche est
 * ainsi tenue au pixel sur l'appareil qu'elle dessinait, sans laisser un trou
 * sur tous les autres.
 */
export const BANDEAU_PLANCHE = 44
