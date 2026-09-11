/**
 * Ce que chaque joueur a le droit de voir de l'état.
 *
 * C'est la règle du jeu, appliquée au réseau : « tous les joueurs choisissent
 * EN MÊME TEMPS une carte, puis on révèle ». Un choix qui voyage en clair avant
 * la révélation n'est plus un choix secret — il suffirait d'ouvrir la console
 * pour lire la carte des autres, et tout le jeu s'effondre.
 *
 * L'arbitre ne diffuse donc jamais l'état brut : il le redacte pour chaque
 * destinataire, qui ne reçoit que **son propre choix**, plus la liste de ceux
 * qui ont joué — le « 3 / 4 ont joué » de l'écran 07, et rien de plus.
 */
import { hasPlayed } from '../game/engine.ts'
import type { Choice, GameState, PlayerId } from '../game/types.ts'

export type Vue = {
  jeu: GameState
  /** Qui a déjà joué cette manche. La seule information partagée avant la révélation. */
  joues: PlayerId[]
}

export function vuePour(jeu: GameState, id: PlayerId): Vue {
  const joues = jeu.players.filter((p) => hasPlayed(jeu, p.id)).map((p) => p.id)
  // À la révélation les cartes se retournent : il n'y a plus rien à cacher, et
  // l'écran a justement besoin de savoir qui a joué quoi et sur qui.
  if (jeu.phase === 'revelation' || jeu.phase === 'fin') return { jeu, joues }

  const choices: Record<PlayerId, Choice[]> = {}
  if (jeu.choices[id]) choices[id] = jeu.choices[id]
  return { jeu: { ...jeu, choices }, joues }
}
