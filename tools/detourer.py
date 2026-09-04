"""detourer.py — retire le damier de transparence d'un JPEG.

    python3 tools/detourer.py "images/laurier.jpg" assets/ui/laurier.png 192x192

⚠️ Ce script ne fait PAS partie de l'application : il ne tourne ni au
lancement ni à la construction, et rien dans `src/` ne l'importe. Il sert une
fois, à la main, quand une image de travail entre dans `assets/ui/`. Il
demande Pillow (`pip install pillow`), qui n'est donc pas une dépendance du
jeu.

Le damier des images de `images/` n'est pas une transparence : c'est un motif
OPAQUE, aplati dans le JPEG par l'outil qui les a produites. Posé tel quel sur
le parchemin du menu, il donnerait un rectangle gris autour de chaque icône.
On le reconnaît donc à ce qu'il est — une grille de carreaux clairs et gris
qui alternent — puis on le remplace par un vrai canal alpha.

⚠️ Il ne suffit PAS de partir des bords. Une zone de damier enfermée par le
sujet (l'œil d'un casque, le col d'une amphore) n'est reliée à aucun bord :
elle resterait blanche. D'où le second repérage, par alternance locale.
"""
import sys
from collections import deque
from statistics import median
from PIL import Image, ImageFilter

WHITE = (255, 255, 255)
GRAY = (204, 204, 204)
TOL = 26  # artefacts de compression autour des carreaux


def near(px, ref, tol=TOL):
    return all(abs(px[i] - ref[i]) <= tol for i in range(3))


def neutral(px):
    """Un pixel du damier n'a aucune teinte : gris pur ou blanc pur."""
    return max(px[:3]) - min(px[:3]) <= 14 and (near(px, WHITE) or near(px, GRAY))


def period(px, length, at):
    """Le pas de la grille, lu sur une bande de bord (elle est toujours du damier)."""
    edges = [i for i in range(1, length) if abs(at(i)[0] - at(i - 1)[0]) > 20]
    gaps = [b - a for a, b in zip(edges, edges[1:]) if b - a > 5]
    return (median(gaps) if gaps else 0.0), (edges[0] if edges else 0)


def run(src, dst, box=None):
    im = Image.open(src).convert('RGB')
    w, h = im.size
    px = im.load()

    pw, ox = period(px, min(w, 400), lambda i: px[i, 2])
    ph, oy = period(px, min(h, 400), lambda i: px[2, i])
    seeds = deque()
    bg = bytearray(w * h)

    def push(x, y):
        if not bg[y * w + x] and neutral(px[x, y]):
            bg[y * w + x] = 1
            seeds.append((x, y))

    # Les bords : le damier y affleure toujours.
    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)

    # Les carreaux enfermes par le sujet — l'oeil d'un casque, le col d'une
    # amphore. Aucun bord n'y mene, alors on les reconnait a l'ALTERNANCE :
    # un pixel clair du damier a toujours un pixel gris a moins d'un carreau,
    # ce qu'un aplat blanc du sujet ne sait pas produire. La mesure est
    # LOCALE, donc insensible a la derive d'une grille au pas fractionnaire.
    reach = int(max(pw, ph, 4)) | 1
    tones = {}
    for ref in (WHITE, GRAY):
        m = Image.new('L', (w, h))
        # `tobytes()` plutôt que `getdata()` : trois octets par pixel, une
        # API stable, et pas d'objet Python créé par pixel.
        raw = im.tobytes()
        m.putdata([255 if neutral(raw[i:i + 3]) and near(raw[i:i + 3], ref) else 0
                   for i in range(0, len(raw), 3)])
        tones[ref] = m
    spread = {ref: m.filter(ImageFilter.MaxFilter(reach)) for ref, m in tones.items()}
    for ref, other in ((WHITE, GRAY), (GRAY, WHITE)):
        mine, near_other = tones[ref].load(), spread[other].load()
        for y in range(h):
            for x in range(w):
                if mine[x, y] and near_other[x, y]:
                    push(x, y)

    # L'inondation part de tous ces reperes et suit le damier jusqu'au sujet.
    while seeds:
        x, y = seeds.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                push(nx, ny)

    alpha = Image.frombytes('L', (w, h), bytes(0 if b else 255 for b in bg))
    # On ronge un pixel : le damier deteint sur le contour a la compression.
    alpha = alpha.filter(ImageFilter.MinFilter(3))
    # Puis on adoucit, pour un bord qui ne crenele pas une fois reduit.
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.8))

    out = im.convert('RGBA')
    out.putalpha(alpha)
    bbox = alpha.point(lambda v: 255 if v > 8 else 0).getbbox()
    if bbox:
        out = out.crop(bbox)
    if box:
        out.thumbnail(box, Image.LANCZOS)
    out.save(dst, 'PNG', optimize=True)
    print(f'{dst}  {out.size[0]}x{out.size[1]}  pas={pw:.1f}x{ph:.1f}')


if __name__ == '__main__':
    a = sys.argv
    run(a[1], a[2], tuple(int(v) for v in a[3].split('x')) if len(a) > 3 else None)
