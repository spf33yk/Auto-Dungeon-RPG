import {readFileSync,writeFileSync,existsSync} from 'node:fs';import {resolve,basename} from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import {validateCharacterSheet} from '../character-animation.js';
const folder=resolve(process.argv[2]||'art/characters/mukuro-v1'),{default:sharp}=await import(process.argv[3]?pathToFileURL(resolve(process.argv[3])).href:'sharp'),target=resolve(folder,'sprites-32.png');
if(process.argv[4]){
 const {data,info}=await sharp(resolve(process.argv[4])).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=0;i<data.length;i+=4){if(data[i+3]<160)data.fill(0,i,i+4);else data[i+3]=255;}
 const cells=[];
 for(let row=0;row<4;row++)for(let col=0;col<3;col++){
  const left=Math.floor(col*info.width/3),top=Math.floor(row*info.height/4),right=Math.floor((col+1)*info.width/3),bottom=Math.floor((row+1)*info.height/4);let x0=right,y0=bottom,x1=left,y1=top;
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(data[(y*info.width+x)*4+3]){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  if(x1<x0||y1<y0)throw Error('Empty character frame');cells.push({row,col,left:x0,top:y0,width:x1-x0+1,height:y1-y0+1});
 }
 const factor=Math.min(28/Math.max(...cells.map(c=>c.width)),27/Math.max(...cells.map(c=>c.height))),out=Buffer.alloc(96*128*4);
 for(const c of cells){const width=Math.max(1,Math.floor(c.width*factor)),height=Math.max(1,Math.floor(c.height*factor)),pixels=await sharp(data,{raw:info}).extract({left:c.left,top:c.top,width:c.width,height:c.height}).resize(width,height,{kernel:'nearest'}).raw().toBuffer(),dx=c.col*32+Math.floor((32-width)/2),dy=c.row*32+29-height;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)pixels.copy(out,((dy+y)*96+dx+x)*4,(y*width+x)*4,(y*width+x+1)*4);
 }
 await sharp(out,{raw:{width:96,height:128,channels:4}}).png({palette:true,colours:32,dither:0}).toFile(target);
}
const meta=await sharp(target).metadata();if(meta.width!==96||meta.height!==128)throw Error('Expected 96x128 character atlas');
const prior=existsSync(resolve(folder,'sprites.json'))?JSON.parse(readFileSync(resolve(folder,'sprites.json'),'utf8')):{};
const definition={format:'character-4dir',version:1,id:prior.id||basename(folder),image:'sprites-32.png?v='+createHash('sha256').update(readFileSync(target)).digest('hex').slice(0,12),tileSize:32,columns:3,rows:4,width:96,height:128,directions:['south','west','east','north'],anchor:prior.anchor||[16,29],displayScale:prior.displayScale||1.25};validateCharacterSheet(definition);writeFileSync(resolve(folder,'sprites.json'),JSON.stringify(definition,null,2)+'\n');console.log('Packed native32 character sheet:',target);
