/**
 * Qui tient encore son mur ?
 *
 * Des durées, séparées du reste parce qu'elles n'ont besoin ni du réseau ni de
 * l'horloge du système : on les passe aux fonctions, elles répondent. C'est ce
 * qui les rend vérifiables par un test.
 *
 * Le principe : **c'est le battement applicatif de l'hôte qui dit qui est
 * là**, et non l'avis du transport. Trystero déclare un pair perdu au bout de
 * quelques secondes de silence ICE, puis ne dit plus rien — ni qu'il est
 * revenu, ni qu'il ne l'est pas.
 */

/** Intervalle du battement de l'hôte. */
export const TIC_MS = 2000

/**
 * Silence au-delà duquel on considère un appareil parti.
 *
 * Quatre battements : un téléphone qui change d'antenne saute facilement un ou
 * deux tics sans que rien ne soit cassé.
 */
export const SILENCE_MS = 8000

/**
 * Délai laissé à un joueur déconnecté avant que la table ne puisse continuer
 * sans lui.
 *
 * Quarante-cinq secondes : passer du Wi-Fi aux données mobiles, sortir d'un
 * tunnel ou déverrouiller son téléphone prend rarement moins de vingt
 * secondes, et dans Rempart le mur de l'absent reste sur l'écran de tout le
 * monde — l'attente n'est pas un écran vide, c'est une partie en pause.
 *
 * C'est aussi la grâce laissée à l'hôte avant d'en élire un autre : ce sont les
 * deux faces d'une seule question — « est-il vraiment parti ? »
 */
export const ABSENCE_MS = 45_000

/**
 * Au-delà, on considère que l'invité ne trouvera personne. Mieux vaut le dire
 * que de le laisser devant un écran qui tourne : la mise en relation aboutit en
 * deux ou trois secondes quand elle aboutit.
 */
export const LIEN_TIMEOUT_MS = 15_000

/**
 * Délai de réémission d'une intention non acquittée.
 *
 * Un choix part une fois, et s'il se perd le joueur ne le sait pas : il voit sa
 * carte choisie et la manche qui ne se résout pas, pendant que l'hôte attend un
 * choix qui n'est jamais arrivé. Sept dixièmes de seconde couvrent un
 * aller-retour très large sans doubler le trafic — l'hôte, lui, reconnaît une
 * réémission et n'applique le geste qu'une fois.
 */
export const REEMISSION_MS = 700

/** Au-delà, ce n'est plus un creux : le lien est coupé, et il faut le dire. */
export const ABANDON_MS = 5000

/**
 * Intentions dont on garde le verdict, pour répondre à une réémission sans
 * rejouer le geste. Une table de quatre ne joue pas cent coups par seconde.
 */
export const MEMOIRE_RECUS = 64

/** Le temps restant avant de pouvoir continuer sans un absent, en secondes. */
export function resteAvantAbsence(depuis: number, maintenant: number): number {
  return Math.max(0, Math.ceil((ABSENCE_MS - (maintenant - depuis)) / 1000))
}
