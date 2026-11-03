export const MEMORY_SHADE='#071111a8';
// Tint the sprite's own alpha, including raised faces, rather than a flat ground rectangle.
export function dimmedWallTileset(tileset,makeCanvas=()=>document.createElement('canvas')){
 if(!tileset)return null;if(tileset.dimmed)return tileset.dimmed;
 const source=tileset.image,canvas=makeCanvas();canvas.width=source.naturalWidth;canvas.height=source.naturalHeight;
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(source,0,0);ctx.globalCompositeOperation='source-atop';ctx.fillStyle=MEMORY_SHADE;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalCompositeOperation='source-over';
 return tileset.dimmed={definition:tileset.definition,image:canvas};
}
export function floorLight(known,visible){return visible?'visible':'memory';}
export function actorFootOffset(rows,height){let last=rows.length-1;while(last>=0&&!/[^.]/.test(rows[last]))last--;return (rows.length-1-last)*height/rows.length-2;}
// Camera interpolation must not create a second, delayed visibility state.
export function renderSightState(state,position){return state;}
// Raised artwork uses the same world-space light cells as the floor below it.
export function drawSightWall(ctx,tileset,box,size,visible,draw){
 draw(dimmedWallTileset(tileset));ctx.save();ctx.beginPath();let count=0;
 for(let y=Math.floor(box.y/size);y<Math.ceil((box.y+box.height)/size);y++)for(let x=Math.floor(box.x/size);x<Math.ceil((box.x+box.width)/size);x++)if(visible(x,y)){ctx.rect(x*size,y*size,size,size);count++;}
 if(count){ctx.clip();draw(tileset);}ctx.restore();
}
