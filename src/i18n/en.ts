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
  'commun.quitter': 'Leave',
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
  'reglages.langue.systeme.nom': 'System',
  'reglages.langue.fr.nom': 'Français',
  'reglages.langue.en.nom': 'English',
  'reglages.langue.actuellement': 'Currently: {langue}',
  'reglages.langue.nom.fr': 'French',
  'reglages.langue.nom.en': 'English',
  'reglages.jeu.titre': 'The game',
  'reglages.jeu.nom.titre': 'Default name',
  'reglages.jeu.nom.aria': 'Your default name',
  'reglages.jeu.nom.detail': 'Pre-filled when you create or join a game.',
  'reglages.jeu.cartesManche.titre': 'See the nine cards',
  'reglages.jeu.cartesManche.detail':
    'The ones from rounds 3, 6 and 9. You switch them on when you create the game.',
  'reglages.garde.titre': 'Privacy',
  'reglages.garde.quoi': 'Your record, your theme and your language, on this device only.',
  'reglages.garde.rien':
    'No account, no ads, no analytics. Games go straight from one phone to another: there is no game server, and a matchmaking service only helps establish the connection — it never sees the game.',
  'reglages.garde.horsLigne':
    'Once the app is installed it works offline. Multiplayer, though, needs a connection.',
  'reglages.garde.plus': 'Learn more',
  'reglages.effacer.bouton': 'Erase my data',
  'reglages.effacer.titre': 'Erase your data?',
  'reglages.effacer.avant': 'What goes:',
  'reglages.effacer.palmares': 'Your record: games, wins, bricks, cards played',
  'reglages.effacer.theme': 'Your theme',
  'reglages.effacer.langue': 'Your language',
  'reglages.effacer.nom': 'Your default name',
  'reglages.effacer.irreversible': 'It happens at once, and nothing is kept anywhere else.',
  'reglages.effacer.annuler': 'Cancel',
  'reglages.effacer.confirmer': 'Erase',
  'reglages.effacer.fait': 'Erased. The app is as it was on day one.',
  'reglages.propos.titre': 'About',
  'reglages.propos.version': 'Version {v}',
  'reglages.propos.changelog': 'Release notes',
  'reglages.propos.depot': 'Source code',
  'reglages.propos.installer': 'Install the app',
  'reglages.propos.installerDetail':
    'It starts faster, works offline and drops the address bar.',

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
  'recit.verrou.autre_un': '— {cartes} is locked for them next round.',
  'recit.verrou.autre_autre': '— {cartes} are locked for them next round.',

  'recit.joue.sur': '{carte} on {cible}',
  'recit.joue.rien': 'did not play',

  /* ---------------------------------------------------------- révélation */

  'revelation.titre': 'Reveal',
  'revelation.mortSubite': 'sudden death · round {n}',
  'revelation.tousJoue': 'round {n} · everyone has played',
  'revelation.cascade': 'turning the cards over one by one',
  'revelation.dosCache': 'Card still face down.',
  'revelation.suivant': 'Next round',
  'revelation.classement': 'Final standings',
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
  'jeu.contrainte.interdit': 'Locked: {cartes}',
  'jeu.contrainte.libre': 'Everything is playable',
  'jeu.contrainte.aria.interdit': 'Locked for {nom}: {cartes}.',
  'jeu.contrainte.aria.libre': 'Everything is playable for {nom}.',
  'jeu.carte.interdite': 'locked this round',

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
  'jeu.tag.choisit': 'still choosing',
  'jeu.tag.coequipier': 'teammate',

  'jeu.bandeau.frappe': 'Your strike lands on this wall',
  'jeu.ricochet.aussi': 'Ricochet — also hits {nom}',
  'jeu.ricochet.aussi.moi': 'Ricochet — also hits your wall',
  'jeu.viser.aria': 'Aim at {nom}’s wall — {briques} standing',

  'jeu.pied.cibler': 'Touch a wall to aim',
  'jeu.pied.continuer': 'Touch a card to go on',
  'jeu.pied.tousJoue': 'Everyone has played',
  'jeu.pied.attendUn': 'Waiting for {nom}…',
  'jeu.pied.attendPlusieurs': 'Waiting for {n} players…',
  'jeu.pied.spectateur': 'You are watching this sudden-death round.',

  'jeu.main.titre': 'Your hand — pick a card',
  'jeu.main.double_un': 'Your hand — one more card',
  'jeu.main.double_autre': 'Your hand — Last wall: you play {n} cards',
  'jeu.main.interdit_un': 'Your hand — {cartes} is locked this round',
  'jeu.main.interdit_autre': 'Your hand — {cartes} are locked this round',

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
  'jeu.manche.bandeau.pour': 'Round card · {nom}',

  /* ------------------------------------------------------------- le salon */

  'salon.code.titre': 'Code to share',
  'salon.code.aria': 'Game code: {lettres}',
  'salon.code.copier': 'Copy',
  'salon.code.copie': 'Copied',
  'salon.code.partager': 'Share',

  'salon.qr.aide': 'Or let them scan it: the app opens with the code already filled in.',
  'salon.code.copier.aria': 'Copy the code {code}',
  'salon.code.invitation': 'Join my game of Rempart with the code {code}.',
  'salon.lien.recherche': 'Connecting…',
  'salon.lien.perdu': 'The connection did not go through.',

  'salon.joueurs.titre': 'Players connected',
  'salon.joueur.absent': 'away',
  'salon.joueur.moiHote': 'you · host',
  'salon.joueur.moi': 'you',
  'salon.joueur.hote': 'host',
  'salon.joueur.pret': 'ready',
  'salon.joueur.choisit': 'choosing…',
  'salon.bot.retirer': 'Remove',
  'salon.bot.retirer.aria': 'Remove the bot {nom}',
  'salon.bot.ajouter': 'Add a bot',
  'salon.bot.niveau.aria': '{nom}’s level',
  'salon.bot.niveau.choix.aria': '{nom}: {niveau} level',
  'salon.niveau.tranquille': 'easy-going',
  'salon.niveau.normal': 'normal',
  'salon.niveau.redoutable': 'ruthless',

  'salon.demande.veutJouer': 'wants to play',
  'salon.demande.ouvrir': 'Let in',
  'salon.demande.pleine': 'Table full',
  'salon.demande.refuser': 'Turn away',

  'salon.place.assez_un': 'One open seat — you can start with {presents}.',
  'salon.place.assez_autre': '{n} open seats — you can start with {presents}.',
  'salon.place.pasAssez_un': 'One open seat — you need at least two players.',
  'salon.place.pasAssez_autre': '{n} open seats — you need at least two players.',

  'salon.identite.titre': 'My identity',
  'salon.identite.aMoi': 'mine',
  'salon.identite.pris': 'taken',
  'salon.identite.libre': 'free',
  'salon.identite.aria': '{forme} — {etat}',

  'salon.lancer.note.deuxContreDeux': 'two against two',
  'salon.lancer.note.fautQuatre': 'you need four',
  'salon.lancer.note.fautDeux': 'you need two',
  'salon.pret.oui': 'I’m ready',
  'salon.pret.non': 'I’m not ready any more',
  'salon.pret.note': 'waiting for the host',
  'salon.quitter': 'Leave the room',

  'salon.attente.refuse': 'The host did not open the door.',
  'salon.attente.spectateur': 'The table is full, or the game has started.',
  'salon.attente.introuvable': 'That game cannot be found.',
  'salon.attente.frappe': 'We knocked — the host has to open.',
  'salon.attente.cherche': 'Looking for the game…',

  'bot_un': '{n} bot',
  'bot_autre': '{n} bots',
  'salon.compte': '{joueurs} · {places}',
  'salon.compte.complet': '{joueurs} · table full',
  'salon.bot.place': 'Open seat — held by a bot',
  'salon.niveau.titre': 'Bot level',
  'salon.niveau.parSiege.ouvrir': 'Set seat by seat',
  'salon.niveau.parSiege.fermer': 'Fold away',
  'salon.lancer.titre': 'Start the game',
  'salon.lancer.note': '{joueurs} · {bots}',
  'salon.fermer': 'Close the room',
  'salon.fermer.titre': 'Close the room?',
  'salon.fermer.detail':
    'The room closes for everyone, and the code stops leading anywhere. There is no going back.',
  'salon.fermer.oui': 'Close',
  'salon.fermer.non': 'Cancel',

  /* ------------------------------------------------------------ l'accueil */

  'accueil.baseline':
    'Everyone secretly picks one of four cards. The card you play is locked next round.',
  'accueil.format': '2–4 players · 10 rounds · 4 minutes',
  'accueil.cartes.titre': 'The whole game fits in these four cards',
  'accueil.derniere.titre': 'Your last game',
  'accueil.derniere.gagnee': 'Won against {adversaire} · {quand}',
  'accueil.derniere.perdue': 'Lost against {adversaire} · {quand}',
  'accueil.creer': 'Create a game',
  'accueil.rejoindre': 'Join',
  'accueil.rejoindre.note': '{n}-letter code',
  'accueil.regles': 'Rules',
  'accueil.palmares': 'Record',
  'accueil.reglages': 'Settings',
  'accueil.pied': 'No account · no ads · no tracking · works offline',

  /* ----------------------------------------------------------- la création */

  'creation.titre': 'New game',
  'creation.nom.titre': 'Your name',
  'creation.nom.aria': 'Your name in the game',
  'creation.nom.exemple': 'Lea',
  'creation.joueurs.titre': 'Number of players',
  'creation.format.titre': 'Format',
  'creation.format.chacun.titre': 'Every wall for itself',
  'creation.format.chacun.detail':
    'Four walls, four scores. The most bricks left standing wins.',
  'creation.format.equipes.titre': 'Teams, two against two',
  'creation.format.equipes.detail':
    'Shared score. You can block or repair for your teammate.',
  'creation.cartesManche.titre': 'Round cards',
  'creation.cartesManche.detail': 'Every three rounds, one rule drawn at random for everyone.',
  'creation.ouvrir': 'Open the room',
  'creation.format.equipes.raison': 'Four walls are needed: pick 4 players to switch it on.',
  'jeu.pied.attendUn.temps': 'Waiting for {nom} — {s}s',
  'jeu.pied.attendPlusieurs.temps': 'Waiting for {n} players — {s}s',

  /* ----------------------------------------------------------- rejoindre */

  'rejoindre.titre': 'Join',
  'rejoindre.aide':
    'Ask the person who created the game for their code. {n} characters, with none of the letters people mishear.',
  'rejoindre.code.titre': 'Game code',
  'rejoindre.code.aria': 'Game code, {n} characters',
  'rejoindre.nom.exemple': 'Malo',
  'rejoindre.bouton': 'Join',
  'rejoindre.pied': 'The game goes straight from one phone to another. The host opens the door.',

  /* -------------------------------------------------------- la déconnexion */

  'pause.titre': '{nom} lost the connection.',
  'pause.aria': '{nom} lost the connection',
  'pause.detail':
    'The round is paused. If the connection does not come back, that wall stays put and those cards are no longer played — the game goes on.',
  'pause.compte': 'before going on without {nom}',
  'pause.continuer': 'Go on without {nom}',
  'pause.attendre': 'Wait',
  'pause.quitter': 'Leave',
  'pause.garde': 'that seat is kept for as long as it takes',

  'quitter.titre': 'Leave the game?',
  'quitter.aria': 'Leave the game',
  'quitter.seul': 'The game stops here, and it will not count towards your record.',
  'quitter.ensemble':
    'The others carry on without you. Your wall stays up as long as the game lasts.',
  'quitter.arbitre':
    'The others carry on without you, and someone else will referee. Your wall stays up as long as the game lasts.',
  'quitter.garde': 'the code brings you back to your seat',
  'quitter.rester': 'Stay',
  'quitter.confirmer': 'Leave the game',

  /* ------------------------------------------------------ la conversation */

  'chat.bouton': 'Chat',
  'chat.nonLus_un': '{n} new',
  'chat.nonLus_autre': '{n} new',
  'chat.calme': 'there’s time',
  'chat.titre': 'Chat',
  'chat.aria': 'Table chat',
  'chat.surtitre': 'while we wait',
  'chat.fermer': 'Close the chat',
  'chat.vide': 'Nobody has said anything. This is the only moment of the game with time to spare.',
  'chat.champ.aria': 'Your message',
  'chat.champ.exemple': 'Say something…',
  'chat.envoyer': 'Send',
  'chat.moi': 'you',
  'chat.reaction.envoyer': 'Send {nom}',
  'chat.reaction.ouvrir': 'Send a reaction',
  'chat.reaction.fermer': 'Close the reactions',
  'chat.reaction.rire': 'laughing',
  'chat.reaction.aie': 'ouch',
  'chat.reaction.bravo': 'well done',
  'chat.reaction.bienJoue': 'nice one',
  'chat.reaction.grr': 'grr',
  'chat.reaction.pitie': 'mercy',
  'chat.dit': '{nom}: {texte}',

  /* --------------------------------------------------- les avis du réseau */

  'avis.lienEchoue': 'The connection did not go through. Check your network.',
  'avis.lienBloque':
    'Your network is blocking the direct connection. A phone hotspot, or another Wi-Fi, often gets through.',
  'avis.lienPerdu': 'The link with the host is down.',
  'avis.refuse': 'The host did not open the door.',
  'avis.salonPlein': 'The room is full.',
  'avis.partieEnCours': 'The game has already started.',
  'avis.hotePris':
    'Someone else is refereeing the table: you are a guest again, and your wall is untouched.',
  'avis.gestRefuse': 'That move is not playable.',

  'lien.recherche.titre': 'Reconnecting…',
  'lien.recherche.detail': 'The game is kept, nothing is lost.',
  'lien.perdu.partie.titre': 'The link with the host is down.',
  'lien.perdu.partie.detail':
    'Your wall stays put. If the host does not come back, someone else will referee and the game will go on.',
  'lien.perdu.salon.titre': 'The host is gone.',
  'lien.perdu.salon.detail': 'This room no longer exists. Try another code, or create your own game.',
  'lien.repris.titre': 'Connection restored.',
  'lien.autreCode': 'Try another code',

  'maj.titre': 'A new version is ready.',
  'maj.enPartie': 'Your seat is kept: you get it back when the page reloads.',
  'maj.recharger': 'Reload',
  'maj.plusTard': 'Later',
  'avis.botLeve': '{humain} joins the game — {nom} gives up their seat.',

  /* ------------------------------------------------- les quatre cartes, au long */

  'carte.frapper.court': 'break a brick',
  'carte.bloquer.court': 'cancel strikes',
  'carte.reparer.court': 'put a brick back',
  'carte.pieger.court': 'send the strike back',

  'carte.frapper.long': 'Breaks a brick on the target’s wall.',
  'carte.bloquer.long': 'Cancels every strike aimed at you this round.',
  'carte.reparer.long': 'Puts a brick back. No defence this round.',
  'carte.pieger.long': 'Whoever strikes you takes the hit instead.',

  'carte.frapper.effet': 'Breaks a brick on the wall you aim at.',
  'carte.frapper.cout': 'You are wide open: nothing protects you this round.',
  'carte.frapper.quand':
    'When the target has just repaired or struck — they cannot block twice in a row.',
  'carte.bloquer.effet': 'Cancels every strike aimed at you this round.',
  'carte.bloquer.cout': 'You gain nothing and you give up your attack.',
  'carte.bloquer.quand': 'When two players have Strike available and your wall is low.',
  'carte.reparer.effet': 'Puts a brick back on your wall, up to five.',
  'carte.reparer.cout': 'No defence: a strike goes straight through.',
  'carte.reparer.quand':
    'When nobody has a reason to aim at you — or when you think everyone is fighting elsewhere.',
  'carte.pieger.effet': 'Whoever strikes you this round takes the hit instead.',
  'carte.pieger.cout': 'Useless if nobody strikes you: a wasted round.',
  'carte.pieger.quand': 'When yours is the lowest wall and you know they are coming to finish it.',

  /* ------------------------------------------------------------- les règles */

  'regles.titre': 'Rules',
  'regles.duree': '4 min read',
  'regles.chapitres': 'Chapters',
  'regles.chercher': 'Search a rule, a card…',
  'regles.chercher.aria': 'Search a rule or a card',
  'regles.trouvees': 'Round cards found',
  'regles.rien': 'Nothing under that word. Try “lock”, “trap” or “tie”.',
  'regles.sansOrdre': 'Every chapter is reachable from any other. No order imposed.',

  'regles.chapitre.but': 'Rules',
  'regles.chapitre.manche': 'One round',
  'regles.chapitre.verrou': 'The lock',
  'regles.chapitre.cartes': 'Your cards',
  'regles.chapitre.ordre': 'Resolution',
  'regles.chapitre.cas': 'Edge cases',
  'regles.chapitre.fin': 'End of the game',
  'regles.chapitre.manches': 'Round cards',

  'regles.sommaire.but.titre': 'The goal',
  'regles.sommaire.but.detail': 'Ten rounds, five bricks, one wall to keep standing.',
  'regles.sommaire.manche.titre': 'One round',
  'regles.sommaire.manche.detail': 'Choose in secret, reveal, resolve.',
  'regles.sommaire.verrou.titre': 'The lock',
  'regles.sommaire.verrou.detail': 'The card you play is locked next round.',
  'regles.sommaire.cartes.titre': 'Your four cards',
  'regles.sommaire.cartes.detail': 'Strike, Block, Repair, Trap — effect and cost.',
  'regles.sommaire.ordre.titre': 'Resolution order',
  'regles.sommaire.ordre.detail': 'Blocks, traps, strikes, repairs.',
  'regles.sommaire.cas.titre': 'Edge cases',
  'regles.sommaire.cas.detail': 'Wall at zero, stacked strikes, ties…',
  'regles.sommaire.fin.titre': 'End of the game',
  'regles.sommaire.fin.detail': 'The wall is the score.',
  'regles.sommaire.manches.titre': 'Round cards',
  'regles.sommaire.manches.detail': 'The nine cards of rounds 3, 6 and 9.',

  'regles.but.titre': 'Keep the most bricks standing after ten rounds.',
  'regles.but.mur':
    'Your wall is your score: five bricks to start, readable without a number. You do not build, you protect.',
  'regles.but.cartes':
    'Four identical cards for everyone. No deck to draw from: the only unknown is what the others choose.',
  'regles.but.duree':
    'Ten rounds, four minutes. Nobody waits their turn: everyone chooses at the same time.',
  'regles.but.joueurs': 'Two to four players, or teams of two with a shared score.',

  'regles.tour.1.titre': 'Choose',
  'regles.tour.1.detail':
    'Everyone secretly picks one of their cards, and a target if the card needs one. No turn order, no waiting: all four choices happen at once.',
  'regles.tour.2.titre': 'Reveal',
  'regles.tour.2.detail':
    'The four cards turn over together. You see who played what and at whom — the only moment of information in the round.',
  'regles.tour.3.titre': 'Resolve',
  'regles.tour.3.detail':
    'Effects apply in a fixed order, never in player order. Then each card played is locked for the next round.',
  'regles.tour.duree': 'A round lasts as long as the slowest choice: twelve to twenty seconds.',

  'regles.verrou.titre': 'The card you play is locked for you next round.',
  'regles.verrou.manche': 'round {n}',
  'regles.verrou.interdite': 'locked',
  'regles.verrou.detail':
    'This is the one rule that makes the game: after a defence you are always wide open. Blocking twice in a row is impossible.',
  'regles.verrou.ligne':
    'Your row shows what you just played: the others know what you can no longer play.',
  'regles.verrou.bluff':
    'Three choices instead of four — and everyone knows it. That is where the bluff starts.',

  'regles.ordre.intro': 'Always the same order, whoever is playing.',
  'regles.ordre.1.titre': 'Blocks go up',
  'regles.ordre.1.detail': 'Everyone who played Block becomes untouchable for this round.',
  'regles.ordre.2.titre': 'Traps are armed',
  'regles.ordre.2.detail':
    'Everyone who played Trap will send the first strike they take back to whoever threw it.',
  'regles.ordre.3.titre': 'Strikes land',
  'regles.ordre.3.detail':
    'Blocked: the strike is cancelled. Trapped: the attacker loses the brick. Otherwise: the target loses the brick.',
  'regles.ordre.4.titre': 'Repairs count',
  'regles.ordre.4.detail':
    'Bricks come back last — so a repair never saves you from a strike in the same round.',

  'regles.cas.murZero.titre': 'Wall at zero',
  'regles.cas.murZero.detail':
    'Nobody is eliminated. A player at zero bricks keeps playing, can repair, and can win by climbing back: the game only lasts ten rounds.',
  'regles.cas.deuxFrappes.titre': 'Two strikes on the same wall',
  'regles.cas.deuxFrappes.detail':
    'They add up: two bricks fall. A single Block cancels both — the most profitable card when you are the obvious target.',
  'regles.cas.piegeFrappe.titre': 'A strike on a trap, a trap on a strike',
  'regles.cas.piegeFrappe.detail':
    'The trap always wins. If two players strike each other and one of them trapped, only the trapper comes out intact.',
  'regles.cas.murPlein.titre': 'Repairing a full wall',
  'regles.cas.murPlein.detail':
    'The card is playable but gives nothing. It stays useful for one reason: locking Repair and letting people believe your wall is full.',
  'regles.cas.egalite.titre': 'A tie in the tenth round',
  'regles.cas.egalite.detail':
    'Tied players play a sudden-death round: Strike compulsory, any target. The first to lose a brick loses the game. Since everyone chooses at once, a tie can hold: after three rounds the highest wall wins, then the seat at the table.',

  'regles.fin.titre': 'The wall is the score.',
  'regles.fin.detail':
    'At the end of the tenth round you count the bricks left standing. The highest wall wins; in teams the two walls are added together.',
  'regles.fin.exemple.nom': 'Malo',
  'regles.fin.exemple.score': '{briques} · wins',
  'regles.fin.sansBonus':
    'No bonus, no penalty: the standings have been on screen since the first round.',
  'regles.fin.rejouer': '“Play again with the same people” restarts at once: same room, walls back to five.',

  'regles.manches.intro': 'One round only, the same for everyone, never twice in a game.',

  /* --------------------------------------------------------- règles rapides */

  'rapides.titre': 'Keep the most bricks standing after ten rounds.',
  'rapides.resume':
    'Everyone picks a card at the same time, plus a target. Reveal, resolve. That is all.',
  'rapides.verrou.titre': 'The lock',
  'rapides.verrou.detail':
    'The card you just played is set aside: locked next round. Your opponents can see it — and so can you, on their row.',
  'rapides.manches.titre': 'Round cards',
  'rapides.manches.detail':
    'Rounds 3, 6 and 9: a shared rule appears in a banner. It applies to everyone, for one round only.',
  'rapides.compris': 'Got it',

  /* ----------------------------------------------------------- le palmarès */

  'palmares.titre': 'Record',
  'palmares.local': 'on this device',
  'palmares.vide.titre': 'No games played yet.',
  'palmares.vide.detail':
    'The record fills itself: games, wins, bricks saved and the cards you play most.',
  'palmares.total.parties': 'games',
  'palmares.total.victoires': 'wins',
  'palmares.total.briques': 'bricks saved',
  'palmares.victoires.titre': 'Wins',
  'palmares.victoires.ligne_un': '{v} win · {n} game',
  'palmares.victoires.ligne_autre': '{v} wins · {n} games',
  'palmares.cartes.titre': 'The cards you play most',
  'palmares.parties.titre': 'Recent games',
  'palmares.partie.ligne': '{gagnant} · {briques}',
  'palmares.partie.format.chacun': 'Every wall for itself · {n}p',
  'palmares.partie.format.equipes': 'Teams 2 v 2',
  'palmares.partie.date': '{date} · {heure} · {format}',
  'palmares.gagnee': 'won',
  'palmares.perdue': 'lost',
  'palmares.effacer': 'Erase the record',
  'palmares.effacer.vraiment': 'Erase everything, really',
  'palmares.annuler': 'Cancel',
  'palmares.pied': 'Everything is kept on the device. No account, nothing sent.',

  /* --------------------------------------------------------- fin de partie */

  'fin.gagne': '{nom} wins',
  'fin.gagnent': '{noms} win',
  'fin.mortSubite_un': 'Sudden death · {n} round',
  'fin.mortSubite_autre': 'Sudden death · {n} rounds',
  'fin.dixManches': 'Ten rounds · over',
  'fin.termine': 'Over',
  'fin.departage':
    'Sudden death did not separate them in three rounds: the highest wall decides, then the seat at the table.',
  'fin.toi': 'you',
  'fin.vainqueur': 'wins',
  'fin.rejouer': 'Play again with the same people',
  'fin.palmares': 'Record',
  'fin.quitter': 'Leave',
  'fin.hoteRelance': 'The host can start another game with the same players.',

  'fin.tombe': 'wall down · round {n}',
  'fin.recap.titre': 'The ten rounds',
  'fin.recap.aria': 'What each player played, round by round',
  'fin.recap.manche': 'Round {n}',
  'fin.recap.cellule': '{carte}',
  'fin.recap.vide': 'played nothing',
  'fin.recap.legende': 'One row per player, one column per round. The drawing is the card played.',

  'fin.resume.departage.moi':
    'Three sudden-death rounds and not one wall gave way. You win on the tiebreak.',
  'fin.resume.departage.autre':
    'Three sudden-death rounds and not one wall gave way. The tiebreak decided.',
  'fin.resume.intact.moi': 'Wall intact: five bricks standing. Nobody dared aim at you.',
  'fin.resume.intact.autre':
    'Wall intact: five bricks standing. The rest of the time, nobody dared aim at it.',
  'fin.resume.rase_un': 'One wall at zero, and the game came down to {briques}. The tenth round decided.',
  'fin.resume.rase_autre':
    '{n} walls at zero, and the game came down to {briques}. The tenth round decided.',
  'fin.resume.verrou.moi':
    'You finish on {briques}. The lock made the difference: three choices instead of four, and everyone knew it.',
  'fin.resume.verrou.autre': '{briques} standing at the tenth. The lock did the rest.',

  /* --------------------------------------------------- les cartes de manche */

  'manche.double-frappe.nom': 'Double strike',
  'manche.double-frappe.axe': 'damage',
  'manche.double-frappe.detail': 'Strike breaks two bricks. Repair puts two back.',
  'manche.double-frappe.pourquoi': 'The most violent round in the game: everyone wants to block, so striking pays.',

  'manche.mur-nu.nom': 'Bare wall',
  'manche.mur-nu.axe': 'defence',
  'manche.mur-nu.detail': 'Block has no effect this round.',
  'manche.mur-nu.pourquoi': 'Removes the only safe card. Trap becomes the real defence — and it shows on people’s faces.',

  'manche.treve.nom': 'Truce',
  'manche.treve.axe': 'damage',
  'manche.treve.detail': 'Strike is forbidden. Only Block, Repair and Trap can be played.',
  'manche.treve.pourquoi': 'A breathing round where low walls climb back: the standings tighten all at once.',

  'manche.ricochet.nom': 'Ricochet',
  'manche.ricochet.axe': 'target',
  'manche.ricochet.detail': 'Every strike also hits the player sitting just after the target.',
  'manche.ricochet.pourquoi': 'Impossible to aim cleanly: you make enemies without meaning to.',

  'manche.requisition.nom': 'Requisition',
  'manche.requisition.axe': 'economy',
  'manche.requisition.detail': 'The broken brick is not destroyed: it moves onto the attacker’s wall.',
  'manche.requisition.pourquoi': 'Striking becomes a gain, not only a loss for the other. The gaps blow open.',

  'manche.memoire-courte.nom': 'Short memory',
  'manche.memoire-courte.axe': 'lock',
  'manche.memoire-courte.detail': 'The lock is lifted: anyone can replay last round’s card.',
  'manche.memoire-courte.pourquoi': 'The only moment you can block twice in a row — and where last round’s bluff is worth nothing.',

  'manche.contre-attaque.nom': 'Counter-attack',
  'manche.contre-attaque.axe': 'defence',
  'manche.contre-attaque.detail': 'Traps send back two bricks instead of one.',
  'manche.contre-attaque.pourquoi': 'Makes the lowest wall dangerous to finish off: the round where you spare the wounded.',

  'manche.cartes-sur-table.nom': 'Cards on the table',
  'manche.cartes-sur-table.axe': 'information',
  'manche.cartes-sur-table.detail': 'Cards are revealed one by one, from the lowest wall to the highest.',
  'manche.cartes-sur-table.pourquoi': 'The last to reveal plays with everyone else’s information: being ahead costs.',

  'manche.dernier-mur.nom': 'Last wall',
  'manche.dernier-mur.axe': 'catching up',
  'manche.dernier-mur.detail': 'The player with the fewest bricks plays two cards this round.',
  'manche.dernier-mur.pourquoi': 'The game’s safety net: nobody is dropped before the tenth round.',
}
