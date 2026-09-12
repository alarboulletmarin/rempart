import { Fragment, useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react'
import { TEXTE, TITRE } from '../theme'
import { useT, type Cle, type LanguePref } from '../i18n'
import { Icone } from '../ui/Icone'
import { Etiquette, Panneau, Segmente, Texte } from '../ui/atoms'
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
  nomDefaut,
  onNomDefaut,
  onEffacer,
  onCartesManche,
  onRetour,
}: {
  pref: ThemePref
  onPref: (p: ThemePref) => void
  languePref: LanguePref
  onLanguePref: (p: LanguePref) => void
  /** Le nom mémorisé, celui qui pré-remplit « Nouvelle partie ». */
  nomDefaut: string
  onNomDefaut: (n: string) => void
  /** Efface tout ce que la section confidentialité annonce garder. */
  onEffacer: () => void
  onCartesManche: () => void
  onRetour: () => void
}) {
  const t = useTheme()
  const tr = useT()

  /** La feuille de confirmation est ouverte. */
  const [effacementDemande, setEffacementDemande] = useState(false)
  /** L'effacement a eu lieu ; le message reste tant qu'on est sur l'écran. */
  const [efface, setEfface] = useState(false)

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

        {/*
         * La langue tient sur une ligne, et sans description.
         *
         * « Le jeu, les règles et le récit des manches en français » sous
         * « Français » ne disait rien que le libellé ne disait déjà. La seule
         * ligne qui apporte quelque chose est celle de l'effet réel, et elle
         * est unique : elle suit la sélection, « Système » compris — c'est là
         * que se trouve la vraie information, puisque le libellé ne dit pas
         * quelle langue le système parle.
         */}
        <Segmente
          nom="langue"
          legende={<EnTeteSection as="legend">{tr('reglages.langue.titre')}</EnTeteSection>}
          valeur={languePref}
          onValeur={onLanguePref}
          options={langues.map((id) => ({
            valeur: id,
            libelle: tr(`reglages.langue.${id}.nom` as Cle),
            /* Le nom de la langue s'écrit dans cette langue-là : « English »
               reste lisible pour qui ne lit pas le français, et c'est
               justement cette personne qui cherche ce réglage. */
            langue: id === 'systeme' ? undefined : id,
          }))}
          note={tr('reglages.langue.actuellement', {
            langue: tr(`reglages.langue.nom.${tr.langue}` as Cle),
          })}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: DANS_SECTION }}>
          <EnTeteSection>{tr('reglages.jeu.titre')}</EnTeteSection>
          <ChampNom valeur={nomDefaut} onValider={onNomDefaut} />
          {/*
           * Une ligne de navigation, pas une carte.
           *
           * « Cartes de manche » avait le même arrondi et le même fond que les
           * options cliquables, sans contrôle ni chevron : une fausse
           * affordance devant un texte explicatif, alors que le réglage réel
           * est ailleurs — à la création de la partie. Elle mène maintenant
           * là où elle prétendait mener : la section des règles qui montre les
           * neuf cartes.
           */}
          <LigneNav
            libelle={tr('reglages.jeu.cartesManche.titre')}
            detail={tr('reglages.jeu.cartesManche.detail')}
            onClick={onCartesManche}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: DANS_SECTION }}>
          <EnTeteSection>{tr('reglages.garde.titre')}</EnTeteSection>
          <Panneau radius={RAYON} pad="14px 16px" gap={12}>
            {/* La phrase qui répond à la question reste visible ; les deux
                paragraphes qui la détaillent se lisent une fois et tenaient
                autant de hauteur que toute la section Thème. */}
            <Texte size={14} color={t.ink}>
              {tr('reglages.garde.quoi')}
            </Texte>

            <details
              className="rempart-repli"
              style={{ '--choix-police': TEXTE, '--repli-encre': t.ink2 } as CSSProperties}
            >
              <summary>
                <span>{tr('reglages.garde.plus')}</span>
                <span className="rempart-repli-chevron">
                  <Icone nom="chevron" size={14} color={t.ink2} />
                </span>
              </summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 2 }}>
                <Texte size={13} weight={400}>
                  {tr('reglages.garde.rien')}
                </Texte>
                <Texte size={13} weight={400}>
                  {tr('reglages.garde.horsLigne')}
                </Texte>
              </div>
            </details>

            {/*
             * Sortir doit coûter aussi peu qu'entrer.
             *
             * La section annonçait ce que l'app garde sans donner le moyen de
             * l'effacer : la promesse « sans compte, sans tracking » n'était
             * tenue qu'à moitié. Le bouton est en contour et non en aplat —
             * c'est une issue, pas l'action principale de l'écran.
             */}
            <button
              type="button"
              onClick={() => setEffacementDemande(true)}
              style={{
                minHeight: 48,
                borderRadius: RAYON,
                background: 'transparent',
                border: `2px solid ${t.clayText}`,
                font: `700 15px/1 ${TITRE}`,
                color: t.clayText,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {tr('reglages.effacer.bouton')}
            </button>

            {/* Court, et à sa place : dans la section qui vient de changer,
                pas en travers de l'écran. */}
            {efface && (
              <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icone nom="coche" size={15} color={t.greenText} />
                <Texte size={13} weight={500} color={t.greenText}>
                  {tr('reglages.effacer.fait')}
                </Texte>
              </div>
            )}
          </Panneau>
        </div>

        <Texte size={11} style={{ textAlign: 'center', marginTop: 'auto', lineHeight: 1.5 }}>
          {tr('reglages.pied')}
        </Texte>
      </Corps>

      {effacementDemande && (
        <FeuilleEffacer
          onAnnuler={() => setEffacementDemande(false)}
          onEffacer={() => {
            onEffacer()
            setEffacementDemande(false)
            setEfface(true)
          }}
        />
      )}
    </Ecran>
  )
}

/**
 * La confirmation d'effacement.
 *
 * Elle **liste ce qui part avant que ça parte**, plutôt que de demander
 * « êtes-vous sûr ? » — la question ne renseigne personne, et il n'y a aucune
 * sauvegarde ailleurs pour rattraper un oui de trop.
 *
 * « Annuler » est le bouton fort, comme « Rester » sur la feuille de départ :
 * cette feuille s'ouvre parfois par erreur, jamais l'inverse, donc c'est le
 * choix sûr qui tombe sous le pouce. L'action irréversible reste en contour.
 */
function FeuilleEffacer({
  onAnnuler,
  onEffacer,
}: {
  onAnnuler: () => void
  onEffacer: () => void
}) {
  const t = useTheme()
  const tr = useT()
  const quoi: Cle[] = [
    'reglages.effacer.palmares',
    'reglages.effacer.theme',
    'reglages.effacer.langue',
    'reglages.effacer.nom',
  ]
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tr('reglages.effacer.titre')}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        background: t.panel,
        borderRadius: '26px 26px 30px 30px',
        boxShadow: `0 -3px 0 ${t.edge}`,
        padding: '22px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ font: `700 24px/1.1 ${TITRE}`, color: t.ink, textWrap: 'pretty' }}>
        {tr('reglages.effacer.titre')}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Etiquette size={10}>{tr('reglages.effacer.avant')}</Etiquette>
        {/* Une vraie liste : le lecteur d'écran annonce « 4 éléments », donc on
            sait qu'on a tout entendu. */}
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {quoi.map((cle) => (
            <li key={cle} style={{ font: `500 13px/${LIGNE} ${TEXTE}`, color: t.ink }}>
              {tr(cle)}
            </li>
          ))}
        </ul>
      </div>

      <Texte size={13} weight={500} color={t.clayText}>
        {tr('reglages.effacer.irreversible')}
      </Texte>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={onAnnuler}
          style={{
            flex: 1,
            height: 56,
            borderRadius: 16,
            background: t.clayText,
            boxShadow: `0 4px 0 ${t.clayTextEdge}`,
            border: 'none',
            font: `700 15px/1 ${TITRE}`,
            color: t.panel,
            cursor: 'pointer',
          }}
        >
          {tr('reglages.effacer.annuler')}
        </button>
        <button
          type="button"
          onClick={onEffacer}
          style={{
            flex: 1,
            height: 56,
            borderRadius: 16,
            background: 'transparent',
            border: `2px solid ${t.clayText}`,
            font: `600 12px/1 ${TEXTE}`,
            letterSpacing: '0.06em',
            color: t.clayText,
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {tr('reglages.effacer.confirmer')}
        </button>
      </div>
    </div>
  )
}

/**
 * Le nom par défaut.
 *
 * Il se sauvegarde à la perte de focus : pas de bouton « Enregistrer » à
 * pousser pour trois lettres, et pas une écriture dans le stockage à chaque
 * frappe. La frappe reste locale — sans cela, un `value` piloté depuis le
 * parent replacerait le curseur à chaque lettre.
 */
function ChampNom({
  valeur,
  onValider,
}: {
  valeur: string
  onValider: (n: string) => void
}) {
  const t = useTheme()
  const tr = useT()
  const [saisie, setSaisie] = useState(valeur)

  /* Le nom change par en haut quand on efface ses données : le champ suit. */
  useEffect(() => setSaisie(valeur), [valeur])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input
        value={saisie}
        onChange={(e) => setSaisie(e.target.value)}
        onBlur={() => onValider(saisie.trim())}
        maxLength={14}
        placeholder={tr('creation.nom.exemple')}
        aria-label={tr('reglages.jeu.nom.aria')}
        style={{
          height: 56,
          borderRadius: RAYON,
          background: t.panel,
          boxShadow: `0 3px 0 ${t.edge}`,
          border: '2px solid transparent',
          padding: '0 14px',
          font: `700 18px/1 ${TITRE}`,
          color: t.ink,
          width: '100%',
        }}
      />
      <Texte size={12} weight={400} style={{ lineHeight: LIGNE }}>
        {tr('reglages.jeu.nom.detail')}
      </Texte>
    </div>
  )
}

/**
 * Une ligne qui mène ailleurs : un libellé, une précision, un chevron.
 *
 * Visuellement distincte des cartes de choix — pas d'anneau à gauche, un
 * chevron à droite — parce qu'elle ne fait pas la même chose : elle ne retient
 * rien, elle ouvre un autre écran.
 */
function LigneNav({
  libelle,
  detail,
  onClick,
}: {
  libelle: string
  detail: string
  onClick: () => void
}) {
  const t = useTheme()
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: t.panel,
        borderRadius: RAYON,
        boxShadow: `0 3px 0 ${t.edge}`,
        border: 'none',
        minHeight: 56,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        textAlign: 'left',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ font: `700 16px/1.25 ${TITRE}`, color: t.ink }}>{libelle}</span>
        <span
          style={{ font: `400 12px/${LIGNE} ${TEXTE}`, color: t.ink2, textWrap: 'pretty' }}
        >
          {detail}
        </span>
      </span>
      <Icone nom="chevron" size={18} color={t.ink2} />
    </button>
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
