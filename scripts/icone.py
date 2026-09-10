#!/usr/bin/env python3
"""
Génère l'icône de Rempart : cinq briques, la troisième manquante.

Le mur et la brique sont l'objet emblématique de l'app — la même forme porte
l'icône, l'accueil et le jeu. Aucun dégradé, aucune ombre floue : un aplat, un
chant sombre, un trait de fracture.

Écrit le PNG à la main (zlib + struct) pour ne dépendre d'aucune bibliothèque
d'image : l'app doit se construire avec les seules dépendances npm du projet.
"""

import math
import struct
import sys
import zlib

# Les jetons de la direction « Établi », repris de src/theme.ts.
KRAFT = (0xE4, 0xD7, 0xB0)
CLAY = (0xC0, 0x56, 0x2F)
CLAY_EDGE = (0x8E, 0x3A, 0x1C)
OFF = (0xEF, 0xE2, 0xC8)
OFF_EDGE = (0xDC, 0xC9, 0xA6)
CRACK = (0xC6, 0xAF, 0x88)

SS = 3  # suréchantillonnage, puis moyenne : c'est tout l'anticrénelage


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


def dessiner(taille):
    n = taille * SS
    t = Toile(n, KRAFT)

    # Cinq briques centrées, aux proportions du logo (32 × 44).
    # La marge tient le mur dans la zone sûre d'une icône masquable (80 % du côté).
    marge = 0.11 * n
    largeur_utile = n - 2 * marge
    w = largeur_utile / 5.76
    ecart = 0.19 * w
    h = w / 0.727
    x0 = (n - (5 * w + 4 * ecart)) / 2
    y0 = (n - h) / 2
    rayon = w * 0.25
    chant = h * 0.136

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


if __name__ == "__main__":
    sortie = sys.argv[1] if len(sys.argv) > 1 else "public"
    for taille in (192, 512):
        n, rgb = dessiner(taille)
        chemin = f"{sortie}/icon-{taille}.png"
        ecrire_png(chemin, n, rgb)
        print(f"écrit {chemin} ({n}×{n})")
