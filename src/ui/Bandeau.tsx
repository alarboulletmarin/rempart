import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SAFE_TOP, TEXTE, TITRE } from '../theme'
import { useT } from '../i18n'
import type { Lien } from '../net/session'
import { useTheme } from './theme'

/**
 * Le bandeau d'état du lien — persistant, et surtout **non modal**.
 *
 * Quand la connexion lâchait, rien ne le disait : l'écran restait là, les
 * cartes répondaient, et la manche ne se résolvait jamais. On tapait dans le
 * vide en croyant jouer. Une feuille modale aurait été pire — elle aurait
 * masqué la partie qu'on est justement en train de nous garder.
 *
 * Il dit deux choses, et les deux comptent : l'état, et **ce qui se passe
 * ensuite**. « Le lien est coupé » tout seul laisse penser que la partie est
 * perdue, alors qu'au bout de quarante-cinq secondes quelqu'un d'autre prend
 * l'arbitrage et qu'elle reprend là où elle s'était arrêtée.
 *
 * Il se pose dans le flux, au-dessus de l'écran : ainsi il ne recouvre jamais
 * rien — ni un mur, ni un bouton.
 */
export function BandeauLien({
  lien,
  lancee,
  hote,
  action,
}: {
  lien: Lien
  /** En partie, l'hôte qui manque se remplace ; au salon, non. */
  lancee: boolean
  hote: boolean
  /** Le geste de sortie, quand il y en a un (« Essayer un autre code »). */
  action?: ReactNode
}) {
  const t = useTheme()
  const tr = useT()
  const repris = useRepris(lien)

  // L'hôte n'a pas de lien à l'hôte : son propre relais peut tomber, mais ce
  // n'est pas la même histoire et ce bandeau-là ne saurait pas la raconter.
  if (hote || (lien === 'lie' && !repris)) return null

  const calme = lien === 'lie' || lien === 'recherche'
  const titre =
    lien === 'lie'
      ? tr('lien.repris.titre')
      : lien === 'recherche'
        ? tr('lien.recherche.titre')
        : tr(lancee ? 'lien.perdu.partie.titre' : 'lien.perdu.salon.titre')
  const detail =
    lien === 'lie'
      ? null
      : lien === 'recherche'
        ? tr('lien.recherche.detail')
        : tr(lancee ? 'lien.perdu.partie.detail' : 'lien.perdu.salon.detail')

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        flex: '0 0 auto',
        background: calme ? t.panel2 : t.clayText,
        padding: `calc(${SAFE_TOP} + 11px) 16px 11px 16px`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ font: `700 14px/1.2 ${TITRE}`, color: calme ? t.ink : t.panel }}>{titre}</div>
      {detail && (
        <div
          style={{
            font: `500 12px/1.35 ${TEXTE}`,
            color: calme ? t.ink2 : t.panel,
            textWrap: 'pretty',
          }}
        >
          {detail}
        </div>
      )}
      {lien === 'perdu' && action}
    </div>
  )
}

/**
 * Le lien vient-il d'être rétabli ?
 *
 * Rendre la main sans rien dire laisserait le doute : on a vu le bandeau
 * rouge, on ne l'a plus, et rien ne dit si c'est réglé. Trois secondes
 * suffisent à le dire, et à disparaître.
 */
function useRepris(lien: Lien): boolean {
  const [repris, setRepris] = useState(false)
  const precedent = useRef(lien)

  useEffect(() => {
    const avant = precedent.current
    precedent.current = lien
    if (lien !== 'lie' || avant === 'lie') return
    setRepris(true)
    const id = setTimeout(() => setRepris(false), 3000)
    return () => clearTimeout(id)
  }, [lien])

  return repris
}
