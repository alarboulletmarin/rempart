import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { bricks, standings } from './game/engine'
import type { Choice, Format } from './game/types'
import type { ChapitreId } from './game/content'
import { Session, type Avis, type VueSession } from './net/session'
import { compterCarte, enregistrerPartie } from './store/palmares'
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
import { DiscussionProvider, type Salle } from './ui/discussion'
import { LangueProvider, traducteur, useLanguePref, type Cle, type T } from './i18n'
import { ThemeProvider, useThemePref } from './ui/theme'

type Vue =
  | { v: 'accueil' }
  | { v: 'creation' }
  | { v: 'rejoindre' }
  | { v: 'salon' }
  | { v: 'partie' }
  | { v: 'palmares'; retour: 'accueil' | 'partie' }
  | { v: 'regles' }
  | { v: 'sommaire' }
  | { v: 'chapitre'; id: ChapitreId }
  | { v: 'cartes-manche' }
  | { v: 'reglages' }

/**
 * Les avis, gardés sous leur MOTIF et non sous leur phrase.
 *
 * La couche réseau transmet un motif, jamais une phrase : elle n'a pas à
 * connaître la langue du joueur, et une même cause doit se dire pareil partout.
 * Le motif reste donc tel quel dans l'état de l'écran, et la phrase se
 * fabrique au rendu — un changement de langue en cours de partie retourne
 * ainsi l'avis affiché avec le reste.
 */
const CLE_AVIS: Record<Exclude<Avis['code'], 'botLeve'>, Cle> = {
  lienEchoue: 'avis.lienEchoue',
  lienBloque: 'avis.lienBloque',
  lienPerdu: 'avis.lienPerdu',
  refuse: 'avis.refuse',
  salonPlein: 'avis.salonPlein',
  partieEnCours: 'avis.partieEnCours',
  hotePris: 'avis.hotePris',
  gestRefuse: 'avis.gestRefuse',
}

/** L'avis, mis en mots. Seul « un bot s'est levé » nomme quelqu'un. */
function direAvis(tr: T, avis: Avis): string {
  return avis.code === 'botLeve'
    ? tr('avis.botLeve', { nom: avis.nom, humain: avis.humain })
    : tr(CLE_AVIS[avis.code])
}

/**
 * Le code lu dans l'adresse, quand on arrive par un QR scanné.
 *
 * Lu **une fois, au chargement du module**, et non dans un état de composant :
 * l'adresse s'efface aussitôt — sans quoi un rechargement renverrait
 * indéfiniment vers un salon peut-être refermé depuis, et le code resterait
 * affiché à qui regarde par-dessus l'épaule. Or `StrictMode` rejoue les
 * initialiseurs d'état, et la seconde lecture tombait sur une adresse déjà
 * nettoyée : l'app repartait sur l'accueil, le code perdu. Ici, la lecture
 * précède tout rendu et ne peut pas se rejouer.
 */
const CODE_INVITE = lireCodeInvite()

function lireCodeInvite(): string {
  if (typeof window === 'undefined') return ''
  const code = new URLSearchParams(window.location.search).get('partie') ?? ''
  if (code) window.history.replaceState(null, '', window.location.pathname)
  return code
}

export function App() {
  const [pref, setPref, themeName] = useThemePref()
  const [languePref, setLanguePref, langue] = useLanguePref()
  /* Le traducteur se fabrique ici plutôt que par `useT()` : `App` monte le
     fournisseur de langue, donc elle est au-dessus de son propre contexte. */
  const tr = useMemo(() => traducteur(langue), [langue])
  const [vue, setVue] = useState<Vue>(CODE_INVITE ? { v: 'rejoindre' } : { v: 'accueil' })

  /* Réglages de la partie à créer, avant que le salon existe. */
  const [places, setPlaces] = useState(4)
  const [format, setFormat] = useState<Format>('chacun')
  const [cartesManche, setCartesManche] = useState(true)
  const [monNom, setMonNom] = useState('')

  const sessionRef = useRef<Session | null>(null)
  const [etat, setEtat] = useState<VueSession | null>(null)
  const [motifAvis, setMotifAvis] = useState<Avis | undefined>()

  const ecouteurs = useCallback(
    () => ({
      onChange: () => setEtat(sessionRef.current?.vue() ?? null),
      onAvis: (a: Avis) => setMotifAvis(a),
    }),
    [],
  )

  const quitterSalon = useCallback(() => {
    sessionRef.current?.quitter()
    sessionRef.current = null
    setEtat(null)
    setMotifAvis(undefined)
    setVue({ v: 'accueil' })
  }, [])

  useEffect(() => () => sessionRef.current?.quitter(), [])

  /* Un téléphone qui se réveille a laissé mourir ses liens sans prévenir. */
  useEffect(() => {
    const reveil = () => {
      if (document.visibilityState === 'visible') sessionRef.current?.reveiller()
    }
    document.addEventListener('visibilitychange', reveil)
    window.addEventListener('online', reveil)
    return () => {
      document.removeEventListener('visibilitychange', reveil)
      window.removeEventListener('online', reveil)
    }
  }, [])

  /* La partie est finie : on l'inscrit au palmarès, une seule fois. */
  const inscrite = useRef<string | null>(null)
  useEffect(() => {
    const jeu = etat?.jeu
    if (!jeu || jeu.phase !== 'fin' || !etat) return
    const cle = `${etat.code}-${etat.salon.round}-${jeu.seed}`
    if (inscrite.current === cle) return
    inscrite.current = cle

    const rangs = standings(jeu)
    const gagnants = rangs.filter((r) => r.winner).map((r) => r.player.name)
    const moi = jeu.players.find((p) => p.id === etat.moi)
    if (!moi) return
    enregistrerPartie({
      at: Date.now(),
      format: jeu.config.format,
      joueurs: jeu.players.length,
      gagnant: gagnants.join(' + '),
      gagnants,
      monMur: moi.wall,
      mesBriques: bricks(moi),
      monNom: moi.name,
      gagnee: gagnants.includes(moi.name),
      noms: jeu.players.map((p) => p.name),
    })
  }, [etat])

  /* Le salon lancé bascule automatiquement sur la partie, et inversement. */
  useEffect(() => {
    if (!etat) return
    if (etat.jeu && etat.salon.lancee && vue.v === 'salon') setVue({ v: 'partie' })
    if (!etat.salon.lancee && vue.v === 'partie') setVue({ v: 'salon' })
  }, [etat, vue.v])

  const avis = motifAvis ? direAvis(tr, motifAvis) : undefined

  const jouer = (choix: Choice[]) => {
    for (const c of choix) compterCarte(c.card)
    sessionRef.current?.jouer(choix)
  }

  /*
   * La conversation de la table, offerte aux écrans par un contexte.
   *
   * Elle traverse le salon, le tour de jeu et la révélation, qui n'ont rien
   * d'autre en commun : la faire descendre en propriétés aurait ajouté quatre
   * paramètres à trois écrans pour un usage qui n'est celui d'aucun des trois.
   * Hors session, le contexte vaut `null` et l'app n'affiche ni feuille ni
   * éventail — c'est aussi ce qui permet à la galerie de rendre ces écrans
   * sans monter de réseau.
   *
   * Les sièges viennent du SALON et non de la partie : au salon, la partie
   * n'existe pas encore, et c'est là qu'on se parle le plus.
   */
  const salle: Salle | null = etat
    ? {
        moi: etat.moi,
        auteurs: etat.salon.joueurs.map((j) => ({ id: j.clientId, nom: j.nom, ci: j.ci })),
        messages: etat.messages,
        envoyer: (texte: string) => sessionRef.current?.envoyerMessage(texte) ?? false,
      }
    : null

  const contenu = () => {
    switch (vue.v) {
      case 'accueil':
        return (
          <Accueil
            onCreer={() => setVue({ v: 'creation' })}
            onRejoindre={() => {
              setMotifAvis(undefined)
              setVue({ v: 'rejoindre' })
            }}
            onRegles={() => setVue({ v: 'regles' })}
            onPalmares={() => setVue({ v: 'palmares', retour: 'accueil' })}
            onReglages={() => setVue({ v: 'reglages' })}
          />
        )

      case 'creation':
        return (
          <Creation
            places={places}
            format={format}
            cartesManche={cartesManche}
            nom={monNom}
            onNom={setMonNom}
            onPlaces={setPlaces}
            onFormat={setFormat}
            onCartesManche={setCartesManche}
            onRetour={() => setVue({ v: 'accueil' })}
            onOuvrir={() => {
              setMotifAvis(undefined)
              const session = Session.creer(monNom, ecouteurs())
              sessionRef.current = session
              session.reglerPlaces(places)
              session.reglerFormat(format)
              session.reglerCartesManche(cartesManche)
              setEtat(session.vue())
              setVue({ v: 'salon' })
            }}
          />
        )

      case 'rejoindre':
        return (
          <Rejoindre
            nom={monNom}
            codeInitial={CODE_INVITE}
            onNom={setMonNom}
            erreur={avis}
            onRetour={() => setVue({ v: 'accueil' })}
            onRejoindre={(code, nom) => {
              setMotifAvis(undefined)
              setMonNom(nom)
              const session = Session.rejoindre(code, nom, ecouteurs())
              sessionRef.current = session
              setEtat(session.vue())
              setVue({ v: 'salon' })
            }}
          />
        )

      case 'salon': {
        if (!etat) return null
        return (
          <Salon
            etat={etat}
            avis={avis}
            onIdentite={(ci) => sessionRef.current?.choisirIdentite(ci)}
            onPret={(p) => sessionRef.current?.sePreparer(p)}
            onAdmettre={(id) => sessionRef.current?.admettre(id)}
            onRefuser={(id) => sessionRef.current?.refuser(id)}
            onAjouterBot={() => sessionRef.current?.ajouterBot()}
            onRetirerBot={(id) => sessionRef.current?.retirerBot(id)}
            onNiveauBot={(id, niveau) => sessionRef.current?.reglerNiveauBot(id, niveau)}
            onNiveauBots={(niveau) => sessionRef.current?.reglerNiveauBots(niveau)}
            onLancer={() => sessionRef.current?.lancer()}
            onQuitter={quitterSalon}
          />
        )
      }

      case 'partie': {
        const jeu = etat?.jeu
        if (!jeu || !etat) return null
        if (jeu.phase === 'revelation') {
          return (
            <Revelation
              state={jeu}
              moi={etat.moi}
              onSuivant={() => sessionRef.current?.passerALaSuite()}
            />
          )
        }
        if (jeu.phase === 'fin') {
          return (
            <Fin
              state={jeu}
              moi={etat.moi}
              peutRejouer={etat.hote}
              onRejouer={() => sessionRef.current?.rejouer()}
              onPalmares={() => setVue({ v: 'palmares', retour: 'partie' })}
              onQuitter={quitterSalon}
            />
          )
        }
        return (
          <Jeu
            state={jeu}
            moi={etat.moi}
            joues={etat.joues}
            absentsDepuis={etat.absentsDepuis}
            onJouer={jouer}
            onSuite={() => sessionRef.current?.passerALaSuite()}
            onQuitter={quitterSalon}
          />
        )
      }

      case 'palmares':
        return <Palmares onRetour={() => setVue({ v: vue.retour })} />

      case 'regles':
        // La page qu'on lit une fois : l'écran 04 de la planche.
        return (
          <ReglesRapides
            onCompris={() => setVue({ v: 'accueil' })}
            onChapitres={() => setVue({ v: 'sommaire' })}
            onRetour={() => setVue({ v: 'accueil' })}
          />
        )

      case 'sommaire':
        return (
          <ReglesSommaire
            onChapitre={(id) => setVue({ v: 'chapitre', id })}
            onRetour={() => setVue({ v: 'regles' })}
          />
        )

      case 'chapitre':
        return (
          <ReglesChapitre
            chapitre={vue.id}
            onSommaire={() => setVue({ v: 'sommaire' })}
            onRetour={() => setVue({ v: 'sommaire' })}
          />
        )

      case 'cartes-manche':
        return <CartesDeManche onRetour={() => setVue({ v: 'reglages' })} />

      case 'reglages':
        return (
          <Reglages
            pref={pref}
            onPref={setPref}
            languePref={languePref}
            onLanguePref={setLanguePref}
            onCartesManche={() => setVue({ v: 'cartes-manche' })}
            onRetour={() => setVue({ v: 'accueil' })}
          />
        )
    }
  }

  return (
    <LangueProvider langue={langue}>
      <ThemeProvider name={themeName}>
        <DiscussionProvider valeur={salle}>
          <div className="rempart-cadre">{contenu()}</div>
        </DiscussionProvider>
      </ThemeProvider>
    </LangueProvider>
  )
}
