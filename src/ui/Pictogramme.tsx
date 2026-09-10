import type { CSSProperties } from 'react'
import type { CardKey } from '../game/types'
import { useTheme } from './theme'

/**
 * Les quatre pictogrammes d'action, dessinés sur mesure.
 *
 * Chaque pictogramme est un petit mur de quatre briques qui montre ce qui
 * arrive au mur : un trou avec le coup qui descend (frapper), une planche
 * posée devant (bloquer), une brique qui revient se remettre (réparer), un
 * coup qui rebondit (piéger). Même matière que le jeu, aucune convention à
 * apprendre — et lisible à 24 px comme à 52.
 *
 * Géométrie reprise trait pour trait de la planche (méthode `picA`).
 */
export function Pictogramme({
  card,
  size = 24,
  color,
  style,
}: {
  card: CardKey
  size?: number
  /** Par défaut l'encre du thème. */
  color?: string
  style?: CSSProperties
}) {
  const t = useTheme()
  const c = color ?? t.ink
  const w = Math.max(1.5, size * 0.085)
  const line = {
    stroke: c,
    strokeWidth: w,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  /** Une brique du petit mur : pleine, ou creuse quand elle manque. */
  const brick = (x: number, y: number, solid: boolean) =>
    solid ? (
      <rect key={`b${x}${y}`} x={x} y={y} width={10} height={5} rx={1.6} fill={c} />
    ) : (
      <rect
        key={`h${x}${y}`}
        x={x + w / 2}
        y={y + w / 2}
        width={10 - w}
        height={5 - w}
        rx={1.4}
        stroke={c}
        strokeWidth={w}
        fill="none"
        opacity={0.55}
      />
    )

  let kids: JSX.Element[]
  if (card === 'frapper') {
    // Un trou dans le mur, et le coup qui descend dessus.
    kids = [
      brick(1.5, 12, true),
      brick(12.5, 12, false),
      brick(1.5, 18.5, true),
      brick(12.5, 18.5, true),
      <path key="c" d="M13.5 3.5 L17.5 8.5 L21.5 3.5" {...line} />,
      <path key="d" d="M6 14.5 L9.5 16.5" {...line} opacity={0.55} />,
    ]
  } else if (card === 'bloquer') {
    // Une planche posée devant le mur intact.
    kids = [
      brick(1.5, 12, true),
      brick(12.5, 12, true),
      brick(1.5, 18.5, true),
      brick(12.5, 18.5, true),
      <rect key="p" x={0.5} y={6.5} width={23} height={3.6} rx={1.6} fill={c} />,
      <path key="l" d="M4 10.5 L4 12" {...line} />,
      <path key="r" d="M20 10.5 L20 12" {...line} />,
    ]
  } else if (card === 'reparer') {
    // Une brique qui revient se remettre dans le trou.
    kids = [
      brick(1.5, 12, true),
      brick(12.5, 12, false),
      brick(1.5, 18.5, true),
      brick(12.5, 18.5, true),
      <rect key="n" x={12.5} y={1.5} width={10} height={5} rx={1.6} fill={c} />,
      <path key="a" d="M17.5 8 L17.5 10.5" {...line} />,
      <path key="h" d="M15.6 8.9 L17.5 10.9 L19.4 8.9" {...line} />,
    ]
  } else {
    // Le coup qui rebondit sur le mur et repart.
    kids = [
      brick(1.5, 12, true),
      brick(12.5, 12, true),
      brick(1.5, 18.5, true),
      brick(12.5, 18.5, true),
      <path key="v" d="M3.5 9 L11.5 2.5 L19.5 9" {...line} />,
      <path key="h" d="M16.6 8.4 L19.8 9.2 L19.2 6" {...line} />,
    ]
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', flex: '0 0 auto', ...style }}
    >
      {kids}
    </svg>
  )
}
