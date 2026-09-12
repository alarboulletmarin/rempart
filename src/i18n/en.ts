/**
 * Le catalogue anglais.
 *
 * Typé sur `fr` : une clé manquante ou en trop arrête la compilation. Ce n'est
 * pas un confort, c'est la seule chose qui empêche une langue de partir en
 * production avec des trous.
 */

import type { Catalogue } from './fr.types'

export const en: Catalogue = {
  /* ------------------------------------------------------------ les cartes */

  'carte.frapper': 'Strike',
  'carte.bloquer': 'Block',
  'carte.reparer': 'Repair',
  'carte.pieger': 'Trap',

  /* ------------------------------------------------------------- le compte */

  'brique_un': '{n} brick',
  'brique_autre': '{n} bricks',
  'briqueDite_un': 'one brick',
  'briqueDite_autre': '{n} bricks',
  'joueur_un': '{n} player',
  'joueur_autre': '{n} players',
  'manche_un': '{n} round',
  'manche_autre': '{n} rounds',
  'place_un': '{n} open seat',
  'place_autre': '{n} open seats',

  /* --------------------------------------------------------------- le temps */

  'date.matin': 'this morning',
  'date.apresMidi': 'this afternoon',
  'date.soir': 'this evening',
  'date.hier.matin': 'yesterday morning',
  'date.hier.apresMidi': 'yesterday afternoon',
  'date.hier.soir': 'yesterday evening',
  'date.ilYaJours': '{n} days ago',

  /* ------------------------------------------------------------- le commun */

  'commun.retour': 'Back',
  'commun.manche': 'Round {n}',

  /* ------------------------------------------------------------- réglages */

  'reglages.titre': 'Settings',
  'reglages.theme.titre': 'Theme',
  'reglages.theme.systeme.nom': 'Match the phone',
  'reglages.theme.systeme.detail': 'Follows the system’s light or dark setting.',
  /* Les deux thèmes gardent leur nom français : c'est le nom de la planche de
     design, comme une couleur porte le sien. Le détail, lui, dit ce que c'est. */
  'reglages.theme.etabli.nom': 'Établi',
  'reglages.theme.etabli.detail': 'The daytime bench: kraft, cardboard, terracotta.',
  'reglages.theme.veillee.nom': 'Veillée',
  'reglages.theme.veillee.detail': 'The same bench by lamplight: burnt wood and chalk.',
  'reglages.langue.titre': 'Language',
  'reglages.langue.systeme.nom': 'Match the phone',
  'reglages.langue.systeme.detail': 'Follows the system language, if the game speaks it.',
  'reglages.langue.fr.nom': 'Français',
  'reglages.langue.fr.detail': 'The game, the rules and the round stories in French.',
  'reglages.langue.en.nom': 'English',
  'reglages.langue.en.detail': 'The game, the rules and the round stories in English.',
  'reglages.jeu.titre': 'The game',
  'reglages.jeu.cartesManche.titre': 'Round cards',
  'reglages.jeu.cartesManche.detail':
    'The nine cards of rounds 3, 6 and 9. You switch them on when you create the game.',
  'reglages.garde.titre': 'What the app keeps',
  'reglages.garde.quoi': 'Your record, your theme and your language, on this device only.',
  'reglages.garde.rien':
    'No account, no ads, no analytics. Games go straight from one phone to another: there is no game server, and a matchmaking service only helps establish the connection — it never sees the game.',
  'reglages.garde.horsLigne':
    'Once the app is installed it works offline. Multiplayer, though, needs a connection.',
  'reglages.pied': 'Rempart · 2–4 players · 10 rounds · 4 minutes',
}
