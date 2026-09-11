/** Les quatre cartes. Identiques pour tout le monde, aucune pioche. */
export type CardKey = 'frapper' | 'bloquer' | 'reparer' | 'pieger'

export const CARD_KEYS: readonly CardKey[] = ['frapper', 'bloquer', 'reparer', 'pieger']

export const CARD_LABEL: Record<CardKey, string> = {
  frapper: 'Frapper',
  bloquer: 'Bloquer',
  reparer: 'Réparer',
  pieger: 'Piéger',
}

export type PlayerId = string

/** Nombre de briques au départ, et plafond d'une réparation. */
export const WALL_SIZE = 5
/** Une partie complète : dix manches, quatre minutes. */
export const ROUNDS = 10
/** Les manches qui portent une carte de manche, quand elles sont activées. */
export const ROUND_CARD_ROUNDS = [3, 6, 9]

/**
 * L'état d'un emplacement de brique. Une brique cassée reste en place,
 * creuse et pâle : le mur garde sa largeur, donc la comparaison entre
 * joueurs reste immédiate.
 */
export type Slot = 'intact' | 'broken' | 'repaired'

export interface Player {
  id: PlayerId
  name: string
  /** Index d'identité 0–3 : détermine la forme ET la couleur (cercle, carré, triangle, pentagone). */
  ci: 0 | 1 | 2 | 3
  /** Place à la table, 0-indexée. Sert au ricochet (« le joueur assis juste après »). */
  seat: number
  /** Les cinq emplacements du mur, de gauche à droite. */
  wall: Slot[]
  /**
   * La ou les cartes jouées à la manche passée : interdites cette manche.
   * Une seule en temps normal ; deux quand « Dernier mur » a fait jouer
   * deux cartes au joueur le plus bas.
   */
  locked: CardKey[]
  /** Équipe 0 ou 1 en mode 2 contre 2, sinon null. */
  team: 0 | 1 | null
  connected: boolean
}

export interface Choice {
  card: CardKey
  /** Requis pour Frapper ; accepté par Bloquer et Réparer en mode équipes. */
  target?: PlayerId
}

export type Format = 'chacun' | 'equipes'

export interface GameConfig {
  format: Format
  /** Cartes de manche activées — désactivables à la création. */
  roundCards: boolean
}

export type Phase =
  /** Le salon d'attente, avant le lancement. */
  | 'salon'
  /** Une carte de manche est annoncée AVANT les choix. */
  | 'carte-manche'
  /** Tout le monde choisit en même temps. */
  | 'choix'
  /** Les quatre cartes se retournent d'un coup. */
  | 'revelation'
  /** Manche de mort subite après égalité à la dixième. */
  | 'mort-subite'
  | 'fin'

export interface RoundCard {
  id: string
  /** Le nom affiché sur le bandeau ocre. */
  n: string
  /** L'axe de jeu qu'elle déplace. */
  axis: string
  /** Ce qu'elle change, tel qu'annoncé au joueur. */
  d: string
  /** Pourquoi elle existe — texte de la planche de règles. */
  why: string
}

/**
 * Ce qui s'est passé pendant la résolution, fait par fait.
 * Le récit affiché à la révélation est dérivé de ces événements
 * (voir `narrate`), jamais écrit par le moteur : il dépend de qui regarde.
 */
export type RoundEvent =
  /** La frappe est passée : la cible perd des briques. */
  | { t: 'frappe'; from: PlayerId; to: PlayerId; amount: number }
  /** La cible avait bloqué : la frappe est annulée. */
  | { t: 'annulee'; from: PlayerId; to: PlayerId }
  /** La cible avait piégé : c'est l'attaquant qui prend le coup. */
  | { t: 'retournee'; from: PlayerId; to: PlayerId; amount: number }
  /** Réquisition : la brique cassée passe sur le mur de l'attaquant. */
  | { t: 'requisition'; from: PlayerId; amount: number }
  /** Une réparation a rendu des briques (`by` peut être le coéquipier). */
  | { t: 'reparation'; who: PlayerId; by: PlayerId; amount: number }
  /** Un joueur déconnecté n'a pas joué cette manche. */
  | { t: 'absent'; who: PlayerId }

/** Ce qui est arrivé à un joueur pendant la résolution, pour l'écran de révélation. */
export interface PlayerOutcome {
  playerId: PlayerId
  /** La ou les cartes qu'il a jouées (deux avec « Dernier mur »). */
  played: Choice[]
  /**
   * Son mur tel qu'il était AVANT la résolution.
   *
   * Sans lui, la révélation n'a rien à révéler : elle s'ouvrait sur des murs
   * portant déjà les dégâts, et les cartes se retournaient sur un résultat que
   * l'écran avait déjà donné. Les lignes partent donc de ce mur-là, et la
   * brique ne tombe qu'au moment où la carte se retourne (voir
   * `ui/mouvement.ts`).
   */
  wallBefore: Slot[]
  /** L'étiquette qui résume son sort : « annulé », « retourné −1 », « +1 brique »… */
  tag: string
  /** L'étiquette est-elle marquante (terre cuite pleine) ou discrète ? */
  hot: boolean
  /** Variation de briques sur la manche, pour l'animation et le récit. */
  delta: number
}

export interface RoundOutcome {
  round: number
  outcomes: PlayerOutcome[]
  events: RoundEvent[]
  /**
   * L'ordre dans lequel dévoiler les lignes. Normalement l'ordre des places ;
   * avec « Cartes sur table », du mur le plus bas au plus haut.
   */
  revealOrder: PlayerId[]
}

export interface GameState {
  config: GameConfig
  players: Player[]
  /** Manche courante, 1-indexée. */
  round: number
  phase: Phase
  /** La carte de manche en vigueur cette manche, ou null. */
  activeRoundCard: RoundCard | null
  /** Les cartes de manche déjà tirées : une carte tirée ne revient pas dans la partie. */
  usedRoundCards: string[]
  /** Les choix de la manche en cours, par joueur. Plusieurs avec « Dernier mur ». */
  choices: Record<PlayerId, Choice[]>
  /** Le résultat de la dernière résolution, affiché à la révélation. */
  lastOutcome: RoundOutcome | null
  /** Graine du tirage aléatoire — l'hôte la partage pour que tout le monde tire pareil. */
  seed: number
  /**
   * Numéro d'état, incrémenté par l'arbitre à chaque changement.
   *
   * Le moteur ne le touche pas : il ne sait rien du réseau. C'est la table
   * (`net/table.ts`) qui l'avance, et c'est lui qui permet à un invité de
   * reconnaître un état plus vieux que le sien, et à l'arbitre de reconnaître
   * un choix décidé sur un état déjà dépassé.
   */
  seq: number
  /** Combien de manches de mort subite ont déjà été jouées. */
  mortSubite: number
  /**
   * Les vainqueurs, fixés à la fin de la partie. Normalement les joueurs au
   * meilleur score ; après une mort subite qui n'a pas départagé, un seul.
   */
  vainqueurs: PlayerId[] | null
}
