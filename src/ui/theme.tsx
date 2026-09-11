import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { THEMES, type Theme, type ThemeName } from '../theme'

const ThemeCtx = createContext<Theme>(THEMES.etabli)

/** Le thème courant. Toute couleur affichée doit venir d'ici. */
export function useTheme(): Theme {
  return useContext(ThemeCtx)
}

const KEY = 'rempart:theme'

export type ThemePref = ThemeName | 'systeme'

function systemTheme(): ThemeName {
  if (typeof window === 'undefined' || !window.matchMedia) return 'etabli'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'veillee' : 'etabli'
}

export function useThemePref(): [ThemePref, (p: ThemePref) => void, ThemeName] {
  const [pref, setPref] = useState<ThemePref>(() => {
    try {
      const v = localStorage.getItem(KEY)
      if (v === 'etabli' || v === 'veillee' || v === 'systeme') return v
    } catch {
      /* stockage indisponible : on reste sur le thème du système */
    }
    return 'systeme'
  })
  const [sys, setSys] = useState<ThemeName>(systemTheme)

  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSys(mq.matches ? 'veillee' : 'etabli')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const set = (p: ThemePref) => {
    setPref(p)
    try {
      localStorage.setItem(KEY, p)
    } catch {
      /* rien à faire : la préférence ne survivra pas à la session */
    }
  }

  return [pref, set, pref === 'systeme' ? sys : pref]
}

export function ThemeProvider({ name, children }: { name: ThemeName; children: ReactNode }) {
  const theme = useMemo(() => THEMES[name], [name])
  useEffect(() => {
    document.body.style.background = theme.table
    document.body.style.color = theme.ink
  }, [theme])
  return <ThemeCtx.Provider value={theme}>{children}</ThemeCtx.Provider>
}

/** Rend un sous-arbre dans un thème imposé — sert à la galerie d'écrans. */
export function ThemeScope({ name, children }: { name: ThemeName; children: ReactNode }) {
  return <ThemeCtx.Provider value={THEMES[name]}>{children}</ThemeCtx.Provider>
}
