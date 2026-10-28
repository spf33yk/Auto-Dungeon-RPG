// wall-parts/v1: artwork contains every visible surface; rendering never crops floor art.
export const WALL_PARTS=['cap','front','leftStart','leftMiddle','leftEnd','leftSingle','rightStart','rightMiddle','rightEnd','rightSingle'];
export function wallNeighborMask(grid,x,y){return (!grid[y-1]?.[x]?1:0)|(!grid[y]?.[x+1]?2:0)|(!grid[y+1]?.[x]?4:0)|(!grid[y]?.[x-1]?8:0);}
export function validateWallAutotile(d){
 if(d?.format!=='wall-autotile'||d.version!==1||d.neighbors!==4||JSON.stringify(d.bitOrder)!==JSON.stringify(['north','east','south','west'])||d.tileSize!==32)throw Error('Unsupported wall-autotile definition');
 if(typeof d.id!=='string'||!d.id||typeof d.image!=='string'||!d.image||!Array.isArray(d.themes)||!d.themes.length||d.themes.some(t=>typeof t!=='string'||!t))throw Error('Autotile id, themes and image required');
 if(!Number.isFinite(d.rise)||d.rise<=0||d.rise>1||!Number.isInteger(d.width)||!Number.isInteger(d.height)||d.width<32||d.height<32)throw Error('Invalid autotile dimensions');
 if(!d.tiles||typeof d.tiles!=='object'||Array.isArray(d.tiles)||Object.keys(d.tiles).length!==16)throw Error('Wall connections must contain exactly 16 keyed patterns');
 for(let mask=0;mask<16;mask++){const frames=d.tiles?.[mask];if(!Array.isArray(frames)||!frames.length)throw Error('Missing wall connection: '+mask);for(const f of frames)if(!Array.isArray(f)||f.length!==4||!f.every(Number.isInteger)||f[0]<0||f[1]<0||f[2]!==32||f[3]!==32*(1+d.rise)||f[0]+f[2]>d.width||f[1]+f[3]>d.height)throw Error('Invalid wall connection frame: '+mask);}
 return d;
}
export function validateWallTileset(d){
 if(d?.format==='wall-autotile')return validateWallAutotile(d);
 if(d?.format!=='wall-parts'||d.version!==1)throw Error('Unsupported wall tileset format');
 if(typeof d.id!=='string'||!d.id||!Array.isArray(d.themes)||!d.themes.length||d.themes.some(t=>typeof t!=='string'||!t)||typeof d.image!=='string'||!d.image)throw Error('Wall id, themes and image are required');
 if(!Number.isInteger(d.tileSize)||d.tileSize<8||!Number.isFinite(d.rise)||d.rise<=0||d.rise>1)throw Error('Invalid wall geometry');
 if(!Number.isInteger(d.width)||!Number.isInteger(d.height)||d.width<1||d.height<1)throw Error('Invalid wall atlas dimensions');
 for(const part of WALL_PARTS){const frames=d.parts?.[part];if(!Array.isArray(frames)||!frames.length)throw Error('Missing wall part: '+part);
  for(const f of frames){if(!Array.isArray(f)||f.length!==4||!f.every(Number.isInteger)||f[0]<0||f[1]<0||f[2]!==d.tileSize||f[3]!==d.tileSize*(1+d.rise)||f[0]+f[2]>d.width||f[1]+f[3]>d.height)throw Error('Invalid wall frame: '+part);}
 }
 return d;
}
export function wallPartNames(grid,x,y){
 const names=['cap'];if(grid[y+1]?.[x])names.push('front');
 for(const [side,dx]of [['left',-1],['right',1]])if(grid[y]?.[x+dx]){
  const connected=dy=>grid[y+dy]?.[x]===0&&Boolean(grid[y+dy]?.[x+dx]);
  const above=connected(-1),below=connected(1);names.push(side+(above?(below?'Middle':'End'):(below?'Start':'Single')));
 }
 return names;
}
export function wallVariant(x,y,seed,count){let h=Math.imul(x+1,73856093)^Math.imul(y+1,19349663)^(seed|0);h^=h>>>13;return (h>>>0)%count;}
// A wall directly below floor is a low foreground rim: never project it into the walkable cell.
export function wallDrawBox(grid,x,y,rise,size=24){const foreground=Boolean(grid[y-1]?.[x]);return {x:x*size,y:(foreground?y:y-rise)*size,width:size,height:(foreground?1:1+rise)*size,foreground};}
export function drawWallParts(ctx,tileset,grid,x,y,seed,size=24){
 const d=tileset?.definition,image=tileset?.image;if(!d||!image||image.complete===false||(image.naturalWidth??image.width)!==d.width||(image.naturalHeight??image.height)!==d.height)return false;
 ctx.imageSmoothingEnabled=false;
 const box=wallDrawBox(grid,x,y,d.rise,size);
 if(d.format==='wall-autotile'){const choices=d.tiles[wallNeighborMask(grid,x,y)],f=choices[wallVariant(x,y,seed,choices.length)];ctx.drawImage(image,...f,box.x,box.y,box.width,box.height);return true;}
 for(const name of wallPartNames(grid,x,y)){const choices=d.parts[name],f=choices[wallVariant(x,y,seed,choices.length)];ctx.drawImage(image,...f,box.x,box.y,box.width,box.height);}
 return true;
}
export async function loadWallTilesets(sources,{baseURL=globalThis.document?.baseURI,fetcher=globalThis.fetch,imageFactory=()=>new Image()}={}){
 const sets=new Map();
 for(const source of sources){const url=new URL(source,baseURL),response=await fetcher(url);if(!response.ok)throw Error('Wall definition failed: '+response.status);
  const definition=validateWallTileset(await response.json()),image=imageFactory();image.src=new URL(definition.image,url).href;await image.decode();
  if(image.naturalWidth!==definition.width||image.naturalHeight!==definition.height)throw Error('Wall image dimensions do not match definition');
  for(const theme of definition.themes)sets.set(theme,{definition,image});
 }
 return sets;
}
