import {drawWallParts} from './wall-tileset.js';
export const TERRAIN_TILE_PIXELS=32;
// Pure visual hash: never consume the game's random stream.
export function cryptTileFrame(walkable,x,y,seed){
 let hash=Math.imul(x+1,73856093)^Math.imul(y+1,19349663)^(seed|0);
 hash^=hash>>>13;hash=Math.imul(hash,0x5bd1e995);hash^=hash>>>15;
 return {x:(hash&1)*32,y:walkable?0:32,width:32,height:32};
}
export function drawCryptTile(ctx,atlas,grid,x,y,seed,size=24,walkable=Boolean(grid[y]?.[x])){
 if(!atlas.complete||atlas.naturalWidth!==64||atlas.naturalHeight!==64)return false;
 const floor=walkable,frame=cryptTileFrame(floor,x,y,seed),px=x*size,py=y*size;
 ctx.imageSmoothingEnabled=false;
 ctx.drawImage(atlas,frame.x,frame.y,32,32,px,py,size,size);
 const north=Boolean(grid[y-1]?.[x]),south=Boolean(grid[y+1]?.[x]),west=Boolean(grid[y]?.[x-1]),east=Boolean(grid[y]?.[x+1]),edge=size/32;
 if(floor){ctx.fillStyle='#07110b48';if(!north)ctx.fillRect(px,py,size,edge*2);if(!west)ctx.fillRect(px,py,edge*2,size);}

 return true;
}

// All textured surfaces come from dedicated wall-parts/v1 sprites.
export function drawRaisedWall(ctx,tileset,grid,x,y,seed,theme,size=24){
 if(drawWallParts(ctx,tileset,grid,x,y,seed,size))return true;
 // Missing/invalid assets remain readable; never sample floor or old wall art.
 ctx.fillStyle=theme.wallColor;ctx.fillRect(x*size,(y-.5)*size,size,size*1.5);return false;
}