// 居座り対策の仮バランス。総出現数は無制限、同時存在数だけ制限する。
export const REINFORCEMENTS={start:300,interval:60,tierEvery:240,maxAlive:16,minDistance:6};
export function spawnReinforcement(s,{canSee,rng,pool}){
 const c=REINFORCEMENTS,interval=c.interval;
 if(s.phase!=='explore'||s.debugUsed&&s.debugNoReinforcements||s.augmentOffer||s.steps<c.start||(s.steps-c.start)%interval!==0||s.enemies.length>=c.maxAlive)return null;
 const occupied=p=>s.enemies.some(e=>e.x===p.x&&e.y===p.y)||s.items.some(i=>i.x===p.x&&i.y===p.y)||(s.traps||[]).some(t=>t.x===p.x&&t.y===p.y)||(s.obstacles||[]).some(o=>o.x===p.x&&o.y===p.y)||(s.stairs.x===p.x&&s.stairs.y===p.y);
 const candidates=[];for(let y=0;y<s.grid.length;y++)for(let x=0;x<s.grid[y].length;x++){const p={x,y};if(s.grid[y][x]&&Math.abs(x-s.player.x)+Math.abs(y-s.player.y)>=c.minDistance&&!canSee(s,x,y)&&!occupied(p))candidates.push(p);}
 if(!candidates.length||!pool.length)return null;
 const point=candidates[Math.min(candidates.length-1,Math.floor(rng()*candidates.length))],base=pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))],tier=Math.floor((s.steps-c.start)/c.tierEvery);
 const hp=Math.ceil(base.hp*(1+tier*.20));
 const enemy={...base,...point,id:base.id,baseId:base.id,name:base.name+'（増援）',hp,maxHp:hp,attack:Math.ceil(base.attack*(1+tier*.15)),defense:base.defense+Math.floor(tier/2),aggro:true,reinforcement:true,reinforcementTier:tier};
 s.enemies.push(enemy);return enemy;
}
