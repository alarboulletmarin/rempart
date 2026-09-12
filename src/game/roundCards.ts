import type { RoundCard, RoundCardId } from './types'

/**
 * Les neuf cartes de manche, dans l'ordre de la planche.
 *
 * Elles cassent la routine trois fois par partie sans ajouter une seule règle
 * permanente. Une carte tirée ne revient pas dans la même partie : neuf cartes
 * pour trois tirages, donc deux parties de suite ne se ressemblent pas.
 *
 * **Une carte n'est plus qu'un identifiant.** Son nom, son axe, ce qu'elle
 * change et pourquoi elle existe vivent au catalogue : la carte tirée voyage
 * dans l'état de la partie, de l'arbitre vers les autres téléphones, et ces
 * téléphones ne lisent pas forcément sa langue. Ce qui part sur le réseau est
 * donc `dernier-mur`, jamais « Dernier mur ».
 */
export const ROUND_CARD_IDS: readonly RoundCardId[] = [
  'double-frappe',
  'mur-nu',
  'treve',
  'ricochet',
  'requisition',
  'memoire-courte',
  'contre-attaque',
  'cartes-sur-table',
  'dernier-mur',
]

export const ROUND_CARDS: readonly RoundCard[] = ROUND_CARD_IDS.map((id) => ({ id }))

export function roundCardById(id: string): RoundCard | undefined {
  return ROUND_CARDS.find((c) => c.id === id)
}
