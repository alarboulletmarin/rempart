import { useMemo, useState } from 'react'
import { SAFE_TOP, TEXTE, TITRE } from '../theme'
import {
  EDGE_CASES,
  RESOLUTION_ORDER,
  SOMMAIRE,
  TURN_STEPS,
  type ChapitreId,
} from '../game/content'
import { ROUND_CARD_IDS } from '../game/roundCards'
import { CARD_KEYS, WALL_SIZE, type RoundCardId, type Slot } from '../game/types'
import { useT, type Cle } from '../i18n'
import { Etiquette, Forme, Mur, Panneau, Texte } from '../ui/atoms'
import { Pictogramme } from '../ui/Pictogramme'
import { Corps, Ecran, EnTete, Retour } from '../ui/shell'
import { useTheme } from '../ui/theme'

const MUR_PLEIN: Slot[] = Array.from({ length: WALL_SIZE }, () => 'intact')

/**
 * R0 · Sommaire des règles.
 *
 * Aucun ordre imposé et aucun « Suivant » : huit entrées, chacune avec sa ligne
 * de résumé, plus une recherche. On saute de n'importe où à n'importe où.
 */
export function ReglesSommaire({
  onChapitre,
  onRetour,
}: {
  onChapitre: (id: ChapitreId) => void
  onRetour: () => void
}) {
  const t = useTheme()
  const tr = useT()
  const [q, setQ] = useState('')

  /*
   * La recherche porte sur le texte AFFICHÉ, donc sur celui de la langue
   * courante : chercher « lock » en anglais doit trouver le chapitre du
   * verrou, et chercher « verrou » en français aussi. Comparer des clés
   * n'aurait rien trouvé dans ni l'une ni l'autre.
   */
  const resultats = useMemo(() => {
    const q2 = q.trim().toLowerCase()
    if (!q2) return { chapitres: SOMMAIRE, cartes: [] as readonly RoundCardId[] }
    const dit = (cle: Cle) => tr(cle).toLowerCase()
    return {
      chapitres: SOMMAIRE.filter(
        (id) =>
          dit(`regles.sommaire.${id}.titre`).includes(q2) ||
          dit(`regles.sommaire.${id}.detail`).includes(q2),
      ),
      cartes: ROUND_CARD_IDS.filter(
        (id) => dit(`manche.${id}.nom`).includes(q2) || dit(`manche.${id}.detail`).includes(q2),
      ),
    }
  }, [q, tr])

  return (
    <Ecran>
      <EnTete
        titre={tr('regles.titre')}
        onRetour={onRetour}
        hauteur={104}
        droite={
          <Etiquette size={11} style={{ letterSpacing: '0.08em' }}>
            {tr('regles.duree')}
          </Etiquette>
        }
      />
      <Corps pad="18px 16px" gap={10} scroll>
        <Panneau radius={16} pad="15px 16px" style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
          {/* Le repère de recherche est un anneau de matière, pas un glyphe de police. */}
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              boxShadow: `inset 0 0 0 2px ${t.name === 'etabli' ? '#8A7B63' : t.ink3}`,
              flex: '0 0 16px',
            }}
            aria-hidden="true"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tr('regles.chercher')}
            aria-label={tr('regles.chercher.aria')}
            style={{
              border: 'none',
              background: 'transparent',
              font: `500 14px/1 ${TEXTE}`,
              color: t.ink,
              flex: 1,
              minWidth: 0,
              outline: 'none',
            }}
          />
        </Panneau>

        {resultats.chapitres.map((id) => (
          <Panneau
            key={id}
            radius={16}
            pad="14px 16px"
            onClick={() => onChapitre(id)}
            style={{ gap: 3 }}
          >
            <span style={{ font: `700 17px/1 ${TITRE}`, color: t.ink }}>
              {tr(`regles.sommaire.${id}.titre`)}
            </span>
            <span style={{ font: `400 12px/1.35 ${TEXTE}`, color: t.ink2, textWrap: 'pretty' }}>
              {tr(`regles.sommaire.${id}.detail`)}
            </span>
          </Panneau>
        ))}

        {resultats.cartes.length > 0 && (
          <>
            <Etiquette style={{ marginTop: 4 }}>{tr('regles.trouvees')}</Etiquette>
            {resultats.cartes.map((id) => (
              <Panneau
                key={id}
                radius={16}
                pad="14px 16px"
                onClick={() => onChapitre('manches')}
                style={{ gap: 3 }}
              >
                <span style={{ font: `700 16px/1 ${TITRE}`, color: t.ink }}>
                  {tr(`manche.${id}.nom`)}
                </span>
                <span style={{ font: `400 12px/1.35 ${TEXTE}`, color: t.ink2 }}>
                  {tr(`manche.${id}.detail`)}
                </span>
              </Panneau>
            ))}
          </>
        )}

        {resultats.chapitres.length === 0 && resultats.cartes.length === 0 && (
          <Texte size={14} style={{ padding: '8px 2px' }}>
            {tr('regles.rien')}
          </Texte>
        )}

        <Texte size={12} style={{ textAlign: 'center', marginTop: 'auto', lineHeight: 1.45 }}>
          {tr('regles.sansOrdre')}
        </Texte>
      </Corps>
    </Ecran>
  )
}

/** R1–R7 et C1 · Un chapitre de règles. */
export function ReglesChapitre({
  chapitre,
  onSommaire,
  onRetour,
}: {
  chapitre: ChapitreId
  onSommaire: () => void
  onRetour: () => void
}) {
  const t = useTheme()
  const tr = useT()

  if (chapitre === 'manches') return <CartesDeManche onRetour={onRetour} onSommaire={onSommaire} />

  return (
    <Ecran>
      <EnTete
        titre={tr(`regles.chapitre.${chapitre}`)}
        onRetour={onRetour}
        hauteur={106}
        pad={16}
        droite={
          <button
            type="button"
            onClick={onSommaire}
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
      <Corps pad={20} gap={chapitre === 'cas' ? 11 : 14} scroll>
        {chapitre === 'but' && <ChapitreBut />}
        {chapitre === 'manche' && <ChapitreManche />}
        {chapitre === 'verrou' && <ChapitreVerrou />}
        {chapitre === 'cartes' && <ChapitreCartes />}
        {chapitre === 'ordre' && <ChapitreOrdre />}
        {chapitre === 'cas' && <ChapitreCas />}
        {chapitre === 'fin' && <ChapitreFin />}
      </Corps>
    </Ecran>
  )
}

/* ---------------------------------------------------------- chapitres */

function GrosTitre({ children }: { children: React.ReactNode }) {
  const t = useTheme()
  return (
    <h1 style={{ font: `700 34px/1.1 ${TITRE}`, color: t.ink, margin: 0, textWrap: 'pretty' }}>
      {children}
    </h1>
  )
}

function Fiche({ children }: { children: React.ReactNode }) {
  return (
    <Panneau radius={16} pad="14px 16px">
      <span style={{ font: `500 14px/1.45 ${TEXTE}`, textWrap: 'pretty' }}>{children}</span>
    </Panneau>
  )
}

function ChapitreBut() {
  const tr = useT()
  return (
    <>
      <GrosTitre>{tr('regles.but.titre')}</GrosTitre>
      <Mur wall={MUR_PLEIN} ci={0} height={66} gap={8} radius={9} chant={8} />
      <Texte size={15}>{tr('regles.but.mur')}</Texte>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Fiche>{tr('regles.but.cartes')}</Fiche>
        <Fiche>{tr('regles.but.duree')}</Fiche>
        <Fiche>{tr('regles.but.joueurs')}</Fiche>
      </div>
    </>
  )
}

function ChapitreManche() {
  const t = useTheme()
  const tr = useT()
  return (
    <>
      {TURN_STEPS.map((n) => (
        <Panneau key={n} radius={18} pad={16} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
          <span
            style={{
              width: 40,
              height: 40,
              flex: '0 0 40px',
              borderRadius: 13,
              background: t.selBg,
              boxShadow: `0 3px 0 ${t.selEdge}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              font: `700 20px/1 ${TITRE}`,
              color: t.selFg,
            }}
          >
            {n}
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ font: `700 20px/1 ${TITRE}`, color: t.ink }}>
              {tr(`regles.tour.${n}.titre`)}
            </span>
            <span style={{ font: `400 14px/1.45 ${TEXTE}`, color: t.ink2, textWrap: 'pretty' }}>
              {tr(`regles.tour.${n}.detail`)}
            </span>
          </span>
        </Panneau>
      ))}
      <div
        style={{
          background: t.ochre,
          borderRadius: 16,
          boxShadow: `0 4px 0 ${t.ochreEdge}`,
          padding: '14px 16px',
          font: `500 14px/1.45 ${TEXTE}`,
          color: t.ochreFort,
        }}
      >
        {tr('regles.tour.duree')}
      </div>
    </>
  )
}

function ChapitreVerrou() {
  const t = useTheme()
  const tr = useT()
  return (
    <>
      <h1 style={{ font: `700 30px/1.12 ${TITRE}`, color: t.ink, margin: 0, textWrap: 'pretty' }}>
        {tr('regles.verrou.titre')}
      </h1>
      <Panneau radius={18} pad={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'center' }}>
          <Etiquette size={10} style={{ letterSpacing: '0.1em' }}>
            {tr('regles.verrou.manche', { n: 4 })}
          </Etiquette>
          <span
            style={{
              background: t.clayText,
              borderRadius: 12,
              padding: '10px 14px',
              font: `700 15px/1 ${TITRE}`,
              color: t.panel,
            }}
          >
            {tr('carte.bloquer')}
          </span>
        </span>
        {/* Un chant, pas une flèche : même vocabulaire que les briques. */}
        <span style={{ width: 28, height: 6, borderRadius: 3, background: t.edge, flex: '0 0 28px' }} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'center' }}>
          <Etiquette size={10} style={{ letterSpacing: '0.1em' }}>
            {tr('regles.verrou.manche', { n: 5 })}
          </Etiquette>
          <span
            style={{
              background: t.cardOff,
              borderRadius: 12,
              padding: '10px 14px',
              font: `700 15px/1 ${TITRE}`,
              color: t.ink2,
            }}
          >
            {tr('carte.bloquer')}
          </span>
          <Etiquette size={10} color={t.clayText} style={{ letterSpacing: '0.08em' }}>
            {tr('regles.verrou.interdite')}
          </Etiquette>
        </span>
      </Panneau>
      <Texte size={15}>
        {tr('regles.verrou.detail')}
      </Texte>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Fiche>{tr('regles.verrou.ligne')}</Fiche>
        <Fiche>{tr('regles.verrou.bluff')}</Fiche>
      </div>
    </>
  )
}

function ChapitreCartes() {
  const t = useTheme()
  const tr = useT()
  return (
    <>
      {CARD_KEYS.map((k) => (
        <Panneau
          key={k}
          radius={18}
          pad={14}
          style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}
        >
          <Pictogramme card={k} size={52} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 0 }}>
            <span style={{ font: `700 19px/1 ${TITRE}`, color: t.ink }}>
              {tr(`carte.${k}` as const)}
            </span>
            <span style={{ font: `600 14px/1.35 ${TEXTE}`, color: t.ink, textWrap: 'pretty' }}>
              {tr(`carte.${k}.effet` as const)}
            </span>
            {/* Le « quand la jouer » reste dans la planche de référence :
                sur 844 px, les quatre cartes ne tiennent qu'avec effet + coût. */}
            <span style={{ font: `400 12px/1.35 ${TEXTE}`, color: t.ink2, textWrap: 'pretty' }}>
              {tr(`carte.${k}.cout` as const)}
            </span>
          </span>
        </Panneau>
      ))}
    </>
  )
}

function ChapitreOrdre() {
  const t = useTheme()
  const tr = useT()
  return (
    <>
      <Texte size={15}>{tr('regles.ordre.intro')}</Texte>
      {RESOLUTION_ORDER.map((n) => (
        <Panneau key={n} radius={18} pad={15} style={{ flexDirection: 'row', gap: 13, alignItems: 'flex-start' }}>
          <span
            style={{
              width: 32,
              height: 32,
              flex: '0 0 32px',
              borderRadius: 11,
              background: t.clayText,
              boxShadow: `0 3px 0 ${t.clayTextEdge}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              font: `700 16px/1 ${TITRE}`,
              color: t.panel,
            }}
          >
            {n}
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
            <span style={{ font: `700 17px/1 ${TITRE}`, color: t.ink }}>
              {tr(`regles.ordre.${n}.titre`)}
            </span>
            <span style={{ font: `400 13px/1.4 ${TEXTE}`, color: t.ink2, textWrap: 'pretty' }}>
              {tr(`regles.ordre.${n}.detail`)}
            </span>
          </span>
        </Panneau>
      ))}
    </>
  )
}

function ChapitreCas() {
  const t = useTheme()
  const tr = useT()
  return (
    <>
      {EDGE_CASES.map((id) => (
        <Panneau key={id} radius={16} pad="13px 15px" gap={4}>
          <span style={{ font: `700 16px/1.1 ${TITRE}`, color: t.ink }}>
            {tr(`regles.cas.${id}.titre`)}
          </span>
          <span style={{ font: `400 13px/1.4 ${TEXTE}`, color: t.ink2, textWrap: 'pretty' }}>
            {tr(`regles.cas.${id}.detail`)}
          </span>
        </Panneau>
      ))}
    </>
  )
}

function ChapitreFin() {
  const t = useTheme()
  const tr = useT()
  return (
    <>
      <GrosTitre>{tr('regles.fin.titre')}</GrosTitre>
      <Texte size={15}>{tr('regles.fin.detail')}</Texte>
      <Panneau radius={18} pad={16} gap={11}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <Forme ci={1} size={22} />
          <span style={{ font: `700 19px/1 ${TITRE}`, color: t.ink }}>
            {tr('regles.fin.exemple.nom')}
          </span>
          <span style={{ font: `600 13px/1 ${TEXTE}`, color: t.ink2, marginLeft: 'auto' }}>
            {tr('regles.fin.exemple.score', { briques: tr.n('brique', WALL_SIZE) })}
          </span>
        </div>
        <Mur wall={MUR_PLEIN} ci={1} height={32} />
      </Panneau>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Fiche>{tr('regles.fin.sansBonus')}</Fiche>
        <Fiche>{tr('regles.fin.rejouer')}</Fiche>
      </div>
    </>
  )
}

/** C1 · Les neuf cartes de manche. */
export function CartesDeManche({
  onRetour,
  onSommaire,
}: {
  onRetour: () => void
  onSommaire?: () => void
}) {
  const t = useTheme()
  const tr = useT()
  return (
    <Ecran>
      <div
        style={{
          flex: '0 0 auto',
          // 94 sur la planche, barre d'état comprise : voir `EnTete`.
          minHeight: `calc(${SAFE_TOP} + 50px)`,
          background: t.ochre,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: `${SAFE_TOP} 18px 0 18px`,
        }}
      >
        {/* Sur l'ocre, la pastille ne suit pas le thème : la bande est claire
            dans les deux, donc ce qui s'y pose est sombre dans les deux. En
            `panel`, elle devenait du brun sur du brun en veillée. */}
        <Retour onClick={onRetour} bg={t.ochreFort} fg={t.ochreFortInk} />
        <div style={{ font: `700 21px/1 ${TITRE}`, color: t.ochreFort, whiteSpace: 'nowrap' }}>
          {tr('regles.chapitre.manches')}
        </div>
        {onSommaire && (
          <button
            type="button"
            onClick={onSommaire}
            style={{
              marginLeft: 'auto',
              background: t.ochreFort,
              borderRadius: 12,
              padding: '9px 13px',
              border: 'none',
              font: `600 12px/1 ${TEXTE}`,
              letterSpacing: '0.06em',
              color: t.ochreFortInk,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {tr('regles.chapitres')}
          </button>
        )}
      </div>
      <Corps pad="16px 16px 8px 16px" gap={8} scroll>
        <Texte size={13} style={{ padding: '0 2px', lineHeight: 1.4 }}>
          {tr('regles.manches.intro')}
        </Texte>
        {ROUND_CARD_IDS.map((id) => (
          <Panneau
            key={id}
            radius={14}
            pad="11px 13px"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            {/* Le chant ocre : le repère visuel des cartes de manche. */}
            <span
              style={{
                width: 10,
                height: 26,
                flex: '0 0 10px',
                borderRadius: 4,
                background: t.ochre,
                boxShadow: `inset 0 -4px 0 ${t.ochreEdge}`,
              }}
            />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
              <span style={{ font: `700 16px/1 ${TITRE}`, color: t.ink }}>
                {tr(`manche.${id}.nom`)}
              </span>
              <span style={{ font: `400 12px/1.3 ${TEXTE}`, color: t.ink2, textWrap: 'pretty' }}>
                {tr(`manche.${id}.detail`)}
              </span>
            </span>
            <Etiquette size={9} style={{ letterSpacing: '0.08em' }}>
              {tr(`manche.${id}.axe`)}
            </Etiquette>
          </Panneau>
        ))}
      </Corps>
    </Ecran>
  )
}
