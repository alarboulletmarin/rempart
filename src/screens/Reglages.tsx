import { TEXTE, TITRE } from '../theme'
import { Etiquette, Panneau, Texte } from '../ui/atoms'
import { Corps, Ecran, EnTete } from '../ui/shell'
import { useTheme, type ThemePref } from '../ui/theme'

/**
 * Réglages.
 *
 * Il n'y a presque rien à régler, et c'est voulu : pas de compte, pas de
 * profil, pas de notifications. Le thème, l'accès aux cartes de manche, et ce
 * que l'app garde sur l'appareil.
 */
export function Reglages({
  pref,
  onPref,
  onCartesManche,
  onRetour,
}: {
  pref: ThemePref
  onPref: (p: ThemePref) => void
  onCartesManche: () => void
  onRetour: () => void
}) {
  const t = useTheme()

  const options: { id: ThemePref; nom: string; detail: string }[] = [
    { id: 'systeme', nom: 'Comme le téléphone', detail: 'Suit le réglage clair ou sombre du système.' },
    { id: 'etabli', nom: 'Établi', detail: 'La table de jour : kraft, carton, terre cuite.' },
    { id: 'veillee', nom: 'Veillée', detail: 'Le même établi à la lampe : bois brûlé et craie.' },
  ]

  return (
    <Ecran>
      <EnTete titre="Réglages" onRetour={onRetour} hauteur={102} />
      <Corps pad={20} gap={20} scroll>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Etiquette>Thème</Etiquette>
          {options.map((o) => {
            const choisi = pref === o.id
            return (
              <Panneau
                key={o.id}
                radius={16}
                pad="14px 16px"
                gap={6}
                bg={choisi ? t.selBg : t.panel}
                edge={choisi ? t.selEdge : t.edge}
                onClick={() => onPref(o.id)}
                pressed={choisi}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: choisi ? t.ochre : t.edge,
                      flex: '0 0 14px',
                    }}
                  />
                  <span style={{ font: `700 16px/1 ${TITRE}`, color: choisi ? t.selFg : t.ink }}>
                    {o.nom}
                  </span>
                </span>
                <span
                  style={{
                    font: `400 13px/1.4 ${TEXTE}`,
                    color: choisi ? t.table : t.ink2,
                    textWrap: 'pretty',
                  }}
                >
                  {o.detail}
                </span>
              </Panneau>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Etiquette>Le jeu</Etiquette>
          <Panneau radius={16} pad="14px 16px" gap={3} onClick={onCartesManche}>
            <span style={{ font: `700 17px/1 ${TITRE}`, color: t.ink }}>Cartes de manche</span>
            <Texte size={12} weight={400}>
              Les neuf cartes des manches 3, 6 et 9. Elles s’activent à la création de la partie.
            </Texte>
          </Panneau>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Etiquette>Ce que l’app garde</Etiquette>
          <Panneau radius={16} pad="14px 16px" gap={8}>
            <Texte size={14} color={t.ink}>
              Ton palmarès et ton thème, sur cet appareil uniquement.
            </Texte>
            <Texte size={13} weight={400}>
              Aucun compte, aucune publicité, aucune mesure d’audience. Les parties passent
              directement d’un téléphone à l’autre : il n’y a pas de serveur de jeu, et un service
              de mise en relation sert seulement à établir la connexion — il ne voit jamais la
              partie.
            </Texte>
            <Texte size={13} weight={400}>
              Une fois l’app installée, elle fonctionne hors ligne. Le multijoueur, lui, demande une
              connexion.
            </Texte>
          </Panneau>
        </div>

        <Texte size={11} style={{ textAlign: 'center', marginTop: 'auto', lineHeight: 1.5 }}>
          Rempart · 2–4 joueurs · 10 manches · 4 minutes
        </Texte>
      </Corps>
    </Ecran>
  )
}
