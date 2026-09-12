import { describe, expect, it } from 'vitest'
import { creerTable, salonNeuf } from '../net/table'
import { consequenceDuDepart } from './Quitter'

/**
 * Ce que la feuille promet en partant.
 *
 * C'est une règle avant d'être une phrase : promettre « tu retrouves ta place »
 * à quelqu'un qui joue seul contre des bots serait un mensonge, puisqu'il n'y a
 * personne derrière pour tenir le siège.
 */
describe('consequenceDuDepart', () => {
  it('seul contre des bots : la partie s’arrête, aucune place gardée', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    t.ajouterBot()
    t.ajouterBot()

    expect(consequenceDuDepart(t.salon, true)).toEqual({ detail: 'quitter.seul', garde: false })
  })

  it('à plusieurs, invité : les autres continuent, la place est gardée', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    t.admettre('b', 'Malo', null)

    expect(consequenceDuDepart(t.salon, false)).toEqual({
      detail: 'quitter.ensemble',
      garde: true,
    })
  })

  it('à plusieurs, arbitre : quelqu’un d’autre arbitrera', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    t.admettre('b', 'Malo', null)

    expect(consequenceDuDepart(t.salon, true)).toEqual({ detail: 'quitter.arbitre', garde: true })
  })

  it('un humain entouré de bots reste seul : les bots ne gardent rien', () => {
    const t = creerTable(salonNeuf('K7P2M9XR', 'a', 'Léa'))
    t.ajouterBot()
    t.ajouterBot()
    t.ajouterBot()

    expect(consequenceDuDepart(t.salon, true).garde).toBe(false)
  })
})
