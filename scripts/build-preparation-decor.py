"""Package imagegen originals without changing their aspect ratios."""
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parent.parent
source = root / 'art/local-originals/preparation-decor-v1'
target = root / 'art/ui/preparation-decor-v1'
target.mkdir(parents=True, exist_ok=True)
with Image.open(source / 'background-source.png') as image:
    # Contain rather than stretch. Any one-pixel rounding margin stays dark.
    fitted = ImageOps.contain(image.convert('RGB'), (1440, 810), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (1440, 810), '#10100f')
    canvas.paste(fitted, ((1440-fitted.width)//2, (810-fitted.height)//2))
    canvas.save(target / 'background.webp', quality=84, method=6)
with Image.open(source / 'frame-source.png') as image:
    assert image.width == image.height, 'Nine-slice source must be square'
    alpha = image.convert('RGBA')
    box = alpha.getbbox()
    pad = max(0, min(box[0], box[1], alpha.width-box[2], alpha.height-box[3])-2)
    alpha.crop((pad,pad,alpha.width-pad,alpha.height-pad)).resize((512, 512), Image.Resampling.LANCZOS).save(
        target / 'frame.webp', lossless=True, method=6, exact=True)
