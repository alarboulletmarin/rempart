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
 */
import { bricks, choicesRequired, legalCards, possibleTargets, rng, tiedLeaders } from './engine'
import { ROUNDS, WALL_SIZE, type CardKey, type Choice, type GameState, type Player } from './types'

/**
 * Le temps qu'un bot laisse passer avant de poser sa carte.
 *
 * Pas pour faire semblant de réfléchir : sans ce délai, le « 2 / 3 ont joué »
 * est déjà à « 3 / 3 » quand l'écran s'affiche, et la manche se résout sous le
 * pouce du joueur. Le hasard évite que trois bots posent à la même seconde.
 */
export const BOT_MIN_MS = 900
export const BOT_MAX_MS = 2100

export function delaiBot(alea: () => number = Math.random): number {
  return BOT_MIN_MS + Math.floor(alea() * (BOT_MAX_MS - BOT_MIN_MS))
}

/** Les noms des bots, par forme. Des outils : on voit tout de suite que ce n'est personne. */
export const NOMS_BOTS = ['Truelle', 'Maillet', 'Équerre', 'Rabot']

/**
 * Le hasard du bot, tiré de l'état lui-même.
 *
 * Même état, même carte : un bot rejoué deux fois sur la même manche — un
 * minuteur qui se réveille en double, un arbitre qui reprend la main — ne
 * change pas d'avis en route. C'est aussi ce qui rend ses choix testables.
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
  alea?: () => number,
): Choice[] {
  const moi = jeu.players.find((p) => p.id === id)
  if (!moi) return []
  const tirage = alea ?? hasard(jeu, moi)

  // Une carte sans cible possible n'est pas jouable : tout le monde est parti,
  // ou la carte de manche a fermé la seule cible qui restait.
  const jouables = legalCards(jeu, id).filter((k) => possibleTargets(jeu, id, k).length > 0)

  const choix: Choice[] = []
  const posees: CardKey[] = []
  for (let i = 0; i < choicesRequired(jeu, id); i++) {
    const reste = jouables.filter((k) => !posees.includes(k))
    if (reste.length === 0) break
    const carte = tirerCarte(reste, reste.map((k) => poids(jeu, moi, k)), tirage)
    posees.push(carte)
    choix.push({ card: carte, target: cible(jeu, moi, carte, tirage) })
  }
  return choix
}

/**
 * Ce que vaut une carte cette manche, aux yeux du bot.
 *
 * Des poids et non un choix sec : le meilleur coup sort souvent, pas toujours.
 * Un bot qui joue toujours la même réponse à la même situation se bat en
 * trois manches, et le verrou — qui fait tout le jeu — ne veut plus rien dire.
 */
function poids(jeu: GameState, moi: Player, carte: CardKey): number {
  const mien = bricks(moi)
  const trous = WALL_SIZE - mien
  const adversaires = jeu.players.filter(
    (p) => p.connected && p.id !== moi.id && (moi.team === null || p.team !== moi.team),
  )
  // Qui a encore le droit de frapper ? Le verrou de la manche passée et la
  // carte de manche répondent tous les deux, et ça se lit sur l'écran.
  const menace = adversaires.filter((p) => legalCards(jeu, p.id).includes('frapper')).length
  const murs = adversaires.map(bricks)
  const plusHaut = murs.length > 0 ? Math.max(...murs) : 0
  const plusBas = murs.length > 0 ? Math.min(...murs) : WALL_SIZE
  // Mener, c'est dépasser quelqu'un. À la première manche tous les murs sont
  // pleins : personne n'est en tête, et la table n'a aucune raison de
  // commencer par se barricader.
  const enTete = mien >= plusHaut && mien > plusBas

  switch (carte) {
    case 'frapper': {
      let p = 3
      // Un mur qui ne tient qu'à deux briques se finit : c'est le score, à la fin.
      if (plusBas <= 2) p += 2
      // Frapper ne défend pas. On ne le fait pas avec un mur à l'agonie.
      if (mien <= 2) p -= 2
      if (jeu.round >= ROUNDS - 2) p += 1
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
      if (enTete) p += 1
      if (mien <= 2) p += 2
      return p
    }
    case 'pieger': {
      if (menace === 0) return 0.3
      let p = 2
      // Le piège paie quand on est la cible évidente — et le meneur l'est.
      if (enTete) p += 2
      if (menace >= 2) p += 1
      return p
    }
  }
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
function cible(jeu: GameState, moi: Player, carte: CardKey, alea: () => number): string | undefined {
  const cibles = possibleTargets(jeu, moi.id, carte)
  if (cibles.length <= 1) return cibles[0]

  const mur = (id: string) => bricks(jeu.players.find((p) => p.id === id)!)
  const place = (id: string) => jeu.players.find((p) => p.id === id)!.seat

  if (carte === 'frapper') {
    // Mort subite : frapper quelqu'un qui n'est pas à égalité ne départage
    // rien. Le bassin se réduit donc aux meneurs, l'écran laissât-il viser
    // tout le monde.
    const meneurs = tiedLeaders(jeu)
      .map((p) => p.id)
      .filter((x) => x !== moi.id && cibles.includes(x))
    const bassin = jeu.phase === 'mort-subite' && meneurs.length > 0 ? meneurs : cibles
    // Le mur le plus haut : c'est lui qui gagne la partie. Une fois sur cinq,
    // un autre — sinon trois bots frappent éternellement le même joueur, et
    // la table n'a plus qu'un seul jeu.
    const ordre = [...bassin].sort((a, b) => mur(b) - mur(a) || place(a) - place(b))
    if (alea() < 0.8) return ordre[0]
    return ordre[Math.min(ordre.length - 1, Math.floor(alea() * ordre.length))]
  }

  // Bloquer et réparer : en équipes, ils peuvent viser le coéquipier. Le mur le
  // plus bas d'abord — c'est celui qui tombe, et le score est commun.
  return [...cibles].sort((a, b) => mur(a) - mur(b) || place(a) - place(b))[0]
}
