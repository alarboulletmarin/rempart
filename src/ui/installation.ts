import { useCallback, useSyncExternalStore } from 'react'

/**
 * L'app peut-elle être installée, et comment le proposer.
 *
 * Le bouton n'existe que dans deux conditions réunies : l'app tourne dans un
 * navigateur (`display-mode: browser`), et celui-ci a effectivement offert une
 * invite d'installation. Installée, elle n'a plus rien à proposer — et
 * proposer d'installer une app déjà installée est la meilleure façon de faire
 * douter de tout le reste de l'écran.
 *
 * **L'écoute commence au chargement du module, pas au montage de l'écran.**
 * `beforeinstallprompt` ne se déclenche qu'une fois, tôt, bien avant qu'on
 * ouvre les Réglages : un écouteur posé par l'écran arriverait toujours trop
 * tard, et le bouton n'apparaîtrait jamais. Même raison qu'à `ui/miseajour.ts`,
 * même forme — un magasin de module, lu par un crochet.
 *
 * Safari ne déclenche pas cet événement : sur iPhone, l'installation passe par
 * « Sur l'écran d'accueil » du menu de partage, que rien ne peut ouvrir par
 * programme. Le bouton reste donc absent là-bas, ce qui est préférable à un
 * bouton qui ne fait rien.
 */

interface InviteInstallation extends Event {
  prompt: () => Promise<unknown>
}

let invite: InviteInstallation | null = null
let enNavigateur = lireModeAffichage()
const abonnes = new Set<() => void>()

function lireModeAffichage(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(display-mode: browser)').matches
}

function annoncer(): void {
  for (const prevenir of abonnes) prevenir()
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', ((e: Event) => {
    /* Sans cela, Chrome pose sa propre barre d'installation en bas de page :
       une seconde proposition, au milieu de l'écran, que rien ici ne
       contrôle. */
    e.preventDefault()
    invite = e as InviteInstallation
    annoncer()
  }) as EventListener)

  window.addEventListener('appinstalled', () => {
    invite = null
    annoncer()
  })

  const mq = window.matchMedia?.('(display-mode: browser)')
  mq?.addEventListener('change', () => {
    enNavigateur = mq.matches
    annoncer()
  })
}

function abonner(prevenir: () => void): () => void {
  abonnes.add(prevenir)
  return () => {
    abonnes.delete(prevenir)
  }
}

export function useInstallation(): { possible: boolean; installer: () => void } {
  const possible = useSyncExternalStore(
    abonner,
    () => enNavigateur && invite !== null,
    /* Rendu hors navigateur : rien à installer, et personne à qui le
       proposer. */
    () => false,
  )

  return {
    possible,
    installer: useCallback(() => {
      const courante = invite
      if (!courante) return
      /* Acceptée ou refusée, l'invite ne se rejoue pas : le navigateur ne la
         redonnera qu'à un prochain chargement. Le bouton s'en va donc dans
         les deux cas, plutôt que de rester là sans plus rien faire. */
      void courante.prompt().catch(() => {}).finally(() => {
        invite = null
        annoncer()
      })
    }, []),
  }
}
