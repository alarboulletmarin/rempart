/**
 * Le catalogue français — la source des clés.
 *
 * C'est ce fichier qui définit ce qui existe : `en.ts` est typé sur lui, donc
 * une clé ajoutée ici et oubliée là-bas ne compile pas. Une chaîne visible à
 * l'écran n'a le droit de vivre nulle part ailleurs.
 *
 * **Des phrases entières, jamais des morceaux.** Une clé porte une phrase que
 * l'on pourrait lire à voix haute. Les fragments recollés à l'affichage —
 * « Tu » + verbe, « ce » + moment, radical + « s » — tiennent en français par
 * accident et ne tiennent dans aucune autre langue : chaque forme irrégulière
 * a donc sa propre clé plutôt qu'une règle écrite dans un composant.
 *
 * **Les pluriels** vont par paires `_un` / `_autre`, choisies par
 * `Intl.PluralRules` : le français range zéro avec le singulier, l'anglais avec
 * le pluriel, et ce n'est pas au code d'écran de le savoir.
 *
 * **Les paramètres** s'écrivent `{nom}` et sont remplacés tels quels.
 */

export const fr = {
  /* ------------------------------------------------------------ les cartes */

  'carte.frapper': 'Frapper',
  'carte.bloquer': 'Bloquer',
  'carte.reparer': 'Réparer',
  'carte.pieger': 'Piéger',

  /* ------------------------------------------------------------- le compte */

  'brique_un': '{n} brique',
  'brique_autre': '{n} briques',
  /* « une brique » plutôt que « 1 brique » : c'est ainsi qu'on le dit dans une
     phrase de récit, alors que la pastille du mur, elle, porte le chiffre. */
  'briqueDite_un': 'une brique',
  'briqueDite_autre': '{n} briques',
  'joueur_un': '{n} joueur',
  'joueur_autre': '{n} joueurs',
  'manche_un': '{n} manche',
  'manche_autre': '{n} manches',
  'place_un': '{n} place libre',
  'place_autre': '{n} places libres',

  /* --------------------------------------------------------------- le temps
   *
   * Chaque moment porte son démonstratif déjà accordé : « cet après-midi »
   * s'écrit ici en entier, une bonne fois, plutôt que de se fabriquer à
   * l'affichage en collant « ce » devant un mot qui commence par une voyelle.
   */

  'date.matin': 'ce matin',
  'date.apresMidi': 'cet après-midi',
  'date.soir': 'ce soir',
  'date.hier.matin': 'hier matin',
  'date.hier.apresMidi': 'hier après-midi',
  'date.hier.soir': 'hier soir',
  'date.ilYaJours': 'il y a {n} jours',

  /* ------------------------------------------------------------- le commun */

  'commun.retour': 'Retour',
  'commun.manche': 'Manche {n}',

  /* Le mur, dit en toutes lettres pour les lecteurs d'écran. */
  'mur.aria_un': 'Mur de {nom} : {n} brique sur {total}.',
  'mur.aria_autre': 'Mur de {nom} : {n} briques sur {total}.',

  /* Les quatre formes d'identité. Elles portent l'information autant que la
     couleur, donc elles se nomment. */
  'forme.0': 'Cercle',
  'forme.1': 'Carré',
  'forme.2': 'Triangle',
  'forme.3': 'Pentagone',

  /* ------------------------------------------------------------- réglages */

  'reglages.titre': 'Réglages',
  'reglages.theme.titre': 'Thème',
  'reglages.theme.systeme.nom': 'Comme le téléphone',
  'reglages.theme.systeme.detail': 'Suit le réglage clair ou sombre du système.',
  'reglages.theme.etabli.nom': 'Établi',
  'reglages.theme.etabli.detail': 'La table de jour : kraft, carton, terre cuite.',
  'reglages.theme.veillee.nom': 'Veillée',
  'reglages.theme.veillee.detail': 'Le même établi à la lampe : bois brûlé et craie.',
  'reglages.langue.titre': 'Langue',
  'reglages.langue.systeme.nom': 'Comme le téléphone',
  'reglages.langue.systeme.detail': 'Suit la langue du système, si le jeu la parle.',
  'reglages.langue.fr.nom': 'Français',
  'reglages.langue.fr.detail': 'Le jeu, les règles et le récit des manches en français.',
  'reglages.langue.en.nom': 'English',
  'reglages.langue.en.detail': 'Le jeu, les règles et le récit des manches en anglais.',
  'reglages.jeu.titre': 'Le jeu',
  'reglages.jeu.cartesManche.titre': 'Cartes de manche',
  'reglages.jeu.cartesManche.detail':
    'Les neuf cartes des manches 3, 6 et 9. Elles s’activent à la création de la partie.',
  'reglages.garde.titre': 'Ce que l’app garde',
  'reglages.garde.quoi': 'Ton palmarès, ton thème et ta langue, sur cet appareil uniquement.',
  'reglages.garde.rien':
    'Aucun compte, aucune publicité, aucune mesure d’audience. Les parties passent directement d’un téléphone à l’autre : il n’y a pas de serveur de jeu, et un service de mise en relation sert seulement à établir la connexion — il ne voit jamais la partie.',
  'reglages.garde.horsLigne':
    'Une fois l’app installée, elle fonctionne hors ligne. Le multijoueur, lui, demande une connexion.',
  'reglages.pied': 'Rempart · 2–4 joueurs · 10 manches · 4 minutes',

  /* ------------------------------------------------ le récit de la manche
   *
   * Chaque cas porte une phrase ENTIÈRE, et autant de clés qu'il y a de points
   * de vue : « Tu as frappé Malo » et « Léa a frappé Malo » ne sont pas la même
   * phrase à un pronom près, et fabriquer la seconde à partir de la première
   * demandait d'accorder un verbe en collant « as » ou « a » — ce qui ne
   * survit à aucun changement de langue.
   */

  'recit.retourne.titre.moiAuteur': 'Le piège de {piegeur} a retourné ta frappe.',
  'recit.retourne.titre.moiPiegeur': 'Ton piège a retourné la frappe de {auteur}.',
  'recit.retourne.titre.autres': 'Le piège de {piegeur} a retourné la frappe de {auteur}.',
  'recit.retourne.detail.moiAuteur_un': 'Tu perds une brique, {piegeur} n’a rien perdu.',
  'recit.retourne.detail.moiAuteur_autre': 'Tu perds {n} briques, {piegeur} n’a rien perdu.',
  'recit.retourne.detail.moiPiegeur_un': '{auteur} perd une brique et tu n’as rien perdu.',
  'recit.retourne.detail.moiPiegeur_autre': '{auteur} perd {n} briques et tu n’as rien perdu.',
  'recit.retourne.detail.autres_un': '{auteur} perd une brique et {piegeur} n’a rien perdu.',
  'recit.retourne.detail.autres_autre': '{auteur} perd {n} briques et {piegeur} n’a rien perdu.',

  'recit.bloc.titre.tout.moi': 'Tu as tout arrêté d’un seul bloc.',
  'recit.bloc.titre.tout.autre': '{nom} a tout arrêté d’un seul bloc.',
  'recit.bloc.titre.une.moi': 'Tu as bloqué la frappe.',
  'recit.bloc.titre.une.autre': '{nom} a bloqué la frappe.',
  'recit.bloc.detail.moi_un':
    'La frappe est annulée. Tu es maintenant à découvert : {carte} t’est interdit la manche prochaine.',
  'recit.bloc.detail.moi_autre':
    '{n} frappes annulées. Tu es maintenant à découvert : {carte} t’est interdit la manche prochaine.',
  'recit.bloc.detail.autre_un':
    'La frappe est annulée. {nom} est maintenant à découvert : {carte} lui est interdit la manche prochaine.',
  'recit.bloc.detail.autre_autre':
    '{n} frappes annulées. {nom} est maintenant à découvert : {carte} lui est interdit la manche prochaine.',

  'recit.frappe.titre.surMoi_un': '{nom} a cassé ta brique.',
  'recit.frappe.titre.surMoi_autre': '{nom} a cassé tes briques.',
  'recit.frappe.titre.parMoi': 'Tu as frappé {cible}.',
  'recit.frappe.titre.autres': '{nom} a frappé {cible}.',
  'recit.frappe.detail.moi_un': 'Tu perds une brique.',
  'recit.frappe.detail.moi_autre': 'Tu perds {n} briques.',
  'recit.frappe.detail.autre_un': '{nom} perd une brique.',
  'recit.frappe.detail.autre_autre': '{nom} perd {n} briques.',

  'recit.repare.titre.equipe.parMoi': 'Tu as réparé le mur de {cible}.',
  'recit.repare.titre.equipe.pourMoi': '{nom} a réparé le mur de ton équipe.',
  'recit.repare.titre.equipe.autres': '{nom} a réparé le mur de {cible}.',
  'recit.repare.titre.seul.moi': 'Tu as remonté ton mur.',
  'recit.repare.titre.seul.autre': '{nom} a remonté son mur.',
  'recit.repare.detail_un': '+{n} brique, et personne n’a frappé cette manche.',
  'recit.repare.detail_autre': '+{n} briques, et personne n’a frappé cette manche.',

  'recit.rien.titre': 'Rien n’est tombé.',
  'recit.rien.detail':
    'Aucune frappe n’a porté. Les verrous changent quand même : trois choix au tour prochain.',

  /* Le verrou se dit à la suite du détail, dans la même respiration : c'est
     pourquoi la clé porte son tiret. */
  'recit.verrou.moi_un': '— et {cartes} t’est interdit la manche prochaine.',
  'recit.verrou.moi_autre': '— et {cartes} te sont interdites la manche prochaine.',
  'recit.verrou.autre_un': '— {cartes} lui est interdit la manche prochaine.',
  'recit.verrou.autre_autre': '— {cartes} lui sont interdites la manche prochaine.',

  'recit.joue.sur': '{carte} sur {cible}',
  'recit.joue.rien': 'n’a pas joué',

  /* ---------------------------------------------------------- révélation */

  'revelation.titre': 'Révélation',
  'revelation.mortSubite': 'mort subite · manche {n}',
  'revelation.tousJoue': 'manche {n} · tout le monde a joué',
  'revelation.cascade': 'on retourne les cartes une par une',
  'revelation.dosCache': 'Carte encore face cachée.',
  'revelation.suivant': 'Manche suivante',
  'revelation.classement': 'Voir le classement',
  'revelation.toi': 'toi',
  'revelation.absent': 'absent',

  /* L'étiquette d'une ligne de révélation : un motif venu du moteur, mis en
     mots ici — le moteur tourne chez l'arbitre et ne connaît pas la langue de
     qui lit. */
  'etiquette.absent': 'absent',
  'etiquette.retourne': 'retourné −{n}',
  'etiquette.piegeDeclenche': 'piège déclenché',
  'etiquette.frappesAnnulees_un': '{n} frappe annulée',
  'etiquette.frappesAnnulees_autre': '{n} frappes annulées',
  'etiquette.annule': 'annulé',
  'etiquette.briquesPerdues_un': '−{n} brique',
  'etiquette.briquesPerdues_autre': '−{n} briques',
  'etiquette.briquesGagnees_un': '+{n} brique',
  'etiquette.briquesGagnees_autre': '+{n} briques',
  'etiquette.murPlein': 'mur plein',
  'etiquette.touche': 'touché',
  'etiquette.rien': '',

  /* --------------------------------------------------------- le tour de jeu */

  'jeu.etat.choisie': 'choisie',
  'jeu.etat.jouable': 'jouable',
  'jeu.etat.interdite': 'interdite',
  'jeu.carte.aria': '{carte} — {etat}',
  'jeu.verrou.rien': 'rien joué',
  'jeu.verrou.carte': '{carte} · interdite',

  'jeu.entete.pause': 'en pause',
  'jeu.entete.cible': '{carte} · choisis une cible',
  'jeu.entete.ontJoue': '{n} / {total} ont joué',
  'jeu.entete.equipes': 'Équipes · score commun',
  'jeu.entete.mortSubite': 'Mort subite',
  'jeu.entete.carteCommune': 'carte commune',

  'jeu.tag.absent': 'absent',
  'jeu.tag.cibler': 'cibler',
  'jeu.tag.toi': 'toi',
  'jeu.tag.aJoue': 'a joué',
  'jeu.tag.choisit': 'choisit…',
  'jeu.tag.coequipier': 'coéquipier',

  'jeu.bandeau.frappe': 'Ta frappe part sur ce mur',
  'jeu.viser.aria': 'Viser le mur de {nom} — {briques} debout',

  'jeu.pied.cibler': 'Touche un mur pour cibler',
  'jeu.pied.continuer': 'Touche une carte pour continuer',
  'jeu.pied.tousJoue': 'Tout le monde a joué',
  'jeu.pied.attendUn': 'On attend {nom}…',
  'jeu.pied.attendPlusieurs': 'On attend {n} joueurs…',
  'jeu.pied.spectateur': 'Tu regardes cette manche de mort subite.',

  'jeu.main.titre': 'Ta main — choisis une carte',
  'jeu.main.verrou_un': 'Ta main — {cartes} est interdite depuis la manche passée',
  'jeu.main.verrou_autre': 'Ta main — {cartes} sont interdites depuis la manche passée',

  'jeu.choix.frapper': 'Tu frappes {cible}',
  'jeu.choix.bloquer': 'Tu bloques',
  'jeu.choix.bloquer.pour': 'Tu bloques pour {cible}',
  'jeu.choix.reparer': 'Tu répares',
  'jeu.choix.reparer.pour': 'Tu répares pour {cible}',
  'jeu.choix.pieger': 'Tu pièges',
  'jeu.choix.pieger.pour': 'Tu pièges pour {cible}',
  'jeu.choix.changer': '{choix} — touche une autre carte ou un autre mur pour changer',

  'jeu.conseil.cibles_un': 'Une seule cible possible.',
  'jeu.conseil.cibles_autre': '{n} cibles possibles.',
  /* « il ne peut pas » supposait un genre que le nom d'un joueur ne dit pas :
     la phrase se dit maintenant sans pronom personnel. */
  'jeu.conseil.bloqueur': '{nom} vient de bloquer : {carte} lui est interdit cette manche.',
  'jeu.conseil.murBas': 'Le mur le plus bas est celui de {nom}.',
  'jeu.equipes.aide':
    'En équipes, {bloquer} et {reparer} peuvent viser ton coéquipier. {frapper} ne vise que l’équipe d’en face.',

  'jeu.equipes.vous': 'Vous',
  'jeu.equipes.eux': 'Eux',
  'jeu.equipes.tienne': 'ton équipe',

  'jeu.manche.surtitre': 'Pour tout le monde · cette manche seulement',
  'jeu.manche.retour': 'À la manche {n}, on revient aux règles de base, verrous compris.',
  'jeu.manche.compris': 'Compris, je joue',
  'jeu.manche.bandeau': 'Carte de manche · pour tout le monde',

  /* ------------------------------------------------------------- le salon */

  'salon.code.titre': 'Code à partager',
  'salon.code.aria': 'Code de la partie : {lettres}',
  'salon.code.copier': 'Copier',
  'salon.code.copie': 'Copié',
  'salon.code.partager': 'Partager',
  'salon.code.invitation': 'Rejoins ma partie de Rempart avec le code {code}.',
  'salon.lien.recherche': 'Mise en relation…',
  'salon.lien.perdu': 'La mise en relation n’a pas abouti.',

  'salon.joueurs.titre': 'Joueurs connectés',
  'salon.joueur.absent': 'absent',
  'salon.joueur.moiHote': 'toi · hôte',
  'salon.joueur.moi': 'toi',
  'salon.joueur.hote': 'hôte',
  'salon.joueur.pret': 'prêt',
  'salon.joueur.choisit': 'choisit…',
  'salon.joueur.bot': 'bot',
  'salon.bot.retirer': 'Retirer',
  'salon.bot.retirer.aria': 'Retirer le bot {nom}',
  'salon.bot.ajouter': 'Ajouter un bot',
  'salon.bot.niveau.aria': 'Niveau de {nom}',
  'salon.bot.niveau.choix.aria': '{nom} : niveau {niveau}',
  'salon.niveau.tranquille': 'tranquille',
  'salon.niveau.normal': 'normal',
  'salon.niveau.redoutable': 'redoutable',

  'salon.demande.veutJouer': 'veut jouer',
  'salon.demande.ouvrir': 'Ouvrir',
  'salon.demande.pleine': 'Table pleine',
  'salon.demande.refuser': 'Refuser',

  'salon.place.assez_un': 'Une place libre — on peut lancer à {presents}.',
  'salon.place.assez_autre': '{n} places libres — on peut lancer à {presents}.',
  'salon.place.pasAssez_un': 'Une place libre — il faut être deux au minimum.',
  'salon.place.pasAssez_autre': '{n} places libres — il faut être deux au minimum.',

  'salon.identite.titre': 'Mon identité',
  'salon.identite.aMoi': 'à moi',
  'salon.identite.pris': 'pris',
  'salon.identite.libre': 'libre',
  'salon.identite.aria': '{forme} — {etat}',

  'salon.lancer': 'Lancer',
  'salon.lancer.note.deuxContreDeux': 'deux contre deux',
  'salon.lancer.note.fautQuatre': 'il faut être quatre',
  'salon.lancer.note.suffisent': '{n} joueurs suffisent',
  'salon.lancer.note.fautDeux': 'il faut être deux',
  'salon.pret.oui': 'Je suis prêt',
  'salon.pret.non': 'Je ne suis plus prêt',
  'salon.pret.note': 'on attend l’hôte',
  'salon.quitter': 'Quitter le salon',

  'salon.attente.refuse': 'L’hôte n’a pas ouvert la porte.',
  'salon.attente.spectateur': 'La table est complète ou la partie a commencé.',
  'salon.attente.introuvable': 'On ne trouve pas cette partie.',
  'salon.attente.frappe': 'On a frappé — l’hôte doit ouvrir.',
  'salon.attente.cherche': 'On cherche la partie…',

  /* ------------------------------------------------------------ l'accueil */

  'accueil.baseline':
    'Chacun choisit en secret une carte parmi quatre. La carte jouée est interdite la manche suivante.',
  'accueil.format': '2–4 joueurs · 10 manches · 4 minutes',
  'accueil.cartes.titre': 'Tout le jeu tient dans ces quatre cartes',
  'accueil.derniere.titre': 'Ta dernière partie',
  'accueil.derniere.gagnee': 'Gagnée contre {adversaire} · {quand}',
  'accueil.derniere.perdue': 'Perdue contre {adversaire} · {quand}',
  'accueil.creer': 'Créer une partie',
  'accueil.rejoindre': 'Rejoindre',
  'accueil.rejoindre.note': 'code à {n}',
  'accueil.regles': 'Règles',
  'accueil.palmares': 'Palmarès',
  'accueil.reglages': 'Réglages',
  'accueil.pied': 'Sans compte · sans pub · sans tracking · fonctionne hors ligne',

  /* ----------------------------------------------------------- la création */

  'creation.titre': 'Nouvelle partie',
  'creation.nom.titre': 'Ton nom',
  'creation.nom.aria': 'Ton nom dans la partie',
  'creation.nom.exemple': 'Léa',
  'creation.joueurs.titre': 'Nombre de joueurs',
  'creation.choisi': 'choisi',
  'creation.format.titre': 'Format',
  'creation.format.chacun.titre': 'Chacun pour soi',
  'creation.format.chacun.detail':
    'Quatre murs, quatre scores. Le plus de briques debout gagne.',
  'creation.format.equipes.titre': 'Équipes 2 contre 2',
  'creation.format.equipes.detail':
    'Score commun. On peut bloquer ou réparer pour son coéquipier.',
  'creation.cartesManche.titre': 'Cartes de manche',
  'creation.cartesManche.detail':
    'Toutes les trois manches, une règle tirée au sort pour tout le monde.',
  'creation.ouvrir': 'Ouvrir le salon',

  /* ----------------------------------------------------------- rejoindre */

  'rejoindre.titre': 'Rejoindre',
  'rejoindre.aide':
    'Demande son code à la personne qui a créé la partie. {n} caractères, sans les lettres qu’on confond à l’oral.',
  'rejoindre.code.titre': 'Code de la partie',
  'rejoindre.code.aria': 'Code de la partie, {n} caractères',
  'rejoindre.nom.exemple': 'Malo',
  'rejoindre.bouton': 'Rejoindre',
  'rejoindre.pied':
    'La partie passe directement d’un téléphone à l’autre. L’hôte ouvre la porte.',

  /* -------------------------------------------------------- la déconnexion */

  'pause.titre': '{nom} a perdu la connexion.',
  'pause.aria': '{nom} a perdu la connexion',
  'pause.detail':
    'La manche est mise en pause. Si la connexion ne revient pas, son mur reste en place et ses cartes ne sont plus jouées — la partie continue.',
  'pause.compte': 'avant de continuer sans {nom}',
  'pause.continuer': 'Continuer sans {nom}',
  'pause.attendre': 'Attendre',
  'pause.quitter': 'Quitter',
  'pause.garde': 'on garde sa place aussi longtemps qu’il faut',

  /* ------------------------------------------------------ la conversation */

  'chat.bouton': 'Conversation',
  'chat.nonLus_un': '{n} nouveau',
  'chat.nonLus_autre': '{n} nouveaux',
  'chat.calme': 'on a le temps',
  'chat.titre': 'Conversation',
  'chat.aria': 'Conversation de la table',
  'chat.surtitre': 'pendant qu’on attend',
  'chat.fermer': 'Fermer la conversation',
  'chat.vide': 'Personne n’a rien dit. C’est le seul moment de la partie où l’on a le temps.',
  'chat.champ.aria': 'Ton message',
  'chat.champ.exemple': 'Dis quelque chose…',
  'chat.envoyer': 'Envoyer',
  'chat.moi': 'toi',
  'chat.reaction.envoyer': 'Envoyer {nom}',
  'chat.reaction.ouvrir': 'Réagir',
  'chat.reaction.fermer': 'Fermer les réactions',
  'chat.reaction.rire': 'rire',
  'chat.reaction.aie': 'aïe',
  'chat.reaction.bravo': 'bravo',
  'chat.reaction.bienJoue': 'bien joué',
  'chat.reaction.grr': 'grr',
  'chat.reaction.pitie': 'pitié',
  'chat.dit': '{nom} : {texte}',

  /* --------------------------------------------------- les avis du réseau */

  'avis.lienEchoue': 'La mise en relation n’a pas abouti. Vérifie ta connexion.',
  'avis.lienBloque':
    'Ton réseau bloque la connexion directe. Un partage de connexion, ou un autre Wi-Fi, passe souvent mieux.',
  'avis.lienPerdu': 'Le lien avec l’hôte est coupé.',
  'avis.refuse': 'L’hôte n’a pas ouvert la porte.',
  'avis.salonPlein': 'Le salon est complet.',
  'avis.partieEnCours': 'La partie a déjà commencé.',
  'avis.hotePris':
    'Quelqu’un d’autre arbitre la table : tu redeviens invité, ton mur reste intact.',
  'avis.gestRefuse': 'Ce coup n’est pas jouable.',
} as const
