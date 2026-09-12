/**
 * Galerie de contrôle — page de développement uniquement.
 *
 * Elle rejoue chaque écran de l'app dans un cadre 390 × 844, avec les mêmes
 * données que la planche de design, pour vérifier la fidélité écran par écran
 * sans avoir à monter une vraie partie à quatre téléphones.
 *
 * Elle n'est pas incluse dans le build : seul `index.html` est une entrée
 * Vite, donc ce fichier ne part jamais en production.
 */
import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './global.css'
import { TITRE } from './theme'
import { createGame, resolveRound } from './game/engine'
import { roundCardById } from './game/roundCards'
import type { CardKey, Choice, GameState, PlayerId, Slot } from './game/types'
import { LangueScope, type Langue } from './i18n'
import { Icone } from './ui/Icone'
import { VueMiseAJour } from './ui/MiseAJour'
import { FeuilleQuitter } from './screens/Quitter'
import { salonNeuf } from './net/table'
import { ThemeScope } from './ui/theme'
import type { VueSession } from './net/session'
import type { ThemeName } from './theme'
import { Accueil } from './screens/Accueil'
import { Creation } from './screens/Creation'
import { Fin } from './screens/Fin'
import { Jeu } from './screens/Jeu'
import { Palmares } from './screens/Palmares'
import { Reglages } from './screens/Reglages'
import { CartesDeManche, ReglesChapitre, ReglesSommaire } from './screens/Regles'
import { ReglesRapides } from './screens/ReglesRapides'
import { Rejoindre } from './screens/Rejoindre'
import { Revelation } from './screens/Revelation'
import { Salon } from './screens/Salon'
import { DiscussionProvider, FeuilleDiscussion } from './ui/discussion'

const SEATS = [
  { id: 'a', name: 'Léa', ci: 0 as const },
  { id: 'b', name: 'Malo', ci: 1 as const },
  { id: 'c', name: 'Nour', ci: 2 as const },
  { id: 'd', name: 'Iris', ci: 3 as const },
]

const MOI: PlayerId = 'a'

/**
 * Les noms les plus longs que le jeu accepte (quatorze caractères, la limite
 * des deux champs de saisie).
 *
 * Ils ne sont pas là pour faire joli : c'est le cas qui fait déborder les
 * lignes de joueur et le titre de l'écran de fin, et le seul moyen de vérifier
 * qu'une décoration n'empiète pas sur un texte est de lui donner sa largeur
 * maximale — dans les deux langues, puisqu'elles n'ont pas la même.
 */
const SEATS_LONGS = [
  { id: 'a', name: 'Bartholomée', ci: 0 as const },
  { id: 'b', name: 'Anne-Charlott', ci: 1 as const },
  { id: 'c', name: 'Maximilienne', ci: 2 as const },
  { id: 'd', name: 'Jean-Baptiste', ci: 3 as const },
]

/** Reprend les codes de mur de la planche : I intact, B cassée, R réparée. */
function mur(code: string): Slot[] {
  return code.split('').map((c) => (c === 'B' ? 'broken' : c === 'R' ? 'repaired' : 'intact'))
}

function base(over: Partial<GameState> = {}, seats = SEATS): GameState {
  const g = createGame(seats, { format: 'chacun', roundCards: true }, 7)
  return {
    ...g,
    round: 4,
    phase: 'choix',
    players: g.players.map((p, i) => ({
      ...p,
      wall: mur(['IIIBI', 'IIIII', 'IIBBI', 'IIIIB'][i]),
      locked: [['bloquer'], ['frapper'], ['reparer'], ['pieger']][i] as never,
    })),
    ...over,
  }
}

const noop = () => {}
const SANS_ABSENT: ReadonlyMap<string, number> = new Map()

/** Un salon figé, pour rendre l'écran 03 hors de toute session. */
function vueSalon(over: Partial<VueSession> = {}): VueSession {
  return {
    code: 'K7P3M9XR',
    moi: 'a',
    hote: true,
    salon: {
      code: 'K7P3M9XR',
      hoteClientId: 'a',
      epoch: 0,
      round: 0,
      format: 'chacun',
      cartesManche: true,
      places: 4,
      joueurs: JOUEURS_SALON,
      lancee: false,
    },
    jeu: null,
    joues: [],
    lien: 'lie',
    statutDemande: 'inconnu',
    demandes: [],
    absentsDepuis: SANS_ABSENT,
    relaisActifs: 8,
    messages: [],
    ...over,
  }
}

/**
 * Une conversation figée, pour rendre la feuille hors de toute session.
 *
 * `at` est daté loin devant : sans cela les bulles seraient déjà retombées au
 * moment où la galerie s'affiche. Les cadres rendent un écran arrêté — les
 * mouvements, eux, se regardent dans l'app.
 */
const CONVERSATION = [
  { id: 'b:1', de: 'b', texte: 'je prends le carré', at: Date.now() + 1e6 },
  { id: 'a:1', de: 'a', texte: 'on lance dès que Nour est là', at: Date.now() + 1e6 },
  { id: 'c:1', de: 'c', texte: '🙏', at: Date.now() + 1e6 },
  { id: 'a:2', de: 'a', texte: '👏', at: Date.now() + 1e6 },
]

/**
 * La salle de la galerie.
 *
 * Tous les cadres de jeu et de révélation la portent, et pas seulement ceux
 * qui montrent la conversation : hors session ces écrans n'existent pas, donc
 * un cadre sans salle rendait une barre du haut que personne ne verra jamais.
 * L'éventail y manquait — 44 px et son écart —, et c'est justement lui que la
 * barre de la révélation poussait hors de l'écran. La galerie déclarait donc
 * conforme une géométrie qui débordait sur le vrai téléphone.
 *
 * Le salon, lui, garde ses deux cadres : la conversation y est une feuille
 * qu'on ouvre, et l'écran sans elle est un état qui existe pour de bon.
 */
function AvecSalle({
  children,
  messages = [],
}: {
  children: ReactNode
  /**
   * La conversation, quand c'est elle qu'on vient regarder.
   *
   * Vide par défaut, et c'est le point : une salle sert d'abord à faire
   * exister l'éventail dans la barre du haut. Peupler les vingt-quatre cadres
   * de bulles poserait des formes claires sur chaque mur, et le cadre
   * « une réaction en vol » — le seul qui existe pour vérifier qu'une bulle ne
   * couvre ni un nom ni une contrainte — ne prouverait plus rien, puisqu'il
   * ressemblerait à tous les autres.
   */
  messages?: typeof CONVERSATION
}) {
  return (
    <DiscussionProvider
      valeur={{
        moi: 'a',
        auteurs: JOUEURS_SALON.map((j) => ({ id: j.clientId, nom: j.nom, ci: j.ci })),
        messages,
        envoyer: () => true,
      }}
    >
      {children}
    </DiscussionProvider>
  )
}

/**
 * Un cadre de la galerie : un écran, dans un thème et dans une langue.
 *
 * La langue y est un axe comme le thème parce qu'elle change la GÉOMÉTRIE :
 * un libellé anglais plus long décale un bandeau, un nom de joueur pousse une
 * pastille hors de sa ligne. Se relire dans les deux langues est le seul moyen
 * de le voir sans installer l'app deux fois.
 */
/** Un salon à plusieurs, et un salon d'un seul : les deux discours du départ. */
function salonADeux() {
  const s = salonNeuf('K7P2M9XR', MOI, 'Léa')
  s.joueurs.push({
    clientId: 'b',
    nom: 'Malo',
    ci: 1,
    peerId: null,
    hote: false,
    pret: true,
    connecte: true,
  })
  s.lancee = true
  return s
}

function salonSolo() {
  const s = salonNeuf('K7P2M9XR', MOI, 'Léa')
  s.joueurs.push({
    clientId: 'bot-1',
    nom: 'Nour',
    ci: 2,
    peerId: null,
    hote: false,
    pret: true,
    connecte: true,
    bot: true,
  })
  s.lancee = true
  return s
}

function Cadre({
  titre,
  theme = 'etabli',
  langue = 'fr',
  children,
}: {
  titre: string
  theme?: ThemeName
  langue?: Langue
  children: ReactNode
}) {
  return (
    <div style={{ flex: '0 0 390px' }}>
      <div
        style={{
          font: '600 11px/1 Outfit, sans-serif',
          letterSpacing: '0.12em',
          color: '#5F5342',
          textTransform: 'uppercase',
          marginBottom: 9,
        }}
      >
        {titre}
      </div>
      <div
        data-cadre={titre}
        style={{
          width: 390,
          height: 844,
          borderRadius: 30,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 6px 0 #C6B08A',
          position: 'relative',
        }}
      >
        <ThemeScope name={theme}>
          <LangueScope langue={langue}>{children}</LangueScope>
        </ThemeScope>
      </div>
    </div>
  )
}

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section style={{ padding: '24px 56px 56px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ borderBottom: '3px solid #C0AE8C', paddingBottom: 16 }}>
        <div style={{ font: `700 34px/1 ${TITRE}`, color: '#2E2418' }}>{titre}</div>
      </div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {children}
      </div>
    </section>
  )
}

/* Un tour joué pour de vrai, pour obtenir une révélation cohérente. */
function revelationPiege(): GameState {
  const s = base({
    choices: {
      a: [{ card: 'frapper', target: 'c' }] as Choice[],
      b: [{ card: 'bloquer' }] as Choice[],
      c: [{ card: 'pieger' }] as Choice[],
      d: [{ card: 'frapper', target: 'b' }] as Choice[],
    },
  })
  return resolveRound(s)
}

function revelationBlocage(): GameState {
  const s = base({
    round: 5,
    choices: {
      a: [{ card: 'frapper', target: 'b' }] as Choice[],
      b: [{ card: 'bloquer' }] as Choice[],
      c: [{ card: 'frapper', target: 'b' }] as Choice[],
      d: [{ card: 'reparer' }] as Choice[],
    },
  })
  return resolveRound(s)
}

function finDePartie(seats = SEATS): GameState {
  const s = base({ round: 10, phase: 'fin' }, seats)
  const murs = ['IIIBB', 'IIIII', 'BBBBB', 'IIBBB']
  /* Dix manches jouées, pour que le récapitulatif ait quelque chose à montrer. */
  const cartes: CardKey[] = ['frapper', 'bloquer', 'reparer', 'pieger']
  const history = Array.from({ length: 10 }, (_, m) => ({
    round: m + 1,
    joue: Object.fromEntries(
      s.players.map((p, i) => [p.id, m === 6 && i === 1 ? [] : [cartes[(m + i) % 4]]]),
    ),
    // Le troisième mur tombe à la septième manche : l'état que l'écran de fin
    // doit savoir dire.
    briques: Object.fromEntries(
      s.players.map((p, i) => [p.id, i === 2 ? Math.max(0, 5 - m) : Math.max(1, 5 - (m % 4))]),
    ),
  }))
  return {
    ...s,
    history,
    players: s.players.map((p, i) => ({ ...p, wall: mur(murs[i]), locked: [] })),
  }
}

const JOUEURS_SALON = [
  { clientId: 'a', nom: 'Léa', ci: 0 as const, peerId: null, hote: true, pret: true, connecte: true },
  { clientId: 'b', nom: 'Malo', ci: 1 as const, peerId: null, hote: false, pret: true, connecte: true },
  { clientId: 'c', nom: 'Nour', ci: 2 as const, peerId: null, hote: false, pret: true, connecte: true },
]

function Galerie() {
  const equipes = createGame(
    [
      { id: 'a', name: 'Léa', ci: 0, team: 0 },
      { id: 'b', name: 'Malo', ci: 1, team: 1 },
      { id: 'c', name: 'Nour', ci: 2, team: 0 },
      { id: 'd', name: 'Iris', ci: 3, team: 1 },
    ],
    { format: 'equipes', roundCards: false },
    3,
  )

  return (
    <div style={{ background: '#D9CBB0', minHeight: '100vh', userSelect: 'auto' }}>
      <div style={{ padding: '48px 56px 0' }}>
        <div style={{ font: `700 56px/1 ${TITRE}`, color: '#2E2418' }}>Rempart — galerie de contrôle</div>
        <div style={{ font: '500 14px/1.5 Outfit, sans-serif', color: '#5F5342', marginTop: 8 }}>
          Chaque écran de l’app, au format de référence 390 × 844. Page de développement : elle ne
          part pas dans le build.
        </div>
      </div>

      <Section titre="Les écrans clairs">
        <Cadre titre="01 · Accueil">
          <Accueil onCreer={noop} onRejoindre={noop} onRegles={noop} onPalmares={noop} onReglages={noop} />
        </Cadre>
        <Cadre titre="02 · Création de partie">
          <Creation
            places={4}
            format="chacun"
            cartesManche
            nom="Léa"
            onNom={noop}
            onPlaces={noop}
            onFormat={noop}
            onCartesManche={noop}
            onOuvrir={noop}
            onRetour={noop}
          />
        </Cadre>
        <Cadre titre="03 · Salon d’attente">
          <Salon
            etat={vueSalon()}
            onIdentite={noop}
            onPret={noop}
            onAdmettre={noop}
            onRefuser={noop}
            onAjouterBot={noop}
            onRetirerBot={noop}
            onNiveauBot={noop}
            onNiveauBots={noop}
            onLancer={noop}
            onQuitter={noop}
            onAutreCode={noop}
          />
        </Cadre>
        <Cadre titre="03 quater · Salon · trois bots, trois niveaux">
          <Salon
            etat={vueSalon({
              salon: {
                ...vueSalon().salon,
                places: 4,
                joueurs: [
                  JOUEURS_SALON[0],
                  ...([1, 2, 3] as const).map((ci) => ({
                    clientId: `bot-${ci}`,
                    nom: ['Truelle', 'Maillet', 'Équerre', 'Rabot'][ci],
                    ci,
                    peerId: null,
                    hote: false,
                    pret: true,
                    connecte: true,
                    bot: true,
                    niveau: (['tranquille', 'normal', 'redoutable'] as const)[ci - 1],
                  })),
                ],
              },
            })}
            onIdentite={noop}
            onPret={noop}
            onAdmettre={noop}
            onRefuser={noop}
            onAjouterBot={noop}
            onRetirerBot={noop}
            onNiveauBot={noop}
            onNiveauBots={noop}
            onLancer={noop}
            onQuitter={noop}
            onAutreCode={noop}
          />
        </Cadre>
        <Cadre titre="03 quinquies · Salon · la conversation">
          <AvecSalle messages={CONVERSATION}>
            <Salon
              etat={vueSalon({ messages: CONVERSATION })}
              onIdentite={noop}
              onPret={noop}
              onAdmettre={noop}
              onRefuser={noop}
              onAjouterBot={noop}
              onRetirerBot={noop}
              onNiveauBot={noop}
              onNiveauBots={noop}
              onLancer={noop}
              onQuitter={noop}
              onAutreCode={noop}
            />
            <FeuilleDiscussion onFermer={noop} />
          </AvecSalle>
        </Cadre>
        <Cadre titre="03 bis · Salon · une demande à la porte">
          <Salon
            etat={vueSalon({
              demandes: [{ clientId: 'z', nom: 'Iris', peer: 'p-z' }],
            })}
            onIdentite={noop}
            onPret={noop}
            onAdmettre={noop}
            onRefuser={noop}
            onAjouterBot={noop}
            onRetirerBot={noop}
            onNiveauBot={noop}
            onNiveauBots={noop}
            onLancer={noop}
            onQuitter={noop}
            onAutreCode={noop}
          />
        </Cadre>
        <Cadre titre="03 ter · Salon · invité, en attente de l’hôte">
          <Salon
            etat={vueSalon({
              moi: 'z',
              hote: false,
              statutDemande: 'attente',
              salon: {
                ...vueSalon().salon,
                joueurs: JOUEURS_SALON,
              },
            })}
            onIdentite={noop}
            onPret={noop}
            onAdmettre={noop}
            onRefuser={noop}
            onAjouterBot={noop}
            onRetirerBot={noop}
            onNiveauBot={noop}
            onNiveauBots={noop}
            onLancer={noop}
            onQuitter={noop}
            onAutreCode={noop}
          />
        </Cadre>
        <Cadre titre="Rejoindre avec un code">
          <Rejoindre nom="Malo" onNom={noop} onRejoindre={noop} onRetour={noop} />
        </Cadre>
        <Cadre titre="04 · Règles">
          <ReglesRapides onCompris={noop} onChapitres={noop} onRetour={noop} />
        </Cadre>
        <Cadre titre="05 · Jeu · état neutre">
          <AvecSalle>
            <Jeu state={base()} moi={MOI} joues={[]} absentsDepuis={SANS_ABSENT} onJouer={noop} onSuite={noop} onDemanderQuitter={noop} onQuitter={noop} />
          </AvecSalle>
        </Cadre>
        {/* Manche 1 : personne n'a encore joué, donc personne n'a de
            contrainte. C'est l'état que la ligne doit dire en toutes lettres
            plutôt que de laisser un vide. */}
        <Cadre titre="05 bis · Jeu · manche 1, aucune contrainte">
          <AvecSalle>
            <Jeu
              state={base({ round: 1, players: base().players.map((p) => ({ ...p, locked: [] })) })}
              moi={MOI}
              joues={[]}
              absentsDepuis={SANS_ABSENT}
              onJouer={noop}
              onSuite={noop} onDemanderQuitter={noop}
              onQuitter={noop}
            />
          </AvecSalle>
        </Cadre>
        <Cadre titre="05 ter · Jeu · noms les plus longs">
          <AvecSalle>
            <Jeu
              state={base({ choices: { a: [{ card: 'frapper', target: 'b' }] } }, SEATS_LONGS)}
              moi={MOI}
              joues={['a', 'b']}
              absentsDepuis={SANS_ABSENT}
              onJouer={noop}
              onSuite={noop} onDemanderQuitter={noop}
              onQuitter={noop}
            />
          </AvecSalle>
        </Cadre>
        <Cadre titre="05 quater · Jeu · noms les plus longs · anglais" langue="en">
          <AvecSalle>
            <Jeu
              state={base({ choices: { a: [{ card: 'frapper', target: 'b' }] } }, SEATS_LONGS)}
              moi={MOI}
              joues={['a', 'b']}
              absentsDepuis={SANS_ABSENT}
              onJouer={noop}
              onSuite={noop} onDemanderQuitter={noop}
              onQuitter={noop}
            />
          </AvecSalle>
        </Cadre>
        <Cadre titre="06 · Jeu · carte choisie, choix de la cible">
          <AvecSalle>
            <Jeu
              state={base()}
              moi={MOI}
              joues={[]}
              absentsDepuis={SANS_ABSENT}
              carteInitiale="frapper"
              onJouer={noop}
              onSuite={noop} onDemanderQuitter={noop}
              onQuitter={noop}
            />
          </AvecSalle>
        </Cadre>
        <Cadre titre="07 · Jeu · en attente des autres">
          <AvecSalle>
            <Jeu
              state={base({ choices: { a: [{ card: 'frapper', target: 'b' }] } })}
              moi={MOI}
              joues={['a', 'b', 'c']}
              absentsDepuis={SANS_ABSENT}
              onJouer={noop}
              onSuite={noop} onDemanderQuitter={noop}
              onQuitter={noop}
            />
          </AvecSalle>
        </Cadre>
        <Cadre titre="09 · Jeu · manche à carte commune">
          <AvecSalle>
            <Jeu
              state={base({ round: 6, activeRoundCard: roundCardById('double-frappe')! })}
              moi={MOI}
              joues={[]}
              absentsDepuis={SANS_ABSENT}
              onJouer={noop}
              onSuite={noop} onDemanderQuitter={noop}
              onQuitter={noop}
            />
          </AvecSalle>
        </Cadre>
        {/*
            Les trois cartes de manche qui changent CE QUE L'ÉCRAN DOIT DIRE.

            La galerie n'en rendait qu'une, « Double frappe », et c'est la
            seule dont l'effet ne se voit nulle part avant la révélation : elle
            double des nombres. Les trois ci-dessous, elles, contredisent ce
            que la barre du haut, les pastilles et le libellé de la main
            affichaient — et c'est ainsi qu'une pastille a pu annoncer pendant
            des mois « Interdit : Bloquer » au-dessus d'une carte Bloquer
            marquée « jouable ».

            `base()` verrouille une carte par joueur : c'est ce verrou-là que
            les deux premières doivent rendre ou recouvrir.
        */}
        {/* Le ciblage sous « Ricochet » : chaque mur qu'on peut viser annonce
            celui qui encaissera la seconde brique. Le cadre 06 le montre sans
            carte de manche, donc sans note — les deux se lisent l'un à côté
            de l'autre. */}
        <Cadre titre="06 bis · Ciblage sous Ricochet · qui encaisse en plus">
          <AvecSalle>
            <Jeu
              state={base({ round: 6, activeRoundCard: roundCardById('ricochet')! })}
              moi={MOI}
              joues={[]}
              absentsDepuis={SANS_ABSENT}
              carteInitiale="frapper"
              onJouer={noop}
              onSuite={noop} onDemanderQuitter={noop}
              onQuitter={noop}
            />
          </AvecSalle>
        </Cadre>
        <Cadre titre="09 bis · Mémoire courte · le verrou est levé">
          <AvecSalle>
            <Jeu
              state={base({ round: 6, activeRoundCard: roundCardById('memoire-courte')! })}
              moi={MOI}
              joues={[]}
              absentsDepuis={SANS_ABSENT}
              onJouer={noop}
              onSuite={noop} onDemanderQuitter={noop}
              onQuitter={noop}
            />
          </AvecSalle>
        </Cadre>
        <Cadre titre="09 ter · Trêve · Frapper interdit à toute la table">
          <AvecSalle>
            <Jeu
              state={base({ round: 6, activeRoundCard: roundCardById('treve')! })}
              moi={MOI}
              joues={[]}
              absentsDepuis={SANS_ABSENT}
              onJouer={noop}
              onSuite={noop} onDemanderQuitter={noop}
              onQuitter={noop}
            />
          </AvecSalle>
        </Cadre>
        {/* Le mur le plus bas est celui de MOI : c'est le seul point de vue
            depuis lequel « tu joues deux cartes » est vérifiable. */}
        <Cadre titre="09 quater · Dernier mur · tu joues deux cartes">
          <AvecSalle>
            <Jeu
              state={base({
                round: 6,
                activeRoundCard: roundCardById('dernier-mur')!,
                players: base().players.map((p, i) => ({
                  ...p,
                  wall: mur(['IBBBB', 'IIIII', 'IIBBI', 'IIIIB'][i]),
                })),
              })}
              moi={MOI}
              joues={[]}
              absentsDepuis={SANS_ABSENT}
              onJouer={noop}
              onSuite={noop} onDemanderQuitter={noop}
              onQuitter={noop}
            />
          </AvecSalle>
        </Cadre>
        <Cadre titre="C2 · Carte de manche · fiche tirée en jeu">
          <AvecSalle>
            <Jeu
              state={base({
                round: 6,
                phase: 'carte-manche',
                activeRoundCard: roundCardById('double-frappe')!,
              })}
              moi={MOI}
              joues={[]}
              absentsDepuis={SANS_ABSENT}
              onJouer={noop}
              onSuite={noop} onDemanderQuitter={noop}
              onQuitter={noop}
            />
          </AvecSalle>
        </Cadre>
        <Cadre titre="10 · Jeu · équipes 2 contre 2">
          <AvecSalle>
            <Jeu
              state={{
                ...equipes,
                round: 4,
                phase: 'choix',
                players: equipes.players.map((p, i) => ({
                  ...p,
                  wall: mur(['IIIBI', 'IIIBB', 'IIBBI', 'IIIIB'][i]),
                  locked: [['bloquer'], ['frapper'], ['reparer'], ['pieger']][i] as never,
                })),
              }}
              moi={MOI}
              joues={[]}
              absentsDepuis={SANS_ABSENT}
              onJouer={noop}
              onSuite={noop} onDemanderQuitter={noop}
              onQuitter={noop}
            />
          </AvecSalle>
        </Cadre>
        {/* Les équipes gardent leur propre géométrie — deux murs par panneau —
            et le ciblage y porte deux notes au lieu de trois. C'est le cadre
            qui le vérifie : une note de plus non budgétée pousse un mur sous
            la ligne de flottaison, et le plateau ne défile jamais. */}
        <Cadre titre="10 bis · Équipes · ciblage sous Ricochet">
          <AvecSalle>
            <Jeu
              state={{
                ...equipes,
                round: 6,
                phase: 'choix',
                activeRoundCard: roundCardById('ricochet')!,
                players: equipes.players.map((p, i) => ({
                  ...p,
                  wall: mur(['IIIBI', 'IIIBB', 'IIBBI', 'IIIIB'][i]),
                  locked: [['bloquer'], ['frapper'], ['reparer'], ['pieger']][i] as never,
                })),
              }}
              moi={MOI}
              joues={[]}
              absentsDepuis={SANS_ABSENT}
              carteInitiale="frapper"
              onJouer={noop}
              onSuite={noop} onDemanderQuitter={noop}
              onQuitter={noop}
            />
          </AvecSalle>
        </Cadre>
        <Cadre titre="08 · Révélation (piège retourné)">
          <AvecSalle>
            <Revelation state={revelationPiege()} moi={MOI} onSuivant={noop} onDemanderQuitter={noop} />
          </AvecSalle>
        </Cadre>
        {/* Une réaction en vol : c'est le seul moment où une forme claire
            passe au-dessus d'une ligne de joueur, donc le seul où l'on peut
            vérifier qu'elle ne couvre ni un nom ni une contrainte. */}
        <Cadre titre="05 quinquies · Jeu · une réaction en vol">
          <AvecSalle messages={CONVERSATION}>
            <Jeu
              state={base()}
              moi={MOI}
              joues={[]}
              absentsDepuis={SANS_ABSENT}
              onJouer={noop}
              onSuite={noop} onDemanderQuitter={noop}
              onQuitter={noop}
            />
          </AvecSalle>
        </Cadre>
        <Cadre titre="08 bis · Révélation (un blocage annule deux frappes)">
          <AvecSalle>
            <Revelation state={revelationBlocage()} moi={MOI} onSuivant={noop} onDemanderQuitter={noop} />
          </AvecSalle>
        </Cadre>
        <Cadre titre="11 · Fin de partie">
          <Fin state={finDePartie()} moi={MOI} peutRejouer onRejouer={noop} onPalmares={noop} onQuitter={noop} />
        </Cadre>
        {/* Le cas qui faisait déborder le titre : le nom le plus long que le
            jeu accepte, dans les deux langues, avec la décoration à côté. */}
        <Cadre titre="11 bis · Fin · nom le plus long">
          <Fin
            state={finDePartie(SEATS_LONGS)}
            moi={MOI}
            peutRejouer
            onRejouer={noop}
            onPalmares={noop}
            onQuitter={noop}
          />
        </Cadre>
        <Cadre titre="11 ter · Fin · nom le plus long · anglais" langue="en">
          <Fin
            state={finDePartie(SEATS_LONGS)}
            moi={MOI}
            peutRejouer
            onRejouer={noop}
            onPalmares={noop}
            onQuitter={noop}
          />
        </Cadre>
        <Cadre titre="11 bis · Palmarès">
          <Palmares onRetour={noop} />
        </Cadre>
        <Cadre titre="12 · Cas limite · déconnexion en pleine manche">
          <AvecSalle>
            <Jeu
              state={base({
                round: 7,
                players: base().players.map((p) => (p.id === 'd' ? { ...p, connected: false } : p)),
              })}
              moi={MOI}
              joues={[]}
              absentsDepuis={SANS_ABSENT}
              onJouer={noop}
              onSuite={noop} onDemanderQuitter={noop}
              onQuitter={noop}
            />
          </AvecSalle>
        </Cadre>
        <Cadre titre="Réglages">
          <Reglages
            pref="systeme"
            onPref={noop}
            languePref="systeme"
            onLanguePref={noop}
            nomDefaut="Léa"
            onNomDefaut={noop}
            onEffacer={noop}
            onCartesManche={noop}
            onRetour={noop}
          />
        </Cadre>
      </Section>

      {/* La planche des icônes : elles se jugent à leur taille d'emploi, pas
          agrandies. */}
      <Section titre="Les icônes dessinées">
        <div
          style={{
            display: 'flex',
            gap: 26,
            flexWrap: 'wrap',
            background: '#FCF7EC',
            borderRadius: 20,
            padding: 24,
          }}
        >
          {(['reaction', 'rire', 'aie', 'bravo', 'bienJoue', 'grr', 'pitie', 'cadenas'] as const).map(
            (nom) => (
              <div
                key={nom}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
              >
                <ThemeScope name="etabli">
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                    <Icone nom={nom} size={44} />
                    <Icone nom={nom} size={22} />
                    <Icone nom={nom} size={13} />
                  </div>
                </ThemeScope>
                <span style={{ font: '600 11px/1 Outfit, sans-serif', color: '#5F5342' }}>{nom}</span>
              </div>
            ),
          )}
        </div>
      </Section>

      <Section titre="Les règles dans l’app">
        <Cadre titre="R0 · Sommaire">
          <ReglesSommaire onChapitre={noop} onRetour={noop} />
        </Cadre>
        {(['but', 'manche', 'verrou', 'cartes', 'ordre', 'cas', 'fin'] as const).map((id, i) => (
          <Cadre key={id} titre={`R${i + 1} · ${id}`}>
            <ReglesChapitre chapitre={id} onSommaire={noop} onRetour={noop} />
          </Cadre>
        ))}
        <Cadre titre="C1 · Cartes de manche · les neuf">
          <CartesDeManche onRetour={noop} />
        </Cadre>
        <Cadre titre="13 · Quitter · à plusieurs, arbitre">
          <AvecSalle>
            <Jeu state={base()} moi={MOI} joues={[]} absentsDepuis={SANS_ABSENT} onJouer={noop} onSuite={noop} onDemanderQuitter={noop} onQuitter={noop} />
          </AvecSalle>
          <FeuilleQuitter salon={salonADeux()} hote onRester={noop} onQuitter={noop} />
        </Cadre>
        <Cadre titre="13 bis · Quitter · à plusieurs, invité">
          <AvecSalle>
            <Jeu state={base()} moi={MOI} joues={[]} absentsDepuis={SANS_ABSENT} onJouer={noop} onSuite={noop} onDemanderQuitter={noop} onQuitter={noop} />
          </AvecSalle>
          <FeuilleQuitter salon={salonADeux()} hote={false} onRester={noop} onQuitter={noop} />
        </Cadre>
        <Cadre titre="13 ter · Quitter · seul contre des bots">
          <AvecSalle>
            <Jeu state={base()} moi={MOI} joues={[]} absentsDepuis={SANS_ABSENT} onJouer={noop} onSuite={noop} onDemanderQuitter={noop} onQuitter={noop} />
          </AvecSalle>
          <FeuilleQuitter salon={salonSolo()} hote onRester={noop} onQuitter={noop} />
        </Cadre>
        <Cadre titre="13 quater · Quitter · anglais" langue="en">
          <AvecSalle>
            <Jeu state={base()} moi={MOI} joues={[]} absentsDepuis={SANS_ABSENT} onJouer={noop} onSuite={noop} onDemanderQuitter={noop} onQuitter={noop} />
          </AvecSalle>
          <FeuilleQuitter salon={salonADeux()} hote onRester={noop} onQuitter={noop} />
        </Cadre>
        <Cadre titre="M1 · Mise à jour · hors partie">
          <Accueil onCreer={noop} onRejoindre={noop} onRegles={noop} onPalmares={noop} onReglages={noop} />
          <VueMiseAJour enPartie={false} onRecharger={noop} onPlusTard={noop} />
        </Cadre>
        <Cadre titre="M2 · Mise à jour · en partie">
          <AvecSalle>
            <Jeu state={base()} moi={MOI} joues={[]} absentsDepuis={SANS_ABSENT} onJouer={noop} onSuite={noop} onDemanderQuitter={noop} onQuitter={noop} />
          </AvecSalle>
          <VueMiseAJour enPartie onRecharger={noop} onPlusTard={noop} />
        </Cadre>
        <Cadre titre="M3 · Mise à jour · en partie · anglais" langue="en">
          <AvecSalle>
            <Jeu state={base()} moi={MOI} joues={[]} absentsDepuis={SANS_ABSENT} onJouer={noop} onSuite={noop} onDemanderQuitter={noop} onQuitter={noop} />
          </AvecSalle>
          <VueMiseAJour enPartie onRecharger={noop} onPlusTard={noop} />
        </Cadre>
      </Section>

      <Section titre="Veillée · les écrans sombres">
        <Cadre titre="01 · Accueil · veillée" theme="veillee">
          <Accueil onCreer={noop} onRejoindre={noop} onRegles={noop} onPalmares={noop} onReglages={noop} />
        </Cadre>
        <Cadre titre="05 · Jeu · état neutre · veillée" theme="veillee">
          <AvecSalle>
            <Jeu state={base()} moi={MOI} joues={[]} absentsDepuis={SANS_ABSENT} onJouer={noop} onSuite={noop} onDemanderQuitter={noop} onQuitter={noop} />
          </AvecSalle>
        </Cadre>
        <Cadre titre="08 · Révélation · veillée" theme="veillee">
          <AvecSalle>
            <Revelation state={revelationPiege()} moi={MOI} onSuivant={noop} onDemanderQuitter={noop} />
          </AvecSalle>
        </Cadre>
        <Cadre titre="11 · Fin de partie · veillée" theme="veillee">
          <Fin state={finDePartie()} moi={MOI} peutRejouer onRejouer={noop} onPalmares={noop} onQuitter={noop} />
        </Cadre>
        <Cadre titre="02 · Création · veillée" theme="veillee">
          <Creation
            places={4}
            format="chacun"
            cartesManche
            nom="Léa"
            onNom={noop}
            onPlaces={noop}
            onFormat={noop}
            onCartesManche={noop}
            onOuvrir={noop}
            onRetour={noop}
          />
        </Cadre>
        <Cadre titre="Rejoindre · veillée" theme="veillee">
          <Rejoindre nom="Malo" onNom={noop} onRejoindre={noop} onRetour={noop} />
        </Cadre>
        <Cadre titre="04 · Règles · veillée" theme="veillee">
          <ReglesRapides onCompris={noop} onChapitres={noop} onRetour={noop} />
        </Cadre>
        <Cadre titre="R0 · Sommaire · veillée" theme="veillee">
          <ReglesSommaire onChapitre={noop} onRetour={noop} />
        </Cadre>
        <Cadre titre="C1 · Cartes de manche · veillée" theme="veillee">
          <CartesDeManche onRetour={noop} />
        </Cadre>
        <Cadre titre="13 · Quitter · veillée" theme="veillee">
          <AvecSalle>
            <Jeu state={base()} moi={MOI} joues={[]} absentsDepuis={SANS_ABSENT} onJouer={noop} onSuite={noop} onDemanderQuitter={noop} onQuitter={noop} />
          </AvecSalle>
          <FeuilleQuitter salon={salonADeux()} hote onRester={noop} onQuitter={noop} />
        </Cadre>
        <Cadre titre="M2 · Mise à jour · en partie · veillée" theme="veillee">
          <AvecSalle>
            <Jeu state={base()} moi={MOI} joues={[]} absentsDepuis={SANS_ABSENT} onJouer={noop} onSuite={noop} onDemanderQuitter={noop} onQuitter={noop} />
          </AvecSalle>
          <VueMiseAJour enPartie onRecharger={noop} onPlusTard={noop} />
        </Cadre>
        <Cadre titre="11 bis · Palmarès · veillée" theme="veillee">
          <Palmares onRetour={noop} />
        </Cadre>
        <Cadre titre="Réglages · veillée" theme="veillee">
          <Reglages
            pref="systeme"
            onPref={noop}
            languePref="systeme"
            onLanguePref={noop}
            nomDefaut="Léa"
            onNomDefaut={noop}
            onEffacer={noop}
            onCartesManche={noop}
            onRetour={noop}
          />
        </Cadre>
        <Cadre titre="12 · Déconnexion · veillée" theme="veillee">
          <AvecSalle>
            <Jeu
              state={base({
                players: base().players.map((p, i) => (i === 2 ? { ...p, connected: false } : p)),
              })}
              moi={MOI}
              joues={[]}
              absentsDepuis={new Map([['c', Date.now()]])}
              onJouer={noop}
              onSuite={noop} onDemanderQuitter={noop}
              onQuitter={noop}
            />
          </AvecSalle>
        </Cadre>
        <Cadre titre="09 · Carte de manche · veillée" theme="veillee">
          <AvecSalle>
            <Jeu
              state={base({ round: 6, activeRoundCard: roundCardById('double-frappe')! })}
              moi={MOI}
              joues={[]}
              absentsDepuis={SANS_ABSENT}
              onJouer={noop}
              onSuite={noop} onDemanderQuitter={noop}
              onQuitter={noop}
            />
          </AvecSalle>
        </Cadre>
        <Cadre titre="03 · Salon · veillée" theme="veillee">
          <Salon
            etat={vueSalon()}
            onIdentite={noop}
            onPret={noop}
            onAdmettre={noop}
            onRefuser={noop}
            onAjouterBot={noop}
            onRetirerBot={noop}
            onNiveauBot={noop}
            onNiveauBots={noop}
            onLancer={noop}
            onQuitter={noop}
            onAutreCode={noop}
          />
        </Cadre>
      </Section>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Galerie />
  </StrictMode>,
)
