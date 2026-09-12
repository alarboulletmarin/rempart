import type { ReactNode } from 'react'
import { R, TEXTE, TITRE } from '../theme'
import type { CardKey, Player, Slot } from '../game/types'
import { useT } from '../i18n'
import { Icone } from './Icone'
import { Pictogramme } from './Pictogramme'
import { Etiquette, Forme, LigneAccessible, Mur, Pastille } from './atoms'
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
 * carton plus pâle, à pleine encre, avec un cadenas et la mention « interdit
 * ce tour ». Un état se lit à la matière, jamais à l'opacité — et jamais à la
 * seule pâleur du carton, qui ne dit pas POURQUOI la carte ne répond pas.
 *
 * Elle porte `aria-disabled` et non `disabled` : une carte que le verrou
 * ferme reste une information à lire, et un bouton `disabled` sort de l'ordre
 * de tabulation — le lecteur d'écran passerait devant la seule carte dont il
 * fallait parler.
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
  const tr = useT()
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
      aria-disabled={interdite}
      aria-pressed={choisie}
      aria-label={tr('jeu.carte.aria', {
        carte: tr(`carte.${card}` as const),
        etat: tr(`jeu.etat.${etat}` as const),
      })}
      style={{
        position: 'relative',
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
      {/* Le cadenas se pose au coin plutôt que devant le libellé : en ligne,
          il poussait « interdit ce tour » sur deux lignes et se perdait à
          11 px. Au coin il a la place d'être lu, et il double la matière plus
          pâle du carton — l'état ne tient donc pas au seul ton. */}
      {interdite && (
        <Icone
          nom="cadenas"
          size={14}
          color={t.ink3}
          style={{ position: 'absolute', top: 8, right: 8 }}
        />
      )}
      <Pictogramme card={card} size={40} color={pictoColor} />
      <span style={{ font: `700 13px/1 ${TITRE}`, color: fg }}>
        {tr(`carte.${card}` as const)}
      </span>
      <span
        style={{
          font: `500 9px/1.2 ${TEXTE}`,
          color: choisie ? t.selFg : t.ink2,
          textAlign: 'center',
        }}
      >
        {tr(interdite ? 'jeu.carte.interdite' : (`jeu.etat.${etat}` as const))}
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
 * La contrainte d'un joueur pour la manche en cours : ce qu'il ne peut pas
 * jouer, donc ce qu'il lui reste.
 *
 * **C'est l'information qui porte tout le jeu**, et la seule qui soit
 * publique : « la carte jouée est interdite la manche suivante » ne se décide
 * que si on la lit sur les trois adversaires. La tenir de tête, c'est trois
 * adversaires fois dix manches — au-delà de ce que la mémoire de travail
 * garde, donc le choix redevient un tirage au sort. Elle est affichée en
 * permanence, sur chaque ligne, la tienne comprise.
 *
 * **L'absence de contrainte se dit aussi.** Une ligne sans pastille se lit
 * comme une ligne dont on ne sait rien ; « Tout est jouable » est une
 * information, et c'en est une lourde en manche 1 ou après une carte
 * « Mémoire courte ».
 *
 * Le pictogramme de la carte double le mot : en niveaux de gris, sur un écran
 * au soleil ou pour qui distingue mal les couleurs, la forme reste.
 *
 * Elle prend le carton opposé à son panneau pour rester visible sur toutes les
 * lignes, y compris la tienne (dont le fond est plus foncé).
 */
export function Contrainte({
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
  const tr = useT()
  const pad = petit ? '3px 8px' : '4px 9px'
  const taille = petit ? 15 : 17

  return (
    <Pastille
      bg={chipBg}
      aria-hidden="true"
      style={{ padding: pad, flex: '0 0 auto', gap: locked.length > 0 ? 5 : 0 }}
    >
      {locked.map((k) => (
        <Pictogramme key={k} card={k} size={taille} color={t.ink2} />
      ))}
      <span
        style={{
          font: `600 10px/1 ${TEXTE}`,
          color: t.ink2,
          marginLeft: locked.length > 0 ? 1 : 0,
        }}
      >
        {locked.length === 0
          ? tr('jeu.contrainte.libre')
          : tr('jeu.contrainte.interdit', {
              cartes: tr.liste(locked.map((k) => tr(`carte.${k}` as const))),
            })}
      </span>
    </Pastille>
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
  tagDiscret,
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
  /**
   * L'étiquette se dit à voix basse : minuscules, sans interlettrage.
   *
   * C'est le traitement de « en train de choisir » et « a joué », qui
   * accompagnent la ligne sans rien lui apprendre d'irremplaçable. Les
   * capitales espacées restent aux états qui, eux, changent ce qu'on peut
   * faire : « toi », « cibler », « absent ».
   */
  tagDiscret?: boolean
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
      <LigneAccessible nom={player.name} wall={w} locked={verrou ? player.locked : undefined} />
      {bulles}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'nowrap' }}>
        <Forme ci={player.ci} size={nu ? 17 : 20} />
        {/*
         * Le nom cède avant la contrainte.
         *
         * Sur 390 px, un nom de quatorze caractères et une contrainte ne
         * tiennent pas ensemble sur la ligne. C'est le nom qui s'abrège : la
         * forme et la couleur l'identifient déjà, alors que la contrainte
         * n'est écrite nulle part ailleurs.
         */}
        <span
          style={{
            font: nu ? `600 14px/1 ${TEXTE}` : `700 17px/1 ${TITRE}`,
            color: t.ink,
            flex: '0 1 auto',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {player.name}
        </span>
        {verrou && <Contrainte locked={player.locked} chipBg={chipBg} petit={nu} />}
        {compte}
        {tag &&
          (tagDiscret ? (
            <span
              style={{
                marginLeft: 'auto',
                font: `500 10px/1 ${TEXTE}`,
                color: t.ink3,
                flex: '0 1 auto',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'right',
              }}
            >
              {tag}
            </span>
          ) : (
            <Etiquette
              size={10}
              color={tagColor ?? t.ink2}
              style={{
                marginLeft: 'auto',
                letterSpacing: '0.08em',
                flex: '0 1 auto',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'right',
              }}
            >
              {tag}
            </Etiquette>
          ))}
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
  surtitre,
}: {
  nom: string
  detail: string
  surtitre?: string
}) {
  const t = useTheme()
  const tr = useT()
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
        {surtitre ?? tr('jeu.manche.bandeau')}
      </Etiquette>
      <div style={{ font: `700 19px/1.1 ${TITRE}`, color: '#2E2418' }}>{nom}</div>
      <div style={{ font: `500 12px/1.35 ${TEXTE}`, color: t.ochreInk }}>{detail}</div>
    </div>
  )
}
