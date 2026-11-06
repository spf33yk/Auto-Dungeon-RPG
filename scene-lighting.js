export const MEMORY_SHADE='#071111a8';
// B study, strengthened: world artwork only; labels and HUD are painted afterwards.
export const EXPLORATION_LIGHT=Object.freeze({tint:'#748d9b',tintAlpha:.32,radius:3.1,color:'132,186,198',alpha:.18});
export function drawExplorationLight(ctx,{position,visible,camera,width,height,size=64,appearance=null}){
 const light=EXPLORATION_LIGHT;
 ctx.save();ctx.globalCompositeOperation='multiply';ctx.globalAlpha=light.tintAlpha;ctx.fillStyle=light.tint;
 ctx.fillRect(camera.left,camera.top,width/camera.scale,height/camera.scale);ctx.restore();
 // Clip the soft visibility aid to the existing committed sight, never reveal new cells.
 ctx.save();ctx.beginPath();let count=0;
 for(let y=Math.floor(position.y-light.radius);y<Math.ceil(position.y+light.radius+1);y++)for(let x=Math.floor(position.x-light.radius);x<Math.ceil(position.x+light.radius+1);x++)if(visible(x,y)){ctx.rect(x*size,y*size,size,size);count++;}
 if(count){ctx.clip();if(appearance)clipSightAppearance(ctx,appearance);const x=(position.x+.5)*size,y=(position.y+.5)*size,r=light.radius*size,g=ctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,`rgba(${light.color},${light.alpha})`);g.addColorStop(.32,`rgba(${light.color},${light.alpha*.65})`);g.addColorStop(1,`rgba(${light.color},0)`);
  ctx.globalCompositeOperation='screen';ctx.globalAlpha=1;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
 }ctx.restore();
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
 draw(dimmedWallTileset(tileset));ctx.save();ctx.beginPath();let count=0;
 for(let y=Math.floor(box.y/size);y<Math.ceil((box.y+box.height)/size);y++)for(let x=Math.floor(box.x/size);x<Math.ceil((box.x+box.width)/size);x++)if(visible(x,y)){ctx.rect(x*size,y*size,size,size);count++;}
 if(count){ctx.clip();if(appearance)clipSightAppearance(ctx,appearance);draw(tileset);}ctx.restore();
}

// Visual-only circular light edge. Never use this mask for canSee, discovery, AI or actor visibility.
export function clipSightAppearance(ctx,{position,radius,size=64}){const x=(position.x+.5)*size,y=(position.y+.5)*size,r=(radius+.5)*size;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();}
export function shadeSightFloor(ctx,x,y,size,appearance){const cx=(appearance.position.x+.5)*size,cy=(appearance.position.y+.5)*size,r=(appearance.radius+.5)*size;ctx.save();ctx.beginPath();ctx.rect(x*size,y*size,size,size);ctx.moveTo(cx+r,cy);ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip('evenodd');ctx.fillStyle=MEMORY_SHADE;ctx.fillRect(x*size,y*size,size,size);ctx.restore();}
