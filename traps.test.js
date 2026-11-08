import test from 'node:test';
import assert from 'node:assert/strict';
import{TRAPS,triggerTrap,trapActive,trapAttackFactor,trapSightPenalty,validTraps}from'./traps.js';
import{newGame,makeFloor,tick,stats,radius,normalizeSave,validateSave,createCardRule,monsters,W,H}from'./engine.js';
import{enemyAttack,executeEnemyCommand}from'./enemy-control.js';
import{themeState,skillCanRun}from'./theme-runtime.js';
import{forecastExploration,forecastSignature}from'./exploration-forecast.js';
function arena(){const s=newGame(808);s.floor=2;makeFloor(s);s.phase='explore';s.augmentStarted=true;s.augmentOffer=null;s.grid=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>+(x>0&&y>0&&x<W-1&&y<H-1)));s.seen=s.grid.map(r=>r.map(Boolean));s.visited=s.grid.map(r=>r.map(()=>false));s.player={x:5,y:5};s.stairs={x:20,y:5};s.items=[];s.enemies=[];s.obstacles=[];s.traps=[];s.gimmick={id:'none'};s.ownedCards.push('action:wait');s.profile.cards.push('action:wait');s.orders=[createCardRule('self',[],'action','wait')];return s;}
const enemy=(s,p={})=>{const e={...monsters[0],baseId:monsters[0].id,x:8,y:5,maxHp:100,hp:100,period:1,aggro:true,...p};s.enemies.push(e);return e;};
const place=(s,type,p=s.player)=>{const t={x:p.x,y:p.y,type,spent:false,revealed:true};s.traps.push(t);return t;};
function api(s,roll=.9){return {rng:()=>roll,maxHp:()=>100,log:()=>{},damage:(e,n)=>{if(e)e.hp-=n;else s.hp-=n;}};}
test('all six types affect hero and enemies; exactly 50% break boundary, no repeat while standing',()=>{
 for(const type of TRAPS.map(t=>t.id))for(const isEnemy of [false,true])for(const roll of [.49999,.5]){
  const s=arena(),e=isEnemy?enemy(s):null,t=place(s,type,e||s.player),before={...(e||s.player)};let rolls=0;const a=api(s,roll);a.rng=()=>{rolls++;return roll;};
  assert.equal(triggerTrap(s,e,a),true);assert.equal(t.spent,roll<.5);assert.equal(triggerTrap(s,e,a),false);assert.equal(rolls,type==='teleport'?2:1);
  if(type==='spike')assert.equal(isEnemy?e.hp:s.hp,isEnemy?92:46);
  if(type==='snare')assert.equal(trapActive(s,e,'snare'),true);
  if(type==='weaken')assert.equal(trapAttackFactor(s,e),.7);
  if(type==='mist')assert.equal(trapSightPenalty(s,e),2);
  if(type==='teleport'){assert.notDeepEqual({x:(e||s.player).x,y:(e||s.player).y},{x:before.x,y:before.y});assert.notDeepEqual(e||s.player,s.stairs);}
 }
});
test('surviving traps retrigger on re-entry, broken traps never trigger, teleport cannot chain',()=>{
 const s=arena(),t=place(s,'spike'),a=api(s);triggerTrap(s,null,a);s.player.x++;triggerTrap(s,null,a);s.player.x--;assert.equal(triggerTrap(s,null,a),true);assert.equal(s.hp,38);t.spent=true;s.trapContact=null;assert.equal(triggerTrap(s,null,a),false);
 const q=arena();place(q,'teleport');triggerTrap(q,null,api(q));place(q,'spike');assert.equal(triggerTrap(q,null,api(q)),false);
});
test('root lasts exactly next three turns, attacks remain possible, enemy manual movement obeys root',()=>{
 const s=arena();place(s,'snare');tick(s);const start={...s.player};s.orders=[];
 for(let i=0;i<3;i++){tick(s);assert.deepEqual(s.player,start);}
 tick(s);assert.notDeepEqual(s.player,start);
 const q=arena(),e=enemy(q,{x:6,y:5,attack:5});place(q,'snare',e);tick(q);const hp=q.hp;tick(q);assert.ok(q.hp<hp,'rooted enemy still attacks');const p={x:e.x,y:e.y};executeEnemyCommand(q,{actor:e,next:{x:7,y:5}},{log:()=>{}});assert.deepEqual({x:e.x,y:e.y},p);
});
test('weakening and mist apply to actual stats, expire, and cannot leak across floors',()=>{
 const s=arena(),a=stats(s).attack,r=radius(s),e=enemy(s),ea=enemyAttack(s,e);s.trapStatus={weaken:s.steps+5,mist:s.steps+5};e.trapStatus={weaken:s.steps+5,mist:s.steps+5};assert.equal(stats(s).attack,a*.7);assert.equal(enemyAttack(s,e),ea*.7);assert.equal(radius(s),Math.max(2,r-2));s.steps+=6;assert.equal(stats(s).attack,a);assert.equal(enemyAttack(s,e),ea);assert.equal(radius(s),r);s.trapStatus={snare:999};makeFloor(s);assert.deepEqual(s.trapStatus,{});
});
test('alarm lures nearby normal enemies to the sound, without spawning enemies or moving bosses',()=>{
 const s=arena(),near=enemy(s,{x:9,y:5,aggro:false}),far=enemy(s,{x:20,y:20,aggro:false}),boss=enemy(s,{x:7,y:5,boss:true,aggro:false});place(s,'alarm');const n=s.enemies.length;triggerTrap(s,null,api(s));assert.equal(s.enemies.length,n);assert.deepEqual(near.trapAlarm,{x:5,y:5,until:s.steps+5});assert.equal(far.aggro,false);assert.equal(boss.aggro,false);
});
test('live enemy spike death removes the actor and grants standard rewards once',()=>{
 const s=arena(),e=enemy(s,{x:12,y:5,hp:1,aggro:false});place(s,'spike',e);const kills=s.kills;tick(s);assert.ok(!s.enemies.includes(e));assert.equal(s.kills,kills+1);tick(s);assert.equal(s.kills,kills+1);
});
test('protection cancels non-damage traps once, rooted warp skills cannot be consumed, mist interrupts enemy tracking',()=>{
 const s=arena();place(s,'snare');themeState(s).trapPass=1;tick(s);assert.equal(trapActive(s,null,'snare'),false);assert.equal(themeState(s).trapPass,0);assert.equal(s.trapTriggers,1);
 s.trapStatus={snare:s.steps+3};assert.equal(skillCanRun(s,'homeward',{}),false);assert.equal(skillCanRun(s,'warp',{}),false);
 const q=arena(),e=enemy(q,{x:14,y:5,trapStatus:{mist:q.steps+5}});tick(q);assert.equal(e.x,14);q.steps+=6;tick(q);assert.equal(e.x,13);
 const invalid=structuredClone(q);invalid.enemies[0].trapAlarm={x:0,y:0,until:10};assert.equal(validTraps(invalid),false);
});
test('new and legacy saves preserve trap state; invalid timers/types rejected; forecast clones all effects',async()=>{
 const s=arena();const t=place(s,'weaken');tick(s);assert.equal(validateSave(s),true);const loaded=normalizeSave(s);assert.ok(loaded);assert.deepEqual(loaded.trapStatus,s.trapStatus);assert.equal(loaded.traps[0].spent,t.spent);const old=arena();place(old,'spike');delete old.traps[0].type;delete old.trapStatus;delete old.trapContact;assert.ok(normalizeSave(old));
 const bad=structuredClone(s);bad.traps[0].type='unknown';assert.equal(validTraps(bad),false);bad.traps[0].type='spike';bad.trapStatus.snare=-1;assert.equal(validateSave(bad),false);
 const before=JSON.stringify(s),sig=forecastSignature(s,1);await forecastExploration(s,{samples:1,maxTurns:10,yieldTask:async()=>{}});assert.equal(JSON.stringify(s),before);s.trapStatus.mist=s.steps+5;assert.notEqual(forecastSignature(s,1),sig);
});
