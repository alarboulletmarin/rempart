import type { ReactNode } from 'react'
import { TEXTE, TITRE } from '../theme'
import { useT, type Cle, type LanguePref } from '../i18n'
import { Etiquette, Panneau, Texte } from '../ui/atoms'
import { Corps, Ecran, EnTete } from '../ui/shell'
import { useTheme, type ThemePref } from '../ui/theme'

/**
 * L'espace qui fait les groupes.
 *
 * Les cartes d'une même section se touchent presque — huit pixels —, et
 * vingt-six séparent une section de la suivante. Trois fois plus, et c'est la
 * seule chose qui dise « ceci est un groupe » : l'espace au-dessus d'un en-tête
 * valait le même que celui entre deux cartes, donc le regard ne voyait qu'une
 * pile, et les deux « Comme le téléphone » de deux sections différentes se
 * confondaient. Proximité avant bordures : aucun trait de séparation ajouté.
 */
const DANS_SECTION = 8

/**
 * Réglages.
 *
 * Il n'y a presque rien à régler, et c'est voulu : pas de compte, pas de
 * profil, pas de notifications. Le thème, la langue, l'accès aux cartes de
 * manche, et ce que l'app garde sur l'appareil.
 *
 * Le thème et la langue se règlent de la même façon parce qu'ils sont la même
 * chose : une préférence à trois états dont le troisième suit le téléphone.
 */
export function Reglages({
  pref,
  onPref,
  languePref,
  onLanguePref,
  onCartesManche,
  onRetour,
}: {
  pref: ThemePref
  onPref: (p: ThemePref) => void
  languePref: LanguePref
  onLanguePref: (p: LanguePref) => void
  onCartesManche: () => void
  onRetour: () => void
}) {
  const t = useTheme()
  const tr = useT()

  const themes: ThemePref[] = ['systeme', 'etabli', 'veillee']
  const langues: LanguePref[] = ['systeme', 'fr', 'en']

  return (
    <Ecran>
      <EnTete titre={tr('reglages.titre')} onRetour={onRetour} hauteur={102} />
      <Corps pad={20} gap={26} scroll>
        <div style={{ display: 'flex', flexDirection: 'column', gap: DANS_SECTION }}>
          <EnTeteSection>{tr('reglages.theme.titre')}</EnTeteSection>
          {themes.map((id) => (
            <Option
              key={id}
              nom={tr(`reglages.theme.${id}.nom` as Cle)}
              detail={tr(`reglages.theme.${id}.detail` as Cle)}
              choisi={pref === id}
              onClick={() => onPref(id)}
            />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: DANS_SECTION }}>
          <EnTeteSection>{tr('reglages.langue.titre')}</EnTeteSection>
          {langues.map((id) => (
            <Option
              key={id}
              nom={tr(`reglages.langue.${id}.nom` as Cle)}
              detail={tr(`reglages.langue.${id}.detail` as Cle)}
              choisi={languePref === id}
              onClick={() => onLanguePref(id)}
              /* Le nom de la langue s'écrit dans cette langue-là : « English »
                 reste lisible pour qui ne lit pas le français, et c'est
                 justement cette personne qui cherche ce réglage. */
              langue={id === 'systeme' ? undefined : id}
            />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: DANS_SECTION }}>
          <EnTeteSection>{tr('reglages.jeu.titre')}</EnTeteSection>
          <Panneau radius={16} pad="14px 16px" gap={3} onClick={onCartesManche}>
            <span style={{ font: `700 17px/1 ${TITRE}`, color: t.ink }}>
              {tr('reglages.jeu.cartesManche.titre')}
            </span>
            <Texte size={12} weight={400}>
              {tr('reglages.jeu.cartesManche.detail')}
            </Texte>
          </Panneau>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: DANS_SECTION }}>
          <EnTeteSection>{tr('reglages.garde.titre')}</EnTeteSection>
          <Panneau radius={16} pad="14px 16px" gap={8}>
            <Texte size={14} color={t.ink}>
              {tr('reglages.garde.quoi')}
            </Texte>
            <Texte size={13} weight={400}>
              {tr('reglages.garde.rien')}
            </Texte>
            <Texte size={13} weight={400}>
              {tr('reglages.garde.horsLigne')}
            </Texte>
          </Panneau>
        </div>

        <Texte size={11} style={{ textAlign: 'center', marginTop: 'auto', lineHeight: 1.5 }}>
          {tr('reglages.pied')}
        </Texte>
      </Corps>
    </Ecran>
  )
}

/**
 * L'en-tête d'une section.
 *
 * En `ink2` à 11 px, il mesurait 5,27 contre 1 sur la table — au-dessus du
 * seuil, mais assez discret pour que le regard saute par-dessus. Il passe à
 * l'encre du texte courant : 10,7 contre 1 en établi, 14,8 en veillée.
 */
function EnTeteSection({ children }: { children: ReactNode }) {
  const t = useTheme()
  return (
    <Etiquette size={12} color={t.ink}>
      {children}
    </Etiquette>
  )
}

/** Une option de réglage : une pastille ocre, un nom, une ligne de détail. */
function Option({
  nom,
  detail,
  choisi,
  onClick,
  langue,
}: {
  nom: string
  detail: string
  choisi: boolean
  onClick: () => void
  /** La langue du NOM, quand elle diffère de celle de l'écran. */
  langue?: string
}) {
  const t = useTheme()
  return (
    <Panneau
      radius={16}
      pad="14px 16px"
      gap={6}
      bg={choisi ? t.selBg : t.panel}
      edge={choisi ? t.selEdge : t.edge}
      onClick={onClick}
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
        <span lang={langue} style={{ font: `700 16px/1 ${TITRE}`, color: choisi ? t.selFg : t.ink }}>
          {nom}
        </span>
      </span>
      <span
        style={{
          font: `400 13px/1.4 ${TEXTE}`,
          color: choisi ? t.table : t.ink2,
          textWrap: 'pretty',
        }}
      >
        {detail}
      </span>
    </Panneau>
  )
}
