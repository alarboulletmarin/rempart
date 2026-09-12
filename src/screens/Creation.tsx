import { TEXTE, TITRE } from '../theme'
import type { Format } from '../game/types'
import { useT } from '../i18n'
import { Bouton, Etiquette, Texte } from '../ui/atoms'
import { Corps, Ecran, EnTete } from '../ui/shell'
import { useTheme } from '../ui/theme'

/** 02 · Création de partie. */
export function Creation({
  places,
  format,
  cartesManche,
  nom,
  onNom,
  onPlaces,
  onFormat,
  onCartesManche,
  onOuvrir,
  onRetour,
}: {
  places: number
  format: Format
  cartesManche: boolean
  nom: string
  onNom: (n: string) => void
  onPlaces: (n: number) => void
  onFormat: (f: Format) => void
  onCartesManche: (on: boolean) => void
  onOuvrir: () => void
  onRetour: () => void
}) {
  const t = useTheme()
  const tr = useT()

  return (
    <Ecran>
      <EnTete titre={tr('creation.titre')} onRetour={onRetour} hauteur={102} />
      <Corps pad={20} gap={22} scroll>
        {/* Le nom se donne ici plutôt qu'au salon : la planche du salon ne
            porte que le code, les joueurs et les identités, et un champ de
            saisie de plus y aurait chassé les pastilles d'identité. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Etiquette>{tr('creation.nom.titre')}</Etiquette>
          <input
            value={nom}
            onChange={(e) => onNom(e.target.value)}
            maxLength={14}
            placeholder={tr('creation.nom.exemple')}
            aria-label={tr('creation.nom.aria')}
            style={{
              height: 60,
              borderRadius: 16,
              background: t.panel,
              boxShadow: `0 3px 0 ${t.edge}`,
              border: 'none',
              padding: '0 16px',
              font: `700 19px/1 ${TITRE}`,
              color: t.ink,
              width: '100%',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Etiquette>{tr('creation.joueurs.titre')}</Etiquette>
          <div style={{ display: 'flex', gap: 10 }}>
            {[2, 3, 4].map((n) => {
              const choisi = n === places
              // Le mode équipes demande quatre murs.
              const possible = format === 'chacun' || n === 4
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => possible && onPlaces(n)}
                  aria-pressed={choisi}
                  disabled={!possible}
                  style={{
                    flex: 1,
                    height: 72,
                    borderRadius: 16,
                    background: choisi ? t.selBg : t.panel,
                    boxShadow: `0 ${choisi ? 4 : 3}px 0 ${choisi ? t.selEdge : t.edge}`,
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    cursor: possible ? 'pointer' : 'default',
                    opacity: possible ? 1 : 0.5,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{ font: `700 27px/1 ${TITRE}`, color: choisi ? t.selFg : t.ink2 }}>
                    {n}
                  </span>
                  {choisi && (
                    <Etiquette size={9} color={t.ink2} style={{ letterSpacing: '0.1em' }}>
                      {tr('creation.choisi')}
                    </Etiquette>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Etiquette>{tr('creation.format.titre')}</Etiquette>
          <OptionFormat
            titre={tr('creation.format.chacun.titre')}
            detail={tr('creation.format.chacun.detail')}
            choisi={format === 'chacun'}
            onClick={() => onFormat('chacun')}
          />
          <OptionFormat
            titre={tr('creation.format.equipes.titre')}
            detail={tr('creation.format.equipes.detail')}
            choisi={format === 'equipes'}
            onClick={() => {
              onFormat('equipes')
              onPlaces(4)
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Etiquette>{tr('creation.cartesManche.titre')}</Etiquette>
          <button
            type="button"
            onClick={() => onCartesManche(!cartesManche)}
            aria-pressed={cartesManche}
            style={{
              borderRadius: 16,
              background: t.ochre,
              boxShadow: `0 4px 0 ${t.ochreEdge}`,
              border: 'none',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              textAlign: 'left',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ font: `500 13px/1.4 ${TEXTE}`, color: '#2E2418', flex: 1 }}>
              {tr('creation.cartesManche.detail')}
            </span>
            <span
              style={{
                width: 48,
                height: 28,
                borderRadius: 999,
                background: cartesManche ? '#2E2418' : t.ochreEdge,
                display: 'flex',
                alignItems: 'center',
                justifyContent: cartesManche ? 'flex-end' : 'flex-start',
                padding: 3,
                flex: '0 0 48px',
              }}
            >
              <span
                style={{ width: 22, height: 22, borderRadius: '50%', background: t.panel }}
              />
            </span>
          </button>
        </div>

        <Bouton onClick={onOuvrir} style={{ marginTop: 'auto' }}>
          {tr('creation.ouvrir')}
        </Bouton>
      </Corps>
    </Ecran>
  )
}

function OptionFormat({
  titre,
  detail,
  choisi,
  onClick,
}: {
  titre: string
  detail: string
  choisi: boolean
  onClick: () => void
}) {
  const t = useTheme()
  const tr = useT()
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={choisi}
      style={{
        borderRadius: 16,
        background: choisi ? t.selBg : t.panel,
        boxShadow: `0 ${choisi ? 4 : 3}px 0 ${choisi ? t.selEdge : t.edge}`,
        border: 'none',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        textAlign: 'left',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Une pastille pleine ocre pour le choix retenu : de la matière, pas un bord. */}
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: choisi ? t.ochre : t.edge,
            flex: '0 0 14px',
          }}
        />
        <span style={{ font: `700 16px/1 ${TITRE}`, color: choisi ? t.selFg : t.ink }}>{titre}</span>
        {choisi && (
          <Etiquette size={9} color={t.ink2} style={{ letterSpacing: '0.1em', marginLeft: 'auto' }}>
            {tr('creation.choisi')}
          </Etiquette>
        )}
      </span>
      <Texte size={13} weight={400} color={choisi ? t.table : t.ink2} style={{ lineHeight: 1.4 }}>
        {detail}
      </Texte>
    </button>
  )
}
