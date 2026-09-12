/**
 * Les types tirés du catalogue français.
 *
 * Dans leur propre fichier pour que `en.ts` puisse se typer sur `fr` sans
 * l'importer : deux catalogues qui s'importent l'un l'autre feraient une
 * boucle, et la charger pour son type seul embarquerait le français dans le
 * paquet de qui joue en anglais.
 */

import type { fr } from './fr'

/** Toutes les clés du catalogue. */
export type Cle = keyof typeof fr

/** Un catalogue complet : toutes les clés, aucune de plus. */
export type Catalogue = Record<Cle, string>

/* Le paramètre est nu, donc le type conditionnel se distribue sur l'union des
   clés — sans cela il ne testerait que l'union entière, qui n'est le suffixe
   de rien. */
type Racine<K, Suffixe extends string> = K extends `${infer R}${Suffixe}` ? R : never

/**
 * Les clés à pluriel, sans leur suffixe.
 *
 * L'intersection des deux formes : une paire incomplète — un `_autre` sans son
 * `_un` — n'ouvre aucune clé de pluriel, et le premier appel qui l'utilise ne
 * compile pas. Ajouter la paire au catalogue suffit à la rendre disponible,
 * sans liste à tenir à jour ailleurs.
 */
export type ClePluriel = Racine<Cle, '_un'> & Racine<Cle, '_autre'>

export type Params = Record<string, string | number>
