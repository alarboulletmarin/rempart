# Rempart

PWA de jeu de plateau multijoueur, 2 à 4 joueurs, dix manches, quatre minutes.
Front-only : aucun compte, aucune publicité, aucune mesure d'audience, **aucun
serveur de jeu**. Interface en français, thèmes clair et sombre.

Implémentation de la planche de design **« Chantier de papier » / direction
Établi**, conservée dans `design/` avec les transcriptions qui l'ont produite.

## La règle, en une phrase

Chaque joueur a un mur de cinq briques. À chaque manche, tout le monde choisit
**en même temps** une carte parmi quatre — Frapper, Bloquer, Réparer, Piéger —
et une cible. On révèle, on résout. **La carte jouée est interdite la manche
suivante** : c'est le verrou, et c'est lui qui porte tout le jeu.

## Démarrer

```bash
npm install
npm run dev          # l'app, sur http://localhost:5173
npm test             # moteur, table, admission, secret des choix
npm run typecheck
npm run build        # dist/ prêt à servir en statique
npm run icons        # régénère les icônes depuis scripts/icone.py
```

`npm run dev` sert aussi **`/apercu.html`** : une galerie de contrôle qui rejoue
tous les écrans dans un cadre 390 × 844, avec les mêmes données que la planche de
design. Elle sert à vérifier la fidélité écran par écran ; elle n'est pas une
entrée de build et ne part donc jamais en production.

## Le multijoueur

Pas de serveur de jeu. **Trystero sur le réseau Nostr** assure la seule chose que
WebRTC ne peut pas faire tout seul — mettre deux navigateurs en relation. Ensuite
la partie passe en direct d'un téléphone à l'autre : la signalisation ne voit
jamais l'état de la partie, et rien n'est stocké ailleurs que sur les appareils.

**L'hôte fait autorité.** Il tient l'état, applique les gestes reçus et fait
avancer les manches ; les autres n'envoient que leurs intentions et affichent ce
qu'ils reçoivent. Trois mécanismes font tenir l'ensemble :

- **le règne** (`epoch`) départage deux appareils qui se croient tous les deux
  arbitres après une coupure. Le règne le plus récent gagne ; à égalité, le plus
  petit identifiant — un ordre que les deux calculent à l'identique sans avoir à
  se parler.
- **l'accusé de réception** (`nonce`) rend une intention rejouable sans risque :
  l'invité réémet jusqu'à la réponse, l'arbitre n'applique qu'une fois. Sans lui,
  un choix perdu fige la manche sans un message.
- **le battement** (`tick`/`pong`) dit qui est encore là. C'est le battement
  applicatif qui tranche, et non l'avis du transport, qui déclare un pair perdu
  puis ne dit plus rien. C'est lui qui alimente l'écran 12.

**Les choix restent secrets jusqu'à la révélation.** C'est la règle du jeu
appliquée au réseau : l'arbitre ne diffuse pas l'état brut, il le redacte pour
chaque destinataire (`net/vue.ts`), qui ne reçoit que **son propre choix** plus la
liste de ceux qui ont joué — le « 3 / 4 ont joué » de l'écran 07. Sans ça, il
suffirait d'ouvrir la console pour lire la carte des autres.

**Le code amène à la porte, l'hôte l'ouvre.** Huit caractères sur un alphabet de
32 sans les lettres ambiguës à l'oral (ni I, ni O, ni 0, ni 1). Le code est à la
fois l'adresse du rendez-vous sur les relais publics et le seul secret du salon —
une case de trop pour un seul objet, l'identifiant d'app étant public. L'accord de
l'hôte sépare enfin les deux rôles : un code deviné ne donne plus une place,
seulement une demande à refuser (`net/admission.ts`).

**Un joueur qui a déjà un siège rentre chez lui sans rien demander.**
Rechargement de page, tunnel, batterie : son identité d'appareil (`clientId`)
survit, son mur est encore debout sur l'écran de tout le monde, et une porte qui
claque dans son dos serait la pire des règles.

### TURN

Sans relais TURN, deux joueurs derrière un NAT symétrique — cas courant en 4G/5G
— ne peuvent pas se joindre. Voir `.env.example` : trois variables au build, un
fournisseur à identifiants statiques suffit. Sans elles, le jeu marche entre deux
box internet, et l'app dit franchement le reste.

## Architecture

```
src/
  theme.ts          Les jetons de la DA : palettes Établi et Veillée, rayons, typo.
                    Aucune couleur n'est écrite en dur ailleurs.
  game/
    types.ts        Le vocabulaire du jeu.
    engine.ts       Le moteur. Fonctions pures, aucun DOM, aucun réseau.
    narrate.ts      Le récit de la révélation, dérivé des faits de la manche.
    roundCards.ts   Les neuf cartes de manche.
    content.ts      Tout le texte de règles, à un seul endroit.
  net/
    room.ts         Le transport Trystero, le code de partie, l'identité d'appareil.
    admission.ts    Qui entre, et à quelles conditions. Fonctions pures.
    vue.ts          Ce que chaque joueur a le droit de voir de l'état.
    table.ts        L'autorité de la partie, côté hôte — sans réseau.
    session.ts      Ce qui relie les deux : règne, accusés, battement.
    presence.ts     Les durées, séparées pour être vérifiables.
    turn.ts         Lecture des réglages TURN.
  ui/               Les primitives : brique, mur, pictogrammes, carte, panneau.
  screens/          Un fichier par écran de la planche.
  store/palmares.ts Le palmarès local (localStorage).
design/             La planche, ses gabarits et les transcriptions d'origine.
```

La séparation `table.ts` / `session.ts` n'est pas cosmétique : elle permet de
jouer une partie entière en test, par le chemin exact que prend une vraie partie.

## La direction artistique, en pratique

Trois règles qui expliquent la plupart des choix de code :

1. **De l'épaisseur, jamais de contour.** Un chant sombre en bas
   (`inset 0 -Npx 0`) et une ombre dure sans flou (`0 Npx 0`). Aucun dégradé,
   aucun `blur`, aucun bord coloré.
2. **Un état se lit à la matière, jamais à l'opacité.** Une carte interdite n'est
   ni rayée ni estompée : elle est posée sur un carton plus pâle, à pleine encre,
   avec la mention « interdite ». Les trois états d'une carte sont *choisie*,
   *jouable*, *interdite* — et le mot est le même partout.
3. **La couleur ne fait que confirmer.** Forme + nom + position identifient un
   joueur ; aucune information ne dépend jamais de la couleur seule.

Les gribouillages (`public/assets/scribble-*.svg`, d'illustrations.run) ne
paraissent que dans les temps morts — salon, fin de partie, pause. Jamais pendant
une manche : le joueur y lit quatre murs et quatre cartes en trois secondes.

## Les écrans

Les 28 cadres de la planche sont tous implémentés : 14 écrans clairs (01–12,
08 bis, 11 bis), 4 en veillée (01, 05, 08, 11), les 8 chapitres de règles (R0–R7)
et les 2 écrans de cartes de manche (C1, C2).

Cinq écrans que la planche ne pouvait pas prévoir s'y ajoutent, parce qu'ils
naissent du réseau et non du jeu — tous dessinés avec les seules pièces de la
planche :

- **Rejoindre avec un code** et **Réglages**, que les boutons de l'accueil
  appellent sans que la planche les dessine ;
- **Salon · une demande à la porte** et **Salon · invité en attente**, les deux
  moments de l'admission ;
- le **nom du joueur**, demandé à la création et à l'arrivée plutôt qu'au salon :
  la planche du salon ne porte que le code, les joueurs et les identités, et un
  champ de saisie de plus y aurait chassé les pastilles d'identité.

Deux écarts assumés, en plus :

- **R4 · Tes cartes** garde effet + coût et laisse la ligne « quand la jouer » à
  la planche de référence : sur 844 px, les quatre cartes ne tiennent pas sinon.
- **Mort subite bornée.** Les choix étant simultanés, deux joueurs à égalité qui
  se frappent mutuellement restent à égalité — la partie pourrait ne jamais
  finir. Au bout de trois manches, le mur le plus haut l'emporte, puis la place à
  la table. La règle est écrite dans le chapitre « Cas particuliers », et l'écran
  de fin le dit quand c'est ce qui a tranché.

## Ce qui n'a pas pu être vérifié ici

**La poignée de main WebRTC.** Les relais de signalisation sont injoignables
depuis l'environnement de développement utilisé (politique réseau). Le moteur,
l'autorité de l'hôte, l'admission, le secret des choix et une partie complète de
bout en bout sont couverts par 90 tests ; **l'établissement de la connexion entre
deux appareils reste à valider sur un réseau ouvert.**
