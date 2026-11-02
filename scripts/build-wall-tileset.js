import {readFileSync,writeFileSync} from 'node:fs';import {resolve} from 'node:path';import {createHash} from 'node:crypto';import {validateWallTileset} from '../wall-tileset.js';
// The registered atlas is validated at its declared cell size.
const folder=resolve(process.argv[2]||'art/terrain/walls/crypt'),path=resolve(folder,'tileset.json'),d=validateWallTileset(JSON.parse(readFileSync(path,'utf8'))),name=d.image.split('?')[0],image=readFileSync(resolve(folder,name));
if(image.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||image.readUInt32BE(16)!==d.width||image.readUInt32BE(20)!==d.height||![32,64].includes(d.tileSize))throw Error('Expected a wall atlas matching tileset.json');
d.image=name+'?v='+createHash('sha256').update(image).digest('hex').slice(0,12);writeFileSync(path,JSON.stringify(d,null,2)+'\n');console.log('Validated walls and updated image version:',folder);
