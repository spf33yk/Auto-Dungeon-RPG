import {dirname} from 'node:path';
import fs from 'node:fs';import{pathToFileURL}from'node:url';
import{newGame,beginExploration,tick,ascend,equipBest,upgrade,stats,orderCapacity,createCardRule,validCardRule,validateSave,makeFloor,LAST_FLOOR}from'../engine.js';
import{cardOwned}from'../card-access.js';
const has=(s,kind,id)=>cardOwned(s,kind,id);
export function prepareAuditRun(s,policy){
 equipBest(s);const candidate=[];
 const add=(kind,id,conditions=[])=>{const rule=createCardRule('self',conditions,kind,id);if(validCardRule(s,rule))candidate.push(rule);};
 const below=value=>has(s,'condition','hp-below')?[{id:'hp-below',value}]:[];
 add('skill','mend',below(60));if(has(s,'condition','hp-below'))add('skill','warp',below(25));
 if(has(s,'condition','hp-below'))add('action','heal-item',below(65));
 if(policy==='loot'){
  if(s.profile.normalClears&&s.floor===16)add('action','letter');
  add('action','chests');add('action','collect-items');
 }
 add('skill','leech');add('skill','critical');add('skill','double-strike');add('action','avoid-traps');
 const wanted=Math.min(policy==='loot'?6:4,candidate.length+1);
 if(orderCapacity(s)<wanted&&s.levels.guard+s.levels.power+s.levels.vitality>=3)upgrade(s,'commandSlots');
 let changed=true;while(changed){changed=false;for(const id of ['guard','power','vitality'])if(upgrade(s,id))changed=true;}
 if(s.levels.guard===4&&s.levels.power===5&&s.levels.vitality===5&&s.levels.scout<2)upgrade(s,'scout');
 const rules=candidate.slice(0,orderCapacity(s)-1);rules.push(createCardRule());
 if(!rules.every(r=>validCardRule(s,r)))throw Error('Invalid card use');s.orders=rules;s.mode='custom';
 if(!validateSave(s))throw Error('Invalid prepared state');
}
export function simulateAuditRun(seed,policy,profile,{floorCap=2500}={}){
 const s=newGame(seed,profile),floors=[];let capTrace=[];
 while(!['dead','ending'].includes(s.phase)){
  if(s.phase==='prepare')prepareAuditRun(s,policy);
  if(!beginExploration(s))throw Error('Unexpected phase '+s.phase);
  const start=s.turn,hp=s.hp;
  capTrace=[];while(s.phase==='explore'&&s.turn-start<floorCap){tick(s);if(s.turn-start>=floorCap-32)capTrace.push({turn:s.turn,x:s.player.x,y:s.player.y,hp:s.hp,intent:s.intent,remainingEnemies:s.enemies.length,remainingItems:s.items.length,visited:s.visited.flat().filter(Boolean).length});}
  floors.push({basement:31-s.floor,turns:s.turn-start,phase:s.phase,hpStart:hp,hpEnd:s.hp,maxHp:stats(s).maxHp,level:s.level,attack:stats(s).attack,defense:stats(s).defense,cards:s.ownedCards.length,boss:s.bossFloor,letter:s.letter});
  if(s.phase==='explore')break;
  if(s.phase==='cleared')ascend(s);
 }
 return {seed,policy,phase:s.phase,basement:31-s.floor,turns:s.turn,kills:s.kills,letter:s.letter,trueEnding:s.profile.trueEnding,normalClears:s.profile.normalClears,debugUsed:Boolean(s.debugUsed),floors,capTrace:s.phase==='explore'?capTrace:[],profile:s.profile};
}
export function branchProbe(){return [false,true].map(letter=>{const s=newGame(71);s.floor=LAST_FLOOR;makeFloor(s);s.phase='cleared';s.profile.normalClears=1;s.letter=letter;ascend(s);return {letter,phase:s.phase,normalClears:s.profile.normalClears,trueEnding:s.profile.trueEnding};});}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const samples=Number(process.argv[2]||12),out=process.argv[3]||'test-results/clearability-audit.json',runs=[],secondRuns=[];if(!Number.isInteger(samples)||samples<1||samples>1000)throw Error('samples must be 1..1000');fs.mkdirSync(dirname(out),{recursive:true});const start=performance.now();
 for(const policy of ['direct','loot'])for(let i=0;i<samples;i++){
  const seed=(1001+104729*i)%10000000,result=simulateAuditRun(seed,policy);runs.push(result);
  if(result.phase==='ending')secondRuns.push(simulateAuditRun((seed+10000019)%10000000,policy,result.profile));
  fs.writeFileSync(out,JSON.stringify({samples,elapsedSeconds:(performance.now()-start)/1000,branchProbe:branchProbe(),runs,secondRuns},null,2));
  console.log(JSON.stringify({policy,trial:i+1,phase:result.phase,basement:result.basement,turns:result.turns,seconds:Math.round((performance.now()-start)/1000)}));
 }
}
