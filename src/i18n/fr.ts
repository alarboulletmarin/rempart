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
} as const
