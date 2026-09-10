import type { CSSProperties, ReactNode } from 'react'
import { R, SAFE_TOP, TEXTE, TITRE } from '../theme'
import { useTheme } from './theme'

/**
 * Le cadre d'un écran. Écran de référence 390 × 844, mais l'app s'étire à la
 * hauteur réelle du téléphone.
 *
 * La zone sûre du haut (44 px, ou l'inset réel du device s'il est plus grand)
 * est réservée : installée en PWA plein écran, l'app passe sous la Dynamic
 * Island et il ne doit rien y avoir.
 */
export function Ecran({
  children,
  bg,
  style,
}: {
  children: ReactNode
  bg?: string
  style?: CSSProperties
}) {
  const t = useTheme()
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        background: bg ?? t.table,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Le corps d'un écran, sous l'en-tête. */
export function Corps({
  children,
  pad = 14,
  gap = 11,
  scroll = false,
  style,
}: {
  children: ReactNode
  pad?: number | string
  gap?: number
  /** Les écrans de lecture (règles, palmarès) défilent ; le tour de jeu, jamais. */
  scroll?: boolean
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        padding: pad,
        display: 'flex',
        flexDirection: 'column',
        gap,
        overflowY: scroll ? 'auto' : 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** La pastille « Retour » : de la matière et un mot, jamais un chevron. */
export function Retour({ onClick, bg, fg }: { onClick?: () => void; bg?: string; fg?: string }) {
  const t = useTheme()
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: bg ?? t.cardOff,
        borderRadius: R.pastille,
        padding: '8px 12px',
        border: 'none',
        font: `600 11px/1 ${TEXTE}`,
        letterSpacing: '0.08em',
        color: fg ?? t.ink2,
        textTransform: 'uppercase',
        cursor: 'pointer',
        flex: '0 0 auto',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      Retour
    </button>
  )
}

/**
 * La barre d'en-tête. Elle monte jusqu'en haut du cadre et absorbe la zone
 * sûre : pas de fausse barre de statut, l'app commence tout de suite.
 */
export function EnTete({
  titre,
  gauche,
  onRetour,
  droite,
  bg,
  fg,
  retourBg,
  retourFg,
  hauteur = 104,
  pad = 18,
}: {
  titre?: ReactNode
  /** Ce qui remplace le titre à gauche : le compteur de manches, par exemple. */
  gauche?: ReactNode
  onRetour?: () => void
  /** Ce qui s'aligne à droite : progression, état, pastille de chapitre… */
  droite?: ReactNode
  bg?: string
  fg?: string
  retourBg?: string
  retourFg?: string
  hauteur?: number
  pad?: number
}) {
  const t = useTheme()
  return (
    <div
      style={{
        flex: `0 0 auto`,
        minHeight: hauteur,
        background: bg ?? t.panel,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: `max(${SAFE_TOP}px, env(safe-area-inset-top)) ${pad}px 0 ${pad}px`,
      }}
    >
      {onRetour && <Retour onClick={onRetour} bg={retourBg} fg={retourFg} />}
      {gauche}
      {titre && (
        <div
          style={{
            font: `700 21px/1 ${TITRE}`,
            color: fg ?? t.ink,
            whiteSpace: 'nowrap',
            flex: '0 0 auto',
          }}
        >
          {titre}
        </div>
      )}
      {droite && <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 9 }}>{droite}</div>}
    </div>
  )
}

/** « Manche 4/10 » — le /10 volontairement en retrait. */
export function CompteurManche({ round, total = 10 }: { round: number; total?: number }) {
  const t = useTheme()
  return (
    <div style={{ font: `700 22px/1 ${TITRE}`, color: t.ink, whiteSpace: 'nowrap', flex: '0 0 auto' }}>
      Manche {round}
      <span style={{ color: t.name === 'etabli' ? '#8A7B63' : t.ink3 }}>/{total}</span>
    </div>
  )
}

/** Les dix pastilles de manche, une par manche jouée. */
export function Jauge({ round, total = 10 }: { round: number; total?: number }) {
  const t = useTheme()
  return (
    <div style={{ display: 'flex', gap: 5 }} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: i < round ? t.wood : t.name === 'etabli' ? '#E0CEAD' : t.edge,
          }}
        />
      ))}
    </div>
  )
}
