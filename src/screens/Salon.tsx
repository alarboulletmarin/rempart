import { useEffect, useState } from 'react'
import { SAFE_TOP, TEXTE, TITRE } from '../theme'
import { NIVEAUX_BOT, NIVEAU_DEFAUT, type NiveauBot } from '../game/bot'
import { MAX_SIEGES } from '../net/room'
import type { VueSession } from '../net/session'
import { useT, type Cle, type T } from '../i18n'
import { Etiquette, Forme, Panneau, Scribble, Texte, usePanneauEncre, useShapeName } from '../ui/atoms'
import { BoutonConversation, FeuilleDiscussion, useSalle } from '../ui/discussion'
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
  onLancer,
  onQuitter,
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
  onLancer: () => void
  onQuitter: () => void
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
  const [lu, setLu] = useState(salle?.messages.length ?? 0)
  const recus = salle?.messages.length ?? 0
  useEffect(() => {
    if (conversation) setLu(recus)
  }, [conversation, recus])

  const { salon, moi, hote, lien, demandes, statutDemande } = etat
  const joueurs = salon.joueurs
  const jeSuis = joueurs.find((j) => j.clientId === moi)
  const assez = joueurs.length >= 2
  const complet = joueurs.length >= salon.places
  const peutLancer =
    hote && lien !== 'recherche' && assez && (salon.format !== 'equipes' || joueurs.length === 4)

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
    const texte = tr('salon.code.invitation', { code: salon.code })
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
          <div
            style={{
              font: `700 40px/1 ${TITRE}`,
              letterSpacing: '0.1em',
              color: encre.fg,
              textAlign: 'center',
            }}
            aria-label={tr('salon.code.aria', { lettres: salon.code.split('').join(' ') })}
          >
            {salon.code}
          </div>

          {/* Un code affiché pendant que la mise en relation cherche encore
              serait un code que personne ne peut joindre. */}
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
              {joueurs.length} / {salon.places}
            </span>
          </div>

          {joueurs.map((j) => (
            <Panneau key={j.clientId} radius={16} pad="12px 14px" gap={10}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Forme ci={j.ci} size={26} />
                <span style={{ font: `700 17px/1 ${TITRE}`, color: t.ink }}>{j.nom}</span>
                <Etiquette
                  size={10}
                  color={
                    // Un bot n'est ni prêt ni pas prêt : le vert de l'attente
                    // n'a rien à dire de lui.
                    j.bot
                      ? t.ink2
                      : etiquetteCouleur(j.clientId === moi, j.hote, j.pret, j.connecte, t.ink2, t.green, t.clayText)
                  }
                  style={{ letterSpacing: '0.1em', marginLeft: 'auto' }}
                >
                  {j.bot
                    ? tr('salon.joueur.bot')
                    : tr(etiquetteJoueur(j.clientId === moi, j.hote, j.pret, j.connecte))}
                </Etiquette>
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

        {/* Mon identité : la forme autant que la couleur. */}
        {jeSuis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Etiquette>{tr('salon.identite.titre')}</Etiquette>
            <div style={{ display: 'flex', gap: 10 }}>
              {([0, 1, 2, 3] as const).map((ci) => {
                const pris = joueurs.find((j) => j.ci === ci)
                const amoi = pris?.clientId === moi
                const libre = !pris
                return (
                  <button
                    key={ci}
                    type="button"
                    onClick={() => libre && onIdentite(ci)}
                    disabled={!libre}
                    aria-pressed={amoi}
                    aria-label={tr('salon.identite.aria', {
                      forme: nomForme(ci),
                      etat: tr(etatIdentite(amoi, !!pris)),
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
                    <Etiquette size={9} style={{ letterSpacing: '0.08em' }}>
                      {tr(etatIdentite(amoi, !!pris))}
                    </Etiquette>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Le bas de l'écran : un seul geste possible. */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Parler à quelqu'un suppose que quelqu'un soit là : un bot ne
              répond pas, et un salon d'une personne n'a pas de conversation. */}
          {salle && (joueurs.filter((j) => !j.bot).length > 1 || recus > 0) && !conversation && (
            <BoutonConversation nonLus={recus - lu} onOuvrir={() => setConversation(true)} />
          )}
          {hote ? (
            <BoutonLancer
              onClick={onLancer}
              disabled={!peutLancer}
              note={noteLancer(tr, salon.format, joueurs.length, assez)}
            >
              {tr('salon.lancer')}
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
          <button
            type="button"
            onClick={onQuitter}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 0 2px',
              font: `500 11px/1.5 ${TEXTE}`,
              color: t.ink2,
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            {tr('salon.quitter')}
          </button>
        </div>
      </div>

      {conversation && <FeuilleDiscussion onFermer={() => setConversation(false)} />}
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

function noteLancer(tr: T, format: string, presents: number, assez: boolean): string {
  if (format === 'equipes') {
    return tr(
      presents === MAX_SIEGES
        ? 'salon.lancer.note.deuxContreDeux'
        : 'salon.lancer.note.fautQuatre',
    )
  }
  return assez
    ? tr('salon.lancer.note.suffisent', { n: presents })
    : tr('salon.lancer.note.fautDeux')
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
}: {
  nom: string
  niveau: NiveauBot
  reglable: boolean
  onNiveau: (n: NiveauBot) => void
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
              height: 32,
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
