import {readFileSync,writeFileSync} from 'node:fs';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import {validateWallTileset} from '../wall-tileset.js';
// Compose dedicated native-32px wall parts; never scale or sample floor/64px artwork.
const folder=resolve(process.argv[2]||'art/terrain/walls/crypt'),{default:sharp}=await import(process.argv[3]?pathToFileURL(resolve(process.argv[3])).href:'sharp');
const source=validateWallTileset(JSON.parse(readFileSync(resolve(folder,'parts-tileset-v1.json'),'utf8'))),{data,info}=await sharp(resolve(folder,source.image.split('?')[0])).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const tile=32,height=tile*(1+source.rise),width=tile*4,outputHeight=height*4,out=Buffer.alloc(width*outputHeight*4),tiles={};
for(let mask=0;mask<16;mask++){
 const north=Boolean(mask&1),east=Boolean(mask&2),south=Boolean(mask&4),west=Boolean(mask&8),parts=['cap'];
 if(!south)parts.push('front');const edge=north?(south?'Middle':'End'):(south?'Start':'Single');if(!west)parts.push('left'+edge);if(!east)parts.push('right'+edge);
 const dx=mask%4*tile,dy=Math.floor(mask/4)*height;tiles[mask]=[[dx,dy,tile,height]];
 for(const name of parts){const [sx,sy]=source.parts[name][0];for(let y=0;y<height;y++)for(let x=0;x<tile;x++){const a=((sy+y)*info.width+sx+x)*4,b=((dy+y)*width+dx+x)*4;if(data[a+3])data.copy(out,b,a,a+4);}}
 // Exposed north rim is a dedicated one-pixel bevel, never a border on connected edges.
 if(!north)for(let x=0;x<tile;x++){const i=(dy*width+dx+x)*4;out[i]=29;out[i+1]=36;out[i+2]=30;out[i+3]=255;}
}
const target=resolve(folder,'autotile-32.png');await sharp(out,{raw:{width,height:outputHeight,channels:4}}).png({palette:true,colours:48,dither:0}).toFile(target);
const definition={format:'wall-autotile',version:1,id:'crypt-stone-auto16-v1',themes:source.themes,image:'autotile-32.png?v='+createHash('sha256').update(readFileSync(target)).digest('hex').slice(0,12),tileSize:32,rise:source.rise,width,height:outputHeight,neighbors:4,bitOrder:['north','east','south','west'],tiles};validateWallTileset(definition);writeFileSync(resolve(folder,'tileset.json'),JSON.stringify(definition,null,2)+'\n');console.log('Built all 16 native wall connection chips:',target);
