// Optional presentation events. No state/save/RNG mutation.
export function captureSkillCast(s,actor=null){return {side:actor?'enemy':'hero',from:{x:(actor||s.player).x,y:(actor||s.player).y},used:new Set(s.themeState?.used||[]),damageIndex:s.damageEvents?.length||0};}
export function collectSkillCast(s,before,id,actor=null){
 if(before.used.has(id)||!s.themeState?.used?.includes(id))return null;
 const p=actor||s.player,targets=[],seen=new Set();
 for(const d of (s.damageEvents||[]).slice(before.damageIndex)){if(Boolean(d.hero)!==(before.side==='enemy'))continue;const key=d.x+','+d.y;if(!seen.has(key)){seen.add(key);targets.push({x:d.x,y:d.y});}}
 return {id,side:before.side,from:{x:before.from.x,y:before.from.y},caster:{x:p.x,y:p.y},targets};
}
