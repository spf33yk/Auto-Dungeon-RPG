import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {renderCard,defaultFormat} from './build-card-frames.js';
import path from 'node:path';
const sharp=(await import(process.env.CARD_FRAME_SHARP_MODULE?pathToFileURL(process.env.CARD_FRAME_SHARP_MODULE).href:'sharp')).default;
const folder='art/ui/preparation';fs.mkdirSync(folder,{recursive:true});
const format=JSON.parse(fs.readFileSync(defaultFormat,'utf8'));
for(const name of ['target','condition','skill','action']){
 await sharp(Buffer.from(renderCard(format,path.dirname(defaultFormat),name,'ornate'))).extract({left:35,top:60,width:1030,height:260}).resize(515,130).png({palette:true,colours:256,dither:.3}).toFile(`${folder}/card-${name}.png`);
}
for(const[name,left,width]of[['left',0,128],['middle',128,768],['right',960,64]]){
 await sharp('art/ui/card-tray-v1/skins/classic.png').extract({left,top:0,width,height:128}).png({palette:true,colours:256,dither:.3}).toFile(`${folder}/tray-${name}.png`);
}
console.log('Built 4 card frames and 3 extensible tray parts.');
