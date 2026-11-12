import {drawWallParts,wallDrawBox} from './wall-tileset.js';
export const TERRAIN_TILE_PIXELS=64;
export function floorTextureFrame(zoneIndex=0){const index=Math.max(0,Math.min(9,Math.floor(Number.isFinite(zoneIndex)?zoneIndex:0)));return {x:index%4*64,y:Math.floor(index/4)*64,width:64,height:64};}
export function drawFloorTexture(ctx,atlas,x,y,zoneIndex=0,size=64){if(!atlas.complete||atlas.naturalWidth!==256||atlas.naturalHeight!==256)return false;const f=floorTextureFrame(zoneIndex);ctx.imageSmoothingEnabled=false;ctx.drawImage(atlas,f.x,f.y,64,64,x*size,y*size,size,size);return true;}
// Pure visual hash: never consume the game's random stream.
export function cryptTileFrame(walkable,x,y,seed){
 let hash=Math.imul(x+1,73856093)^Math.imul(y+1,19349663)^(seed|0);
 hash^=hash>>>13;hash=Math.imul(hash,0x5bd1e995);hash^=hash>>>15;
 return {x:(hash&1)*64,y:walkable?0:64,width:64,height:64};
}
export function drawCryptTile(ctx,atlas,grid,x,y,seed,size=64,walkable=Boolean(grid[y]?.[x]),zoneIndex=0){
 if(!atlas.complete||atlas.naturalWidth!==128||![128,1280].includes(atlas.naturalHeight))return false;
 const floor=walkable,frame=cryptTileFrame(floor,x,y,seed),px=x*size,py=y*size;
 ctx.imageSmoothingEnabled=false;
 ctx.drawImage(atlas,frame.x,frame.y+(atlas.naturalHeight===1280?Math.max(0,Math.min(9,zoneIndex))*128:0),64,64,px,py,size,size);
 const north=Boolean(grid[y-1]?.[x]),south=Boolean(grid[y+1]?.[x]),west=Boolean(grid[y]?.[x-1]),east=Boolean(grid[y]?.[x+1]),edge=size/64;
 if(floor){ctx.fillStyle='#07110b48';if(!north)ctx.fillRect(px,py,size,edge*2);if(!west)ctx.fillRect(px,py,edge*2,size);}

 return true;
}

// All textured surfaces come from dedicated wall-parts/v1 sprites.
export function drawRaisedWall(ctx,tileset,grid,x,y,seed,theme,size=24,entrance){
 if(drawWallParts(ctx,tileset,grid,x,y,seed,size,entrance))return true;
 // Missing/invalid assets remain readable; never sample floor or old wall art.
 const box=wallDrawBox(grid,x,y,tileset?.definition?.rise??.75,size);ctx.fillStyle=theme.wallColor;ctx.fillRect(box.x,box.y,box.width,box.height);return false;
}

const tintedWalls=new WeakMap();
export function tintedWallTileset(tileset,color){
 if(!tileset||!color)return tileset;
 let variants=tintedWalls.get(tileset);
 if(!variants){variants=new Map();tintedWalls.set(tileset,variants);}
 if(variants.has(color))return variants.get(color);
 const {image,definition}=tileset,canvas=document.createElement('canvas');
 canvas.width=definition.width;canvas.height=definition.height;
 const ctx=canvas.getContext('2d');
 ctx.drawImage(image,0,0);
 ctx.globalCompositeOperation='source-atop';
 ctx.globalAlpha=.27;
 ctx.fillStyle=color;
 ctx.fillRect(0,0,canvas.width,canvas.height);
 const variant={definition,image:canvas};
 variants.set(color,variant);
 return variant;
}
