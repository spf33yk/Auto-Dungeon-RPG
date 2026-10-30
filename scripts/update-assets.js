import {PREPARATION_SKINS} from '../preparation-skins.js';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
// Normalize line endings so Windows and Linux generate the same release URLs.
const version=file=>createHash('sha256').update(/\.(png|webm|mp4)$/.test(file)?readFileSync(root+file):readFileSync(root+file,'utf8').replace(/\r\n/g,'\n')).digest('hex').slice(0,12);
const modules=readdirSync(root).filter(f=>f.endsWith('.js')&&!f.endsWith('.test.js')&&f!=='server.js').sort();
const imports=Object.fromEntries(modules.map(f=>['./'+f,'./'+f+'?v='+version(f)]));
const map='<script type="importmap" id="asset-imports">'+JSON.stringify({imports})+'</script>';
const path=root+'index.html',html=readFileSync(path,'utf8');
let updated=html.includes('id="asset-imports"')?html.replace(/<script type="importmap" id="asset-imports">[\s\S]*?<\/script>/,map):html.replace('</head>',map+'</head>');
const preparationAssets=['card-target','card-condition','card-skill','card-action','tray-left','tray-middle','tray-right'];
const preparationStyle='<style id="preparation-assets">:root{'+preparationAssets.map(name=>'--prep-'+name+':url("./art/ui/preparation/'+name+'.png?v='+version('art/ui/preparation/'+name+'.png')+'")').join(';')+'}'+PREPARATION_SKINS.slice(1).map(s=>'html[data-preparation-skin="'+s.id+'"]{'+preparationAssets.map(name=>'--prep-'+name+':url("./art/ui/preparation/'+s.id+'/'+name+'.png?v='+version('art/ui/preparation/'+s.id+'/'+name+'.png')+'")').join(';')+'}').join('')+'</style>';
updated=updated.includes('id="preparation-assets"')?updated.replace(/<style id="preparation-assets">[\s\S]*?<\/style>/,preparationStyle):updated.replace('</head>',preparationStyle+'</head>');
const textLayout=JSON.parse(readFileSync(root+'art/ui/preparation/layout.json','utf8'));
const textRect=textLayout.contentRect,cardSize=textLayout.cardSize,number=textLayout.rowNumber;
const textStyle='<style id="preparation-text-layout">:root{'+[
 ['text-left',textRect.x/cardSize.width*100+'%'],['text-top',textRect.y/cardSize.height*100+'%'],
 ['text-width',textRect.width/cardSize.width*100+'%'],['text-height',textRect.height/cardSize.height*100+'%'],
 ['number-left',number.centerX-number.width/2+'px'],['number-top',number.centerY-number.height/2+'px'],
 ['number-width',number.width+'px'],['number-height',number.height+'px'],
 ['card-overlap',(1-(textLayout.connection.right-textLayout.connection.left)/cardSize.width)*textLayout.connection.displayWidth+'px'],
 ['join-tail',(1-textLayout.connection.right/cardSize.width)*textLayout.connection.displayWidth+'px'],
 ['insertion-width',textLayout.connection.insertionWidth+'px']
].map(([name,value])=>'--prep-'+name+':'+value).join(';')+'}</style>';
updated=updated.includes('id="preparation-text-layout"')?updated.replace(/<style id="preparation-text-layout">[\s\S]*?<\/style>/,textStyle):updated.replace('</head>',textStyle+'</head>');
// Each registered definition carries its own image hash. New areas need no renderer edits.
for(const match of html.matchAll(/\.\/art\/terrain\/(?:walls|entrances)\/[^"\s?]*tileset\.json(?:\?v=[^"\s]*)?/g)){
 const file=match[0].split('?')[0].slice(2),definition=JSON.parse(readFileSync(root+file,'utf8'));
 const image=file.slice(0,file.lastIndexOf('/')+1)+definition.image.split('?')[0];
 if(definition.image.split('?v=')[1]!==version(image))throw Error('Tileset image version is stale: run its build script for '+file);
 updated=updated.replaceAll(match[0],'./'+file+'?v='+version(file));
}
// The inline startup script imports app.js through this content-versioned map.
for(const match of html.matchAll(/\.\/art\/characters\/[^"\s?]*sprites\.json(?:\?v=[^"\s]*)?/g)){
 const file=match[0].split('?')[0].slice(2),definition=JSON.parse(readFileSync(root+file,'utf8'));
 const image=file.slice(0,file.lastIndexOf('/')+1)+definition.image.split('?')[0];
 if(definition.image.split('?v=')[1]!==version(image))throw Error('Character image version is stale: run build-character-sheet.js for '+file);
 updated=updated.replaceAll(match[0],'./'+file+'?v='+version(file));
}
for(const file of ['style.css','screens.css'])updated=updated.replace(new RegExp('href="\\./'+file.replace('.', '\\.')+'(?:\\?v=[^"]*)?"'),'href="./'+file+'?v='+version(file)+'"');
for(const file of ['opening-awakening.png','opening-son-journey.png','logo-mukuro-journey.png','logo-segare-journey.png','title-mukuro-v3.webm','title-mukuro-v3-screen.mp4','title-segare-v3.webm','title-segare-v3-screen.mp4','journey-teaser.mp4','terrain/crypt/atlas-32.png','props/atlas-32.png','props/map-items-32.png']){
 const asset='./art/'+file;
 updated=updated.replace(new RegExp('\\./art/'+file.replaceAll('.','\\.')+'(?:\\?v=[^"\\s>]*)?','g'),asset+'?v='+version('art/'+file));
}
if(process.argv.includes('--check')){
 if(updated!==html){console.error('Asset URLs are stale. Run node scripts/update-assets.js and commit index.html.');process.exitCode=1;}
 else console.log('Asset URLs match all browser modules and styles.');
}else{writeFileSync(path,updated);console.log('Updated content-versioned browser asset URLs.');}
