import { describe, expect, it } from 'vitest'
import { quand } from './dates'
import { categoriePluriel, liste, momentDuJour, ordinal } from './format'
import { traducteur } from './index'

const fr = traducteur('fr')
const en = traducteur('en')

/** Un instant du jour, à l'heure locale de la machine qui exécute le test. */
function aujourdhuiA(heure: number): number {
  const d = new Date()
  d.setHours(heure, 0, 0, 0)
  return d.getTime()
}

function ilYA(jours: number, heure: number): number {
  const d = new Date(aujourdhuiA(heure))
  d.setDate(d.getDate() - jours)
  return d.getTime()
}

describe('ordinal', () => {
  it('ne marque que le premier en français', () => {
    expect(ordinal(1, 'fr')).toBe('1er')
    expect(ordinal(2, 'fr')).toBe('2e')
    expect(ordinal(3, 'fr')).toBe('3e')
    expect(ordinal(4, 'fr')).toBe('4e')
  })

  it('suit le dernier chiffre en anglais', () => {
    expect(ordinal(1, 'en')).toBe('1st')
    expect(ordinal(2, 'en')).toBe('2nd')
    expect(ordinal(3, 'en')).toBe('3rd')
    expect(ordinal(4, 'en')).toBe('4th')
  })

  it('excepte la dizaine anglaise de 11 à 13', () => {
    expect(ordinal(11, 'en')).toBe('11th')
    expect(ordinal(12, 'en')).toBe('12th')
    expect(ordinal(13, 'en')).toBe('13th')
    expect(ordinal(21, 'en')).toBe('21st')
  })
})

describe('pluriel', () => {
  it('range zéro avec le singulier en français, avec le pluriel en anglais', () => {
    expect(categoriePluriel(0, 'fr')).toBe('un')
    expect(categoriePluriel(0, 'en')).toBe('autre')
    expect(fr.n('brique', 0)).toBe('0 brique')
    expect(en.n('brique', 0)).toBe('0 bricks')
  })

  it('accorde un et plusieurs', () => {
    expect(fr.n('brique', 1)).toBe('1 brique')
    expect(fr.n('brique', 3)).toBe('3 briques')
    expect(en.n('brique', 1)).toBe('1 brick')
    expect(en.n('brique', 3)).toBe('3 bricks')
  })
})

describe('liste', () => {
  it('énumère avec la liaison de la langue', () => {
    expect(liste(['Frapper'], 'fr')).toBe('Frapper')
    expect(liste(['Frapper', 'Bloquer'], 'fr')).toContain(' et ')
    expect(liste(['Strike', 'Block'], 'en')).toContain(' and ')
  })
})

describe('dates relatives', () => {
  it('élide le démonstratif devant une voyelle', () => {
    // C'est la faute que l'écran affichait : « ce après-midi ».
    expect(quand(fr, aujourdhuiA(14))).toBe('cet après-midi')
    expect(quand(fr, aujourdhuiA(9))).toBe('ce matin')
    expect(quand(fr, aujourdhuiA(20))).toBe('ce soir')
  })

  it('dit la veille sans démonstratif', () => {
    expect(quand(fr, ilYA(1, 14))).toBe('hier après-midi')
    expect(quand(fr, ilYA(1, 9))).toBe('hier matin')
    expect(quand(fr, ilYA(1, 20))).toBe('hier soir')
  })

  it('compte les jours, puis passe à la date', () => {
    expect(quand(fr, ilYA(3, 14))).toBe('il y a 3 jours')
    expect(quand(fr, ilYA(9, 14))).toMatch(/^\d{2}\/\d{2}$/)
  })

  it('dit la même chose en anglais', () => {
    expect(quand(en, aujourdhuiA(14))).toBe('this afternoon')
    expect(quand(en, ilYA(1, 20))).toBe('yesterday evening')
    expect(quand(en, ilYA(3, 14))).toBe('3 days ago')
  })

  it('coupe les moments aux mêmes heures dans les deux langues', () => {
    expect(momentDuJour(aujourdhuiA(11))).toBe('matin')
    expect(momentDuJour(aujourdhuiA(12))).toBe('apresMidi')
    expect(momentDuJour(aujourdhuiA(17))).toBe('apresMidi')
    expect(momentDuJour(aujourdhuiA(18))).toBe('soir')
  })
})

describe('catalogue', () => {
  it('remplace les paramètres', () => {
    expect(fr('date.ilYaJours', { n: 5 })).toBe('il y a 5 jours')
  })

  it('porte la même clé dans les deux langues', () => {
    expect(fr('carte.frapper')).toBe('Frapper')
    expect(en('carte.frapper')).toBe('Strike')
  })
})
