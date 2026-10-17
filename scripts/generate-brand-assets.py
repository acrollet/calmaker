"""Regenerate the checked-in icons and link artwork with Python + Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
GREEN = "#425b43"
CREAM = "#faf8f0"
GOLD = "#d4af65"

SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="15" fill="#425b43"/>
  <rect x="12" y="15" width="40" height="39" rx="5" fill="#faf8f0"/>
  <path d="M12 28h40" stroke="#425b43" stroke-width="3"/>
  <path d="M23 11v10m18-10v10" stroke="#faf8f0" stroke-width="4" stroke-linecap="round"/>
  <g fill="#425b43">
    <rect x="20" y="34" width="6" height="6" rx="1.5"/>
    <rect x="29" y="34" width="6" height="6" rx="1.5"/>
    <rect x="38" y="34" width="6" height="6" rx="1.5"/>
    <rect x="20" y="43" width="6" height="6" rx="1.5"/>
    <rect x="29" y="43" width="6" height="6" rx="1.5"/>
  </g>
  <rect x="38" y="43" width="6" height="6" rx="1.5" fill="#d4af65"/>
</svg>
'''


def icon(size):
    scale = size * 4 / 64
    im = Image.new("RGBA", (size * 4, size * 4))
    d = ImageDraw.Draw(im)

    def rect(box, radius, fill):
        d.rounded_rectangle(tuple(round(v * scale) for v in box), radius=round(radius * scale), fill=fill)

    rect((0, 0, 64, 64), 15, GREEN)
    rect((12, 15, 52, 54), 5, CREAM)
    d.line((12 * scale, 28 * scale, 52 * scale, 28 * scale), fill=GREEN, width=round(3 * scale))
    for x in [23, 41]:
        rect((x - 2, 9, x + 2, 23), 2, CREAM)
    for y in [34, 43]:
        for x in [20, 29, 38]:
            rect((x, y, x + 6, y + 6), 1.5, GOLD if (x, y) == (38, 43) else GREEN)
    return im.resize((size, size), Image.Resampling.LANCZOS)


ASSETS.mkdir(exist_ok=True)
(ASSETS / "favicon.svg").write_text(SVG)
for size, name in [(32, "favicon-32.png"), (180, "apple-touch-icon.png"), (512, "icon-512.png")]:
    image = icon(size)
    if size == 180:
        # Apple applies its own corner mask to home-screen icons.
        background = Image.new("RGBA", image.size, GREEN)
        background.alpha_composite(image)
        image = background.convert("RGB")
    image.save(ASSETS / name, optimize=True)
icon(256).save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

# Keep the sharing image graphical: Messages supplies the accessible caption.
S = 2
canvas = Image.new("RGBA", (1200 * S, 630 * S), "#eeeee7")
draw = ImageDraw.Draw(canvas)
for x in range(18, 1200, 22):
    for y in range(14, 630, 22):
        draw.ellipse((x*S, y*S, x*S+2, y*S+2), fill="#d4d9cb")

paper = Image.new("RGBA", (918*S, 488*S))
d = ImageDraw.Draw(paper)
d.rounded_rectangle((0, 0, 918*S-1, 488*S-1), radius=14*S, fill=CREAM)
d.rounded_rectangle((0, 0, 918*S-1, 91*S), radius=14*S, fill=GREEN)
d.rectangle((0, 18*S, 918*S-1, 91*S), fill=GREEN)
for x in [155, 763]:
    d.rounded_rectangle(((x-9)*S, 22*S, (x+9)*S, 55*S), radius=9*S, fill="#344b36")
    d.rounded_rectangle(((x-6)*S, 0, (x+6)*S, 42*S), radius=6*S, fill=CREAM)

font_path = str(ASSETS / "fonts" / "cormorant-garamond.ttf")
number_font = ImageFont.truetype(font_path, 27*S)
label_font = ImageFont.truetype(font_path, 20*S)
left, top, width, row_height = 42, 125, 834, 58
col = width / 7
for i, day in enumerate(["S", "M", "T", "W", "T", "F", "S"]):
    d.text(((left+(i+.5)*col)*S, 114*S), day, anchor="mm", font=label_font, fill=GREEN)
for row in [0, 2, 4]:
    d.rectangle((left*S, (top+row*row_height)*S, (left+width)*S, (top+(row+1)*row_height)*S), fill="#e9ecdf")
for i in range(8):
    x = round((left+i*col)*S)
    d.line((x, top*S, x, (top+5*row_height)*S), fill="#b6beac", width=S)
for i in range(6):
    y = (top+i*row_height)*S
    d.line((left*S, y, (left+width)*S, y), fill="#b6beac", width=S)
for day in range(1, 32):
    cell = day + 1
    x = (left+(cell%7+.5)*col)*S
    y = (top+(cell//7+.5)*row_height)*S
    if day == 17:
        d.ellipse((x-22*S,y-22*S,x+22*S,y+22*S),fill=GREEN)
    d.text((x,y-1*S),str(day),font=number_font,anchor="mm",fill=CREAM if day==17 else "#465342")

paper = paper.rotate(3.5, Image.Resampling.BICUBIC, expand=True)
x,y = (canvas.width-paper.width)//2,(canvas.height-paper.height)//2
shadow_mask = Image.new("L", canvas.size)
shadow_mask.paste(paper.getchannel("A").point(lambda a: round(a*.17)),(x+4*S,y+14*S))
shadow = Image.new("RGBA",canvas.size)
shadow.putalpha(shadow_mask.filter(ImageFilter.GaussianBlur(15*S)))
canvas.alpha_composite(shadow)
canvas.alpha_composite(paper,(x,y))
canvas.convert("RGB").resize((1200,630),Image.Resampling.LANCZOS).save(ASSETS/"social-preview.png",optimize=True)
print("Generated calendar icons and 1200 × 630 sharing artwork.")
