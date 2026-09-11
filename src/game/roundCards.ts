import type { RoundCard } from './types'

/**
 * Les neuf cartes de manche, reprises mot pour mot de la planche.
 *
 * Elles cassent la routine trois fois par partie sans ajouter une seule règle
 * permanente. Une carte tirée ne revient pas dans la même partie : neuf cartes
 * pour trois tirages, donc deux parties de suite ne se ressemblent pas.
 */
export const ROUND_CARDS: readonly RoundCard[] = [
  {
    id: 'double-frappe',
    n: 'Double frappe',
    axis: 'dégâts',
    d: 'Frapper casse deux briques. Réparer en remet deux.',
    why: 'La manche la plus violente du jeu : tout le monde veut bloquer, donc frapper devient rentable.',
  },
  {
    id: 'mur-nu',
    n: 'Mur nu',
    axis: 'défense',
    d: 'Bloquer n’a aucun effet cette manche.',
    why: 'Enlève la seule carte sûre. Piéger devient la vraie défense — et se lit sur les visages.',
  },
  {
    id: 'treve',
    n: 'Trêve',
    axis: 'dégâts',
    d: 'Frapper est interdit. Seuls Bloquer, Réparer et Piéger sont jouables.',
    why: 'Une manche de respiration où les murs bas remontent : le classement se resserre d’un coup.',
  },
  {
    id: 'ricochet',
    n: 'Ricochet',
    axis: 'cible',
    d: 'Chaque frappe touche aussi le joueur assis juste après la cible.',
    why: 'Impossible de viser proprement : on se fait des ennemis sans le vouloir.',
  },
  {
    id: 'requisition',
    n: 'Réquisition',
    axis: 'économie',
    d: 'La brique cassée n’est pas détruite : elle passe sur le mur de l’attaquant.',
    why: 'Frapper devient un gain, pas seulement une perte pour l’autre. Les écarts explosent.',
  },
  {
    id: 'memoire-courte',
    n: 'Mémoire courte',
    axis: 'verrou',
    d: 'Le verrou est levé : chacun peut rejouer la carte de la manche passée.',
    why: 'Le seul moment où l’on peut bloquer deux fois de suite — et où le bluff du tour d’avant ne vaut plus rien.',
  },
  {
    id: 'contre-attaque',
    n: 'Contre-attaque',
    axis: 'défense',
    d: 'Les pièges renvoient deux briques au lieu d’une.',
    why: 'Rend le mur le plus bas dangereux à achever : la manche où l’on épargne les blessés.',
  },
  {
    id: 'cartes-sur-table',
    n: 'Cartes sur table',
    axis: 'information',
    d: 'Les cartes se révèlent une par une, du mur le plus bas au plus haut.',
    why: 'Le dernier à se révéler joue avec l’information des autres : être en tête coûte cher.',
  },
  {
    id: 'dernier-mur',
    n: 'Dernier mur',
    axis: 'rattrapage',
    d: 'Le joueur qui a le moins de briques joue deux cartes cette manche.',
    why: 'Le filet de sécurité du jeu : personne n’est décroché avant la dixième manche.',
  },
]

export function roundCardById(id: string): RoundCard | undefined {
  return ROUND_CARDS.find((c) => c.id === id)
}
