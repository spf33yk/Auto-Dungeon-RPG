export const MEMORY_SHADE='#071111a8';
// Approved warm B lighting: the radius follows the logical sight, without changing it.
export const EXPLORATION_LIGHT=Object.freeze({radiusPadding:1.3,warm:['#f6ce7959','#d8ac5b35','#b28b4310','#00000000'],dark:['#00000000','#00000005','#00000035','#000000a3','#000000d2']});
export function explorationLightGeometry(position,sight=3,size=64){return {x:(position.x+.5)*size,y:(position.y+.3)*size,radius:(Math.max(0,sight)+EXPLORATION_LIGHT.radiusPadding)*size};}
export function drawExplorationLight(ctx,{position,camera,width,height,size=64,appearance=null}){
 const {x,y,radius:r}=explorationLightGeometry(position,appearance?.radius??3,size),rect=[camera.left,camera.top,width/camera.scale,height/camera.scale];
 ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='screen';const warm=ctx.createRadialGradient(x,y,0,x,y,r);[0,.3,.7,1].forEach((at,i)=>warm.addColorStop(at,EXPLORATION_LIGHT.warm[i]));ctx.fillStyle=warm;ctx.fillRect(...rect);ctx.restore();
 ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';const shade=ctx.createRadialGradient(x,y,0,x,y,r);[0,.28,.52,.77,1].forEach((at,i)=>shade.addColorStop(at,EXPLORATION_LIGHT.dark[i]));ctx.fillStyle=shade;ctx.fillRect(...rect);ctx.restore();
}
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
export function drawSightWall(ctx,tileset,box,size,visible,draw,appearance=null){
 if(appearance?.smooth){draw(tileset);return;}
 draw(dimmedWallTileset(tileset));ctx.save();ctx.beginPath();let count=0;
 for(let y=Math.floor(box.y/size);y<Math.ceil((box.y+box.height)/size);y++)for(let x=Math.floor(box.x/size);x<Math.ceil((box.x+box.width)/size);x++)if(visible(x,y)){ctx.rect(x*size,y*size,size,size);count++;}
 if(count){ctx.clip();if(appearance)clipSightAppearance(ctx,appearance);draw(tileset);}ctx.restore();
}

// Visual-only circular light edge. Never use this mask for canSee, discovery, AI or actor visibility.
export function clipSightAppearance(ctx,{position,radius,size=64}){const x=(position.x+.5)*size,y=(position.y+.5)*size,r=(radius+.5)*size;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();}
export function shadeSightFloor(ctx,x,y,size,appearance){const cx=(appearance.position.x+.5)*size,cy=(appearance.position.y+.5)*size,r=(appearance.radius+.5)*size;ctx.save();ctx.beginPath();ctx.rect(x*size,y*size,size,size);ctx.moveTo(cx+r,cy);ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip('evenodd');ctx.fillStyle=MEMORY_SHADE;ctx.fillRect(x*size,y*size,size,size);ctx.restore();}
