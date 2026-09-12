import { Fragment, useId, type CSSProperties, type ReactNode } from 'react'
import { TEXTE, TITRE } from '../theme'
import { useT, type Cle, type LanguePref } from '../i18n'
import { Icone } from '../ui/Icone'
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
 * Le rayon des pièces de choix, et la hauteur de leur ligne.
 *
 * Les cartes de thème et le contrôle de langue sont deux formes différentes
 * pour deux natures de choix, mais ils appartiennent au même écran : même
 * arrondi, même encre d'accent (`choix`), même interligne. Le 14 se retrouve
 * sur la piste du segmenté, dans `global.css`.
 */
const RAYON = 14
const LIGNE = 1.4

/**
 * Réglages.
 *
 * Il n'y a presque rien à régler, et c'est voulu : pas de compte, pas de
 * profil, pas de notifications. Le thème, la langue, l'accès aux cartes de
 * manche, et ce que l'app garde sur l'appareil.
 *
 * ## Deux contrôles, et c'est volontaire
 *
 * Le thème garde des cartes descriptives : « Établi » et « Veillée » ne disent
 * rien sans leur ligne d'explication. La langue, non — « Français » n'a pas
 * besoin qu'on précise que le jeu sera en français —, donc elle tient sur une
 * ligne. La nature du choix décide de la forme du contrôle, pas la symétrie de
 * l'écran.
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
        <GroupeCartes
          nom="theme"
          titre={tr('reglages.theme.titre')}
          valeur={pref}
          onValeur={onPref}
          options={themes.map((id) => ({
            valeur: id,
            libelle: tr(`reglages.theme.${id}.nom` as Cle),
            detail: tr(`reglages.theme.${id}.detail` as Cle),
          }))}
        />

        <GroupeCartes
          nom="langue"
          titre={tr('reglages.langue.titre')}
          valeur={languePref}
          onValeur={onLanguePref}
          options={langues.map((id) => ({
            valeur: id,
            libelle: tr(`reglages.langue.${id}.nom` as Cle),
            detail: tr(`reglages.langue.${id}.detail` as Cle),
            /* Le nom de la langue s'écrit dans cette langue-là : « English »
               reste lisible pour qui ne lit pas le français, et c'est
               justement cette personne qui cherche ce réglage. */
            langue: id === 'systeme' ? undefined : id,
          }))}
        />

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
 *
 * En `legend`, l'en-tête visible sert de nom au groupe de boutons radio ; une
 * légende masquée en plus aurait redit le même mot à qui écoute.
 */
function EnTeteSection({ children, as }: { children: ReactNode; as?: 'div' | 'legend' }) {
  const t = useTheme()
  return (
    <Etiquette
      as={as}
      className={as === 'legend' ? 'rempart-legende' : undefined}
      size={12}
      color={t.ink}
    >
      {children}
    </Etiquette>
  )
}

/**
 * Un groupe de cartes descriptives — de VRAIS boutons radio.
 *
 * Pas une liste de `<button aria-pressed>` : les flèches du clavier parcourent
 * un groupe de radios sans qu'on ait une ligne à écrire, et le lecteur d'écran
 * annonce « 2 sur 3 », ce qu'aucun bouton ne sait dire. Le radio lui-même est
 * sorti du flux (voir `.rempart-cartes` dans `global.css`) ; c'est la carte,
 * son `<label>`, qui le porte à l'écran.
 */
function GroupeCartes<V extends string>({
  nom,
  titre,
  options,
  valeur,
  onValeur,
}: {
  /** Le `name` commun : c'est lui qui fait le groupe, et donc la navigation. */
  nom: string
  titre: string
  options: readonly { valeur: V; libelle: string; detail: string; langue?: string }[]
  valeur: V
  onValeur: (v: V) => void
}) {
  const t = useTheme()
  const prefixe = useId()
  return (
    <fieldset className="rempart-groupe">
      <EnTeteSection as="legend">{titre}</EnTeteSection>
      <div
        className="rempart-cartes"
        style={
          {
            display: 'flex',
            flexDirection: 'column',
            gap: DANS_SECTION,
            '--choix-focus': t.choix,
          } as CSSProperties
        }
      >
        {options.map((o) => {
          const id = `${prefixe}-${nom}-${o.valeur}`
          const choisi = o.valeur === valeur
          return (
            <Fragment key={o.valeur}>
              <input
                type="radio"
                id={id}
                name={nom}
                value={o.valeur}
                checked={choisi}
                onChange={() => onValeur(o.valeur)}
              />
              {/*
               * La carte retenue garde son fond.
               *
               * Elle prenait un aplat de pleine encre, ou de terre cuite en
               * veillée. Or la terre cuite dit « tu as perdu une brique » en
               * jeu et « Lancer » sur les boutons d'action : trois sens pour
               * une couleur, et deux blocs pleins sur un écran qui n'a aucune
               * action primaire. Ce qui porte l'état, désormais : un contour
               * de 2 px, l'anneau rempli, et une coche dessinée — trois
               * signaux dont aucun n'est une couleur seule.
               */}
              <label
                htmlFor={id}
                style={{
                  background: t.panel,
                  borderRadius: RAYON,
                  /* Transparent quand la carte n'est pas prise : la géométrie
                     ne bouge pas d'un pixel au clic. */
                  border: `2px solid ${choisi ? t.choix : 'transparent'}`,
                  boxShadow: `0 3px 0 ${t.edge}`,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 5,
                  cursor: 'pointer',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Anneau coche={choisi} />
                  <span
                    lang={o.langue}
                    style={{ font: `700 16px/1.25 ${TITRE}`, color: t.ink }}
                  >
                    {o.libelle}
                  </span>
                  {choisi && (
                    <span style={{ marginLeft: 'auto', display: 'flex' }}>
                      <Icone nom="coche" size={15} color={t.choix} />
                    </span>
                  )}
                </span>
                <span
                  style={{
                    font: `400 13px/${LIGNE} ${TEXTE}`,
                    color: t.ink2,
                    textWrap: 'pretty',
                  }}
                >
                  {o.detail}
                </span>
              </label>
            </Fragment>
          )
        })}
      </div>
    </fieldset>
  )
}

/**
 * L'anneau d'un bouton radio, visible dans les DEUX états.
 *
 * La pastille ne se dessinait que sur l'option déjà cochée : ailleurs, elle
 * était en `edge`, c'est-à-dire du brun sur du brun — 1,41 contre 1 en
 * veillée. Le seul élément qui porte l'état n'existait donc visuellement que
 * là où l'état était déjà acquis, et rien ne disait que ces cartes étaient des
 * choix tant qu'on n'en avait pas touché une.
 *
 * Vide, l'anneau tient le 3:1 des éléments d'interface (3,86 en établi, 4,43
 * en veillée) ; rempli, il passe à l'encre du choix.
 */
function Anneau({ coche }: { coche: boolean }) {
  const t = useTheme()
  return (
    <span
      aria-hidden="true"
      style={{
        width: 18,
        height: 18,
        flex: '0 0 18px',
        borderRadius: '50%',
        border: `2px solid ${coche ? t.choix : t.anneau}`,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {coche && (
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.choix }} />
      )}
    </span>
  )
}
