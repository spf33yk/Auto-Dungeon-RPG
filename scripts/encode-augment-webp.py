"""Package generated alpha PNGs as small WebP files; never resize or matte them."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
folder = root / 'art/ui/augments-v1'
source = root / 'art/local-originals/augments-v1/export'
for icon in json.loads((folder / 'format.json').read_text(encoding='utf-8'))['icons']:
    with Image.open(source / f"{icon['id']}.png") as image:
        image.save(folder / f"{icon['id']}.webp", 'WEBP', quality=86, method=6, exact=True)
