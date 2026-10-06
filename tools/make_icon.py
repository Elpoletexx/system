"""Renders the 1024x1024 App Store icon: python3 tools/make_icon.py"""
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

SIZE = 1024
SCALE = 2  # supersample for smooth edges
S = SIZE * SCALE
OUT = Path(__file__).resolve().parent.parent / "App/Assets.xcassets/AppIcon.appiconset/AppIcon.png"

TOP = (10, 15, 38)
BOTTOM = (28, 18, 71)
RING = (92, 225, 230)
OBSTACLE = (255, 77, 109)
GEM = (255, 209, 102)


def point(radius, angle):
    a = angle - math.pi / 2
    return S / 2 + radius * math.cos(a), S / 2 + radius * math.sin(a)


def arc(draw, radius, start, end, color, width):
    # Dense overlapping discs give a seamless round-capped stroke.
    steps = 200
    r = width / 2
    for i in range(steps + 1):
        x, y = point(radius, start + (end - start) * i / steps)
        draw.ellipse([x - r, y - r, x + r, y + r], fill=color)


def main():
    img = Image.new("RGB", (S, S))
    draw = ImageDraw.Draw(img)
    for y in range(S):
        t = y / (S - 1)
        draw.line([(0, y), (S, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOTTOM)))

    inner, outer = S * 0.24, S * 0.38
    for r in (inner, outer):
        draw.ellipse([S / 2 - r, S / 2 - r, S / 2 + r, S / 2 + r], outline=tuple(int(c * 0.6) for c in RING), width=int(S * 0.012))

    arc(draw, outer, 1.9, 2.6, OBSTACLE, int(S * 0.05))
    arc(draw, inner, 3.6, 4.2, OBSTACLE, int(S * 0.05))

    gx, gy = point(inner, 0.9)
    g = S * 0.035
    draw.polygon([(gx, gy - g), (gx + g, gy), (gx, gy + g), (gx - g, gy)], fill=GEM)

    # Glowing player on the outer ring with a short trail.
    angle = 0.15
    glow = Image.new("RGB", (S, S), (0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    px, py = point(outer, angle)
    gr = S * 0.075
    gdraw.ellipse([px - gr, py - gr, px + gr, py + gr], fill=RING)
    glow = glow.filter(ImageFilter.GaussianBlur(S * 0.03))
    img = Image.composite(glow, img, glow.convert("L").point(lambda v: min(255, int(v * 0.9))))
    draw = ImageDraw.Draw(img)

    for i in range(1, 10):
        tx, ty = point(outer, angle - i * 0.06)
        r = S * 0.04 * (1 - i / 11)
        shade = tuple(round(c * (1 - i / 11) + b * (i / 11)) for c, b in zip(RING, TOP))
        draw.ellipse([tx - r, ty - r, tx + r, ty + r], fill=shade)

    pr = S * 0.045
    draw.ellipse([px - pr, py - pr, px + pr, py + pr], fill=(255, 255, 255))

    img = img.resize((SIZE, SIZE), Image.LANCZOS)
    img.save(OUT)  # RGB, no alpha: required by App Store Connect
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
