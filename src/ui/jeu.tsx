import type { ReactNode } from 'react'
import { R, TEXTE, TITRE } from '../theme'
import { CARD_LABEL, type CardKey, type Player, type Slot } from '../game/types'
import { Pictogramme } from './Pictogramme'
import { Etiquette, Forme, Mur, MurAccessible, Pastille } from './atoms'
import { DUREE, anime, useMouvement } from './mouvement'
import { useTheme } from './theme'

/**
 * L'état d'une carte en main. Trois mots, et ils sont les mêmes partout dans
 * l'app : sur l'accueil, dans les règles, sur l'écran de jeu.
 */
export type EtatCarte = 'choisie' | 'jouable' | 'interdite'

/**
 * Une carte de la main.
 *
 * Une carte interdite n'est ni rayée ni estompée : elle est posée sur un
 * carton plus pâle, à pleine encre, avec la mention « interdite ». Un état se
 * lit à la matière, jamais à l'opacité.
 */
export function CarteMain({
  card,
  etat,
  onClick,
  height = 126,
  fremis,
}: {
  card: CardKey
  etat: EtatCarte
  onClick?: () => void
  height?: number
  /**
   * La carte posée frémit tant qu'on attend les autres.
   *
   * C'est la seule boucle de l'app, et elle dit quelque chose qu'aucun texte
   * ne disait aussi vite : « c'est parti, on attend ». Elle s'arrête à la
   * seconde où la table est complète — une boucle qui ne s'arrête jamais
   * cesse d'être une information et devient du décor.
   */
  fremis?: boolean
}) {
  const t = useTheme()
  const bouge = useMouvement()
  const choisie = etat === 'choisie'
  const interdite = etat === 'interdite'
  const bg = choisie ? t.selBg : interdite ? t.cardOff : t.cardBg
  const edge = choisie ? t.selEdge : interdite ? t.cardOffEdge : t.cardEdge
  const fg = choisie ? t.selFg : interdite ? t.ink2 : t.ink
  const pictoColor = choisie ? t.selFg : interdite ? t.ink3 : t.ink

  return (
    <button
      type="button"
      onClick={interdite ? undefined : onClick}
      disabled={interdite}
      aria-pressed={choisie}
      aria-label={`${CARD_LABEL[card]} — ${etat}`}
      style={{
        flex: 1,
        minWidth: 0,
        height,
        borderRadius: R.carte,
        background: bg,
        boxShadow: `0 4px 0 ${edge}`,
        border: 'none',
        padding: '14px 6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: interdite ? 'default' : 'pointer',
        WebkitTapHighlightColor: 'transparent',
        animation: fremis
          ? anime(bouge, 'rempart-fremis', DUREE.fremis, { courbe: 'ease-in-out', boucle: true })
          : undefined,
      }}
    >
      <Pictogramme card={card} size={40} color={pictoColor} />
      <span style={{ font: `700 13px/1 ${TITRE}`, color: fg }}>{CARD_LABEL[card]}</span>
      <span
        style={{
          font: `500 9px/1.2 ${TEXTE}`,
          color: choisie ? t.selFg : t.ink2,
          textAlign: 'center',
        }}
      >
        {etat}
      </span>
    </button>
  )
}

/** La main complète : quatre cartes, une seule geste possible à la fois. */
export function Main({
  cards,
  etat,
  onPick,
  height,
  fremis,
}: {
  cards: readonly CardKey[]
  etat: (c: CardKey) => EtatCarte
  onPick?: (c: CardKey) => void
  height?: number
  /** La carte posée frémit : le choix est parti, on attend les autres. */
  fremis?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: 9 }}>
      {cards.map((c) => (
        <CarteMain
          key={c}
          card={c}
          etat={etat(c)}
          height={height}
          fremis={fremis && etat(c) === 'choisie'}
          onClick={() => onPick?.(c)}
        />
      ))}
    </div>
  )
}

/**
 * La pastille « dernier joué » d'un joueur : ce qu'il vient de jouer, donc ce
 * qu'il ne peut pas rejouer. C'est l'information qui porte tout le jeu, et
 * elle doit être visible en permanence, pour soi comme pour les adversaires.
 *
 * Elle prend le carton opposé à son panneau pour rester visible sur toutes les
 * lignes, y compris la tienne (dont le fond est plus foncé).
 */
export function Verrou({
  locked,
  chipBg,
  petit,
}: {
  locked: CardKey[]
  chipBg?: string
  /** La pastille resserrée du mode équipes : 3 × 8 au lieu de 4 × 9. */
  petit?: boolean
}) {
  const t = useTheme()
  const pad = petit ? '3px 8px' : '4px 9px'
  if (locked.length === 0) {
    return (
      <Pastille bg={chipBg} style={{ padding: pad }}>
        <span style={{ font: `500 10px/1 ${TEXTE}`, color: t.ink2 }}>rien joué</span>
      </Pastille>
    )
  }
  return (
    <>
      {locked.map((k) => (
        <Pastille key={k} bg={chipBg} style={{ padding: pad }}>
          <Pictogramme card={k} size={18} color={t.ink2} />
          <span style={{ font: `500 10px/1 ${TEXTE}`, color: t.ink2 }}>
            {CARD_LABEL[k]} · interdite
          </span>
        </Pastille>
      ))}
    </>
  )
}

/**
 * La ligne d'un joueur : forme, nom, verrou, étiquette d'état, et son mur.
 *
 * Ton propre mur se reconnaît à un fond légèrement plus foncé plus l'étiquette
 * « toi » — de la matière, pas un trait. Aucun bord coloré nulle part.
 */
export function LigneJoueur({
  player,
  wall,
  moi,
  tag,
  tagColor,
  hauteurMur = 42,
  chant = 5,
  pad = 13,
  gap = 10,
  verrou = true,
  nu = false,
  bandeau,
  dessous,
  compte,
  bulles,
  chute,
  onClick,
  ariaLabel,
}: {
  player: Player
  /** Le mur à afficher, si différent de celui du joueur (révélation animée). */
  wall?: Slot[]
  moi?: boolean
  tag?: string
  tagColor?: string
  hauteurMur?: number
  chant?: number
  pad?: number | string
  gap?: number
  verrou?: boolean
  /**
   * Sans panneau : le mur nu, posé dans un panneau qui l'englobe déjà.
   *
   * C'est le cas du mode équipes, où c'est l'ÉQUIPE qui porte le panneau et
   * ses deux joueurs qui s'y rangent. Emboîter un panneau dans un panneau
   * doublerait les marges et les chants, et le plateau déborderait.
   */
  nu?: boolean
  /** Le bandeau terre cuite « Ta frappe part sur ce mur ». */
  bandeau?: ReactNode
  /** Ce qui se glisse entre l'identité et le mur (la carte jouée, à la révélation). */
  dessous?: ReactNode
  /** Le compte de briques, là où le verrou se tient le reste du temps. */
  compte?: ReactNode
  /**
   * Les bulles de ce joueur.
   *
   * Elles sortent de son jeton, et non du milieu de l'écran : une réaction dit
   * autant QUI que QUOI, et une bulle au centre aurait obligé à lire un nom
   * pour comprendre ce qu'un coup d'œil doit donner.
   */
  bulles?: ReactNode
  /** La brique qui tombe, à la révélation. */
  chute?: { slots: readonly number[]; sens: 1 | -1; avant: Slot[]; delai?: number }
  onClick?: () => void
  ariaLabel?: string
}) {
  const t = useTheme()
  const panelBg = moi ? t.panel2 : t.panel
  const chipBg = nu ? t.panel2 : moi ? t.panel : t.panel2
  const w = wall ?? player.wall
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick, 'aria-label': ariaLabel } : {})}
      style={{
        position: 'relative',
        background: nu ? 'transparent' : panelBg,
        borderRadius: nu ? 0 : R.panneau,
        padding: nu ? 0 : pad,
        display: 'flex',
        flexDirection: 'column',
        gap: nu ? 7 : gap,
        boxShadow: nu ? undefined : `0 3px 0 ${t.edge}`,
        border: 'none',
        width: '100%',
        textAlign: 'left',
        font: 'inherit',
        cursor: onClick ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <MurAccessible nom={player.name} wall={w} />
      {bulles}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'nowrap' }}>
        <Forme ci={player.ci} size={nu ? 17 : 20} />
        <span
          style={{
            font: nu ? `600 14px/1 ${TEXTE}` : `700 17px/1 ${TITRE}`,
            color: t.ink,
            flex: '0 0 auto',
          }}
        >
          {player.name}
        </span>
        {verrou && <Verrou locked={player.locked} chipBg={chipBg} petit={nu} />}
        {compte}
        {tag && (
          <Etiquette size={10} color={tagColor ?? t.ink2} style={{ marginLeft: 'auto', letterSpacing: '0.08em' }}>
            {tag}
          </Etiquette>
        )}
      </div>
      {bandeau}
      {dessous}
      <Mur
        wall={w}
        ci={player.ci}
        height={hauteurMur}
        chant={chant}
        tombees={chute?.slots}
        avant={chute?.avant}
        sens={chute?.sens}
        delai={chute?.delai}
      />
    </Tag>
  )
}

/** Le bandeau terre cuite posé sur le mur visé : « Ta frappe part sur ce mur ». */
export function BandeauCible({ card, texte }: { card: CardKey; texte: string }) {
  const t = useTheme()
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        background: t.clayText,
        borderRadius: 13,
        padding: '9px 11px',
      }}
    >
      <Pictogramme card={card} size={22} color={t.panel} />
      <span style={{ font: `600 13px/1 ${TEXTE}`, color: t.panel }}>{texte}</span>
    </div>
  )
}

/** Le bandeau ocre d'une carte de manche : la seule chose ocre du jeu. */
export function BandeauManche({
  nom,
  detail,
  surtitre = 'Carte de manche · pour tout le monde',
}: {
  nom: string
  detail: string
  surtitre?: string
}) {
  const t = useTheme()
  return (
    <div
      style={{
        background: t.ochre,
        borderRadius: 16,
        boxShadow: `0 4px 0 ${t.ochreEdge}`,
        padding: '13px 15px',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <Etiquette size={10} color={t.ochreInk}>
        {surtitre}
      </Etiquette>
      <div style={{ font: `700 19px/1.1 ${TITRE}`, color: '#2E2418' }}>{nom}</div>
      <div style={{ font: `500 12px/1.35 ${TEXTE}`, color: t.ochreInk }}>{detail}</div>
    </div>
  )
}
