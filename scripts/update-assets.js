import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
// Normalize line endings so Windows and Linux generate the same release URLs.
const version=file=>createHash('sha256').update(file.endsWith('.png')?readFileSync(root+file):readFileSync(root+file,'utf8').replace(/\r\n/g,'\n')).digest('hex').slice(0,12);
const modules=readdirSync(root).filter(f=>f.endsWith('.js')&&!f.endsWith('.test.js')&&f!=='server.js').sort();
const imports=Object.fromEntries(modules.map(f=>['./'+f,'./'+f+'?v='+version(f)]));
const map='<script type="importmap" id="asset-imports">'+JSON.stringify({imports})+'</script>';
const path=root+'index.html',html=readFileSync(path,'utf8');
let updated=html.includes('id="asset-imports"')?html.replace(/<script type="importmap" id="asset-imports">[\s\S]*?<\/script>/,map):html.replace('</head>',map+'</head>');
// The inline startup script imports app.js through this content-versioned map.
for(const file of ['style.css','screens.css'])updated=updated.replace(new RegExp('href="\\./'+file.replace('.', '\\.')+'(?:\\?v=[^"]*)?"'),'href="./'+file+'?v='+version(file)+'"');
for(const file of ['opening-awakening.png','opening-son-journey.png','logo-mukuro-journey.png','logo-segare-journey.png']){
 const asset='./art/'+file;
 updated=updated.replace(new RegExp('\\./art/'+file.replaceAll('.','\\.')+'(?:\\?v=[^"\\s>]*)?','g'),asset+'?v='+version('art/'+file));
}
if(process.argv.includes('--check')){
 if(updated!==html){console.error('Asset URLs are stale. Run node scripts/update-assets.js and commit index.html.');process.exitCode=1;}
 else console.log('Asset URLs match all browser modules and styles.');
}else{writeFileSync(path,updated);console.log('Updated content-versioned browser asset URLs.');}
