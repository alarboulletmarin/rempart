import type { CSSProperties, ReactNode } from 'react'
import { R, TEXTE, TITRE } from '../theme'
import type { Slot } from '../game/types'
import { useTheme } from './theme'

/* ------------------------------------------------------------- identités */

/**
 * La silhouette d'un joueur. L'identité passe par la FORME autant que par la
 * couleur : aucune information ne dépend jamais de la couleur seule, et les
 * quatre formes restent distinctes en niveaux de gris.
 */
const SHAPES = [
  { radius: '50%', clip: 'none', nom: 'Cercle' },
  { radius: '3px', clip: 'none', nom: 'Carré' },
  { radius: '0', clip: 'polygon(50% 0, 100% 100%, 0 100%)', nom: 'Triangle' },
  { radius: '0', clip: 'polygon(50% 0, 100% 38%, 82% 100%, 18% 100%, 0 38%)', nom: 'Pentagone' },
] as const

export const shapeName = (ci: number) => SHAPES[ci].nom

export function Forme({ ci, size = 20, color }: { ci: number; size?: number; color?: string }) {
  const t = useTheme()
  const s = SHAPES[ci] ?? SHAPES[0]
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
        background: color ?? t.pc[ci as 0 | 1 | 2 | 3],
        borderRadius: s.radius,
        clipPath: s.clip,
      }}
    />
  )
}

/* ------------------------------------------------------------------ murs */

/**
 * Un mur de cinq briques — l'objet emblématique de l'app.
 *
 * Une brique cassée reste en place, creuse et pâle : le mur garde sa largeur,
 * donc la comparaison entre joueurs reste immédiate. Une brique réparée ce
 * tour passe au vert atelier avec son trait clair.
 */
export function Mur({
  wall,
  ci,
  height = 42,
  gap = 6,
  radius = R.brique,
  chant = 5,
}: {
  wall: Slot[]
  ci: number
  height?: number
  gap?: number
  radius?: number
  /** L'épaisseur du chant sombre en bas de brique. */
  chant?: number
}) {
  const t = useTheme()
  const crackW = Math.round(height * 0.38)
  return (
    <div style={{ display: 'flex', gap, height }} aria-hidden="true">
      {wall.map((slot, i) => {
        const fill = slot === 'broken' ? t.off : slot === 'repaired' ? t.green : t.pc[ci as 0]
        const edge = slot === 'broken' ? t.offEdge : slot === 'repaired' ? t.greenEdge : t.pe[ci as 0]
        return (
          <div
            key={i}
            style={{
              flex: 1,
              borderRadius: radius,
              background: fill,
              boxShadow: `inset 0 -${chant}px 0 ${edge}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {slot === 'broken' && (
              // Le trait de fracture : c'est lui qui dit « cassée », pas l'opacité.
              <div
                style={{
                  width: crackW,
                  height: 3,
                  borderRadius: 2,
                  background: t.crack,
                  transform: 'rotate(-24deg)',
                }}
              />
            )}
            {slot === 'repaired' && (
              <div
                style={{ width: crackW - 2, height: 3, borderRadius: 2, background: t.mend }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Le compte de briques, dit en toutes lettres pour les lecteurs d'écran. */
export function MurAccessible({ nom, wall }: { nom: string; wall: Slot[] }) {
  const debout = wall.filter((s) => s !== 'broken').length
  return (
    <span
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
      }}
    >
      {`Mur de ${nom} : ${debout} brique${debout > 1 ? 's' : ''} sur ${wall.length}.`}
    </span>
  )
}

/* --------------------------------------------------------------- matière */

/**
 * Un panneau posé sur la table : de l'épaisseur, jamais de contour.
 * Un chant dur sans flou (0 Npx 0) — aucune ombre floue nulle part.
 */
export function Panneau({
  children,
  bg,
  edge,
  radius = R.panneau,
  pad = 13,
  gap,
  style,
  onClick,
  as = 'div',
  ariaLabel,
  pressed,
}: {
  children?: ReactNode
  bg?: string
  edge?: string | null
  radius?: number
  pad?: number | string
  gap?: number
  style?: CSSProperties
  onClick?: () => void
  as?: 'div' | 'button'
  ariaLabel?: string
  pressed?: boolean
}) {
  const t = useTheme()
  const background = bg ?? t.panel
  const chant = edge === null ? undefined : `0 3px 0 ${edge ?? t.edge}`
  const common: CSSProperties = {
    background,
    borderRadius: radius,
    padding: pad,
    boxShadow: chant,
    display: 'flex',
    flexDirection: 'column',
    gap,
    ...style,
  }
  if (as === 'button' || onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        aria-pressed={pressed}
        style={{
          ...common,
          border: 'none',
          font: 'inherit',
          color: 'inherit',
          textAlign: 'left',
          cursor: onClick ? 'pointer' : 'default',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {children}
      </button>
    )
  }
  return <div style={common}>{children}</div>
}

/**
 * Le panneau à pleine encre — le code du salon, le verrou, la fin de partie.
 * En veillée, l'encre du thème clair deviendrait invisible sur le bois brûlé :
 * le panneau prend alors le carton du dessus plutôt que le fond.
 */
export function usePanneauEncre() {
  const t = useTheme()
  const clair = t.name === 'etabli'
  return {
    bg: clair ? t.ink : t.panel2,
    edge: clair ? '#170F06' : t.edge,
    fg: clair ? t.panel : t.ink,
    sub: clair ? '#C0AE93' : t.ink2,
    /** Le fond d'un encart posé dans ce panneau. */
    inner: clair ? '#3A2E1F' : t.edge,
    detail: clair ? t.table : t.ink2,
  }
}

/** Une pastille : un mot et de la matière, jamais un glyphe de police. */
export function Pastille({
  children,
  bg,
  fg,
  style,
}: {
  children: ReactNode
  bg?: string
  fg?: string
  style?: CSSProperties
}) {
  const t = useTheme()
  return (
    <span
      style={{
        background: bg ?? t.panel2,
        color: fg ?? t.ink2,
        borderRadius: R.pilule,
        padding: '4px 9px',
        font: `600 10px/1 ${TEXTE}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

/** L'étiquette en capitales espacées : états et libellés, 10–15 px. */
export function Etiquette({
  children,
  color,
  size = 11,
  style,
}: {
  children: ReactNode
  color?: string
  size?: number
  style?: CSSProperties
}) {
  const t = useTheme()
  return (
    <div
      style={{
        font: `600 ${size}px/1 ${TEXTE}`,
        letterSpacing: '0.12em',
        color: color ?? t.ink2,
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Titre({
  children,
  size = 21,
  color,
  style,
}: {
  children: ReactNode
  size?: number
  color?: string
  style?: CSSProperties
}) {
  const t = useTheme()
  return (
    <div style={{ font: `700 ${size}px/1.05 ${TITRE}`, color: color ?? t.ink, ...style }}>
      {children}
    </div>
  )
}

export function Texte({
  children,
  size = 13,
  weight = 500,
  color,
  style,
}: {
  children: ReactNode
  size?: number
  weight?: number
  color?: string
  style?: CSSProperties
}) {
  const t = useTheme()
  return (
    <div
      style={{
        font: `${weight} ${size}px/1.45 ${TEXTE}`,
        color: color ?? t.ink2,
        textWrap: 'pretty',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------- boutons */

export type BoutonTon = 'clay' | 'ink' | 'panel' | 'creux'

/**
 * Un bouton est une pièce posée : un aplat, un chant, un libellé.
 * Aucune flèche, aucun glyphe — le libellé suffit.
 */
export function Bouton({
  children,
  onClick,
  ton = 'clay',
  height = 66,
  size = 21,
  note,
  disabled,
  style,
}: {
  children: ReactNode
  onClick?: () => void
  ton?: BoutonTon
  height?: number
  size?: number
  /** Une précision en capitales, à droite. */
  note?: ReactNode
  disabled?: boolean
  style?: CSSProperties
}) {
  const t = useTheme()
  const skin: Record<BoutonTon, { bg: string; fg: string; edge: string | null; note: string }> = {
    clay: { bg: t.clayText, fg: t.panel, edge: t.clayTextEdge, note: t.panel },
    ink: { bg: t.selBg, fg: t.selFg, edge: t.selEdge, note: t.ink2 },
    panel: { bg: t.panel, fg: t.ink, edge: t.edge, note: t.ink2 },
    creux: { bg: t.cardOff, fg: t.ink2, edge: null, note: t.ink2 },
  }
  const s = skin[ton]
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height,
        minHeight: height,
        borderRadius: R.panneau,
        background: s.bg,
        boxShadow: s.edge ? `0 ${ton === 'creux' ? 3 : 5}px 0 ${s.edge}` : undefined,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: note ? 'flex-start' : 'center',
        gap: 12,
        padding: note ? '0 20px' : '0 16px',
        font: `700 ${size}px/1 ${TITRE}`,
        color: s.fg,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
    >
      <span>{children}</span>
      {note && (
        <span
          style={{
            font: `600 11px/1 ${TEXTE}`,
            letterSpacing: '0.1em',
            color: s.note,
            textTransform: 'uppercase',
            marginLeft: 'auto',
          }}
        >
          {note}
        </span>
      )}
    </button>
  )
}

/** Le bouton bas de page en carton creux : « Règles », « Palmarès », « Réglages ». */
export function BoutonCreux({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  const t = useTheme()
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        height: 54,
        borderRadius: 16,
        background: t.cardOff,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: `600 12px/1 ${TEXTE}`,
        letterSpacing: '0.06em',
        color: t.ink2,
        textTransform: 'uppercase',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  )
}

/** Un gribouillage : une seule encre, toujours derrière le texte, jamais en jeu. */
export function Scribble({
  nom,
  width,
  height,
  style,
}: {
  nom: 'wait' | 'burst' | 'burst-clay' | 'pause' | 'arrow'
  width: number
  height: number
  style?: CSSProperties
}) {
  return (
    <img
      src={`assets/scribble-${nom}.svg`}
      alt=""
      aria-hidden="true"
      style={{ width, height, flex: `0 0 ${width}px`, objectFit: 'contain', display: 'block', ...style }}
    />
  )
}
