export const DAMAGE_DURATION=850;
export function queueDamage(current,events,time){
 const live=current.filter(p=>time-p.time<DAMAGE_DURATION).map(p=>({...p}));
 for(const e of events){
  const stack=live.filter(p=>p.x===e.x&&p.y===e.y).length;
  live.push({...e,time,stack});
 }
 return live.slice(-64);
}
export function damageFrame(p,time,{reducedMotion=false}={}){
 const elapsed=time-p.time,progress=Math.max(0,elapsed/DAMAGE_DURATION);
 const stack=(p.stack||0)*22;
 const hop=reducedMotion?0:7*Math.sin(Math.min(1,Math.max(0,elapsed)/100)*Math.PI/2);
 return {alive:elapsed>=0&&progress<1,alpha:elapsed<0?0:Math.max(0,Math.min(1,(DAMAGE_DURATION-elapsed)/300)),rise:stack+hop};
}
