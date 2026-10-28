export const ENTRANCE_PARTS=['leftJamb','rightJamb','lintel','threshold'];
export function validateEntranceTileset(d){
 if(d?.format!=='entrance-parts'||d.version!==1||d.tileSize!==32)throw Error('Unsupported entrance-parts definition');
 if(typeof d.id!=='string'||!d.id||typeof d.image!=='string'||!d.image||!Array.isArray(d.themes)||!d.themes.length||d.themes.some(t=>typeof t!=='string'||!t))throw Error('Entrance id, image and themes are required');
 if(!Number.isInteger(d.width)||!Number.isInteger(d.height)||d.width<32||d.height<32)throw Error('Invalid entrance atlas dimensions');
 for(const name of ENTRANCE_PARTS){const frames=d.parts?.[name];if(!Array.isArray(frames)||!frames.length)throw Error('Missing entrance part: '+name);for(const f of frames)if(!Array.isArray(f)||f.length!==4||!f.every(Number.isInteger)||f[0]<0||f[1]<0||f[2]!==32||f[3]!==32||f[0]+32>d.width||f[1]+32>d.height)throw Error('Invalid entrance frame: '+name);}
 return d;
}
export async function loadEntranceTilesets(sources,{baseURL=globalThis.document?.baseURI,fetcher=globalThis.fetch,imageFactory=()=>new Image()}={}){
 const sets=new Map();for(const source of sources){const url=new URL(source,baseURL),response=await fetcher(url);if(!response.ok)throw Error('Entrance definition failed: '+response.status);const definition=validateEntranceTileset(await response.json()),image=imageFactory();image.src=new URL(definition.image,url).href;await image.decode();if(image.naturalWidth!==definition.width||image.naturalHeight!==definition.height)throw Error('Entrance image dimensions do not match definition');for(const theme of definition.themes)sets.set(theme,{definition,image});}return sets;
}
// Mark only solid shoulders beside a one-cell corridor opening into wider floor.
export function entranceWallFrames(grid){
 const frames=new Map(),floor=(x,y)=>Boolean(grid[y]?.[x]),put=(x,y,frame)=>{if(y>=0&&y<grid.length&&x>=0&&x<grid[y].length&&!floor(x,y))frames.set(x+','+y,frame);};
 for(let y=1;y<grid.length-1;y++)for(let x=1;x<grid[y].length-1;x++)if(floor(x,y)){
  if(floor(x-1,y)&&floor(x+1,y)&&!floor(x,y-1)&&!floor(x,y+1)&&[-1,1].some(dx=>floor(x+dx,y-1)||floor(x+dx,y+1))){put(x,y-1,2);put(x,y+1,3);}
  if(floor(x,y-1)&&floor(x,y+1)&&!floor(x-1,y)&&!floor(x+1,y)&&[-1,1].some(dy=>floor(x-1,y+dy)||floor(x+1,y+dy))){put(x-1,y,0);put(x+1,y,1);}
 }return frames;
}
export function drawEntrance(ctx,tileset,part,box,variantSeed=0){const d=tileset?.definition,image=tileset?.image,name=typeof part==='number'?ENTRANCE_PARTS[part]:part;if(!d||!image||image.complete===false||(image.naturalWidth??image.width)!==d.width||(image.naturalHeight??image.height)!==d.height||!d.parts[name])return false;const frames=d.parts[name],frame=frames[(variantSeed>>>0)%frames.length];ctx.imageSmoothingEnabled=false;ctx.drawImage(image,...frame,box.x,box.y,box.width,box.height);return true;}
