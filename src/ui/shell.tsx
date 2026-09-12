import type { CSSProperties, ReactNode } from 'react'
import { BANDEAU_PLANCHE, R, SAFE_TOP, TEXTE, TITRE } from '../theme'
import { useT } from '../i18n'
import { useTheme } from './theme'

/**
 * Le cadre d'un écran. Écran de référence 390 × 844, mais l'app s'étire à la
 * hauteur réelle du téléphone.
 *
 * La zone sûre du haut est réservée quand l'appareil en impose une — une PWA
 * plein écran passe sous la Dynamic Island et il ne doit rien y avoir. Ailleurs
 * elle vaut zéro : voir `SAFE_TOP`.
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
export function Retour({
  onClick,
  bg,
  fg,
  libelle,
}: {
  onClick?: () => void
  bg?: string
  fg?: string
  /** « Quitter » plutôt que « Retour » : sortir d'une partie n'est pas revenir. */
  libelle?: ReactNode
}) {
  const t = useTheme()
  const tr = useT()
  /*
   * Le bouton fait 44 px, la pastille garde sa taille.
   *
   * Peinte, elle mesure 27 px de haut — une cible que le pouce rate. Plutôt
   * que de la grossir, ce qui changerait toutes les barres du haut, le bouton
   * qui la porte est transparent et fait la hauteur réglementaire : l'œil voit
   * la même pastille, le doigt touche une cible de 44 px.
   */
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        minHeight: 44,
        minWidth: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        cursor: 'pointer',
        flex: '0 0 auto',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        style={{
          background: bg ?? t.cardOff,
          borderRadius: R.pastille,
          padding: '8px 12px',
          font: `600 11px/1 ${TEXTE}`,
          letterSpacing: '0.08em',
          color: fg ?? t.ink2,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {libelle ?? tr('commun.retour')}
      </span>
    </button>
  )
}

/**
 * La barre d'en-tête. Elle monte jusqu'en haut du cadre et absorbe la zone
 * sûre : pas de fausse barre de statut, l'app commence tout de suite.
 *
 * `hauteur` est la mesure de la planche, barre d'état comprise. C'est cette
 * bande-là qu'on retranche pour lui substituer la zone sûre réelle, sans quoi
 * l'en-tête porterait sur un écran de bureau une bande vide que rien
 * n'occupe.
 *
 * ## Ce qui cède quand la barre est pleine, et dans quel ordre
 *
 * Quatre blocs incompressibles côte à côte, et la barre débordait — sans le
 * dire, puisque `Ecran` coupe au lieu de défiler : sur la révélation,
 * l'éventail était tranché par le bord droit. Chaque écran le contournait à
 * sa façon (le tour de jeu efface sa pastille de sortie le temps de viser),
 * ce qui traitait le symptôme un cas à la fois.
 *
 * L'ordre des concessions est donc fixé ici, une bonne fois :
 *
 *  1. **La sortie ne cède jamais.** C'est la porte ; une porte à moitié
 *     peinte ne s'ouvre plus, et 44 px est la cible réglementaire.
 *  2. **Ce qui est à droite ne cède qu'à la marge.** Ce sont des gestes —
 *     l'éventail, la pastille de chapitre —, pas du texte. Seule une jauge
 *     qui se donne une base souple (`flex: '0 1 74px'`) y consent.
 *  3. **Le titre et son sous-titre cèdent les premiers**, et s'abrègent
 *     plutôt que de pousser le reste hors de l'écran.
 *
 * Le sous-titre se pose SOUS le titre, et non à côté. « Révélation » plus
 * « manche 2 · tout le monde a joué » sur une ligne réclamaient 305 px là où
 * il en restait 189 : à côté, l'un des deux aurait été abrégé à chaque fois,
 * alors qu'empilés les deux tiennent en entier dans la hauteur déjà réservée.
 */
export function EnTete({
  titre,
  sousTitre,
  gauche,
  onRetour,
  libelleRetour,
  droite,
  bg,
  fg,
  sousTitreFg,
  retourBg,
  retourFg,
  hauteur = 104,
  pad = 18,
}: {
  titre?: ReactNode
  /** La ligne de contexte sous le titre : « manche 2 · tout le monde a joué ». */
  sousTitre?: ReactNode
  /** Ce qui remplace le titre à gauche : le compteur de manches, par exemple. */
  gauche?: ReactNode
  onRetour?: () => void
  /** Le mot de la pastille de gauche, quand « Retour » ne convient pas. */
  libelleRetour?: ReactNode
  /** Ce qui s'aligne à droite : progression, état, pastille de chapitre… */
  droite?: ReactNode
  bg?: string
  fg?: string
  sousTitreFg?: string
  retourBg?: string
  retourFg?: string
  hauteur?: number
  pad?: number
}) {
  const t = useTheme()
  const abrege: CSSProperties = {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }
  return (
    <div
      style={{
        flex: `0 0 auto`,
        minWidth: 0,
        minHeight: `calc(${SAFE_TOP} + ${Math.max(0, hauteur - BANDEAU_PLANCHE)}px)`,
        background: bg ?? t.panel,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: `${SAFE_TOP} ${pad}px 0 ${pad}px`,
      }}
    >
      {onRetour && (
        <Retour onClick={onRetour} bg={retourBg} fg={retourFg} libelle={libelleRetour} />
      )}
      {gauche}
      {(titre || sousTitre) && (
        <div
          style={{
            // Le bloc qui cède : il prend la place qui reste, et la rend quand
            // il n'y en a plus assez pour tout le monde.
            flex: '1 1 auto',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {titre && (
            <div style={{ font: `700 21px/1 ${TITRE}`, color: fg ?? t.ink, ...abrege }}>
              {titre}
            </div>
          )}
          {sousTitre && (
            <div style={{ font: `500 11px/1.2 ${TEXTE}`, color: sousTitreFg ?? t.ink2, ...abrege }}>
              {sousTitre}
            </div>
          )}
        </div>
      )}
      {droite && (
        <div
          style={{
            marginLeft: 'auto',
            minWidth: 0,
            flex: '0 1 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
          }}
        >
          {droite}
        </div>
      )}
    </div>
  )
}

/** « Manche 4/10 » — le /10 volontairement en retrait. */
export function CompteurManche({ round, total = 10 }: { round: number; total?: number }) {
  const t = useTheme()
  const tr = useT()
  return (
    <div style={{ font: `700 22px/1 ${TITRE}`, color: t.ink, whiteSpace: 'nowrap', flex: '0 0 auto' }}>
      {tr('commun.manche', { n: round })}
      <span style={{ color: t.name === 'etabli' ? '#8A7B63' : t.ink3 }}>/{total}</span>
    </div>
  )
}
