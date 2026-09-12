import { useEffect, useState } from 'react'
import { SAFE_TOP, TEXTE, TITRE } from '../theme'
import { NIVEAUX_BOT, NIVEAU_DEFAUT, type NiveauBot } from '../game/bot'
import { MAX_SIEGES, bots, humains } from '../net/room'
import type { VueSession } from '../net/session'
import { useT, type Cle, type T } from '../i18n'
import { Etiquette, Forme, Panneau, Scribble, Texte, usePanneauEncre, useShapeName } from '../ui/atoms'
import { BoutonConversation, FeuilleDiscussion, useSalle } from '../ui/discussion'
import { QR, lienDePartie } from '../ui/QR'
import { Ecran } from '../ui/shell'
import { useTheme } from '../ui/theme'

/**
 * 03 · Salon d'attente.
 *
 * Le code à partager, qui est connecté, et le choix de son identité — la forme
 * autant que la couleur. Repris trait pour trait de la planche : marges
 * 64/20/20, écarts de 18, panneau de code à pleine encre, lignes de joueur à
 * 12 × 14, pastilles d'identité de 70 px.
 *
 * Trois ajouts que la planche ne pouvait pas prévoir, parce qu'ils naissent du
 * réseau et non du jeu : l'état de la mise en relation (un code affiché alors
 * que personne ne peut le joindre serait un mensonge), les demandes d'entrée —
 * le code amène à la porte, l'hôte l'ouvre — et les bots, sans quoi un salon
 * ouvert seul n'offre rien d'autre que d'attendre. Les trois sont dessinés
 * avec les seules pièces de la planche : un panneau, une pastille, un mot.
 */
export function Salon({
  etat,
  avis,
  onIdentite,
  onPret,
  onAdmettre,
  onRefuser,
  onAjouterBot,
  onRetirerBot,
  onNiveauBot,
  onNiveauBots,
  onLancer,
  onQuitter,
  onAutreCode,
}: {
  etat: VueSession
  avis?: string
  onIdentite: (ci: 0 | 1 | 2 | 3) => void
  onPret: (pret: boolean) => void
  onAdmettre: (id: string) => void
  onRefuser: (id: string) => void
  onAjouterBot: () => void
  onRetirerBot: (id: string) => void
  onNiveauBot: (id: string, niveau: NiveauBot) => void
  /** Le niveau de tous les bots à la fois — le réglage par défaut de la table. */
  onNiveauBots: (niveau: NiveauBot) => void
  onLancer: () => void
  onQuitter: () => void
  /** Repartir de l'écran « Rejoindre », le code encore en main. */
  onAutreCode: () => void
}) {
  const t = useTheme()
  const tr = useT()
  const encre = usePanneauEncre()
  const nomForme = useShapeName()
  const [copie, setCopie] = useState(false)

  /*
   * La conversation.
   *
   * Elle est ouverte ICI et nulle part ailleurs : le salon est le seul moment
   * de la partie où l'on a du temps. Trois secondes pour lire quatre murs et
   * choisir une carte, ce n'est pas le moment de lire un fil — en partie il
   * reste l'éventail, six emoji au bout d'un doigt.
   */
  const salle = useSalle()
  const [conversation, setConversation] = useState(false)
  /** Le réglage siège par siège, replié par défaut. */
  const [parSiege, setParSiege] = useState(false)
  /** Fermer un salon est sans retour pour les autres : on le demande deux fois. */
  const [confirmeFermeture, setConfirmeFermeture] = useState(false)
  const [lu, setLu] = useState(salle?.messages.length ?? 0)
  const recus = salle?.messages.length ?? 0
  useEffect(() => {
    if (conversation) setLu(recus)
  }, [conversation, recus])

  const { salon, moi, hote, lien, demandes, statutDemande } = etat
  const joueurs = salon.joueurs
  const jeSuis = joueurs.find((j) => j.clientId === moi)
  /*
   * Un bot RÉSERVE une place, il ne la prend pas.
   *
   * Le salon affichait un grand code à partager et, juste dessous, « 4 / 4 »
   * parce que trois bots s'étaient assis. Les deux instructions se
   * contredisaient au même moment, et c'est le code qui se lit le premier :
   * la personne partageait, et l'invité trouvait porte close.
   */
  const gens = humains(salon)
  const robots = bots(salon)
  const libres = salon.places - gens.length
  const assez = joueurs.length >= 2
  const complet = libres <= 0
  const peutLancer =
    hote && lien !== 'recherche' && assez && (salon.format !== 'equipes' || joueurs.length === 4)
  const niveauTable = salon.niveauBots ?? NIVEAU_DEFAUT

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(salon.code)
      setCopie(true)
      setTimeout(() => setCopie(false), 1800)
    } catch {
      /* presse-papier refusé : le code reste lisible à l'écran */
    }
  }

  const partager = async () => {
    const texte = `${tr('salon.code.invitation', { code: salon.code })} ${lienDePartie(salon.code)}`
    try {
      if (navigator.share) await navigator.share({ title: 'Rempart', text: texte })
      else await copier()
    } catch {
      /* partage annulé */
    }
  }

  return (
    <Ecran>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: `calc(${SAFE_TOP} + 20px) 20px 20px 20px`,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          overflowY: 'auto',
        }}
      >
        {/* Le code à partager. */}
        <div
          style={{
            borderRadius: 20,
            background: encre.bg,
            boxShadow: `0 5px 0 ${encre.edge}`,
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Etiquette size={11} color={encre.sub} style={{ letterSpacing: '0.14em' }}>
            {tr('salon.code.titre')}
          </Etiquette>
          {/* Le code lui-même copie : c'est la première chose qu'on touche
              quand on veut le donner, et il ne répondait pas. */}
          <button
            type="button"
            onClick={copier}
            aria-label={tr('salon.code.copier.aria', {
              code: salon.code.split('').join(' '),
            })}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 6px',
              font: `700 40px/1.1 ${TITRE}`,
              letterSpacing: '0.1em',
              color: encre.fg,
              textAlign: 'center',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {salon.code}
          </button>

          {/* Un code affiché pendant que la mise en relation cherche encore
              serait un code que personne ne peut joindre. */}
          {/*
           * Le QR, sous le code.
           *
           * Une partie de quatre minutes se joue surtout autour d'une table :
           * l'autre téléphone est à portée de main, et le scanner va plus vite
           * que de dicter huit caractères — et plus sûrement.
           */}
          {lien === 'lie' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 13,
                width: '100%',
                marginTop: 6,
                background: encre.inner,
                borderRadius: 16,
                padding: 12,
              }}
            >
              <QR valeur={lienDePartie(salon.code)} taille={96} />
              <span
                style={{
                  font: `500 12px/1.4 ${TEXTE}`,
                  color: encre.sub,
                  flex: 1,
                  minWidth: 0,
                  textWrap: 'pretty',
                }}
              >
                {tr('salon.qr.aide')}
              </span>
            </div>
          )}

          {lien === 'lie' ? (
            <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 4 }}>
              <BoutonEncre onClick={copier}>
                {tr(copie ? 'salon.code.copie' : 'salon.code.copier')}
              </BoutonEncre>
              <BoutonEncre onClick={partager}>{tr('salon.code.partager')}</BoutonEncre>
            </div>
          ) : (
            <div
              role="status"
              style={{
                width: '100%',
                marginTop: 4,
                borderRadius: 14,
                background: lien === 'perdu' ? t.clayText : encre.inner,
                padding: '11px 13px',
                font: `500 12px/1.4 ${TEXTE}`,
                color: lien === 'perdu' ? t.panel : encre.sub,
                textAlign: 'center',
              }}
            >
              {lien === 'perdu'
                ? (avis ?? tr('salon.lien.perdu'))
                : tr('salon.lien.recherche')}
            </div>
          )}
        </div>

        {/* Qui est là. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Etiquette>{tr('salon.joueurs.titre')}</Etiquette>
            <span style={{ font: `600 12px/1 ${TEXTE}`, color: t.ink }}>
              {libres > 0
                ? tr('salon.compte', {
                    joueurs: tr.n('joueur', gens.length),
                    places: tr.n('place', libres),
                  })
                : tr('salon.compte.complet', { joueurs: tr.n('joueur', gens.length) })}
            </span>
          </div>

          {joueurs.map((j) => (
            <Panneau key={j.clientId} radius={16} pad="12px 14px" gap={10}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Forme ci={j.ci} size={26} />
                <span style={{ font: `700 17px/1 ${TITRE}`, color: t.ink }}>{j.nom}</span>
                {/* Un bot n'a pas d'état à annoncer : il tient une place, il
                    ne l'occupe pas. Ce qu'il en dit se lit sous son nom, à voix
                    basse — en capitales espacées, la phrase criait plus fort
                    que le nom du joueur juste à côté. */}
                {!j.bot && (
                  <Etiquette
                    size={10}
                    color={etiquetteCouleur(
                      j.clientId === moi,
                      j.hote,
                      j.pret,
                      j.connecte,
                      t.ink2,
                      t.green,
                      t.clayText,
                    )}
                    style={{ letterSpacing: '0.1em', marginLeft: 'auto' }}
                  >
                    {tr(etiquetteJoueur(j.clientId === moi, j.hote, j.pret, j.connecte))}
                  </Etiquette>
                )}
                {j.bot && <span style={{ marginLeft: 'auto' }} />}
                {/* Un bot se relève tant que la partie n'a pas commencé :
                    un ami arrive toujours à la dernière seconde. */}
                {j.bot && hote && !salon.lancee && (
                  <button
                    type="button"
                    onClick={() => onRetirerBot(j.clientId)}
                    aria-label={tr('salon.bot.retirer.aria', { nom: j.nom })}
                    style={{
                      background: 'none',
                      border: 'none',
                      // De quoi viser au pouce sans grandir la ligne : la
                      // hauteur reste celle de la pastille d'identité.
                      padding: '8px 0 8px 10px',
                      font: `600 10px/1 ${TEXTE}`,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: t.clayText,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {tr('salon.bot.retirer')}
                  </button>
                )}
              </div>
              {j.bot && (
                <span style={{ font: `500 12px/1.35 ${TEXTE}`, color: t.ink2 }}>
                  {tr('salon.bot.place')}
                </span>
              )}
              {/* Le niveau ne s'affiche plus sous CHAQUE bot : trois rangées de
                  trois pastilles identiques, c'était neuf décisions sur un
                  écran d'attente. Il y a un réglage de table plus bas, et ce
                  dépliant pour qui veut vraiment un siège à part. */}
              {j.bot && parSiege && (
                <Niveau
                  nom={j.nom}
                  niveau={j.niveau ?? NIVEAU_DEFAUT}
                  reglable={hote && !salon.lancee}
                  onNiveau={(n) => onNiveauBot(j.clientId, n)}
                />
              )}
            </Panneau>
          ))}

          {/* Les demandes d'entrée, chez l'hôte seul. Le code amène à la porte ;
              c'est lui qui l'ouvre. */}
          {demandes.map((d) => (
            <Panneau
              key={d.clientId}
              radius={16}
              pad="12px 14px"
              gap={10}
              bg={t.cardOff}
              edge={null}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Scribble nom="wait" width={34} height={26} />
                <span style={{ font: `700 17px/1 ${TITRE}`, color: t.ink }}>{d.nom}</span>
                <Etiquette size={10} style={{ letterSpacing: '0.1em', marginLeft: 'auto' }}>
                  {tr('salon.demande.veutJouer')}
                </Etiquette>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <BoutonPorte ton="ink" onClick={() => onAdmettre(d.clientId)} disabled={complet}>
                  {tr(complet ? 'salon.demande.pleine' : 'salon.demande.ouvrir')}
                </BoutonPorte>
                <BoutonPorte ton="creux" onClick={() => onRefuser(d.clientId)}>
                  {tr('salon.demande.refuser')}
                </BoutonPorte>
              </div>
            </Panneau>
          ))}

          {/* La place libre, avec son gribouillage : un temps mort, donc il y a
              sa place. */}
          {joueurs.length < salon.places && demandes.length === 0 && (
            <div
              style={{
                borderRadius: 16,
                background: t.cardOff,
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                minHeight: 52,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Scribble nom="wait" width={58} height={40} />
                <Texte size={13} style={{ lineHeight: 1.3 }}>
                  {placeLibre(tr, salon.places - joueurs.length, assez, joueurs.length)}
                </Texte>
              </div>
              {/* Personne n'est encore là, et il faut être deux : sans ce
                  bouton, l'hôte seul n'a rien d'autre à faire qu'attendre. */}
              {hote && (
                // En ligne : le bouton porte `flex: 1` pour occuper la largeur,
                // et dans une colonne ce même flex lui mangerait sa hauteur.
                <div style={{ display: 'flex' }}>
                  <BoutonPorte ton="ink" onClick={onAjouterBot}>
                    {tr('salon.bot.ajouter')}
                  </BoutonPorte>
                </div>
              )}
            </div>
          )}
        </div>

        {/*
         * Le niveau des bots, pour toute la table.
         *
         * Un seul réglage à prendre au lieu de neuf : c'est ce que presque
         * tout le monde veut, et un écran d'attente n'est pas le lieu d'une
         * décision par siège. Le dépliant garde l'autre façon de faire pour
         * qui la cherche — un adversaire sérieux et deux qui laissent
         * respirer.
         */}
        {hote && !salon.lancee && robots.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <Etiquette>{tr('salon.niveau.titre')}</Etiquette>
              {robots.length > 1 && (
                <button
                  type="button"
                  onClick={() => setParSiege((v) => !v)}
                  aria-expanded={parSiege}
                  style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: 'none',
                    padding: '4px 0 4px 10px',
                    font: `500 12px/1 ${TEXTE}`,
                    color: t.ink2,
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {tr(parSiege ? 'salon.niveau.parSiege.fermer' : 'salon.niveau.parSiege.ouvrir')}
                </button>
              )}
            </div>
            <Niveau
              nom={tr('salon.niveau.titre')}
              niveau={niveauTable}
              reglable
              onNiveau={onNiveauBots}
              haut
            />
          </div>
        )}

        {/* Mon identité : la forme autant que la couleur. */}
        {jeSuis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Etiquette>{tr('salon.identite.titre')}</Etiquette>
            <div style={{ display: 'flex', gap: 10 }}>
              {([0, 1, 2, 3] as const).map((ci) => {
                const occupant = joueurs.find((j) => j.ci === ci)
                const amoi = occupant?.clientId === moi
                /*
                 * Une forme tenue par un bot reste à prendre.
                 *
                 * Trois formes sur quatre marquées « PRIS » parce que des bots
                 * les portaient rendaient ce sélecteur mort, alors que rien ne
                 * s'y opposait : un bot n'a aucune préférence, il glisse sur
                 * celle qu'on lui laisse.
                 */
                const pris = !!occupant && !occupant.bot && !amoi
                const libre = !pris && !amoi
                return (
                  <button
                    key={ci}
                    type="button"
                    onClick={() => libre && onIdentite(ci)}
                    disabled={!libre}
                    aria-pressed={amoi}
                    aria-label={tr('salon.identite.aria', {
                      forme: nomForme(ci),
                      etat: tr(etatIdentite(amoi, pris)),
                    })}
                    style={{
                      flex: 1,
                      height: 70,
                      borderRadius: 16,
                      background: amoi ? t.selBg : libre ? t.panel : t.cardOff,
                      boxShadow: amoi
                        ? `0 4px 0 ${t.selEdge}`
                        : libre
                          ? `0 3px 0 ${t.edge}`
                          : undefined,
                      border: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: libre ? 'pointer' : 'default',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <Forme ci={ci} size={24} />
                    {/* Sur le carton à pleine encre, l'encre secondaire
                        disparaissait dans le fond : le seul état qu'on avait
                        besoin de lire était le moins lisible des trois. */}
                    <Etiquette
                      size={9}
                      color={amoi ? t.selFg : t.ink2}
                      style={{ letterSpacing: '0.08em' }}
                    >
                      {tr(etatIdentite(amoi, pris))}
                    </Etiquette>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/*
       * Le bas de l'écran est ancré, il ne défile pas.
       *
       * Sur un écran de 667 px, le code, les quatre lignes, le niveau et les
       * identités passent largement la hauteur disponible : le bouton
       * principal se trouvait sous le pli, donc l'écran d'attente n'avait plus
       * de geste visible. Il sort de la zone qui défile, et garde la marge que
       * l'indicateur d'accueil d'iOS réclame.
       */}
      <div
        style={{
          flex: '0 0 auto',
          padding: '12px 20px calc(14px + env(safe-area-inset-bottom, 0px)) 20px',
          background: t.table,
          // Le même chant que la feuille de conversation : il dit que ce qui
          // est au-dessus continue, plutôt que de laisser une carte coupée net.
          boxShadow: `0 -3px 0 ${t.edge}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
          {/* Parler à quelqu'un suppose que quelqu'un soit là : un bot ne
              répond pas, et un salon d'une personne n'a pas de conversation. */}
        {salle && (joueurs.filter((j) => !j.bot).length > 1 || recus > 0) && !conversation && (
          <BoutonConversation nonLus={recus - lu} onOuvrir={() => setConversation(true)} />
        )}
        {hote ? (
          <BoutonLancer
            onClick={onLancer}
            disabled={!peutLancer}
            /* Un état de fait, et non une condition : « 4 joueurs
               suffisent » se lisait comme une exigence non remplie. */
            note={noteLancer(tr, salon.format, gens.length, robots.length, assez)}
          >
            {tr('salon.lancer.titre')}
          </BoutonLancer>
        ) : jeSuis ? (
          <BoutonLancer
            onClick={() => onPret(!jeSuis.pret)}
            ton={jeSuis.pret ? 'ink' : 'clay'}
            note={jeSuis.pret ? tr('salon.pret.note') : undefined}
          >
            {tr(jeSuis.pret ? 'salon.pret.non' : 'salon.pret.oui')}
          </BoutonLancer>
        ) : (
          <div
            role="status"
            style={{
              minHeight: 66,
              borderRadius: 18,
              background: t.cardOff,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 20px',
              font: `500 13px/1.4 ${TEXTE}`,
              color: t.ink2,
              textAlign: 'center',
            }}
          >
            {attente(tr, statutDemande, lien)}
          </div>
        )}
        {/* Une porte close, une table pleine ou un code inconnu ne laissaient
            qu'un écran d'attente sans issue, et revenir en arrière effaçait
            les huit caractères qu'on venait de taper. */}
        {!hote &&
          !jeSuis &&
          (statutDemande === 'refuse' || statutDemande === 'spectateur' || lien === 'perdu') && (
            <BoutonPorte ton="creux" onClick={onAutreCode}>
              {tr('lien.autreCode')}
            </BoutonPorte>
          )}
        <Sortie hote={hote} onSortir={() => (hote ? setConfirmeFermeture(true) : onQuitter())} />
      </div>

      {conversation && <FeuilleDiscussion onFermer={() => setConversation(false)} />}
      {confirmeFermeture && (
        <Fermeture onFermer={onQuitter} onAnnuler={() => setConfirmeFermeture(false)} />
      )}
    </Ecran>
  )
}

/** L'état d'un joueur, rendu en CLÉ : c'est l'écran qui met les mots. */
function etiquetteJoueur(moi: boolean, hote: boolean, pret: boolean, connecte: boolean): Cle {
  if (!connecte) return 'salon.joueur.absent'
  if (moi) return hote ? 'salon.joueur.moiHote' : 'salon.joueur.moi'
  if (hote) return 'salon.joueur.hote'
  return pret ? 'salon.joueur.pret' : 'salon.joueur.choisit'
}

function etatIdentite(amoi: boolean, pris: boolean): Cle {
  return amoi ? 'salon.identite.aMoi' : pris ? 'salon.identite.pris' : 'salon.identite.libre'
}

function etiquetteCouleur(
  moi: boolean,
  hote: boolean,
  pret: boolean,
  connecte: boolean,
  ink2: string,
  vert: string,
  terre: string,
): string {
  if (!connecte) return terre
  if (moi || hote) return ink2
  return pret ? vert : ink2
}

function placeLibre(tr: T, restantes: number, assez: boolean, presents: number): string {
  return tr.n(assez ? 'salon.place.assez' : 'salon.place.pasAssez', restantes, { presents })
}

/**
 * Ce que dit le bouton de lancement, sous son libellé.
 *
 * Un état de fait — « 1 joueur · 3 bots » — et non une condition. « 4 joueurs
 * suffisent » se lisait comme une exigence qu'on n'avait pas remplie, alors
 * que c'était justement le contraire : la table était prête.
 *
 * Les deux seuls cas où la note dit encore ce qu'il MANQUE sont ceux où il
 * manque vraiment quelque chose, et où le bouton est donc éteint.
 */
function noteLancer(
  tr: T,
  format: string,
  gens: number,
  robots: number,
  assez: boolean,
): string {
  if (format === 'equipes' && gens + robots !== MAX_SIEGES) {
    return tr('salon.lancer.note.fautQuatre')
  }
  if (!assez) return tr('salon.lancer.note.fautDeux')
  if (format === 'equipes') return tr('salon.lancer.note.deuxContreDeux')
  // « 0 bot » n'apprend rien : une table sans bot ne compte que ses joueurs.
  if (robots === 0) return tr.n('joueur', gens)
  return tr('salon.lancer.note', {
    joueurs: tr.n('joueur', gens),
    bots: tr.n('bot', robots),
  })
}

/**
 * Le geste de sortie, en bas de l'écran.
 *
 * Il ne dit pas la même chose selon qui le lit : un invité **quitte** un salon
 * qui continue sans lui, l'hôte le **ferme** pour tout le monde. Le même mot
 * pour les deux laissait croire à l'hôte qu'il pouvait revenir.
 */
function Sortie({ hote, onSortir }: { hote: boolean; onSortir: () => void }) {
  const t = useTheme()
  const tr = useT()
  return (
    <button
      type="button"
      onClick={onSortir}
      style={{
        background: 'none',
        border: 'none',
        // Une cible tactile se touche : 44 px, même pour un lien de texte.
        minHeight: 44,
        padding: '4px 0 2px',
        font: `500 12px/1.5 ${TEXTE}`,
        color: t.ink2,
        textAlign: 'center',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {tr(hote ? 'salon.fermer' : 'salon.quitter')}
    </button>
  )
}

/**
 * La confirmation de fermeture, pour l'hôte seul.
 *
 * Fermer un salon est sans retour, et sans retour **pour les autres** : le
 * code cesse de mener quelque part, et ceux qui attendaient se retrouvent
 * devant rien. Un invité qui part, lui, ne coûte à personne — il n'a donc rien
 * à confirmer.
 */
function Fermeture({ onFermer, onAnnuler }: { onFermer: () => void; onAnnuler: () => void }) {
  const t = useTheme()
  const tr = useT()
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tr('salon.fermer.titre')}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        background: t.panel,
        borderRadius: '26px 26px 30px 30px',
        boxShadow: `0 -3px 0 ${t.edge}`,
        padding: '22px 20px calc(20px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        zIndex: 9,
      }}
    >
      <div style={{ font: `700 22px/1.15 ${TITRE}`, color: t.ink, textWrap: 'pretty' }}>
        {tr('salon.fermer.titre')}
      </div>
      <Texte size={14}>{tr('salon.fermer.detail')}</Texte>
      <div style={{ display: 'flex', gap: 10 }}>
        <BoutonPorte ton="ink" onClick={onFermer}>
          {tr('salon.fermer.oui')}
        </BoutonPorte>
        <BoutonPorte ton="creux" onClick={onAnnuler}>
          {tr('salon.fermer.non')}
        </BoutonPorte>
      </div>
    </div>
  )
}

function attente(tr: T, statut: VueSession['statutDemande'], lien: VueSession['lien']): string {
  if (statut === 'refuse') return tr('salon.attente.refuse')
  if (statut === 'spectateur') return tr('salon.attente.spectateur')
  if (lien === 'perdu') return tr('salon.attente.introuvable')
  if (statut === 'attente') return tr('salon.attente.frappe')
  return tr('salon.attente.cherche')
}

/**
 * Le niveau d'un bot : trois cartons, sous sa ligne.
 *
 * **Trois cartons et non un cycle.** Un cycle tient sur la ligne du nom, mais
 * il faut le toucher deux fois pour savoir ce qu'il propose ; ici les trois
 * niveaux sont lisibles sans rien toucher, et le bon se pose d'un geste. C'est
 * exactement le contrôle du « nombre de joueurs » de l'écran de création —
 * même forme, même matière : rien de neuf à apprendre.
 *
 * **Par siège, et non par table.** À quatre on veut souvent un adversaire
 * sérieux et deux qui laissent respirer ; un réglage unique l'interdirait.
 *
 * Chez l'invité, les mêmes cartons sans le geste : il lit la table qu'on lui
 * propose, il ne la règle pas — les bots ne jouent que chez l'hôte.
 */
function Niveau({
  nom,
  niveau,
  reglable,
  onNiveau,
  haut,
}: {
  nom: string
  niveau: NiveauBot
  reglable: boolean
  onNiveau: (n: NiveauBot) => void
  /**
   * Le réglage de table, à hauteur de doigt.
   *
   * Les cartons de 32 px conviennent sous la ligne d'un bot, où ils sont un
   * détail replié ; celui-ci est le contrôle principal de la section, donc il
   * prend les 44 px que demande une cible tactile.
   */
  haut?: boolean
}) {
  const t = useTheme()
  const tr = useT()
  return (
    <div
      style={{ display: 'flex', gap: 6 }}
      role="group"
      aria-label={tr('salon.bot.niveau.aria', { nom })}
    >
      {NIVEAUX_BOT.map((n) => {
        const choisi = n === niveau
        return (
          <button
            key={n}
            type="button"
            onClick={() => reglable && !choisi && onNiveau(n)}
            disabled={!reglable}
            aria-pressed={choisi}
            aria-label={tr('salon.bot.niveau.choix.aria', {
              nom,
              niveau: tr(`salon.niveau.${n}` as const),
            })}
            style={{
              flex: 1,
              height: haut ? 44 : 32,
              borderRadius: 12,
              background: choisi ? t.selBg : t.cardOff,
              boxShadow: choisi ? `0 3px 0 ${t.selEdge}` : undefined,
              border: 'none',
              font: `600 10px/1 ${TEXTE}`,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: choisi ? t.selFg : t.ink2,
              cursor: reglable && !choisi ? 'pointer' : 'default',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {tr(`salon.niveau.${n}` as const)}
          </button>
        )
      })}
    </div>
  )
}

/** Le bouton du panneau à pleine encre : même matière que son fond. */
function BoutonEncre({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const encre = usePanneauEncre()
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        height: 44,
        borderRadius: 14,
        background: encre.inner,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: `600 12px/1 ${TEXTE}`,
        letterSpacing: '0.08em',
        color: encre.fg,
        textTransform: 'uppercase',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  )
}

/** Ouvrir ou refuser la porte : deux pièces de la même taille, côte à côte. */
function BoutonPorte({
  children,
  onClick,
  ton,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  ton: 'ink' | 'creux'
  disabled?: boolean
}) {
  const t = useTheme()
  const encreux = ton === 'ink'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        height: 44,
        borderRadius: 14,
        background: encreux ? t.selBg : t.panel,
        boxShadow: encreux ? `0 3px 0 ${t.selEdge}` : `0 3px 0 ${t.edge}`,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: `600 12px/1 ${TEXTE}`,
        letterSpacing: '0.06em',
        color: encreux ? t.selFg : t.ink,
        textTransform: 'uppercase',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  )
}

/** Le bouton du bas : libellé en Bricolage, précision en capitales à droite. */
function BoutonLancer({
  children,
  onClick,
  note,
  disabled,
  ton = 'clay',
}: {
  children: React.ReactNode
  onClick: () => void
  note?: string
  disabled?: boolean
  ton?: 'clay' | 'ink'
}) {
  const t = useTheme()
  const clay = ton === 'clay'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 66,
        flex: '0 0 66px',
        borderRadius: 18,
        background: clay ? t.clayText : t.selBg,
        boxShadow: `0 5px 0 ${clay ? t.clayTextEdge : t.selEdge}`,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '0 20px',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ font: `700 21px/1 ${TITRE}`, color: clay ? t.panel : t.selFg }}>
        {children}
      </span>
      {note && (
        <span
          style={{
            font: `600 10px/1 ${TEXTE}`,
            letterSpacing: '0.1em',
            color: clay ? t.panel : t.selFg,
            textTransform: 'uppercase',
          }}
        >
          {note}
        </span>
      )}
    </button>
  )
}
