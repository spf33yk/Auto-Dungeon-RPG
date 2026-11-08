// Presentation-only enemy attacks. Stable actor references distinguish identical species.
export const enemyAttackDuration=speed=>Math.min(360,300/Math.max(.5,Number.isFinite(speed)?speed:1));
export function queueEnemyAttacks(current,events,enemies,time,duration=300){
 let result=current.filter(a=>enemies.includes(a.actor)&&time-a.time<a.duration);
 for(const event of events||[]){if(!event.hero||!event.source)continue;const actor=enemies.find(e=>e.x===event.source.x&&e.y===event.source.y);if(!actor)continue;result=result.filter(a=>a.actor!==actor);result.push({actor,from:{...event.source},to:{x:event.x,y:event.y},time,duration,skill:event.skill===true});}
 return result;
}
export function enemyAttackFrame(attack,time,{size=64,reducedMotion=false}={}){
 const p=Math.max(0,(time-attack.time)/attack.duration),alive=p<1,dx=attack.to.x-attack.from.x,dy=attack.to.y-attack.from.y,length=Math.hypot(dx,dy)||1;
 let amount=0;if(alive&&!reducedMotion){if(p<.2)amount=-.05*Math.sin(p/.2*Math.PI/2);else if(p<.45)amount=-.05+.27*(1-Math.pow(1-(p-.2)/.25,3));else amount=.22*Math.pow(1-(p-.45)/.55,2);}
 const effectOpacity=!alive?0:reducedMotion?.45:p<.25||p>.8?0:Math.sin((p-.25)/.55*Math.PI);
 return {alive,offsetX:amount===0?0:dx/length*size*amount,offsetY:amount===0?0:dy/length*size*amount,effectOpacity};
}
export function enemyAttackPresentation(enemy,attacks,time,options){const attack=attacks.find(a=>a.actor===enemy);return attack?enemyAttackFrame(attack,time,options):{alive:false,offsetX:0,offsetY:0,effectOpacity:0};}
export function drawEnemyAttackEffect(ctx,attack,frame,size=64){if(!frame.alive||frame.effectOpacity<=0)return;const dx=attack.to.x-attack.from.x,dy=attack.to.y-attack.from.y,length=Math.hypot(dx,dy)||1,unit=size/40;
 ctx.save();ctx.translate((attack.to.x+.5)*size-dx/length*size*.22,(attack.to.y+.45)*size-dy/length*size*.15);ctx.rotate(Math.atan2(dy,dx));ctx.globalAlpha*=frame.effectOpacity;
 ctx.fillStyle=attack.actor.boss?'#c79a47':'#b66a51';for(const y of [-4,0,4])for(let i=0;i<4;i++)ctx.fillRect((-4+i*2)*unit,(y-2+i)*unit,3*unit,2*unit);
 ctx.fillStyle=attack.actor.boss?'#ffe5a5':'#f4d7b8';for(const y of [-4,0,4])for(let i=0;i<4;i++)ctx.fillRect((-4+i*2)*unit,(y-2+i)*unit,2*unit,unit);ctx.restore();
}
