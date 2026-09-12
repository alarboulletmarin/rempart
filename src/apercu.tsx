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
import type { Choice, GameState, PlayerId, Slot } from './game/types'
import { LangueScope, type Langue } from './i18n'
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

/** Reprend les codes de mur de la planche : I intact, B cassée, R réparée. */
function mur(code: string): Slot[] {
  return code.split('').map((c) => (c === 'B' ? 'broken' : c === 'R' ? 'repaired' : 'intact'))
}

function base(over: Partial<GameState> = {}): GameState {
  const g = createGame(SEATS, { format: 'chacun', roundCards: true }, 7)
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
    code: 'K7P2M9XR',
    moi: 'a',
    hote: true,
    salon: {
      code: 'K7P2M9XR',
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
]

function AvecSalle({ children }: { children: ReactNode }) {
  return (
    <DiscussionProvider
      valeur={{
        moi: 'a',
        auteurs: JOUEURS_SALON.map((j) => ({ id: j.clientId, nom: j.nom, ci: j.ci })),
        messages: CONVERSATION,
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

function finDePartie(): GameState {
  const s = base({ round: 10, phase: 'fin' })
  return {
    ...s,
    players: s.players.map((p, i) => ({
      ...p,
      wall: mur(['IIIBB', 'IIIII', 'IBBBB', 'IIBBB'][i]),
      locked: [],
    })),
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
            onLancer={noop}
            onQuitter={noop}
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
            onLancer={noop}
            onQuitter={noop}
          />
        </Cadre>
        <Cadre titre="03 quinquies · Salon · la conversation">
          <AvecSalle>
            <Salon
              etat={vueSalon({ messages: CONVERSATION })}
              onIdentite={noop}
              onPret={noop}
              onAdmettre={noop}
              onRefuser={noop}
              onAjouterBot={noop}
              onRetirerBot={noop}
              onNiveauBot={noop}
              onLancer={noop}
              onQuitter={noop}
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
            onLancer={noop}
            onQuitter={noop}
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
            onLancer={noop}
            onQuitter={noop}
          />
        </Cadre>
        <Cadre titre="Rejoindre avec un code">
          <Rejoindre nom="Malo" onNom={noop} onRejoindre={noop} onRetour={noop} />
        </Cadre>
        <Cadre titre="04 · Règles">
          <ReglesRapides onCompris={noop} onChapitres={noop} onRetour={noop} />
        </Cadre>
        <Cadre titre="05 · Jeu · état neutre">
          <Jeu state={base()} moi={MOI} joues={[]} absentsDepuis={SANS_ABSENT} onJouer={noop} onSuite={noop} onQuitter={noop} />
        </Cadre>
        <Cadre titre="06 · Jeu · carte choisie, choix de la cible">
          <Jeu
            state={base()}
            moi={MOI}
            joues={[]}
            absentsDepuis={SANS_ABSENT}
            carteInitiale="frapper"
            onJouer={noop}
            onSuite={noop}
            onQuitter={noop}
          />
        </Cadre>
        <Cadre titre="07 · Jeu · en attente des autres">
          <Jeu
            state={base({ choices: { a: [{ card: 'frapper', target: 'b' }] } })}
            moi={MOI}
            joues={['a', 'b', 'c']}
            absentsDepuis={SANS_ABSENT}
            onJouer={noop}
            onSuite={noop}
            onQuitter={noop}
          />
        </Cadre>
        <Cadre titre="09 · Jeu · manche à carte commune">
          <Jeu
            state={base({ round: 6, activeRoundCard: roundCardById('double-frappe')! })}
            moi={MOI}
            joues={[]}
            absentsDepuis={SANS_ABSENT}
            onJouer={noop}
            onSuite={noop}
            onQuitter={noop}
          />
        </Cadre>
        <Cadre titre="C2 · Carte de manche · fiche tirée en jeu">
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
            onSuite={noop}
            onQuitter={noop}
          />
        </Cadre>
        <Cadre titre="10 · Jeu · équipes 2 contre 2">
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
            onSuite={noop}
            onQuitter={noop}
          />
        </Cadre>
        <Cadre titre="08 · Révélation (piège retourné)">
          <Revelation state={revelationPiege()} moi={MOI} onSuivant={noop} />
        </Cadre>
        <Cadre titre="08 bis · Révélation (un blocage annule deux frappes)">
          <Revelation state={revelationBlocage()} moi={MOI} onSuivant={noop} />
        </Cadre>
        <Cadre titre="11 · Fin de partie">
          <Fin state={finDePartie()} moi={MOI} peutRejouer onRejouer={noop} onPalmares={noop} onQuitter={noop} />
        </Cadre>
        <Cadre titre="11 bis · Palmarès">
          <Palmares onRetour={noop} />
        </Cadre>
        <Cadre titre="12 · Cas limite · déconnexion en pleine manche">
          <Jeu
            state={base({
              round: 7,
              players: base().players.map((p) => (p.id === 'd' ? { ...p, connected: false } : p)),
            })}
            moi={MOI}
            joues={[]}
            absentsDepuis={SANS_ABSENT}
            onJouer={noop}
            onSuite={noop}
            onQuitter={noop}
          />
        </Cadre>
        <Cadre titre="Réglages">
          <Reglages
            pref="systeme"
            onPref={noop}
            languePref="systeme"
            onLanguePref={noop}
            onCartesManche={noop}
            onRetour={noop}
          />
        </Cadre>
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
      </Section>

      <Section titre="Veillée · les écrans sombres">
        <Cadre titre="01 · Accueil · veillée" theme="veillee">
          <Accueil onCreer={noop} onRejoindre={noop} onRegles={noop} onPalmares={noop} onReglages={noop} />
        </Cadre>
        <Cadre titre="05 · Jeu · état neutre · veillée" theme="veillee">
          <Jeu state={base()} moi={MOI} joues={[]} absentsDepuis={SANS_ABSENT} onJouer={noop} onSuite={noop} onQuitter={noop} />
        </Cadre>
        <Cadre titre="08 · Révélation · veillée" theme="veillee">
          <Revelation state={revelationPiege()} moi={MOI} onSuivant={noop} />
        </Cadre>
        <Cadre titre="11 · Fin de partie · veillée" theme="veillee">
          <Fin state={finDePartie()} moi={MOI} peutRejouer onRejouer={noop} onPalmares={noop} onQuitter={noop} />
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
            onLancer={noop}
            onQuitter={noop}
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
