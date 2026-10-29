import {readFileSync,writeFileSync} from 'node:fs';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import {validateWallTileset,WALL_ENTRANCES} from '../wall-tileset.js';
// One material source defines wall tops, fronts, and entrances for an entire stage.
const folder=resolve(process.argv[2]||'art/terrain/walls/crypt'),{default:sharp}=await import(process.argv[3]?pathToFileURL(resolve(process.argv[3])).href:'sharp');
const m=JSON.parse(readFileSync(resolve(folder,'material.json'),'utf8'));
if(m.format!=='wall-material'||m.version!==1||m.tileSize!==32||m.rise!==.75||m.light!=='north-west'||m.entranceMode!=='integrated'||typeof m.id!=='string'||!m.id||!Array.isArray(m.themes)||!m.themes.length)throw Error('Invalid wall material contract');
for(const key of ['capGain','frontGain','bevelGain'])if(!Number.isFinite(m[key])||m[key]<=0||m[key]>2)throw Error('Invalid material gain: '+key);
if(JSON.stringify(m.cap)!=='[0,0,32,32]'||JSON.stringify(m.front)!=='[32,0,32,32]')throw Error('Canonical cap/front panel order required');
for(const key of ['cap','front']){const f=m[key];if(!Array.isArray(f)||f.length!==4||!f.every(Number.isInteger)||f[0]<0||f[1]<0||f[2]!==32||f[3]!==32||f[0]+32>64||f[1]+32>32)throw Error('Invalid material surface: '+key);}
const master=resolve(folder,m.source);if(process.argv[4])await sharp(resolve(process.argv[4])).resize(64,32,{kernel:'nearest',fit:'fill'}).png({palette:true,colours:48,dither:0}).toFile(master);
const {data,info}=await sharp(master).ensureAlpha().raw().toBuffer({resolveWithObject:true});if(info.width!==64||info.height!==32)throw Error('Expected native 64x32 two-surface material');
const width=128,height=280,out=Buffer.alloc(width*height*4),tiles={},entrances={};
const raw=(name,x,y)=>{const [sx,sy]=m[name],i=((sy+y)*64+sx+x)*4;return [...data.subarray(i,i+3),255];};
const surface=(name,x,y)=>{const coord=v=>Math.round(2+v*27/31),weight=v=>v<4?(4-v)/8:v>27?(v-27)/8:0,wx=weight(x),wy=weight(y),a=raw(name,coord(x),coord(y)),b=raw(name,coord(31-x),coord(y)),c=raw(name,coord(x),coord(31-y)),d=raw(name,coord(31-x),coord(31-y));return a.map((v,k)=>k===3?255:Math.round(v*(1-wx)*(1-wy)+b[k]*wx*(1-wy)+c[k]*(1-wx)*wy+d[k]*wx*wy));};
const tone=(c,g)=>c.map((v,k)=>k===3?255:Math.min(255,Math.round(v*g))),put=(x,y,c)=>out.set(c,(y*width+x)*4);
const rim=(side,x,y)=>tone(surface('front',x,y%32),side==='left'?(x===0?.5:x===1?m.bevelGain:m.frontGain):side==='right'?(x===31?.5:x===30?m.frontGain*.9:m.frontGain):(y===0?.5:m.frontGain));
for(let mask=0;mask<16;mask++){
 const dx=mask%4*32,dy=Math.floor(mask/4)*56,n=mask&1,e=mask&2,s=mask&4,w=mask&8;tiles[mask]=[[dx,dy,32,56]];
 for(let y=0;y<56;y++)for(let x=0;x<32;x++){
  let c=y>=32&&!s?tone(surface('front',x,Math.round((y-32)*31/23)),m.frontGain):tone(surface('cap',x,y%32),m.capGain).map((v,k)=>k===3?255:Math.max(14,v));
  // Raised bevel and shadow are present only where the wall meets floor.
  if(!n&&y<2)c=rim('north',x,y);
  if(!w&&x<3)c=rim('left',x,y);
  if(!e&&x>28)c=rim('right',x,y);
  if(!s&&y===30)c=tone(surface('front',x,0),m.bevelGain);
  if(!s&&y===31)c=tone(surface('front',x,1),.46);
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
// Entrance trims use the SAME masonry source, atlas and 32x56 projection as the walls.
for(let part=0;part<4;part++){
 const dx=part*32,dy=224;entrances[WALL_ENTRANCES[part]]=[[dx,dy,32,56]];
 for(let y=0;y<56;y++)for(let x=0;x<32;x++){
  const active=part===0?x>=29&&y!==30&&y!==31:part===1?x<=2&&y!==30&&y!==31:part===2?y>=32&&y<35&&x>=3&&x<=28:y<2&&x>=3&&x<=28;
  if(active)put(dx+x,dy+y,part===0?rim('right',x,y):part===1?rim('left',x,y):part===2?tone(surface('front',x,Math.round((y-32)*31/23)),m.frontGain):rim('north',x,y));
 }
}
const target=resolve(folder,'autotile-32.png');await sharp(out,{raw:{width,height,channels:4}}).png({palette:true,colours:48,dither:0}).toFile(target);
const definition={format:'wall-autotile',version:2,id:m.id,themes:m.themes,image:'autotile-32.png?v='+createHash('sha256').update(readFileSync(target)).digest('hex').slice(0,12),tileSize:32,rise:m.rise,width,height,neighbors:4,bitOrder:['north','east','south','west'],material:{format:'wall-material',version:1,id:m.id,capPixels:32,facePixels:24,light:m.light,entranceMode:m.entranceMode},tiles,entrances};validateWallTileset(definition);writeFileSync(resolve(folder,'tileset.json'),JSON.stringify(definition,null,2)+'\n');console.log('Built unified material, 16 walls and 4 entrances:',target);
