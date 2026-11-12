// Shared trap rules for the live engine and cloned forecasts. Timers use floor steps.
export const TRAPS=Object.freeze([
 {id:'spike',name:'棘罠'}, {id:'teleport',name:'転移罠'},
 {id:'snare',name:'拘束罠'}, {id:'weaken',name:'衰弱罠'},
 {id:'alarm',name:'警報罠'}, {id:'mist',name:'霧罠'}
]);
export const trapType=t=>TRAPS.some(k=>k.id===t?.type)?t.type:'spike';
export const trapActive=(s,actor,kind)=>(actor||s).trapStatus?.[kind]>=s.steps;
export const trapAttackFactor=(s,actor)=>trapActive(s,actor,'weaken')?.7:1;
export const trapSightPenalty=(s,actor)=>trapActive(s,actor,'mist')?2:0;
export function rollTrap(rng){return TRAPS[Math.floor(rng()*TRAPS.length)].id;}
export function validTraps(s){
 const validAlarm=a=>a===undefined||a&&Number.isInteger(a.x)&&Number.isInteger(a.y)&&Boolean(s.grid?.[a.y]?.[a.x])&&Number.isSafeInteger(a.until)&&a.until>=0;
 const validActor=a=>!a||(validAlarm(a.trapAlarm)&&(a.trapContact===undefined||a.trapContact===null||typeof a.trapContact==='string'&&/^\d+,\d+$/.test(a.trapContact))&&(a.trapStatus===undefined||a.trapStatus&&typeof a.trapStatus==='object'&&!Array.isArray(a.trapStatus)&&Object.entries(a.trapStatus).every(([k,v])=>['snare','weaken','mist'].includes(k)&&Number.isSafeInteger(v)&&v>=0)));
 return Array.isArray(s.traps)&&s.traps.every(t=>t&&Number.isInteger(t.x)&&Number.isInteger(t.y)&&s.grid?.[t.y]?.[t.x]&&typeof t.spent==='boolean'&&typeof t.revealed==='boolean'&&(t.type===undefined||TRAPS.some(k=>k.id===t.type)))&&validActor(s)&&(s.enemies||[]).every(validActor);
}
export function triggerTrap(s,enemy,api){
 const actor=enemy||s.player,owner=enemy||s,pos=actor.x+','+actor.y;
 if(owner.trapContact===pos)return false;
 owner.trapContact=pos;
 const trap=s.traps?.find(t=>!t.spent&&t.x===actor.x&&t.y===actor.y);
 if(!trap){owner.trapContact=null;return false;}
 trap.revealed=true;
 const type=trapType(trap),name=TRAPS.find(t=>t.id===type).name,label=enemy?enemy.name:'骸';
 // One break roll per activation, even when protection cancels the effect.
 trap.spent=api.rng()<.5;
 const pass=!enemy&&api.protected?.();
 if(!enemy)s.trapTriggers=(s.trapTriggers||0)+1;
 const status=owner.trapStatus??={};
 let effect='';
 if(pass)effect='罠の効果を無効化した。';
 else if(type==='spike'){
  const damage=Math.max(1,Math.ceil((enemy?(enemy.maxHp??enemy.hp):api.maxHp())*.08));
  api.damage(enemy,damage);effect='棘でダメージを受けた。';
 }else if(type==='teleport'){
  const cells=[];
  for(let y=1;y<s.grid.length-1;y++)for(let x=1;x<s.grid[y].length-1;x++)if(s.grid[y][x]&&(x!==actor.x||y!==actor.y)&&(x!==s.stairs.x||y!==s.stairs.y)&&!s.items.some(i=>i.x===x&&i.y===y)&&!s.enemies.some(e=>e!==enemy&&e.x===x&&e.y===y)&&(!enemy||s.player.x!==x||s.player.y!==y))cells.push({x,y});
  if(cells.length){Object.assign(actor,cells[Math.floor(api.rng()*cells.length)]);owner.trapContact=actor.x+','+actor.y;effect='別の場所へ転移した。';}else effect='転移先がなかった。';
 }else if(type==='snare'){status.snare=s.steps+3;effect='次の3ターン、移動できない。';}
 else if(type==='weaken'){status.weaken=s.steps+5;effect='次の5ターン、攻撃力が30%低下する。';}
 else if(type==='mist'){status.mist=s.steps+5;effect='次の5ターン、視界が2マス狭くなる（最低2）。';}
 else {
  for(const e of s.enemies)if(e!==enemy&&!e.boss&&Math.abs(e.x-actor.x)+Math.abs(e.y-actor.y)<=8){e.aggro=true;e.trapAlarm={x:actor.x,y:actor.y,until:s.steps+5};}
  effect='周囲8マスの通常敵を、音の位置へ引き寄せた。';
 }
 api.onEffect?.({
  type,hero:!enemy,at:{x:trap.x,y:trap.y},
  destination:actor.x!==trap.x||actor.y!==trap.y?{x:actor.x,y:actor.y}:null
 });
 api.log(s,label+'が'+name+'を踏んだ。'+effect+(trap.spent?' 罠は壊れた。':''),enemy?'':'bad');
 return true;
}
