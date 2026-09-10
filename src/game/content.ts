import type { CardKey } from './types'

/**
 * Tout le texte de règles de l'app, repris mot pour mot des planches de
 * référence. Un seul endroit : les écrans de règles, l'accueil et l'aide en
 * jeu lisent tous ici, donc le vocabulaire ne peut pas diverger.
 */

export const DECK: { k: CardKey; short: string; long: string }[] = [
  { k: 'frapper', short: 'casse une brique', long: 'Casse une brique chez la cible.' },
  { k: 'bloquer', short: 'annule les frappes', long: 'Annule toutes les frappes sur toi cette manche.' },
  { k: 'reparer', short: 'remets une brique', long: 'Remets une brique. Aucune défense ce tour.' },
  { k: 'pieger', short: 'renvoie la frappe', long: 'Qui te frappe prend le coup à sa place.' },
]

export const CARD_DETAIL: { k: CardKey; effect: string; cost: string; when: string }[] = [
  {
    k: 'frapper',
    effect: 'Casse une brique du mur visé.',
    cost: 'Tu es à découvert : rien ne te protège cette manche.',
    when: 'Quand la cible vient de réparer ou de frapper — elle ne peut pas bloquer deux fois de suite.',
  },
  {
    k: 'bloquer',
    effect: 'Annule toutes les frappes qui te visent cette manche.',
    cost: 'Tu ne gagnes rien et tu perds ton tour d’attaque.',
    when: 'Quand deux joueurs ont Frapper disponible et que ton mur est bas.',
  },
  {
    k: 'reparer',
    effect: 'Remet une brique sur ton mur, jusqu’à cinq maximum.',
    cost: 'Aucune défense : une frappe passe entièrement.',
    when: 'Quand personne n’a intérêt à te viser — ou quand tu penses que tout le monde se bat ailleurs.',
  },
  {
    k: 'pieger',
    effect: 'Qui te frappe cette manche prend le coup à sa place.',
    cost: 'Sans effet si personne ne te frappe : une manche perdue.',
    when: 'Quand tu es le mur le plus bas et que tu sais qu’on va t’achever.',
  },
]

export const TURN_STEPS = [
  {
    n: '1',
    t: 'Choisir',
    d: 'Tout le monde choisit en secret une carte parmi les siennes, et une cible si la carte en demande une. Pas d’ordre de tour, pas d’attente : les quatre choix se font en même temps.',
  },
  {
    n: '2',
    t: 'Révéler',
    d: 'Les quatre cartes se retournent d’un coup. On voit qui a joué quoi et sur qui — c’est le seul moment d’information de la manche.',
  },
  {
    n: '3',
    t: 'Résoudre',
    d: 'Les effets s’appliquent dans un ordre fixe, jamais dans l’ordre des joueurs. Puis chaque carte jouée se verrouille pour la manche suivante.',
  },
]

export const RESOLUTION_ORDER = [
  {
    n: '1',
    t: 'Les blocages se posent',
    d: 'Chaque joueur ayant joué Bloquer devient intouchable pour cette manche.',
  },
  {
    n: '2',
    t: 'Les pièges s’arment',
    d: 'Chaque joueur ayant joué Piéger renverra la première frappe reçue sur son auteur.',
  },
  {
    n: '3',
    t: 'Les frappes partent',
    d: 'Bloqué : la frappe est annulée. Piégé : l’attaquant perd la brique. Sinon : la cible perd la brique.',
  },
  {
    n: '4',
    t: 'Les réparations comptent',
    d: 'Les briques reviennent en dernier — donc une réparation ne sauve jamais d’une frappe de la même manche.',
  },
]

export const EDGE_CASES = [
  {
    t: 'Mur à zéro',
    d: 'Personne n’est éliminé. Un joueur à zéro brique continue de jouer, peut réparer et peut gagner s’il remonte : la partie ne dure que dix manches.',
  },
  {
    t: 'Deux frappes sur le même mur',
    d: 'Elles s’additionnent : deux briques tombent. Un seul Bloquer les annule toutes les deux — c’est la carte la plus rentable quand on est la cible évidente.',
  },
  {
    t: 'Frappe sur un piège, piège sur une frappe',
    d: 'Le piège gagne toujours. Si deux joueurs se frappent mutuellement et que l’un a piégé, seul le piégeur ressort intact.',
  },
  {
    t: 'Réparer un mur plein',
    d: 'La carte est jouable mais ne donne rien. Elle reste utile pour une seule raison : verrouiller Réparer et faire croire à un mur plein.',
  },
  {
    t: 'Égalité à la dixième manche',
    d: 'Les joueurs à égalité jouent une manche de mort subite : Frapper obligatoire, cible libre. Le premier qui perd une brique perd la partie. Comme tout le monde choisit en même temps, l’égalité peut tenir : au bout de trois manches, c’est le mur le plus haut qui l’emporte, puis la place à la table.',
  },
]

/** Les chapitres du sommaire des règles, dans l'ordre de lecture. */
export type ChapitreId = 'but' | 'manche' | 'verrou' | 'cartes' | 'ordre' | 'cas' | 'fin' | 'manches'

export const SOMMAIRE: { id: ChapitreId; t: string; d: string }[] = [
  { id: 'but', t: 'But du jeu', d: 'Dix manches, cinq briques, un mur à garder debout.' },
  { id: 'manche', t: 'Une manche', d: 'Choisir en secret, révéler, résoudre.' },
  { id: 'verrou', t: 'Le verrou', d: 'La carte jouée est interdite au tour suivant.' },
  { id: 'cartes', t: 'Tes quatre cartes', d: 'Frapper, Bloquer, Réparer, Piéger — effet et coût.' },
  { id: 'ordre', t: 'Ordre de résolution', d: 'Blocages, pièges, frappes, réparations.' },
  { id: 'cas', t: 'Cas particuliers', d: 'Mur à zéro, frappes cumulées, égalité…' },
  { id: 'fin', t: 'Fin de partie', d: 'Le mur est le score.' },
  { id: 'manches', t: 'Cartes de manche', d: 'Les neuf cartes des manches 3, 6 et 9.' },
]

/** Le titre de la barre d'en-tête, chapitre par chapitre. */
export const CHAPITRE_TITRE: Record<ChapitreId, string> = {
  but: 'Règles',
  manche: 'Une manche',
  verrou: 'Le verrou',
  cartes: 'Tes cartes',
  ordre: 'Résolution',
  cas: 'Cas particuliers',
  fin: 'Fin de partie',
  manches: 'Cartes de manche',
}
