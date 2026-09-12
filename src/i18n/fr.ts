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
} as const
