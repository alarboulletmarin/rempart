/**
 * La langue de l'app.
 *
 * Deux catalogues, un interpolateur, et un contexte — rien de plus. Pas de
 * chargement asynchrone : les deux langues pèsent quelques dizaines de kilo-
 * octets de texte et l'app doit démarrer hors ligne, donc elles partent dans le
 * paquet plutôt que derrière un `fetch` qui n'aboutirait pas dans le métro.
 *
 * Le traducteur s'obtient de deux façons, et c'est voulu : `useT()` dans un
 * composant, `traducteur(langue)` partout ailleurs — le récit de la révélation
 * et les tests n'ont pas d'arbre React au-dessus d'eux.
 */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en } from './en'
import { fr } from './fr'
import type { Catalogue, Cle, ClePluriel, Params } from './fr.types'
import { LANGUES, LOCALE, categoriePluriel, liste, type Langue } from './format'

export type { Langue } from './format'
export type { Cle, ClePluriel, Params } from './fr.types'

const CATALOGUES: Record<Langue, Catalogue> = { fr, en }

/**
 * Le traducteur.
 *
 * Appelable — `t('accueil.titre')` — et porteur de ce qui dépend de la langue
 * au-delà du mot : le pluriel, l'énumération, l'étiquette de locale. Une seule
 * chose à passer aux fonctions qui fabriquent du texte hors composant.
 */
export interface T {
  (cle: Cle, params?: Params): string
  /** La forme accordée au nombre. `{n}` y est fourni sans avoir à le répéter. */
  n(racine: ClePluriel, n: number, params?: Params): string
  /** « Frapper et Bloquer », dans l'ordre et avec la liaison de la langue. */
  liste(parties: readonly string[]): string
  langue: Langue
  locale: string
}

function remplir(modele: string, params?: Params): string {
  if (!params) return modele
  return modele.replace(/\{(\w+)\}/g, (brut, nom: string) =>
    nom in params ? String(params[nom]) : brut,
  )
}

export function traducteur(langue: Langue): T {
  const catalogue = CATALOGUES[langue]
  const t = ((cle: Cle, params?: Params) =>
    remplir(catalogue[cle] ?? cle, params)) as T
  t.n = (racine, n, params) =>
    remplir(catalogue[`${racine}_${categoriePluriel(n, langue)}` as Cle], { n, ...params })
  t.liste = (parties) => liste(parties, langue)
  t.langue = langue
  t.locale = LOCALE[langue]
  return t
}

/* ----------------------------------------------------------- la préférence */

const KEY = 'rempart:langue'

export type LanguePref = Langue | 'systeme'

/** La langue du navigateur, quand elle est une des nôtres. */
function langueSysteme(): Langue {
  if (typeof navigator === 'undefined') return 'fr'
  for (const etiquette of navigator.languages ?? [navigator.language]) {
    const courte = etiquette?.slice(0, 2).toLowerCase()
    const connue = LANGUES.find((l) => l === courte)
    if (connue) return connue
  }
  // Ni français ni anglais : l'anglais porte plus loin que le français.
  return 'en'
}

/**
 * La préférence de langue, sur le modèle exact de celle du thème : trois
 * états, le troisième suivant le système. Quelqu'un qui change la langue de son
 * téléphone n'a pas à venir la rechanger ici.
 */
export function useLanguePref(): [LanguePref, (p: LanguePref) => void, Langue] {
  const [pref, setPref] = useState<LanguePref>(() => {
    try {
      const v = localStorage.getItem(KEY)
      if (v === 'fr' || v === 'en' || v === 'systeme') return v
    } catch {
      /* stockage indisponible : on suit le système */
    }
    return 'systeme'
  })

  const set = (p: LanguePref) => {
    setPref(p)
    try {
      localStorage.setItem(KEY, p)
    } catch {
      /* rien à faire : la préférence ne survivra pas à la session */
    }
  }

  return [pref, set, pref === 'systeme' ? langueSysteme() : pref]
}

/* -------------------------------------------------------------- le contexte */

const LangueCtx = createContext<T>(traducteur('fr'))

/** Le traducteur courant. Toute chaîne affichée doit venir d'ici. */
export function useT(): T {
  return useContext(LangueCtx)
}

export function LangueProvider({ langue, children }: { langue: Langue; children: ReactNode }) {
  const t = useMemo(() => traducteur(langue), [langue])
  useEffect(() => {
    // L'attribut de la page suit la langue choisie : c'est lui que lisent la
    // synthèse vocale et la coupure de mots, et il ment tant qu'il reste « fr »
    // devant un écran anglais.
    document.documentElement.lang = langue
  }, [langue])
  return <LangueCtx.Provider value={t}>{children}</LangueCtx.Provider>
}

/** Rend un sous-arbre dans une langue imposée — sert à la galerie d'écrans. */
export function LangueScope({ langue, children }: { langue: Langue; children: ReactNode }) {
  const t = useMemo(() => traducteur(langue), [langue])
  return <LangueCtx.Provider value={t}>{children}</LangueCtx.Provider>
}
