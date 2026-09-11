import { useEffect, useState } from 'react'
import { TEXTE, TITRE } from '../theme'
import { chute, narrate, playedLabel } from '../game/narrate'
import type { GameState, PlayerId } from '../game/types'
import { Etiquette, Pastille, usePanneauEncre } from '../ui/atoms'
import { Bulles, Eventail } from '../ui/discussion'
import { LigneJoueur } from '../ui/jeu'
import { DUREE, anime, useMouvement } from '../ui/mouvement'
import { Pictogramme } from '../ui/Pictogramme'
import { Corps, Ecran, EnTete } from '../ui/shell'
import { useTheme } from '../ui/theme'

/**
 * 08 · La révélation — le moment fort de l'app.
 *
 * **En cascade.** Les cartes se retournent une par une, un demi-temps entre
 * chacune, et c'est le seul moment de la manche où l'on ne sait pas encore.
 * L'écran s'ouvre donc sur les murs d'AVANT (`outcome.wallBefore`) : tant
 * qu'une carte n'est pas retournée, sa ligne n'a rien perdu. C'était le vrai
 * défaut de l'écran d'origine — il montrait un résultat déjà acquis, et les
 * cartes se retournaient pour confirmer ce que les murs avaient déjà dit.
 *
 * Quand la carte se retourne, la brique tombe sur le mur concerné, du côté
 * opposé à celui d'où le coup est venu (`chute`), et le compte de briques se
 * recompte chiffre par chiffre — on voit ce qu'on vient de perdre, pas
 * seulement le total.
 *
 * L'ordre est celui des places, sauf sous « Cartes sur table », où l'on part du
 * mur le plus bas (c'est `outcome.revealOrder` qui le dit, et le moteur qui en
 * décide).
 */
export function Revelation({
  state,
  moi,
  onSuivant,
}: {
  state: GameState
  moi: PlayerId
  onSuivant: () => void
}) {
  const t = useTheme()
  const encre = usePanneauEncre()
  const bouge = useMouvement()
  const outcome = state.lastOutcome
  const total = state.players.length
  const [devoiles, setDevoiles] = useState(bouge ? 0 : total)

  useEffect(() => {
    // Sous mouvement réduit, la cascade ne se crée pas : tout est là d'emblée,
    // et l'écrit dit exactement la même chose.
    if (!bouge) {
      setDevoiles(total)
      return
    }
    setDevoiles(0)
    const id = setInterval(() => setDevoiles((n) => (n >= total ? n : n + 1)), DUREE.cascade)
    return () => clearInterval(id)
  }, [bouge, total, state.round, state.mortSubite])

  if (!outcome) return null
  const recit = narrate(state, outcome, moi)
  const tout = devoiles >= total
  const monDelta = outcome.outcomes.find((o) => o.playerId === moi)?.delta ?? 0

  const tonFond =
    recit.tone === 'clay' ? t.clayText : recit.tone === 'green' ? t.green : t.selBg
  const tonChant =
    recit.tone === 'clay' ? t.clayTextEdge : recit.tone === 'green' ? t.greenEdge : t.selEdge
  const tonTexte = recit.tone === 'ink' ? t.selFg : t.panel

  return (
    <Ecran>
      <EnTete
        bg={encre.bg}
        fg={encre.fg}
        titre="Révélation"
        hauteur={104}
        droite={
          <>
            <span style={{ font: `500 11px/1 ${TEXTE}`, color: encre.sub, whiteSpace: 'nowrap' }}>
              {/* Pendant la révélation la phase vaut « revelation » : c'est le
                  compteur qui dit qu'on est en mort subite. */}
              {state.mortSubite > 0
                ? `mort subite · manche ${state.mortSubite}`
                : `manche ${outcome.round} · tout le monde a joué`}
            </span>
            {/* La table propose : quand ton mur vient d'être frappé, l'éventail
                s'ouvre seul deux secondes. Une proposition, jamais une
                interruption — et jamais pendant un choix de carte, puisqu'il
                n'y en a plus à faire ici. */}
            <Eventail propose={tout && monDelta < 0} />
          </>
        }
      />
      <Corps pad="14px 14px 8px 14px" gap={11}>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 11,
            overflowY: 'auto',
          }}
        >
          {outcome.revealOrder.map((id, i) => {
            const p = state.players.find((x) => x.id === id)
            if (!p) return null
            const o = outcome.outcomes.find((x) => x.playerId === id)
            const visible = i < devoiles
            const avant = o?.wallBefore ?? p.wall
            const tombe = chute(state, outcome, id)
            const debout = (w: typeof p.wall) => w.filter((s) => s !== 'broken').length

            return (
              <LigneJoueur
                key={id}
                player={p}
                // Tant que la carte n'est pas retournée, le mur est celui
                // d'avant : la ligne ne dit pas ce qu'elle n'a pas encore
                // révélé.
                wall={visible ? p.wall : avant}
                chute={
                  visible ? { slots: tombe.slots, sens: tombe.sens, avant, delai: 220 } : undefined
                }
                moi={id === moi}
                verrou={false}
                bulles={<Bulles de={id} />}
                compte={
                  visible ? (
                    <Recompte
                      de={debout(avant)}
                      a={debout(p.wall)}
                      delai={220}
                      // Le carton opposé au panneau de la ligne : sur la
                      // tienne, plus foncée, la pastille disparaîtrait dans
                      // son fond.
                      bg={id === moi ? t.panel : t.panel2}
                    />
                  ) : undefined
                }
                tag={id === moi ? 'toi' : !p.connected ? 'absent' : undefined}
                hauteurMur={30}
                pad="10px 12px"
                gap={7}
                dessous={
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: visible ? (id === moi ? t.panel : t.panel2) : t.cardOff,
                      borderRadius: 12,
                      padding: '8px 10px',
                      minHeight: 38,
                      animation: visible
                        ? anime(bouge, 'rempart-retourne', DUREE.retourne, { courbe: 'ease-out' })
                        : undefined,
                    }}
                  >
                    {visible ? (
                      <>
                        {o?.played[0] && (
                          <Pictogramme card={o.played[0].card} size={22} color={t.ink} />
                        )}
                        <span style={{ font: `600 13px/1 ${TEXTE}`, color: t.ink }}>
                          {playedLabel(state, id, outcome)}
                        </span>
                        {o?.tag && (
                          <Pastille
                            bg={o.hot ? t.clayText : t.panel2}
                            fg={o.hot ? t.panel : t.ink2}
                            style={{ marginLeft: 'auto' }}
                          >
                            {o.tag}
                          </Pastille>
                        )}
                      </>
                    ) : (
                      <DosDeCarte />
                    )}
                  </div>
                }
              />
            )
          })}
        </div>

        <div
          style={{
            marginTop: 'auto',
            background: tonFond,
            borderRadius: 18,
            padding: 15,
            boxShadow: `0 4px 0 ${tonChant}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            visibility: tout ? 'visible' : 'hidden',
          }}
        >
          <div style={{ font: `700 19px/1.15 ${TITRE}`, color: tonTexte, textWrap: 'pretty' }}>
            {recit.headline}
          </div>
          <div style={{ font: `500 13px/1.4 ${TEXTE}`, color: tonTexte, textWrap: 'pretty' }}>
            {recit.detail}
          </div>
        </div>

        {tout ? (
          <button
            type="button"
            onClick={onSuivant}
            style={{
              height: 56,
              flex: '0 0 56px',
              borderRadius: 16,
              background: t.selBg,
              boxShadow: `0 4px 0 ${t.selEdge}`,
              border: 'none',
              font: `700 16px/1 ${TITRE}`,
              color: t.selFg,
              cursor: 'pointer',
            }}
          >
            {state.round >= 10 ? 'Voir le classement' : 'Manche suivante'}
          </button>
        ) : (
          <div
            style={{
              height: 56,
              flex: '0 0 56px',
              borderRadius: 16,
              background: t.cardOff,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Etiquette size={11} style={{ letterSpacing: '0.08em' }}>
              on retourne les cartes une par une
            </Etiquette>
          </div>
        )}
      </Corps>
    </Ecran>
  )
}

/**
 * Le dos d'une carte qu'on n'a pas encore retournée.
 *
 * Ce n'est pas un vide : une ligne qui attend son tour doit se lire comme une
 * carte posée face cachée, sinon la cascade ressemble à un écran qui charge.
 */
function DosDeCarte() {
  const t = useTheme()
  return (
    <>
      <div style={{ display: 'flex', gap: 5, margin: '0 auto' }} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{ width: 7, height: 7, borderRadius: '50%', background: t.crack }}
          />
        ))}
      </div>
      <span
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
        }}
      >
        Carte encore face cachée.
      </span>
    </>
  )
}

/**
 * Les briques se recomptent — chiffre par chiffre, pas d'un bond.
 *
 * Le total seul ne dit pas ce qu'on vient de perdre : c'est le passage de 4 à 3
 * qui le dit, et il n'existe que si on le voit. Sous mouvement réduit, le
 * compte est posé d'emblée à sa valeur d'arrivée — l'étiquette de la ligne
 * (« −1 brique ») disait déjà la variation.
 */
function Recompte({
  de,
  a,
  delai = 0,
  bg,
}: {
  de: number
  a: number
  delai?: number
  bg?: string
}) {
  const t = useTheme()
  const bouge = useMouvement()
  const [n, setN] = useState(bouge ? de : a)

  useEffect(() => {
    if (!bouge || de === a) {
      setN(a)
      return
    }
    setN(de)
    const pas = Math.abs(a - de)
    const sens = Math.sign(a - de)
    const intervalle = Math.max(120, DUREE.recompte / pas)
    let fait = 0
    let boucle: ReturnType<typeof setInterval> | undefined
    // Le délai laisse la carte finir de se retourner : le compte bascule après
    // la révélation, jamais avant elle.
    const depart = setTimeout(() => {
      boucle = setInterval(() => {
        fait++
        setN(de + sens * fait)
        if (fait >= pas && boucle) clearInterval(boucle)
      }, intervalle)
    }, delai)
    return () => {
      clearTimeout(depart)
      if (boucle) clearInterval(boucle)
    }
  }, [bouge, de, a, delai])

  const couleur = a < de ? t.clayText : a > de ? t.green : t.ink2
  return (
    <Pastille style={{ marginLeft: 'auto' }} bg={bg} fg={couleur}>
      <span
        key={n}
        style={{
          display: 'inline-block',
          font: `700 12px/1 ${TITRE}`,
          animation: anime(bouge, 'rempart-bascule', 160),
        }}
      >
        {n}
      </span>
      brique{n > 1 ? 's' : ''}
    </Pastille>
  )
}
