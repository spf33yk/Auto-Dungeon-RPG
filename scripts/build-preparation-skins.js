import fs from 'node:fs';import{pathToFileURL}from'node:url';import{PREPARATION_SKINS}from'../preparation-skins.js';
const sharp=(await import(process.env.CARD_FRAME_SHARP_MODULE?pathToFileURL(process.env.CARD_FRAME_SHARP_MODULE).href:'sharp')).default;
const assets=['card-target','card-condition','card-skill','card-action','tray-left','tray-middle','tray-right'];
// Recolour only warm metal; geometry, transparency, category colours and text stay intact.
for(const skin of PREPARATION_SKINS.slice(1)){
 const folder=`art/ui/preparation/${skin.id}`;fs.mkdirSync(folder,{recursive:true});
 const colour=skin.accent.match(/[a-f0-9]{2}/gi).map(x=>parseInt(x,16));
 for(const asset of assets){const {data,info}=await sharp(`art/ui/preparation/${asset}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let i=0;i<data.length;i+=4){const x=(i/4)%info.width,y=Math.floor(i/4/info.width);if(asset.startsWith('card-')&&x>=60&&x<=160&&y>=8&&y<=80)continue;const [r,g,b,a]=data.subarray(i,i+4);if(a&&r>g*1.05&&g>b*1.13){const light=(r*.3+g*.59+b*.11)/180;for(let c=0;c<3;c++)data[i+c]=Math.min(255,Math.round(colour[c]*light));}}
  await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png({compressionLevel:9}).toFile(`${folder}/${asset}.png`);
 }
}
console.log('Built three geometry-preserving preparation skins.');
