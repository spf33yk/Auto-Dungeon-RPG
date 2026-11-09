// Presentation state only. This module never changes game state, cells, HP or RNG.
export const COMBAT_FEEDBACK={flashMs:1000/30,knockPx:6,knockMs:8000/60,returnMs:200,shakePx:1.5,shakeMs:10000/60,particles:6,particleMs:360,sparkMs:4000/60};
export const hitStopMs=speed=>speed>=4?0:speed>=2?1000/60:50;
export const createCombatFeedback=(time=0)=>({time,actorTime:time,holdUntil:time,events:[],sequence:0});
const point=p=>({x:p.x,y:p.y});
export function queueCombatFeedback(f,events,roster,s,{speed=1,heroDuration=300,enemyDuration=300}={}){
 let stopAssigned=false;const seen=new Set();
 for(const e of events||[]){if(!(e.damage>0))continue;const from=e.source,physical=e.impact==='melee'&&!e.skill,trap=e.impact==='trap'||!from,delay=trap?0:physical?(e.hero?enemyDuration*.45:heroDuration*.35):0,target=e.hero?null:roster.find(r=>r.x===e.x&&r.y===e.y)?.actor||s.enemies.find(r=>r.x===e.x&&r.y===e.y),key=[e.hero,e.x,e.y,from?.x,from?.y].join(':'),primary=!seen.has(key);seen.add(key);
 const stop=!trap&&!stopAssigned?hitStopMs(speed):0;if(!trap)stopAssigned=true;
 f.events.push({...e,heroDuration,enemyDuration,at:point(e),from:from?point(from):null,target,physical,trap,primary,stop,contact:f.actorTime+delay,time:null,id:++f.sequence});}
 f.events=f.events.slice(-64);return f;
}
export function advanceCombatFeedback(f,time,{reducedMotion=false}={}){
 const end=Math.max(f.time,time),fired=[];let guard=0;
 while(f.time<end&&guard++<256){
  if(f.time<f.holdUntil&&!reducedMotion){f.time=Math.min(end,f.holdUntil);continue;}
  const next=f.events.filter(e=>e.time===null).sort((a,b)=>a.contact-b.contact)[0],distance=next?Math.max(0,next.contact-f.actorTime):Infinity,dt=Math.min(end-f.time,distance);
  f.time+=dt;f.actorTime+=dt;
  if(next&&distance<=dt){const group=f.events.filter(e=>e.time===null&&e.contact<=f.actorTime+1e-7);for(const e of group){e.time=f.time;fired.push(e);}if(!reducedMotion)f.holdUntil=Math.max(f.holdUntil,f.time+Math.max(0,...group.map(e=>e.stop)));}
  else break;
 }
 // Contact at time zero (traps and skill hits) also emits when the frame has no elapsed time.
 for(const e of f.events)if(e.time===null&&e.contact<=f.actorTime+1e-7){e.time=f.time;fired.push(e);if(!reducedMotion)f.holdUntil=Math.max(f.holdUntil,f.time+e.stop);}
 f.events=f.events.filter(e=>e.time===null||f.time-e.time<850);return fired;
}
export function hitPresentation(f,actor,{hero=false,size=64,reducedMotion=false}={}){
 let offsetX=0,offsetY=0,flash=false,opacity=1;
 for(const e of f.events){if(e.hero!==hero||!hero&&e.target!==actor||e.time===null||e.trap||!e.primary)continue;const age=f.time-e.time;if(age<0)continue;flash ||= !hero&&!reducedMotion&&age<COMBAT_FEEDBACK.flashMs;
  if(!reducedMotion&&e.from){const dx=e.at.x-e.from.x,dy=e.at.y-e.from.y,length=Math.hypot(dx,dy)||1,motion=Math.max(0,f.actorTime-e.contact),q=Math.min(1,motion/COMBAT_FEEDBACK.knockMs);let amount=COMBAT_FEEDBACK.knockPx*(1-(1-q)**3);if(motion>COMBAT_FEEDBACK.knockMs)amount*=Math.max(0,1-(motion-COMBAT_FEEDBACK.knockMs)/COMBAT_FEEDBACK.returnMs)**2;offsetX+=dx/length*amount*size/64;offsetY+=dy/length*amount*size/64;}
 }
 const length=Math.hypot(offsetX,offsetY),max=COMBAT_FEEDBACK.knockPx*size/64;if(length>max){offsetX*=max/length;offsetY*=max/length;}
 return {offsetX,offsetY,flash,opacity};
}
export function combatShake(f,{enabled=true,reducedMotion=false,size=64}={}){
 if(!enabled||reducedMotion)return {x:0,y:0};const e=f.events.findLast(e=>e.time!==null&&!e.trap&&e.primary&&f.time-e.time<COMBAT_FEEDBACK.shakeMs);if(!e)return {x:0,y:0};const age=f.time-e.time,decay=(1-age/COMBAT_FEEDBACK.shakeMs)**2,a=COMBAT_FEEDBACK.shakePx*size/64*decay;return {x:Math.sin(age*.19+1)*a,y:Math.cos(age*.23)*a*.55};
}
export function feedbackGhosts(f,enemies){return [...new Set(f.events.filter(e=>!e.hero&&e.target&&!enemies.includes(e.target)&&(e.time===null||f.time-e.time<350)).map(e=>e.target))];}
export function ghostOpacity(f,actor){const hit=f.events.find(e=>e.target===actor&&e.time!==null);return hit?Math.max(0,1-Math.max(0,f.time-hit.time-50)/300):1;}
const star=(c,x,y,r)=>{c.beginPath();for(let i=0;i<8;i++){const a=-Math.PI/2+i*Math.PI/4,d=i%2?r*.24:r;const px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.fill();};
export function drawCombatFeedback(ctx,f,resolve,{size=64,reducedMotion=false}={}){
 if(reducedMotion)return;const scale=size/64;
 for(const e of f.events){if(e.time===null||e.trap||!e.primary)continue;const age=f.time-e.time,at=resolve(e);if(!at||age<0)continue;ctx.save();
  if(age<COMBAT_FEEDBACK.sparkMs){ctx.fillStyle='#fff0c3';star(ctx,at.x,at.y,6*scale*(1-age/COMBAT_FEEDBACK.sparkMs*.35));}
  if(age<COMBAT_FEEDBACK.particleMs){const q=age/COMBAT_FEEDBACK.particleMs;ctx.globalAlpha=.78*(1-q);ctx.fillStyle=e.hero?'#a28d79':e.target?.type==='slime'?'#a9b78e':'#b1b195';for(let i=0;i<COMBAT_FEEDBACK.particles;i++){const n=((e.id*97+i*67)%997)/997,a=-2.7+n*3.35,v=28+((i*37+e.id*11)%26),r=(i%3?1:2)*scale;ctx.beginPath();ctx.ellipse(at.x+Math.cos(a)*v*q*scale,at.y+(Math.sin(a)*v*q+27*q*q)*scale,r,r,0,0,Math.PI*2);ctx.fill();}}
  ctx.restore();
 }
}
export function drawCombatTrails(ctx,f,resolve,{size=64,reducedMotion=false}={}){
 if(reducedMotion)return;for(const e of f.events){if(!e.physical||e.trap||!e.primary||!e.from)continue;const progress=(f.actorTime-(e.contact-(e.hero?.45:.35)*(e.hero?e.enemyDuration||300:e.heroDuration||300)))/(e.hero?e.enemyDuration||300:e.heroDuration||300);if(progress<=.22||progress>=.73)continue;const source=resolve(e,true);if(!source)continue;const a=Math.atan2(e.at.y-e.from.y,e.at.x-e.from.x),q=(progress-.22)/.51,end=-1.3+2.45*q,start=Math.max(-1.3,end-.72),scale=size/64;ctx.save();ctx.translate(source.x,source.y);ctx.rotate(a);ctx.globalAlpha=.7*(1-q*.7);ctx.strokeStyle='#f8efd2';ctx.lineWidth=2*scale;ctx.beginPath();ctx.arc(0,0,32*scale,start,end);ctx.stroke();ctx.restore();}
}
