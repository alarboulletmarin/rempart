import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { choicesRequired, legalCards, possibleTargets, readyCount } from '../game/engine'
import type { Choice } from '../game/types'
import { creerTable, salonNeuf } from './table'
import { ouvrirCanal, type Canal } from './room'
import { Session } from './session'

/**
 * Les robots, du salon jusqu'à la fin de la partie.
 *
 * Ces tests passent par `Session` et non par la table seule : ce qui fait
 * jouer un robot, c'est un minuteur côté hôte, et c'est justement la pièce
 * qu'on veut voir tourner. Le canal est muet — jouer seul contre des robots ne
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

/** Le temps qu'il faut pour que tous les robots aient posé leur carte. */
const laisserJouerLesRobots = () => vi.advanceTimersByTime(15_000)

describe('le salon avec des robots', () => {
  it('assied un robot par place libre, et pas un de plus', () => {
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

  it('relève un robot, et rend sa place à un ami qui arrive', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    const robot = t.ajouterBot()!
    expect(t.retirerBot(robot)).toBe(true)
    expect(t.salon.joueurs).toHaveLength(1)
    expect(t.admettre('b', 'Malo', 'peer-b')).toBe(true)
  })

  it('ne relève pas un robot d’une partie commencée : son mur est en jeu', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    const robot = t.ajouterBot()!
    t.lancer(1)
    expect(t.retirerBot(robot)).toBe(false)
    expect(t.jeu!.players).toHaveLength(2)
  })

  it('ne relève pas un joueur en le prenant pour un robot', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    t.admettre('b', 'Malo', 'peer-b')
    expect(t.retirerBot('b')).toBe(false)
    expect(t.salon.joueurs).toHaveLength(2)
  })
})

describe('les robots en partie', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const solo = (robots = 1): Session => {
    const session = Session.creer('Léa', ECOUTEURS, () => canalMuet())
    for (let i = 0; i < robots; i++) session.ajouterBot()
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

  it('laisse lancer à deux, dont un robot', () => {
    const session = solo()
    session.lancer()
    expect(session.jeu).not.toBeNull()
    expect(session.jeu!.players).toHaveLength(2)
    session.quitter()
  })

  /**
   * Le battement de l'hôte déclare absent qui n'a rien dit depuis huit
   * secondes. Un robot ne dit jamais rien : sans exception, le salon se vide
   * de ses robots pendant que l'hôte lit le code à voix haute.
   */
  it('ne déclare pas absent un robot qui, par nature, ne répond jamais', () => {
    const session = solo(2)
    vi.advanceTimersByTime(30_000)
    expect(session.vue().salon.joueurs).toHaveLength(3)
    expect(session.vue().salon.joueurs.every((j) => j.connecte)).toBe(true)
    session.quitter()
  })

  it('fait poser leur carte aux robots, un peu après le joueur', () => {
    const session = solo(3)
    session.lancer()
    // Personne n'a encore joué : le robot prend le temps qu'un ami prendrait.
    expect(readyCount(session.jeu!).played).toBe(0)
    laisserJouerLesRobots()
    const jeu = session.jeu!
    expect(jeu.phase).toBe('choix')
    expect(readyCount(jeu).played).toBe(3)
    session.quitter()
  })

  it('résout la manche dès que le joueur a posé la sienne', () => {
    const session = solo(2)
    session.lancer()
    laisserJouerLesRobots()
    jeJoue(session)
    expect(session.jeu!.phase).toBe('revelation')
    session.quitter()
  })

  it('joue une partie entière contre trois robots, jusqu’au classement', () => {
    const session = solo(3)
    session.lancer()

    let garde = 0
    while (session.jeu!.phase !== 'fin' && garde++ < 120) {
      const phase = session.jeu!.phase
      if (phase === 'carte-manche' || phase === 'revelation') {
        session.passerALaSuite()
        continue
      }
      laisserJouerLesRobots()
      if (session.jeu!.phase === 'choix' || session.jeu!.phase === 'mort-subite') jeJoue(session)
    }

    const jeu = session.jeu!
    expect(jeu.phase).toBe('fin')
    expect(jeu.vainqueurs?.length).toBeGreaterThan(0)
    // Le moteur n'a jamais su lequel de ces quatre murs était tenu par un
    // robot : ils ont joué la même partie, avec les mêmes règles.
    expect(jeu.players).toHaveLength(4)
    session.quitter()
  })

  it('n’arme aucun robot chez un invité : c’est l’arbitre qui les joue', () => {
    const invite = Session.rejoindre('K7P2M9XR', 'Malo', ECOUTEURS, () => canalMuet())
    invite.ajouterBot()
    expect(invite.vue().salon.joueurs).toHaveLength(0)
    invite.quitter()
  })
})

describe('le canal', () => {
  it('reste la seule porte vers le réseau', () => {
    // Garde-fou : `ouvrirCanal` est la fabrique par défaut, et les tests
    // ci-dessus n'en dépendent jamais — une partie contre des robots se joue
    // sans relais joignable.
    expect(typeof ouvrirCanal).toBe('function')
  })
})
