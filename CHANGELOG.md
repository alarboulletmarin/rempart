# Journal des versions

Écrit à la main, dans la voix du projet : ce que chaque version change pour la
personne qui joue, pas quels fichiers ont bougé. Les dates sont celles de la
publication.

## Non publié

### Changé : l’écran Réglages tient sur deux hauteurs d’écran

Neuf cartes empilées à l’identique, dont deux « Comme le téléphone » dans deux
sections différentes qu’on prenait pour un doublon, quatre-vingt-dix mots de
confidentialité lus une seule fois, et un pied de page qui répétait l’accroche
de l’accueil. Trois écrans et demi de défilement ; il en reste un et demi.

- **La langue tient sur une ligne.** Un contrôle segmenté — `Système` ·
  `Français` · `English` — au lieu de trois cartes plein format avec
  description : « Français » n’avait pas besoin qu’on précise que le jeu serait
  en français. Une seule ligne dessous dit ce que les libellés ne disent pas :
  « Actuellement : français », qui suit la sélection, « Système » compris.
- **Le thème garde ses cartes descriptives.** « Établi » et « Veillée » sont
  opaques sans leur explication, « Français » non. Deux natures de choix, deux
  contrôles — mais le même arrondi, la même encre d’accent et le même
  interligne.
- **On voit enfin que ce sont des choix.** L’anneau d’une option non prise
  était du brun sur du brun en veillée : le seul élément qui portait l’état
  n’existait visuellement que là où l’état était déjà acquis. Il se voit
  maintenant dans les deux thèmes et dans les deux états.
- **Plus d’aplat orange sur l’option retenue.** La terre cuite dit « tu as
  perdu une brique » en jeu et « Lancer » sur les boutons d’action : trois sens
  pour une couleur, et deux blocs pleins sur un écran sans aucune action
  primaire. L’option prise garde son fond et porte un contour, un anneau rempli
  et une coche dessinée — trois signaux, dont aucun n’est une couleur seule.
- **Les sections se voient comme des groupes.** Les en-têtes montent au
  contraste du texte courant, et l’espace qui les précède vaut trois fois celui
  qui sépare deux cartes. Aucun trait de séparation ajouté : le vide suffit.
- **Le bloc confidentialité se replie.** La phrase qui répond à la question
  reste visible ; les deux paragraphes qui la détaillent passent derrière
  « En savoir plus », fermé par défaut.
- **Navigation complète au clavier.** De vrais boutons radio dans des groupes :
  les flèches parcourent les segments de langue et les cartes de thème, `Tab`
  passe d’un groupe au suivant, et le lecteur d’écran annonce « 2 sur 3 ».

### Ajouté : « Effacer mes données »

La section annonçait ce que l’app garde sans donner aucun moyen de l’effacer.
Sortir doit coûter aussi peu qu’entrer, sinon la promesse « sans compte, sans
tracking » n’est tenue qu’à moitié.

- **Ce qui part est listé avant de partir** : palmarès, thème, langue, nom par
  défaut. « Êtes-vous sûr ? » n’aurait renseigné personne, et il n’y a aucune
  sauvegarde ailleurs pour rattraper un oui de trop.
- **Aucun rechargement** : la page rechargée romprait une partie en cours,
  puisque le lien est direct entre les téléphones. L’app revient simplement à
  l’état de son premier lancement, et une coche verte le confirme en une ligne.
- L’identité d’appareil ne part pas : elle ne dit rien de qui joue, elle sert à
  retrouver son siège après un rechargement, et l’effacer couperait une partie
  en cours. Elle n’est donc pas annoncée, puisqu’elle n’est pas concernée.

### Ajouté : un nom par défaut, et une section « À propos »

- **Le nom se retapait à chaque partie.** Il se règle maintenant une fois, et
  pré-remplit « Nouvelle partie » et « Rejoindre ». Il s’enregistre à la perte
  de focus — pas de bouton « Enregistrer » pour trois lettres. Ce qu’on tape à
  la création n’est en revanche pas mémorisé au passage : jouer une fois sous un
  autre nom est exactement le cas où on ne veut pas que l’app s’en souvienne.
- **« À propos »** remplace le pied de page : le numéro de version, le journal
  des versions, le code source, et « Installer l’app » — celui-ci visible
  seulement en navigateur et seulement quand le navigateur propose vraiment
  l’installation.
- **« Cartes de manche » mène enfin aux cartes.** C’était une carte au même
  arrondi et au même fond que les options cliquables, sans contrôle ni chevron :
  une fausse affordance devant un texte explicatif. C’est devenu « Voir les neuf
  cartes », une ligne de navigation vers la section des règles correspondante.

### Corrigé : l’écran ne saute plus, et le bas reste atteignable

- **Le changement de langue faisait remonter l’écran tout en haut.** Les boutons
  radio se retrouvaient empilés au coin supérieur de leur groupe, et le
  navigateur remontait l’écran pour amener dans le champ de vision celui qui
  venait de prendre le focus. Chacun se superpose maintenant à son libellé.
- **La zone sûre du bas était réservée hors du conteneur qui défile** : le
  dernier élément ne pouvait pas remonter au-dessus de la barre d’outils de
  Safari.
- **Le contraste est mesuré, plus jugé à l’œil** : vingt-huit paires de l’écran,
  dans les deux thèmes, tenues par un test aux deux seuils de WCAG AA.

### Ajouté : on peut quitter une partie en cours

Il n’y avait aucune sortie. Une fois la partie lancée, le seul « Quitter »
vivait dans la feuille qui s’ouvre quand **quelqu’un d’autre** perd la
connexion : tant que tout allait bien, il fallait fermer l’app.

- **Une pastille « Quitter » dans la barre du haut**, au tour de jeu et à la
  révélation — là où se trouve « Retour » partout ailleurs. Elle s’efface le
  temps de choisir une cible, où la barre porte déjà la consigne.
- **Elle demande confirmation, et la confirmation dit ce qu’il en coûte** plutôt
  que « êtes-vous sûr ? » : les autres continuent sans toi, quelqu’un d’autre
  arbitrera, ou la partie s’arrête là s’il n’y a que des bots en face.
  « Rester » est le bouton fort : cette feuille s’ouvre parfois par erreur,
  jamais l’inverse.
- **Le mur reste debout et le code ramène à sa place.** Le siège était déjà
  gardé côté arbitre ; il ne manquait que de le dire, et d’emporter le code
  pour que « Rejoindre » soit déjà rempli — celui qui a scanné un QR ne l’a
  jamais lu. Rien de tout cela n’est promis quand la place n’est pas gardée.

### Corrigé : les pastilles de la barre du haut se touchent

« Retour » mesurait 27 pixels de haut. Le bouton en fait 44 sans que la
pastille peinte ne bouge d’un pixel : l’œil voit la même, le pouce ne la rate
plus. Quarante-huit pastilles étaient concernées.

### Ajouté : la nouvelle version se propose, elle ne s'impose plus

L'app se mettait à jour toute seule : dès qu'une version finissait de se mettre
en cache, la page se rechargeait. Au milieu d'une manche, sans que personne
n'ait rien demandé — et comme une partie en ligne est un lien direct entre
plusieurs téléphones, ce rechargement la rompait aussi pour les autres, qui
attendaient l'arbitre.

- **Un bandeau le dit, et laisse choisir.** « Recharger » ou « Plus tard », deux
  boutons de la même taille : le refus est proposé aussi franchement que
  l'acceptation, sans compte à rebours ni urgence inventée.
- **« Plus tard » tient sa promesse.** La version attend sans revenir à la
  charge ; la proposition ne revient qu'au prochain démarrage.
- **En partie, le bandeau dit ce qu'on veut savoir avant de cliquer** : la place
  est gardée, et on la retrouve au rechargement.
- Il se pose **dans le flux**, en bas du cadre, comme le bandeau de lien se pose
  en haut : il ne recouvre jamais un mur, une carte ni un bouton.
- Une app installée ne recharge plus de page, donc ne redemandait jamais. Elle
  redemande maintenant **au retour au premier plan**, et une fois par heure.

### Changé : un code qu'on peut dicter, et scanner

`V6DBC39U` se dictait mal, se lisait mal au soleil et se retapait faux.
L'alphabet écartait déjà I, O, 0 et 1 ; restaient B contre 8, G contre 6, S
contre 5, Z contre 2, L contre 1 et U contre V.

- **Les deux membres de chaque paire partent**, plutôt qu'un seul qu'on
  rattraperait à la saisie : corriger O → 0 ne dit rien de 6 contre G. Vingt-deux
  symboles, aucune confusion possible. Le nouvel alphabet est un sous-ensemble
  de l'ancien, donc une version déjà installée accepte toujours les codes de
  celle-ci.
- **Le salon affiche un QR** sous le code. Le téléphone qui le scanne s'ouvre
  directement sur « Rejoindre », code rempli. Autour d'une table — et une partie
  de quatre minutes se joue surtout là — c'est plus rapide et plus sûr que de
  dicter huit caractères.
- **Le code se touche pour le copier.** C'est la première chose qu'on vise quand
  on veut le donner, et il ne répondait pas.

### Ajouté : ce qui se passe quand ça se passe mal

Quatre situations existaient sans exister à l'écran.

- **La connexion qui lâche** ne disait rien : les cartes répondaient, la manche
  ne se résolvait jamais, on tapait dans le vide en croyant jouer. Un bandeau
  persistant et non modal dit l'état **et ce qui vient ensuite** — « ton mur
  reste en place, si l'hôte ne revient pas quelqu'un d'autre arbitrera ». Quand
  ça revient, il le dit avant de disparaître.
- **L'hôte parti** n'a pas la même conséquence selon le moment, et le bandeau ne
  raconte pas la même chose : en partie, un autre arbitre prend la suite ; au
  salon, la partie n'existe plus.
- **Un code refusé** menait à un écran d'attente sans issue, et revenir en
  arrière effaçait les huit caractères qu'on venait de taper. Le code se garde,
  et « Essayer un autre code » ramène où il faut.
- **Le format Équipes** changeait le nombre de joueurs dans le dos de qui le
  choisissait. Il dit maintenant pourquoi il n'est pas disponible.

Et l'attente d'un joueur porte sa durée passé vingt secondes — pas avant :
mettre un chronomètre sous le nez de quelqu'un qui réfléchit, c'est lui prendre
le jeu.

### Corrigé : le thème sombre, et ce que dit chaque couleur

Le thème sombre n'avait jamais été parcouru en entier. Mesuré sur les sept
écrans, deux textes passaient sous le seuil de lisibilité : « Retour » sur la
bande ocre (du brun sur du brun) et « prêt » en vert. Les deux sont corrigés,
et deux tests gardent désormais l'alignement des couleurs système.

**Chaque accent n'a plus qu'un seul métier.** La terre cuite se retrouvait sur
« −1 brique » mais aussi sur « piège déclenché » et « 1 frappe annulée » — sur
un dégât, et sur deux défenses qui avaient parfaitement tenu. Désormais : terre
cuite quand une brique tombe, vert quand ce qui visait la ligne n'est pas passé,
ocre pour ce qui concerne toute la table, et rien du tout pour un simple choix.

La zone sûre du bas vaut maintenant pour toute l'app : elle se posait écran par
écran, donc elle manquait sur huit d'entre eux, et « Ouvrir le salon », « J'ai
compris » et la main de cartes passaient sous l'indicateur d'accueil d'iOS.

### Changé : chaque chose dite une fois

- La rangée de dix points doublait « Manche 4/10 », juste à côté.
- « Touche une carte pour continuer » doublait « Ta main — choisis une carte »,
  écrit trois centimètres plus haut, dans un bloc que la main n'avait pas.
- Le badge « CHOISI » doublait le carton foncé qui disait déjà le choix. Une
  coche discrète le remplace, et les groupes de réglage sont enfin de vrais
  boutons radio.

### Ajouté : la partie se raconte à la fin

Quarante à cinquante pour cent de l'écran de fin restait vide — un classement
au milieu, et rien d'autre — alors que la partie qu'on venait de jouer était
encore en mémoire sur l'appareil.

- **Un récapitulatif des dix manches** : une ligne par joueur, une colonne par
  manche, le dessin de la carte jouée. C'est ce qui donne envie de relancer :
  « tu as bloqué trois fois de suite ».
- **Un mur tombé se dit** : « mur tombé · manche 7 » sous le nom. Le jeu
  n'élimine personne — un mur à zéro peut remonter et gagner — mais la manche
  où il a cédé fait partie de l'histoire.
- **Le récit de la manche se pose sous les cartes qu'il explique**, sur l'écran
  de révélation : « Le piège de Nour a retourné ta frappe » s'affichait en bas
  de page, à quatre lignes des deux cartes concernées.
- Les deux écrans **centrent leur contenu** quand il est plus court que
  l'écran, au lieu de coller le titre en haut et les boutons en bas.

### Changé : plus un seul emoji dans l'interface

Un visage emoji dans la barre du haut, sans libellé : on ne savait pas si ce
bouton ouvrait un menu, un profil ou une réaction, et il ne se rendait pas
pareil d'un téléphone à l'autre.

Le bouton devient une bulle dessinée. Les six réactions sont dessinées elles
aussi — rire, aïe, bravo, bien joué, grr, pitié — au même atelier que les
pictogrammes de carte, et elles portent leur mot dans la feuille du salon. La
croix qui referme cette feuille est dessinée elle aussi.

Ce que les téléphones s'envoient entre eux n'a pas changé : les parties entre
une version à jour et une version plus ancienne se comprennent toujours.

### Corrigé : on voit enfin ce que les autres ne peuvent pas jouer

Le cœur du jeu est « la carte jouée est interdite la manche suivante », et
c'est la seule information publique qui permette de décider quoi que ce soit.
Elle n'était affichée qu'à moitié : la pastille d'un joueur disait « rien
joué » tant qu'il n'avait pas de verrou, si bien qu'en manche 1 les quatre
lignes ne disaient rien, et que rien ne distinguait « pas de contrainte » de
« je ne sais pas ». Il fallait tenir de tête trois adversaires sur dix
manches — au-delà de ce que la mémoire garde, donc le choix redevenait un
tirage au sort.

- **Chaque ligne porte sa contrainte en permanence** : le pictogramme de la
  carte et « Interdit : Frapper ». Le dessin double le mot, donc ça se lit
  aussi en niveaux de gris.
- **L'absence de contrainte se dit aussi**, en toutes lettres : « Tout est
  jouable ». C'en est une, en manche 1 comme après « Mémoire courte ».
- **La carte fermée de ta main porte un cadenas** et « interdit ce tour ».
  Elle reste lisible par les lecteurs d'écran, ce qu'un bouton désactivé ne
  permettait pas.
- « rien joué » cède la place à « en train de choisir », dit à voix basse
  pour ne pas peser plus lourd que la contrainte.
- Le conseil de ciblage ne suppose plus le genre de personne : un prénom ne
  le dit pas.

### Corrigé : les décorations ne passent plus sur le texte

- **L'étoile de l'écran de fin** mangeait la dernière lettre de « Truelle
  gagne ». Elle descend à côté du résumé, dans une colonne qui lui est
  réservée : aucune longueur de nom ne peut plus passer dessous, dans aucune
  des deux langues.
- **Les bulles de réaction** sortaient du haut de la ligne de joueur, pile
  sur le nom et la contrainte. Elles sortent du bas, au-dessus du mur, qui
  est un aplat sans texte.
- Quand la place manque, c'est l'accessoire qui cède : l'étiquette d'état
  s'efface avant le nom, la jauge avant le compte « 3 / 4 ont joué ».

### Changé : le salon ne se contredit plus

Il affichait un grand code à partager et, juste dessous, « 4 / 4 » parce que
trois bots avaient pris les places. Le code se lit le premier, donc la
personne partageait — et l'invité trouvait porte close.

- **Un bot réserve une place, il ne la prend pas.** Le compteur dit
  « 1 joueur · 3 places libres », la ligne d'un bot « Place libre — tenue
  par un bot », et un ami qui arrive fait lever un bot, avec un mot pour le
  dire.
- **Le sélecteur d'identité revit** : une forme tenue par un bot se prend, et
  le bot glisse sur celle qu'on libère.
- **Le niveau des bots se règle pour la table**, d'un geste, avec le réglage
  siège par siège replié derrière un dépliant.
- Le bouton dit « Lancer la partie » et, sous lui, un état de fait :
  « 1 joueur · 3 bots ». « 4 joueurs suffisent » se lisait comme une
  exigence non remplie.
- Pour l'hôte, « Quitter le salon » devient « Fermer le salon » et demande
  confirmation : c'est sans retour pour les autres. Un invité qui part n'a
  rien à confirmer.
- Le bas de l'écran ne défile plus : sur un téléphone de 667 px, le bouton
  principal se trouvait sous le pli.

### Ajouté : la langue

- **Rempart parle anglais.** Les sept écrans, les huit chapitres de règles, les
  neuf cartes de manche et le récit de chaque manche existent maintenant dans
  les deux langues. Un réglage **Langue** s'ajoute sous le thème, avec les
  mêmes trois états : français, English, ou comme le téléphone. Il n'y a rien à
  redémarrer — la partie en cours change de langue sous les doigts, l'avis de
  connexion affiché compris.
- **Rien ne se fabrique plus par collage.** « Tu bloques » se tirait du nom de
  la carte moins son « r » plus un « s » ; « Ta main — Frapper est interdite »
  accordait son verbe en comptant les cartes ; le récit de la révélation
  assemblait un sujet, un verbe et un possessif à la main. Chaque phrase
  s'écrit désormais entière, avec autant de versions qu'elle a de lecteurs
  possibles — celui qui a frappé, celui qui a pris le coup, celui qui regarde
  les deux.
- **Le zéro s'accorde tout seul.** « 0 brique » en français, « 0 bricks » en
  anglais : c'est le navigateur qui connaît la règle de chaque langue, et non
  un `n > 1` écrit dans un composant.

### Corrigé

- **« 1er », et non « 1ᵉ ».** L'écran de fin affichait une abréviation qui
  n'existe dans aucune des deux langues. Les rangs se disent maintenant
  « 1er », « 2e », « 3e », « 4e » — et « 1st », « 2nd », « 3rd », « 4th ».
- **« cet après-midi », et non « ce après-midi ».** Le palmarès collait un
  démonstratif devant un moment de la journée ; les six formes s'écrivent
  maintenant entières, une par cas, donc l'élision est juste par construction.
- **Un joueur n'a plus de genre.** Le conseil de ciblage disait « il ne peut
  pas bloquer deux fois de suite ». Un prénom ne dit pas le genre de la
  personne qui le porte — c'était déjà la règle de l'écran de déconnexion, elle
  vaut maintenant partout.

### Changé : ce qui voyage entre les téléphones

Trois choses partaient de l'arbitre **déjà rédigées** et arrivaient en français
sur les autres téléphones, quelle que soit leur langue. Elles voyagent
désormais sous forme de motif, et c'est l'écran qui met les mots :

- l'étiquette de chaque ligne de révélation (« retourné −1 », « 2 frappes
  annulées ») ;
- la carte de manche en vigueur : c'est `dernier-mur` qui part sur le réseau,
  jamais « Dernier mur » ;
- les avis de connexion, qui étaient traduits dès leur réception.

C'est la règle que la couche réseau suivait déjà pour les codes d'erreur, et
qui manquait aux trois autres. Une partie entre un téléphone en français et un
téléphone en anglais se lit correctement des deux côtés.

### Pour qui lit le code

- Le catalogue anglais est **typé sur le français** : une clé ajoutée d'un côté
  et oubliée de l'autre arrête la compilation. Quatre tests couvrent ce que le
  typage ne voit pas — une phrase vide, un paramètre oublié dans une
  traduction, une paire de pluriel à moitié écrite, une phrase recopiée telle
  quelle d'une langue à l'autre.
- La galerie de contrôle (`/apercu.html`) gagne un axe « langue » à côté du
  thème : un libellé plus long déplace une géométrie, et ça se regarde.
- Aucune dépendance ajoutée. Les pluriels et les énumérations passent par
  `Intl`, que le navigateur porte déjà.
