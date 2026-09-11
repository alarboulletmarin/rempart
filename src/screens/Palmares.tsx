import { useState } from 'react'
import { TEXTE, TITRE } from '../theme'
import { CARD_LABEL } from '../game/types'
import {
  classement,
  dateEtFormat,
  effacer,
  lire,
  repartitionCartes,
  totaux,
  type Palmares as PalmaresData,
} from '../store/palmares'
import { Bouton, Etiquette, Panneau, Pastille, Texte } from '../ui/atoms'
import { Pictogramme } from '../ui/Pictogramme'
import { Corps, Ecran, EnTete } from '../ui/shell'
import { useTheme } from '../ui/theme'

/**
 * 11 bis · Palmarès.
 *
 * Sans compte ni serveur, le palmarès est forcément local : les stats d'un même
 * joueur ne suivent pas d'un téléphone à l'autre, et les noms sont ceux saisis
 * dans les salons. C'est écrit en bas d'écran, pas caché dans des réglages.
 */
export function Palmares({ onRetour }: { onRetour: () => void }) {
  const t = useTheme()
  const [data, setData] = useState<PalmaresData>(() => lire())
  const [confirme, setConfirme] = useState(false)

  const joueurs = classement(data)
  const cartes = repartitionCartes(data)
  const tot = totaux(data)
  const parties = data.parties.slice(0, 3)
  const vide = data.parties.length === 0

  return (
    <Ecran>
      <EnTete
        titre="Palmarès"
        onRetour={onRetour}
        hauteur={102}
        droite={
          <span style={{ font: `500 11px/1 ${TEXTE}`, color: t.ink2 }}>sur cet appareil</span>
        }
      />
      <Corps pad={18} gap={14} scroll>
        {vide ? (
          <Panneau radius={16} pad={16} gap={8}>
            <div style={{ font: `700 19px/1.15 ${TITRE}`, color: t.ink }}>
              Aucune partie jouée pour l’instant.
            </div>
            <Texte size={14}>
              Le palmarès se remplit tout seul : parties, victoires, briques sauvées et cartes que tu
              joues le plus.
            </Texte>
          </Panneau>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 10 }}>
              <Compteur valeur={tot.parties} libelle="parties" />
              <Compteur valeur={tot.victoires} libelle="victoires" />
              <Compteur valeur={tot.briques} libelle="briques sauvées" />
            </div>

            {joueurs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Etiquette>Victoires</Etiquette>
                {joueurs.map((j, i) => (
                  <Panneau key={j.nom} radius={16} pad="11px 13px" gap={8}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ font: `700 16px/1 ${TITRE}`, color: t.ink }}>{j.nom}</span>
                      <span
                        style={{ font: `500 11px/1 ${TEXTE}`, color: t.ink2, marginLeft: 'auto' }}
                      >
                        {j.line}
                      </span>
                    </div>
                    <Barre largeur={j.w} couleur={t.pc[(i % 4) as 0]} />
                  </Panneau>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Etiquette>Cartes que tu joues le plus</Etiquette>
              <Panneau radius={16} pad={13} gap={10}>
                {cartes.map((c) => (
                  <div key={c.k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Pictogramme card={c.k} size={20} color={t.ink2} />
                    <span style={{ font: `600 13px/1 ${TEXTE}`, color: t.ink, width: 66 }}>
                      {CARD_LABEL[c.k]}
                    </span>
                    <div style={{ flex: 1 }}>
                      <Barre largeur={c.w} couleur={t.wood} />
                    </div>
                    <span
                      style={{
                        font: `600 12px/1 ${TEXTE}`,
                        color: t.ink2,
                        width: 38,
                        textAlign: 'right',
                      }}
                    >
                      {c.pct}
                    </span>
                  </div>
                ))}
              </Panneau>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Etiquette>Dernières parties</Etiquette>
              {parties.map((p, i) => (
                <Panneau
                  key={`${p.at}-${i}`}
                  radius={16}
                  pad="11px 13px"
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                >
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}
                  >
                    <span style={{ font: `600 13px/1 ${TEXTE}`, color: t.ink }}>
                      {p.gagnant} · {p.mesBriques} brique{p.mesBriques > 1 ? 's' : ''}
                    </span>
                    <span style={{ font: `500 11px/1.3 ${TEXTE}`, color: t.ink2 }}>
                      {dateEtFormat(p)}
                    </span>
                  </div>
                  <Pastille
                    bg={p.gagnee ? t.green : t.panel2}
                    fg={p.gagnee ? '#FCF7EC' : t.ink2}
                    style={{ letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 10px' }}
                  >
                    {p.gagnee ? 'gagnée' : 'perdue'}
                  </Pastille>
                </Panneau>
              ))}
            </div>

            {confirme ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <Bouton
                  height={50}
                  size={14}
                  onClick={() => {
                    effacer()
                    setData(lire())
                    setConfirme(false)
                  }}
                >
                  Tout effacer, vraiment
                </Bouton>
                <Bouton ton="creux" height={50} size={14} onClick={() => setConfirme(false)}>
                  Annuler
                </Bouton>
              </div>
            ) : (
              <Bouton ton="creux" height={50} size={14} onClick={() => setConfirme(true)}>
                Effacer le palmarès
              </Bouton>
            )}
          </>
        )}

        <Texte size={12} style={{ textAlign: 'center', marginTop: 'auto', lineHeight: 1.5 }}>
          Tout est gardé sur l’appareil. Aucun compte, aucun envoi.
        </Texte>
      </Corps>
    </Ecran>
  )
}

function Compteur({ valeur, libelle }: { valeur: number; libelle: string }) {
  const t = useTheme()
  return (
    <Panneau radius={16} pad="12px 13px" gap={4} style={{ flex: 1, minWidth: 0 }}>
      <span style={{ font: `700 26px/1 ${TITRE}`, color: t.ink }}>{valeur}</span>
      <Etiquette size={9} style={{ letterSpacing: '0.08em' }}>
        {libelle}
      </Etiquette>
    </Panneau>
  )
}

function Barre({ largeur, couleur }: { largeur: string; couleur: string }) {
  const t = useTheme()
  return (
    <div
      style={{ height: 9, borderRadius: 5, background: t.off, overflow: 'hidden', display: 'flex' }}
      aria-hidden="true"
    >
      <div style={{ width: largeur, background: couleur }} />
    </div>
  )
}
