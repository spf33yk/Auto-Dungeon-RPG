import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const defaultFormat = path.join(projectRoot, 'art/ui/card-frame-v1/format.json');

export function validateFormat(format) {
  if (format.schema !== 'card-frame/v1') throw new Error('Unsupported card-frame schema');
  const { width, height } = format.canvas;
  const { left, right, top, bottom } = format.body;
  if (![width, height, left, right, top, bottom, format.corner.width, format.corner.height].every(Number.isFinite)) throw new Error('Invalid dimensions');
  if (!(0 < left && left < right && right < width && 0 < top && top < bottom && bottom < height)) throw new Error('Invalid body bounds');
  if (!(format.corner.width > 0 && format.corner.height > 0)) throw new Error('Invalid corner size');
  for (const card of Object.values(format.cards)) {
    const [l, t, r, b] = card.sourceBody;
    if (!(l < r && t < b && card.sourceSize.every(v => v > 0))) throw new Error('Invalid source body');
  }
}

export function cornerPlacements(format) {
  const { left, right, top, bottom } = format.body;
  return [[left, top], [right, top], [left, bottom], [right, bottom]].map(([cx, cy]) => ({
    cx, cy, x: cx - format.corner.width / 2, y: cy - format.corner.height / 2,
    width: format.corner.width, height: format.corner.height,
  }));
}

function pngUri(file) { return `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`; }

export function renderCard(format, directory, cardId, patternId) {
  validateFormat(format);
  const card = format.cards[cardId], pattern = format.patterns[patternId];
  if (!card || !pattern) throw new Error('Unknown card or pattern');
  const { width, height } = format.canvas;
  const { left, right, top, bottom } = format.body;
  const [sl, st, sr, sb] = card.sourceBody;
  // Map each raster's measured rail corners to one shared template rectangle.
  const sx = (right - left) / (sr - sl), sy = (bottom - top) / (sb - st);
  const tx = left - sl * sx, ty = top - st * sy;
  const base = pngUri(path.resolve(directory, card.base));
  const gem = pattern.corners ? pngUri(path.resolve(directory, format.corner.asset)) : '';
  const placements = pattern.corners ? cornerPlacements(format) : [];
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image xlink:href="${base}" width="${card.sourceSize[0]}" height="${card.sourceSize[1]}" preserveAspectRatio="none" transform="matrix(${sx} 0 0 ${sy} ${tx} ${ty})"/>
  ${placements.length ? `<defs><image id="corner" xlink:href="${gem}" width="${format.corner.width}" height="${format.corner.height}" preserveAspectRatio="none"/></defs>` : ''}
  ${placements.map(p => `<use xlink:href="#corner" x="${p.x}" y="${p.y}"/>`).join('\n')}
</svg>`;
}

export function buildCards(formatFile = defaultFormat, output = path.join(projectRoot, 'art/samples/card-format-v3')) {
  const format = JSON.parse(fs.readFileSync(formatFile, 'utf8'));
  const directory = path.dirname(formatFile);
  validateFormat(format);
  const files = [];
  for (const patternId of Object.keys(format.patterns)) {
    const folder = path.join(output, patternId);
    fs.mkdirSync(folder, { recursive: true });
    for (const cardId of Object.keys(format.cards)) {
      const file = path.join(folder, `${cardId}-frame.svg`);
      fs.writeFileSync(file, renderCard(format, directory, cardId, patternId));
      files.push(file);
    }
  }
  return { files, format, corners: cornerPlacements(format) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const positional = args.filter(arg => arg !== '--png');
  const result = buildCards(positional[0] ? path.resolve(positional[0]) : defaultFormat, positional[1] ? path.resolve(positional[1]) : undefined);
  if (args.includes('--png')) {
    const sharp = (await import(process.env.CARD_FRAME_SHARP_MODULE ? pathToFileURL(path.resolve(process.env.CARD_FRAME_SHARP_MODULE)).href : 'sharp')).default;
    for (const file of result.files) await sharp(file).png().toFile(file.replace(/\.svg$/, '.png'));
  }
  console.log(JSON.stringify({ svgFiles: result.files.length, pngFiles: args.includes('--png') ? result.files.length : 0, canvas: result.format.canvas, corners: result.corners }, null, 2));
}
