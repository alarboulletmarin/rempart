import { describe, expect, it } from 'vitest'
import { accueilPour, peutAdmettre, type Admission } from './admission'
import type { JoueurSalon, Salon } from './room'

function joueur(clientId: string, ci: 0 | 1 | 2 | 3): JoueurSalon {
  return { clientId, nom: clientId, ci, peerId: null, hote: ci === 0, pret: true, connecte: true }
}

function salon(over: Partial<Salon> = {}): Salon {
  return {
    code: 'K7P2M9XR',
    hoteClientId: 'a',
    epoch: 0,
    round: 0,
    format: 'chacun',
    cartesManche: true,
    places: 4,
    joueurs: [joueur('a', 0)],
    lancee: false,
    ...over,
  }
}

function etat(over: Partial<Admission> = {}): Admission {
  return { salon: salon(), refuses: new Set(), attente: new Set(), ...over }
}

describe('qui entre dans le salon', () => {
  it('un nouveau venu demande l’accord de l’hôte', () => {
    expect(accueilPour(etat(), 'inconnu')).toEqual({ kind: 'demande' })
  })

  it('un joueur qui a déjà un siège revient chez lui, sans rien demander', () => {
    expect(accueilPour(etat(), 'a')).toEqual({ kind: 'retour' })
  })

  it('un siège déjà attribué l’emporte même sur un refus antérieur', () => {
    // L'hôte a pu changer d'avis en l'invitant depuis.
    const e = etat({
      salon: salon({ joueurs: [joueur('a', 0), joueur('b', 1)] }),
      refuses: new Set(['b']),
    })
    expect(accueilPour(e, 'b')).toEqual({ kind: 'retour' })
  })

  it('un refusé ne redemande pas', () => {
    expect(accueilPour(etat({ refuses: new Set(['b']) }), 'b')).toEqual({ kind: 'refuse' })
  })

  it('table pleine : il regarde', () => {
    const pleine = salon({
      joueurs: [joueur('a', 0), joueur('b', 1), joueur('c', 2), joueur('d', 3)],
    })
    expect(accueilPour(etat({ salon: pleine }), 'e')).toEqual({ kind: 'spectateur' })
  })

  it('partie lancée : il regarde', () => {
    expect(accueilPour(etat({ salon: salon({ lancee: true }) }), 'b')).toEqual({
      kind: 'spectateur',
    })
  })

  it('un joueur de la partie en cours revient quand même chez lui', () => {
    // Rechargement de page, tunnel, batterie : son mur est encore debout sur
    // l'écran de tout le monde, la porte ne doit pas claquer dans son dos.
    const enCours = salon({ joueurs: [joueur('a', 0), joueur('b', 1)], lancee: true })
    expect(accueilPour(etat({ salon: enCours }), 'b')).toEqual({ kind: 'retour' })
  })

  it('une demande déjà en attente reste une demande', () => {
    expect(accueilPour(etat({ attente: new Set(['b']) }), 'b')).toEqual({ kind: 'demande' })
  })

  it('un siège libéré par un joueur qui part rouvre la porte', () => {
    const pleine = salon({
      joueurs: [joueur('a', 0), joueur('b', 1), joueur('c', 2), joueur('d', 3)],
    })
    expect(accueilPour(etat({ salon: pleine }), 'e')).toEqual({ kind: 'spectateur' })
    const allegee = salon({ joueurs: [joueur('a', 0), joueur('b', 1), joueur('c', 2)] })
    expect(accueilPour(etat({ salon: allegee }), 'e')).toEqual({ kind: 'demande' })
  })

  it('le nombre de places réglé par l’hôte fait foi, pas le maximum', () => {
    const duo = salon({ places: 2, joueurs: [joueur('a', 0), joueur('b', 1)] })
    expect(accueilPour(etat({ salon: duo }), 'c')).toEqual({ kind: 'spectateur' })
  })
})

describe('l’hôte accepte', () => {
  it('accepte une demande en attente', () => {
    expect(peutAdmettre(etat({ attente: new Set(['b']) }), 'b')).toBe(true)
  })

  it('n’accepte pas quelqu’un qui n’a rien demandé', () => {
    expect(peutAdmettre(etat(), 'b')).toBe(false)
  })

  it('n’accepte plus une fois la partie lancée', () => {
    const e = etat({ salon: salon({ lancee: true }), attente: new Set(['b']) })
    expect(peutAdmettre(e, 'b')).toBe(false)
  })

  it('n’accepte plus si la table s’est remplie entre-temps', () => {
    const pleine = salon({
      joueurs: [joueur('a', 0), joueur('b', 1), joueur('c', 2), joueur('d', 3)],
    })
    expect(peutAdmettre(etat({ salon: pleine, attente: new Set(['e']) }), 'e')).toBe(false)
  })

  it('n’accepte pas deux fois le même : ce serait un siège en double', () => {
    const e = etat({
      salon: salon({ joueurs: [joueur('a', 0), joueur('b', 1)] }),
      attente: new Set(['b']),
    })
    expect(peutAdmettre(e, 'b')).toBe(false)
  })
})
