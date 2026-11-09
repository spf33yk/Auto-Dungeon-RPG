export const DAMAGE_DURATION=850;
export function queueDamage(current,events,time){
 const live=current.filter(p=>time-p.time<DAMAGE_DURATION);
 for(const e of events){
  const stack=live.filter(p=>p.x===e.x&&p.y===e.y).length;
  live.push({...e,time,stack});
 }
 return live.slice(-64);
}
export function damageFrame(p,time,{reducedMotion=false}={}){
 const elapsed=time-p.time,progress=Math.max(0,elapsed/DAMAGE_DURATION);
 return {alive:elapsed>=0&&progress<1,alpha:elapsed<0?0:(!reducedMotion&&elapsed>690&&Math.floor((elapsed-690)/50)%2?0:Math.min(1,(1-progress)*4)),rise:reducedMotion?0:8*Math.sin(Math.min(1,Math.max(0,elapsed)/260)*Math.PI/2)+Math.max(0,elapsed-260)*.017+(p.stack||0)*13};
}
