import { useEffect, useState } from 'react'
import { TEXTE, TITRE } from '../theme'
import { narrate, playedLabel } from '../game/narrate'
import type { GameState, PlayerId } from '../game/types'
import { Etiquette, Pastille, usePanneauEncre } from '../ui/atoms'
import { LigneJoueur } from '../ui/jeu'
import { Pictogramme } from '../ui/Pictogramme'
import { Corps, Ecran, EnTete } from '../ui/shell'
import { useTheme } from '../ui/theme'

/**
 * 08 · La révélation — le moment fort de l'app.
 *
 * Les quatre cartes se retournent d'un coup : on voit qui a joué quoi et sur
 * qui, et le panneau du bas raconte la manche en une phrase. C'est le seul
 * moment d'information de la manche.
 *
 * Seule exception : sous la carte de manche « Cartes sur table », les lignes
 * se dévoilent une par une, du mur le plus bas au plus haut.
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
  const outcome = state.lastOutcome
  const uneParUne = state.activeRoundCard?.id === 'cartes-sur-table'
  const [devoiles, setDevoiles] = useState(uneParUne ? 0 : state.players.length)

  useEffect(() => {
    if (!uneParUne) {
      setDevoiles(state.players.length)
      return
    }
    setDevoiles(0)
    const id = setInterval(
      () => setDevoiles((n) => (n >= state.players.length ? n : n + 1)),
      650,
    )
    return () => clearInterval(id)
  }, [uneParUne, state.players.length, state.round])

  if (!outcome) return null
  const recit = narrate(state, outcome, moi)
  const tout = devoiles >= state.players.length

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
          <span style={{ font: `500 11px/1 ${TEXTE}`, color: encre.sub, whiteSpace: 'nowrap' }}>
            {/* Pendant la révélation la phase vaut « revelation » : c'est le
                compteur qui dit qu'on est en mort subite. */}
            {state.mortSubite > 0
              ? `mort subite · manche ${state.mortSubite}`
              : `manche ${outcome.round} · tout le monde a joué`}
          </span>
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
            return (
              <LigneJoueur
                key={id}
                player={p}
                moi={id === moi}
                verrou={false}
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
                      background: id === moi ? t.panel : t.panel2,
                      borderRadius: 12,
                      padding: '8px 10px',
                      minHeight: 38,
                      // Les cartes se retournent : avant, on ne voit que le dos.
                      visibility: visible ? 'visible' : 'hidden',
                    }}
                  >
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
