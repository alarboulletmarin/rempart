import { describe, expect, it } from 'vitest'
import {
  choisirBot,
  DELAI_BOT,
  delaiBot,
  estNiveauBot,
  NIVEAUX_BOT,
  NIVEAU_DEFAUT,
  type NiveauBot,
} from './bot'
import {
  advance,
  beginRound,
  createGame,
  isChoiceValid,
  playersToAct,
  resolveRound,
  standings,
  submitChoice,
} from './engine'
import type { CardKey, GameState, Slot } from './types'

const SIEGES = [
  { id: 'a', name: 'Léa', ci: 0 as const },
  { id: 'b', name: 'Truelle', ci: 1 as const },
  { id: 'c', name: 'Maillet', ci: 2 as const },
]

function partie(seed = 7): GameState {
  return beginRound(createGame(SIEGES, { format: 'chacun', roundCards: false }, seed))
}

/** « IIBBB » : trois briques cassées à droite. */
const mur = (s: string): Slot[] => [...s].map((c) => (c === 'B' ? 'broken' : 'intact'))

function avecMurs(jeu: GameState, murs: Record<string, string>): GameState {
  return {
    ...jeu,
    players: jeu.players.map((p) => (murs[p.id] ? { ...p, wall: mur(murs[p.id]) } : p)),
  }
}

function avecVerrous(jeu: GameState, verrous: Record<string, CardKey[]>): GameState {
  return {
    ...jeu,
    players: jeu.players.map((p) => ({ ...p, locked: verrous[p.id] ?? p.locked })),
  }
}

/** Ce que le bot joue sur cent graines : la distribution, pas le coup. */
function surCentGraines(
  fabrique: (jeu: GameState) => GameState,
  qui = 'b',
  niveau?: NiveauBot,
): CardKey[] {
  const cartes: CardKey[] = []
  for (let seed = 0; seed < 100; seed++) {
    const jeu = fabrique(partie(seed))
    cartes.push(...choisirBot(jeu, qui, niveau).map((c) => c.card))
  }
  return cartes
}

const part = (cartes: CardKey[], k: CardKey) => cartes.filter((c) => c === k).length / cartes.length

describe('le bot', () => {
  it('ne joue que des coups que le moteur accepte', () => {
    for (let seed = 0; seed < 200; seed++) {
      const jeu = partie(seed)
      for (const p of jeu.players) {
        for (const choix of choisirBot(jeu, p.id)) {
          expect(isChoiceValid(jeu, p.id, choix)).toBe(true)
        }
      }
    }
  })

  it('pose exactement une carte, et deux quand « Dernier mur » l’exige', () => {
    const jeu = partie()
    expect(choisirBot(jeu, 'b')).toHaveLength(1)

    const dernierMur: GameState = {
      ...avecMurs(jeu, { b: 'IBBBB' }),
      activeRoundCard: { id: 'dernier-mur', n: 'Dernier mur', axis: '', d: '', why: '' },
    }
    const deux = choisirBot(dernierMur, 'b')
    expect(deux).toHaveLength(2)
    // Deux fois la même carte serait jouable, et n'aurait aucun sens.
    expect(deux[0].card).not.toBe(deux[1].card)
  })

  it('ne rejoue jamais la carte verrouillée', () => {
    const cartes = surCentGraines((jeu) => avecVerrous(jeu, { b: ['frapper'] }))
    expect(part(cartes, 'frapper')).toBe(0)
  })

  it('ne part pas à l’attaque avec un mur à une brique', () => {
    const cartes = surCentGraines((jeu) => avecMurs(jeu, { b: 'IBBBB' }))
    expect(part(cartes, 'frapper')).toBeLessThan(0.1)
  })

  it('répare son mur troué quand la manche ne peut pas le frapper', () => {
    const cartes = surCentGraines((jeu) =>
      avecMurs(avecVerrous(jeu, { a: ['frapper'], c: ['frapper'] }), { b: 'IIBBB' }),
    )
    expect(part(cartes, 'reparer')).toBeGreaterThan(0.6)
  })

  /**
   * À la première manche, tous les murs sont pleins et personne n'a encore
   * frappé : un bot qui se barricade d'entrée donne une partie où il ne se
   * passe rien pendant trois manches.
   */
  it('ouvre la partie en frappant plus souvent qu’en se barricadant', () => {
    const cartes = surCentGraines((jeu) => jeu)
    expect(part(cartes, 'frapper')).toBeGreaterThan(part(cartes, 'pieger'))
    expect(part(cartes, 'frapper')).toBeGreaterThan(part(cartes, 'bloquer'))
  })

  it('ne répare pas un mur plein', () => {
    const cartes = surCentGraines((jeu) => jeu)
    expect(part(cartes, 'reparer')).toBeLessThan(0.1)
  })

  /**
   * Le verrou est la mémoire du jeu, et c'est une information publique : un
   * adversaire qui a frappé la manche passée ne peut pas frapper celle-ci. Un
   * bot qui bloque contre une table désarmée passe son tour.
   */
  it('ne se protège pas quand plus personne ne peut frapper', () => {
    const cartes = surCentGraines((jeu) =>
      avecMurs(avecVerrous(jeu, { a: ['frapper'], c: ['frapper'] }), { b: 'IIIIB' }),
    )
    expect(part(cartes, 'bloquer') + part(cartes, 'pieger')).toBeLessThan(0.15)
  })

  it('se protège quand la table peut frapper et qu’il est en tête', () => {
    const cartes = surCentGraines((jeu) => avecMurs(jeu, { a: 'IIIBB', c: 'IIIBB' }))
    expect(part(cartes, 'bloquer') + part(cartes, 'pieger')).toBeGreaterThan(0.3)
  })

  it('frappe le mur le plus haut, pas le plus commode', () => {
    const jeu = avecMurs(avecVerrous(partie(), { b: ['reparer'] }), {
      a: 'IIIII',
      b: 'IIIII',
      c: 'IBBBB',
    })
    const cibles: string[] = []
    for (let seed = 0; seed < 60; seed++) {
      const choix = choisirBot({ ...jeu, seed }, 'b').filter((c) => c.card === 'frapper')
      cibles.push(...choix.map((c) => c.target!))
    }
    expect(cibles.length).toBeGreaterThan(10)
    expect(cibles.filter((x) => x === 'a').length / cibles.length).toBeGreaterThan(0.6)
  })

  it('vise un joueur à égalité en mort subite, et non un mur déjà distancé', () => {
    const fini = avecMurs(partie(), { a: 'IIIII', b: 'IIIII', c: 'IIIBB' })
    const subite: GameState = {
      ...fini,
      round: 10,
      phase: 'revelation',
      lastOutcome: null,
    }
    const jeu = advance(subite)
    expect(jeu.phase).toBe('mort-subite')
    for (let seed = 0; seed < 40; seed++) {
      const choix = choisirBot({ ...jeu, seed }, 'b')
      expect(choix).toHaveLength(1)
      expect(choix[0].card).toBe('frapper')
      expect(choix[0].target).toBe('a')
    }
  })

  it('décide toujours la même chose sur le même état', () => {
    const jeu = avecMurs(partie(3), { b: 'IIIBB' })
    expect(choisirBot(jeu, 'b')).toEqual(choisirBot(jeu, 'b'))
  })

  it('mène une partie de dix manches jusqu’au bout, entre bots', () => {
    let jeu = partie(42)
    let garde = 0
    while (jeu.phase !== 'fin' && garde++ < 200) {
      if (jeu.phase === 'carte-manche') {
        jeu = { ...jeu, phase: 'choix' }
        continue
      }
      if (jeu.phase === 'revelation') {
        jeu = advance(jeu)
        continue
      }
      for (const p of playersToAct(jeu)) jeu = submitChoice(jeu, p.id, choisirBot(jeu, p.id))
      jeu = resolveRound(jeu)
    }
    expect(jeu.phase).toBe('fin')
    expect(jeu.vainqueurs?.length).toBeGreaterThan(0)
  })
})

/**
 * Les trois niveaux.
 *
 * Ce qui compte ici n'est pas qu'un profil existe, c'est que l'écart se
 * **mesure** : un sélecteur qui ne change rien à la partie est une promesse
 * que le salon ne tient pas.
 */
describe('les trois niveaux', () => {
  /** Une partie entière entre bots, et qui l'emporte. */
  function duel(seed: number, niveaux: NiveauBot[]): string[] {
    const sieges = niveaux.map((_, i) => ({
      id: `p${i}`,
      name: `P${i}`,
      ci: i as 0 | 1 | 2 | 3,
    }))
    let jeu = beginRound(createGame(sieges, { format: 'chacun', roundCards: true }, seed))
    let garde = 0
    while (jeu.phase !== 'fin' && garde++ < 300) {
      if (jeu.phase === 'carte-manche') {
        jeu = { ...jeu, phase: 'choix' }
        continue
      }
      if (jeu.phase === 'revelation') {
        jeu = advance(jeu)
        continue
      }
      for (const p of playersToAct(jeu)) {
        jeu = submitChoice(jeu, p.id, choisirBot(jeu, p.id, niveaux[Number(p.id.slice(1))]))
      }
      jeu = resolveRound(jeu)
    }
    return standings(jeu).filter((r) => r.winner).map((r) => r.player.id)
  }

  /** Assez de duels pour que l'écart se voie, assez peu pour rester court. */
  const DUELS = 60

  function victoires(fort: NiveauBot, faible: NiveauBot): number {
    let gagnes = 0
    for (let seed = 1; seed <= DUELS; seed++) {
      // Le siège du fort change d'une graine à l'autre : sans cela on
      // mesurerait surtout la place à la table.
      const place = seed % 2
      const niveaux: NiveauBot[] = place === 0 ? [fort, faible] : [faible, fort]
      const vainqueurs = duel(seed, niveaux)
      if (vainqueurs.length === 1 && vainqueurs[0] === `p${place}`) gagnes++
    }
    return gagnes / DUELS
  }

  it('fait gagner le redoutable contre le tranquille, nettement', () => {
    const part = victoires('redoutable', 'tranquille')
    expect(part, `${Math.round(part * 100)} %`).toBeGreaterThan(0.66)
  })

  it('fait gagner le redoutable contre le normal', () => {
    const part = victoires('redoutable', 'normal')
    expect(part, `${Math.round(part * 100)} %`).toBeGreaterThan(0.58)
  })

  it('fait gagner le normal contre le tranquille', () => {
    const part = victoires('normal', 'tranquille')
    expect(part, `${Math.round(part * 100)} %`).toBeGreaterThan(0.52)
  })

  it('ne joue que des coups légaux, à tous les niveaux', () => {
    for (const niveau of NIVEAUX_BOT) {
      for (let seed = 0; seed < 60; seed++) {
        const jeu = partie(seed)
        for (const p of jeu.players) {
          for (const choix of choisirBot(jeu, p.id, niveau)) {
            expect(isChoiceValid(jeu, p.id, choix), niveau).toBe(true)
          }
        }
      }
    }
  })

  /**
   * L'erreur du tranquille est une erreur de joueur, pas une erreur de
   * programme : il se barricade contre une table qui n'a plus le droit de
   * frapper, parce qu'il ne regarde pas les verrous des autres.
   */
  it('laisse le tranquille se barricader contre une table désarmée', () => {
    const table = (jeu: GameState) =>
      avecMurs(avecVerrous(jeu, { a: ['frapper'], c: ['frapper'] }), { b: 'IIIIB' })
    const perdu = (n: NiveauBot) => {
      const cartes = surCentGraines(table, 'b', n)
      return part(cartes, 'bloquer') + part(cartes, 'pieger')
    }
    expect(perdu('tranquille')).toBeGreaterThan(0.25)
    expect(perdu('normal')).toBeLessThan(0.15)
  })

  it('fait frapper le tranquille plus souvent que les autres', () => {
    const ouverture = (n: NiveauBot) => part(surCentGraines((jeu) => jeu, 'b', n), 'frapper')
    expect(ouverture('tranquille')).toBeGreaterThan(ouverture('normal'))
  })

  /**
   * Même au niveau le plus bas, un mur à une brique se répare : un bot qui se
   * laisse tomber à zéro sans réagir n'est pas un adversaire facile, c'est un
   * adversaire cassé — on ne joue pas contre lui, on le regarde perdre.
   */
  it('fait quand même réparer le tranquille quand son mur est à l’agonie', () => {
    const cartes = surCentGraines((jeu) => avecMurs(jeu, { b: 'IBBBB' }), 'b', 'tranquille')
    expect(part(cartes, 'reparer')).toBeGreaterThan(
      Math.max(part(cartes, 'frapper'), part(cartes, 'bloquer'), part(cartes, 'pieger')),
    )
  })

  /**
   * Chacun pour soi, le piège annule la frappe **et** la retourne, là où le
   * blocage se contente de l'annuler. Le niveau redoutable est le seul à le
   * savoir.
   */
  it('fait préférer le piège au blocage au niveau redoutable', () => {
    const menacé = (jeu: GameState) => avecMurs(jeu, { a: 'IIIBB', c: 'IIIBB' })
    const ecart = (n: NiveauBot) => {
      const cartes = surCentGraines(menacé, 'b', n)
      return part(cartes, 'pieger') - part(cartes, 'bloquer')
    }
    expect(ecart('redoutable')).toBeGreaterThan(ecart('normal'))
  })

  /**
   * Le verrou, lu à l'envers : une cible qui a bloqué et piégé les deux
   * dernières manches ne peut parer ni l'un ni l'autre. Le niveau redoutable
   * frappe là, les autres ne regardent que la hauteur des murs.
   */
  it('fait viser la cible sans parade au niveau redoutable', () => {
    // « Dernier mur » n'entre pas en jeu ici : deux cartes verrouillées se
    // lisent après une manche où le joueur en a posé deux.
    const sansParade = avecVerrous(avecMurs(partie(), { a: 'IIIII', c: 'IIIII' }), {
      b: ['reparer'],
      c: ['bloquer', 'pieger'],
    })
    const vise = (n: NiveauBot) => {
      let surC = 0
      let frappes = 0
      for (let seed = 0; seed < 80; seed++) {
        for (const choix of choisirBot({ ...sansParade, seed }, 'b', n)) {
          if (choix.card !== 'frapper') continue
          frappes++
          if (choix.target === 'c') surC++
        }
      }
      return frappes === 0 ? 0 : surC / frappes
    }
    expect(vise('redoutable')).toBeGreaterThan(vise('normal'))
  })
})

describe('le sélecteur de niveaux du salon', () => {
  it('reconnaît les trois identifiants et rien d’autre', () => {
    for (const niveau of NIVEAUX_BOT) expect(estNiveauBot(niveau)).toBe(true)
    // Le niveau arrive du réseau : ce qu'on ne comprend pas doit retomber sur
    // le défaut, jamais sur un profil introuvable.
    for (const faux of ['', 'facile', 'Normal', null, undefined, 2, {}, ['normal']]) {
      expect(estNiveauBot(faux), JSON.stringify(faux) ?? 'undefined').toBe(false)
    }
  })

  it('joue en normal par défaut, et le défaut est celui du milieu', () => {
    // Un défaut posé à un bout du sélecteur ferait de la moitié des tables une
    // difficulté que personne n'a demandée.
    expect(NIVEAU_DEFAUT).toBe('normal')
    expect(NIVEAUX_BOT.indexOf(NIVEAU_DEFAUT)).toBe(1)
  })

  it('décide comme le niveau normal quand personne n’a rien réglé', () => {
    for (let seed = 0; seed < 40; seed++) {
      const jeu = avecMurs(partie(seed), { b: 'IIIBB' })
      expect(choisirBot(jeu, 'b')).toEqual(choisirBot(jeu, 'b', 'normal'))
    }
  })

  it('raccourcit le temps de réflexion du tranquille au redoutable', () => {
    for (let i = 1; i < NIVEAUX_BOT.length; i++) {
      // L'attente fait partie du personnage : un adversaire redoutable qui
      // traînerait plus qu'un tranquille jouerait le rôle de l'autre.
      expect(DELAI_BOT[NIVEAUX_BOT[i]], NIVEAUX_BOT[i]).toBeLessThan(DELAI_BOT[NIVEAUX_BOT[i - 1]])
    }
  })

  it('écarte le délai réel sans jamais l’annuler', () => {
    for (const niveau of NIVEAUX_BOT) {
      for (const tirage of [0, 0.5, 0.999]) {
        const d = delaiBot(niveau, () => tirage)
        expect(d).toBeGreaterThanOrEqual(DELAI_BOT[niveau] * 0.8)
        expect(d).toBeLessThanOrEqual(DELAI_BOT[niveau] * 1.2)
      }
    }
  })
})
