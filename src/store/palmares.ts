/**
 * Le palmarès — tout est gardé sur l'appareil. Aucun compte, aucun envoi.
 *
 * Sans compte ni serveur, le palmarès est forcément local : les stats d'un
 * même joueur ne suivent pas d'un téléphone à l'autre, et les noms sont ceux
 * saisis dans les salons. C'est dit à l'écran, ce n'est pas une surprise.
 */
import type { CardKey, Format, Slot } from '../game/types'

const KEY = 'rempart:palmares'
/** Trois dernières parties à l'écran ; on en garde un peu plus pour les compteurs. */
const MAX_PARTIES = 30

export interface PartieEnregistree {
  /** Horodatage de fin de partie. */
  at: number
  format: Format
  joueurs: number
  /** Le nom du gagnant, ou les deux noms de l'équipe gagnante. */
  gagnant: string
  /** Le mur final de celui qui tient ce téléphone. */
  monMur: Slot[]
  mesBriques: number
  /** Le nom sous lequel il a joué. */
  monNom: string
  gagnee: boolean
  /** Les noms de tous les joueurs, pour le classement des habitués. */
  noms: string[]
  /** Le nom du gagnant tel qu'il apparaît dans `noms`. */
  gagnants: string[]
}

export interface Palmares {
  parties: PartieEnregistree[]
  /** Combien de fois j'ai joué chaque carte, toutes parties confondues. */
  cartes: Record<CardKey, number>
}

const VIDE: Palmares = {
  parties: [],
  cartes: { frapper: 0, bloquer: 0, reparer: 0, pieger: 0 },
}

export function lire(): Palmares {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return VIDE
    const p = JSON.parse(raw) as Palmares
    return {
      parties: Array.isArray(p.parties) ? p.parties : [],
      cartes: { ...VIDE.cartes, ...(p.cartes ?? {}) },
    }
  } catch {
    // Navigation privée, stockage bloqué, données corrompues : on repart à vide
    // plutôt que d'empêcher de jouer.
    return VIDE
  }
}

function ecrire(p: Palmares): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* le palmarès ne sera pas gardé, le jeu continue */
  }
}

export function enregistrerPartie(partie: PartieEnregistree): Palmares {
  const p = lire()
  const next: Palmares = {
    ...p,
    parties: [partie, ...p.parties].slice(0, MAX_PARTIES),
  }
  ecrire(next)
  return next
}

/** Compte une carte jouée, au moment où la manche est résolue. */
export function compterCarte(card: CardKey): void {
  const p = lire()
  ecrire({ ...p, cartes: { ...p.cartes, [card]: (p.cartes[card] ?? 0) + 1 } })
}

export function effacer(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* rien à faire */
  }
}

/* ------------------------------------------------------------- dérivés */

export interface LigneJoueurPalmares {
  nom: string
  victoires: number
  parties: number
  /** Largeur de la barre, en pourcentage du meilleur score. */
  w: string
  line: string
}

/** Le classement des joueurs récurrents, tel qu'il s'affiche. */
export function classement(p: Palmares): LigneJoueurPalmares[] {
  const stats = new Map<string, { v: number; n: number }>()
  for (const partie of p.parties) {
    for (const nom of partie.noms) {
      const s = stats.get(nom) ?? { v: 0, n: 0 }
      s.n++
      if (partie.gagnants.includes(nom)) s.v++
      stats.set(nom, s)
    }
  }
  const rows = [...stats.entries()]
    .map(([nom, s]) => ({ nom, victoires: s.v, parties: s.n }))
    .sort((a, b) => b.victoires - a.victoires || b.parties - a.parties)
    .slice(0, 4)
  const max = rows.length > 0 ? Math.max(1, ...rows.map((r) => r.victoires)) : 1
  return rows.map((r) => ({
    ...r,
    w: `${Math.round((r.victoires / max) * 100)}%`,
    line: `${r.victoires} victoire${r.victoires > 1 ? 's' : ''} · ${r.parties} partie${r.parties > 1 ? 's' : ''}`,
  }))
}

/** La répartition de mes quatre cartes, en pourcentage. */
export function repartitionCartes(p: Palmares): { k: CardKey; pct: string; w: string }[] {
  const keys: CardKey[] = ['frapper', 'bloquer', 'reparer', 'pieger']
  const total = keys.reduce((n, k) => n + (p.cartes[k] ?? 0), 0)
  return keys.map((k) => {
    const pct = total === 0 ? 0 : Math.round(((p.cartes[k] ?? 0) / total) * 100)
    return { k, pct: `${pct} %`, w: `${pct}%` }
  })
}

export function totaux(p: Palmares): { parties: number; victoires: number; briques: number } {
  return {
    parties: p.parties.length,
    victoires: p.parties.filter((x) => x.gagnee).length,
    briques: p.parties.reduce((n, x) => n + x.mesBriques, 0),
  }
}

/** « hier soir », « il y a 3 jours » — la date telle qu'on la dit. */
export function quand(at: number, maintenant = Date.now()): string {
  const jours = Math.floor((startOfDay(maintenant) - startOfDay(at)) / 86_400_000)
  const heure = new Date(at).getHours()
  const moment = heure >= 18 ? 'soir' : heure >= 12 ? 'après-midi' : 'matin'
  if (jours === 0) return `ce ${moment}`
  if (jours === 1) return moment === 'matin' ? 'hier matin' : `hier ${moment}`
  if (jours < 7) return `il y a ${jours} jours`
  return new Date(at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function startOfDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** La ligne datée des « Dernières parties ». */
export function dateEtFormat(partie: PartieEnregistree): string {
  const d = new Date(partie.at)
  const date = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ' h ')
  const format =
    partie.format === 'equipes' ? 'Équipes 2 v 2' : `Chacun pour soi · ${partie.joueurs} j`
  return `${date} · ${heure} · ${format}`
}
