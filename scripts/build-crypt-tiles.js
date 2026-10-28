import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
// Sharp is needed only when rebuilding artwork; it is not a browser dependency.
const {default:sharp}=await import(process.argv[2]?pathToFileURL(resolve(process.argv[2])).href:'sharp');
const directory=fileURLToPath(new URL('../art/terrain/crypt/',import.meta.url));
const source=directory+'master-64.png',target=directory+'atlas-32.png';
const meta=await sharp(source).metadata();
if(meta.width!==128||meta.height!==128)throw new Error('Expected a 2x2 atlas of 64px master tiles');
await sharp(source).resize(64,64,{kernel:'nearest'}).png({palette:true,colours:32,dither:0}).toFile(target);
console.log('Built atlas-32.png: four 32px tiles, nearest-neighbor, <=32 colors.');
