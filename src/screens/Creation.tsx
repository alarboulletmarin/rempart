import { TEXTE, TITRE } from '../theme'
import type { Format } from '../game/types'
import { MAX_SIEGES } from '../net/room'
import { useT } from '../i18n'
import { Icone } from '../ui/Icone'
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
          <Etiquette id="titre-joueurs">{tr('creation.joueurs.titre')}</Etiquette>
          {/*
           * Un vrai groupe de boutons radio.
           *
           * L'état « choisi » s'écrivait en toutes lettres sous le chiffre,
           * en plus du carton foncé qui le disait déjà — deux fois la même
           * chose, et un mot de plus à lire sur chacune des trois pastilles.
           * `aria-checked` le dit maintenant à qui ne voit pas l'écran, et une
           * coche discrète à qui le voit.
           */}
          <div style={{ display: 'flex', gap: 10 }} role="radiogroup" aria-labelledby="titre-joueurs">
            {[2, 3, 4].map((n) => {
              const choisi = n === places
              // Le mode équipes demande quatre murs.
              const possible = format === 'chacun' || n === 4
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={choisi}
                  onClick={() => possible && onPlaces(n)}
                  aria-disabled={!possible}
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
                  {choisi && <Icone nom="coche" size={13} color={t.ochre} />}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Etiquette id="titre-format">{tr('creation.format.titre')}</Etiquette>
          <div
            role="radiogroup"
            aria-labelledby="titre-format"
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
          <OptionFormat
            titre={tr('creation.format.chacun.titre')}
            detail={tr('creation.format.chacun.detail')}
            choisi={format === 'chacun'}
            onClick={() => onFormat('chacun')}
          />
          {/* Le deux contre deux demande quatre murs. Il changeait le nombre
              de joueurs dans le dos de qui le choisissait ; il dit maintenant
              pourquoi il n'est pas disponible, et ne fait rien tant que ce
              n'est pas réglé. */}
          <OptionFormat
            titre={tr('creation.format.equipes.titre')}
            detail={tr('creation.format.equipes.detail')}
            choisi={format === 'equipes'}
            empeche={places !== MAX_SIEGES ? tr('creation.format.equipes.raison') : undefined}
            onClick={() => onFormat('equipes')}
          />
          </div>
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
            <span style={{ font: `500 13px/1.4 ${TEXTE}`, color: t.ochreFort, flex: 1 }}>
              {tr('creation.cartesManche.detail')}
            </span>
            <span
              style={{
                width: 48,
                height: 28,
                borderRadius: 999,
                background: cartesManche ? t.ochreFort : t.ochreEdge,
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
  empeche,
  onClick,
}: {
  titre: string
  detail: string
  choisi: boolean
  /** La raison pour laquelle cette option ne peut pas être prise, s'il y en a une. */
  empeche?: string
  onClick: () => void
}) {
  const t = useTheme()
  return (
    <button
      type="button"
      role="radio"
      aria-checked={choisi}
      aria-disabled={!!empeche}
      onClick={() => !empeche && onClick()}
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
        cursor: empeche ? 'default' : 'pointer',
        opacity: empeche ? 0.6 : 1,
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
          <span style={{ marginLeft: 'auto', display: 'flex' }}>
            <Icone nom="coche" size={15} color={t.ochre} />
          </span>
        )}
      </span>
      <Texte size={13} weight={400} color={choisi ? t.table : t.ink2} style={{ lineHeight: 1.4 }}>
        {detail}
      </Texte>
      {empeche && (
        <Texte size={12} weight={500} color={t.clayText} style={{ lineHeight: 1.35 }}>
          {empeche}
        </Texte>
      )}
    </button>
  )
}
