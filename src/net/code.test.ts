import { describe, expect, it } from 'vitest'
import { ALPHABET_CODE, LONGUEUR_CODE, codeValide, fabriquerCode, normaliserCode } from './room'

/** L'alphabet d'avant, celui que les versions déjà installées acceptent. */
const ANCIEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Les paires qu'on confond en dictant un code, ou en le relisant. */
const PAIRES = [
  ['B', '8'],
  ['G', '6'],
  ['I', '1'],
  ['L', '1'],
  ['O', '0'],
  ['S', '5'],
  ['Z', '2'],
  ['U', 'V'],
]

describe('l’alphabet des codes', () => {
  it('ne garde jamais les deux membres d’une paire qu’on confond', () => {
    for (const [a, b] of PAIRES) {
      const gardes = [a, b].filter((c) => ALPHABET_CODE.includes(c))
      expect(gardes.length, `${a} et ${b}`).toBeLessThan(2)
    }
  })

  it('reste un sous-ensemble de l’ancien', () => {
    // C'est ce qui permet à une version déjà installée de joindre une partie
    // ouverte par celle-ci : le code qu'elle reçoit lui reste valide.
    for (const c of ALPHABET_CODE) expect(ANCIEN_ALPHABET).toContain(c)
  })

  it('garde de quoi ne pas se faire deviner', () => {
    // 22⁸, soit un peu moins de trente-six bits. Le vrai verrou reste
    // l'accord de l'hôte, mais un code ne doit pas se balayer en une soirée.
    expect(Math.log2(ALPHABET_CODE.length ** LONGUEUR_CODE)).toBeGreaterThan(35)
  })

  it('fabrique des codes qu’il reconnaît', () => {
    for (let i = 0; i < 200; i++) {
      const code = fabriquerCode()
      expect(code).toHaveLength(LONGUEUR_CODE)
      expect(codeValide(code)).toBe(true)
    }
  })
})

describe('la saisie d’un code', () => {
  it('accepte les minuscules', () => {
    expect(normaliserCode('acdefhjk')).toBe('ACDEFHJK')
  })

  it('laisse passer les séparateurs qu’on met en recopiant', () => {
    expect(normaliserCode('ACDE-FHJK')).toBe('ACDEFHJK')
    expect(normaliserCode('ACDE FHJK')).toBe('ACDEFHJK')
  })

  it('rattrape le U, seul écarté dont le partenaire est resté', () => {
    expect(normaliserCode('UCDEFHJK')).toBe('VCDEFHJK')
    expect(normaliserCode('ucdefhjk')).toBe('VCDEFHJK')
  })

  it('ignore ce qui n’appartient à aucun code', () => {
    // Taper un 0 ou un O ne veut rien dire : aucun code n'en contient.
    expect(normaliserCode('A0O1IL5S')).toBe('A')
  })

  it('ne dépasse jamais la longueur d’un code', () => {
    expect(normaliserCode('ACDEFHJKMNPQ')).toHaveLength(LONGUEUR_CODE)
  })
})
