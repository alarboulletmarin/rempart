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
export type NomIcone =
  | 'cadenas'
  /** Le bouton qui ouvre l'éventail : une bulle, comme celles qui en sortent. */
  | 'reaction'
  /** La croix qui referme une feuille. */
  | 'fermer'
  /** La coche d'un choix retenu. */
  | 'coche'
  /* Les six réactions. Dessinées et non empruntées à une police d'emoji : un
     emoji ne se rend pas pareil d'un téléphone à l'autre, il n'a pas la
     matière du reste du jeu, et il ne dit rien à qui ne le voit pas. Chacune
     porte son mot juste à côté, donc le dessin n'a pas à tout faire. */
  | 'rire'
  | 'aie'
  | 'bravo'
  | 'bienJoue'
  | 'grr'
  | 'pitie'

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
  // Un peu plus fin que les pictogrammes de carte : ces icônes portent des
  // traits qui se croisent, et l'épaisseur les soude.
  const w = Math.max(1.4, size * 0.08)

  const trait = {
    stroke: c,
    strokeWidth: w,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  /*
   * Le cadenas : un corps plein à l'échelle d'une brique, et l'anse posée
   * dessus. Il reprend la proportion des briques des pictogrammes (10 × 5)
   * pour que la main, où il se pose à côté d'elles, reste d'une seule matière.
   */
  const dessins: Record<NomIcone, JSX.Element> = {
    cadenas: (
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
    ),

    /* Une bulle qui sort de la table, avec les trois points du dos de carte. */
    reaction: (
      <>
        <path
          d="M3.5 7.5 a3 3 0 0 1 3-3 h11 a3 3 0 0 1 3 3 v6 a3 3 0 0 1-3 3 H10 l-4.5 3.5 v-3.5 a2 2 0 0 1-2-2 Z"
          {...trait}
        />
        <circle cx={8} cy={10.5} r={1.35} fill={c} />
        <circle cx={12} cy={10.5} r={1.35} fill={c} />
        <circle cx={16} cy={10.5} r={1.35} fill={c} />
      </>
    ),

    /* La coche d'un réglage retenu : la même que « bien joué », sans son
       emphase — elle confirme, elle ne félicite pas. */
    coche: <path d="M5 12.5 L9.8 17.5 L19 7" {...trait} strokeWidth={w * 1.25} />,

    /* La croix : deux traits, à la même épaisseur que le reste. */
    fermer: (
      <>
        <path d="M6.5 6.5 L17.5 17.5" {...trait} strokeWidth={w * 1.3} />
        <path d="M17.5 6.5 L6.5 17.5" {...trait} strokeWidth={w * 1.3} />
      </>
    ),

    /* Rire : deux yeux plissés, haut, et une bouche large plus bas. Les trois
       traits se touchaient : à 44 px l'ensemble se lisait comme une bouche. */
    rire: (
      <>
        {/* Des yeux pleins plutôt que deux arcs : à pleine taille, le trait
            des arcs les soudait en une lèvre au-dessus de la bouche. */}
        <circle cx={8.2} cy={8.6} r={1.6} fill={c} />
        <circle cx={15.8} cy={8.6} r={1.6} fill={c} />
        <path d="M5 13.6 Q12 20.4 19 13.6" {...trait} />
      </>
    ),

    /* Aïe : le trait de fracture d'une brique cassée, en grand. */
    aie: <path d="M14.5 2.5 L7.5 12.5 H11.5 L9.5 21.5 L17 10.5 H12.8 Z" fill={c} />,

    /* Bravo : l'éclat, rayons longs et courts alternés — les mêmes que le
       gribouillage de victoire. Réguliers et centrés sur un disque, ils
       faisaient une fleur. */
    bravo: (
      <>
        <path d="M12.0 8.4 L12.0 1.5" {...trait} />
        <path d="M14.3 9.7 L17.2 6.8" {...trait} />
        <path d="M15.6 12.0 L22.5 12.0" {...trait} />
        <path d="M14.3 14.3 L17.2 17.2" {...trait} />
        <path d="M12.0 15.6 L12.0 22.5" {...trait} />
        <path d="M9.7 14.3 L6.8 17.2" {...trait} />
        <path d="M8.4 12.0 L1.5 12.0" {...trait} />
        <path d="M9.7 9.7 L6.8 6.8" {...trait} />
      </>
    ),

    /* Bien joué : la coche, franche. */
    bienJoue: <path d="M4.5 12.5 L9.5 18 L19.5 6.5" {...trait} strokeWidth={w * 1.5} />,

    /* Grr : deux sourcils qui tombent vers le milieu, et une bouche qui
       tombe avec eux. Une bouche droite disparaissait entre les deux. */
    grr: (
      <>
        <path d="M5 7 L10 10" {...trait} />
        <path d="M19 7 L14 10" {...trait} />
        <path d="M6.5 19 Q12 14 17.5 19" {...trait} />
      </>
    ),

    /* Pitié : le drapeau qu'on agite — on se rend, on demande grâce. */
    pitie: (
      <>
        <path d="M6.5 3.5 V21" {...trait} />
        <path d="M6.5 5 L18.5 8.5 L6.5 12 Z" fill={c} stroke={c} strokeWidth={w} strokeLinejoin="round" />
      </>
    ),
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
      {dessins[nom]}
    </svg>
  )
}
