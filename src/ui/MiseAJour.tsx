import { TEXTE, TITRE } from '../theme'
import { useT } from '../i18n'
import { Bouton } from './atoms'
import { useMiseAJour } from './miseajour'
import { useTheme } from './theme'

/**
 * Le bandeau de mise à jour.
 *
 * Une version est en cache et attend. Le refus est proposé aussi franchement
 * que l'acceptation : pas de compte à rebours, pas d'urgence inventée, et
 * « Plus tard » ne revient pas à la charge avant le prochain démarrage.
 *
 * Il se pose **dans le flux**, en bas du cadre, comme le bandeau de lien se
 * pose en haut : il ne recouvre donc jamais un mur ni un bouton. Sur l'écran
 * de jeu, la liste des murs se resserre — elle défile déjà — plutôt que de
 * passer sous une barre flottante.
 *
 * En partie, il dit une chose de plus, et c'est la question qu'on se pose
 * avant de cliquer : recharger ne coûte pas la partie. L'identité de
 * l'appareil survit au rechargement, donc le siège est repris sans rien
 * demander à personne (voir `net/admission.ts`).
 */
export function MiseAJour({ enPartie }: { enPartie: boolean }) {
  const { attend, appliquer, ecarter } = useMiseAJour()

  if (!attend) return null

  return <VueMiseAJour enPartie={enPartie} onRecharger={appliquer} onPlusTard={ecarter} />
}

/**
 * Le bandeau seul, sans le service worker derrière.
 *
 * Il est à part pour une raison : la galerie (`apercu.tsx`) doit pouvoir le
 * relire dans les deux thèmes et les deux langues, or aucune version n'attend
 * jamais dans une galerie. Le brancher sur le magasin l'y rendrait invisible,
 * c'est-à-dire jamais relu.
 */
export function VueMiseAJour({
  enPartie,
  onRecharger,
  onPlusTard,
}: {
  enPartie: boolean
  onRecharger: () => void
  onPlusTard: () => void
}) {
  const t = useTheme()
  const tr = useT()

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        flex: '0 0 auto',
        background: t.panel,
        // Le même chant que les autres pièces posées : de l'épaisseur, jamais
        // un contour.
        boxShadow: `0 -3px 0 ${t.edge}`,
        padding: '12px 16px 14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ font: `700 15px/1.2 ${TITRE}`, color: t.ink }}>{tr('maj.titre')}</div>
        {enPartie && (
          <div style={{ font: `500 12px/1.35 ${TEXTE}`, color: t.ink2, textWrap: 'pretty' }}>
            {tr('maj.enPartie')}
          </div>
        )}
      </div>
      {/* Deux pièces de la même taille, côte à côte — comme la porte du salon.
          46 px : une cible tactile se touche. */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Bouton ton="ink" height={46} size={15} onClick={onRecharger} style={{ flex: 1 }}>
          {tr('maj.recharger')}
        </Bouton>
        <Bouton ton="creux" height={46} size={15} onClick={onPlusTard} style={{ flex: 1 }}>
          {tr('maj.plusTard')}
        </Bouton>
      </div>
    </div>
  )
}
