import { TEXTE, TITRE } from '../theme'
import { humains, type Salon } from '../net/room'
import { useT } from '../i18n'
import type { Cle } from '../i18n'
import { Etiquette, Scribble, Texte } from '../ui/atoms'
import { useTheme } from '../ui/theme'

/**
 * Ce que quitter veut dire, ici, maintenant.
 *
 * Trois situations, trois conséquences différentes, et c'est une règle : une
 * fonction pure, testable, plutôt qu'une suite de ternaires au milieu du rendu.
 *
 * `garde` dit si la place est reprenable. Elle l'est dès qu'il reste quelqu'un
 * pour la tenir : l'hôte laisse le siège en place et ses cartes ne sont plus
 * jouées (`net/table.ts`, `sortir`), et le `clientId` survit au rechargement,
 * donc le code ramène chez soi sans redemander l'accord de personne
 * (`net/admission.ts`). Seul contre des bots, il n'y a personne pour garder
 * quoi que ce soit : la partie meurt avec l'onglet, et le promettre serait
 * mentir.
 */
export function consequenceDuDepart(salon: Salon, hote: boolean): { detail: Cle; garde: boolean } {
  if (humains(salon).length <= 1) return { detail: 'quitter.seul', garde: false }
  return { detail: hote ? 'quitter.arbitre' : 'quitter.ensemble', garde: true }
}

/**
 * 13 · Quitter une partie en cours.
 *
 * Une partie de quatre minutes n'est pas une prison : on doit pouvoir en
 * sortir. Mais partir coûte — aux autres, et à soi qui perd le fil — donc le
 * geste se confirme, et la confirmation dit ce qu'il en coûte plutôt que
 * « êtes-vous sûr ? », qui ne renseigne personne.
 *
 * **« Rester » est le bouton fort.** Cette feuille s'ouvre parfois par erreur,
 * jamais l'inverse : c'est le choix sûr qui doit tomber sous le pouce.
 */
export function FeuilleQuitter({
  salon,
  hote,
  onRester,
  onQuitter,
}: {
  salon: Salon
  hote: boolean
  onRester: () => void
  onQuitter: () => void
}) {
  const t = useTheme()
  const tr = useT()
  const { detail, garde } = consequenceDuDepart(salon, hote)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tr('quitter.aria')}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        background: t.panel,
        borderRadius: '26px 26px 30px 30px',
        padding: '22px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Scribble nom="pause" width={56} height={46} />
        <div style={{ font: `700 24px/1.1 ${TITRE}`, color: t.ink, textWrap: 'pretty' }}>
          {tr('quitter.titre')}
        </div>
      </div>

      <Texte size={14}>{tr(detail)}</Texte>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={onRester}
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
          {tr('quitter.rester')}
        </button>
        <button
          type="button"
          onClick={onQuitter}
          style={{
            flex: 1,
            height: 56,
            borderRadius: 16,
            background: t.cardOff,
            border: 'none',
            font: `600 12px/1 ${TEXTE}`,
            letterSpacing: '0.06em',
            color: t.ink2,
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {tr('quitter.confirmer')}
        </button>
      </div>

      {garde && (
        <Etiquette size={10} style={{ textAlign: 'center', letterSpacing: '0.08em' }}>
          {tr('quitter.garde')}
        </Etiquette>
      )}
    </div>
  )
}
