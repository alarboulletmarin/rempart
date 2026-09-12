import { useCallback, useSyncExternalStore } from 'react'
import { registerSW } from 'virtual:pwa-register'

/**
 * L'enregistrement du service worker, et l'attente d'une version prête.
 *
 * **Le rechargement est proposé, jamais imposé.** C'est la raison d'être de ce
 * module, et elle est propre à ce jeu : une partie est un lien WebRTC entre
 * plusieurs téléphones. Recharger le rompt — pour soi, et pour les autres qui
 * attendent l'arbitre. En `autoUpdate`, comme le projet était réglé, la page se
 * rechargeait d'elle-même à l'instant où une version finissait de se mettre en
 * cache : au milieu d'une manche, personne n'avait rien demandé.
 *
 * L'enregistrement a lieu **une fois, au premier import de ce module**, et il
 * ne se refait jamais. C'est une affaire de document, pas de composant :
 * `useRegisterSW()`, le crochet fourni par le greffon, enregistre à chaque
 * montage et ne défait rien au démontage. Ce qui change, c'est seulement la
 * réponse à « une version attend-elle ? », que les écrans lisent par
 * `useMiseAJour()`.
 */

let attend = false
/**
 * « Plus tard » a été dit, et il vaut pour cette session.
 *
 * Sans ce drapeau, « Plus tard » ne durait pas une seconde : la version reste
 * en attente, et **chaque** nouvelle vérification la réannonce. Le bandeau
 * disparaissait au clic et revenait au retour sur l'app — c'est-à-dire tout le
 * temps, et c'est exactement ce qu'on ne voulait pas faire.
 *
 * Il se remet à zéro au prochain démarrage, puisque ce module est réimporté
 * avec la page. « Plus tard » promet la prochaine fois, et tient sa promesse.
 */
let ecarte = false
const abonnes = new Set<() => void>()

function annoncer(valeur: boolean) {
  if (valeur && ecarte) return
  if (attend === valeur) return
  attend = valeur
  for (const prevenir of abonnes) prevenir()
}

/**
 * Une heure. Assez rare pour ne rien coûter, assez fréquent pour qu'une version
 * publiée le matin soit proposée dans la journée.
 */
const INTERVALLE_MS = 60 * 60 * 1000

/**
 * Redemander au bon moment.
 *
 * Le navigateur ne recompare `sw.js` que lorsqu'il **charge** une page. Une app
 * installée, elle, n'en charge plus : on la reprend là où on l'avait laissée,
 * parfois des jours plus tard. Sans relance explicite, la version publiée
 * entre-temps n'arrive qu'à la vérification périodique du navigateur — une
 * fois par jour environ, c'est-à-dire jamais sur un téléphone qu'on rouvre
 * deux minutes.
 *
 * Redemander est sûr par construction : `update()` ne peut qu'installer un
 * worker de plus à l'état `waiting`. Aucun `skipWaiting` nulle part, donc rien
 * ne l'active que le bouton du bandeau.
 */
function surveiller(enregistrement: ServiceWorkerRegistration | undefined): void {
  if (!enregistrement) return

  const verifier = () => {
    // Redemander pendant une installation la relancerait pour rien ; hors
    // ligne, la requête échouerait à coup sûr.
    if (enregistrement.installing || !navigator.onLine) return
    void enregistrement.update().catch(() => {})
  }

  // Revenir sur l'app est le moment où la question se pose.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') verifier()
  })
  window.setInterval(verifier, INTERVALLE_MS)
}

const appliquer = registerSW({
  immediate: true,
  onRegisteredSW: (_url, enregistrement) => surveiller(enregistrement),
  onNeedRefresh: () => annoncer(true),
})

function abonner(prevenir: () => void) {
  abonnes.add(prevenir)
  return () => {
    abonnes.delete(prevenir)
  }
}

/**
 * Une version attend-elle, et que faire d'elle.
 *
 * `ecarter()` referme le bandeau sans rien appliquer : la version attendra le
 * prochain démarrage, ce qui est exactement ce que « Plus tard » promet.
 */
export function useMiseAJour(): {
  attend: boolean
  appliquer: () => void
  ecarter: () => void
} {
  const valeur = useSyncExternalStore(
    abonner,
    () => attend,
    /* Rendu hors navigateur : aucune version n'attend, il n'y a pas de service
       worker pour en poser une. */
    () => false,
  )

  return {
    attend: valeur,
    appliquer: useCallback(() => {
      /*
       * Donner la main au worker en attente, puis recharger.
       *
       * Le rechargement est normalement l'affaire du module d'enregistrement,
       * qui écoute le changement de contrôleur. Il s'en abstient dans un cas :
       * la page qui a installé le tout PREMIER worker n'était contrôlée par
       * personne au départ, et il n'y voit donc pas une mise à jour. Le worker
       * s'active, la page reste sur l'ancienne version, et le bandeau ne s'en
       * va plus.
       *
       * D'où ce second rechargement, armé au clic seulement : `clientsClaim`
       * change lui aussi de contrôleur à la première visite, et recharger sur
       * ce signal-là sans y avoir été invité tournerait en boucle.
       */
      navigator.serviceWorker?.addEventListener(
        'controllerchange',
        () => window.location.reload(),
        { once: true },
      )
      void appliquer(true)
    }, []),
    ecarter: useCallback(() => {
      ecarte = true
      annoncer(false)
    }, []),
  }
}
