import { SAFE_TOP, TEXTE, TITRE } from '../theme'
import { DECK } from '../game/content'
import { CARD_LABEL } from '../game/types'
import { Bouton, BoutonCreux, Etiquette, Panneau, Texte } from '../ui/atoms'
import { LONGUEUR_CODE } from '../net/room'
import { Logo, MurMiniature } from '../ui/Logo'
import { Pictogramme } from '../ui/Pictogramme'
import { Ecran } from '../ui/shell'
import { useTheme } from '../ui/theme'
import { lire, quand, type PartieEnregistree } from '../store/palmares'

/**
 * 01 · Accueil.
 *
 * Le vide est comblé par deux blocs qui portent de l'information réelle, pas
 * du décor : l'aperçu des quatre cartes (un invité comprend le jeu avant même
 * de rejoindre, sans tutoriel) et la dernière partie (ça donne envie de
 * relancer, et c'est de la donnée que l'app a déjà en local).
 *
 * Au tout premier lancement, le second bloc n'existe pas — l'aperçu des cartes
 * remonte alors naturellement.
 */
export function Accueil({
  onCreer,
  onRejoindre,
  onRegles,
  onPalmares,
  onReglages,
}: {
  onCreer: () => void
  onRejoindre: () => void
  onRegles: () => void
  onPalmares: () => void
  onReglages: () => void
}) {
  const t = useTheme()
  const derniere: PartieEnregistree | undefined = lire().parties[0]

  return (
    <Ecran>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: `calc(max(${SAFE_TOP}px, env(safe-area-inset-top)) + 26px) 22px 22px 22px`,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          overflowY: 'auto',
        }}
      >
        <Logo />

        <div>
          <h1
            style={{
              font: `700 66px/0.9 ${TITRE}`,
              color: t.ink,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Rempart
          </h1>
          <Texte size={16} color={t.ink2} style={{ marginTop: 22, lineHeight: 1.4 }}>
            Chacun choisit en secret une carte parmi quatre. La carte jouée est interdite la manche
            suivante.
          </Texte>
          <Etiquette size={11} style={{ letterSpacing: '0.1em', marginTop: 12 }}>
            2–4 joueurs · 10 manches · 4 minutes
          </Etiquette>
        </div>

        {/* Au tout premier lancement, « ta dernière partie » n'existe pas :
            l'aperçu des cartes remonte alors naturellement au centre plutôt
            que de laisser un trou sous lui. */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            justifyContent: 'center',
          }}
        >
          <Panneau radius={18} pad={16} gap={13}>
            <Etiquette size={11} style={{ letterSpacing: '0.1em' }}>
              Tout le jeu tient dans ces quatre cartes
            </Etiquette>
            <div style={{ display: 'flex', gap: 10 }}>
              {DECK.map((c) => (
                <div
                  key={c.k}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Pictogramme card={c.k} size={38} />
                  <span style={{ font: `700 12px/1 ${TITRE}`, color: t.ink }}>
                    {CARD_LABEL[c.k]}
                  </span>
                </div>
              ))}
            </div>
          </Panneau>

          {derniere && (
            <Panneau
              radius={18}
              pad="14px 16px"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}
            >
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}
              >
                <Etiquette size={11} style={{ letterSpacing: '0.1em' }}>
                  Ta dernière partie
                </Etiquette>
                <div style={{ font: `600 14px/1.3 ${TEXTE}`, color: t.ink }}>
                  {derniere.gagnee ? 'Gagnée' : 'Perdue'} contre {autresQueMoi(derniere)} ·{' '}
                  {quand(derniere.at)}
                </div>
              </div>
              <MurMiniature briques={derniere.mesBriques} />
            </Panneau>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Bouton onClick={onCreer}>Créer une partie</Bouton>
          <Bouton ton="panel" onClick={onRejoindre} note={`code à ${LONGUEUR_CODE}`}>
            Rejoindre
          </Bouton>
          <div style={{ display: 'flex', gap: 10 }}>
            <BoutonCreux onClick={onRegles}>Règles</BoutonCreux>
            <BoutonCreux onClick={onPalmares}>Palmarès</BoutonCreux>
            <BoutonCreux onClick={onReglages}>Réglages</BoutonCreux>
          </div>
          <Texte size={11} color={t.ink2} style={{ textAlign: 'center', paddingTop: 2, lineHeight: 1.5 }}>
            Sans compte · sans pub · sans tracking · fonctionne hors ligne
          </Texte>
        </div>
      </div>
    </Ecran>
  )
}

/** « contre Malo » : le gagnant, ou l'adversaire si c'est moi qui ai gagné. */
function autresQueMoi(p: PartieEnregistree): string {
  if (!p.gagnee) return p.gagnant
  const autre = p.noms.find((n) => n !== p.monNom)
  return autre ?? p.gagnant
}
