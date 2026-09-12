# Rempart

PWA de jeu de plateau multijoueur, 2 à 4 joueurs, dix manches, quatre minutes.
Front-only : aucun compte, aucune publicité, aucune mesure d'audience, **aucun
serveur de jeu**. Interface en français et en anglais, thèmes clair et sombre.

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
npm test             # moteur, bots, table, admission, secret des choix, conversation, catalogues
npm run typecheck
npm run build        # dist/ prêt à servir en statique
npm run icons        # régénère les icônes depuis scripts/icone.py
```

`npm run dev` sert aussi **`/apercu.html`** : une galerie de contrôle qui rejoue
tous les écrans dans un cadre 390 × 844, avec les mêmes données que la planche de
design. Elle sert à vérifier la fidélité écran par écran ; elle n'est pas une
entrée de build et ne part donc jamais en production.

## Jouer seul, ou à deux en attendant les autres

Le salon ne sert pas qu'à partager un code : l'hôte peut **asseoir des bots**
sur les places libres, et lancer. Une partie contre trois bots ne demande
aucun réseau — ni relais, ni pair, ni code transmis — et c'est le moyen le plus
court d'apprendre le verrou avant de jouer avec des amis.

Un bot est un siège comme un autre. Il porte un nom d'outil (Truelle,
Maillet, Équerre, Rabot) pour qu'on ne le confonde jamais avec un ami arrivé, il
se règle en trois niveaux, et il se relève d'un geste tant que la partie n'a pas
commencé. C'est l'hôte qui
tient ses cartes, par le chemin exact d'un geste reçu d'un téléphone
(`table.appliquer`) : **le moteur ne sait pas lequel de ces quatre murs est tenu
par un bot**, donc un bot ne peut pas jouer un coup qu'un joueur n'aurait pas
le droit de jouer.

Ce qu'il ne lit jamais, c'est `state.choices` des autres — l'hôte les a pourtant
sous la main. Un bot qui lit les cartes avant la révélation bloque toujours au
bon moment, et le jeu n'existe plus. Il décide donc sur ce qu'un joueur voit :
les murs, et **les verrous**, qui sont la mémoire du jeu. Un adversaire qui a
frappé la manche passée ne peut pas frapper celle-ci : quand plus personne ne
peut frapper, se barricader est un tour perdu, et le bot le sait sans avoir
rien vu de secret (`game/bot.ts`).

### Le niveau d'un bot

Trois niveaux — **tranquille**, **normal**, **redoutable** — réglés **siège par
siège**, sur la ligne du bot dans le salon. Par siège et non par table : à
quatre, on veut souvent un adversaire sérieux et deux qui laissent respirer.
Trois cartons plutôt qu'un cycle, et ce sont ceux du « nombre de joueurs » de
l'écran de création : on lit les trois niveaux sans rien toucher.

La difficulté ne se règle pas en tirant au hasard dans les quatre cartes. Elles
sont toutes légales tout le temps : un bot bruité ne joue pas plus mal, il joue
pareil en moyenne — et là où le bruit se verrait, il donnerait un adversaire qui
répare un mur plein pendant qu'on le démolit. Ce qui change d'un niveau à
l'autre, c'est **ce qu'il voit du verrou**.

| | tranquille | normal | redoutable |
|---|---|---|---|
| voit qui a encore le droit de frapper | non | oui | oui |
| compare les murs avant de frapper | non | oui | oui |
| achève un mur à deux briques | non | oui | oui |
| se garde quand il mène | non | oui | oui |
| sait que le piège domine le blocage | non | non | oui |
| voit la cible qui ne peut plus parer | non | non | oui |
| renonce à frapper quand tout le monde peut piéger | non | non | oui |
| frappe pour le plaisir de frapper | oui | non | non |
| suit son propre jugement | de loin | oui | il s'y tient |
| son délai | 2,2 s | 1,5 s | 0,9 s |

Le « piège domine le blocage » est la lecture qui sépare vraiment le haut du
milieu : chacun pour soi, les deux cartes annulent la frappe, mais le piège la
**retourne** — le blocage ne garde sa raison d'être qu'en équipes, où il couvre
le coéquipier. Le bot d'avant les niveaux ne le savait pas ; il est devenu
`normal`, sans rien y changer.

L'erreur de `tranquille` est celle d'un joueur, pas celle d'un programme : il se
barricade contre une table qui n'a plus le droit de frapper, il frappe parce que
frapper est le seul geste qui se voit — alors que ça n'ajoute aucune brique à
son propre mur. Il répare toujours son mur à l'agonie : un bot qui se laisse
tomber à zéro sans réagir n'est pas un adversaire facile, c'est un adversaire
cassé, et on ne joue pas contre lui, on le regarde perdre.

Soixante duels par paire, sièges alternés, cartes de manche comprises, donnent
la mesure : **redoutable** l'emporte sur **tranquille** dans 83 % des parties,
sur **normal** dans 68 %, et **normal** sur **tranquille** dans 58 %. Trois
tests du dépôt ne vérifient que ça — un sélecteur qui ne changerait pas la
partie serait une promesse que le salon ne tient pas.

Le niveau vit dans le **salon** et non dans `GameConfig`, qui ne porte que des
règles et voyage dans l'état : le niveau d'un bot n'est pas une règle du jeu. Le
bot ne joue que chez l'arbitre, donc ce champ n'a jamais besoin d'être exact
ailleurs — il n'y sert qu'à être lu.

Ses hésitations se tirent de l'état de la partie, jamais de `Math.random` : même
manche, même carte. Seul le délai avant de poser la carte est tiré au sort, et
il ne décide de rien — il évite que trois bots posent à la même seconde.

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
    bot.ts          Le bot, en trois niveaux. Pur, et sans accès aux choix des autres.
    narrate.ts      Le récit de la révélation, dérivé des faits de la manche.
    roundCards.ts   Les neuf cartes de manche.
    content.ts      Tout le texte de règles, à un seul endroit.
  net/
    room.ts         Le transport Trystero, le code de partie, l'identité d'appareil.
    admission.ts    Qui entre, et à quelles conditions. Fonctions pures.
    vue.ts          Ce que chaque joueur a le droit de voir de l'état.
    table.ts        L'autorité de la partie, côté hôte — sans réseau.
    session.ts      Ce qui relie les deux : règne, accusés, battement.
    discussion.ts   La conversation et ses deux freins. Pur, et sans horloge.
    presence.ts     Les durées, séparées pour être vérifiables.
    turn.ts         Lecture des réglages TURN.
  ui/               Les primitives : brique, mur, pictogrammes, carte, panneau.
    mouvement.ts    Les cinq durées, et la règle du mouvement réduit.
    discussion.tsx  La feuille du salon, l'éventail, la bulle.
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

## Le mouvement, et ce qu'il dit

Cinq mouvements, et chacun porte une information que l'écran fixe ne donnait
pas. Rien ne décore : le fond de l'app ne bouge pas, et aucune image ne tourne
en boucle sur un écran qu'on lit. Les durées vivent toutes dans
`ui/mouvement.ts`.

| | Durée | Ce qu'il dit |
|---|---|---|
| **La brique tombe** | 0,45 s | D'où vient le coup — elle bascule du côté opposé à l'attaquant — et sur quel mur il atterrit. |
| **La révélation en cascade** | 0,5 s par carte | Le seul moment de la manche où l'on ne sait pas encore. Chaque carte se retourne seule, avec un temps mort avant la suivante. |
| **La carte posée frémit** | boucle, 2 s | « C'est parti, on attend les autres », sans texte. S'arrête dès que la table est complète. |
| **La carte de manche entre en grand** | 1,2 s | Cette manche ne suit pas les règles des autres. L'écran reprend sa peau ensuite. |
| **Les briques se recomptent** | 0,8 s | Ce qu'on vient de gagner ou de perdre, chiffre par chiffre — pas seulement le total. |

Le **fond vivant** a été écarté : c'était le seul de la liste qui prenait de
l'attention sans rien dire.

**La cascade est le vrai correctif.** Le jeu n'était pas plat par manque
d'effets : la révélation montrait un résultat déjà acquis — les murs portaient
les dégâts avant que la moindre carte ne se retourne, et le retournement ne
faisait que confirmer. Les lignes partent désormais du mur d'**avant** la
manche (`PlayerOutcome.wallBefore`, produit par le moteur), et rien ne bouge
sur une ligne tant que sa carte est face cachée.

Sous `prefers-reduced-motion`, **rien ne se crée** : pas d'animation ralentie ni
de transition raccourcie — la cascade dévoile tout d'un coup, la brique est déjà
tombée, le compte affiche son total. Il reste l'écrit, qui disait déjà tout.

## Se parler — dans le salon, et en partie

**Un seul canal.** Une réaction EST un message de conversation, avec un emoji
pour texte : même canal, même auteur, même ligne dans l'historique. Deux canaux
auraient donné deux ordres d'arrivée pour une seule conversation.

- **Dans le salon**, la feuille s'ouvre et se lit : c'est le seul moment de la
  partie où l'on a du temps. Elle monte du bas, et se ferme par sa croix.
- **En partie, un doigt** : six emoji au bout d'un éventail, dans la barre du
  haut. Un appui ouvre, un appui envoie, trois secondes sans choix referment. Le
  jeu ne s'interrompt pas, et la feuille ne s'ouvre jamais — trois secondes pour
  lire quatre murs et choisir une carte, ce n'est pas le moment de lire un fil.
- **La bulle sort de son auteur**, sur son jeton et non au milieu de l'écran :
  une réaction dit autant *qui* que *quoi*. Elle monte, grandit et s'estompe en
  1,8 s.
- **La table propose** : quand ton mur vient d'être frappé, l'éventail s'ouvre
  seul deux secondes avec 😱 entouré. Une proposition, jamais une interruption —
  et jamais pendant ton propre choix de carte.

**Deux freins.** 0,7 s entre deux envois chez l'émetteur ; 3 bulles simultanées
au plus par joueur chez le récepteur. Le premier vit chez quelqu'un d'autre — un
client bricolé l'enlèverait — donc c'est le second qui fait foi, et il est posé
là où le tort serait fait. Ce qui dépasse n'est **ni montré ni archivé** : un
message refusé n'entre pas dans l'historique, sans quoi l'inondation se verrait
quand même à la réouverture de la feuille.

La conversation **ne passe pas par l'arbitre** : elle part à la cantonade, et
chacun la reçoit directement de son auteur. La partie a besoin d'une autorité —
un état contradictoire casse le jeu ; une conversation, non. La faire transiter
par l'hôte n'aurait rien garanti de plus qu'un aller-retour de latence sur un
emoji. Seule règle d'entrée : **on parle depuis un siège**, et un pair qui a le
code sans avoir de place à la table n'a pas de voix.

## Les écrans

Les 28 cadres de la planche sont tous implémentés : 14 écrans clairs (01–12,
08 bis, 11 bis), 4 en veillée (01, 05, 08, 11), les 8 chapitres de règles (R0–R7)
et les 2 écrans de cartes de manche (C1, C2).

Sept écrans que la planche ne pouvait pas prévoir s'y ajoutent, parce qu'ils
naissent du réseau et non du jeu — tous dessinés avec les seules pièces de la
planche :

- **Rejoindre avec un code** et **Réglages**, que les boutons de l'accueil
  appellent sans que la planche les dessine ;
- **Salon · une demande à la porte** et **Salon · invité en attente**, les deux
  moments de l'admission ;
- **Salon · des bots à la table**, la place libre qui se remplit d'un geste et
  le niveau posé sous chaque bot — sans quoi l'hôte n'a rien d'autre à faire
  qu'attendre ;
- **Salon · la conversation**, la feuille qui monte pendant qu'on attend, et
  l'éventail de six emoji posé dans la barre du haut en partie ;
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
les bots et l'écart entre leurs niveaux, l'autorité de l'hôte, l'admission, le
secret des choix, les deux freins de la conversation et une partie complète de
bout en bout sont couverts par 157 tests — et une partie contre des
bots, elle, se joue sans réseau du tout ; **l'établissement de la connexion
entre deux appareils reste à valider sur un réseau ouvert.**
