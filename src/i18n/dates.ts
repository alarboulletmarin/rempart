/**
 * Les dates telles qu'on les dit — « cet après-midi », « hier soir ».
 *
 * Séparé de `format.ts` parce que ce n'est plus de la mise en forme : il faut
 * le catalogue. Et séparé du palmarès, qui n'est que son premier lecteur.
 *
 * La forme entière se lit dans le catalogue, sous une clé par cas. C'est ce qui
 * corrige « ce après-midi » : le démonstratif n'est plus collé devant le moment
 * à l'affichage, il fait partie de la phrase écrite une fois pour toutes — et
 * l'anglais, qui n'élide rien mais dit « this afternoon » là où le français dit
 * « cet », n'a aucune règle à partager avec lui.
 */

import type { T } from './index'
import { dateCourte, heureCourte, joursEcoules, momentDuJour } from './format'

/** « cet après-midi », « hier soir », « il y a 3 jours », puis la date. */
export function quand(t: T, at: number, maintenant = Date.now()): string {
  const jours = joursEcoules(at, maintenant)
  const moment = momentDuJour(at)
  if (jours === 0) return t(`date.${moment}`)
  if (jours === 1) return t(`date.hier.${moment}`)
  if (jours < 7) return t('date.ilYaJours', { n: jours })
  return dateCourte(at, t.langue)
}

/** « 14/03 · 21 h 05 · Chacun pour soi · 4 j » — la ligne datée du palmarès. */
export function dateEtFormat(
  t: T,
  partie: { at: number; format: 'chacun' | 'equipes'; joueurs: number },
): string {
  return t('palmares.partie.date', {
    date: dateCourte(partie.at, t.langue),
    heure: heureCourte(partie.at, t.langue),
    format:
      partie.format === 'equipes'
        ? t('palmares.partie.format.equipes')
        : t('palmares.partie.format.chacun', { n: partie.joueurs }),
  })
}
