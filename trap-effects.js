import {TRAPS} from './traps.js';

const CELL=128,ANCHOR_X=64,ANCHOR_Y=105;
const effects=Object.fromEntries(TRAPS.map((trap,index)=>[trap.id,{index,duration:trap.id==='mist'?1080:780}]));

export function trapEffectAlive(event,time){
 return time-event.start<(effects[event.type]?.duration??0);
}

export function drawTrapEffects(ctx,queue,time,atlas,visible,{size=64,reducedMotion=false}={}){
 if(!atlas?.complete||atlas.naturalWidth!==384||atlas.naturalHeight!==256)return;
 ctx.save();
 ctx.imageSmoothingEnabled=false;
 for(const event of queue){
  const effect=effects[event.type];
  if(!effect)continue;
  const elapsed=time-event.start;
  if(elapsed<0||elapsed>=effect.duration)continue;
  const progress=reducedMotion?.35:elapsed/effect.duration;
  const opacity=reducedMotion?.82:Math.min(1,progress*9,(1-progress)*3.8);
  const scales={spike:.72+Math.min(.32,progress*2),teleport:.72+progress*.32,snare:1.13-progress*.22,weaken:.83+progress*.25,alarm:.65+progress*1.05,mist:.78+progress*.85};
  const ratio=scales[event.type]*size/64;
  const draw=(at,scale,alpha,rise=0)=>{
   if(!event.hero&&!visible(at.x,at.y))return;
   const x=(at.x+.5)*size,y=(at.y+.82)*size-rise;
   ctx.globalAlpha=alpha;
   ctx.drawImage(atlas,effect.index%3*CELL,Math.floor(effect.index/3)*CELL,CELL,CELL,x-ANCHOR_X*scale,y-ANCHOR_Y*scale,CELL*scale,CELL*scale);
  };
  draw(event.at,ratio,opacity*(event.destination&&progress>=.42?.45:event.type==='mist'?.78:1),event.type==='weaken'?progress*size*.47:0);
  if(event.destination&&(progress>=.42||reducedMotion))draw(event.destination,.85*size/64,opacity);
 }
 ctx.restore();
}
