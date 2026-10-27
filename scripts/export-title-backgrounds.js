import {readFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,join} from 'node:path';
// Optional module path supports the desktop's bundled Sharp without adding a game dependency.
const {default:sharp}=await import(process.argv[2]?pathToFileURL(resolve(process.argv[2])).href:'sharp');
const root=fileURLToPath(new URL('../',import.meta.url));
const css=readFileSync(join(root,'screens.css'),'utf8');
const rule=css.match(/\.title-logo-frame\{position:absolute;([^}]+)\}/)?.[1];
if(!rule)throw new Error('Title logo layout was not found');
const percent=name=>Number(rule.match(new RegExp(name+':([\\d.]+)%'))?.[1])/100;
const w=1920,h=1080,left=percent('left')*w,top=percent('top')*h,width=percent('width')*w;
const ratio=Number(rule.match(/aspect-ratio:([\d.]+)/)?.[1]);
if(![left,top,width,ratio].every(Number.isFinite))throw new Error('Invalid title geometry');
const output=join(root,'art','title-video-base');mkdirSync(output,{recursive:true});
const uri=file=>'data:image/png;base64,'+readFileSync(join(root,'art',file)).toString('base64');
for(const [name,background,logo] of [['mukuro','opening-awakening.png','logo-mukuro-journey.png'],['segare','opening-son-journey.png','logo-segare-journey.png']]){
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><defs><linearGradient id="horizontal"><stop offset="24%" stop-color="#070b0d" stop-opacity="0.039215686"/><stop offset="55%" stop-color="#070b0d" stop-opacity="0.2"/><stop offset="100%" stop-color="#070b0d" stop-opacity="0.549019608"/></linearGradient><linearGradient id="vertical" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#070b0d" stop-opacity="0.4"/><stop offset="50%" stop-color="#070b0d" stop-opacity="0"/></linearGradient><filter id="shadow" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="black" flood-opacity="0.8"/></filter></defs><image href="${uri(background)}" width="1920" height="1080"/><path fill="url(#vertical)" d="M0 0H1920V1080H0Z"/><path fill="url(#horizontal)" d="M0 0H1920V1080H0Z"/><image href="${uri(logo)}" x="${left}" y="${top}" width="${width}" height="${width/ratio}" preserveAspectRatio="xMidYMid meet" filter="url(#shadow)"/></svg>`;
 const target=join(output,name+'-background-logo-1920x1080.png');
 await sharp(Buffer.from(svg)).png().toFile(target);console.log(target);
}
