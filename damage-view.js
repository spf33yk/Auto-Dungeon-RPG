export const DAMAGE_DURATION=850;
export function queueDamage(current,events,time){
 const live=current.filter(p=>time-p.time<DAMAGE_DURATION);
 for(const e of events){
  const stack=live.filter(p=>p.x===e.x&&p.y===e.y).length;
  live.push({...e,time,stack});
 }
 return live.slice(-64);
}
export function damageFrame(p,time){
 const progress=Math.max(0,(time-p.time)/DAMAGE_DURATION);
 return {alive:progress<1,alpha:Math.min(1,(1-progress)*3),rise:progress*14+p.stack*9};
}
