import {readFileSync,writeFileSync} from 'node:fs';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import {validateWallTileset} from '../wall-tileset.js';
// Generated stone artwork, native 32px geometry, and exact shared edges.
const folder=resolve(process.argv[2]||'art/terrain/walls/crypt'),{default:sharp}=await import(process.argv[3]?pathToFileURL(resolve(process.argv[3])).href:'sharp');
const source=validateWallTileset(JSON.parse(readFileSync(resolve(folder,'tileset.json'),'utf8'))),width=128,height=224;
const master=resolve(folder,'painted-32.png');
if(process.argv[4])await sharp(resolve(process.argv[4])).resize(width,height,{kernel:'nearest',fit:'fill'}).png({palette:true,colours:48,dither:0}).toFile(master);
const data=await sharp(master).ensureAlpha().raw().toBuffer(),out=Buffer.alloc(width*height*4),tiles={};
const sample=(mask,x,y)=>{const i=((Math.floor(mask/4)*56+y)*128+mask%4*32+x)*4;return [...data.subarray(i,i+3),255];};
// Exclude generation gutters; soften the wrap across four pixels rather than introducing a grid outline.
const rock=(x,y)=>{
 const coord=v=>Math.round(3+v*25/31),weight=v=>v<4?(4-v)/8:v>27?(v-27)/8:0;
 const wx=weight(x),wy=weight(y),a=sample(15,coord(x),coord(y)),b=sample(15,coord(31-x),coord(y)),c=sample(15,coord(x),coord(31-y)),d=sample(15,coord(31-x),coord(31-y));
 return a.map((v,k)=>k===3?255:Math.round(v*(1-wx)*(1-wy)+b[k]*wx*(1-wy)+c[k]*(1-wx)*wy+d[k]*wx*wy));
};
const put=(x,y,c)=>out.set(c,(y*width+x)*4);
// Chip15 supplies unbordered rock; chip0 supplies the carved front surface.
for(let mask=0;mask<16;mask++){
 const dx=mask%4*32,dy=Math.floor(mask/4)*56,n=mask&1,e=mask&2,s=mask&4,w=mask&8;tiles[mask]=[[dx,dy,32,56]];
 for(let y=0;y<56;y++)for(let x=0;x<32;x++){
  let c=y>=32&&!s?sample(0,Math.min(28,Math.max(3,x)),y):rock(x,y%32);
  if(!s&&y>=32)c=c.map((v,k)=>k===3?255:Math.round(v*.83));
  let light=1;if(!n&&y<2)light=y===0?.52:1.32;if(!w&&x<2)light=x===0?.48:1.2;if(!e&&x>29)light=x===31?.42:.72;if(!s&&y===31)light=1.25;
  if(light!==1)c=c.map((v,k)=>k===3?255:Math.min(255,Math.round(v*light)));
  put(dx+x,dy+y,c);
 }
}
// Weld compatible edge pixels as equivalence classes, including corner intersections.
const count=width*height,parent=Int32Array.from({length:count},(_,i)=>i),find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;},join=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[b]=a;},at=(mask,x,y)=>(Math.floor(mask/4)*56+y)*128+mask%4*32+x;
for(let a=0;a<16;a++)for(let b=0;b<16;b++){
 if((a&2)&&(b&8)&&(a&5)===(b&5))for(let y=0;y<56;y++)join(at(a,31,y),at(b,0,y));
 if((a&4)&&(b&1)&&(a&10)===(b&10))for(let x=0;x<32;x++)join(at(a,x,31),at(b,x,0));
}
const groups=new Map();for(let i=0;i<count;i++){const root=find(i);let g=groups.get(root);if(!g)groups.set(root,g=[0,0,0,0]);for(let c=0;c<3;c++)g[c]+=out[i*4+c];g[3]++;}
for(let i=0;i<count;i++){const g=groups.get(find(i));for(let c=0;c<3;c++)out[i*4+c]=Math.round(g[c]/g[3]);}
const target=resolve(folder,'autotile-32.png');await sharp(out,{raw:{width,height,channels:4}}).png({palette:true,colours:48,dither:0}).toFile(target);
const definition={format:'wall-autotile',version:1,id:'crypt-rock-auto16-v2',themes:source.themes,image:'autotile-32.png?v='+createHash('sha256').update(readFileSync(target)).digest('hex').slice(0,12),tileSize:32,rise:.75,width,height,neighbors:4,bitOrder:['north','east','south','west'],tiles};validateWallTileset(definition);writeFileSync(resolve(folder,'tileset.json'),JSON.stringify(definition,null,2)+'\n');console.log('Built painted rock wall chips 0–15:',target);
