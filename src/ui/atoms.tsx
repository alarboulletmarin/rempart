import { Fragment, useId, type CSSProperties, type ReactNode } from 'react'
import { R, TEXTE, TITRE } from '../theme'
import type { CardKey, Slot } from '../game/types'
import { useT, type Cle } from '../i18n'
import { DUREE, anime, useMouvement } from './mouvement'
import { useTheme } from './theme'

/* ------------------------------------------------------------- identités */

/**
 * La silhouette d'un joueur. L'identité passe par la FORME autant que par la
 * couleur : aucune information ne dépend jamais de la couleur seule, et les
 * quatre formes restent distinctes en niveaux de gris.
 */
const SHAPES = [
  { radius: '50%', clip: 'none' },
  { radius: '3px', clip: 'none' },
  { radius: '0', clip: 'polygon(50% 0, 100% 100%, 0 100%)' },
  { radius: '0', clip: 'polygon(50% 0, 100% 38%, 82% 100%, 18% 100%, 0 38%)' },
] as const

/** Le nom d'une forme, dans la langue de qui lit. */
export function useShapeName(): (ci: number) => string {
  const tr = useT()
  return (ci) => tr(`forme.${Math.min(3, Math.max(0, ci))}` as Cle)
}

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
  tombees,
  avant,
  sens = 1,
  delai = 0,
}: {
  wall: Slot[]
  ci: number
  height?: number
  gap?: number
  radius?: number
  /** L'épaisseur du chant sombre en bas de brique. */
  chant?: number
  /**
   * Les emplacements dont la brique vient d'être cassée : elle tombe.
   *
   * Le mur rendu est déjà celui d'après — l'emplacement est creux, et la
   * brique qui bascule par-dessus n'est qu'un calque. À la fin de sa chute il
   * ne reste donc rien à remettre en place, et une animation interrompue ne
   * laisse pas un mur faux à l'écran.
   */
  tombees?: readonly number[]
  /** Le mur d'avant : il donne sa matière à la brique qui tombe. */
  avant?: Slot[]
  /** Le sens de la chute — du côté opposé à celui d'où le coup est venu. */
  sens?: 1 | -1
  /** Le temps qu'on laisse à la carte de se retourner avant que ça tombe. */
  delai?: number
}) {
  const t = useTheme()
  const crackW = Math.round(height * 0.38)
  const bouge = useMouvement()
  return (
    <div style={{ display: 'flex', gap, height }} aria-hidden="true">
      {wall.map((slot, i) => {
        const fill = slot === 'broken' ? t.off : slot === 'repaired' ? t.green : t.pc[ci as 0]
        const edge = slot === 'broken' ? t.offEdge : slot === 'repaired' ? t.greenEdge : t.pe[ci as 0]
        const tombe = bouge && tombees?.includes(i)
        const avantSlot = avant?.[i] ?? 'intact'
        return (
          <div
            key={i}
            style={{
              position: 'relative',
              flex: 1,
              borderRadius: radius,
              background: fill,
              boxShadow: `inset 0 -${chant}px 0 ${edge}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {tombe && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: radius,
                  background: avantSlot === 'repaired' ? t.green : t.pc[ci as 0],
                  boxShadow: `inset 0 -${chant}px 0 ${avantSlot === 'repaired' ? t.greenEdge : t.pe[ci as 0]}`,
                  animation: anime(
                    bouge,
                    sens > 0 ? 'rempart-chute-d' : 'rempart-chute-g',
                    DUREE.chute,
                    { delai, courbe: 'cubic-bezier(.5,0,.9,.45)' },
                  ),
                }}
              />
            )}
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

/**
 * Ce que dit une ligne de joueur à qui ne voit pas l'écran : son mur, et sa
 * contrainte de la manche.
 *
 * Les deux dans la même phrase et sous le même nom. Séparés, la pastille de
 * contrainte s'annonçait « Interdit : Frapper » sans dire de qui — trois fois
 * de suite, sur trois lignes, sans moyen de les rattacher à quelqu'un.
 */
export function LigneAccessible({
  nom,
  wall,
  locked,
}: {
  nom: string
  wall: Slot[]
  /** Absente quand la ligne ne montre pas de contrainte (la révélation). */
  locked?: CardKey[]
}) {
  const tr = useT()
  const debout = wall.filter((s) => s !== 'broken').length
  const mur = tr.n('mur.aria', debout, { nom, total: wall.length })
  const contrainte = !locked
    ? ''
    : locked.length === 0
      ? tr('jeu.contrainte.aria.libre', { nom })
      : tr('jeu.contrainte.aria.interdit', {
          nom,
          cartes: tr.liste(locked.map((k) => tr(`carte.${k}` as const))),
        })
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
      {contrainte ? `${mur} ${contrainte}` : mur}
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
  'aria-hidden': ariaHidden,
}: {
  children: ReactNode
  bg?: string
  fg?: string
  style?: CSSProperties
  /** La pastille double une phrase déjà dite ailleurs pour les lecteurs d'écran. */
  'aria-hidden'?: boolean | 'true' | 'false'
}) {
  const t = useTheme()
  return (
    <span
      aria-hidden={ariaHidden}
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
  id,
  as: Balise = 'div',
  className,
}: {
  children: ReactNode
  color?: string
  size?: number
  style?: CSSProperties
  /** Pour qu'un groupe de boutons radio puisse nommer son titre de section. */
  id?: string
  /**
   * `legend` quand l'étiquette EST le nom d'un `fieldset`.
   *
   * L'en-tête visible sert alors de nom au groupe, plutôt qu'une légende
   * masquée qui redirait le même mot à qui écoute.
   */
  as?: 'div' | 'legend'
  className?: string
}) {
  const t = useTheme()
  return (
    <Balise
      id={id}
      className={className}
      style={{
        font: `600 ${size}px/1 ${TEXTE}`,
        letterSpacing: '0.12em',
        color: color ?? t.ink2,
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </Balise>
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

/* ------------------------------------------------------- choix segmenté */

/**
 * Un contrôle segmenté : un choix qui s'explique tout seul, sur une ligne.
 *
 * Pour un réglage dont les libellés suffisent — `Français` n'a pas besoin
 * qu'on précise que le jeu sera en français. Trois cartes plein format avec
 * description mangeaient un tiers de l'écran pour un choix fait une fois.
 *
 * Ce n'est **pas** un `<select>` natif : sur iOS il ouvre une roue plein
 * écran, avec un tap de plus et une validation, et il ne se style pas. Ce
 * n'est pas non plus une rangée de `<button>` : de vrais radios donnent la
 * navigation aux flèches et l'annonce « 2 sur 3 » sans une ligne à écrire.
 *
 * Le dessin vit dans `.rempart-segmente` (`global.css`) — les sélecteurs
 * `:checked` et `:focus-visible` ne s'écrivent pas en style en ligne.
 */
export function Segmente<V extends string>({
  nom,
  legende,
  options,
  valeur,
  onValeur,
  note,
}: {
  /** Le `name` commun : c'est lui qui fait le groupe, et donc la navigation. */
  nom: string
  /**
   * L'en-tête visible, rendu en `<legend>` par l'appelant.
   *
   * Il sert de nom au groupe : une légende masquée en plus aurait redit le
   * même mot à qui écoute.
   */
  legende: ReactNode
  /**
   * QUATRE segments au maximum.
   *
   * Au-delà, les libellés passent sur deux lignes et le contrôle cesse de se
   * lire d'un coup d'œil : il faudra alors une ligne qui ouvre une feuille de
   * sélection, et non un cinquième segment. Rien à changer ici pour passer de
   * trois à quatre — les colonnes se déduisent du nombre d'options.
   */
  options: readonly { valeur: V; libelle: string; langue?: string }[]
  valeur: V
  onValeur: (v: V) => void
  /** La ligne sous le contrôle : l'effet réel du choix, et rien de plus. */
  note?: ReactNode
}) {
  const t = useTheme()
  const prefixe = useId()
  return (
    <fieldset className="rempart-groupe">
      {legende}
      <div
        className="rempart-segmente"
        style={
          {
            '--seg-piste': t.panel2,
            '--seg-creux': t.edge,
            '--seg-encre': t.ink2,
            '--seg-choix': t.choix,
            '--seg-choix-encre': t.choixInk,
            '--choix-police': TEXTE,
            '--choix-focus': t.choix,
          } as CSSProperties
        }
      >
        {options.map((o) => {
          const id = `${prefixe}-${nom}-${o.valeur}`
          return (
            <Fragment key={o.valeur}>
              <input
                type="radio"
                id={id}
                name={nom}
                value={o.valeur}
                checked={o.valeur === valeur}
                onChange={() => onValeur(o.valeur)}
              />
              <label htmlFor={id} lang={o.langue}>
                {o.libelle}
              </label>
            </Fragment>
          )
        })}
      </div>
      {note && (
        <div
          style={{
            font: `500 12px/1.4 ${TEXTE}`,
            color: t.ink2,
            marginTop: 8,
            textWrap: 'pretty',
          }}
        >
          {note}
        </div>
      )}
    </fieldset>
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
