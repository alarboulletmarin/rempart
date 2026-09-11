import { useMemo, useState } from 'react'
import { TEXTE, TITRE } from '../theme'
import {
  CARD_DETAIL,
  CHAPITRE_TITRE,
  EDGE_CASES,
  RESOLUTION_ORDER,
  SOMMAIRE,
  TURN_STEPS,
  type ChapitreId,
} from '../game/content'
import { ROUND_CARDS } from '../game/roundCards'
import { CARD_LABEL, WALL_SIZE, type Slot } from '../game/types'
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
  const [q, setQ] = useState('')

  const resultats = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return { chapitres: SOMMAIRE, cartes: [] as typeof ROUND_CARDS }
    const norm = (x: string) => x.toLowerCase()
    return {
      chapitres: SOMMAIRE.filter((c) => norm(c.t).includes(s) || norm(c.d).includes(s)),
      cartes: ROUND_CARDS.filter((c) => norm(c.n).includes(s) || norm(c.d).includes(s)),
    }
  }, [q])

  return (
    <Ecran>
      <EnTete
        titre="Règles"
        onRetour={onRetour}
        hauteur={104}
        droite={
          <Etiquette size={11} style={{ letterSpacing: '0.08em' }}>
            4 min de lecture
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
            placeholder="Chercher une règle, une carte…"
            aria-label="Chercher une règle ou une carte"
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

        {resultats.chapitres.map((s) => (
          <Panneau
            key={s.id}
            radius={16}
            pad="14px 16px"
            onClick={() => onChapitre(s.id)}
            style={{ gap: 3 }}
          >
            <span style={{ font: `700 17px/1 ${TITRE}`, color: t.ink }}>{s.t}</span>
            <span style={{ font: `400 12px/1.35 ${TEXTE}`, color: t.ink2, textWrap: 'pretty' }}>
              {s.d}
            </span>
          </Panneau>
        ))}

        {resultats.cartes.length > 0 && (
          <>
            <Etiquette style={{ marginTop: 4 }}>Cartes de manche trouvées</Etiquette>
            {resultats.cartes.map((c) => (
              <Panneau
                key={c.id}
                radius={16}
                pad="14px 16px"
                onClick={() => onChapitre('manches')}
                style={{ gap: 3 }}
              >
                <span style={{ font: `700 16px/1 ${TITRE}`, color: t.ink }}>{c.n}</span>
                <span style={{ font: `400 12px/1.35 ${TEXTE}`, color: t.ink2 }}>{c.d}</span>
              </Panneau>
            ))}
          </>
        )}

        {resultats.chapitres.length === 0 && resultats.cartes.length === 0 && (
          <Texte size={14} style={{ padding: '8px 2px' }}>
            Rien à ce mot-là. Essaie « verrou », « piège » ou « égalité ».
          </Texte>
        )}

        <Texte size={12} style={{ textAlign: 'center', marginTop: 'auto', lineHeight: 1.45 }}>
          Chaque chapitre reste accessible depuis n’importe quel autre. Aucun ordre imposé.
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

  if (chapitre === 'manches') return <CartesDeManche onRetour={onRetour} onSommaire={onSommaire} />

  return (
    <Ecran>
      <EnTete
        titre={CHAPITRE_TITRE[chapitre]}
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
            Chapitres
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
  return (
    <>
      <GrosTitre>Garde le plus de briques debout au bout de dix manches.</GrosTitre>
      <Mur wall={MUR_PLEIN} ci={0} height={66} gap={8} radius={9} chant={8} />
      <Texte size={15}>
        Ton mur, c’est ton score : cinq briques au départ, lisibles sans chiffre. On ne construit
        pas, on protège.
      </Texte>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Fiche>
          Quatre cartes identiques pour tout le monde. Aucune pioche : le seul inconnu, c’est le
          choix des autres.
        </Fiche>
        <Fiche>
          Dix manches, quatre minutes. Personne n’attend son tour : tout le monde choisit en même
          temps.
        </Fiche>
        <Fiche>De deux à quatre joueurs, ou en équipes de deux avec un score commun.</Fiche>
      </div>
    </>
  )
}

function ChapitreManche() {
  const t = useTheme()
  return (
    <>
      {TURN_STEPS.map((s) => (
        <Panneau key={s.n} radius={18} pad={16} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
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
            {s.n}
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ font: `700 20px/1 ${TITRE}`, color: t.ink }}>{s.t}</span>
            <span style={{ font: `400 14px/1.45 ${TEXTE}`, color: t.ink2, textWrap: 'pretty' }}>
              {s.d}
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
          color: '#2E2418',
        }}
      >
        Une manche dure le temps que le plus lent choisisse : douze à vingt secondes.
      </div>
    </>
  )
}

function ChapitreVerrou() {
  const t = useTheme()
  return (
    <>
      <h1 style={{ font: `700 30px/1.12 ${TITRE}`, color: t.ink, margin: 0, textWrap: 'pretty' }}>
        La carte que tu joues t’est interdite la manche suivante.
      </h1>
      <Panneau radius={18} pad={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'center' }}>
          <Etiquette size={10} style={{ letterSpacing: '0.1em' }}>
            manche 4
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
            Bloquer
          </span>
        </span>
        {/* Un chant, pas une flèche : même vocabulaire que les briques. */}
        <span style={{ width: 28, height: 6, borderRadius: 3, background: t.edge, flex: '0 0 28px' }} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'center' }}>
          <Etiquette size={10} style={{ letterSpacing: '0.1em' }}>
            manche 5
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
            Bloquer
          </span>
          <Etiquette size={10} color={t.clayText} style={{ letterSpacing: '0.08em' }}>
            interdite
          </Etiquette>
        </span>
      </Panneau>
      <Texte size={15}>
        C’est la seule règle qui fait le jeu : après une défense, tu es toujours à découvert. Bloquer
        deux fois de suite est impossible.
      </Texte>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Fiche>
          Ta ligne affiche ce que tu viens de jouer : les autres savent ce que tu ne peux plus jouer.
        </Fiche>
        <Fiche>
          Trois choix au lieu de quatre — et tout le monde le sait. C’est là que le bluff commence.
        </Fiche>
      </div>
    </>
  )
}

function ChapitreCartes() {
  const t = useTheme()
  return (
    <>
      {CARD_DETAIL.map((c) => (
        <Panneau
          key={c.k}
          radius={18}
          pad={14}
          style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}
        >
          <Pictogramme card={c.k} size={52} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 0 }}>
            <span style={{ font: `700 19px/1 ${TITRE}`, color: t.ink }}>{CARD_LABEL[c.k]}</span>
            <span style={{ font: `600 14px/1.35 ${TEXTE}`, color: t.ink, textWrap: 'pretty' }}>
              {c.effect}
            </span>
            {/* Le « quand la jouer » reste dans la planche de référence :
                sur 844 px, les quatre cartes ne tiennent qu'avec effet + coût. */}
            <span style={{ font: `400 12px/1.35 ${TEXTE}`, color: t.ink2, textWrap: 'pretty' }}>
              {c.cost}
            </span>
          </span>
        </Panneau>
      ))}
    </>
  )
}

function ChapitreOrdre() {
  const t = useTheme()
  return (
    <>
      <Texte size={15}>Toujours le même ordre, quels que soient les joueurs.</Texte>
      {RESOLUTION_ORDER.map((o) => (
        <Panneau key={o.n} radius={18} pad={15} style={{ flexDirection: 'row', gap: 13, alignItems: 'flex-start' }}>
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
            {o.n}
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
            <span style={{ font: `700 17px/1 ${TITRE}`, color: t.ink }}>{o.t}</span>
            <span style={{ font: `400 13px/1.4 ${TEXTE}`, color: t.ink2, textWrap: 'pretty' }}>
              {o.d}
            </span>
          </span>
        </Panneau>
      ))}
    </>
  )
}

function ChapitreCas() {
  const t = useTheme()
  return (
    <>
      {EDGE_CASES.map((e) => (
        <Panneau key={e.t} radius={16} pad="13px 15px" gap={4}>
          <span style={{ font: `700 16px/1.1 ${TITRE}`, color: t.ink }}>{e.t}</span>
          <span style={{ font: `400 13px/1.4 ${TEXTE}`, color: t.ink2, textWrap: 'pretty' }}>
            {e.d}
          </span>
        </Panneau>
      ))}
    </>
  )
}

function ChapitreFin() {
  const t = useTheme()
  return (
    <>
      <GrosTitre>Le mur est le score.</GrosTitre>
      <Texte size={15}>
        À la fin de la dixième manche, on compte les briques debout. Le plus haut mur gagne ; en
        équipes, on additionne les deux murs.
      </Texte>
      <Panneau radius={18} pad={16} gap={11}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <Forme ci={1} size={22} />
          <span style={{ font: `700 19px/1 ${TITRE}`, color: t.ink }}>Malo</span>
          <span style={{ font: `600 13px/1 ${TEXTE}`, color: t.ink2, marginLeft: 'auto' }}>
            5 briques · gagne
          </span>
        </div>
        <Mur wall={MUR_PLEIN} ci={1} height={32} />
      </Panneau>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Fiche>
          Aucun bonus, aucun malus : le classement est déjà à l’écran depuis la première manche.
        </Fiche>
        <Fiche>
          « Rejouer avec les mêmes » relance aussitôt : même salon, murs remis à cinq.
        </Fiche>
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
  return (
    <Ecran>
      <div
        style={{
          flex: '0 0 auto',
          minHeight: 94,
          background: t.ochre,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: `max(44px, env(safe-area-inset-top)) 18px 0 18px`,
        }}
      >
        <Retour onClick={onRetour} bg={t.panel} fg={t.ochreInk} />
        <div style={{ font: `700 21px/1 ${TITRE}`, color: '#2E2418', whiteSpace: 'nowrap' }}>
          Cartes de manche
        </div>
        {onSommaire && (
          <button
            type="button"
            onClick={onSommaire}
            style={{
              marginLeft: 'auto',
              background: '#2E2418',
              borderRadius: 12,
              padding: '9px 13px',
              border: 'none',
              font: `600 12px/1 ${TEXTE}`,
              letterSpacing: '0.06em',
              color: t.panel,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            Chapitres
          </button>
        )}
      </div>
      <Corps pad="16px 16px 8px 16px" gap={8} scroll>
        <Texte size={13} style={{ padding: '0 2px', lineHeight: 1.4 }}>
          Une seule manche, la même pour tout le monde, jamais deux fois par partie.
        </Texte>
        {ROUND_CARDS.map((r) => (
          <Panneau
            key={r.id}
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
              <span style={{ font: `700 16px/1 ${TITRE}`, color: t.ink }}>{r.n}</span>
              <span style={{ font: `400 12px/1.3 ${TEXTE}`, color: t.ink2, textWrap: 'pretty' }}>
                {r.d}
              </span>
            </span>
            <Etiquette size={9} style={{ letterSpacing: '0.08em' }}>
              {r.axis}
            </Etiquette>
          </Panneau>
        ))}
      </Corps>
    </Ecran>
  )
}
