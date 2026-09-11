import { SAFE_TOP, TEXTE, TITRE } from '../theme'
import { bricks, standings, trancheeAuxPoints } from '../game/engine'
import type { GameState, PlayerId } from '../game/types'
import { Bouton, BoutonCreux, Etiquette, Forme, Mur, Panneau, Scribble, Texte, usePanneauEncre } from '../ui/atoms'
import { Ecran } from '../ui/shell'
import { useTheme } from '../ui/theme'

/**
 * 11 · Fin de partie.
 *
 * Le mur est le score : le classement est déjà à l'écran depuis la première
 * manche, il n'y a ni bonus ni malus à annoncer. Le gribouillage de victoire
 * est ici à sa place — la manche est finie, plus rien à lire vite.
 */
export function Fin({
  state,
  moi,
  onRejouer,
  onPalmares,
  onQuitter,
  peutRejouer,
}: {
  state: GameState
  moi: PlayerId
  onRejouer: () => void
  onPalmares: () => void
  onQuitter: () => void
  /** Seul l'hôte peut relancer une partie avec les mêmes joueurs. */
  peutRejouer: boolean
}) {
  const t = useTheme()
  const encre = usePanneauEncre()
  const rows = standings(state)
  const gagnants = rows.filter((r) => r.winner)
  const equipes = state.config.format === 'equipes'
  const jaiGagne = gagnants.some((r) => r.player.id === moi)

  const titre = equipes
    ? `${gagnants.map((r) => r.player.name).join(' + ')} gagnent`
    : `${gagnants[0]?.player.name ?? '—'} gagne`

  return (
    <Ecran>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: `calc(${SAFE_TOP} + 20px) 20px 20px 20px`,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            background: encre.bg,
            borderRadius: 20,
            boxShadow: `0 5px 0 ${encre.edge}`,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Scribble
            nom="burst"
            width={104}
            height={104}
            style={{ position: 'absolute', right: 8, top: 6, pointerEvents: 'none' }}
          />
          <Etiquette size={11} color={encre.sub} style={{ letterSpacing: '0.14em' }}>
            {state.mortSubite > 0
              ? `Mort subite · ${state.mortSubite} manche${state.mortSubite > 1 ? 's' : ''}`
              : state.round >= 10
                ? 'Dix manches · terminé'
                : 'Terminé'}
          </Etiquette>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {gagnants[0] && <Forme ci={gagnants[0].player.ci} size={34} />}
            <h1 style={{ font: `700 36px/1 ${TITRE}`, color: encre.fg, margin: 0 }}>{titre}</h1>
          </div>
          <div
            style={{
              font: `500 14px/1.45 ${TEXTE}`,
              color: encre.detail,
              maxWidth: 250,
              textWrap: 'pretty',
            }}
          >
            {resume(state, jaiGagne, gagnants[0]?.bricks ?? 0)}
          </div>
          {/* Une partie décidée par la règle du départage doit le dire :
              sinon le classement à l'écran a l'air de se contredire. */}
          {trancheeAuxPoints(state) && (
            <div
              style={{
                font: `500 12px/1.4 ${TEXTE}`,
                color: encre.sub,
                maxWidth: 250,
                textWrap: 'pretty',
              }}
            >
              La mort subite n’a pas départagé en trois manches : c’est le mur le plus haut, puis
              la place à la table, qui tranchent.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((r) => (
            <Panneau key={r.player.id} radius={16} pad="12px 13px" gap={8}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ font: `700 13px/1 ${TITRE}`, color: t.ink2, width: 24 }}>
                  {rang(r.place)}
                </span>
                <Forme ci={r.player.ci} size={19} />
                <span style={{ font: `700 17px/1 ${TITRE}`, color: t.ink }}>{r.player.name}</span>
                <span style={{ font: `600 13px/1 ${TEXTE}`, color: t.ink2, marginLeft: 'auto' }}>
                  {r.bricks} brique{r.bricks > 1 ? 's' : ''}
                </span>
                {(r.winner || r.player.id === moi) && (
                  <Etiquette size={10} color={t.clayText} style={{ letterSpacing: '0.08em' }}>
                    {r.player.id === moi ? 'toi' : 'gagne'}
                  </Etiquette>
                )}
              </div>
              <Mur wall={r.player.wall} ci={r.player.ci} height={26} gap={5} radius={6} chant={4} />
            </Panneau>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
          {peutRejouer && (
            <Bouton onClick={onRejouer} height={64} size={20}>
              Rejouer avec les mêmes
            </Bouton>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <BoutonCreux onClick={onPalmares}>Palmarès</BoutonCreux>
            <BoutonCreux onClick={onQuitter}>Quitter</BoutonCreux>
          </div>
          {!peutRejouer && (
            <Texte size={11} style={{ textAlign: 'center', lineHeight: 1.5 }}>
              L’hôte peut relancer une partie avec les mêmes joueurs.
            </Texte>
          )}
        </div>
      </div>
    </Ecran>
  )
}

/** Le rang, écrit comme sur la planche : « 1ᵉ », « 2ᵉ »… */
function rang(place: number): string {
  return `${place}ᵉ`
}

/**
 * Une phrase qui explique la victoire par ce qui s'est passé, pas par le score
 * — qui est déjà juste au-dessous.
 */
function resume(state: GameState, jaiGagne: boolean, briquesGagnant: number): string {
  const intact = briquesGagnant === 5
  const rase = state.players.filter((p) => bricks(p) === 0).length
  if (trancheeAuxPoints(state)) {
    return jaiGagne
      ? 'Trois manches de mort subite sans qu’aucun mur ne cède. Tu gagnes au départage.'
      : 'Trois manches de mort subite sans qu’aucun mur ne cède. Le départage a tranché.'
  }
  if (intact) {
    return jaiGagne
      ? 'Mur intact : cinq briques debout. Personne n’a osé te viser.'
      : 'Mur intact : cinq briques debout. Le reste du temps, personne n’a osé le viser.'
  }
  if (rase > 0) {
    return `${rase} mur${rase > 1 ? 's' : ''} à zéro, et la partie s’est jouée à ${briquesGagnant} brique${briquesGagnant > 1 ? 's' : ''}. La dixième manche a tranché.`
  }
  return jaiGagne
    ? `Tu finis à ${briquesGagnant} briques. C’est le verrou qui a fait la différence : trois choix au lieu de quatre, et tout le monde le savait.`
    : `${briquesGagnant} briques debout à la dixième. Le verrou a fait le reste.`
}
