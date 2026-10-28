// Mark only solid shoulders beside a one-cell corridor opening into wider floor.
export function entranceWallFrames(grid){
 const frames=new Map(),floor=(x,y)=>Boolean(grid[y]?.[x]),put=(x,y,frame)=>{if(y>=0&&y<grid.length&&x>=0&&x<grid[y].length&&!floor(x,y))frames.set(x+','+y,frame);};
 for(let y=1;y<grid.length-1;y++)for(let x=1;x<grid[y].length-1;x++)if(floor(x,y)){
  if(floor(x-1,y)&&floor(x+1,y)&&!floor(x,y-1)&&!floor(x,y+1)&&[-1,1].some(dx=>floor(x+dx,y-1)||floor(x+dx,y+1))){put(x,y-1,2);put(x,y+1,3);}
  if(floor(x,y-1)&&floor(x,y+1)&&!floor(x-1,y)&&!floor(x+1,y)&&[-1,1].some(dy=>floor(x-1,y+dy)||floor(x+1,y+dy))){put(x-1,y,0);put(x+1,y,1);}
 }return frames;
}
export function drawEntrance(ctx,image,frame,box){if(frame===undefined||!image||image.complete===false||(image.naturalWidth??image.width)!==64||(image.naturalHeight??image.height)!==64)return false;ctx.imageSmoothingEnabled=false;ctx.drawImage(image,(frame%2)*32,Math.floor(frame/2)*32,32,32,box.x,box.y,box.width,box.height);return true;}
