import { useState } from 'react'
import { TEXTE, TITRE } from '../theme'
import { ALPHABET_CODE, LONGUEUR_CODE, codeValide } from '../net/room'
import { useT } from '../i18n'
import { Bouton, Etiquette, Panneau, Texte } from '../ui/atoms'
import { Corps, Ecran, EnTete } from '../ui/shell'
import { useTheme } from '../ui/theme'

/**
 * Rejoindre avec un code.
 *
 * Le code est saisi dans des cases pleines : même matière que les briques, et
 * on voit d'un coup d'œil combien il en manque. Deux rangées de quatre plutôt
 * qu'une de huit — c'est ainsi qu'on le dicte au téléphone, et huit cases sur
 * 350 px seraient illisibles.
 */
export function Rejoindre({
  nom: nomInitial,
  onNom,
  onRejoindre,
  onRetour,
  erreur,
}: {
  nom: string
  onNom: (n: string) => void
  onRejoindre: (code: string, nom: string) => void
  onRetour: () => void
  erreur?: string
}) {
  const t = useTheme()
  const tr = useT()
  const [code, setCode] = useState('')
  const [nom, setNom] = useState(nomInitial)
  const pret = codeValide(code)

  const majNom = (v: string) => {
    setNom(v)
    onNom(v)
  }

  return (
    <Ecran>
      <EnTete titre={tr('rejoindre.titre')} onRetour={onRetour} hauteur={102} />
      <Corps pad={20} gap={20} scroll>
        <Texte size={15} style={{ lineHeight: 1.5 }}>
          {tr('rejoindre.aide', { n: LONGUEUR_CODE })}
        </Texte>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Etiquette>{tr('rejoindre.code.titre')}</Etiquette>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} aria-hidden="true">
              {[0, 1].map((rangee) => (
                <div key={rangee} style={{ display: 'flex', gap: 8 }}>
                  {[0, 1, 2, 3].map((colonne) => {
                    const i = rangee * 4 + colonne
                    return (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 62,
                          borderRadius: 12,
                          background: code[i] ? t.panel : t.cardOff,
                          boxShadow: code[i] ? `0 4px 0 ${t.edge}` : undefined,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          font: `700 28px/1 ${TITRE}`,
                          color: t.ink,
                        }}
                      >
                        {code[i] ?? ''}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            <input
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value
                    .toUpperCase()
                    .split('')
                    .filter((c) => ALPHABET_CODE.includes(c))
                    .slice(0, LONGUEUR_CODE)
                    .join(''),
                )
              }
              inputMode="text"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              aria-label={tr('rejoindre.code.aria', { n: LONGUEUR_CODE })}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                border: 'none',
                font: `700 28px/1 ${TITRE}`,
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Etiquette>{tr('creation.nom.titre')}</Etiquette>
          <input
            value={nom}
            onChange={(e) => majNom(e.target.value)}
            maxLength={14}
            placeholder={tr('rejoindre.nom.exemple')}
            aria-label={tr('creation.nom.aria')}
            style={{
              height: 60,
              borderRadius: 16,
              background: t.panel,
              boxShadow: `0 3px 0 ${t.edge}`,
              border: 'none',
              padding: '0 16px',
              font: `700 19px/1 ${TITRE}`,
              color: t.ink,
              width: '100%',
            }}
          />
        </div>

        {erreur && (
          <Panneau bg={t.clayText} edge={t.clayTextEdge} radius={16} pad="14px 16px">
            <span style={{ font: `600 14px/1.45 ${TEXTE}`, color: t.panel, textWrap: 'pretty' }}>
              {erreur}
            </span>
          </Panneau>
        )}

        <Bouton
          onClick={() => pret && onRejoindre(code, nom)}
          disabled={!pret}
          style={{ marginTop: 'auto' }}
        >
          {tr('rejoindre.bouton')}
        </Bouton>
        <Texte size={11} style={{ textAlign: 'center', lineHeight: 1.5 }}>
          {tr('rejoindre.pied')}
        </Texte>
      </Corps>
    </Ecran>
  )
}
