"""detourer.py — retire le damier de transparence d'un JPEG.

    python3 tools/detourer.py "images/vague.jpg" assets/ui/vague.png 256x256

Une image dont le fond est en partie RECOUVERT d'un dessin (un halo, un trait
de lumiere) se recadre en plus sur son cercle, faute de damier a reconnaitre
dessous :

    python3 tools/detourer.py "images/desert.jpg" assets/ui/desert.png 256x256 \
        --cercle 512,575,444

Une MAQUETTE de carte entiere, elle, ne se detoure pas : on y preleve la seule
illustration, en laissant dehors les titres et les chiffres qui y sont ecrits
et que l'application, elle, calcule :

    python3 tools/detourer.py "images/arene en ligne.jpg" assets/ui/arene.png \
        800x800 --recadre 108,116,918,348

⚠️ Ce script ne fait PAS partie de l'application : il ne tourne ni au
lancement ni à la construction, et rien dans `src/` ne l'importe. Il sert une
fois, à la main, quand une image de travail entre dans `assets/ui/`. Il demande
Pillow et NumPy (`pip install pillow numpy`), qui ne sont donc pas des
dépendances du jeu.

Le damier des images de `images/` n'est pas une transparence : c'est un motif
OPAQUE, aplati dans le JPEG par l'outil qui les a produites. Posé tel quel sur
le parchemin du menu, il donnerait un rectangle gris autour de chaque icône. On
le reconnaît donc à ce qu'il est — deux tons qui alternent case après case —
puis on le remplace par un vrai canal alpha.

Trois pièges, et ce sont eux qui font la longueur du fichier :

1. **Les deux tons changent d'un fichier à l'autre** : blanc et gris clair pour
   la pièce d'or, presque noir et gris moyen pour les médaillons de quartier.
   Écrits en dur, ils ne détouraient qu'une moitié du dossier.
2. **Ils changent aussi À L'INTÉRIEUR d'un fichier.** Le halo doré de
   `desert.jpg` déborde sur le damier et le teinte : les carreaux y alternent
   toujours, mais autour d'autres valeurs. D'où une lecture par BLOCS, chacun
   avec sa propre paire de tons, plutôt qu'une paire pour toute l'image.
3. **Il ne suffit pas de partir des bords.** Une zone enfermée par le sujet —
   l'œil d'un casque, le col d'une amphore — n'est reliée à aucun bord et
   resterait opaque. D'où une seconde famille d'amorces, par alternance locale.

Le tout est prudent par construction : on ne retire un pixel que s'il est
RELIÉ au damier déjà reconnu. Un aplat du sujet qui ressemble à un carreau
survit tant qu'aucun chemin de damier ne mène jusqu'à lui.
"""
import sys
from collections import deque
from statistics import median

import numpy as np
from PIL import Image, ImageFilter

#: Au-delà, le pixel est teinté : hors halo, ce n'est pas du damier.
SPREAD = 14
#: L'écart minimal entre les deux tons pour qu'ils soient deux carreaux.
GAP = 20


def period(px, length, at):
    """Le pas de la grille, lu sur une bande de bord — elle est toujours du damier."""
    edges = [i for i in range(1, length) if abs(at(i)[0] - at(i - 1)[0]) > GAP]
    gaps = [b - a for a, b in zip(edges, edges[1:]) if b - a > 5]
    return median(gaps) if gaps else 0.0


def border_tones(rgb):
    """Les deux tons du damier, lus sur une bande de bord.

    Ils servent de repli partout où l'analyse par blocs ne tranche pas, et à
    reconnaître les zones enfermées par le sujet, qu'aucun halo n'atteint.
    """
    band = np.concatenate([rgb[:3].reshape(-1, 3), rgb[-3:].reshape(-1, 3)])
    flat = band[np.ptp(band, axis=1) <= SPREAD][:, 0]
    if flat.size == 0:
        raise SystemExit('aucun gris sur les bords : est-ce bien un damier ?')
    counts = np.bincount(flat, minlength=256)
    first = int(counts.argmax())
    counts[max(0, first - GAP):first + GAP + 1] = 0
    second = int(counts.argmax())
    if counts[second] == 0:
        raise SystemExit(f'un seul ton ({first}) : image déjà détourée ?')
    # La tolérance ne mord jamais sur l'autre carreau : sinon les deux se
    # confondent, et l'alternance ne veut plus rien dire.
    return (first, second), min(26, abs(first - second) // 2 - 2)


def checkered_blocks(rgb, lum, cell, tol):
    """Les pixels appartenant à un bloc RÉELLEMENT damé, ton par ton local.

    Un bloc compte comme damier s'il n'a que deux niveaux, et surtout si le
    motif S'INVERSE quand on le décale d'une case : c'est cela, un damier, et
    c'est ce qu'un aplat du sujet ne sait pas imiter. La paire de tons est
    propre au bloc, donc un halo qui décale les deux ne gêne pas.
    """
    h, w = lum.shape
    mark = np.zeros((h, w), dtype=bool)
    size, step = cell * 3, cell
    for y in range(0, h, step):
        for x in range(0, w, step):
            tile = lum[y:y + size, x:x + size]
            if tile.shape[0] < cell * 2 or tile.shape[1] < cell * 2:
                continue
            low, high = int(tile.min()), int(tile.max())
            if high - low < GAP:
                continue
            mid = (low + high) // 2
            face = tile > mid
            # Deux niveaux seulement, et à peu près autant de l'un que de l'autre.
            share = face.mean()
            if not 0.3 < share < 0.7:
                continue
            pale = tile[face]
            dark = tile[~face]
            if pale.std() > 12 or dark.std() > 12:
                continue
            # LE test : décalé d'une case, le motif s'inverse.
            flip_x = (face[:, cell:] != face[:, :-cell]).mean()
            flip_y = (face[cell:] != face[:-cell]).mean()
            if flip_x < 0.8 or flip_y < 0.8:
                continue
            # On compare les COULEURS, pas seulement les niveaux : le cadre
            # brun d'un médaillon a la luminosité d'un carreau sombre, et
            # serait grignoté case par case si on s'en tenait au gris.
            patch = rgb[y:y + size, x:x + size].astype(int)
            near = np.zeros(tile.shape, dtype=bool)
            for face_of in (face, ~face):
                tone = patch[face_of].mean(axis=0)
                near |= np.abs(patch - tone).max(axis=2) <= tol
            mark[y:y + size, x:x + size] |= near
    return mark


def keep_solid(alpha, floor=0.01):
    """Jette les poussières : les taches trop petites pour être le sujet.

    Un unique pixel rescapé à l'autre bout de l'image ne se voit pas, mais il
    étend le recadrage, et l'icône arrive dans l'app entourée de vide.
    """
    solid = np.asarray(alpha) > 8
    h, w = solid.shape
    label = np.zeros((h, w), dtype=np.int32)
    sizes = [0]
    for y0, x0 in np.argwhere(solid):
        if label[y0, x0]:
            continue
        sizes.append(0)
        queue = deque([(int(y0), int(x0))])
        label[y0, x0] = len(sizes) - 1
        while queue:
            y, x = queue.popleft()
            sizes[-1] += 1
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < h and 0 <= nx < w and solid[ny, nx] and not label[ny, nx]:
                    label[ny, nx] = len(sizes) - 1
                    queue.append((ny, nx))
    if len(sizes) <= 2:
        return alpha
    biggest = max(sizes)
    small = np.isin(label, [i for i, n in enumerate(sizes) if 0 < n < biggest * floor])
    return Image.fromarray(np.where(small, 0, np.asarray(alpha)).astype(np.uint8))


def enclosed_seeds(lum, flat, tones, cell, tol):
    """Les amorces DANS le sujet : l'œil d'un casque, le col d'une amphore.

    Aucun bord n'y mène. On les reconnaît à l'alternance : un carreau clair a
    toujours un carreau sombre à une case de là, ce qu'un aplat du sujet ne
    produit pas. La mesure est locale, donc insensible à la dérive d'une
    grille au pas fractionnaire.
    """
    reach = max(int(cell), 4) | 1
    seeds = np.zeros(lum.shape, dtype=bool)
    faces = [flat & (np.abs(lum.astype(int) - t) <= tol) for t in tones]
    spread = [
        np.array(Image.fromarray(f.astype(np.uint8) * 255)
                 .filter(ImageFilter.MaxFilter(reach))) > 0
        for f in faces
    ]
    seeds |= faces[0] & spread[1]
    seeds |= faces[1] & spread[0]
    return seeds


def clip_circle(alpha, spec):
    """Ne garde que l'intérieur d'un cercle donné — `cx,cy,r` en pixels source.

    ⚠️ C'est une DÉCOUPE, pas une détection, et elle existe pour un cas
    précis : `desert.jpg` porte un halo doré et un trait de lumière DESSINÉS
    par-dessus le damier. Là, il n'y a plus de damier à reconnaître — les
    carreaux n'y alternent plus, le dessin les a recouverts — donc aucune
    analyse ne peut les retirer. On coupe au cadre du médaillon.

    Le halo n'y perd rien d'utile : c'est l'état « chapitre en cours », et
    l'application le calcule elle-même à partir du niveau du joueur (voir
    `PlayTab.tsx`). Cuit dans l'image, il mentirait un chapitre sur deux.
    """
    cx, cy, r = (int(v) for v in spec.split(','))
    w, h = alpha.size
    y, x = np.ogrid[:h, :w]
    inside = (x - cx) ** 2 + (y - cy) ** 2 <= r * r
    return Image.fromarray((np.asarray(alpha) * inside).astype(np.uint8))


def run(src, dst, box=None, circle=None, crop=None):
    im = Image.open(src).convert('RGB')

    if crop is not None:
        # Une MAQUETTE, pas une icône : on en prélève l'illustration, et il
        # n'y a rien à détourer — le damier n'est qu'autour de la carte, pas
        # dans le tableau qu'on découpe. On sort donc tout de suite, opaque.
        left, top, right, bottom = (int(v) for v in crop.split(','))
        out = im.crop((left, top, right, bottom))
        if box:
            out.thumbnail(box, Image.LANCZOS)
        out.save(dst, 'PNG', optimize=True)
        print(f'{dst}  {out.size[0]}x{out.size[1]}  recadré, sans détourage')
        return

    rgb = np.asarray(im)
    lum = np.asarray(im.convert('L'))
    h, w = lum.shape

    tones, tol = border_tones(rgb)
    px = im.load()
    cell = max(4, round(max(period(px, min(w, 400), lambda i: px[i, 2]),
                            period(px, min(h, 400), lambda i: px[2, i]))))

    #: Neutre : sans teinte. Vrai du damier nu, faux sous le halo doré.
    flat = np.ptp(rgb, axis=2) <= SPREAD
    plain = flat & ((np.abs(lum.astype(int) - tones[0]) <= tol)
                    | (np.abs(lum.astype(int) - tones[1]) <= tol))

    # Le terrain que l'inondation a le droit de traverser : le damier nu, plus
    # tout bloc reconnu comme damé avec ses propres tons (donc le halo).
    passable = plain | checkered_blocks(rgb, lum, cell, tol)

    seeds = deque()
    seen = np.zeros((h, w), dtype=bool)

    def push(x, y):
        if not seen[y, x] and passable[y, x]:
            seen[y, x] = True
            seeds.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)
    for y, x in np.argwhere(enclosed_seeds(lum, flat, tones, cell, tol)):
        push(int(x), int(y))

    while seeds:
        x, y = seeds.popleft()
        if x + 1 < w:
            push(x + 1, y)
        if x:
            push(x - 1, y)
        if y + 1 < h:
            push(x, y + 1)
        if y:
            push(x, y - 1)

    alpha = Image.fromarray(np.where(seen, 0, 255).astype(np.uint8))
    # On ronge un pixel : le damier déteint sur le contour à la compression.
    alpha = alpha.filter(ImageFilter.MinFilter(3))
    # Puis on adoucit, pour un bord qui ne crénèle pas une fois réduit.
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.8))
    if circle:
        alpha = clip_circle(alpha, circle)
    alpha = keep_solid(alpha)

    out = im.convert('RGBA')
    out.putalpha(alpha)
    solid = alpha.point(lambda v: 255 if v > 8 else 0)
    bbox = solid.getbbox()
    if bbox:
        out = out.crop(bbox)
    if box:
        out.thumbnail(box, Image.LANCZOS)
    out.save(dst, 'PNG', optimize=True)
    print(f'{dst}  {out.size[0]}x{out.size[1]}  '
          f'tons {tones[1]}/{tones[0]} ±{tol} au pas {cell}')


if __name__ == '__main__':
    a = sys.argv[1:]
    circle = crop = None
    if '--cercle' in a:
        i = a.index('--cercle')
        circle = a[i + 1]
        a = a[:i] + a[i + 2:]
    if '--recadre' in a:
        i = a.index('--recadre')
        crop = a[i + 1]
        a = a[:i] + a[i + 2:]
    size = tuple(int(v) for v in a[2].split('x')) if len(a) > 2 else None
    run(a[0], a[1], size, circle, crop)
