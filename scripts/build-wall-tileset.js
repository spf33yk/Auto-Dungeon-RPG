import {readFileSync,writeFileSync} from 'node:fs';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import {validateWallTileset} from '../wall-tileset.js';
const folder=resolve(process.argv[2]||'art/terrain/walls/crypt');
const {default:sharp}=await import(process.argv[3]?pathToFileURL(resolve(process.argv[3])).href:'sharp');
const definitionPath=resolve(folder,'tileset.json'),d=validateWallTileset(JSON.parse(readFileSync(definitionPath,'utf8'))),source=resolve(folder,'master-64.png'),target=resolve(folder,'atlas-32.png'),meta=await sharp(source).metadata();
if(meta.width!==d.width*2||meta.height!==d.height*2)throw Error('Expected a 2x master of the defined atlas');
const {data,info}=await sharp(source).resize(d.width,d.height,{kernel:'nearest'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let i=3;i<data.length;i+=4)data[i]=data[i]>=128?255:0;
await sharp(data,{raw:info}).png({palette:true,colours:48,dither:0}).toFile(target);
d.image='atlas-32.png?v='+createHash('sha256').update(readFileSync(target)).digest('hex').slice(0,12);writeFileSync(definitionPath,JSON.stringify(d,null,2)+'\n');
console.log('Built wall-parts/v1 atlas and content-versioned definition:',folder);
