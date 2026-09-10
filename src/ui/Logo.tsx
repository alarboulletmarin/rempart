import { useTheme } from './theme'

/**
 * La marque : cinq briques, la troisième manquante.
 *
 * Le mur et la brique sont l'objet emblématique de l'app — la même forme
 * porte l'icône, l'accueil et le jeu, de 24 px au plein écran.
 */
export function Logo({
  brique = 32,
  hauteur = 44,
  gap = 6,
  radius = 8,
  chant = 6,
}: {
  brique?: number
  hauteur?: number
  gap?: number
  radius?: number
  chant?: number
}) {
  const t = useTheme()
  return (
    <div style={{ display: 'flex', gap, alignItems: 'flex-end' }} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const manquante = i === 2
        return (
          <div
            key={i}
            style={{
              width: brique,
              height: hauteur,
              borderRadius: radius,
              background: manquante ? t.off : t.clay,
              boxShadow: `inset 0 -${chant}px 0 ${manquante ? t.offEdge : t.clayEdge}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {manquante && (
              <div
                style={{
                  width: Math.round(brique * 0.44),
                  height: 3,
                  borderRadius: 2,
                  background: t.crack,
                  transform: 'rotate(-24deg)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Le mur en miniature, pour « ta dernière partie » et le palmarès. */
export function MurMiniature({
  briques,
  largeur = 96,
  hauteur = 26,
  ci = 0,
}: {
  briques: number
  largeur?: number
  hauteur?: number
  ci?: number
}) {
  const t = useTheme()
  return (
    <div
      style={{ display: 'flex', gap: 4, width: largeur, flex: `0 0 ${largeur}px`, height: hauteur }}
      aria-hidden="true"
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const debout = i < briques
        return (
          <div
            key={i}
            style={{
              flex: 1,
              borderRadius: 6,
              background: debout ? t.pc[ci as 0] : t.off,
              boxShadow: `inset 0 -4px 0 ${debout ? t.pe[ci as 0] : t.offEdge}`,
            }}
          />
        )
      })}
    </div>
  )
}
