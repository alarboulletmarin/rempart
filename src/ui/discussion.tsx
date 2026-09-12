import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { R, TEXTE, TITRE } from '../theme'
import {
  EMOJI_PROPOSE,
  EVENTAIL,
  LONGUEUR_MAX,
  VIE_BULLE_MS,
  bullesVivantes,
  estReaction,
  type Emoji,
  type Message,
} from '../net/discussion'
import { useT, type Cle, type T } from '../i18n'
import { Etiquette, Forme, Texte } from './atoms'
import { Icone, type NomIcone } from './Icone'
import { DUREE, anime, useMouvement } from './mouvement'
import { useTheme } from './theme'

/**
 * Se parler — la feuille du salon, l'éventail de la partie, la bulle.
 *
 * Une seule conversation, deux formes selon le temps qu'on a :
 *
 *  - **dans le salon**, la feuille s'ouvre et se lit : c'est le seul moment de
 *    la partie où l'on attend ;
 *  - **en partie**, six emoji au bout d'un éventail, dans la barre du haut. Un
 *    appui ouvre, un appui envoie. Le jeu ne s'interrompt pas, et la feuille de
 *    conversation ne s'ouvre jamais — trois secondes pour lire quatre murs et
 *    choisir une carte, ce n'est pas le moment de lire un fil.
 *
 * L'accès passe par un contexte et non par des propriétés d'écran : la
 * conversation traverse le salon, le tour de jeu et la révélation, alors que
 * ces trois écrans n'ont rien d'autre en commun — et la galerie de contrôle,
 * elle, les rend sans aucune session.
 */

export type Auteur = { id: string; nom: string; ci: 0 | 1 | 2 | 3 }

export type Salle = {
  moi: string
  /** Les sièges, pour mettre un nom et une forme sur un message. */
  auteurs: readonly Auteur[]
  messages: readonly Message[]
  /** Rend `false` si rien n'est parti (repos entre deux envois non écoulé). */
  envoyer: (texte: string) => boolean
}

const SalleCtx = createContext<Salle | null>(null)

export function DiscussionProvider({ valeur, children }: { valeur: Salle | null; children: ReactNode }) {
  return <SalleCtx.Provider value={valeur}>{children}</SalleCtx.Provider>
}

/** La conversation de la table, ou `null` hors d'une session. */
export function useSalle(): Salle | null {
  return useContext(SalleCtx)
}

/**
 * Ce que chaque réaction veut dire, pour qui ne voit pas l'écran.
 *
 * Une CLÉ et non un mot : le jeton qui voyage sur le réseau reste l'emoji —
 * c'est le format du canal, et le changer romprait avec les versions déjà
 * installées — mais ce qu'un lecteur d'écran en dit se lit dans la langue de
 * qui écoute.
 */
const NOM_REACTION: Record<Emoji, Cle> = {
  '😂': 'chat.reaction.rire',
  '😱': 'chat.reaction.aie',
  '🎉': 'chat.reaction.bravo',
  '👏': 'chat.reaction.bienJoue',
  '😤': 'chat.reaction.grr',
  '🙏': 'chat.reaction.pitie',
}

/**
 * Le dessin de chaque réaction.
 *
 * Le jeton qui voyage reste l'emoji — c'est le format du canal, et en changer
 * romprait avec les versions déjà installées — mais rien n'oblige à
 * l'AFFICHER. Un emoji se rend différemment sur chaque téléphone, il n'a pas
 * la matière du reste du jeu, et la convention du projet est de ne jamais en
 * poser dans l'interface.
 */
export const ICONE_REACTION: Record<Emoji, NomIcone> = {
  '😂': 'rire',
  '😱': 'aie',
  '🎉': 'bravo',
  '👏': 'bienJoue',
  '😤': 'grr',
  '🙏': 'pitie',
}

/** Le nom d'une réaction, dit dans la langue de qui lit. */
function direReaction(tr: T, e: Emoji): string {
  return tr(NOM_REACTION[e])
}

/* ------------------------------------------------------------- les bulles */

/**
 * Les messages encore à l'écran, et le battement qui les efface.
 *
 * Le minuteur ne tourne que tant qu'il reste une bulle : une table silencieuse
 * ne réveille pas React toutes les six images pour rien.
 */
function useVivantes(messages: readonly Message[]): Map<string, Message[]> {
  const [maintenant, setMaintenant] = useState(() => Date.now())
  const vivantes = bullesVivantes(messages, maintenant)

  useEffect(() => {
    // Un message qui vient d'arriver n'est pas encore dans `maintenant` : on
    // repart de l'horloge, puis on bat jusqu'à ce que la dernière soit montée.
    setMaintenant(Date.now())
    if (messages.length === 0) return
    const dernier = messages[messages.length - 1]
    if (Date.now() - dernier.at >= VIE_BULLE_MS) return
    const id = setInterval(() => setMaintenant(Date.now()), 150)
    return () => clearInterval(id)
  }, [messages])

  return vivantes
}

/**
 * Les bulles d'un joueur, posées sur son jeton.
 *
 * Trois au plus se croisent — c'est le frein du récepteur — et elles se
 * décalent pour ne pas se recouvrir.
 */
export function Bulles({ de }: { de: string }) {
  const salle = useSalle()
  const t = useTheme()
  const tr = useT()
  const bouge = useMouvement()
  const vivantes = useVivantes(salle?.messages ?? [])
  if (!salle) return null
  const miennes = vivantes.get(de)
  if (!miennes || miennes.length === 0) return null
  const nom = salle.auteurs.find((a) => a.id === de)?.nom ?? ''

  return (
    /*
     * Les bulles se posent en BAS de la ligne, au-dessus du mur.
     *
     * Elles sortaient du haut, donc du jeton — et couvraient au passage le nom
     * du joueur et sa contrainte, c'est-à-dire tout ce que cette ligne sert à
     * lire. Le mur est un aplat sans texte : une réaction peut y passer sans
     * rien masquer, et elle sort toujours du bon côté de l'écran puisqu'elle
     * reste alignée sur le jeton.
     */
    <div
      role="status"
      aria-live="polite"
      style={{ position: 'absolute', left: 10, bottom: 6, pointerEvents: 'none', zIndex: 4 }}
    >
      {miennes.map((m, i) => {
        const reaction = estReaction(m.texte)
        return (
          <div
            key={m.id}
            style={{
              position: 'absolute',
              left: i * 30,
              top: 0,
              background: t.panel,
              borderRadius: R.pastille,
              boxShadow: `0 3px 0 ${t.edge}`,
              padding: reaction ? '4px 8px' : '6px 10px',
              maxWidth: 190,
              whiteSpace: reaction ? 'nowrap' : 'normal',
              animation: anime(bouge, 'rempart-bulle', DUREE.bulle, { courbe: 'ease-out' }),
            }}
          >
            {reaction ? (
              <Icone nom={ICONE_REACTION[m.texte as Emoji]} size={22} color={t.ink} />
            ) : (
              <span aria-hidden="true" style={{ font: `600 12px/1.3 ${TEXTE}`, color: t.ink }}>
                {m.texte}
              </span>
            )}
            <span style={SR_ONLY}>
              {tr('chat.dit', {
                nom,
                texte: reaction ? direReaction(tr, m.texte as Emoji) : m.texte,
              })}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const SR_ONLY = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const

/* ----------------------------------------------------------- l'éventail */

/**
 * Six emoji au bout d'un éventail, dans la barre du haut.
 *
 * Un appui ouvre, un appui envoie, trois secondes sans choix referment. La
 * feuille de conversation, elle, ne s'ouvre jamais en partie.
 *
 * `propose` est l'ouverture que la table offre : quand ton mur vient d'être
 * frappé, l'éventail s'ouvre seul deux secondes avec « aïe » entouré. Une
 * proposition, jamais une interruption — rien n'est envoyé sans un doigt, et
 * elle ne se déclenche jamais pendant ton propre choix de carte.
 */
export function Eventail({ propose }: { propose?: boolean }) {
  const salle = useSalle()
  const t = useTheme()
  const tr = useT()
  const bouge = useMouvement()
  const [ouvert, setOuvert] = useState(false)
  const [offert, setOffert] = useState(false)

  useEffect(() => {
    if (!propose) return
    setOuvert(true)
    setOffert(true)
    const id = setTimeout(() => {
      setOuvert(false)
      setOffert(false)
    }, 2000)
    return () => clearTimeout(id)
  }, [propose])

  useEffect(() => {
    if (!ouvert || offert) return
    const id = setTimeout(() => setOuvert(false), 3000)
    return () => clearTimeout(id)
  }, [ouvert, offert])

  if (!salle) return null

  const envoyer = (e: Emoji) => {
    salle.envoyer(e)
    setOuvert(false)
    setOffert(false)
  }

  return (
    // L'éventail se pose AU-DESSUS du plateau : il s'ouvre depuis la barre du
    // haut et retombe sur la première ligne de mur. Sans cet étage, les
    // pastilles de cette ligne-là se dessineraient par-dessus les cartes.
    <div style={{ position: 'relative', flex: '0 0 auto', zIndex: 20 }}>
      <button
        type="button"
        onClick={() => {
          setOffert(false)
          setOuvert((o) => !o)
        }}
        aria-expanded={ouvert}
        aria-label={tr(ouvert ? 'chat.reaction.fermer' : 'chat.reaction.ouvrir')}
        style={{
          width: 38,
          height: 34,
          borderRadius: R.pastille,
          background: ouvert ? t.selBg : t.cardOff,
          boxShadow: ouvert ? `0 3px 0 ${t.selEdge}` : undefined,
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Une bulle dessinée, et non un visage emprunté à la police système :
            on ne savait pas si ce bouton ouvrait un menu, un profil ou une
            réaction, et il ne se rendait pas pareil d'un téléphone à l'autre. */}
        <Icone nom="reaction" size={20} color={ouvert ? t.selFg : t.ink2} />
      </button>

      {ouvert && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            display: 'flex',
            gap: 4,
            zIndex: 20,
          }}
        >
          {EVENTAIL.map((e, i) => {
            const angle = (i - (EVENTAIL.length - 1) / 2) * 6
            const mis = offert && e === EMOJI_PROPOSE
            return (
              <div
                key={e}
                style={{ transform: `rotate(${angle}deg) translateY(${Math.abs(angle) * 0.2}px)` }}
              >
                <button
                  type="button"
                  onClick={() => envoyer(e)}
                  aria-label={tr('chat.reaction.envoyer', { nom: direReaction(tr, e) })}
                  title={direReaction(tr, e)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: R.carte,
                    background: mis ? t.selBg : t.cardBg,
                    boxShadow: `0 4px 0 ${mis ? t.selEdge : t.cardEdge}`,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    animation: anime(bouge, 'rempart-eventail', 180, { delai: i * 35 }),
                  }}
                >
                  <Icone nom={ICONE_REACTION[e]} size={23} color={mis ? t.selFg : t.ink} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ la feuille */

/** Le bouton qui ouvre la conversation, au salon. */
export function BoutonConversation({ nonLus, onOuvrir }: { nonLus: number; onOuvrir: () => void }) {
  const t = useTheme()
  const tr = useT()
  return (
    <button
      type="button"
      onClick={onOuvrir}
      style={{
        height: 48,
        flex: '0 0 48px',
        borderRadius: 16,
        background: t.cardOff,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 16px',
        font: `600 12px/1 ${TEXTE}`,
        letterSpacing: '0.08em',
        color: t.ink2,
        textTransform: 'uppercase',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {tr('chat.bouton')}
      <span
        style={{
          marginLeft: 'auto',
          font: `600 11px/1 ${TEXTE}`,
          letterSpacing: '0.08em',
          color: nonLus > 0 ? t.clayText : t.ink2,
        }}
      >
        {nonLus > 0 ? tr.n('chat.nonLus', nonLus) : tr('chat.calme')}
      </span>
    </button>
  )
}

/**
 * La feuille de conversation du salon.
 *
 * Elle monte du bas et se ferme par sa croix — pas au premier doigt posé à
 * côté : on écrit à quatre, et un retour de clavier ne doit pas refermer ce
 * qu'on est en train de lire.
 */
export function FeuilleDiscussion({ onFermer }: { onFermer: () => void }) {
  const salle = useSalle()
  const t = useTheme()
  const tr = useT()
  const bouge = useMouvement()
  const [texte, setTexte] = useState('')
  const bas = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bas.current?.scrollIntoView({ block: 'end', behavior: bouge ? 'smooth' : 'auto' })
  }, [salle?.messages.length, bouge])

  if (!salle) return null

  const envoyer = (t2: string) => {
    if (salle.envoyer(t2)) setTexte('')
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={tr('chat.aria')}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: '78%',
        background: t.panel,
        borderRadius: '26px 26px 30px 30px',
        boxShadow: `0 -3px 0 ${t.edge}`,
        padding: '16px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        zIndex: 8,
        animation: anime(bouge, 'rempart-feuille', DUREE.feuille, { courbe: 'ease-out' }),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ font: `700 21px/1 ${TITRE}`, color: t.ink }}>{tr('chat.titre')}</div>
        <Etiquette size={10} style={{ letterSpacing: '0.1em' }}>
          {tr('chat.surtitre')}
        </Etiquette>
        <button
          type="button"
          onClick={onFermer}
          aria-label={tr('chat.fermer')}
          style={{
            marginLeft: 'auto',
            width: 38,
            height: 38,
            borderRadius: R.pastille,
            background: t.cardOff,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: t.ink2,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {/* Une croix dessinée : « de la matière et un mot, jamais un glyphe
              de police » vaut aussi pour celle-ci. */}
          <Icone nom="fermer" size={16} color={t.ink2} />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 120,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {salle.messages.length === 0 ? (
          <Texte size={13} style={{ padding: '6px 2px' }}>
            {tr('chat.vide')}
          </Texte>
        ) : (
          salle.messages.map((m) => <Ligne key={m.id} message={m} salle={salle} />)
        )}
        <div ref={bas} />
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {EVENTAIL.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => envoyer(e)}
            aria-label={tr('chat.reaction.envoyer', { nom: direReaction(tr, e) })}
            style={{
              flex: 1,
              // Dans la feuille il y a de la place : le dessin porte son mot,
              // donc il n'a pas à se faire deviner.
              minHeight: 48,
              borderRadius: 13,
              background: t.cardBg,
              boxShadow: `0 3px 0 ${t.cardEdge}`,
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '5px 2px',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Icone nom={ICONE_REACTION[e]} size={19} color={t.ink} />
            <span
              aria-hidden="true"
              style={{ font: `500 8px/1.1 ${TEXTE}`, color: t.ink2, textAlign: 'center' }}
            >
              {direReaction(tr, e)}
            </span>
          </button>
        ))}
      </div>

      <form
        onSubmit={(ev) => {
          ev.preventDefault()
          envoyer(texte)
        }}
        style={{ display: 'flex', gap: 8 }}
      >
        <input
          value={texte}
          onChange={(ev) => setTexte(ev.target.value)}
          maxLength={LONGUEUR_MAX}
          enterKeyHint="send"
          aria-label={tr('chat.champ.aria')}
          placeholder={tr('chat.champ.exemple')}
          style={{
            flex: 1,
            minWidth: 0,
            height: 48,
            borderRadius: 14,
            background: t.panel2,
            border: 'none',
            padding: '0 14px',
            font: `500 15px/1 ${TEXTE}`,
            color: t.ink,
          }}
        />
        <button
          type="submit"
          disabled={texte.trim().length === 0}
          style={{
            flex: '0 0 auto',
            height: 48,
            borderRadius: 14,
            background: t.selBg,
            boxShadow: `0 3px 0 ${t.selEdge}`,
            border: 'none',
            padding: '0 18px',
            font: `700 14px/1 ${TITRE}`,
            color: t.selFg,
            opacity: texte.trim().length === 0 ? 0.55 : 1,
            cursor: texte.trim().length === 0 ? 'default' : 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {tr('chat.envoyer')}
        </button>
      </form>
    </div>
  )
}

/** Une ligne de la feuille : qui, et quoi. Une réaction y tient sa place. */
function Ligne({ message, salle }: { message: Message; salle: Salle }) {
  const t = useTheme()
  const tr = useT()
  const auteur = salle.auteurs.find((a) => a.id === message.de)
  const moi = message.de === salle.moi
  const reaction = estReaction(message.texte)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        background: moi ? t.panel2 : 'transparent',
        borderRadius: 13,
        padding: moi ? '8px 10px' : '8px 2px',
      }}
    >
      {auteur && <Forme ci={auteur.ci} size={16} />}
      <span style={{ font: `700 13px/1 ${TITRE}`, color: t.ink, flex: '0 0 auto' }}>
        {moi ? tr('chat.moi') : (auteur?.nom ?? '?')}
      </span>
      {reaction ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <Icone nom={ICONE_REACTION[message.texte as Emoji]} size={19} color={t.ink} />
          <span style={{ font: `500 13px/1.35 ${TEXTE}`, color: t.ink2 }}>
            {direReaction(tr, message.texte as Emoji)}
          </span>
        </span>
      ) : (
        <span
          style={{
            font: `500 14px/1.35 ${TEXTE}`,
            color: t.ink,
            textWrap: 'pretty',
            minWidth: 0,
          }}
        >
          {message.texte}
        </span>
      )}
    </div>
  )
}
