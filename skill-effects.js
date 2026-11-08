const point=p=>({x:p.x,y:p.y});
export function captureEffectActors(s){return s.enemies.map(actor=>({actor,...point(actor)}));}
export function enqueueSkillEffects(active,events,roster,s,time,format){
 const result=[...active];
 const bind=(side,at,from=at)=>side==='hero'?{kind:'hero',at:point(at)}:{kind:'enemy',at:point(at),actor:roster.find(e=>e.x===from.x&&e.y===from.y)?.actor||s.enemies.find(e=>e.x===at.x&&e.y===at.y)};
 for(const event of events){const definition=format.skills[event.id];if(!definition)continue;const attack=definition.placement==='hit'&&event.targets.length,bindings=attack?event.targets.map(at=>bind(event.side==='hero'?'enemy':'hero',at)):[bind(event.side,event.caster,event.from)];for(const target of bindings)result.push({id:event.id,target,time});}
 return result;
}
export function skillEffectFrame(effect,time,format,{reducedMotion=false}={}){
 const elapsed=time-effect.time,total=format.durationsMs.reduce((a,b)=>a+b,0);if(elapsed<0||elapsed>=total)return {alive:false};
 let age=elapsed,index=0;while(index<format.durationsMs.length-1&&age>=format.durationsMs[index])age-=format.durationsMs[index++];
 return {alive:true,index:reducedMotion?4:index,opacity:reducedMotion?.7:format.opacity*format.envelope[index]};
}
export function skillEffectBox(definition,center,format,size=64){const scale=size/format.worldTile;return {x:center.x-definition.anchor[0]*scale,y:center.y-definition.anchor[1]*scale,width:format.cellSize*scale,height:format.cellSize*scale};}
export function heroSkillCenter(at,definition,presentation={},size=64,format){const scale=size/definition.tileSize*definition.displayScale,c=format.heroBodyCenter;return {x:(at.x+.5)*size+(c[0]-definition.anchor[0])*scale+(presentation.offsetX||0),y:(at.y+1)*size+(c[1]-definition.anchor[1])*scale+(presentation.offsetY||0)};}
export function enemySkillCenter(box,frame,format){const index=frame?frame.x/64+frame.y/64*5:-1,c=format.enemyCenters[index]||[32,32];return {x:box.x+c[0]/64*box.width,y:box.y+c[1]/64*box.height};}
export function drawSkillEffects(ctx,effects,time,format,atlases,resolve,{size=64,reducedMotion=false}={}){
 for(const effect of effects){const frame=skillEffectFrame(effect,time,format,{reducedMotion});if(!frame.alive)continue;const d=format.skills[effect.id],image=atlases.get(d.theme),center=resolve(effect.target);if(!center||!image||image.complete===false||(image.naturalWidth??image.width)!==format.columns*format.cellSize)continue;const box=skillEffectBox(d,center,format,size);ctx.save();ctx.globalAlpha=frame.opacity;ctx.imageSmoothingEnabled=false;ctx.drawImage(image,frame.index*format.cellSize,d.row*format.cellSize,format.cellSize,format.cellSize,box.x,box.y,box.width,box.height);ctx.restore();}
}
