// Headless full journeys using only controls available in the current UI.
import fs from 'node:fs';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';import{dirname}from'node:path';import{pathToFileURL}from'node:url';
import{newGame,beginExploration,tick,ascend,equipBest,upgrade,stats,orderCapacity,createCardRule,validCardRule,validateSave,chooseAugment,chooseChestCard}from'../engine.js';
import{selectChestCategory}from'../card-inventory.js';import{cardByKey}from'../card-catalog.js';import{themedSkills,themedAugments}from'../build-themes.js';import{themeStars}from'../set-bonuses.js';
export const POLICIES=['direct','loot','build','control'];
const skillScore={mend:100,'small-prayer':95,'first-aid':90,fortress:89,breathe:85,'shield-stance':80,guard:79,'iron-stance':75,'shield-bash':72,bite:70,palm:68,'one-thought':65,frenzy:60,sweep:59,focus:55,'clear-mind':54,warp:45};
const augScore={leech:100,shell:95,undying:94,'first-shield':90,restful:85,desperate:80,critical:75,'double-strike':74,surrounded:70,moon:69,reserve:68,patience:65,ripen:64,blood:60,charge:55,hunter:54,pity:53};
const owns=(s,key)=>s.ownedCards.includes(key),themeCount=(s,id)=>themedSkills.filter(k=>k.themeId===id&&owns(s,'skill:'+k.id)).length;
const best=(values,score)=>[...values].sort((a,b)=>score(b)-score(a)||a.localeCompare(b))[0];
function resolveOffer(s,policy,metrics){
 if(s.augmentOffer){const id=best(s.augmentOffer.choices,id=>(augScore[id]||20)+(policy==='build'||policy==='control'?themeCount(s,themedAugments.find(a=>a.id===id).themeId)*20:0));if(!chooseAugment(s,id))throw Error('Augment selection failed');metrics.augments.push(id);return true;}
 if(!s.cardOffer)return false;
 const score=key=>{const c=cardByKey[key],fresh=owns(s,key)?-200:0,theme=c.themeId&&s.augments.some(id=>themedAugments.find(a=>a.id===id).themeId===c.themeId);return fresh+(c.kind==='skill'?(skillScore[c.id]||10)+(theme&&(policy==='build'||policy==='control')?60:0):c.id==='hp-below'?110:['collect-armor','collect-weapons'].includes(c.id)?(policy==='direct'?10:85):c.id==='collect-fragments'?50:c.id==='adjacent'?(policy==='control'?100:25):c.id==='avoid-traps'?40:5);};
 if(s.cardOffer.categories&&!s.cardOffer.selectedKind){const kind=best(Object.keys(s.cardOffer.categories),kind=>Math.max(...s.cardOffer.categories[kind].map(score)));if(!selectChestCategory(s,kind))throw Error('Category selection failed');}
 const id=best(s.cardOffer.choices,score);if(!chooseChestCard(s,id))throw Error('Card selection failed');metrics.cards.push(id);return true;
}
export function prepareAuditRun(s,policy){
 if(s.phase!=='prepare')throw Error('Preparation outside preparation phase');equipBest(s);
 // Ability-stat upgrades have no current purchase UI: never buy power/guard/vitality.
 const candidates=[],add=(kind,id,conditions=[],actor='self')=>{const r=createCardRule(actor,conditions,kind,id);if(validCardRule(s,r))candidates.push(r);};
 const hp=value=>owns(s,'condition:hp-below')?[{id:'hp-below',value}]:[];
 if(policy==='control'&&owns(s,'condition:adjacent'))add('action','wait',[{id:'adjacent'}],'enemy');
 const skills=themedSkills.filter(k=>owns(s,'skill:'+k.id)).sort((a,b)=>(skillScore[b.id]||0)-(skillScore[a.id]||0)||a.id.localeCompare(b.id));
 for(const k of skills){const heal=['mend','small-prayer','first-aid','breathe','fortress','gamble-heal'].includes(k.id);if(!heal||!owns(s,'condition:hp-below'))continue;add('skill',k.id,hp(k.id==='fortress'?40:65));}
 for(const k of skills)if(!['mend','small-prayer','first-aid','breathe','fortress','gamble-heal','scout','waymark','treasure-bet','fortune','homeward','trap-step','blood-offering'].includes(k.id))add('skill',k.id,k.id==='warp'?hp(25):[]);
 if(policy!=='direct'){add('action','collect-herbs',hp(65));add('action','chests');add('action','collect-armor');add('action','collect-weapons');add('action','collect-fragments');}else add('action','chests',[{id:'turns',value:1000}]);
 if(policy==='build'||policy==='control'){
  const byTheme=k=>s.augments.some(id=>themedAugments.find(a=>a.id===id).themeId===k.themeId);
  for(const k of skills.filter(byTheme))if(!candidates.some(r=>r.effect.id===k.id&&r.effect.kind==='skill'))add('skill',k.id,k.id==='fortune'?[{id:'turns',value:1000}]:[]);
 }
 add('action','avoid-traps');
 const wanted=Math.min(10,candidates.length);while(orderCapacity(s)<wanted&&upgrade(s,'commandSlots')){}
 if(policy!=='direct'&&s.levels.scout<2)upgrade(s,'scout');
 s.orders=candidates.slice(0,orderCapacity(s));s.mode='custom';
 if(!s.orders.every(r=>validCardRule(s,r))||!validateSave(s))throw Error('Invalid legal preparation');
}
export function simulateAuditRun(seed,policy,profile,{floorCap=2000,round=1}={}){
 const s=newGame(seed,profile),floors=[],metrics={augments:[],cards:[],skillUses:0,controlledTurns:0,safetyRecoveries:0,floorTimeouts:0,maxStars:0},started=performance.now();let loop=0,capTrace=[];
 while(!['dead','ending'].includes(s.phase)){
  if(++loop>100000)throw Error('No phase progress');
  if(resolveOffer(s,policy,metrics))continue;
  if(s.phase==='awakening'){beginExploration(s);continue;}
  if(s.phase==='prepare'){prepareAuditRun(s,policy);if(!beginExploration(s))throw Error('Departure failed');}
  if(s.phase==='cleared'){if(!ascend(s))throw Error('Ascent failed');continue;}
  if(s.phase!=='explore')throw Error(s.phase);
  const start=s.turn,hp=s.hp,basement=31-s.floor,gimmick=s.gimmick?.id,trace=[];let skills=0,controls=0;
  while(s.phase==='explore'&&s.turn-start<floorCap){
   if(resolveOffer(s,policy,metrics))continue;
   const before=s.themeState?.used.length||0,logs=s.logs[0];tick(s);
   const delta=(s.themeState?.used.length||0)-before;skills+=delta;metrics.skillUses+=delta;
   if(Number.isInteger(s.executingRule)&&s.orders[s.executingRule]?.target==='enemy'){controls++;metrics.controlledTurns++;}
   for(const a of s.augments)metrics.maxStars=Math.max(metrics.maxStars,themeStars(s,themedAugments.find(k=>k.id===a).themeId));
   for(const l of s.logs){if(l===logs)break;if(l.text.includes('進展がないため'))metrics.safetyRecoveries++;if(l.text.includes('1000ターン経過'))metrics.floorTimeouts++;}
   trace.push({turn:s.turn,x:s.player.x,y:s.player.y,hp:s.hp,intent:s.intent,executing:s.executingRule});if(trace.length>32)trace.shift();
  }
  if(s.debugUsed||s.levels.power||s.levels.guard||s.levels.vitality)throw Error('Illegal boost');
  if(!validateSave(s))throw Error('Invalid floor state');
  floors.push({basement,gimmick,turns:s.turn-start,phase:s.phase,hpStart:hp,hpEnd:s.hp,maxHp:stats(s).maxHp,level:s.level,attack:stats(s).attack,defense:stats(s).defense,skills,controls,reinforcements:s.enemies.filter(e=>e.reinforcement).length,orders:structuredClone(s.orders),gear:structuredClone(s.gear)});
  if(s.phase==='explore'){capTrace=trace;break;}
 }
 return{seed,policy,round,phase:s.phase,basement:31-s.floor,turns:s.turn,letter:s.letter,trueEnding:s.profile.trueEnding,debugUsed:!!s.debugUsed,metrics,floors,capTrace,lastLogs:s.logs.slice(0,8),seconds:(performance.now()-started)/1000,profile:s.profile};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const samples=Number(process.argv[2]||100),out=process.argv[3]||'test-results/current-balance.json',policies=process.argv[4]?.split(',')||POLICIES;
 if(!Number.isInteger(samples)||samples<1||samples>1000||policies.some(p=>!POLICIES.includes(p)))throw Error('Invalid arguments');
 fs.mkdirSync(dirname(out),{recursive:true});const runs=[],secondRuns=[],start=performance.now(),baseline=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),runtimeHashes=Object.fromEntries(fs.readdirSync('.').filter(name=>name.endsWith('.js')&&!name.endsWith('.test.js')).map(name=>[name,createHash('sha256').update(fs.readFileSync(name)).digest('hex')]));
 for(let i=0;i<samples;i++)for(const policy of policies){const seed=(1001+104729*i)%10000000,result=simulateAuditRun(seed,policy);runs.push(result);if(result.phase==='ending')secondRuns.push(simulateAuditRun((seed+19)%10000000,policy,result.profile,{round:2}));fs.writeFileSync(out,JSON.stringify({baseline,runtimeHashes,samples,policies,elapsedSeconds:(performance.now()-start)/1000,runs,secondRuns}));console.log(JSON.stringify({trial:i+1,policy,phase:result.phase,basement:result.basement,turns:result.turns,seconds:Math.round((performance.now()-start)/1000)}));}
}
