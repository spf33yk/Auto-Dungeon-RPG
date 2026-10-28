import {readFileSync,writeFileSync} from 'node:fs';import {resolve} from 'node:path';import {createHash} from 'node:crypto';import {validateWallTileset} from '../wall-tileset.js';
// Native 32px artwork is both the editable source and the delivered image.
const folder=resolve(process.argv[2]||'art/terrain/walls/crypt'),path=resolve(folder,'tileset.json'),d=validateWallTileset(JSON.parse(readFileSync(path,'utf8'))),image=readFileSync(resolve(folder,'atlas-32.png'));
if(image.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||image.readUInt32BE(16)!==d.width||image.readUInt32BE(20)!==d.height||d.tileSize!==32)throw Error('Expected a native 32px wall atlas matching tileset.json');
d.image='atlas-32.png?v='+createHash('sha256').update(image).digest('hex').slice(0,12);writeFileSync(path,JSON.stringify(d,null,2)+'\n');console.log('Validated native 32px walls and updated image version:',folder);
