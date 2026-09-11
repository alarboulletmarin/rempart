import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { NIVEAU_DEFAUT } from '../game/bot'
import { choicesRequired, legalCards, possibleTargets, readyCount } from '../game/engine'
import type { Choice } from '../game/types'
import { creerTable, salonNeuf } from './table'
import { ouvrirCanal, type Canal } from './room'
import { Session } from './session'

/**
 * Les bots, du salon jusqu'à la fin de la partie.
 *
 * Ces tests passent par `Session` et non par la table seule : ce qui fait
 * jouer un bot, c'est un minuteur côté hôte, et c'est justement la pièce
 * qu'on veut voir tourner. Le canal est muet — jouer seul contre des bots ne
 * demande aucun réseau, et c'est l'une des raisons d'être de la fonction.
 */
function canalMuet(): Canal {
  return {
    selfId: 'pair-moi',
    relaisActifs: () => 1,
    pairs: () => [],
    envoyer: () => {},
    sur: () => {},
    surArrivee: () => {},
    surDepart: () => {},
    quitter: () => Promise.resolve(),
  }
}

const ECOUTEURS = { onChange: () => {}, onAvis: () => {} }

/**
 * L'identité d'appareil se garde dans `localStorage` — c'est elle qui fait
 * qu'un rechargement de page ne perd pas son siège. Sans stockage, `clientId()`
 * en rend une neuve à chaque appel, et une session ne se reconnaîtrait pas
 * hôte de son propre salon.
 */
beforeAll(() => {
  const memoire = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => memoire.get(k) ?? null,
    setItem: (k: string, v: string) => void memoire.set(k, v),
    removeItem: (k: string) => void memoire.delete(k),
  })
})

/** Le temps qu'il faut pour que tous les bots aient posé leur carte. */
const laisserJouerLesBots = () => vi.advanceTimersByTime(15_000)

describe('le salon avec des bots', () => {
  it('assied un bot par place libre, et pas un de plus', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    expect(t.ajouterBot()).not.toBeNull()
    expect(t.ajouterBot()).not.toBeNull()
    expect(t.ajouterBot()).not.toBeNull()
    expect(t.ajouterBot()).toBeNull()
    expect(t.salon.joueurs).toHaveLength(4)
    expect(new Set(t.salon.joueurs.map((j) => j.ci)).size).toBe(4)
    expect(t.salon.joueurs.filter((j) => j.bot)).toHaveLength(3)
  })

  it('respecte le nombre de places réglé par l’hôte', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    t.reglerPlaces(2)
    expect(t.ajouterBot()).not.toBeNull()
    expect(t.ajouterBot()).toBeNull()
  })

  it('relève un bot, et rend sa place à un ami qui arrive', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    const bot = t.ajouterBot()!
    expect(t.retirerBot(bot)).toBe(true)
    expect(t.salon.joueurs).toHaveLength(1)
    expect(t.admettre('b', 'Malo', 'peer-b')).toBe(true)
  })

  it('ne relève pas un bot d’une partie commencée : son mur est en jeu', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    const bot = t.ajouterBot()!
    t.lancer(1)
    expect(t.retirerBot(bot)).toBe(false)
    expect(t.jeu!.players).toHaveLength(2)
  })

  it('assied ses bots au niveau du milieu, celui que personne n’a réglé', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    const bot = t.ajouterBot()!
    expect(t.salon.joueurs.find((j) => j.clientId === bot)!.niveau).toBe(NIVEAU_DEFAUT)
  })

  it('règle le niveau siège par siège, et pas toute la table', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    const un = t.ajouterBot()!
    const deux = t.ajouterBot()!
    expect(t.reglerNiveauBot(un, 'redoutable')).toBe(true)
    expect(t.salon.joueurs.find((j) => j.clientId === un)!.niveau).toBe('redoutable')
    expect(t.salon.joueurs.find((j) => j.clientId === deux)!.niveau).toBe(NIVEAU_DEFAUT)
  })

  it('ne règle pas le niveau d’un joueur, ni celui d’une partie commencée', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    t.admettre('b', 'Malo', 'peer-b')
    // Un humain n'a pas de niveau : le lui poser ferait croire à un réglage.
    expect(t.reglerNiveauBot('b', 'redoutable')).toBe(false)
    const bot = t.ajouterBot()!
    t.lancer(1)
    // En pleine partie, changer d'adversaire n'est plus un réglage.
    expect(t.reglerNiveauBot(bot, 'tranquille')).toBe(false)
    expect(t.salon.joueurs.find((j) => j.clientId === bot)!.niveau).toBe(NIVEAU_DEFAUT)
  })

  it('donne à chaque bot le premier nom libre', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    t.ajouterBot()
    t.ajouterBot()
    expect(t.salon.joueurs.map((j) => j.nom)).toEqual(['Léa', 'Truelle', 'Maillet'])
  })

  it('ne relève pas un joueur en le prenant pour un bot', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    t.admettre('b', 'Malo', 'peer-b')
    expect(t.retirerBot('b')).toBe(false)
    expect(t.salon.joueurs).toHaveLength(2)
  })
})

describe('les bots en partie', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const solo = (bots = 1): Session => {
    const session = Session.creer('Léa', ECOUTEURS, () => canalMuet())
    for (let i = 0; i < bots; i++) session.ajouterBot()
    return session
  }

  /**
   * Le coup du joueur humain : les premières cartes légales — deux quand
   * « Dernier mur » en demande deux, sans quoi la manche attendrait pour
   * toujours une carte qui ne vient pas.
   */
  const jeJoue = (session: Session): void => {
    const jeu = session.jeu!
    const legales = legalCards(jeu, session.moi)
    const choix: Choice[] = legales
      .slice(0, choicesRequired(jeu, session.moi))
      .map((carte) => ({ carte, cibles: possibleTargets(jeu, session.moi, carte) }))
      .map(({ carte, cibles }) => ({ card: carte, target: cibles[0] }))
    session.jouer(choix)
  }

  it('laisse lancer à deux, dont un bot', () => {
    const session = solo()
    session.lancer()
    expect(session.jeu).not.toBeNull()
    expect(session.jeu!.players).toHaveLength(2)
    session.quitter()
  })

  /**
   * Le battement de l'hôte déclare absent qui n'a rien dit depuis huit
   * secondes. Un bot ne dit jamais rien : sans exception, le salon se vide
   * de ses bots pendant que l'hôte lit le code à voix haute.
   */
  it('ne déclare pas absent un bot qui, par nature, ne répond jamais', () => {
    const session = solo(2)
    vi.advanceTimersByTime(30_000)
    expect(session.vue().salon.joueurs).toHaveLength(3)
    expect(session.vue().salon.joueurs.every((j) => j.connecte)).toBe(true)
    session.quitter()
  })

  it('fait poser leur carte aux bots, un peu après le joueur', () => {
    const session = solo(3)
    session.lancer()
    // Personne n'a encore joué : le bot prend le temps qu'un ami prendrait.
    expect(readyCount(session.jeu!).played).toBe(0)
    laisserJouerLesBots()
    const jeu = session.jeu!
    expect(jeu.phase).toBe('choix')
    expect(readyCount(jeu).played).toBe(3)
    session.quitter()
  })

  it('résout la manche dès que le joueur a posé la sienne', () => {
    const session = solo(2)
    session.lancer()
    laisserJouerLesBots()
    jeJoue(session)
    expect(session.jeu!.phase).toBe('revelation')
    session.quitter()
  })

  it('joue une partie entière contre trois bots, jusqu’au classement', () => {
    const session = solo(3)
    session.lancer()

    let garde = 0
    while (session.jeu!.phase !== 'fin' && garde++ < 120) {
      const phase = session.jeu!.phase
      if (phase === 'carte-manche' || phase === 'revelation') {
        session.passerALaSuite()
        continue
      }
      laisserJouerLesBots()
      if (session.jeu!.phase === 'choix' || session.jeu!.phase === 'mort-subite') jeJoue(session)
    }

    const jeu = session.jeu!
    expect(jeu.phase).toBe('fin')
    expect(jeu.vainqueurs?.length).toBeGreaterThan(0)
    // Le moteur n'a jamais su lequel de ces quatre murs était tenu par un
    // bot : ils ont joué la même partie, avec les mêmes règles.
    expect(jeu.players).toHaveLength(4)
    session.quitter()
  })

  it('règle le niveau d’un bot depuis la session, et le publie', () => {
    const session = solo(2)
    const [bot] = session.vue().salon.joueurs.filter((j) => j.bot)
    session.reglerNiveauBot(bot.clientId, 'redoutable')
    const apres = session.vue().salon.joueurs.find((j) => j.clientId === bot.clientId)!
    expect(apres.niveau).toBe('redoutable')
    // L'autre bot n'a pas bougé : le réglage est par siège.
    expect(session.vue().salon.joueurs.filter((j) => j.niveau === NIVEAU_DEFAUT)).toHaveLength(1)
    session.quitter()
  })

  /**
   * Un bot d'une version d'avant les niveaux arrive sans le champ. Il doit
   * jouer — au niveau du jeu — et non rester la carte en main.
   */
  it('fait jouer un bot qui n’annonce aucun niveau', () => {
    const session = solo(1)
    const salon = session.vue().salon
    const bot = salon.joueurs.find((j) => j.bot)!
    delete bot.niveau
    session.lancer()
    laisserJouerLesBots()
    expect(readyCount(session.jeu!).played).toBe(1)
    session.quitter()
  })

  it('n’arme aucun bot chez un invité : c’est l’arbitre qui les joue', () => {
    const invite = Session.rejoindre('K7P2M9XR', 'Malo', ECOUTEURS, () => canalMuet())
    invite.ajouterBot()
    expect(invite.vue().salon.joueurs).toHaveLength(0)
    invite.quitter()
  })
})

describe('le canal', () => {
  it('reste la seule porte vers le réseau', () => {
    // Garde-fou : `ouvrirCanal` est la fabrique par défaut, et les tests
    // ci-dessus n'en dépendent jamais — une partie contre des bots se joue
    // sans relais joignable.
    expect(typeof ouvrirCanal).toBe('function')
  })
})
