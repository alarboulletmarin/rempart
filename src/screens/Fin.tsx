import { SAFE_TOP, TEXTE, TITRE } from '../theme'
import { bricks, standings, trancheeAuxPoints } from '../game/engine'
import { WALL_SIZE, type GameState, type PlayerId } from '../game/types'
import { useT, type T } from '../i18n'
import { ordinal } from '../i18n/format'
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
  const tr = useT()
  const encre = usePanneauEncre()
  const rows = standings(state)
  const gagnants = rows.filter((r) => r.winner)
  const equipes = state.config.format === 'equipes'
  const jaiGagne = gagnants.some((r) => r.player.id === moi)

  const titre = equipes
    ? tr('fin.gagnent', { noms: gagnants.map((r) => r.player.name).join(' + ') })
    : tr('fin.gagne', { nom: gagnants[0]?.player.name ?? '—' })

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
        {/*
         * La décoration a sa colonne, le texte a la sienne.
         *
         * Le gribouillage de victoire était posé en absolu au coin du panneau,
         * donc au-dessus du titre : il mangeait la dernière lettre de
         * « Truelle gagne » — et davantage avec un nom plus long, ou en
         * anglais. Il descend d'un cran, à côté du résumé, dans une colonne qui
         * lui est réservée : le titre retrouve toute la largeur du panneau, et
         * aucune longueur de nom ne peut plus passer sous l'étoile.
         *
         * Une colonne réservée plutôt qu'un empilement explicite : mettre de
         * l'ocre plein derrière de la craie aurait rendu le titre illisible
         * autrement.
         */}
        <div
          style={{
            background: encre.bg,
            borderRadius: 20,
            boxShadow: `0 5px 0 ${encre.edge}`,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            overflow: 'hidden',
          }}
        >
          <Etiquette size={11} color={encre.sub} style={{ letterSpacing: '0.14em' }}>
            {state.mortSubite > 0
              ? tr.n('fin.mortSubite', state.mortSubite)
              : tr(state.round >= 10 ? 'fin.dixManches' : 'fin.termine')}
          </Etiquette>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {gagnants[0] && <Forme ci={gagnants[0].player.ci} size={34} />}
            <h1
              style={{
                font: `700 36px/1.05 ${TITRE}`,
                color: encre.fg,
                margin: 0,
                minWidth: 0,
                textWrap: 'pretty',
              }}
            >
              {titre}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{ font: `500 14px/1.45 ${TEXTE}`, color: encre.detail, textWrap: 'pretty' }}
              >
                {resume(tr, state, jaiGagne, gagnants[0]?.bricks ?? 0)}
              </div>
              {/* Une partie décidée par la règle du départage doit le dire :
                  sinon le classement à l'écran a l'air de se contredire. */}
              {trancheeAuxPoints(state) && (
                <div
                  style={{ font: `500 12px/1.4 ${TEXTE}`, color: encre.sub, textWrap: 'pretty' }}
                >
                  {tr('fin.departage')}
                </div>
              )}
            </div>
            <Scribble nom="burst" width={72} height={72} style={{ marginTop: -8 }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((r) => (
            <Panneau key={r.player.id} radius={16} pad="12px 13px" gap={8}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ font: `700 13px/1 ${TITRE}`, color: t.ink2, width: 24 }}>
                  {ordinal(r.place, tr.langue)}
                </span>
                <Forme ci={r.player.ci} size={19} />
                <span style={{ font: `700 17px/1 ${TITRE}`, color: t.ink }}>{r.player.name}</span>
                <span style={{ font: `600 13px/1 ${TEXTE}`, color: t.ink2, marginLeft: 'auto' }}>
                  {tr.n('brique', r.bricks)}
                </span>
                {(r.winner || r.player.id === moi) && (
                  <Etiquette size={10} color={t.clayText} style={{ letterSpacing: '0.08em' }}>
                    {tr(r.player.id === moi ? 'fin.toi' : 'fin.vainqueur')}
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
              {tr('fin.rejouer')}
            </Bouton>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <BoutonCreux onClick={onPalmares}>{tr('fin.palmares')}</BoutonCreux>
            <BoutonCreux onClick={onQuitter}>{tr('fin.quitter')}</BoutonCreux>
          </div>
          {!peutRejouer && (
            <Texte size={11} style={{ textAlign: 'center', lineHeight: 1.5 }}>
              {tr('fin.hoteRelance')}
            </Texte>
          )}
        </div>
      </div>
    </Ecran>
  )
}

/**
 * Une phrase qui explique la victoire par ce qui s'est passé, pas par le score
 * — qui est déjà juste au-dessous.
 */
function resume(tr: T, state: GameState, jaiGagne: boolean, briquesGagnant: number): string {
  const rase = state.players.filter((p) => bricks(p) === 0).length
  const briques = tr.n('brique', briquesGagnant)
  if (trancheeAuxPoints(state)) {
    return tr(jaiGagne ? 'fin.resume.departage.moi' : 'fin.resume.departage.autre')
  }
  if (briquesGagnant === WALL_SIZE) {
    return tr(jaiGagne ? 'fin.resume.intact.moi' : 'fin.resume.intact.autre')
  }
  if (rase > 0) return tr.n('fin.resume.rase', rase, { briques })
  return tr(jaiGagne ? 'fin.resume.verrou.moi' : 'fin.resume.verrou.autre', { briques })
}
