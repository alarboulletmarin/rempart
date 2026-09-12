import { useMemo, useState } from 'react'
import { TEXTE, TITRE } from '../theme'
import {
  bricks,
  choicesRequired,
  hasPlayed,
  legalCards,
  playersToAct,
  possibleTargets,
  readyCount,
} from '../game/engine'
import {
  CARD_KEYS,
  type CardKey,
  type Choice,
  type GameState,
  type Player,
  type PlayerId,
} from '../game/types'
import { useT, type Cle, type T } from '../i18n'
import { Etiquette, Panneau, Texte } from '../ui/atoms'
import { Bulles, Eventail } from '../ui/discussion'
import { BandeauCible, BandeauManche, LigneJoueur, Main, type EtatCarte } from '../ui/jeu'
import { DUREE, anime, useMouvement } from '../ui/mouvement'
import { Pictogramme } from '../ui/Pictogramme'
import { CompteurManche, Corps, Ecran, EnTete, Jauge } from '../ui/shell'
import { useTheme } from '../ui/theme'
import { FeuilleDeconnexion } from './Deconnexion'

/**
 * La géométrie de chaque cadre de la planche, relevée au pixel.
 *
 * `pad` et `gap` sont ceux du corps de l'écran, `mur` la hauteur d'une rangée
 * de briques, `carte` celle d'une carte en main, `pied` celle de la barre du
 * bas. Les six écrans ci-dessous sont rendus par un seul composant, mais la
 * planche ne leur donne pas les mêmes mesures.
 */
const GEOMETRIE = {
  /** 05 · état neutre */
  neutre: { pad: '14px', gap: 11, mur: 42, carte: 126, pied: 56 },
  /** 06 · carte choisie, choix de la cible */
  cible: { pad: '14px 14px 8px 14px', gap: 8, mur: 42, carte: 126, pied: 56 },
  /** 07 · en attente des autres */
  attente: { pad: '14px', gap: 11, mur: 36, carte: 126, pied: 52 },
  /** 09 · manche à carte commune */
  manche: { pad: '14px 14px 8px 14px', gap: 8, mur: 36, carte: 120, pied: 54 },
  /** 10 · équipes 2 contre 2 */
  equipes: { pad: '14px', gap: 12, mur: 34, carte: 118, pied: 54 },
  /** 12 · déconnexion en pleine manche */
  pause: { pad: '14px', gap: 11, mur: 36, carte: 126, pied: 56 },
} as const

/**
 * 05–07, 09, 10, 12 · Le tour de jeu.
 *
 * Un seul écran pour toute la manche : le plateau ne change pas de forme d'un
 * état à l'autre. Le joueur lit quatre murs et quatre cartes en trois secondes,
 * donc rien n'entre ici qui ne soit un état de jeu — aucun gribouillage, aucun
 * décor.
 *
 * L'écran est empilé par question posée : où j'en suis (l'en-tête) → ce que je
 * sais d'eux (les murs et leurs verrous) → ce que je peux faire (ma main).
 */
export function Jeu({
  state,
  moi,
  joues,
  absentsDepuis,
  carteInitiale,
  onJouer,
  onSuite,
  onQuitter,
}: {
  state: GameState
  moi: PlayerId
  /**
   * Qui a déjà joué cette manche.
   *
   * Il vient du réseau et non de `state.choices` : les choix des autres ne
   * sortent jamais de chez l'arbitre avant la révélation, donc un invité n'a
   * dans son état que le sien. Sans cette liste, le « 3 / 4 ont joué » de la
   * planche afficherait toujours « 1 / 4 ».
   */
  joues: PlayerId[]
  /** Depuis quand chaque absent l'est, pour le compte à rebours de l'écran 12. */
  absentsDepuis: ReadonlyMap<string, number>
  /**
   * Ouvre l'écran directement sur le choix de la cible (écran 06 de la
   * planche). Sert à la galerie de contrôle, qui rend un écran figé et ne peut
   * pas cliquer une carte pour l'atteindre.
   */
  carteInitiale?: CardKey
  onJouer: (choix: Choice[]) => void
  /** Accuse réception du bandeau de carte de manche. */
  onSuite: () => void
  onQuitter: () => void
}) {
  const t = useTheme()
  const tr = useT()
  const [brouillon, setBrouillon] = useState<Choice[]>([])
  const [carteEnCours, setCarteEnCours] = useState<CardKey | null>(carteInitiale ?? null)

  const me = state.players.find((p) => p.id === moi)
  const requis = choicesRequired(state, moi)
  const aJoue = (id: PlayerId) => joues.includes(id)
  const envoye = hasPlayed(state, moi) || aJoue(moi)
  const total = readyCount(state).total
  const played = playersToAct(state).filter((p) => aJoue(p.id)).length
  const equipes = state.config.format === 'equipes'
  const jeJoue = playersToAct(state).some((p) => p.id === moi)

  /** Les choix qui font foi : ceux déjà partis, sinon le brouillon en cours. */
  const choix = envoye ? (state.choices[moi] ?? []) : brouillon

  const cibles = useMemo(
    () => (carteEnCours ? possibleTargets(state, moi, carteEnCours) : []),
    [state, moi, carteEnCours],
  )

  if (!me) return null

  const etatCarte = (c: CardKey): EtatCarte => {
    if (carteEnCours === c) return 'choisie'
    if (choix.some((x) => x.card === c)) return 'choisie'
    if (!legalCards(state, moi).includes(c)) return 'interdite'
    return 'jouable'
  }

  const valider = (suite: Choice[]) => {
    setBrouillon(suite)
    setCarteEnCours(null)
    if (suite.length === requis) onJouer(suite)
  }

  const choisirCarte = (c: CardKey) => {
    if (!legalCards(state, moi).includes(c)) return
    // Le choix reste modifiable jusqu'à la révélation : toucher une carte
    // recommence la sélection.
    const base = envoye || choix.length >= requis ? [] : choix.filter((x) => x.card !== c)
    const options = possibleTargets(state, moi, c)
    if (options.length > 1) {
      setBrouillon(base)
      setCarteEnCours(c)
      return
    }
    valider([...base, { card: c, target: options[0] }])
  }

  const choisirCible = (id: PlayerId) => {
    if (!carteEnCours || !cibles.includes(id)) return
    valider([...brouillon, { card: carteEnCours, target: id }])
  }

  /* ------------------------------------------------------- en-tête */

  const enPause = state.players.some((p) => !p.connected)

  const droite = enPause ? (
    <Etiquette size={11} style={{ letterSpacing: '0.06em' }}>
      {tr('jeu.entete.pause')}
    </Etiquette>
  ) : carteEnCours ? (
    <span
      style={{
        background: t.clayText,
        borderRadius: 999,
        padding: '7px 12px',
        font: `600 11px/1 ${TEXTE}`,
        letterSpacing: '0.06em',
        color: t.panel,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {tr('jeu.entete.cible', { carte: tr(`carte.${carteEnCours}` as const) })}
    </span>
  ) : envoye ? (
    <>
      <span
        style={{
          width: 74,
          height: 8,
          borderRadius: 4,
          background: t.off,
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <span style={{ width: `${(played / Math.max(1, total)) * 100}%`, background: t.wood }} />
      </span>
      <span style={{ font: `600 11px/1 ${TEXTE}`, color: t.ink2, whiteSpace: 'nowrap' }}>
        {tr('jeu.entete.ontJoue', { n: played, total })}
      </span>
    </>
  ) : equipes ? (
    <Etiquette size={11} style={{ letterSpacing: '0.06em' }}>
      {tr('jeu.entete.equipes')}
    </Etiquette>
  ) : (
    <Jauge round={state.round} />
  )

  /* --------------------------------------------------- lignes de mur */

  const monEquipe = me.team
  const tagDe = (p: Player): { tag?: string; couleur?: string; discret?: boolean } => {
    if (!p.connected) return { tag: tr('jeu.tag.absent') }
    if (carteEnCours && cibles.includes(p.id) && p.id !== moi)
      return { tag: tr('jeu.tag.cibler'), couleur: t.clayText }
    if (p.id === moi) return { tag: tr('jeu.tag.toi') }
    // Qui a joué et qui choisit encore : utile, mais jamais au point de peser
    // plus que la contrainte affichée juste à côté.
    if (envoye)
      return { tag: tr(aJoue(p.id) ? 'jeu.tag.aJoue' : 'jeu.tag.choisit'), discret: true }
    // En équipes, savoir qui est de son côté vaut d'être dit en permanence :
    // c'est ce qui distingue un mur qu'on répare d'un mur qu'on casse.
    if (monEquipe !== null && p.team === monEquipe) return { tag: tr('jeu.tag.coequipier') }
    return {}
  }

  const deconnecte = state.players.find((p) => !p.connected)

  const bandeauDe = (p: Player) => {
    // Le mur visé porte un bandeau qui nomme l'action : sans lui, on ne sait
    // pas si la ligne mise en avant est la cible ou soi-même.
    const c = choix.find((x) => x.target === p.id && x.card === 'frapper')
    if (!c || p.id === moi || !envoye) return undefined
    return <BandeauCible card="frapper" texte={tr('jeu.bandeau.frappe')} />
  }

  /*
   * La géométrie de chaque cadre, relevée sur la planche.
   *
   * Un seul composant sert les écrans 05, 06, 07, 09, 10 et 12, mais la planche
   * ne leur donne pas les mêmes mesures : chaque information de plus à l'écran
   * — le bandeau ocre, la note de ciblage, la seconde ligne d'équipe — reprend
   * sa place sur les murs, les cartes et la barre du bas. Les approximer, c'est
   * faire déborder un cadre sur deux.
   */
  const cadre = deconnecte
    ? GEOMETRIE.pause
    : equipes
      ? GEOMETRIE.equipes
      : state.activeRoundCard
        ? GEOMETRIE.manche
        : carteEnCours
          ? GEOMETRIE.cible
          : envoye
            ? GEOMETRIE.attente
            : GEOMETRIE.neutre

  const ligne = (p: Player, nu = false) => {
    const { tag, couleur, discret } = tagDe(p)
    const ciblable = !!carteEnCours && cibles.includes(p.id)
    return (
      <LigneJoueur
        key={p.id}
        player={p}
        moi={p.id === moi}
        bulles={<Bulles de={p.id} />}
        nu={nu}
        verrou={!deconnecte}
        tag={tag}
        tagColor={couleur}
        tagDiscret={discret}
        hauteurMur={nu ? GEOMETRIE.equipes.mur : cadre.mur}
        bandeau={bandeauDe(p)}
        onClick={ciblable ? () => choisirCible(p.id) : undefined}
        ariaLabel={
          ciblable
            ? tr('jeu.viser.aria', { nom: p.name, briques: tr.n('brique', bricks(p)) })
            : undefined
        }
      />
    )
  }

  /* ----------------------------------------------------- pied d'écran */

  const attendus = playersToAct(state).filter((p) => !aJoue(p.id))

  const pied = carteEnCours ? (
    <BarrePied ton="ink" hauteur={cadre.pied}>
      {tr('jeu.pied.cibler')}
    </BarrePied>
  ) : envoye ? (
    <BarrePied ton="creux" point hauteur={cadre.pied}>
      {attendus.length === 0
        ? tr('jeu.pied.tousJoue')
        : attendus.length === 1
          ? tr('jeu.pied.attendUn', { nom: attendus[0].name })
          : tr('jeu.pied.attendPlusieurs', { n: attendus.length })}
    </BarrePied>
  ) : (
    <BarrePied ton="creux" hauteur={cadre.pied}>
      {tr('jeu.pied.continuer')}
    </BarrePied>
  )

  // En temps normal la carte interdite se lit sur la carte elle-même, donc le
  // libellé reste court. Sur une manche à carte commune, le joueur a une règle
  // de plus à tenir en tête : on lui rappelle son verrou en toutes lettres.
  const libelleMain = envoye
    ? phraseChoix(state, choix, moi, tr)
    : state.activeRoundCard && me.locked.length > 0
      ? tr.n('jeu.main.verrou', me.locked.length, {
          cartes: tr.liste(me.locked.map((k) => tr(`carte.${k}` as const))),
        })
      : tr('jeu.main.titre')

  /* ------------------------------------------------- carte de manche */

  if (state.phase === 'carte-manche' && state.activeRoundCard) {
    return (
      <FicheCarteManche
        state={state}
        onCompris={() => {
          setBrouillon([])
          setCarteEnCours(null)
          onSuite()
        }}
      />
    )
  }

  return (
    <Ecran>
      <EnTete
        gauche={
          state.phase === 'mort-subite' ? (
            <div style={{ font: `700 22px/1 ${TITRE}`, color: t.ink }}>
              {tr('jeu.entete.mortSubite')}
            </div>
          ) : (
            <CompteurManche round={state.round} />
          )
        }
        droite={
          <>
            {droite}
            {/* Un doigt, dans la barre du haut : le jeu ne s'interrompt pas, et
                la feuille de conversation ne s'ouvre jamais en partie. */}
            <Eventail />
          </>
        }
        hauteur={state.activeRoundCard ? 98 : 104}
        pad={18}
      />
      <Corps pad={cadre.pad} gap={cadre.gap}>
        {state.activeRoundCard && (
          <BandeauManche
            nom={tr(`manche.${state.activeRoundCard.id}.nom`)}
            detail={tr(`manche.${state.activeRoundCard.id}.detail`)}
          />
        )}

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: cadre.gap,
            overflowY: 'auto',
            // Le plateau reste lisible derrière la feuille de pause, mais en
            // retrait : la manche est arrêtée, il n'y a rien à y lire vite.
            opacity: deconnecte ? 0.45 : 1,
          }}
        >
          {equipes ? (
            <Equipes state={state} moi={moi} ligne={ligne} />
          ) : (
            state.players.map((p) => ligne(p))
          )}

          {carteEnCours === 'frapper' && (
            <Panneau bg={t.panel2} edge={null} radius={16} pad="12px 14px">
              <Texte size={13} color={t.ink}>
                {tr.n('jeu.conseil.cibles', cibles.length)} {conseilCible(state, cibles, tr)}
              </Texte>
            </Panneau>
          )}

          {equipes && !carteEnCours && (
            <Panneau bg={t.panel2} edge={null} radius={16} pad="12px 14px">
              <Texte size={13} color={t.ink}>
                {tr('jeu.equipes.aide', {
                  bloquer: tr('carte.bloquer'),
                  reparer: tr('carte.reparer'),
                  frapper: tr('carte.frapper'),
                })}
              </Texte>
            </Panneau>
          )}
        </div>

        {/* En pause, la main disparaît : la planche ne montre que les murs, et
            la feuille couvre le bas de l'écran. */}
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          hidden={!!deconnecte}
        >
          {jeJoue ? (
            <>
              {!carteEnCours && (
                <Texte size={12} weight={500} style={{ lineHeight: 1.3 }}>
                  {libelleMain}
                </Texte>
              )}
              <Main
                cards={CARD_KEYS}
                etat={etatCarte}
                onPick={choisirCarte}
                height={cadre.carte}
                // « C'est parti, on attend les autres », sans texte. Le
                // frémissement s'arrête dès que la table est complète : ce
                // qu'il disait n'est alors plus vrai.
                fremis={envoye && played < total}
              />
              {pied}
            </>
          ) : (
            <BarrePied ton="creux" point>
              {tr('jeu.pied.spectateur')}
            </BarrePied>
          )}
        </div>
      </Corps>

      {deconnecte && (
        <FeuilleDeconnexion
          joueur={deconnecte}
          depuis={absentsDepuis.get(deconnecte.id)}
          onContinuer={onSuite}
          onQuitter={onQuitter}
        />
      )}
    </Ecran>
  )
}

/**
 * La phrase au-dessus de la main, une fois le choix parti.
 *
 * Une clé par carte, et non un verbe fabriqué à partir de son nom : « Tu » +
 * « bloquer » moins son « r » plus un « s » donnait « Tu bloques » par un
 * hasard qui ne se reproduit dans aucune autre langue.
 */
function phraseChoix(state: GameState, choix: Choice[], moi: PlayerId, tr: T): string {
  const nom = (id?: PlayerId) => state.players.find((p) => p.id === id)?.name ?? ''
  const parts = choix.map((c) => {
    const pour = c.card !== 'frapper' && c.target && c.target !== moi
    return tr(`jeu.choix.${c.card}${pour ? '.pour' : ''}` as Cle, { cible: nom(c.target) })
  })
  return tr('jeu.choix.changer', { choix: parts.join(', ') })
}

/** Une ligne de conseil qui s'appuie sur les verrous visibles à l'écran. */
function conseilCible(state: GameState, cibles: PlayerId[], tr: T): string {
  const bloqueurs = state.players.filter(
    (p) => cibles.includes(p.id) && p.locked.includes('bloquer'),
  )
  if (bloqueurs.length === 1) {
    // Sans pronom personnel : le nom d'un joueur ne dit pas son genre, et
    // « il ne peut pas » se trompait sur une personne sur deux.
    return tr('jeu.conseil.bloqueur', {
      nom: bloqueurs[0].name,
      carte: tr('carte.bloquer'),
    })
  }
  const bas = [...state.players.filter((p) => cibles.includes(p.id))].sort(
    (a, b) => bricks(a) - bricks(b),
  )[0]
  return bas ? tr('jeu.conseil.murBas', { nom: bas.name }) : ''
}

function BarrePied({
  children,
  ton,
  point,
  hauteur = 56,
}: {
  children: React.ReactNode
  ton: 'ink' | 'creux'
  point?: boolean
  /** La planche donne 56 px à l'écran 05, 52 à l'écran 07, 54 aux 09 et 10. */
  hauteur?: number
}) {
  const t = useTheme()
  const ink = ton === 'ink'
  return (
    <div
      style={{
        height: hauteur,
        flex: `0 0 ${hauteur}px`,
        borderRadius: 16,
        background: ink ? t.selBg : t.cardOff,
        boxShadow: ink ? `0 4px 0 ${t.selEdge}` : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        font: ink ? `700 16px/1 ${TITRE}` : `500 13px/1 ${TEXTE}`,
        color: ink ? t.selFg : t.ink2,
      }}
    >
      {point && <span style={{ width: 9, height: 9, borderRadius: '50%', background: t.wood }} />}
      {children}
    </div>
  )
}

/** 10 · Les deux équipes, chacune avec son score commun. */
function Equipes({
  state,
  moi,
  ligne,
}: {
  state: GameState
  moi: PlayerId
  ligne: (p: Player, nu?: boolean) => JSX.Element
}) {
  const t = useTheme()
  const tr = useT()
  const monEquipe = state.players.find((p) => p.id === moi)?.team ?? 0
  const equipes: (0 | 1)[] = monEquipe === 0 ? [0, 1] : [1, 0]

  return (
    <>
      {equipes.map((eq) => {
        const membres = state.players.filter((p) => p.team === eq)
        const briques = membres.reduce((n, p) => n + bricks(p), 0)
        return (
          <Panneau key={eq} radius={18} pad={13} gap={11}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ font: `700 18px/1 ${TITRE}`, color: t.ink }}>
                {tr(eq === monEquipe ? 'jeu.equipes.vous' : 'jeu.equipes.eux')}
              </span>
              <span style={{ font: `600 13px/1 ${TEXTE}`, color: t.clayText }}>
                {tr.n('brique', briques)}
              </span>
              {eq === monEquipe && (
                <Etiquette size={10} style={{ letterSpacing: '0.08em', marginLeft: 'auto' }}>
                  {tr('jeu.equipes.tienne')}
                </Etiquette>
              )}
            </div>
            {membres.map((p) => ligne(p, true))}
          </Panneau>
        )
      })}
    </>
  )
}

/**
 * C2 · La fiche d'une carte de manche telle qu'elle tombe en jeu.
 * Elle est annoncée AVANT les choix : tout le monde la lit, puis on joue.
 *
 * **Elle entre en grand.** L'ocre couvre l'écran, la carte arrive trop grande
 * et se repose à sa taille : c'est une rupture, et elle doit se lire comme
 * telle — cette manche ne suit pas les règles des autres. L'écran reprend sa
 * peau ensuite, en une seconde et deux dixièmes, et plus rien ne bouge : la
 * fiche est un écran de lecture.
 */
export function FicheCarteManche({
  state,
  onCompris,
}: {
  state: GameState
  onCompris: () => void
}) {
  const t = useTheme()
  const tr = useT()
  const bouge = useMouvement()
  const carte = state.activeRoundCard
  if (!carte) return null

  return (
    <Ecran>
      {bouge && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: t.ochre,
            pointerEvents: 'none',
            zIndex: 5,
            animation: anime(bouge, 'rempart-peau', DUREE.manche, { courbe: 'ease-in' }),
          }}
        />
      )}
      <EnTete
        gauche={<CompteurManche round={state.round} />}
        droite={
          <Etiquette size={11} style={{ letterSpacing: '0.06em' }}>
            {tr('jeu.entete.carteCommune')}
          </Etiquette>
        }
        hauteur={98}
      />
      <Corps pad={20} gap={16} scroll>
        <div
          style={{
            background: t.ochre,
            borderRadius: 20,
            boxShadow: `0 5px 0 ${t.ochreEdge}`,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            zIndex: 6,
            animation: anime(bouge, 'rempart-manche', DUREE.manche, {
              courbe: 'cubic-bezier(.16,1,.3,1)',
            }),
          }}
        >
          <Etiquette size={11} color={t.ochreInk} style={{ letterSpacing: '0.12em' }}>
            {tr('jeu.manche.surtitre')}
          </Etiquette>
          <div style={{ font: `700 38px/1.05 ${TITRE}`, color: '#2E2418' }}>
            {tr(`manche.${carte.id}.nom`)}
          </div>
          <div style={{ font: `600 17px/1.35 ${TEXTE}`, color: '#2E2418', textWrap: 'pretty' }}>
            {tr(`manche.${carte.id}.detail`)}
          </div>
        </div>

        <Panneau radius={16} pad={15}>
          <Texte size={14} color={t.ink}>
            {tr(`manche.${carte.id}.pourquoi`)}
          </Texte>
        </Panneau>

        <Panneau radius={16} pad={15}>
          <Texte size={13} weight={600}>
            {tr('jeu.manche.retour', { n: state.round + 1 })}
          </Texte>
        </Panneau>

        <button
          type="button"
          onClick={onCompris}
          style={{
            marginTop: 'auto',
            height: 62,
            borderRadius: 18,
            background: t.selBg,
            boxShadow: `0 5px 0 ${t.selEdge}`,
            border: 'none',
            font: `700 19px/1 ${TITRE}`,
            color: t.selFg,
            cursor: 'pointer',
          }}
        >
          {tr('jeu.manche.compris')}
        </button>
      </Corps>
    </Ecran>
  )
}

/** Les quatre pictogrammes, pour rappel dans les écrans de lecture. */
export function RappelCartes() {
  const tr = useT()
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {CARD_KEYS.map((k) => (
        <div
          key={k}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
        >
          <Pictogramme card={k} size={38} />
          <span style={{ font: `700 12px/1 ${TITRE}` }}>{tr(`carte.${k}` as const)}</span>
        </div>
      ))}
    </div>
  )
}
