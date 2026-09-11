#!/usr/bin/env python3
"""
Génère l'icône de Rempart : cinq briques, la troisième manquante.

Le mur et la brique sont l'objet emblématique de l'app — la même forme porte
l'icône, l'accueil et le jeu. Aucun dégradé, aucune ombre floue : un aplat, un
chant sombre, un trait de fracture.

Écrit le PNG à la main (zlib + struct) pour ne dépendre d'aucune bibliothèque
d'image : l'app doit se construire avec les seules dépendances npm du projet.

Sortent d'ici toutes les tailles que réclame une app installée : les deux icônes
du manifeste, une variante masquable plus en retrait, l'`apple-touch-icon` que
lit iOS, une favicone de 32 px et sa version vectorielle.
"""

import math
import struct
import sys
import zlib

# Les jetons de la direction « Établi », repris de src/theme.ts.
KRAFT = (0xE4, 0xD7, 0xBE)
CLAY = (0xC0, 0x56, 0x2F)
CLAY_EDGE = (0x8E, 0x3A, 0x1C)
OFF = (0xEF, 0xE2, 0xC8)
OFF_EDGE = (0xDC, 0xC9, 0xA6)
CRACK = (0xC6, 0xAF, 0x88)

SS = 3  # suréchantillonnage, puis moyenne : c'est tout l'anticrénelage

# Deux marges, parce que ce sont deux dessins et non deux usages du même.
# `MARGE` laisse le mur occuper toute la largeur : c'est l'icône affichée telle
# quelle — onglet, écran d'accueil iOS, systèmes qui ne rognent rien.
# `MARGE_MASQUABLE` la double, car un système qui applique son gabarit ne garde
# que le cercle inscrit à 80 % du côté : les deux briques des bouts, qui touchent
# ce cercle dans le dessin normal, en sortiraient rognées.
MARGE = 0.11
MARGE_MASQUABLE = 0.22


class Toile:
    def __init__(self, taille, fond):
        self.n = taille
        self.px = bytearray(fond * (taille * taille))

    def set(self, x, y, c):
        if 0 <= x < self.n and 0 <= y < self.n:
            i = (y * self.n + x) * 3
            self.px[i : i + 3] = bytes(c)

    def rect_arrondi(self, x, y, w, h, r, c):
        r = min(r, w / 2, h / 2)
        for yy in range(int(y), int(math.ceil(y + h))):
            for xx in range(int(x), int(math.ceil(x + w))):
                if self._dans(xx + 0.5, yy + 0.5, x, y, w, h, r):
                    self.set(xx, yy, c)

    @staticmethod
    def _dans(px, py, x, y, w, h, r):
        if not (x <= px <= x + w and y <= py <= y + h):
            return False
        cx = min(max(px, x + r), x + w - r)
        cy = min(max(py, y + r), y + h - r)
        return (px - cx) ** 2 + (py - cy) ** 2 <= r * r

    def barre(self, cx, cy, longueur, epaisseur, angle, c):
        """Une barre à bouts ronds, tournée — le trait de fracture."""
        ca, sa = math.cos(angle), math.sin(angle)
        demi_l, demi_e = longueur / 2, epaisseur / 2
        rayon = int(math.ceil(demi_l + demi_e)) + 1
        for yy in range(int(cy) - rayon, int(cy) + rayon + 1):
            for xx in range(int(cx) - rayon, int(cx) + rayon + 1):
                dx, dy = xx + 0.5 - cx, yy + 0.5 - cy
                u = dx * ca + dy * sa
                v = -dx * sa + dy * ca
                u = max(-demi_l + demi_e, min(demi_l - demi_e, u))
                if (dx * ca + dy * sa - u) ** 2 + v * v <= demi_e * demi_e:
                    self.set(xx, yy, c)

    def reduire(self, facteur):
        n = self.n // facteur
        out = bytearray(n * n * 3)
        f2 = facteur * facteur
        for y in range(n):
            for x in range(n):
                r = g = b = 0
                for dy in range(facteur):
                    row = (y * facteur + dy) * self.n
                    for dx in range(facteur):
                        i = (row + x * facteur + dx) * 3
                        r += self.px[i]
                        g += self.px[i + 1]
                        b += self.px[i + 2]
                o = (y * n + x) * 3
                out[o] = r // f2
                out[o + 1] = g // f2
                out[o + 2] = b // f2
        return n, out


def ecrire_png(chemin, n, rgb):
    brut = b"".join(b"\x00" + bytes(rgb[y * n * 3 : (y + 1) * n * 3]) for y in range(n))

    def bloc(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    with open(chemin, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(bloc(b"IHDR", struct.pack(">IIBBBBB", n, n, 8, 2, 0, 0, 0)))
        f.write(bloc(b"IDAT", zlib.compress(brut, 9)))
        f.write(bloc(b"IEND", b""))


def geometrie(n, marge_ratio):
    """Les cinq briques, en pixels, pour une toile de côté `n`."""
    largeur_utile = n - 2 * marge_ratio * n
    w = largeur_utile / 5.76
    ecart = 0.19 * w
    h = w / 0.727
    x0 = (n - (5 * w + 4 * ecart)) / 2
    y0 = (n - h) / 2
    return w, ecart, h, x0, y0, w * 0.25, h * 0.136


def dessiner(taille, marge_ratio=MARGE):
    n = taille * SS
    t = Toile(n, KRAFT)

    # Cinq briques centrées, aux proportions du logo (32 × 44).
    w, ecart, h, x0, y0, rayon, chant = geometrie(n, marge_ratio)
    for i in range(5):
        x = x0 + i * (w + ecart)
        manquante = i == 2
        fond = OFF if manquante else CLAY
        bord = OFF_EDGE if manquante else CLAY_EDGE
        # Le chant est dessiné d'abord, la face vient par-dessus : l'écart du
        # bas reste visible et donne l'épaisseur, sans aucune ombre portée.
        t.rect_arrondi(x, y0, w, h, rayon, bord)
        t.rect_arrondi(x, y0, w, h - chant, rayon, fond)
        if manquante:
            t.barre(x + w / 2, y0 + (h - chant) / 2, w * 0.44, h * 0.068, math.radians(-24), CRACK)

    return t.reduire(SS)


def dessiner_svg(marge_ratio=MARGE):
    """Le même mur, en vectoriel : c'est lui qui reste net sur un écran dense."""
    n = 512.0
    w, ecart, h, x0, y0, rayon, chant = geometrie(n, marge_ratio)

    def couleur(c):
        return "#%02X%02X%02X" % c

    def rect(x, y, largeur, hauteur, c):
        return (
            f'  <rect x="{x:.2f}" y="{y:.2f}" width="{largeur:.2f}" '
            f'height="{hauteur:.2f}" rx="{rayon:.2f}" fill="{couleur(c)}"/>'
        )

    lignes = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n:.0f} {n:.0f}" '
        'role="img" aria-label="Rempart">',
        f'  <rect width="{n:.0f}" height="{n:.0f}" fill="{couleur(KRAFT)}"/>',
    ]
    for i in range(5):
        x = x0 + i * (w + ecart)
        manquante = i == 2
        lignes.append(rect(x, y0, w, h, OFF_EDGE if manquante else CLAY_EDGE))
        lignes.append(rect(x, y0, w, h - chant, OFF if manquante else CLAY))
        if manquante:
            # Même capsule que `barre` : un segment à bouts ronds, donc des
            # extrémités en retrait d'une demi-épaisseur.
            cx, cy = x + w / 2, y0 + (h - chant) / 2
            epaisseur = h * 0.068
            demi = (w * 0.44 - epaisseur) / 2
            ca, sa = math.cos(math.radians(-24)), math.sin(math.radians(-24))
            lignes.append(
                f'  <line x1="{cx - demi * ca:.2f}" y1="{cy - demi * sa:.2f}" '
                f'x2="{cx + demi * ca:.2f}" y2="{cy + demi * sa:.2f}" '
                f'stroke="{couleur(CRACK)}" stroke-width="{epaisseur:.2f}" '
                'stroke-linecap="round"/>'
            )
    lignes.append("</svg>")
    return "\n".join(lignes) + "\n"


# Ce que le navigateur va chercher, et sous quel nom.
#
# `apple-touch-icon.png` n'est pas un doublon de `icon-192.png` : iOS ne lit pas
# les icônes du manifeste au moment d'ajouter à l'écran d'accueil, il lit ce
# fichier-là. Sans lui, l'app installée n'a pas de logo — elle reçoit une
# capture de la page.
SORTIES = [
    ("icon-192.png", 192, MARGE),
    ("icon-512.png", 512, MARGE),
    ("icon-maskable-512.png", 512, MARGE_MASQUABLE),
    ("apple-touch-icon.png", 180, MARGE),
    ("icon-32.png", 32, MARGE),
]


if __name__ == "__main__":
    sortie = sys.argv[1] if len(sys.argv) > 1 else "public"

    for nom, taille, marge in SORTIES:
        n, rgb = dessiner(taille, marge)
        chemin = f"{sortie}/{nom}"
        ecrire_png(chemin, n, rgb)
        print(f"écrit {chemin} ({n}×{n})")

    chemin = f"{sortie}/icon.svg"
    with open(chemin, "w", encoding="utf-8") as f:
        f.write(dessiner_svg())
    print(f"écrit {chemin}")
