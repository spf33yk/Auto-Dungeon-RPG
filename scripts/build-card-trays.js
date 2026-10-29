import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const trayFormatFile = path.join(root, 'art/ui/card-tray-v3/format.json');
export const loadTrayFormat = (file = trayFormatFile) => JSON.parse(fs.readFileSync(file, 'utf8'));

export function traySize(format, columns, rows) {
  if (!['card-tray/v1', 'card-tray/v2', 'card-tray/v3'].includes(format.schema)) throw new Error('Unsupported tray schema');
  if (![columns, rows].every(v => Number.isSafeInteger(v) && v > 0)) throw new Error('Columns and rows must be positive integers');
  const l = format.layout;
  const width = l.contentLeft + columns * l.columnWidth + l.contentRight;
  const height = rows * l.rowHeight + (rows - 1) * l.rowGap;
  if (width > 32768 || height > 32768) throw new Error('Preview canvas exceeds 32768px');
  if (l.rowHeight !== format.source.height || format.slices.left + format.slices.right >= format.source.width) throw new Error('Invalid tray slices');
  return { width, height };
}

export function renderTray(format, directory, skinId, columns = 3, rows = 1, showNumbers = true) {
  const { width, height } = traySize(format, columns, rows);
  const skin = format.skins[skinId];
  if (!skin) throw new Error(`Unknown tray skin: ${skinId}`);
  const sw = format.source.width, sh = format.source.height;
  const left = format.slices.left, right = format.slices.right, tile = format.repeat?.width ?? sw - left - right;
  const image = fs.readFileSync(path.resolve(directory, format.frameImage ?? skin.image)).toString('base64');
  const textureImage = fs.readFileSync(path.resolve(directory, skin.image)).toString('base64');
  const filter = skin.metalRamp ? `<filter id="metal" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer>${['R','G','B'].map((c,i) => `<feFunc${c} type="table" tableValues="${skin.metalRamp.map(hex => parseInt(hex.slice(1+i*2,3+i*2),16)/255).join(' ')}"/>`).join('')}</feComponentTransfer></filter>` : '';
  // Left/right caps keep their original pixels; only the quiet middle repeats.
  const crop = (x, w, dx, extra = '') => `<svg x="${dx}" y="0" width="${w}" height="${sh}" viewBox="${x} 0 ${w} ${sh}" overflow="hidden" ${extra}><use xlink:href="#plate"/></svg>`;
  const number = format.layout.number;
  const rowParts = Array.from({ length: rows }, (_, index) => {
    const y = index * (format.layout.rowHeight + format.layout.rowGap);
    const t = format.texture;
    const texture = t ? `<rect x="${t.channelInset}" y="${t.top}" width="${width-t.channelInset-(t.channelRightInset??t.channelInset)}" height="${t.height}" fill="url(#surface)"/><rect x="${t.number.x}" y="${t.number.y}" width="${t.number.width}" height="${t.number.height}" fill="url(#surface)"/>` : '';
    return `<g transform="translate(0 ${y})"><g${filter ? ' filter="url(#metal)"' : ''}>${crop(0, left, 0)}<rect x="${left}" y="0" width="${width - left - right}" height="${sh}" fill="url(#middle)"/>${crop(sw - right, right, width - right)}</g>${texture}${showNumbers ? `<text x="${number.x}" y="${number.y}" text-anchor="middle" dominant-baseline="central" font-family="Georgia,serif" font-size="${number.fontSize}" font-weight="bold" fill="${skin.numberColor}">${index + 1}</text>` : ''}</g>`;
  });
  const surface = format.texture ? `<pattern id="surface" y="${format.texture.top}" width="${tile*2}" height="${format.texture.height}" patternUnits="userSpaceOnUse"><svg width="${tile}" height="${format.texture.height}" viewBox="${left} ${format.texture.top} ${tile} ${format.texture.height}" overflow="hidden"><image xlink:href="data:image/png;base64,${textureImage}" width="${sw}" height="${sh}"/></svg><g transform="translate(${tile*2} 0) scale(-1 1)"><svg width="${tile}" height="${format.texture.height}" viewBox="${left} ${format.texture.top} ${tile} ${format.texture.height}" overflow="hidden"><image xlink:href="data:image/png;base64,${textureImage}" width="${sw}" height="${sh}"/></svg></g></pattern>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${filter}${surface}<image id="plate" xlink:href="data:image/png;base64,${image}" width="${sw}" height="${sh}"/><pattern id="middle" x="${left}" y="0" width="${tile * 2}" height="${sh}" patternUnits="userSpaceOnUse">${crop(left, tile, 0)}<g transform="translate(${tile * 2} 0) scale(-1 1)">${crop(left, tile, 0)}</g></pattern></defs>${rowParts.join('')}</svg>`;
}

// A separate foreground layer lets cards sit inside the channel rather than float above it.
export function renderTrayLip(format, columns, rows = 1) {
  const { width, height } = traySize(format, columns, rows);
  const fit = format.fit;
  if (!fit) throw new Error('This format has no fitted-card layer');
  const inset = format.texture.channelInset;
  const layers = Array.from({ length: rows }, (_, row) => {
    const y = row * (format.layout.rowHeight + format.layout.rowGap);
    return `<g transform="translate(0 ${y})"><rect x="${inset}" y="${fit.lipTop}" width="${width-inset-(format.texture.channelRightInset??inset)}" height="${fit.lipHeight}" fill="url(#shadow)"/><rect x="${inset}" y="${fit.lipBottom}" width="${width-inset-(format.texture.channelRightInset??inset)}" height="${fit.lipHeight}" fill="#080a0b" fill-opacity=".62"/><path d="M${inset} ${fit.lipBottom+fit.lipHeight} H${width-(format.texture.channelRightInset??inset)}" stroke="#d6c7a0" stroke-opacity=".25"/></g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="shadow" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#000" stop-opacity=".85"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient></defs>${layers.join('')}</svg>`;
}

export function buildTraySamples(file = trayFormatFile, output = path.join(root, 'art/samples/card-tray-v3')) {
  const format = loadTrayFormat(file), directory = path.dirname(file);
  const files = [];
  for (const skin of Object.keys(format.skins)) {
    const folder = path.join(output, skin);
    fs.mkdirSync(folder, { recursive: true });
    for (const [columns, rows] of [[3, 1], [5, 1], [5, 3]]) {
      const target = path.join(folder, `${columns}cols-${rows}rows.svg`);
      fs.writeFileSync(target, renderTray(format, directory, skin, columns, rows));
      files.push(target);
      if (format.fit) {
        const lip = path.join(folder, `${columns}cols-${rows}rows-lip.svg`);
        fs.writeFileSync(lip, renderTrayLip(format, columns, rows));
        files.push(lip);
      }
    }
  }
  return { format, files };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), positional = args.filter(v => v !== '--png');
  const { files } = buildTraySamples(positional[0] ? path.resolve(positional[0]) : trayFormatFile, positional[1] ? path.resolve(positional[1]) : undefined);
  if (args.includes('--png')) {
    const sharp = (await import(process.env.CARD_FRAME_SHARP_MODULE ? pathToFileURL(path.resolve(process.env.CARD_FRAME_SHARP_MODULE)).href : 'sharp')).default;
    for (const file of files) await sharp(file).png().toFile(file.replace(/\.svg$/, '.png'));
  }
  console.log(`Generated ${files.length} SVG trays${args.includes('--png') ? ' and PNG copies' : ''}.`);
}




