import { SAFE_TOP, TEXTE, TITRE } from '../theme'
import { CARD_KEYS } from '../game/types'
import { useT } from '../i18n'
import { Bouton, BoutonCreux, Etiquette, Panneau, Texte } from '../ui/atoms'
import { LONGUEUR_CODE } from '../net/room'
import { Logo, MurMiniature } from '../ui/Logo'
import { Pictogramme } from '../ui/Pictogramme'
import { Ecran } from '../ui/shell'
import { useTheme } from '../ui/theme'
import { quand } from '../i18n/dates'
import { lire, type PartieEnregistree } from '../store/palmares'

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
  const tr = useT()
  const derniere: PartieEnregistree | undefined = lire().parties[0]

  return (
    <Ecran>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: `calc(${SAFE_TOP} + 26px) 22px 22px 22px`,
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
            {tr('accueil.baseline')}
          </Texte>
          <Etiquette size={11} style={{ letterSpacing: '0.1em', marginTop: 12 }}>
            {tr('accueil.format')}
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
              {tr('accueil.cartes.titre')}
            </Etiquette>
            <div style={{ display: 'flex', gap: 10 }}>
              {CARD_KEYS.map((k) => (
                <div
                  key={k}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Pictogramme card={k} size={38} />
                  <span style={{ font: `700 12px/1 ${TITRE}`, color: t.ink }}>
                    {tr(`carte.${k}` as const)}
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
                  {tr('accueil.derniere.titre')}
                </Etiquette>
                <div style={{ font: `600 14px/1.3 ${TEXTE}`, color: t.ink }}>
                  {tr(derniere.gagnee ? 'accueil.derniere.gagnee' : 'accueil.derniere.perdue', {
                    adversaire: autresQueMoi(derniere),
                    quand: quand(tr, derniere.at),
                  })}
                </div>
              </div>
              <MurMiniature briques={derniere.mesBriques} />
            </Panneau>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Bouton onClick={onCreer}>{tr('accueil.creer')}</Bouton>
          <Bouton
            ton="panel"
            onClick={onRejoindre}
            note={tr('accueil.rejoindre.note', { n: LONGUEUR_CODE })}
          >
            {tr('accueil.rejoindre')}
          </Bouton>
          <div style={{ display: 'flex', gap: 10 }}>
            <BoutonCreux onClick={onRegles}>{tr('accueil.regles')}</BoutonCreux>
            <BoutonCreux onClick={onPalmares}>{tr('accueil.palmares')}</BoutonCreux>
            <BoutonCreux onClick={onReglages}>{tr('accueil.reglages')}</BoutonCreux>
          </div>
          <Texte size={11} color={t.ink2} style={{ textAlign: 'center', paddingTop: 2, lineHeight: 1.5 }}>
            {tr('accueil.pied')}
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
