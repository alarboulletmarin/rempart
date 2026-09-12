import type { CSSProperties } from 'react'
import { useTheme } from './theme'

/**
 * Les icônes qui ne sont pas des cartes.
 *
 * Même atelier que `Pictogramme` — même grille de 24, mêmes traits à bouts
 * ronds, même épaisseur proportionnelle — mais elles ne disent pas une action
 * de jeu : elles disent un état de l'interface. Dessinées plutôt que prises à
 * une police d'icônes ou à un emoji, pour la même raison que le reste du jeu :
 * un glyphe système ne se rend pas pareil d'un téléphone à l'autre, et il
 * n'aurait pas la matière des briques.
 *
 * Elles sont toujours `aria-hidden` : ce qu'elles montrent est écrit à côté.
 */
export type NomIcone = 'cadenas'

export function Icone({
  nom,
  size = 24,
  color,
  style,
}: {
  nom: NomIcone
  size?: number
  color?: string
  style?: CSSProperties
}) {
  const t = useTheme()
  const c = color ?? t.ink
  const w = Math.max(1.5, size * 0.095)

  /*
   * Le cadenas : un corps plein à l'échelle d'une brique, et l'anse posée
   * dessus. Il reprend la proportion des briques des pictogrammes (10 × 5)
   * pour que la main, où il se pose à côté d'elles, reste d'une seule matière.
   */
  const kids =
    nom === 'cadenas' ? (
      <>
        <rect x={4} y={10.5} width={16} height={11.5} rx={2.6} fill={c} />
        <path
          d="M7.5 10.5 V7.5 a4.5 4.5 0 0 1 9 0 V10.5"
          stroke={c}
          strokeWidth={w}
          fill="none"
          strokeLinecap="round"
        />
        {/* Le trou de serrure, creusé dans le corps plutôt que posé dessus :
            il reste lisible quand l'icône descend à 14 px. */}
        <circle cx={12} cy={15.2} r={1.9} fill={t.panel} />
        <rect x={11.1} y={15.2} width={1.8} height={4} rx={0.9} fill={t.panel} />
      </>
    ) : null

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
