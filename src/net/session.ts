/**
 * La session : ce qui relie la table (l'arbitre) au canal pair-à-pair.
 *
 * L'hôte fait autorité. Il tient l'état, applique les gestes reçus et fait
 * avancer les manches ; les autres n'envoient que leurs intentions et affichent
 * ce qu'ils reçoivent. Un client bricolé ne peut pas tricher : `table.ts`
 * refuse tout geste illégal, et les choix des autres ne sortent jamais de chez
 * l'arbitre avant la révélation (`vue.ts`).
 *
 * Les trois mécanismes qui font tenir tout ça :
 *
 *  - **le règne** (`epoch`), qui départage deux appareils qui se croient tous
 *    les deux arbitres après une coupure ;
 *  - **l'accusé de réception** (`nonce`), qui rend une intention rejouable sans
 *    risque : l'invité réémet jusqu'à la réponse, l'arbitre n'applique qu'une
 *    fois ;
 *  - **le battement** (`tick`/`pong`), qui dit qui est encore là — et non
 *    l'avis du transport, qui déclare un pair perdu puis ne dit plus rien.
 */
import {
  choisirBot,
  delaiBot,
  estNiveauBot,
  NIVEAU_DEFAUT,
  type NiveauBot,
} from '../game/bot.ts'
import { hasPlayed, playersToAct } from '../game/engine.ts'
import type { Choice, Format, GameState, PlayerId } from '../game/types.ts'
import {
  ABANDON_MS,
  ABSENCE_MS,
  LIEN_TIMEOUT_MS,
  MEMOIRE_RECUS,
  REEMISSION_MS,
  SILENCE_MS,
  TIC_MS,
} from './presence.ts'
import {
  clientId,
  fabriquerCode,
  ouvrirCanal,
  type Canal,
  type ErreurIntention,
  type Geste,
  type Intention,
  type Recu,
  type Salon,
} from './room.ts'
import { creerTable, salonNeuf, type Table } from './table.ts'
import { vuePour } from './vue.ts'

/** Où en est la mise en relation, pour que l'écran d'attente puisse le dire. */
export type Lien = 'recherche' | 'lie' | 'perdu'

/** Une demande d'entrée en attente de la décision de l'hôte. */
export type Demande = { clientId: string; nom: string; peer: string }

/**
 * Où en est *ma* demande, vue de l'invité.
 *
 * `inconnu` couvre les deux cas où la question ne se pose pas : l'hôte, et
 * l'invité qui a déjà son siège. `spectateur` n'est pas un refus : la table est
 * pleine ou la partie a commencé, il n'y a rien à demander à personne.
 */
export type StatutDemande = 'inconnu' | 'attente' | 'refuse' | 'spectateur'

export type Avis =
  | { code: 'lienEchoue' }
  | { code: 'lienBloque' }
  | { code: 'lienPerdu' }
  | { code: 'refuse' }
  | { code: 'salonPlein' }
  | { code: 'partieEnCours' }
  | { code: 'hotePris' }
  | { code: 'gestRefuse' }

export type Ecouteurs = {
  onChange: () => void
  onAvis: (avis: Avis) => void
}

export type FabriqueCanal = (code: string, onErreur?: (m: string) => void) => Canal

/** Ce que l'écran lit de la session. */
export type VueSession = {
  code: string
  moi: string
  hote: boolean
  salon: Salon
  jeu: GameState | null
  joues: PlayerId[]
  lien: Lien
  statutDemande: StatutDemande
  demandes: readonly Demande[]
  /** Depuis quand chaque joueur absent l'est, pour le compte à rebours de l'écran 12. */
  absentsDepuis: ReadonlyMap<string, number>
  relaisActifs: number
}

export class Session {
  readonly moi = clientId()
  private table: Table
  /** Chez l'invité : le reflet de ce que l'arbitre envoie. */
  private salonRecu: Salon
  private jeuRecu: GameState | null = null
  private joues: PlayerId[] = []

  lien: Lien = 'lie'
  private canal: Canal | null = null
  private fabrique: FabriqueCanal
  private ecouteurs: Ecouteurs
  private monNom: string
  private ferme = false

  /** Côté hôte : les demandes en attente, dans l'ordre d'arrivée. Elles ne
   *  voyagent pas dans le salon publié — c'est un état de l'hôte, et un pair
   *  n'a pas à savoir qui d'autre frappe à la porte. */
  private demandesEnAttente: Demande[] = []
  /** Côté hôte : appareils déjà refusés. Ils ne redemandent plus. */
  private refuses = new Set<string>()
  /** Côté invité : où en est ma propre demande. */
  private statut: StatutDemande = 'inconnu'

  /** Côté hôte : dernier message applicatif reçu, par identité d'appareil. */
  private vuA = new Map<string, number>()
  /** Depuis quand chaque siège est silencieux. */
  private absentsDepuis = new Map<string, number>()
  /** Côté invité : dernier message venu de l'hôte en titre. */
  private hoteVuA = 0
  /** Côté invité : par où l'hôte nous parle. Le salon porte bien un `peerId`,
   *  mais c'est l'hôte qui le tient à jour — et il vaut `null` dès qu'il nous a
   *  crus partis, au moment précis où l'on a besoin de le joindre. */
  private hotePeer: string | null = null
  /** Côté invité : la grâce laissée à l'hôte avant d'en élire un autre. */
  private graceHote: ReturnType<typeof setTimeout> | null = null

  /** Côté invité : intentions parties, en attente d'accusé de réception. */
  private enVol = new Map<string, ReturnType<typeof setTimeout>>()
  /** Côté hôte : verdicts déjà rendus, pour répondre sans rejouer le geste. */
  private juges = new Map<string, Recu>()
  private nonces = 0

  /** Côté hôte : le prochain bot à poser sa carte. Un seul à la fois. */
  private minuteurBot: ReturnType<typeof setTimeout> | null = null

  private battement: ReturnType<typeof setInterval> | null = null
  private minuteurLien: ReturnType<typeof setTimeout> | null = null
  /** Tentatives de reconnexion : seule la dernière a le droit d'aboutir. */
  private tentatives = 0

  private constructor(salon: Salon, nom: string, ecouteurs: Ecouteurs, fabrique: FabriqueCanal) {
    this.table = creerTable(salon)
    this.salonRecu = salon
    this.monNom = nom
    this.ecouteurs = ecouteurs
    this.fabrique = fabrique
  }

  // ───────────────────────────── fabriques ─────────────────────────────

  static creer(nom: string, ecouteurs: Ecouteurs, fabrique: FabriqueCanal = ouvrirCanal): Session {
    const code = fabriquerCode()
    const self = clientId()
    const session = new Session(salonNeuf(code, self, nom), nom, ecouteurs, fabrique)
    session.connecter(code)
    return session
  }

  static rejoindre(
    code: string,
    nom: string,
    ecouteurs: Ecouteurs,
    fabrique: FabriqueCanal = ouvrirCanal,
  ): Session {
    const propre = code.toUpperCase()
    // Un invité n'a pas de table à lui : ce salon vide n'est qu'un réceptacle,
    // remplacé par le premier que l'arbitre publiera.
    const vide: Salon = {
      code: propre,
      hoteClientId: '',
      epoch: 0,
      round: 0,
      format: 'chacun',
      cartesManche: true,
      places: 4,
      joueurs: [],
      lancee: false,
    }
    const session = new Session(vide, nom, ecouteurs, fabrique)
    session.connecter(propre)
    return session
  }

  // ───────────────────────────── lecture ─────────────────────────────

  get estHote(): boolean {
    return this.salon.hoteClientId === this.moi
  }

  private get salon(): Salon {
    return this.estHoteBrut() ? this.table.salon : this.salonRecu
  }

  /** L'arbitrage se lit sur la table de l'hôte, ou sur le salon reçu. */
  private estHoteBrut(): boolean {
    return this.table.salon.hoteClientId === this.moi && this.table.salon.hoteClientId !== ''
  }

  get jeu(): GameState | null {
    return this.estHote ? this.table.jeu : this.jeuRecu
  }

  vue(): VueSession {
    const jeu = this.jeu
    return {
      code: this.salon.code,
      moi: this.moi,
      hote: this.estHote,
      salon: this.salon,
      jeu,
      joues: this.estHote && jeu ? vuePour(jeu, this.moi).joues : this.joues,
      lien: this.lien,
      statutDemande: this.statut,
      demandes: this.estHote ? this.demandesEnAttente : [],
      absentsDepuis: this.absentsDepuis,
      relaisActifs: this.canal?.relaisActifs() ?? 0,
    }
  }

  private changer(): void {
    this.ecouteurs.onChange()
  }

  // ───────────────────────────── réseau ─────────────────────────────

  private connecter(code: string): void {
    const canal = this.fabrique(code, (erreur) => this.signalerEchecLien(erreur))
    this.canal = canal
    this.hoteVuA = Date.now()

    // L'hôte, lui, attend ses amis : son attente n'a pas de raison d'échouer.
    // L'invité, en revanche, cherche quelqu'un de précis, qui devrait répondre.
    if (!this.estHote) {
      this.lien = 'recherche'
      this.armerTimeoutLien()
    }

    // Sans cela, les autres ne peuvent pas reconnaître le départ de l'hôte : ils
    // ne verraient qu'un identifiant de pair anonyme quitter la salle.
    if (this.estHote) this.table.noterPair(this.moi, canal.selfId)

    // Un canal qu'on vient de quitter garde ses écouteurs vivants jusqu'à ce que
    // `quitter()` aboutisse : sans ce garde, un battement tardif de l'ancien
    // canal viendrait rassurer une session qui ne l'écoute plus.
    const courant = (): boolean => this.canal === canal

    canal.sur('hello', (hello, peer) => {
      if (!courant()) return
      this.noterVivant(hello.clientId, peer)
      if (this.estHote) return this.accueillir(hello.clientId, hello.nom, peer)
      // Un membre de la table qui se represente alors qu'on n'est pas l'arbitre :
      // c'est souvent l'hôte lui-même, revenu d'un rechargement de page et sans
      // aucun souvenir de sa table. Le salon qu'on lui renvoie le renomme
      // arbitre, avec les sièges de tout le monde intacts. On ne le fait que
      // pour qui a déjà un siège : la composition de la table n'a pas à fuiter
      // vers un inconnu que l'hôte n'a pas accepté.
      if (!this.salon.joueurs.some((j) => j.clientId === hello.clientId)) return
      canal.envoyer('lobby', this.tableVuePar(hello.clientId, peer), peer)
    })

    canal.sur('join', (verdict) => {
      if (!courant() || verdict.clientId !== this.moi) return
      this.noterHoteVivant()
      this.statut = verdict.statut
      if (verdict.statut === 'refuse') this.ecouteurs.onAvis({ code: 'refuse' })
      this.changer()
    })

    canal.sur('lobby', (salon) => {
      if (!courant()) return
      this.recevoirSalon(salon)
    })

    canal.sur('state', (message) => {
      if (!courant()) return
      // L'arbitre n'adopte l'état de personne — sauf s'il vient de reprendre la
      // main les mains vides.
      if (this.estHote) return this.adopterEtatRelaye(message.epoch, message.round, message.jeu)
      // **De l'arbitre en titre, et de lui seul.** Une époque inventée ne fait
      // pas un arbitre : n'importe quel pair pourrait sinon imposer un état à
      // toute la table et détourner les intentions.
      if (message.from !== this.salon.hoteClientId) return
      if (this.perime(message.epoch, message.round, message.jeu)) return
      this.noterHoteVivant()
      this.jeuRecu = message.jeu
      this.joues = vuePour(message.jeu, this.moi).joues
      this.changer()
    })

    // Le battement de l'hôte. C'est lui, et non l'avis du transport, qui dit qui
    // est encore là.
    canal.sur('tick', (tic, peer) => {
      if (!courant()) return
      const arbitre = this.salon.hoteClientId

      // Un arbitre qui n'est pas celui qu'on reconnaît : règne périmé, ou
      // prétendant au même règne. Il ne sait pas qu'il a perdu, et personne ne
      // le lui dira jamais s'il ne reçoit plus les salons du vainqueur. On lui
      // renvoie donc la table qu'on tient pour vraie : c'est ce qui le fait
      // abdiquer proprement.
      const rival = tic.epoch < this.salon.epoch || (tic.epoch === this.salon.epoch && tic.from !== arbitre)
      if (arbitre && rival) {
        canal.envoyer('lobby', this.tableVuePar(tic.from, peer), peer)
        return
      }

      if (this.estHote) {
        // Un règne plus récent que le nôtre, et on se croit encore arbitre : on
        // se represente, ce qui vaut demande de la table à jour.
        if (tic.epoch > this.salon.epoch) {
          canal.envoyer('hello', { clientId: this.moi, nom: this.monNom }, peer)
        }
        return
      }
      if (!this.deLArbitre(tic.from, tic.epoch)) return
      this.noterHoteVivant(peer)
      canal.envoyer('pong', { clientId: this.moi, at: tic.at }, peer)

      // L'arbitre annonce un état plus ancien que le nôtre — souvent : il n'en a
      // aucun, parce qu'il vient de reprendre la main après un rechargement de
      // page. On le lui rend. Sans cela il acquitterait les gestes sans rien
      // appliquer, et la table se figerait sans un message.
      if (this.jeuRecu && this.salon.lancee && tic.seq < this.jeuRecu.seq) {
        canal.envoyer(
          'state',
          {
            from: this.salon.hoteClientId,
            epoch: this.salon.epoch,
            round: this.salon.round,
            jeu: this.jeuRecu,
          },
          peer,
        )
      }
    })

    canal.sur('pong', (pong, peer) => {
      if (!courant() || !this.estHote) return
      this.noterVivant(pong.clientId, peer)
    })

    canal.sur('intent', (intention, peer) => {
      if (!courant()) return
      this.noterVivant(intention.clientId, peer)
      if (!this.estHote) return
      // Un geste décidé sous un autre règne visait une autre partie.
      if (intention.epoch !== this.salon.epoch) return
      this.recevoirIntention(intention, peer)
    })

    canal.sur('ack', (recu) => {
      if (!courant()) return
      const attente = this.enVol.get(recu.nonce)
      if (!attente) return
      this.noterHoteVivant()
      clearTimeout(attente)
      this.enVol.delete(recu.nonce)
      // L'erreur s'affiche chez celui qui a joué, et non chez l'arbitre : c'est
      // lui qu'elle concerne, et lui seul qui peut en faire quelque chose.
      if (!recu.ok && recu.erreur) this.signalerErreurGeste(recu.erreur)
    })

    canal.surArrivee((peer) => {
      if (!courant()) return
      this.lien = 'lie'
      if (this.minuteurLien) clearTimeout(this.minuteurLien)
      this.minuteurLien = null

      if (this.estHote) {
        // Le nouveau venu se présentera ; on lui envoie déjà la table.
        canal.envoyer('lobby', this.table.salon, peer)
        this.diffuserEtat(peer)
      } else {
        // Le `hello` d'ouverture se perd s'il part avant qu'un pair soit
        // joignable : on se represente à chaque arrivée, l'hôte déduplique.
        canal.envoyer('hello', { clientId: this.moi, nom: this.monNom }, peer)
      }
      this.changer()
    })

    canal.surDepart((peer) => {
      if (!courant()) return
      // Une demande dont l'auteur est parti n'a plus d'objet : l'accepter
      // donnerait un siège fantôme, occupé par personne.
      if (this.demandesEnAttente.some((d) => d.peer === peer)) {
        this.demandesEnAttente = this.demandesEnAttente.filter((d) => d.peer !== peer)
        this.changer()
      }
      if (this.hotePeer === peer) this.hotePeer = null

      const joueur = this.salon.joueurs.find((j) => j.peerId === peer)
      // Le transport n'a qu'un avis, et c'est le battement qui tranche — mais un
      // départ franc n'a aucune raison d'attendre huit secondes de silence.
      if (joueur) this.marquerAbsent(joueur.clientId)

      // Perdre le lien de l'hôte ne fait pas de nous l'arbitre : c'est
      // peut-être nous qui sommes isolés. On le laisse revenir, et on le dit à
      // l'écran en attendant.
      if (joueur?.clientId === this.salon.hoteClientId && !this.estHote) {
        this.lien = 'perdu'
        this.armerGraceHote()
      }
      this.changer()
    })

    if (this.battement) clearInterval(this.battement)
    this.battement = setInterval(() => this.battre(), TIC_MS)
    canal.envoyer('hello', { clientId: this.moi, nom: this.monNom })
  }

  /**
   * Nouvelle tentative de mise en relation, après un échec.
   *
   * On **attend** la fermeture du canal précédent : rejoindre le même code
   * avant que Trystero n'ait fini de fermer rend le même objet, détruit une
   * fraction de seconde plus tard — le bouton « Réessayer » raccrocherait au nez
   * de la tentative qu'il vient de lancer.
   */
  reessayer(): void {
    const precedent = this.canal
    this.canal = null
    this.lien = 'recherche'
    const tentative = ++this.tentatives
    // Les gestes en attente visent un état d'avant la coupure : les réémettre
    // après coup ne produirait qu'un refus incompréhensible.
    this.viderEnVol()
    this.changer()
    void Promise.resolve(precedent?.quitter()).then(() => {
      if (this.ferme || tentative !== this.tentatives) return
      this.connecter(this.salon.code)
      this.changer()
    })
  }

  /**
   * Retour au premier plan, ou retour du réseau.
   *
   * Un téléphone en veille gèle ses minuteries et laisse mourir ses liens WebRTC
   * sans prévenir personne. Au réveil on se represente — l'hôte déduplique — et
   * si plus aucun pair n'est joignable alors que la table compte d'autres
   * joueurs, on refait carrément le canal.
   */
  reveiller(): void {
    if (!this.canal) return
    this.canal.envoyer('hello', { clientId: this.moi, nom: this.monNom })
    // L'hôte ne cherche personne : ses amis viennent à lui, et refaire son canal
    // à chaque retour au premier plan couperait la table qui l'attend.
    if (this.estHote) return
    const autres = this.salon.joueurs.some((j) => j.clientId !== this.moi)
    if (autres && this.canal.pairs().length === 0) this.reessayer()
  }

  quitter(): void {
    this.ferme = true
    this.arreterBots()
    if (this.battement) clearInterval(this.battement)
    if (this.minuteurLien) clearTimeout(this.minuteurLien)
    this.viderGraceHote()
    this.viderEnVol()
    void this.canal?.quitter()
    this.canal = null
  }

  // ───────────────────────────── bots ─────────────────────────────

  private estBot(id: string): boolean {
    return this.salon.joueurs.some((j) => j.clientId === id && j.bot === true)
  }

  /**
   * Le niveau auquel ce siège joue.
   *
   * Le repli n'est pas une précaution de style : un salon publié par une
   * version d'avant les niveaux n'en porte pas, et un profil introuvable ferait
   * un bot qui ne joue pas du tout.
   */
  private niveauDe(id: string): NiveauBot {
    const niveau = this.salon.joueurs.find((j) => j.clientId === id)?.niveau
    return estNiveauBot(niveau) ? niveau : NIVEAU_DEFAUT
  }

  /**
   * Le prochain coup de bot, si la manche en attend un.
   *
   * Un seul minuteur à la fois, et il n'est jamais réarmé tant qu'il court :
   * la fonction est appelée à chaque changement d'état *et* à chaque battement,
   * et un minuteur qu'on repousse à chaque appel ne se déclenche jamais.
   *
   * Les bots posent l'un après l'autre plutôt que tous ensemble : le
   * « 2 / 4 ont joué » de l'écran 07 se remplit alors comme avec des amis, et
   * la manche ne se résout pas d'un bloc une seconde après son ouverture.
   */
  private planifierBot(): void {
    if (this.minuteurBot || !this.estHote) return
    const jeu = this.table.jeu
    if (!jeu || (jeu.phase !== 'choix' && jeu.phase !== 'mort-subite')) return
    const attendu = playersToAct(jeu).find((p) => this.estBot(p.id) && !hasPlayed(jeu, p.id))
    if (!attendu) return

    this.minuteurBot = setTimeout(() => {
      this.minuteurBot = null
      const courant = this.table.jeu
      if (this.ferme || !this.estHote || !courant) return
      // L'état a pu changer pendant la réflexion : la manche s'est résolue, le
      // bot a été relevé, l'arbitrage est passé à quelqu'un d'autre. On
      // redemande simplement qui doit jouer maintenant.
      if (
        (courant.phase === 'choix' || courant.phase === 'mort-subite') &&
        !hasPlayed(courant, attendu.id) &&
        this.estBot(attendu.id)
      ) {
        const choix = choisirBot(courant, attendu.id, this.niveauDe(attendu.id))
        this.table.appliquer(attendu.id, { t: 'choix', choix })
        this.diffuserEtat()
        this.changer()
      }
      this.planifierBot()
    }, delaiBot(this.niveauDe(attendu.id)))
  }

  private arreterBots(): void {
    if (!this.minuteurBot) return
    clearTimeout(this.minuteurBot)
    this.minuteurBot = null
  }

  // ───────────────────────── battement de cœur ─────────────────────────

  /**
   * Toutes les deux secondes : l'hôte bat la mesure et fait le tour de sa table ;
   * les autres vérifient qu'ils l'entendent encore.
   */
  private battre(): void {
    if (!this.canal) return
    if (this.estHote) {
      this.canal.envoyer('tick', {
        from: this.moi,
        epoch: this.salon.epoch,
        seq: this.jeu?.seq ?? -1,
        at: Date.now(),
      })
      this.balayer()
      // Le filet des bots : les coups qui les remettent en mouvement sont
      // appelés là où l'état change, mais un arbitre qui vient de reprendre la
      // main au milieu d'une manche n'a, lui, rien vu changer.
      this.planifierBot()
      return
    }
    if (!this.salon.hoteClientId) return
    if (Date.now() - this.hoteVuA <= SILENCE_MS) return
    // Personne n'est « parti » — c'est bien le problème : le lien est mort sans
    // que rien ne le dise, et le joueur tapait dans le vide en croyant jouer.
    if (this.lien !== 'perdu') {
      this.lien = 'perdu'
      this.changer()
    }
    this.armerGraceHote()
  }

  /** L'hôte fait le tour de sa table : qui n'a rien dit depuis trop longtemps ? */
  private balayer(): void {
    const maintenant = Date.now()
    let change = false
    for (const joueur of this.table.salon.joueurs) {
      if (joueur.clientId === this.moi || !joueur.connecte) continue
      // Un bot ne dit jamais rien : le déclarer absent au bout de huit
      // secondes de silence viderait la table de ses bots à la première manche.
      if (joueur.bot) continue
      if (maintenant - (this.vuA.get(joueur.clientId) ?? 0) <= SILENCE_MS) continue
      this.marquerAbsent(joueur.clientId)
      change = true
    }
    if (!change) return
    this.publierSalon()
    this.changer()
  }

  /**
   * Un message est arrivé de cet appareil : il est là.
   *
   * N'importe lequel suffit — un `pong`, une intention. Attendre un `hello` en
   * bonne et due forme, ce serait laisser la table le croire parti un tour de
   * plus pendant qu'il regarde son écran.
   */
  private noterVivant(id: string, peer?: string): void {
    this.vuA.set(id, Date.now())
    if (!this.estHote) return
    const joueur = this.table.salon.joueurs.find((j) => j.clientId === id)
    if (!joueur) return
    const etaitAbsent = !joueur.connecte
    if (peer) this.table.noterPair(id, peer)
    if (!etaitAbsent) return
    this.table.revenir(id, joueur.nom, peer ?? null)
    this.absentsDepuis.delete(id)
    this.publierSalon()
    this.diffuserEtat()
    this.changer()
  }

  /** Un message venu de l'hôte en titre : le lien tient, la grâce s'annule. */
  private noterHoteVivant(peer?: string): void {
    this.hoteVuA = Date.now()
    if (this.estHote) return
    if (peer) this.hotePeer = peer
    this.viderGraceHote()
    if (this.minuteurLien) clearTimeout(this.minuteurLien)
    this.minuteurLien = null
    if (this.lien === 'lie') return
    this.lien = 'lie'
    this.changer()
  }

  private marquerAbsent(id: string): void {
    if (!this.absentsDepuis.has(id)) this.absentsDepuis.set(id, Date.now())
    if (!this.estHote) return
    this.table.sortir(id)
    this.planifierBot()
  }

  // ───────────────────── salon reçu, règne comparé ─────────────────────

  /**
   * Un salon publié par quelqu'un d'autre.
   *
   * C'est ici que se règle le « split brain » : deux appareils coupés l'un de
   * l'autre peuvent se croire tous les deux arbitres, chacun ignorant les
   * salons de l'autre. Le règne le plus récent l'emporte ; à égalité, le plus
   * petit identifiant — un ordre que les deux calculent à l'identique sans avoir
   * à se parler.
   */
  private recevoirSalon(salon: Salon): void {
    if (salon.epoch < this.salon.epoch) return

    if (this.estHote) {
      if (salon.epoch === this.salon.epoch && salon.hoteClientId >= this.salon.hoteClientId) return
      // On rend l'arbitrage, pas son siège : le clientId reste l'identité.
      this.cesserArbitrage()
      this.adopterSalon(salon)
      this.noterHoteVivant()
      this.ecouteurs.onAvis({ code: 'hotePris' })
      this.canal?.envoyer('hello', { clientId: this.moi, nom: this.monNom })
      return
    }

    // Deux prétendants au même règne peuvent être joignables tous les deux : le
    // même départage, sinon le salon d'un invité changerait de main à chaque
    // message reçu.
    const connu = this.salon.hoteClientId
    if (connu && salon.epoch === this.salon.epoch && salon.hoteClientId > connu) return

    const changementDArbitre = salon.hoteClientId !== connu
    const etaitFerme = this.salon.lancee || this.salon.joueurs.length >= this.salon.places
    const libre = salon.joueurs.length < salon.places
    this.noterHoteVivant()
    this.adopterSalon(salon)

    // Un nouvel arbitre n'a pas la liste d'attente de l'ancien, et ne sait
    // peut-être rien de nous. On se represente — une fois, au changement, et non
    // à chaque publication, sous peine de tempête de `hello`.
    //
    // Un refusé a une réponse définitive et ne redemande rien. Un spectateur,
    // non : il n'a jamais été refusé, la table était seulement pleine ou lancée.
    // Quand elle se rouvre, il redemande, une seule fois par réouverture.
    const rouverte = this.statut === 'spectateur' && etaitFerme && !salon.lancee && libre
    if (this.statut === 'refuse') return
    if (changementDArbitre || rouverte) {
      this.canal?.envoyer('hello', { clientId: this.moi, nom: this.monNom })
    }
  }

  private adopterSalon(salon: Salon): void {
    // Une nouvelle partie a été annoncée : celle d'avant n'existe plus. Sans
    // cela l'invité garde son état final, rejette le premier état de la partie
    // suivante — plus petit — et reste devant son classement.
    if (!salon.lancee) this.jeuRecu = null
    this.salonRecu = salon
    // Si le nouveau salon ne nous nomme plus arbitre, on lâche l'état avec le
    // titre : le garder, c'est repartir d'un numéro plus petit que celui du
    // vrai arbitre, donc voir tous ses états rejetés comme périmés.
    const jeSuisArbitre = salon.hoteClientId === this.moi
    this.table.adopter(salon, jeSuisArbitre ? this.table.jeu : null)
    if (salon.joueurs.some((j) => j.clientId === this.moi)) this.statut = 'inconnu'
    for (const joueur of salon.joueurs) {
      if (joueur.connecte) this.absentsDepuis.delete(joueur.clientId)
      else if (!this.absentsDepuis.has(joueur.clientId)) {
        this.absentsDepuis.set(joueur.clientId, Date.now())
      }
    }
    this.changer()
  }

  /**
   * Ce message vient-il de quelqu'un qui fait autorité ?
   *
   * L'arbitre en titre, ou un règne plus récent — dont le salon est déjà en
   * route, l'hôte publiant toujours la table avant l'état.
   */
  private deLArbitre(from: string, epoch: number): boolean {
    if (epoch > this.salon.epoch) return true
    return from === this.salon.hoteClientId
  }

  /** Cet état est-il plus vieux que ce qu'on sait déjà ? */
  private perime(epoch: number, round: number, jeu: GameState): boolean {
    if (epoch !== this.salon.epoch) return epoch < this.salon.epoch
    // Le numéro d'état repart de zéro à chaque partie : entre deux parties, il
    // ne dit plus rien de l'ancienneté.
    if (round !== this.salon.round) return round < this.salon.round
    return this.jeuRecu !== null && jeu.seq < this.jeuRecu.seq
  }

  /**
   * Tout ce qu'un arbitre tenait et qu'un invité n'a plus à tenir — **l'état de
   * la partie compris**.
   *
   * Le garder serait ne pas abdiquer : le nouvel arbitre repart d'un numéro plus
   * petit, tous ses états seraient rejetés comme périmés, et l'ex-hôte jouerait
   * des coups datés d'une partie que plus personne ne joue.
   */
  private cesserArbitrage(): void {
    // Les bots sont du ressort de l'arbitre : leur coup en attente vise une
    // partie dont on n'a plus la charge.
    this.arreterBots()
    this.jeuRecu = null
    this.juges.clear()
    this.demandesEnAttente = []
    this.refuses.clear()
  }

  /**
   * L'arbitre reprend la main les mains vides : quelqu'un lui rend l'état.
   *
   * Il ne l'accepte que s'il n'a rien, ou quelque chose de plus vieux — sinon
   * n'importe quel pair pourrait rembobiner la partie.
   */
  private adopterEtatRelaye(epoch: number, round: number, jeu: GameState): void {
    if (epoch !== this.salon.epoch || round !== this.salon.round) return
    const actuel = this.table.jeu
    if (actuel && actuel.seq >= jeu.seq) return
    this.table.adopter(this.table.salon, jeu)
    this.diffuserEtat()
    this.planifierBot()
    this.changer()
  }

  /**
   * La table telle qu'on la connaît, corrigée de ce qu'on vient d'apprendre.
   *
   * Notre copie est une photo, et elle peut dater : celle où ce joueur était
   * parti. La lui renvoyer telle quelle, à la seconde où il se manifeste, c'est
   * lui annoncer qu'il est absent — et chez un hôte qui revient d'un
   * rechargement de page, c'est le premier message qu'il lit.
   */
  private tableVuePar(id: string, peer: string): Salon {
    return {
      ...this.salon,
      joueurs: this.salon.joueurs.map((j) =>
        j.clientId === id ? { ...j, connecte: true, peerId: peer } : j,
      ),
    }
  }

  /**
   * Le pair de l'arbitre, avec un repli.
   *
   * Le salon porte un `peerId` par siège, mais c'est l'arbitre qui l'entretient,
   * et il le met à `null` dès qu'il nous a crus partis — exactement l'instant où
   * l'on cherche à le joindre. On garde donc de notre côté le pair d'où viennent
   * ses battements.
   */
  private pairDeLHote(): string | undefined {
    const assis = this.salon.joueurs.find((j) => j.clientId === this.salon.hoteClientId)?.peerId
    return assis ?? this.hotePeer ?? undefined
  }

  // ───────────────────── qui entre, qui n'entre pas ─────────────────────

  private accueillir(id: string, nom: string, peer: string): void {
    const verdict = this.table.accueil(
      id,
      this.refuses,
      new Set(this.demandesEnAttente.map((d) => d.clientId)),
    )

    if (verdict.kind === 'retour') {
      // Le siège lui appartient toujours : il le retrouve intact, et son mur
      // avec. Aucun accord à redemander — un rechargement de page n'est pas une
      // arrivée, et une porte qui claque dans le dos serait la pire des règles.
      this.table.revenir(id, nom, peer)
      this.absentsDepuis.delete(id)
      this.publierSalon()
      this.diffuserEtat()
      this.changer()
      return
    }

    if (verdict.kind === 'demande') {
      // Le pair se represente à chaque publication du salon : une même demande
      // ne s'empile pas, elle se met simplement à jour.
      const deja = this.demandesEnAttente.find((d) => d.clientId === id)
      if (deja) {
        deja.nom = nom
        deja.peer = peer
      } else {
        this.demandesEnAttente.push({ clientId: id, nom, peer })
      }
      this.canal?.envoyer('join', { clientId: id, statut: 'attente' }, peer)
      this.changer()
      return
    }

    // Refusé, table pleine ou partie lancée : le pair regarde. On le lui dit —
    // sans réponse, il se representerait à chaque publication du salon. On lui
    // envoie aussi la table, faute de quoi il resterait devant un écran
    // d'attente sans savoir pourquoi.
    const statut = verdict.kind === 'refuse' ? 'refuse' : 'spectateur'
    this.canal?.envoyer('join', { clientId: id, statut }, peer)
    this.canal?.envoyer('lobby', this.table.salon, peer)
  }

  /** L'hôte accorde une place. */
  admettre(id: string): void {
    if (!this.estHote) return
    const demande = this.demandesEnAttente.find((d) => d.clientId === id)
    const attente = new Set(this.demandesEnAttente.map((d) => d.clientId))
    if (!demande || !this.table.peutAdmettre(id, attente)) {
      this.demandesEnAttente = this.demandesEnAttente.filter((d) => d.clientId !== id)
      this.changer()
      return
    }
    this.demandesEnAttente = this.demandesEnAttente.filter((d) => d.clientId !== id)
    this.refuses.delete(id)
    this.table.admettre(id, demande.nom, demande.peer)
    this.vuA.set(id, Date.now())
    this.publierSalon()
    this.changer()
  }

  /**
   * L'hôte refuse.
   *
   * L'appareil est retenu : sans cela il se representerait à la publication
   * suivante du salon, et l'hôte passerait sa soirée à refuser le même.
   */
  refuser(id: string): void {
    if (!this.estHote) return
    const demande = this.demandesEnAttente.find((d) => d.clientId === id)
    this.demandesEnAttente = this.demandesEnAttente.filter((d) => d.clientId !== id)
    this.refuses.add(id)
    if (demande) this.canal?.envoyer('join', { clientId: id, statut: 'refuse' }, demande.peer)
    this.changer()
  }

  /**
   * La grâce laissée à l'hôte avant d'en désigner un autre.
   *
   * Sans elle, un invité qui perd son seul lien vers l'hôte s'élit aussitôt : la
   * table se retrouve avec deux arbitres qui s'ignorent. La même durée que
   * l'absence : ce sont les deux faces d'une seule question — « est-il vraiment
   * parti ? »
   */
  private armerGraceHote(): void {
    if (this.estHote || this.graceHote) return
    this.graceHote = setTimeout(() => {
      this.graceHote = null
      this.elireHote()
    }, ABSENCE_MS)
  }

  private viderGraceHote(): void {
    if (this.graceHote) clearTimeout(this.graceHote)
    this.graceHote = null
  }

  /**
   * L'hôte n'est plus là : le plus petit identifiant encore présent reprend
   * l'arbitrage, sous un règne plus récent.
   *
   * Le plus petit identifiant, et non « moi » : c'est un ordre que tous les
   * survivants calculent à l'identique sans avoir à se parler, donc un seul se
   * lève.
   */
  private elireHote(): void {
    if (this.estHote) return
    // Un salon jamais lancé dont l'hôte disparaît n'a plus d'objet : mieux vaut
    // le dire que d'élire un arbitre pour une table qui n'existe pas.
    if (!this.salon.lancee) return
    const presents = this.salon.joueurs
      // Un bot n'arbitre pas : il n'a ni canal ni écran, et la table
      // resterait sans personne pour faire avancer les manches.
      .filter((j) => !j.bot)
      .filter((j) => j.connecte || j.clientId === this.moi)
      .map((j) => j.clientId)
      .sort()
    if (presents[0] !== this.moi) return

    const salon: Salon = {
      ...this.salon,
      hoteClientId: this.moi,
      epoch: this.salon.epoch + 1,
      joueurs: this.salon.joueurs.map((j) => ({ ...j, hote: j.clientId === this.moi })),
    }
    this.salonRecu = salon
    this.table.adopter(salon, this.jeuRecu)
    this.lien = 'lie'
    this.publierSalon()
    this.diffuserEtat()
    this.changer()
  }

  // ───────────────────────── ce que l'écran demande ─────────────────────────

  private publierSalon(): void {
    if (!this.estHote) return
    this.canal?.envoyer('lobby', this.table.salon)
  }

  /** Diffuse l'état, redacté pour chacun : personne ne reçoit les choix des autres. */
  private diffuserEtat(vers?: string): void {
    const jeu = this.table.jeu
    if (!this.estHote || !jeu) return
    const enveloppe = (id: string) => ({
      from: this.moi,
      epoch: this.salon.epoch,
      round: this.salon.round,
      jeu: vuePour(jeu, id).jeu,
    })
    if (vers) {
      const joueur = this.table.salon.joueurs.find((j) => j.peerId === vers)
      this.canal?.envoyer('state', enveloppe(joueur?.clientId ?? ''), vers)
      return
    }
    for (const joueur of this.table.salon.joueurs) {
      if (joueur.clientId === this.moi || !joueur.peerId) continue
      this.canal?.envoyer('state', enveloppe(joueur.clientId), joueur.peerId)
    }
  }

  /**
   * Un geste, appliqué chez soi si l'on arbitre, envoyé à l'arbitre sinon.
   *
   * L'invité ne l'applique pas localement : la table est la seule vérité, et un
   * écran qui devance l'arbitre finirait par afficher une partie qui n'existe
   * pas.
   */
  private agir(geste: Geste): void {
    if (this.estHote) {
      const ok = this.table.appliquer(this.moi, geste)
      if (!ok) this.ecouteurs.onAvis({ code: 'gestRefuse' })
      this.publierSalon()
      this.diffuserEtat()
      this.planifierBot()
      this.changer()
      return
    }
    this.envoyerIntention(geste)
  }

  private envoyerIntention(geste: Geste): void {
    const nonce = `${this.moi}:${++this.nonces}`
    const intention: Intention = {
      clientId: this.moi,
      epoch: this.salon.epoch,
      seq: this.jeu?.seq ?? -1,
      nonce,
      geste,
    }
    const abandonA = Date.now() + ABANDON_MS

    // Adressée à l'arbitre, et **jamais** à la cantonade : une intention réémise
    // cinq fois vers trois pairs, c'est quinze messages pour un choix — et un
    // second arbitre qui traînerait l'appliquerait aussi.
    const partir = (): void => {
      const vers = this.pairDeLHote()
      if (vers !== undefined) this.canal?.envoyer('intent', intention, vers)
    }

    const encore = (): void => {
      if (Date.now() >= abandonA) {
        this.enVol.delete(nonce)
        this.ecouteurs.onAvis({ code: 'lienPerdu' })
        return
      }
      partir()
      this.enVol.set(nonce, setTimeout(encore, REEMISSION_MS))
    }

    partir()
    this.enVol.set(nonce, setTimeout(encore, REEMISSION_MS))
  }

  private viderEnVol(): void {
    this.enVol.forEach((t) => clearTimeout(t))
    this.enVol.clear()
  }

  /** L'arbitre reçoit une intention : il tranche une fois, et répond à l'émetteur. */
  private recevoirIntention(intention: Intention, peer: string): void {
    // Une intention réémise ne se rejoue pas : on redit ce qu'on avait répondu.
    // Sans cela, un accusé perdu ferait jouer le geste une seconde fois.
    const deja = this.juges.get(intention.nonce)
    if (deja) {
      this.canal?.envoyer('ack', deja, peer)
      return
    }

    let reponse: Recu
    if (!this.table.jeu && intention.geste.t === 'choix') {
      reponse = { nonce: intention.nonce, ok: false, erreur: 'pasDePartie' }
    } else {
      const ok = this.table.appliquer(intention.clientId, intention.geste)
      reponse = ok
        ? { nonce: intention.nonce, ok: true }
        : { nonce: intention.nonce, ok: false, erreur: 'refuse' }
    }

    this.juges.set(intention.nonce, reponse)
    if (this.juges.size > MEMOIRE_RECUS) {
      const plusVieux = this.juges.keys().next().value
      if (plusVieux !== undefined) this.juges.delete(plusVieux)
    }
    this.canal?.envoyer('ack', reponse, peer)
    this.publierSalon()
    this.diffuserEtat()
    this.planifierBot()
    this.changer()
  }

  private signalerErreurGeste(erreur: ErreurIntention): void {
    if (erreur === 'refuse') this.ecouteurs.onAvis({ code: 'gestRefuse' })
    else if (erreur === 'lienPerdu') this.ecouteurs.onAvis({ code: 'lienPerdu' })
  }

  private armerTimeoutLien(): void {
    if (this.minuteurLien) clearTimeout(this.minuteurLien)
    this.minuteurLien = setTimeout(() => {
      if (this.lien === 'lie') return
      this.lien = 'perdu'
      this.ecouteurs.onAvis({ code: 'lienEchoue' })
      this.changer()
    }, LIEN_TIMEOUT_MS)
  }

  /**
   * Trystero ne signale que les échecs survenus après avoir trouvé un pair —
   * typiquement : SDP échangé, mais aucun chemin réseau entre les deux. C'est le
   * symptôme d'un NAT symétrique sans serveur TURN.
   */
  private signalerEchecLien(erreur: string): void {
    // Trystero signale une tentative ratée, pas une panne générale : en pleine
    // partie, ou avec des pairs déjà au bout du fil, c'est une paire parmi
    // d'autres qui n'a pas abouti.
    if (this.salon.lancee || (this.canal?.pairs().length ?? 0) > 0) return
    this.lien = 'perdu'
    if (this.minuteurLien) clearTimeout(this.minuteurLien)
    this.minuteurLien = null
    this.ecouteurs.onAvis({ code: /turn/i.test(erreur) ? 'lienBloque' : 'lienEchoue' })
    this.changer()
  }

  // ───────────────────────────── actions ─────────────────────────────

  choisirIdentite(ci: 0 | 1 | 2 | 3): void {
    this.agir({ t: 'identite', ci })
  }

  renommer(nom: string): void {
    this.monNom = nom
    this.agir({ t: 'nom', nom })
  }

  sePreparer(pret: boolean): void {
    this.agir({ t: 'pret', pret })
  }

  jouer(choix: Choice[]): void {
    this.agir({ t: 'choix', choix })
  }

  passerALaSuite(): void {
    this.agir({ t: 'suite' })
  }

  /* Réservé à l'hôte : les réglages de table n'appartiennent qu'à lui. */

  reglerFormat(f: Format): void {
    if (!this.estHote) return
    this.table.reglerFormat(f)
    this.publierSalon()
    this.changer()
  }

  reglerCartesManche(on: boolean): void {
    if (!this.estHote) return
    this.table.reglerCartesManche(on)
    this.publierSalon()
    this.changer()
  }

  reglerPlaces(n: number): void {
    if (!this.estHote) return
    this.table.reglerPlaces(n)
    this.publierSalon()
    this.changer()
  }

  lancer(): void {
    if (!this.estHote) return
    this.table.lancer()
    this.publierSalon()
    this.diffuserEtat()
    this.planifierBot()
    this.changer()
  }

  rejouer(): void {
    if (!this.estHote) return
    this.table.rejouer()
    this.publierSalon()
    this.diffuserEtat()
    this.planifierBot()
    this.changer()
  }

  /**
   * Un bot de plus à la table.
   *
   * Réservé à l'hôte, comme les autres réglages : c'est lui qui tiendra leurs
   * cartes. Un invité qui en demanderait un ne ferait que peupler un salon que
   * personne d'autre ne voit.
   */
  ajouterBot(): void {
    if (!this.estHote) return
    if (!this.table.ajouterBot()) return
    this.publierSalon()
    this.changer()
  }

  retirerBot(id: string): void {
    if (!this.estHote) return
    if (!this.table.retirerBot(id)) return
    this.publierSalon()
    this.changer()
  }

  /**
   * Le niveau d'un bot, siège par siège.
   *
   * Réservé à l'hôte comme les autres réglages de table : c'est lui qui joue
   * les cartes de ces sièges-là, et le niveau que les autres lisent n'est que
   * le reflet du sien.
   */
  reglerNiveauBot(id: string, niveau: NiveauBot): void {
    if (!this.estHote) return
    if (!this.table.reglerNiveauBot(id, niveau)) return
    this.publierSalon()
    this.changer()
  }
}
