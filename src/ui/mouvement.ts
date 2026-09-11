import { useEffect, useState } from 'react'

/**
 * Le mouvement, et ce qu'il dit.
 *
 * Cinq mouvements dans toute l'app, et chacun porte une information que
 * l'écran fixe ne donnait pas :
 *
 *  - **la brique tombe** — d'où vient le coup, et sur quel mur il atterrit ;
 *  - **la révélation en cascade** — le seul moment de la manche où l'on ne sait
 *    pas encore ; chaque carte se retourne seule, avec un temps mort avant la
 *    suivante ;
 *  - **la carte posée frémit** — « c'est parti, on attend les autres », sans
 *    texte, et ça s'arrête dès que la table est complète ;
 *  - **la carte de manche entre en grand** — cette manche ne suit pas les
 *    règles des autres ;
 *  - **les briques se recomptent** — ce qu'on vient de gagner ou de perdre, et
 *    pas seulement le total.
 *
 * Le fond vivant a été écarté : c'était le seul de la liste qui prenait de
 * l'attention sans rien dire.
 *
 * La vraie correction n'est d'ailleurs pas la liste : c'est la cascade. La
 * révélation montrait un résultat déjà acquis — les murs portaient les dégâts
 * avant que la moindre carte ne se retourne. Les lignes partent maintenant du
 * mur d'AVANT la manche (`PlayerOutcome.wallBefore`), et rien ne bouge avant
 * que sa carte ne soit retournée.
 */

/** Les durées, en millisecondes. Une seule liste, pour que rien ne dérive. */
export const DUREE = {
  /** La brique tombe. */
  chute: 450,
  /** Le temps mort entre deux cartes retournées. */
  cascade: 500,
  /** La carte se retourne — comprise dans le temps mort ci-dessus. */
  retourne: 320,
  /** La carte posée frémit, en boucle. */
  fremis: 2000,
  /** La carte de manche entre en grand. */
  manche: 1200,
  /** Les briques se recomptent. */
  recompte: 800,
  /** La bulle monte, grandit et s'estompe. */
  bulle: 1800,
  /** La feuille de conversation monte. */
  feuille: 260,
} as const

/**
 * Le mouvement est-il permis ?
 *
 * `prefers-reduced-motion` n'est pas un réglage d'esthétique : pour qui a des
 * troubles vestibulaires, une image qui bouge donne la nausée. On ne **crée**
 * donc rien sous ce réglage — pas d'animation ralentie, pas de transition
 * raccourcie : la cascade dévoile tout d'un coup, la brique est déjà tombée,
 * le compte affiche son total. Il reste l'écrit, qui disait déjà tout.
 */
export function useMouvement(): boolean {
  const [bouge, setBouge] = useState(() => !reduit())
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setBouge(!mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return bouge
}

function reduit(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Une animation, écrite une fois.
 *
 * Rend `undefined` quand le mouvement n'est pas permis : la propriété n'est
 * alors pas posée du tout, et l'élément s'affiche dans son état final.
 */
export function anime(
  bouge: boolean,
  nom: string,
  duree: number,
  options: { delai?: number; courbe?: string; fin?: 'forwards' | 'both'; boucle?: boolean } = {},
): string | undefined {
  if (!bouge) return undefined
  const { delai = 0, courbe = 'ease-out', fin = 'forwards', boucle = false } = options
  return `${nom} ${duree}ms ${courbe} ${delai}ms ${boucle ? 'infinite' : '1'} ${boucle ? 'both' : fin}`
}
