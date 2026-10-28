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

// Wall cap is lifted half a cell. Only a south-facing boundary receives a front face.
export function drawRaisedWall(ctx,atlas,grid,x,y,seed,theme,size=24){
 const px=x*size,py=y*size,rise=size*.5,edge=size/32,face=Boolean(grid[y+1]?.[x]),west=Boolean(grid[y]?.[x-1]),east=Boolean(grid[y]?.[x+1]);
 const textured=theme.id==='crypt'&&atlas.complete&&atlas.naturalWidth===64&&atlas.naturalHeight===64,frame=cryptTileFrame(false,x,y,seed);
 ctx.imageSmoothingEnabled=false;
 if(textured)ctx.drawImage(atlas,frame.x,frame.y,32,32,px,py-rise,size,size);else{ctx.fillStyle=theme.wallColor;ctx.fillRect(px,py-rise,size,size);}
 if(face){
  if(textured)ctx.drawImage(atlas,frame.x,frame.y+16,32,16,px,py+size-rise,size,rise);else{ctx.fillStyle=theme.wallColor;ctx.fillRect(px,py+size-rise,size,rise);}
  ctx.fillStyle='#0b1518a6';ctx.fillRect(px,py+size-rise,size,rise);
  ctx.fillStyle='#aab4a780';ctx.fillRect(px,py+size-rise,size,edge);
  ctx.fillStyle='#07100ee0';ctx.fillRect(px,py+size-edge,size,edge);
 }
 for(const side of [west?'left':null,east?'right':null].filter(Boolean)){
  const outer=side==='left'?px:px+size,inner=side==='left'?px+size*.22:px+size-size*.22,neighborX=side==='left'?x-1:x+1;
  const above=grid[y-1]?.[x]===0&&Boolean(grid[y-1]?.[neighborX]),below=grid[y+1]?.[x]===0&&Boolean(grid[y+1]?.[neighborX]);
  ctx.beginPath();ctx.moveTo(inner,py-rise);ctx.lineTo(outer,above?py-rise:py);ctx.lineTo(outer,below?py+size-rise:py+size);ctx.lineTo(inner,py+size-rise);ctx.closePath();
  ctx.fillStyle=theme.id==='crypt'?'#3b4740':theme.wallColor;ctx.fill();ctx.fillStyle=side==='left'?'#a2ada02b':'#07121a55';ctx.fill();
  ctx.beginPath();ctx.moveTo(inner,py-rise);ctx.lineTo(inner,py+size-rise);ctx.strokeStyle='#aab4a766';ctx.lineWidth=edge;ctx.stroke();
 }
}
