# Journal des versions

Écrit à la main, dans la voix du projet : ce que chaque version change pour la
personne qui joue, pas quels fichiers ont bougé. Les dates sont celles de la
publication.

## Non publié

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
