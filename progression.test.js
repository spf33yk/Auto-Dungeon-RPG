import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,stats,gainExperience,experienceToNext,MAX_LEVEL,normalizeSave,validateSave,attackEnemy,monsters,tick,W,H,reveal,makeFloor,createCardRule} from './engine.js';
import {queueDamage,damageFrame,DAMAGE_DURATION} from './damage-view.js';

test('character levels use remaining experience and grow only HP, including multiple levels and cap',()=>{
 const s=newGame(123),before=stats(s);s.hp=20;
 assert.equal(s.level,1);assert.equal(experienceToNext(1),10);
 assert.equal(gainExperience(s,9),0);assert.equal(s.experience,9);
 assert.equal(gainExperience(s,1),1);assert.equal(s.level,2);assert.equal(s.experience,0);assert.equal(s.hp,23);assert.equal(stats(s).maxHp,before.maxHp+3);
 assert.equal(gainExperience(s,36),2);assert.equal(s.level,4);assert.equal(s.experience,1);assert.equal(s.hp,29);assert.equal(stats(s).attack,before.attack);assert.equal(stats(s).defense,before.defense);
 assert.equal(gainExperience(s,100000),MAX_LEVEL-4);assert.equal(s.experience,0);assert.equal(experienceToNext(s.level),0);assert.equal(gainExperience(s,10),0);
 assert.equal(gainExperience(s,-1),0);assert.equal(gainExperience(s,NaN),0);
 makeFloor(s);assert.equal(s.level,MAX_LEVEL);assert.equal(newGame(123,s.profile).level,1);
});
test('old save gains Lv1 without retroactive growth and v11 round-trips or rejects corrupt progression',()=>{
 const old=newGame(991);old.version=10;delete old.level;delete old.experience;old.kills=200;old.hp=21;
 const s=normalizeSave(old);assert.equal(s.level,1);assert.equal(s.experience,0);assert.equal(s.hp,21);assert.equal(s.version,13);
 for(const key of ['grid','gear','profile','shards','rngState','kills'])assert.deepEqual(s[key],old[key]);
 gainExperience(s,12);assert.ok(validateSave(s));assert.deepEqual(normalizeSave(s),s);
 for(const [level,experience]of [[0,0],[31,0],[1,-1],[1,10],[30,1],[1,Infinity]])assert.equal(normalizeSave({...s,level,experience}),null);
 assert.equal(normalizeSave({...s,damageEvents:[{damage:100}]}).damageEvents.length,0);
});
test('each defeated enemy grants experience once and each strike emits its own damage',()=>{
 const s=newGame(128);s.enemies=[];s.levels.power=5;s.experience=9;
 const e={...monsters[0],baseId:monsters[0].id,x:3,y:3,hp:1};s.enemies.push(e);
 attackEnemy(s,e);assert.equal(s.level,2);assert.equal(s.experience,2);assert.equal(s.damageEvents.length,1);assert.equal(s.damageEvents[0].hero,false);assert.equal(s.damageEvents[0].damage,stats(s).attack);
 attackEnemy(s,e);assert.equal(s.experience,2);assert.equal(s.damageEvents.length,1);
 s.abilities=['double-strike'];s.rngState=7;const target={...e,hp:1000};s.enemies=[target];s.damageEvents=[];
 let attempts=0;while(s.damageEvents.length<2&&attempts++<100){s.damageEvents=[];attackEnemy(s,target);}
 assert.equal(s.damageEvents.length,2);
});
test('multiple incoming hits and traps emit damage events and reset the next turn',()=>{
 const s=newGame(78);s.phase='explore';s.grid=Array.from({length:H},()=>Array(W).fill(1));s.seen=s.grid.map(r=>r.map(()=>true));s.visited=s.grid.map(r=>r.map(()=>true));s.player={x:5,y:5};s.stairs={x:25,y:20};s.items=[];s.gimmick={id:'none'};s.traps=[];s.enemies=[{...monsters[0],baseId:monsters[0].id,x:5,y:6,hp:100,attack:5,aggro:true,period:1},{...monsters[0],baseId:monsters[0].id,x:6,y:5,hp:100,attack:6,aggro:true,period:1}];reveal(s);
 tick(s);assert.equal(s.damageEvents.filter(e=>e.hero).length,2);assert.equal(s.damageEvents.length,3);
 s.enemies=[];s.abilities=['mend'];s.orders=[createCardRule('self',[],'skill','mend')];s.traps=[{...s.player,spent:false,revealed:true}];tick(s);assert.equal(s.damageEvents.length,1);assert.equal(s.damageEvents[0].hero,true);assert.equal(s.damageEvents[0].damage,Math.ceil(stats(s).maxHp*.08));
 tick(s);assert.deepEqual(s.damageEvents,[]);
});
test('damage labels stack, expire and preserve simultaneous lethal and multiple-target hits',()=>{
 const q=queueDamage([],[{x:1,y:1,damage:9},{x:1,y:1,damage:4},{x:2,y:1,damage:6}],100);
 assert.deepEqual(q.map(p=>p.stack),[0,1,0]);assert.equal(damageFrame(q[1],100).rise,9);assert.equal(damageFrame(q[0],100).alpha,1);
 assert.equal(damageFrame(q[0],100+DAMAGE_DURATION).alive,false);assert.deepEqual(queueDamage(q,[],100+DAMAGE_DURATION),[]);
});
