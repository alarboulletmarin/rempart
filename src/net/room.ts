/**
 * Transport pair-à-pair. Ne connaît rien aux règles du jeu.
 *
 * WebRTC exige toujours une phase de « signaling » pour que deux navigateurs se
 * trouvent. Trystero la fait passer par une infrastructure publique existante
 * (ici le réseau Nostr) : il n'y a donc aucun serveur à déployer ni à payer, ce
 * qui est la condition même de cette collection d'apps — front-only, sans
 * compte, sans serveur de jeu.
 *
 * Le point faible connu de ce montage est le NAT symétrique — fréquent en
 * 4G/5G — où deux pairs n'arrivent pas à établir de lien direct. Un relais TURN
 * sert alors de filet ; voir `turnServers`.
 */

import { getRelaySockets, joinRoom, selfId } from 'trystero/nostr'
import type { NiveauBot } from '../game/bot.ts'
import type { Choice, Format, GameState } from '../game/types.ts'
import { turnServers } from './turn.ts'

/**
 * Le nom de scène du jeu sur les relais publics : c'est lui qui isole nos
 * salons de ceux des autres applications qui passent par la même
 * infrastructure.
 *
 * Deux appareils qui n'annoncent pas le même ne se voient jamais, même avec le
 * bon code de partie — et une PWA déjà installée garde sa version en cache un
 * moment après une mise en ligne. Le changer ferait donc échouer les parties
 * entre un ami à jour et un ami qui ne l'est pas encore, sans que ni l'un ni
 * l'autre ne puisse comprendre pourquoi.
 */
export const APP_ID = 'jeu-rempart-v1'

/** Quatre murs au maximum : c'est la contrainte de lecture de l'écran de jeu. */
export const MAX_SIEGES = 4

/**
 * Un siège au salon.
 *
 * `ci` est l'index d'identité 0–3 : il détermine la FORME autant que la
 * couleur. C'est la règle non négociable de la DA — aucune information ne
 * dépend jamais de la couleur seule.
 */
export type JoueurSalon = {
  /** Identité stable d'un appareil, survit à un rechargement de page. */
  clientId: string
  nom: string
  ci: 0 | 1 | 2 | 3
  peerId: string | null
  hote: boolean
  pret: boolean
  connecte: boolean
  /**
   * Un siège tenu par un bot, et non par un appareil.
   *
   * Il voyage avec le salon parce que tout le monde a besoin de le savoir :
   * l'écran, pour l'écrire sur la ligne plutôt que de laisser croire qu'un ami
   * est arrivé ; l'arbitre, parce que c'est lui qui joue les cartes de ce
   * siège-là ; et le battement, qui ne doit pas déclarer absent un joueur qui
   * n'a jamais eu de téléphone. Optionnel : un salon publié par une version
   * plus ancienne n'en porte pas, et n'a alors aucun bot à la table.
   */
  bot?: boolean
  /**
   * Le niveau de ce bot (voir `game/bot.ts`).
   *
   * **Par siège, et non par table.** À quatre, on veut souvent un adversaire
   * sérieux et deux qui laissent respirer ; un réglage unique l'interdirait.
   *
   * Il vit dans le salon et non dans `GameConfig`, qui ne porte que des RÈGLES
   * et voyage dans l'état de la partie : le niveau d'un bot n'est pas une règle
   * du jeu, et il n'a rien à faire dans ce que le moteur reçoit. Comme le bot ne
   * joue que chez l'arbitre, ce champ n'a jamais besoin d'être exact ailleurs —
   * il n'y sert qu'à être lu sur la ligne du salon.
   *
   * Optionnel, comme `bot` : une version plus ancienne publie un salon qui ne le
   * porte pas, et chaque lecture retombe alors sur `NIVEAU_DEFAUT`.
   */
  niveau?: NiveauBot
}

export type Salon = {
  code: string
  hoteClientId: string
  /**
   * Numéro de règne de l'hôte.
   *
   * Sans lui, deux appareils coupés l'un de l'autre peuvent se croire tous les
   * deux arbitres et n'ont aucun moyen d'en sortir : chacun ignore les salons
   * de l'autre. L'époque donne un ordre à ces deux vérités — celle du règne le
   * plus récent gagne, et le perdant redevient invité sans perdre son siège.
   */
  epoch: number
  /**
   * Numéro de partie, incrémenté à chaque revanche.
   *
   * Le numéro d'état repart de zéro à chaque nouvelle partie : sans ce
   * compteur-ci, un invité qui garde l'état final de la partie précédente
   * rejette le premier état de la suivante comme périmé, et reste devant son
   * classement pendant que les autres jouent.
   */
  round: number
  format: Format
  cartesManche: boolean
  places: number
  joueurs: JoueurSalon[]
  lancee: boolean
}

export type Hello = { clientId: string; nom: string }

/**
 * Réponse de l'hôte à qui demande une place.
 *
 * `attente`    : la demande est posée, l'hôte n'a pas encore tranché.
 * `refuse`     : refusée.
 * `spectateur` : table pleine ou partie lancée — il n'y a rien à trancher, et
 *                sans cette réponse le pair se representerait indéfiniment.
 *
 * Il n'y a pas d'« accepté » : un siège accordé se voit dans le salon publié,
 * et deux façons de dire la même chose finiraient par se contredire.
 */
export type Verdict = { clientId: string; statut: 'attente' | 'refuse' | 'spectateur' }

/**
 * L'état de la partie, tel qu'il voyage.
 *
 * L'enveloppe porte le règne et la partie : le moteur n'a pas à les connaître —
 * il ne sait rien du réseau — mais le destinataire, lui, a besoin des deux pour
 * décider si cet état-là est plus récent que le sien.
 *
 * Et `from`, l'identité de l'expéditeur : un identifiant de pair ne dit rien de
 * qui arbitre, et sans ce champ n'importe qui pourrait imposer son état à toute
 * la table. Ce n'est pas une signature — le modèle reste « on se fait confiance
 * entre amis » — c'est ce qui permet d'ignorer un ancien arbitre qui s'ignore.
 */
export type EtatMessage = { from: string; epoch: number; round: number; jeu: GameState }

/** Ce qu'un joueur demande à l'arbitre de faire. */
export type Geste =
  | { t: 'choix'; choix: Choice[] }
  /** Passer le bandeau de carte de manche, ou la révélation. */
  | { t: 'suite' }
  | { t: 'identite'; ci: 0 | 1 | 2 | 3 }
  | { t: 'nom'; nom: string }
  | { t: 'pret'; pret: boolean }

/**
 * Une intention, adressée à l'hôte.
 *
 * `seq` dit sur quel état elle se fonde — l'hôte reconnaît ainsi un choix parti
 * à temps mais arrivé tard. `nonce` la rend rejouable sans risque : l'invité
 * réémet jusqu'à l'accusé de réception, l'hôte n'applique qu'une fois. `epoch`
 * dit sous quel règne elle a été décidée — une intention destinée à l'arbitre
 * d'avant n'a pas à s'appliquer à la partie de celui d'après.
 */
export type Intention = {
  clientId: string
  epoch: number
  seq: number
  nonce: string
  geste: Geste
}

/** Accusé de réception d'une intention, renvoyé au seul émetteur. */
export type Recu = { nonce: string; ok: boolean; erreur?: ErreurIntention }

/**
 * Ce qui peut être reproché à une intention.
 *
 * Aucune n'est une faute de jeu : `refuse` dit que le choix n'était pas
 * jouable (verrou, cible interdite), `pasDePartie` que l'arbitre n'a pas encore
 * la partie sous les yeux — il vient de reprendre la main et attend qu'on la
 * lui rende. Les taire serait pire : un accusé favorable sur un coup que
 * personne n'a appliqué fige la table sans un message.
 */
export type ErreurIntention = 'refuse' | 'pasDePartie' | 'lienPerdu'

/**
 * Un message de conversation, ou une réaction — c'est la même chose.
 *
 * Il ne passe **pas** par l'arbitre : il part à la cantonade, et chacun le
 * reçoit directement de son auteur. La partie, elle, a besoin d'une autorité —
 * un état contradictoire casserait le jeu ; une conversation, non. La faire
 * transiter par l'hôte n'aurait rien garanti de plus qu'un aller-retour de
 * latence sur un emoji, et aurait donné à l'arbitre un pouvoir qu'il n'a aucune
 * raison d'avoir sur ce que les autres se disent.
 *
 * Ni accusé de réception, ni réémission : un emoji perdu est un emoji perdu.
 * `id` rend tout de même la réception idempotente, le transport pouvant doubler
 * une livraison.
 */
export type MessageChat = { id: string; de: string; texte: string }

/**
 * Battement de l'hôte. `at` revient tel quel dans le `pong` : l'hôte mesure
 * ainsi un aller-retour sur sa seule horloge, sans jamais avoir à la comparer à
 * celle des autres.
 */
export type Tic = { from: string; epoch: number; seq: number; at: number }
export type Pong = { clientId: string; at: number }

type Messages = {
  hello: Hello
  join: Verdict
  lobby: Salon
  state: EtatMessage
  intent: Intention
  ack: Recu
  tick: Tic
  pong: Pong
  chat: MessageChat
}

export type Canal = {
  selfId: string
  /** Relais de signalisation réellement connectés, pour diagnostiquer une panne. */
  relaisActifs: () => number
  pairs: () => string[]
  envoyer: <K extends keyof Messages>(kind: K, data: Messages[K], to?: string) => void
  sur: <K extends keyof Messages>(kind: K, cb: (data: Messages[K], peer: string) => void) => void
  surArrivee: (cb: (peer: string) => void) => void
  surDepart: (cb: (peer: string) => void) => void
  /** Rendue : rejoindre le même salon avant que l'ancien ne soit vraiment fermé
   *  rend le même objet, détruit une fraction de seconde plus tard. */
  quitter: () => Promise<void>
}

/**
 * Serveur TURN, optionnel, fourni au build.
 *
 * Il passe par `turnConfig` et surtout PAS par `rtcConfig.iceServers` :
 * Trystero construit sa connexion avec `{iceServers: défauts.concat(turnConfig),
 * ...rtcConfig}`, donc un `rtcConfig.iceServers` écraserait silencieusement ses
 * STUN par défaut *et* ce turnConfig.
 */
const turnConfig = turnServers(
  import.meta.env.VITE_TURN_URLS,
  import.meta.env.VITE_TURN_USER,
  import.meta.env.VITE_TURN_PASS,
)

/**
 * Relais Nostr pour la mise en relation.
 *
 * Trystero tire ses relais parmi une longue liste par défaut, mais le tirage
 * est déterministe : tous les joueurs de cette app tapent toujours les mêmes,
 * sans repli si l'un tombe. Huit au lieu de cinq : la signalisation ne coûte
 * que quelques messages éphémères, et c'est elle qui décide si deux amis se
 * trouvent ou passent la soirée devant un écran qui tourne.
 */
const relayConfig = { redundancy: 8 }

/**
 * Vue neutre d'un canal Trystero. Le cast est confiné ici : au-dessus,
 * `envoyer` et `sur` restent typés par `Messages`, donc impossible d'envoyer un
 * `Salon` sur le canal `state`.
 */
type CanalBrut = {
  send: (data: unknown, options?: { target?: string }) => Promise<void>
  onMessage: ((data: never, context: { peerId: string }) => void) | null
}

export function ouvrirCanal(code: string, onErreur?: (message: string) => void): Canal {
  const room = joinRoom({ appId: APP_ID, turnConfig, relayConfig }, code, {
    // Trystero ne signale que les échecs survenus APRÈS avoir trouvé un pair
    // (SDP échangé mais connexion impossible : typiquement l'absence de TURN).
    // L'attente sans aucun pair, elle, relève du minuteur côté session.
    onJoinError: ({ error }) => onErreur?.(error),
  })

  // Trystero limite les noms d'action à 12 octets.
  //
  // Le générique de `makeAction` est laissé de côté : il exige une signature
  // d'index JSON que nos types — des unions discriminées, justement — ne
  // peuvent pas porter sans perdre ce qui les rend sûrs. Le typage réel vit
  // au-dessus, dans `envoyer` et `sur`, où `Messages` interdit d'envoyer un
  // `Salon` sur le canal `state`. Le cast est confiné à ces huit lignes.
  const action = (nom: string): CanalBrut => room.makeAction(nom) as unknown as CanalBrut
  const canaux: Record<keyof Messages, CanalBrut> = {
    hello: action('hello'),
    join: action('join'),
    lobby: action('lobby'),
    state: action('state'),
    intent: action('intent'),
    ack: action('ack'),
    tick: action('tick'),
    pong: action('pong'),
    chat: action('chat'),
  }

  return {
    selfId,
    relaisActifs: () =>
      Object.values(getRelaySockets() as Record<string, { readyState: number }>).filter(
        (socket) => socket.readyState === 1,
      ).length,
    pairs: () => Object.keys(room.getPeers()),
    envoyer: (kind, data, to) => {
      // Un envoi échoue si le pair vient de partir : sans conséquence pour la partie.
      void canaux[kind].send(data, to ? { target: to } : undefined).catch(() => {})
    },
    sur: (kind, cb) => {
      canaux[kind].onMessage = ((data: never, context: { peerId: string }) =>
        cb(data, context.peerId)) as CanalBrut['onMessage']
    },
    surArrivee: (cb) => {
      room.onPeerJoin = cb
    },
    surDepart: (cb) => {
      room.onPeerLeave = cb
    },
    quitter: () => room.leave(),
  }
}

/** Identité de l'appareil, pour retrouver son siège après un rechargement. */
export function clientId(): string {
  const KEY = 'rempart.clientId'
  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    // Navigation privée, stockage bloqué : on joue quand même, mais un
    // rechargement de page fera perdre le siège. C'est le moindre mal.
    return crypto.randomUUID()
  }
}

/** Sans I/O/0/1, ambigus quand on dicte un code au téléphone. */
export const ALPHABET_CODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Longueur du code de partie. Voir `fabriquerCode`. */
export const LONGUEUR_CODE = 8

/**
 * Code de partie, lisible au téléphone et transmissible par SMS.
 *
 * **Huit caractères.** Le code n'est pas qu'une commodité : c'est l'adresse du
 * rendez-vous sur les relais publics *et* le seul secret qui protège le salon.
 * L'identifiant d'app est public — le dépôt est libre — donc qui veut peut
 * précalculer le sujet de chaque code possible et repérer les parties en cours.
 * À quatre caractères sur un alphabet de 32, cela fait 32⁴ ≈ un million de
 * possibilités : quelques secondes de calcul. À huit, 32⁸ ≈ 10¹², et le jeu
 * n'en vaut plus la chandelle.
 *
 * Et l'accord de l'hôte reste le vrai verrou : un code deviné ne donne plus une
 * place, seulement une demande à refuser (voir `admission.ts`).
 */
export function fabriquerCode(longueur = LONGUEUR_CODE): string {
  const octets = crypto.getRandomValues(new Uint8Array(longueur))
  return Array.from(octets, (b) => ALPHABET_CODE[b % ALPHABET_CODE.length]).join('')
}

export function codeValide(code: string): boolean {
  return new RegExp(`^[${ALPHABET_CODE}]{${LONGUEUR_CODE}}$`).test(code.toUpperCase())
}
