from pathlib import Path
from PIL import Image
import json, hashlib

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'art/characters/mukuro-march64-v1'
approval = json.loads((DEST / 'APPROVED_SOURCE.json').read_text(encoding='utf-8'))
for entry in approval['files']:
    assert hashlib.sha256((DEST / entry['file']).read_bytes()).hexdigest() == entry['sha256'], entry['file']
sheet = Image.new('RGBA', (512, 512))
for row, direction in enumerate(['down', 'left', 'right', 'up']):
    for col in range(4):
        frame = Image.open(DEST / 'frames' / f'{direction}-{col}.png').convert('RGBA')
        assert frame.size == (128, 128)
        sheet.paste(frame, (col * 128, row * 128))
sheet.save(DEST / 'sprites.png')
version = lambda file: hashlib.sha256((DEST / file).read_bytes()).hexdigest()[:12]
definition = {
    'format': 'character-minimal-4dir', 'version': 1, 'id': 'mukuro-march64-v1',
    'image': 'sprites.png?v=' + version('sprites.png'), 'tileSize': 128,
    'columns': 4, 'rows': 4, 'width': 512, 'height': 512,
    'directions': ['south', 'west', 'east', 'north'], 'anchor': [64, 96],
    'displayScale': 1.71875, 'portrait': [16, 8, 96, 96],
    'animation': {'idleStepMs': 200, 'moveStepMs': 100,
                  'cycleDurationsMs': [120, 280, 120, 280],
                  'attackMs': 300, 'deathMs': 780, 'lungePx': 16},
    'effect': {'image': 'slash.png?v=' + version('slash.png'), 'tileSize': 64,
               'columns': 3, 'rows': 4, 'width': 192, 'height': 256,
               'anchor': [32, 32], 'forwardPx': 34, 'heightPx': 32}
}
(DEST / 'sprites.json').write_text(json.dumps(definition, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Built approved 16-pose march atlas with original pixels unchanged.')
