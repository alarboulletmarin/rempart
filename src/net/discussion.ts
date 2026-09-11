/**
 * Se parler — pendant qu'on attend, et pendant qu'on joue.
 *
 * **Un seul canal.** Une réaction EST un message de conversation, avec un
 * emoji pour texte : même canal, même auteur, même ligne dans l'historique.
 * Deux canaux auraient donné deux ordres d'arrivée pour une seule
 * conversation, et l'emoji envoyé après une phrase serait arrivé avant elle.
 *
 * **Deux freins**, et c'est tout ce que ce fichier fait :
 *
 *  - `REPOS_ENVOI_MS` chez l'émetteur : on ne part pas deux fois en moins de
 *    sept dixièmes de seconde ;
 *  - `BULLES_MAX` chez le récepteur : trois bulles simultanées au plus par
 *    joueur. Le premier frein vit chez quelqu'un d'autre — un client bricolé
 *    peut l'enlever — donc le second est celui qui compte, et il est posé là où
 *    le tort serait fait.
 *
 * Ce qui dépasse n'est ni montré ni archivé : un message refusé ne rentre pas
 * dans l'historique, sans quoi l'inondation se verrait quand même à la
 * réouverture de la feuille.
 *
 * Aucun réseau ici, aucune horloge implicite : les instants sont passés en
 * paramètre, donc les deux freins se vérifient en test.
 */

/** L'éventail : six emoji, et pas un de plus. */
export const EVENTAIL = ['😂', '😱', '🎉', '👏', '😤', '🙏'] as const

export type Emoji = (typeof EVENTAIL)[number]

/** Ce que la table propose quand ton mur vient d'être frappé. */
export const EMOJI_PROPOSE: Emoji = '😱'

/** Le repos imposé entre deux envois, chez l'émetteur. */
export const REPOS_ENVOI_MS = 700

/** La durée de vie d'une bulle : elle monte, grandit et s'estompe. */
export const VIE_BULLE_MS = 1800

/** Bulles simultanées au plus, par joueur, chez le récepteur. */
export const BULLES_MAX = 3

/** Longueur d'un message écrit. Au-delà, ce n'est plus une conversation de salon. */
export const LONGUEUR_MAX = 140

/**
 * Ce qu'on garde de l'historique. La feuille du salon se relit ; elle ne
 * s'archive pas — et une partie dure quatre minutes.
 */
export const MEMOIRE_MESSAGES = 80

/**
 * Un message.
 *
 * `id` est fabriqué par son auteur (`clientId:n`) : il rend la réception
 * idempotente, un même message pouvant arriver deux fois si le transport
 * double une livraison.
 *
 * `at` est l'instant de **réception**, sur l'horloge du récepteur — et non
 * celui de l'émetteur. Les deux appareils n'ont aucune raison d'être à
 * l'heure l'un de l'autre, et c'est cet instant-là qui décide quand la bulle
 * s'efface.
 */
export type Message = {
  id: string
  /** L'identité de l'auteur — la même que celle de son siège (`clientId`). */
  de: string
  texte: string
  at: number
}

/**
 * Nettoie un texte avant de l'envoyer.
 *
 * Les retours à la ligne deviennent des espaces : une bulle tient sur une
 * ligne ou deux, et un message de vingt lignes vides n'est pas une phrase.
 * Rend une chaîne vide pour ce qu'il ne faut pas envoyer.
 */
export function nettoyer(texte: string): string {
  return texte.replace(/\s+/g, ' ').trim().slice(0, LONGUEUR_MAX)
}

/** Une réaction de l'éventail : un emoji pour texte, et rien d'autre. */
export function estReaction(texte: string): boolean {
  return (EVENTAIL as readonly string[]).includes(texte)
}

/**
 * La conversation d'une table, telle qu'un appareil la voit.
 *
 * Elle n'est pas un état de jeu : elle ne passe pas par l'arbitre, ne porte
 * aucun numéro de séquence et ne se rejoue pas. Un emoji perdu est un emoji
 * perdu — le réémettre coûterait plus cher que ce qu'il vaut.
 */
export class Discussion {
  private messages: Message[] = []
  /** Les identifiants déjà vus, pour qu'une double livraison ne double rien. */
  private vus = new Set<string>()
  private dernierEnvoi = 0
  private compteur = 0

  liste(): readonly Message[] {
    return this.messages
  }

  /** Le prochain identifiant de message de cet appareil. */
  prochainId(moi: string): string {
    return `${moi}:${++this.compteur}`
  }

  /** Le repos entre deux envois est-il écoulé ? */
  peutEnvoyer(maintenant: number): boolean {
    return maintenant - this.dernierEnvoi >= REPOS_ENVOI_MS
  }

  /** À appeler quand un message part vraiment. */
  noterEnvoi(maintenant: number): void {
    this.dernierEnvoi = maintenant
  }

  /**
   * Un message arrive.
   *
   * Rend `true` s'il a été retenu. Un message refusé — doublon, texte vide, ou
   * quatrième bulle d'un même joueur dans la même fenêtre — n'est ni montré ni
   * archivé.
   */
  recevoir(m: { id: string; de: string; texte: string }, maintenant: number): boolean {
    if (this.vus.has(m.id)) return false
    const texte = nettoyer(m.texte)
    if (!texte) return false
    if (this.bulles(m.de, maintenant) >= BULLES_MAX) return false

    this.vus.add(m.id)
    // **Une nouvelle liste, et non un `push`.** L'écran lit cette liste ; la
    // modifier en place lui rendrait la même référence à chaque message, et
    // React ne verrait jamais rien changer — une bulle arrivée pendant un
    // silence resterait alors affichée sans que rien ne vienne l'effacer.
    const suite = [...this.messages, { id: m.id, de: m.de, texte, at: maintenant }]
    if (suite.length > MEMOIRE_MESSAGES) {
      const parti = suite.shift()
      // L'identifiant reste connu tant que la mémoire des vus n'a pas gonflé :
      // un doublon très tardif ne doit pas réapparaître en bas de la feuille
      // comme un message neuf.
      if (parti && this.vus.size > MEMOIRE_MESSAGES * 4) this.vus.delete(parti.id)
    }
    this.messages = suite
    return true
  }

  /** Combien de bulles de ce joueur sont encore à l'écran. */
  bulles(de: string, maintenant: number): number {
    let n = 0
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const m = this.messages[i]
      if (maintenant - m.at >= VIE_BULLE_MS) break
      if (m.de === de) n++
    }
    return n
  }
}

/** Les messages encore visibles en bulle, par auteur. */
export function bullesVivantes(
  messages: readonly Message[],
  maintenant: number,
): Map<string, Message[]> {
  const par = new Map<string, Message[]>()
  for (const m of messages) {
    if (maintenant - m.at >= VIE_BULLE_MS) continue
    const deja = par.get(m.de)
    if (deja) deja.push(m)
    else par.set(m.de, [m])
  }
  return par
}
