import { useEffect, useState } from 'react'
import { TEXTE, TITRE } from '../theme'
import type { Player } from '../game/types'
import { resteAvantAbsence } from '../net/presence'
import { Etiquette, Scribble, Texte } from '../ui/atoms'
import { useTheme } from '../ui/theme'

/**
 * 12 · Cas limite — un joueur se déconnecte en pleine manche.
 *
 * La manche est mise en pause : le plateau reste visible derrière, en retrait,
 * pour que personne ne perde le fil de la partie.
 */
export function FeuilleDeconnexion({
  joueur,
  depuis,
  hautDuVoile = 0,
  onContinuer,
  onQuitter,
}: {
  joueur: Player
  /** L'instant réel du départ. Le décompte s'y accroche plutôt qu'à un
   *  compteur local, qui repartirait de zéro au moindre rendu. */
  depuis?: number
  /** L'en-tête reste net : le voile ne commence qu'en dessous. */
  hautDuVoile?: number
  onContinuer: () => void
  onQuitter: () => void
}) {
  const t = useTheme()
  const debut = depuis ?? Date.now()
  const [reste, setReste] = useState(() => resteAvantAbsence(debut, Date.now()))
  const [attend, setAttend] = useState(true)

  useEffect(() => {
    if (!attend) return
    const id = setInterval(() => setReste(resteAvantAbsence(debut, Date.now())), 500)
    return () => clearInterval(id)
  }, [attend, debut])

  const feminin = /[ae]$/i.test(joueur.name)
  const minutes = Math.floor(reste / 60)
  const secondes = String(reste % 60).padStart(2, '0')

  return (
    <>
      {/* Le plateau reste lisible derrière, mis en retrait — mais l'en-tête
          garde son contraste : on doit toujours savoir où en est la partie. */}
      <div
        style={{
          position: 'absolute',
          top: `calc(${hautDuVoile}px + max(0px, env(safe-area-inset-top)))`,
          left: 0,
          right: 0,
          bottom: 0,
          background: t.table,
          opacity: 0.55,
          pointerEvents: 'none',
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${joueur.name} s’est déconnecté${feminin ? 'e' : ''}`}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          background: t.panel,
          borderRadius: '26px 26px 30px 30px',
          padding: '22px 20px calc(24px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Scribble nom="pause" width={56} height={46} />
          <div style={{ font: `700 24px/1.1 ${TITRE}`, color: t.ink, textWrap: 'pretty' }}>
            {joueur.name} s’est déconnecté{feminin ? 'e' : ''}.
          </div>
        </div>

        <Texte size={14}>
          La manche est mise en pause. {feminin ? 'Si elle ne revient pas' : 'S’il ne revient pas'},
          son mur reste en place et ses cartes ne sont plus jouées — la partie continue.
        </Texte>

        {attend && (
          <div
            style={{
              background: t.panel2,
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ font: `700 21px/1 ${TITRE}`, color: t.clayText }}>
              {minutes}:{secondes}
            </span>
            <Texte size={12} style={{ flex: 1, lineHeight: 1.35 }}>
              avant de continuer sans {feminin ? 'elle' : 'lui'}
            </Texte>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onContinuer}
            style={{
              flex: 1,
              height: 56,
              borderRadius: 16,
              background: t.clayText,
              boxShadow: `0 4px 0 ${t.clayTextEdge}`,
              border: 'none',
              font: `700 15px/1 ${TITRE}`,
              color: t.panel,
              cursor: 'pointer',
            }}
          >
            Continuer sans {feminin ? 'elle' : 'lui'}
          </button>
          <button
            type="button"
            onClick={() => (attend ? setAttend(false) : onQuitter())}
            style={{
              flex: 1,
              height: 56,
              borderRadius: 16,
              background: t.cardOff,
              border: 'none',
              font: `600 12px/1 ${TEXTE}`,
              letterSpacing: '0.06em',
              color: t.ink2,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {attend ? 'Attendre' : 'Quitter'}
          </button>
        </div>

        {!attend && (
          <Etiquette size={10} style={{ textAlign: 'center', letterSpacing: '0.08em' }}>
            on garde sa place aussi longtemps qu’il faut
          </Etiquette>
        )}
      </div>
    </>
  )
}
