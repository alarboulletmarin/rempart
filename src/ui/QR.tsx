import { useMemo } from 'react'
import qrcode from 'qrcode-generator'
import { useTheme } from './theme'

/**
 * Le QR du salon.
 *
 * Une partie de quatre minutes se joue surtout en présentiel : l'autre
 * téléphone est sur la table, et le scanner va plus vite que de dicter huit
 * caractères — sans compter ce qu'on perd à les dicter.
 *
 * **Il encode une adresse, pas le code seul.** Un QR qui ne contient que
 * `ACDE3479` ouvre l'appareil photo sur une chaîne que rien ne sait quoi
 * faire ; celui-ci ouvre l'app directement sur l'écran « Rejoindre », le code
 * déjà rempli. C'est ce que `App` lit au démarrage (`?partie=`).
 *
 * **Dessiné en SVG et non en image** : il suit les couleurs du thème, il reste
 * net à toutes les tailles, et il ne demande ni canvas ni fichier. Les modules
 * sont regroupés en un seul chemin — un `rect` par module en ferait un millier.
 */
export function QR({ valeur, taille = 132 }: { valeur: string; taille?: number }) {
  const t = useTheme()

  const { chemin, modules } = useMemo(() => {
    // Version 0 : la bibliothèque choisit la plus petite qui tienne. Correction
    // « M » : un QR posé sur un écran se lit dans de bonnes conditions, et une
    // correction plus forte le rendrait plus dense donc plus dur à viser.
    const qr = qrcode(0, 'M')
    qr.addData(valeur)
    qr.make()
    const n = qr.getModuleCount()
    let d = ''
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`
      }
    }
    return { chemin: d, modules: n }
  }, [valeur])

  return (
    <svg
      width={taille}
      height={taille}
      viewBox={`-2 -2 ${modules + 4} ${modules + 4}`}
      // Le contenu est déjà écrit en toutes lettres juste à côté : pour qui
      // n'a pas d'appareil photo sous la main, ce carré n'apprend rien.
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', borderRadius: 10 }}
      shapeRendering="crispEdges"
    >
      {/* La marge blanche fait partie du code : sans elle, un lecteur peine. */}
      <rect x={-2} y={-2} width={modules + 4} height={modules + 4} fill={t.panel} rx={0.8} />
      <path d={chemin} fill={t.ink} />
    </svg>
  )
}

/**
 * L'adresse qui ouvre l'app sur ce salon.
 *
 * Relative à la page courante, donc elle marche aussi bien sur le site publié
 * que sur un serveur de développement ou une app installée.
 */
export function lienDePartie(code: string): string {
  if (typeof window === 'undefined') return code
  const url = new URL(window.location.href)
  url.hash = ''
  url.search = `?partie=${code}`
  return url.toString()
}
