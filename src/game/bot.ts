/**
 * Le bot : de quoi jouer seul, ou à deux en attendant un troisième.
 *
 * Une fonction pure, comme le moteur — ni DOM, ni réseau, ni minuteur. C'est
 * l'hôte qui l'appelle pour les sièges marqués `bot`, et il le fait par le
 * chemin exact d'un geste reçu d'un téléphone : `table.appliquer(id, choix)`.
 * Le bot n'a donc aucun privilège, et le moteur refuse ses coups illégaux
 * comme ceux de n'importe qui.
 *
 * **Ce qu'il ne lit jamais : `state.choices` des autres.** L'hôte tient l'état
 * complet, donc rien ne l'en empêcherait techniquement — c'est précisément
 * pourquoi c'est écrit ici. Un bot qui lit les cartes avant la révélation
 * bloque toujours au bon moment, et le jeu n'existe plus.
 *
 * Il décide donc sur ce qu'un joueur a sous les yeux :
 *
 *  - les murs de tout le monde ;
 *  - **les verrous**, qui sont la mémoire du jeu : un adversaire qui a frappé
 *    la manche passée ne peut pas frapper celle-ci. Bloquer contre une table
 *    qui n'a plus le droit de frapper est un tour perdu, et le bot le sait
 *    sans avoir rien vu de secret ;
 *  - la carte de manche en vigueur, par `legalCards` qui la prend en compte.
 *
 * ## Trois niveaux, et ce qui les sépare
 *
 * Un seul bot, c'est un bot qui convient à une seule table. La difficulté ne
 * se règle pas pour autant en tirant au hasard dans les quatre cartes : les
 * quatre sont toujours légales, donc un bot « bruité » ne joue pas plus mal,
 * il joue pareil en moyenne — et là où le bruit se verrait vraiment, il
 * donnerait un adversaire qui répare un mur plein pendant qu'on le démolit.
 * Ce qu'on change d'un niveau à l'autre, c'est **ce qu'il voit du verrou** :
 *
 *  - `tranquille` ne regarde pas les verrous des autres. Il se barricade
 *    contre une table qui n'a plus le droit de frapper, il oublie d'achever un
 *    mur à deux briques, et il suit son idée de loin (`aplomb`). C'est l'erreur
 *    ordinaire, pas un coup absurde : il répare toujours son mur à l'agonie ;
 *  - `normal` est le bot d'avant, celui contre lequel la fonction a été écrite ;
 *  - `redoutable` lit le verrou **des autres dans l'autre sens** : un joueur
 *    qui a bloqué la manche passée ne peut pas bloquer celle-ci, donc une
 *    frappe sur lui arrive à coup sûr ; un joueur qui a piégé ne peut pas
 *    piéger, donc elle ne lui reviendra pas dessus. Et il s'y tient.
 *
 * ## Le hasard, sans toucher à la partie
 *
 * Les hésitations se tirent de l'état (voir `hasard`), jamais de `Math.random` :
 * même manche, même carte. Un bot rejoué deux fois — un minuteur qui se
 * réveille en double, un arbitre qui reprend la main — ne change pas d'avis en
 * route, et ses choix se testent.
 */
import { bricks, choicesRequired, legalCards, possibleTargets, rng, tiedLeaders } from './engine'
import { ROUNDS, WALL_SIZE, type CardKey, type Choice, type GameState, type Player } from './types'

/** Du plus tranquille au plus redoutable — l'ordre du sélecteur du salon. */
export const NIVEAUX_BOT = ['tranquille', 'normal', 'redoutable'] as const

export type NiveauBot = (typeof NIVEAUX_BOT)[number]

/**
 * Le niveau par défaut, et celui de tout ce qui n'en annonce pas.
 *
 * Celui du **milieu** : un défaut posé à un bout du sélecteur ferait de la
 * moitié des tables une difficulté que personne n'a demandée. C'est aussi le
 * bot d'avant les niveaux, à la carte près.
 */
export const NIVEAU_DEFAUT: NiveauBot = 'normal'

export const estNiveauBot = (v: unknown): v is NiveauBot =>
  typeof v === 'string' && (NIVEAUX_BOT as readonly string[]).includes(v)

/**
 * Ce qu'un niveau voit, et ce qu'il laisse passer.
 *
 * Des drapeaux plutôt qu'un coefficient : « il ne regarde pas les verrous des
 * autres » se lit dans la partie et se raconte à table, « ses poids sont
 * multipliés par 0,7 » ne se lit nulle part.
 */
type Profil = {
  /** Voit-il qui a encore le droit de frapper cette manche ? */
  lucide: boolean
  /** Compte-t-il les murs : achever un mur bas, se garder quand on mène, presser la fin ? */
  compteur: boolean
  /** Lit-il le verrou de sa cible — qui ne peut ni bloquer ni piéger ? */
  calculateur: boolean
  /**
   * Frappe-t-il pour le plaisir de frapper ?
   *
   * Le travers du débutant, et il est réel : frapper est le seul geste qui se
   * voit, alors qu'il n'ajoute **aucune** brique à son propre mur et qu'un
   * piège adverse en coûte une. On ne rend donc pas le niveau tranquille plus
   * faible en lui retirant du jugement, mais en lui donnant celui qu'on a tous
   * eu à la première partie.
   */
  frappeur: boolean
  /**
   * À quel point il suit son propre jugement, en exposant sur les poids.
   *
   * 1 : tel quel. 0,5 : il s'écoute à moitié, et son meilleur coup ne sort
   * plus qu'un peu plus souvent que les autres. 1,7 : il s'y tient.
   *
   * Ce n'est pas du bruit ajouté par-dessus une décision juste : c'est la
   * fermeté avec laquelle il applique ce qu'il a vu — et ce qu'il a vu est
   * déjà plus pauvre d'un niveau à l'autre.
   */
  aplomb: number
}

const PROFILS: Record<NiveauBot, Profil> = {
  tranquille: { lucide: false, compteur: false, calculateur: false, frappeur: true, aplomb: 0.5 },
  normal: { lucide: true, compteur: true, calculateur: false, frappeur: false, aplomb: 1 },
  redoutable: { lucide: true, compteur: true, calculateur: true, frappeur: false, aplomb: 1.7 },
}

/**
 * Le temps qu'un bot laisse passer avant de poser sa carte.
 *
 * Pas pour faire semblant de réfléchir : sans ce délai, le « 2 / 3 ont joué »
 * est déjà à « 3 / 3 » quand l'écran s'affiche, et la manche se résout sous le
 * pouce du joueur.
 *
 * Il fait aussi partie du personnage — un adversaire redoutable qui répond du
 * tac au tac ne se joue pas comme un tranquille qui prend son temps — et il ne
 * coûte rien à personne : les manches n'ont pas de chronomètre.
 */
export const DELAI_BOT: Record<NiveauBot, number> = {
  tranquille: 2200,
  normal: 1500,
  redoutable: 900,
}

/**
 * Le délai réel, écarté d'un cinquième au hasard.
 *
 * Celui-là peut venir de `Math.random` : il ne décide de rien, il ne fait
 * qu'éviter que trois bots posent leur carte à la même seconde — ce qui se
 * verrait comme un seul geste.
 */
export function delaiBot(niveau: NiveauBot = NIVEAU_DEFAUT, alea: () => number = Math.random): number {
  const base = DELAI_BOT[niveau]
  return Math.round(base * (0.8 + alea() * 0.4))
}

/** Les noms des bots, par forme. Des outils : on voit tout de suite que ce n'est personne. */
export const NOMS_BOTS = ['Truelle', 'Maillet', 'Équerre', 'Rabot']

/**
 * Le hasard du bot, tiré de l'état lui-même.
 *
 * Même état, même carte : un bot rejoué deux fois sur la même manche ne change
 * pas d'avis en route. C'est aussi ce qui rend ses choix testables.
 *
 * Le niveau n'entre pas dans la graine : deux niveaux qui voient la même chose
 * doivent jouer la même carte, sinon on ne mesure plus ce qui les sépare.
 */
function hasard(jeu: GameState, moi: Player): () => number {
  return rng(jeu.seed + jeu.round * 131 + moi.seat * 17 + jeu.mortSubite * 7919)
}

/**
 * La ou les cartes que ce bot pose cette manche — deux quand « Dernier mur »
 * l'oblige, et jamais deux fois la même.
 */
export function choisirBot(
  jeu: GameState,
  id: string,
  niveau: NiveauBot = NIVEAU_DEFAUT,
  alea?: () => number,
): Choice[] {
  const moi = jeu.players.find((p) => p.id === id)
  if (!moi) return []
  const profil = PROFILS[niveau] ?? PROFILS[NIVEAU_DEFAUT]
  const tirage = alea ?? hasard(jeu, moi)

  // Une carte sans cible possible n'est pas jouable : tout le monde est parti,
  // ou la carte de manche a fermé la seule cible qui restait.
  const jouables = legalCards(jeu, id).filter((k) => possibleTargets(jeu, id, k).length > 0)

  const choix: Choice[] = []
  const posees: CardKey[] = []
  for (let i = 0; i < choicesRequired(jeu, id); i++) {
    const reste = jouables.filter((k) => !posees.includes(k))
    if (reste.length === 0) break
    const carte = tirerCarte(
      reste,
      reste.map((k) => poids(jeu, moi, k, profil) ** profil.aplomb),
      tirage,
    )
    posees.push(carte)
    choix.push({ card: carte, target: cible(jeu, moi, carte, profil, tirage) })
  }
  return choix
}

/**
 * Ce que vaut une carte cette manche, aux yeux du bot.
 *
 * Des poids et non un choix sec : le meilleur coup sort souvent, pas toujours.
 * Un bot qui joue toujours la même réponse à la même situation se bat en trois
 * manches, et le verrou — qui fait tout le jeu — ne veut plus rien dire.
 */
function poids(jeu: GameState, moi: Player, carte: CardKey, profil: Profil): number {
  const mien = bricks(moi)
  const trous = WALL_SIZE - mien
  const adversaires = jeu.players.filter(
    (p) => p.connected && p.id !== moi.id && (moi.team === null || p.team !== moi.team),
  )
  // Qui a encore le droit de frapper ? Le verrou de la manche passée et la
  // carte de manche répondent tous les deux, et ça se lit sur l'écran — pour
  // qui prend la peine de regarder. Le niveau tranquille, lui, croit toute la
  // table armée en permanence : il se barricade contre personne.
  const menace = profil.lucide
    ? adversaires.filter((p) => legalCards(jeu, p.id).includes('frapper')).length
    : adversaires.length
  const murs = adversaires.map(bricks)
  const plusHaut = murs.length > 0 ? Math.max(...murs) : 0
  const plusBas = murs.length > 0 ? Math.min(...murs) : WALL_SIZE
  // Mener, c'est dépasser quelqu'un. À la première manche tous les murs sont
  // pleins : personne n'est en tête, et la table n'a aucune raison de
  // commencer par se barricader.
  const enTete = mien >= plusHaut && mien > plusBas

  switch (carte) {
    case 'frapper': {
      let p = profil.frappeur ? 5.5 : 3
      // Un mur qui ne tient qu'à deux briques se finit : c'est le score, à la fin.
      if (profil.compteur && plusBas <= 2) p += 2
      // Frapper ne défend pas. On ne le fait pas avec un mur à l'agonie — et
      // ça, tous les niveaux le voient : un bot qui se laisse tomber à zéro
      // sans réagir n'est pas un adversaire facile, c'est un adversaire cassé.
      if (mien <= 2) p -= 2
      if (profil.compteur && jeu.round >= ROUNDS - 2) p += 1
      // Le verrou, lu à l'envers : une cible qui a bloqué la manche passée ne
      // peut pas bloquer celle-ci, une cible qui a piégé ne peut pas piéger.
      // La frappe arrive alors à coup sûr, et ne revient pas dessus.
      //
      // Et l'inverse, qui est ce qui coûte le plus cher à une table de bots :
      // frapper n'ajoute **aucune** brique à son propre mur, alors qu'un piège
      // lui en prend une. Quand toutes les cibles peuvent encore piéger, la
      // frappe est un pari perdant, et le niveau redoutable est le seul à le
      // voir.
      if (profil.calculateur) {
        if (adversaires.some((a) => sansParade(jeu, a.id))) p += 2
        else if (adversaires.every((a) => legalCards(jeu, a.id).includes('pieger'))) p -= 2
      }
      return Math.max(0.5, p)
    }
    case 'reparer': {
      // Réparer un mur plein est jouable et ne rend rien : ça reste le moyen de
      // libérer un verrou quand il n'y a rien d'autre à faire, pas un plan.
      if (trous === 0) return 0.2
      // Une manche où personne ne peut frapper est la seule où une réparation
      // ne peut pas être reprise dans la foulée : elle se prend sans hésiter.
      return 1 + trous * 2 + (menace === 0 ? 3 : 0)
    }
    case 'bloquer': {
      // Personne ne peut frapper cette manche : bloquer, c'est passer son tour.
      if (menace === 0) return 0.3
      let p = 2
      if (profil.compteur && enTete) p += 1
      if (mien <= 2) p += 2
      return p
    }
    case 'pieger': {
      if (menace === 0) return 0.3
      let p = 2
      // Le piège paie quand on est la cible évidente — et le meneur l'est.
      if (profil.compteur && enTete) p += 2
      if (menace >= 2) p += 1
      // Chacun pour soi, le piège **domine** le blocage : les deux annulent la
      // frappe, mais le piège la retourne. Bloquer ne garde sa raison d'être
      // qu'en équipes, où il peut couvrir le coéquipier — et le tour d'après,
      // où le verrou l'aura rendu au joueur. C'est la lecture que le niveau
      // redoutable a et que les autres n'ont pas.
      if (profil.calculateur && moi.team === null) p += 2
      return p
    }
  }
}

/**
 * Ce joueur peut-il encore parer une frappe cette manche ?
 *
 * Son verrou le dit : il a bloqué la manche passée, donc il ne peut pas
 * bloquer celle-ci ; il a piégé, donc il ne peut pas piéger. C'est une
 * information publique — elle est écrite sur sa ligne, à l'écran.
 */
function sansParade(jeu: GameState, id: string): boolean {
  const cartes = legalCards(jeu, id)
  return !cartes.includes('bloquer') && !cartes.includes('pieger')
}

function tirerCarte(cartes: CardKey[], poids: number[], alea: () => number): CardKey {
  const total = poids.reduce((n, p) => n + p, 0)
  if (total <= 0) return cartes[0]
  let reste = alea() * total
  for (let i = 0; i < cartes.length; i++) {
    reste -= poids[i]
    if (reste <= 0) return cartes[i]
  }
  return cartes[cartes.length - 1]
}

/** Sur quel mur poser cette carte. */
function cible(
  jeu: GameState,
  moi: Player,
  carte: CardKey,
  profil: Profil,
  alea: () => number,
): string | undefined {
  const cibles = possibleTargets(jeu, moi.id, carte)
  if (cibles.length <= 1) return cibles[0]

  const mur = (id: string) => bricks(jeu.players.find((p) => p.id === id)!)
  const place = (id: string) => jeu.players.find((p) => p.id === id)!.seat

  if (carte === 'frapper') {
    // Mort subite : frapper quelqu'un qui n'est pas à égalité ne départage
    // rien. Le bassin se réduit donc aux meneurs, l'écran laissât-il viser
    // tout le monde. C'est la règle, pas une finesse : tous les niveaux la
    // suivent, sans quoi une mort subite ne finirait jamais.
    const meneurs = tiedLeaders(jeu)
      .map((p) => p.id)
      .filter((x) => x !== moi.id && cibles.includes(x))
    const bassin = jeu.phase === 'mort-subite' && meneurs.length > 0 ? meneurs : cibles

    // Le niveau tranquille frappe qui il veut : il ne compare pas les murs.
    // Ce n'est pas un coup absurde — c'est celui qu'on joue en regardant son
    // propre mur plutôt que ceux d'en face.
    if (!profil.compteur) return bassin[Math.min(bassin.length - 1, Math.floor(alea() * bassin.length))]

    // Le mur le plus haut : c'est lui qui gagne la partie. Le niveau
    // redoutable départage à mur égal par le verrou de la cible — une frappe
    // qui ne peut être ni bloquée ni retournée vaut mieux qu'une frappe au
    // hasard sur un mur de même hauteur.
    const note = (id: string) => mur(id) * 4 + (profil.calculateur && sansParade(jeu, id) ? 3 : 0)
    const ordre = [...bassin].sort((a, b) => note(b) - note(a) || place(a) - place(b))
    // Une fois sur cinq, un autre — sinon trois bots frappent éternellement le
    // même joueur, et la table n'a plus qu'un seul jeu.
    if (alea() < 0.8) return ordre[0]
    return ordre[Math.min(ordre.length - 1, Math.floor(alea() * ordre.length))]
  }

  // Bloquer et réparer : en équipes, ils peuvent viser le coéquipier. Le mur le
  // plus bas d'abord — c'est celui qui tombe, et le score est commun.
  return [...cibles].sort((a, b) => mur(a) - mur(b) || place(a) - place(b))[0]
}
