import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,normalizeSave,validateSave,tick,makeOrder,beginExploration,attackEnemy,dropFromEnemy,grantReward,rollEnemyDrop,random,nextRandom,enemyDropTables,rewardDefinitions,codexRows,addOrder,orderUnlocked,makeFloor,stats,monsters,W,H} from './engine.js';

function arena(seed=1){const s=newGame(seed);s.grid=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>Number(x>0&&x<W-1&&y>0&&y<H-1)));s.seen=s.grid.map(r=>r.map(()=>true));s.visited=s.grid.map(r=>r.map(()=>false));s.player={x:5,y:5};s.stairs={x:25,y:18};s.enemies=[];s.items=[];s.traps=[];s.gimmick={id:'none'};s.phase='explore';s.orders=[makeOrder('stairs')];return s;}
function foe(s,{hp=1,defense=0}={}){const e={...monsters[0],baseId:monsters[0].id,x:6,y:5,hp,maxHp:hp,defense,attack:1,aggro:true};s.enemies.push(e);return e;}

test('drop failure consumes only the first draw; success uses a second weighted draw',()=>{
 const tables={test:{rate:.4,entries:[{type:'key',weight:1},{type:'reward',id:'mend',weight:3}]}};
 let calls=0;assert.equal(rollEnemyDrop('test',()=>{calls++;return .4;},tables),null);assert.equal(calls,1);
 for(const [pick,type] of [[0,'key'],[.2499,'key'],[.25,'reward'],[.999,'reward']]){const draws=[.399,pick];assert.equal(rollEnemyDrop('test',()=>draws.shift(),tables).type,type);assert.equal(draws.length,0);}
 assert.equal(rollEnemyDrop('unknown',()=>{throw Error('must not draw');}),null);
});

test('each enemy has a valid configurable table and rare distant gear remains possible',()=>{
 for(const m of monsters){const table=enemyDropTables[m.id];assert.ok(table.rate>0&&table.rate<=1);assert.ok(table.entries.every(e=>e.weight>0));assert.ok(Math.abs(table.entries.reduce((n,e)=>n+e.weight,0)-100)<1e-9);}
 const pool=enemyDropTables['enemy-0-0'].entries;assert.ok(pool.find(e=>e.id==='weapon-9').weight>0);assert.ok(pool.find(e=>e.id==='weapon-0').weight>pool.find(e=>e.id==='weapon-9').weight);
 for(const [id,rate] of [['enemy-0-0',.22],['enemy-0-1',.30],['boss-b20',1]]){let hits=0,keys=0,mends=0;const rng=random(123);for(let i=0;i<20000;i++){const d=rollEnemyDrop(id,rng);if(d){hits++;if(d.type==='key')keys++;if(d.id==='mend')mends++;}}assert.ok(Math.abs(hits/20000-rate)<.015);assert.ok(Math.abs(keys/hits-(rate===1?.2:.12))<.025);assert.ok(Math.abs(mends/hits-(.01))<.015);}
});

test('locked chests consume one key only on opening; acquired combat skill works immediately',()=>{
 const s=arena();s.stairs={...s.player};s.items=[{...s.player,type:'chest',locked:true,rewardId:'critical'}];tick(s);assert.equal(s.keys,0);assert.equal(s.items.length,1);assert.deepEqual(s.abilities,[]);
 s.phase='explore';s.keys=1;tick(s);assert.equal(s.keys,0);assert.equal(s.items.length,0);assert.deepEqual(s.abilities,['critical']);assert.ok(s.profile.skills.includes('critical'));const shards=s.shards;tick(s);assert.equal(s.shards,shards);
});

test('locked chests are skipped by collection rules without keys and revisited after a key',()=>{
 const s=arena();s.orders=['collect-items','stairs'].map(makeOrder);s.items=[{x:5,y:4,type:'chest',locked:true,rewardId:'leech'},{x:6,y:5,type:'key'}];tick(s);assert.deepEqual(s.player,{x:6,y:5});assert.equal(s.keys,1);for(let i=0;i<4&&!s.abilities.length;i++)tick(s);assert.ok(s.abilities.includes('leech'));assert.equal(s.keys,0);
});

test('ground gear is acquired and registered, herbs heal and fragments are common pickups',()=>{
 const s=arena();s.stairs={...s.player};for(const item of [{type:'gear',gear:{baseId:'weapon-2',plus:1,identified:true,cursed:false}},{type:'herb'},{type:'fragment'},{type:'reward',rewardId:'mend'}]){s.phase='explore';s.hp=10;s.items=[{...s.player,...item}];const shards=s.shards;tick(s);if(item.type==='herb')assert.equal(s.hp,20);if(item.type==='fragment')assert.equal(s.shards,shards+3+8);}
 assert.ok(s.profile.equipment.includes('weapon-2'));assert.ok(s.abilities.includes('mend'));assert.ok(s.profile.skills.includes('mend'));
});

test('duplicates give five fragments without stacking; new journeys keep only codex records',()=>{
 const s=arena();for(const r of rewardDefinitions){assert.equal(grantReward(s,r.id),true);const shards=s.shards;assert.equal(grantReward(s,r.id),false);assert.equal(s.shards,shards+5);}assert.equal(codexRows(s,'skills').filter(r=>r.known).length,6);const fresh=newGame(2,s.profile);assert.deepEqual(fresh.abilities,[]);assert.deepEqual(fresh.unlockedOrders,[]);assert.equal(fresh.keys,0);assert.equal(codexRows(fresh,'skills').filter(r=>r.known).length,6);assert.ok(codexRows(fresh,'skills').every(r=>!r.owned));
});

test('special orders must be obtained and configured in an available slot',()=>{
 const s=arena();s.phase='prepare';assert.equal(orderUnlocked(s,'tactics'),true);assert.equal(addOrder(s,'warp'),false);grantReward(s,'warp');assert.equal(addOrder(s,'warp'),true);assert.equal(s.orders.length,2);grantReward(s,'avoid-traps');assert.equal(addOrder(s,'avoid-traps'),false);
});

test('warp is once per floor, preserves saved usage, and resets on the next floor',()=>{
 const s=arena(42);grantReward(s,'warp');s.orders=[makeOrder('warp')];s.hp=10;foe(s,{hp:999});const before={...s.player};tick(s);assert.equal(s.warped,true);assert.notDeepEqual(s.player,before);assert.ok(s.grid[s.player.y][s.player.x]);assert.ok(!s.enemies.some(e=>e.x===s.player.x&&e.y===s.player.y));assert.equal(normalizeSave(s).warped,true);s.floor=2;makeFloor(s);assert.equal(s.warped,false);
});

test('trap avoidance protects only when the acquired order is equipped',()=>{
 const s=arena();grantReward(s,'avoid-traps');s.stairs={...s.player};s.traps=[{...s.player,revealed:true,spent:false}];s.orders=[makeOrder('avoid-traps'),makeOrder('stairs')];tick(s);assert.equal(s.hp,54);assert.equal(s.traps[0].spent,false);s.phase='explore';s.orders=[makeOrder('stairs')];tick(s);assert.equal(s.hp,49);assert.equal(s.traps[0].spent,true);
});

test('regeneration is acquired from drops and fires once before enemy attacks',()=>{
 const s=arena();grantReward(s,'mend');s.hp=1;foe(s,{hp:999});tick(s);assert.equal(s.mended,true);assert.equal(s.hp,22);s.hp=1;tick(s);assert.equal(s.hp,0);assert.equal(s.phase,'dead');
});

test('critical and extra strikes are probabilistic, bounded and never duplicate a kill',()=>{
 let critical=0,double=0;for(let seed=0;seed<1000;seed++){const s=arena(seed);s.abilities=['critical','double-strike'];const e=foe(s,{hp:1000});attackEnemy(s,e);if(s.logs.some(l=>l.text.startsWith('会心')))critical++;if(s.logs.some(l=>l.text.startsWith('追撃')))double++;assert.ok(e.hp>=1000-stats(s).attack*4);}
 assert.ok(critical>65&&critical<160);assert.ok(double>25&&double<85);
 const s=arena(123);s.abilities=['double-strike'];const e=foe(s);attackEnemy(s,e);const snapshot=JSON.stringify(s);attackEnemy(s,e);assert.equal(s.kills,1);assert.equal(JSON.stringify(s),snapshot);
});

test('leech heals from actual damage, never overkill and never beyond maximum HP',()=>{
 const s=arena();s.abilities=['leech'];s.hp=10;attackEnemy(s,foe(s,{hp:1}));assert.equal(s.hp,10);s.levels.power=5;s.gear.weapon={baseId:'weapon-9',plus:3,identified:true,cursed:false};s.hp=53;attackEnemy(s,foe(s,{hp:100}));assert.equal(s.hp,54);
});

test('saved RNG state produces identical future loot and combat after reload',()=>{
 const s=arena(77);s.abilities=['critical','double-strike','leech'];s.hp=20;nextRandom(s);const restored=normalizeSave(JSON.parse(JSON.stringify(s)));for(let i=0;i<20;i++){attackEnemy(s,foe(s,{hp:20}));attackEnemy(restored,foe(restored,{hp:20}));}assert.deepEqual(restored,s);
});

test('v8 migration refunds retired purchases once and keeps legacy boxes and records',()=>{
 const old=arena();old.version=8;old.levels.tactics=1;old.levels.mend=1;old.items=[{x:7,y:5,type:'chest',gear:{baseId:'weapon-3',plus:0,identified:true,cursed:false}}];for(const k of ['abilities','unlockedOrders','keys','rngState','warped'])delete old[k];delete old.profile.skills;const before=JSON.stringify(old),s=normalizeSave(old);assert.equal(JSON.stringify(old),before);assert.equal(s.version,9);assert.equal(s.shards,old.shards+18);assert.ok(s.abilities.includes('mend'));assert.ok(s.orders.some(o=>o.id==='tactics'));assert.equal(s.items[0].locked,false);assert.equal(s.levels.tactics,undefined);assert.equal(s.levels.mend,undefined);assert.deepEqual(normalizeSave(s),s);
 const full=structuredClone(old);full.orders=['stairs','collect-items'].map(makeOrder);assert.equal(normalizeSave(full).orders.length,2);
});

test('save validator rejects corrupt new loot state and unearned special orders',()=>{
 for(const mutate of [s=>s.keys=-1,s=>s.rngState=NaN,s=>s.abilities=['unknown'],s=>s.orders=[makeOrder('warp')],s=>s.items=[{x:5,y:5,type:'chest',locked:true,rewardId:'unknown'}]]){const s=arena();mutate(s);assert.equal(validateSave(s),false);assert.equal(normalizeSave(s),null);}
});

test('when a visible enemy blocks loot, basic approach breaks the chase oscillation',()=>{
 const s=arena();s.player={x:4,y:4};const e=foe(s,{hp:100});e.x=6;e.y=4;s.orders=[makeOrder('chests')];s.keys=1;s.items=[{x:6,y:4,type:'chest',locked:true,rewardId:'critical'}];tick(s);assert.deepEqual(s.player,{x:5,y:4});assert.equal(s.intent,'進路の敵に向き合う');tick(s);assert.ok(e.hp<100);
});
