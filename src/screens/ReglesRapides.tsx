import { TEXTE, TITRE } from '../theme'
import { CARD_KEYS } from '../game/types'
import { useT } from '../i18n'
import { Panneau, usePanneauEncre } from '../ui/atoms'
import { Pictogramme } from '../ui/Pictogramme'
import { Corps, Ecran, EnTete } from '../ui/shell'
import { useTheme } from '../ui/theme'

/**
 * 04 · Règles.
 *
 * La page qu'on lit une fois, avant de jouer : la phrase unique, les quatre
 * cartes, le verrou, les cartes de manche, et « J'ai compris ». Elle ne
 * remplace pas les chapitres (R0–R7) — elle donne en un écran de quoi jouer la
 * première partie, là où les chapitres sont là pour trancher un cas précis en
 * cours de soirée.
 */
export function ReglesRapides({
  onCompris,
  onChapitres,
  onRetour,
}: {
  onCompris: () => void
  onChapitres: () => void
  onRetour: () => void
}) {
  const t = useTheme()
  const tr = useT()
  const encre = usePanneauEncre()

  return (
    <Ecran>
      <EnTete
        titre={tr('regles.titre')}
        onRetour={onRetour}
        hauteur={90}
        droite={
          // Le seul ajout à la planche sur cet écran : sans lui, les sept
          // chapitres n'auraient pas de porte d'entrée. C'est la pastille que
          // R1–R7 portent déjà, donc rien de neuf à apprendre.
          <button
            type="button"
            onClick={onChapitres}
            style={{
              background: t.selBg,
              borderRadius: 12,
              padding: '9px 13px',
              border: 'none',
              font: `600 12px/1 ${TEXTE}`,
              letterSpacing: '0.06em',
              color: t.selFg,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {tr('regles.chapitres')}
          </button>
        }
      />
      <Corps pad="16px 16px 8px 16px" gap={8} scroll>
        <h1 style={{ font: `700 25px/1.15 ${TITRE}`, color: t.ink, margin: 0, textWrap: 'pretty' }}>
          {tr('rapides.titre')}
        </h1>

        <Panneau radius={16} pad="12px 14px">
          <span style={{ font: `500 13px/1.45 ${TEXTE}`, color: t.ink }}>
            {tr('rapides.resume')}
          </span>
        </Panneau>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {CARD_KEYS.map((k) => (
            <Panneau key={k} radius={16} pad={12} gap={6}>
              <Pictogramme card={k} size={46} />
              <span style={{ font: `700 14px/1 ${TITRE}`, color: t.ink }}>
                {tr(`carte.${k}` as const)}
              </span>
              <span style={{ font: `400 12px/1.35 ${TEXTE}`, color: t.ink2 }}>
                {tr(`carte.${k}.long` as const)}
              </span>
            </Panneau>
          ))}
        </div>

        <div
          style={{
            background: encre.bg,
            borderRadius: 16,
            boxShadow: `0 4px 0 ${encre.edge}`,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <span style={{ font: `700 16px/1.2 ${TITRE}`, color: encre.fg }}>
            {tr('rapides.verrou.titre')}
          </span>
          <span style={{ font: `400 13px/1.45 ${TEXTE}`, color: encre.detail }}>
            {tr('rapides.verrou.detail')}
          </span>
        </div>

        <div
          style={{
            background: t.ochre,
            borderRadius: 16,
            boxShadow: `0 4px 0 ${t.ochreEdge}`,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          <span style={{ font: `700 15px/1.2 ${TITRE}`, color: '#2E2418' }}>
            {tr('rapides.manches.titre')}
          </span>
          <span style={{ font: `400 13px/1.4 ${TEXTE}`, color: t.ochreInk }}>
            {tr('rapides.manches.detail')}
          </span>
        </div>

        <button
          type="button"
          onClick={onCompris}
          style={{
            marginTop: 'auto',
            height: 60,
            flex: '0 0 60px',
            borderRadius: 18,
            background: t.panel,
            boxShadow: `0 4px 0 ${t.edge}`,
            border: 'none',
            font: `700 17px/1 ${TITRE}`,
            color: t.ink,
            cursor: 'pointer',
          }}
        >
          {tr('rapides.compris')}
        </button>
      </Corps>
    </Ecran>
  )
}
