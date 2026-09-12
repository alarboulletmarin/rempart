/**
 * Ce qui se met en forme plutôt qu'en phrase : rangs, pluriels, listes, dates.
 *
 * Tout ce qui est ici dépend de la langue par une RÈGLE et non par un mot —
 * « 1er » n'est pas la traduction de « 1st », c'est la même règle appliquée à
 * deux grammaires. Les mots, eux, vivent dans le catalogue (`fr.ts`, `en.ts`)
 * et ne passent jamais par ici.
 *
 * Et surtout : rien n'est assemblé ici par collage de fragments. « ce » + « ,
 * après-midi » donnait « ce après-midi », et aucune règle d'élision écrite en
 * français ne suivrait l'anglais. Une forme irrégulière se garde entière dans
 * le catalogue, sous sa propre clé.
 */

export type Langue = 'fr' | 'en'

export const LANGUES: readonly Langue[] = ['fr', 'en']

/** L'étiquette BCP 47 de la langue, pour les API du navigateur. */
export const LOCALE: Record<Langue, string> = { fr: 'fr-FR', en: 'en-GB' }

/**
 * Le rang tel qu'on l'écrit.
 *
 * Le français ne marque que le premier — « 1er », puis « 2e », « 3e » ; le
 * « 1ᵉ » qu'affichait l'écran de fin n'existe dans aucun des deux. L'anglais
 * suit le dernier chiffre, sauf de 11 à 13.
 */
export function ordinal(n: number, langue: Langue): string {
  if (langue === 'fr') return n === 1 ? '1er' : `${n}e`
  const dizaine = n % 100
  if (dizaine >= 11 && dizaine <= 13) return `${n}th`
  const suffixe = { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'
  return `${n}${suffixe}`
}

/**
 * La catégorie de pluriel d'un nombre.
 *
 * `Intl.PluralRules` et non `n > 1` : le français range zéro avec le singulier
 * (« 0 brique »), l'anglais avec le pluriel (« 0 bricks »). C'est exactement le
 * genre de règle qu'on ne devine pas, et le navigateur la connaît déjà.
 */
export function categoriePluriel(n: number, langue: Langue): 'un' | 'autre' {
  try {
    return new Intl.PluralRules(LOCALE[langue]).select(n) === 'one' ? 'un' : 'autre'
  } catch {
    // Environnement sans Intl complet : le repli vaut pour les deux langues
    // sur tous les nombres que le jeu manipule (0 à 10).
    return langue === 'fr' ? (n < 2 ? 'un' : 'autre') : n === 1 ? 'un' : 'autre'
  }
}

/** « Frapper et Bloquer » / « Strike and Block ». */
export function liste(parties: readonly string[], langue: Langue): string {
  if (parties.length <= 1) return parties[0] ?? ''
  try {
    return new Intl.ListFormat(LOCALE[langue], { style: 'long', type: 'conjunction' }).format(
      parties,
    )
  } catch {
    const liaison = langue === 'fr' ? ' et ' : ' and '
    return parties.slice(0, -1).join(', ') + liaison + parties[parties.length - 1]
  }
}

/**
 * Le moment de la journée, tel que le palmarès le dit.
 *
 * Rendu comme une clé et non comme un mot : c'est l'appelant qui va chercher
 * la phrase entière dans le catalogue, « cet après-midi » comprise. Coller un
 * démonstratif devant un moment est précisément ce qui produisait la faute.
 */
export type Moment = 'matin' | 'apresMidi' | 'soir'

export function momentDuJour(at: number): Moment {
  const heure = new Date(at).getHours()
  return heure >= 18 ? 'soir' : heure >= 12 ? 'apresMidi' : 'matin'
}

/** Le nombre de jours pleins entre deux instants, minuit faisant la coupure. */
export function joursEcoules(at: number, maintenant: number): number {
  return Math.floor((debutDeJour(maintenant) - debutDeJour(at)) / 86_400_000)
}

function debutDeJour(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** « 14/03 » / « 14/03 » — jour et mois, sans l'année. */
export function dateCourte(at: number, langue: Langue): string {
  return new Date(at).toLocaleDateString(LOCALE[langue], { day: '2-digit', month: '2-digit' })
}

/** « 21 h 05 » en français, « 21:05 » en anglais. */
export function heureCourte(at: number, langue: Langue): string {
  const brute = new Date(at).toLocaleTimeString(LOCALE[langue], {
    hour: '2-digit',
    minute: '2-digit',
  })
  return langue === 'fr' ? brute.replace(':', ' h ') : brute
}
