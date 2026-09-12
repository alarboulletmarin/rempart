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

  'mur.aria_un': '{nom}’s wall: {n} brick out of {total}.',
  'mur.aria_autre': '{nom}’s wall: {n} bricks out of {total}.',

  'forme.0': 'Circle',
  'forme.1': 'Square',
  'forme.2': 'Triangle',
  'forme.3': 'Pentagon',

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

  /* ------------------------------------------------ le récit de la manche */

  'recit.retourne.titre.moiAuteur': '{piegeur}’s trap sent your strike back.',
  'recit.retourne.titre.moiPiegeur': 'Your trap sent {auteur}’s strike back.',
  'recit.retourne.titre.autres': '{piegeur}’s trap sent {auteur}’s strike back.',
  'recit.retourne.detail.moiAuteur_un': 'You lose one brick, {piegeur} lost nothing.',
  'recit.retourne.detail.moiAuteur_autre': 'You lose {n} bricks, {piegeur} lost nothing.',
  'recit.retourne.detail.moiPiegeur_un': '{auteur} loses one brick and you lost nothing.',
  'recit.retourne.detail.moiPiegeur_autre': '{auteur} loses {n} bricks and you lost nothing.',
  'recit.retourne.detail.autres_un': '{auteur} loses one brick and {piegeur} lost nothing.',
  'recit.retourne.detail.autres_autre': '{auteur} loses {n} bricks and {piegeur} lost nothing.',

  'recit.bloc.titre.tout.moi': 'You stopped the lot in one block.',
  'recit.bloc.titre.tout.autre': '{nom} stopped the lot in one block.',
  'recit.bloc.titre.une.moi': 'You blocked the strike.',
  'recit.bloc.titre.une.autre': '{nom} blocked the strike.',
  'recit.bloc.detail.moi_un':
    'The strike is cancelled. You are wide open now: {carte} is locked for you next round.',
  'recit.bloc.detail.moi_autre':
    '{n} strikes cancelled. You are wide open now: {carte} is locked for you next round.',
  'recit.bloc.detail.autre_un':
    'The strike is cancelled. {nom} is wide open now: {carte} is locked for them next round.',
  'recit.bloc.detail.autre_autre':
    '{n} strikes cancelled. {nom} is wide open now: {carte} is locked for them next round.',

  'recit.frappe.titre.surMoi_un': '{nom} broke your brick.',
  'recit.frappe.titre.surMoi_autre': '{nom} broke your bricks.',
  'recit.frappe.titre.parMoi': 'You struck {cible}.',
  'recit.frappe.titre.autres': '{nom} struck {cible}.',
  'recit.frappe.detail.moi_un': 'You lose one brick.',
  'recit.frappe.detail.moi_autre': 'You lose {n} bricks.',
  'recit.frappe.detail.autre_un': '{nom} loses one brick.',
  'recit.frappe.detail.autre_autre': '{nom} loses {n} bricks.',

  'recit.repare.titre.equipe.parMoi': 'You repaired {cible}’s wall.',
  'recit.repare.titre.equipe.pourMoi': '{nom} repaired your team’s wall.',
  'recit.repare.titre.equipe.autres': '{nom} repaired {cible}’s wall.',
  'recit.repare.titre.seul.moi': 'You built your wall back up.',
  'recit.repare.titre.seul.autre': '{nom} built their wall back up.',
  'recit.repare.detail_un': '+{n} brick, and nobody struck this round.',
  'recit.repare.detail_autre': '+{n} bricks, and nobody struck this round.',

  'recit.rien.titre': 'Nothing fell.',
  'recit.rien.detail':
    'No strike landed. The locks change all the same: three choices next round.',

  'recit.verrou.moi_un': '— and {cartes} is locked for you next round.',
  'recit.verrou.moi_autre': '— and {cartes} are locked for you next round.',
  'recit.verrou.autre_un': '— {cartes} is locked for {nom} next round.',
  'recit.verrou.autre_autre': '— {cartes} are locked for {nom} next round.',

  'recit.joue.sur': '{carte} on {cible}',
  'recit.joue.rien': 'did not play',

  /* ---------------------------------------------------------- révélation */

  'revelation.titre': 'Reveal',
  'revelation.mortSubite': 'sudden death · round {n}',
  'revelation.tousJoue': 'round {n} · everyone has played',
  'revelation.cascade': 'turning the cards over one by one',
  'revelation.dosCache': 'Card still face down.',
  'revelation.suivant': 'Next round',
  'revelation.classement': 'See the standings',
  'revelation.toi': 'you',
  'revelation.absent': 'away',

  'etiquette.absent': 'away',
  'etiquette.retourne': 'sent back −{n}',
  'etiquette.piegeDeclenche': 'trap sprung',
  'etiquette.frappesAnnulees_un': '{n} strike cancelled',
  'etiquette.frappesAnnulees_autre': '{n} strikes cancelled',
  'etiquette.annule': 'cancelled',
  'etiquette.briquesPerdues_un': '−{n} brick',
  'etiquette.briquesPerdues_autre': '−{n} bricks',
  'etiquette.briquesGagnees_un': '+{n} brick',
  'etiquette.briquesGagnees_autre': '+{n} bricks',
  'etiquette.murPlein': 'wall full',
  'etiquette.touche': 'struck',
  'etiquette.rien': '',

  /* --------------------------------------------------------- le tour de jeu */

  'jeu.etat.choisie': 'chosen',
  'jeu.etat.jouable': 'playable',
  'jeu.etat.interdite': 'locked',
  'jeu.carte.aria': '{carte} — {etat}',
  'jeu.verrou.rien': 'played nothing',
  'jeu.verrou.carte': '{carte} · locked',

  'jeu.entete.pause': 'paused',
  'jeu.entete.cible': '{carte} · pick a target',
  'jeu.entete.ontJoue': '{n} / {total} have played',
  'jeu.entete.equipes': 'Teams · shared score',
  'jeu.entete.mortSubite': 'Sudden death',
  'jeu.entete.carteCommune': 'shared card',

  'jeu.tag.absent': 'away',
  'jeu.tag.cibler': 'target',
  'jeu.tag.toi': 'you',
  'jeu.tag.aJoue': 'played',
  'jeu.tag.choisit': 'choosing…',
  'jeu.tag.coequipier': 'teammate',

  'jeu.bandeau.frappe': 'Your strike lands on this wall',
  'jeu.viser.aria': 'Aim at {nom}’s wall — {briques} standing',

  'jeu.pied.cibler': 'Touch a wall to aim',
  'jeu.pied.continuer': 'Touch a card to go on',
  'jeu.pied.tousJoue': 'Everyone has played',
  'jeu.pied.attendUn': 'Waiting for {nom}…',
  'jeu.pied.attendPlusieurs': 'Waiting for {n} players…',
  'jeu.pied.spectateur': 'You are watching this sudden-death round.',

  'jeu.main.titre': 'Your hand — pick a card',
  'jeu.main.verrou_un': 'Your hand — {cartes} has been locked since last round',
  'jeu.main.verrou_autre': 'Your hand — {cartes} have been locked since last round',

  'jeu.choix.frapper': 'You strike {cible}',
  'jeu.choix.bloquer': 'You block',
  'jeu.choix.bloquer.pour': 'You block for {cible}',
  'jeu.choix.reparer': 'You repair',
  'jeu.choix.reparer.pour': 'You repair for {cible}',
  'jeu.choix.pieger': 'You set a trap',
  'jeu.choix.pieger.pour': 'You set a trap for {cible}',
  'jeu.choix.changer': '{choix} — touch another card or another wall to change',

  'jeu.conseil.cibles_un': 'Only one target possible.',
  'jeu.conseil.cibles_autre': '{n} possible targets.',
  'jeu.conseil.bloqueur': '{nom} just blocked: {carte} is locked for them this round.',
  'jeu.conseil.murBas': 'The lowest wall is {nom}’s.',
  'jeu.equipes.aide':
    'In teams, {bloquer} and {reparer} can target your teammate. {frapper} only hits the other side.',

  'jeu.equipes.vous': 'You two',
  'jeu.equipes.eux': 'Them',
  'jeu.equipes.tienne': 'your team',

  'jeu.manche.surtitre': 'For everyone · this round only',
  'jeu.manche.retour': 'From round {n}, the base rules are back, locks included.',
  'jeu.manche.compris': 'Got it, let’s play',
  'jeu.manche.bandeau': 'Round card · for everyone',
}
