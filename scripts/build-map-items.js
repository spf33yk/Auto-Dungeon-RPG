import fs from 'node:fs';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
const {default:sharp}=await import(pathToFileURL(resolve(process.argv[3])).href),{data,info}=await sharp(process.argv[2]).ensureAlpha().raw().toBuffer({resolveWithObject:true}),out=Buffer.alloc(96*64*4),sizes=[24,27,25,24,26,28];
for(let i=0;i<data.length;i+=4){if(data[i+3]<240)data.fill(0,i,i+4);else data[i+3]=255;}
for(let index=0;index<6;index++){const col=index%3,row=Math.floor(index/3),l=Math.floor(col*info.width/3),r=Math.floor((col+1)*info.width/3),t=Math.floor(row*info.height/2),b=Math.floor((row+1)*info.height/2);let x0=r,y0=b,x1=-1,y1=-1;
 for(let y=t;y<b;y++)for(let x=l;x<r;x++)if(data[(y*info.width+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}if(x1<x0)throw Error('Empty sprite');
 const factor=Math.min(sizes[index]/(x1-x0+1),sizes[index]/(y1-y0+1)),w=Math.max(1,Math.floor((x1-x0+1)*factor)),h=index===5?28:Math.max(1,Math.floor((y1-y0+1)*factor)),p=await sharp(data,{raw:info}).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1}).resize(w,h,{kernel:'nearest'}).raw().toBuffer(),dx=col*32+Math.floor((32-w)/2),dy=row*32+30-h;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)p.copy(out,((dy+y)*96+dx+x)*4,(y*w+x)*4,(y*w+x+1)*4);
}
await sharp(out,{raw:{width:96,height:64,channels:4}}).png({palette:true,colours:48,dither:0}).toFile('art/props/map-items-32.png');
await sharp('art/props/map-items-32.png').resize(768,512,{kernel:'nearest'}).png().toFile('test-results/map-items-preview.png');console.log('Built32px map props');
