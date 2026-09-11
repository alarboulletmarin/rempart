import { useCallback, useEffect, useRef, useState } from 'react'
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
 * Les phrases des avis.
 *
 * La couche réseau transmet un motif, jamais une phrase : elle n'a pas à
 * connaître la langue du joueur, et une même cause doit se dire pareil partout.
 */
const PHRASES: Record<Avis['code'], string> = {
  lienEchoue: 'La mise en relation n’a pas abouti. Vérifie ta connexion.',
  lienBloque:
    'Ton réseau bloque la connexion directe. Un partage de connexion, ou un autre Wi-Fi, passe souvent mieux.',
  lienPerdu: 'Le lien avec l’hôte est coupé.',
  refuse: 'L’hôte n’a pas ouvert la porte.',
  salonPlein: 'Le salon est complet.',
  partieEnCours: 'La partie a déjà commencé.',
  hotePris: 'Quelqu’un d’autre arbitre la table : tu redeviens invité, ton mur reste intact.',
  gestRefuse: 'Ce coup n’est pas jouable.',
}

export function App() {
  const [pref, setPref, themeName] = useThemePref()
  const [vue, setVue] = useState<Vue>({ v: 'accueil' })

  /* Réglages de la partie à créer, avant que le salon existe. */
  const [places, setPlaces] = useState(4)
  const [format, setFormat] = useState<Format>('chacun')
  const [cartesManche, setCartesManche] = useState(true)
  const [monNom, setMonNom] = useState('')

  const sessionRef = useRef<Session | null>(null)
  const [etat, setEtat] = useState<VueSession | null>(null)
  const [avis, setAvis] = useState<string | undefined>()

  const ecouteurs = useCallback(
    () => ({
      onChange: () => setEtat(sessionRef.current?.vue() ?? null),
      onAvis: (a: Avis) => setAvis(PHRASES[a.code]),
    }),
    [],
  )

  const quitterSalon = useCallback(() => {
    sessionRef.current?.quitter()
    sessionRef.current = null
    setEtat(null)
    setAvis(undefined)
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

  const jouer = (choix: Choice[]) => {
    for (const c of choix) compterCarte(c.card)
    sessionRef.current?.jouer(choix)
  }

  const contenu = () => {
    switch (vue.v) {
      case 'accueil':
        return (
          <Accueil
            onCreer={() => setVue({ v: 'creation' })}
            onRejoindre={() => {
              setAvis(undefined)
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
              setAvis(undefined)
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
            onNom={setMonNom}
            erreur={avis}
            onRetour={() => setVue({ v: 'accueil' })}
            onRejoindre={(code, nom) => {
              setAvis(undefined)
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
            onCartesManche={() => setVue({ v: 'cartes-manche' })}
            onRetour={() => setVue({ v: 'accueil' })}
          />
        )
    }
  }

  return (
    <ThemeProvider name={themeName}>
      <div className="rempart-cadre">{contenu()}</div>
    </ThemeProvider>
  )
}
