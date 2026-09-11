/**
 * L'autorité de la partie, côté hôte — sans réseau.
 *
 * C'est l'hôte qui fait foi : lui seul tient l'état, applique les gestes reçus
 * et fait avancer les manches. Ce fichier ne connaît ni WebRTC ni Trystero,
 * uniquement le moteur : `session.ts` se contente de lui apporter les gestes et
 * de rediffuser l'état.
 *
 * Cette séparation n'est pas cosmétique — elle permet de jouer une partie
 * entière en test, exactement par le chemin que prend la vraie partie.
 */
import {
  acknowledgeRoundCard,
  advance,
  allSubmitted,
  beginRound,
  createGame,
  resolveRound,
  submitChoice,
} from '../game/engine.ts'
import { NIVEAU_DEFAUT, NOMS_BOTS, type NiveauBot } from '../game/bot.ts'
import type { Format, GameState, PlayerId } from '../game/types.ts'
import { MAX_SIEGES, type Geste, type JoueurSalon, type Salon } from './room.ts'
import { accueilPour, peutAdmettre, type Accueil } from './admission.ts'

/** Les quatre prénoms de la planche d'identité, dans l'ordre des formes. */
export const NOMS_PAR_DEFAUT = ['Léa', 'Malo', 'Nour', 'Iris']
const NOM_MAX = 14

export type Table = {
  readonly salon: Salon
  readonly jeu: GameState | null
  /** Remplace l'état, quand on reprend l'arbitrage d'un hôte parti. */
  adopter(salon: Salon, jeu: GameState | null): void
  /** Applique un geste venu d'un joueur (ou de l'hôte lui-même). */
  appliquer(id: PlayerId, geste: Geste): boolean
  /** Fait entrer un joueur au salon, une fois l'hôte d'accord. */
  admettre(id: string, nom: string, peer: string | null): boolean
  /** Assied un bot sur une place libre. Renvoie son identité, ou null. */
  ajouterBot(): string | null
  /** Relève un bot de son siège, avant le lancement. */
  retirerBot(id: string): boolean
  /** Règle le niveau d'un bot, siège par siège. */
  reglerNiveauBot(id: string, niveau: NiveauBot): boolean
  /** Marque un joueur parti : son mur reste, ses cartes ne sont plus jouées. */
  sortir(id: string): void
  /** Le retour d'un joueur : il retrouve son siège et son mur, sans rien demander. */
  revenir(id: string, nom: string, peer: string | null): void
  /** Note par où ce joueur nous parle maintenant. */
  noterPair(id: string, peer: string): void
  reglerFormat(f: Format): void
  reglerCartesManche(on: boolean): void
  reglerPlaces(n: number): void
  lancer(seed?: number): void
  rejouer(seed?: number): void
  /** Que faire du `hello` de cet appareil ? */
  accueil(id: string, refuses: ReadonlySet<string>, attente: ReadonlySet<string>): Accueil
  peutAdmettre(id: string, attente: ReadonlySet<string>): boolean
}

function siegeLibre(joueurs: JoueurSalon[]): 0 | 1 | 2 | 3 {
  for (let i = 0; i < MAX_SIEGES; i++) {
    if (!joueurs.some((j) => j.ci === i)) return i as 0 | 1 | 2 | 3
  }
  return 0
}

/**
 * L'identité d'un bot.
 *
 * Elle se déduit de sa forme, donc elle est unique à la table sans tirage :
 * deux bots ne partagent jamais une forme. Et elle ne peut pas collisionner
 * avec l'identité d'un appareil, qui est un UUID.
 */
export const idBot = (ci: number) => `bot-${ci}`

export function salonNeuf(code: string, hoteId: string, nom: string): Salon {
  return {
    code,
    hoteClientId: hoteId,
    epoch: 0,
    round: 0,
    format: 'chacun',
    cartesManche: true,
    places: MAX_SIEGES,
    joueurs: [
      {
        clientId: hoteId,
        nom: nom.trim().slice(0, NOM_MAX) || NOMS_PAR_DEFAUT[0],
        ci: 0,
        peerId: null,
        hote: true,
        pret: true,
        connecte: true,
      },
    ],
    lancee: false,
  }
}

export function creerTable(salonInitial: Salon): Table {
  let salon = salonInitial
  let jeu: GameState | null = null

  /**
   * Toute mutation de l'état passe par ici : c'est le seul endroit qui avance
   * le numéro d'état, donc le seul qui ne peut pas l'oublier.
   */
  const poser = (suivant: GameState) => {
    jeu = { ...suivant, seq: (jeu?.seq ?? -1) + 1 }
  }

  /**
   * Dès que tout le monde a joué, la manche se résout d'elle-même : personne
   * n'a de bouton « valider » à presser, et le dernier à choisir n'attend pas.
   */
  const resoudreSiPret = () => {
    if (!jeu) return
    if (jeu.phase !== 'choix' && jeu.phase !== 'mort-subite') return
    if (!allSubmitted(jeu)) return
    poser(resolveRound(jeu))
  }

  return {
    get salon() {
      return salon
    },
    get jeu() {
      return jeu
    },

    adopter(s, j) {
      salon = s
      jeu = j
    },

    accueil: (id, refuses, attente) => accueilPour({ salon, refuses, attente }, id),
    peutAdmettre: (id, attente) => peutAdmettre({ salon, refuses: new Set(), attente }, id),

    noterPair(id, peer) {
      const j = salon.joueurs.find((x) => x.clientId === id)
      if (j) j.peerId = peer
    },

    admettre(id, nom, peer) {
      if (salon.joueurs.some((j) => j.clientId === id)) return false
      if (salon.lancee || salon.joueurs.length >= salon.places) return false
      const ci = siegeLibre(salon.joueurs)
      salon.joueurs.push({
        clientId: id,
        nom: nom.trim().slice(0, NOM_MAX) || NOMS_PAR_DEFAUT[ci],
        ci,
        peerId: peer,
        hote: false,
        pret: false,
        connecte: true,
      })
      return true
    },

    /**
     * Un bot s'assied.
     *
     * Rien d'autre qu'un siège de plus, avec un drapeau : le moteur ne saura
     * jamais que ce joueur-là n'a pas de téléphone, et c'est ce qui garantit
     * qu'un bot joue exactement au même jeu que les autres. Il est « prêt »
     * d'emblée — il n'a personne à attendre.
     */
    ajouterBot() {
      if (salon.lancee || salon.joueurs.length >= salon.places) return null
      const ci = siegeLibre(salon.joueurs)
      const id = idBot(ci)
      if (salon.joueurs.some((j) => j.clientId === id)) return null
      salon.joueurs.push({
        clientId: id,
        // Le premier nom libre, et non celui de la forme : l'hôte occupe
        // presque toujours la première, et « Truelle » ne serait jamais sorti.
        nom: NOMS_BOTS.find((n) => !salon.joueurs.some((j) => j.nom === n)) ?? NOMS_BOTS[ci],
        ci,
        peerId: null,
        hote: false,
        pret: true,
        connecte: true,
        bot: true,
        niveau: NIVEAU_DEFAUT,
      })
      return id
    },

    /**
     * Le niveau se règle au salon, et pas en pleine partie : changer
     * d'adversaire au milieu d'une manche, ce n'est plus un réglage, c'est une
     * autre partie.
     */
    reglerNiveauBot(id, niveau) {
      if (salon.lancee) return false
      const joueur = salon.joueurs.find((j) => j.clientId === id)
      if (!joueur?.bot) return false
      joueur.niveau = niveau
      return true
    },

    /** On ne relève pas un bot d'une partie commencée : son mur est en jeu. */
    retirerBot(id) {
      if (salon.lancee) return false
      const joueur = salon.joueurs.find((j) => j.clientId === id)
      if (!joueur?.bot) return false
      salon.joueurs = salon.joueurs.filter((j) => j.clientId !== id)
      return true
    },

    revenir(id, nom, peer) {
      const joueur = salon.joueurs.find((x) => x.clientId === id)
      if (!joueur) return
      joueur.connecte = true
      joueur.peerId = peer
      const propre = nom.trim().slice(0, NOM_MAX)
      if (propre) joueur.nom = propre
      if (jeu) {
        poser({
          ...jeu,
          players: jeu.players.map((p) =>
            p.id === id ? { ...p, connected: true, name: propre || p.name } : p,
          ),
        })
      }
    },

    sortir(id) {
      const joueur = salon.joueurs.find((x) => x.clientId === id)
      if (!joueur) return
      if (jeu) {
        // En pleine partie, son mur reste en place et ses cartes ne sont plus
        // jouées — la partie peut continuer sans lui.
        joueur.connecte = false
        joueur.peerId = null
        poser({
          ...jeu,
          players: jeu.players.map((p) => (p.id === id ? { ...p, connected: false } : p)),
        })
        // Son départ peut débloquer la manche : on n'attend plus son choix.
        resoudreSiPret()
      } else {
        salon.joueurs = salon.joueurs.filter((x) => x.clientId !== id)
      }
    },

    appliquer(id, geste) {
      const joueur = salon.joueurs.find((j) => j.clientId === id)
      if (!joueur) return false
      switch (geste.t) {
        case 'identite': {
          if (salon.lancee) return false
          // Une forme déjà prise ne peut pas être volée.
          if (salon.joueurs.some((j) => j.ci === geste.ci && j.clientId !== id)) return false
          joueur.ci = geste.ci
          return true
        }
        case 'nom': {
          const nom = geste.nom.trim().slice(0, NOM_MAX)
          if (!nom) return false
          joueur.nom = nom
          if (jeu) {
            poser({
              ...jeu,
              players: jeu.players.map((p) => (p.id === id ? { ...p, name: nom } : p)),
            })
          }
          return true
        }
        case 'pret':
          joueur.pret = geste.pret
          return true
        case 'choix': {
          if (!jeu) return false
          // `submitChoice` refuse tout choix illégal : un client bricolé ne peut
          // pas jouer une carte verrouillée ni viser son propre camp.
          const suite = submitChoice(jeu, id, geste.choix)
          if (geste.choix.length > 0 && (suite.choices[id]?.length ?? 0) === 0) return false
          poser(suite)
          resoudreSiPret()
          return true
        }
        case 'suite': {
          if (!jeu) return false
          if (jeu.phase === 'carte-manche') poser(acknowledgeRoundCard(jeu))
          else if (jeu.phase === 'revelation') poser(advance(jeu))
          else return false
          return true
        }
      }
    },

    reglerFormat(f) {
      salon.format = f
      // Le deux contre deux demande quatre murs.
      if (f === 'equipes') salon.places = MAX_SIEGES
    },
    reglerCartesManche(on) {
      salon.cartesManche = on
    },
    reglerPlaces(n) {
      salon.places = Math.max(2, Math.min(MAX_SIEGES, n))
    },

    lancer(seed = Math.floor(Math.random() * 2 ** 31)) {
      if (salon.joueurs.length < 2) return
      if (salon.format === 'equipes' && salon.joueurs.length !== MAX_SIEGES) return
      const sieges = salon.joueurs.map((j, i) => ({
        id: j.clientId,
        name: j.nom,
        ci: j.ci,
        team: (i % 2) as 0 | 1,
      }))
      jeu = null
      poser(
        beginRound(
          createGame(sieges, { format: salon.format, roundCards: salon.cartesManche }, seed),
        ),
      )
      salon.lancee = true
      salon.round += 1
    },

    rejouer(seed = Math.floor(Math.random() * 2 ** 31)) {
      const precedent = jeu
      if (!precedent) return
      // Même salon, murs remis à cinq.
      jeu = null
      poser(
        beginRound({
          ...precedent,
          players: precedent.players.map((p) => ({
            ...p,
            wall: p.wall.map(() => 'intact' as const),
            locked: [],
          })),
          round: 1,
          usedRoundCards: [],
          choices: {},
          lastOutcome: null,
          seed,
          seq: 0,
          mortSubite: 0,
          vainqueurs: null,
        }),
      )
      salon.round += 1
    },
  }
}
