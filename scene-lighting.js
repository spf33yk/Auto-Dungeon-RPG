export const MEMORY_SHADE='#071111a8';
// Tint the sprite's own alpha, including raised faces, rather than a flat ground rectangle.
export function dimmedWallTileset(tileset,makeCanvas=()=>document.createElement('canvas')){
 if(!tileset)return null;if(tileset.dimmed)return tileset.dimmed;
 const source=tileset.image,canvas=makeCanvas();canvas.width=source.naturalWidth;canvas.height=source.naturalHeight;
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(source,0,0);ctx.globalCompositeOperation='source-atop';ctx.fillStyle=MEMORY_SHADE;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalCompositeOperation='source-over';
 return tileset.dimmed={definition:tileset.definition,image:canvas};
}
export function floorLight(known,visible){return known?(visible?'visible':'memory'):'hidden';}
export function actorFootOffset(rows,height){let last=rows.length-1;while(last>=0&&!/[^.]/.test(rows[last]))last--;return (rows.length-1-last)*height/rows.length-2;}
// Animation follows the nearest rendered cell; AI continues to use its committed position.
export function renderSightState(state,position){return {...state,player:{...state.player,x:Math.round(position.x),y:Math.round(position.y)}};}
