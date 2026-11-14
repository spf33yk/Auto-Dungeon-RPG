import {tick,stats,chooseChestCard} from './engine.js';
import {describeCardRule, effectDefinition} from './card-orders.js';
// Rendering/logging must not invalidate an in-flight forecast of the same expedition.
export const forecastSignature=(s,samples)=>JSON.stringify([s,samples],(key,value)=>['logs','damageEvents','flash','intent','activeOrder','buildReport','lastBuildReport','executingRule','actorSkillEvent','newCards','folded','fixedOrderExpanded'].includes(key)?undefined:value);
export function summarizeForecast(runs){const cleared=runs.filter(r=>r.phase==='cleared'),turns=cleared.map(r=>r.turns).sort((a,b)=>a-b);return {samples:runs.length,clearRate:Math.round(cleared.length/runs.length*100),turns:turns.length?turns[Math.floor(turns.length/2)]:null,remainingHp:Math.round(runs.reduce((a,r)=>a+r.hpRatio,0)/runs.length*100),incomplete:runs.filter(r=>r.phase==='explore').length,chests:runs.reduce((total,r)=>total+(r.chests??0),0)/runs.length};}
// Real simulation on disposable clones; never advances the real game, save, profile or RNG.
export async function forecastExploration(input,{samples=10,maxTurns=1200,cancelled=()=>false,yieldTask=()=>new Promise(r=>setTimeout(r,0)),onProgress=()=>{}}={}){
 const rows=input.orders.map((order,index)=>({
  index,name:effectDefinition(order)?.name||describeCardRule(order),disabled:order.disabled===true,
  matched:0,executed:0,lowerPriority:0,noTarget:0,used:0
 }));
 const runs=[];
 onProgress(0,samples);
 for(let sample=0;sample<samples;sample++){
  if(cancelled())return null;
  const s=structuredClone(input);
  s.phase='explore';
  s.rngState=(input.rngState+Math.imul(sample+1,2654435761))>>>0;
  s.damageEvents=[];
  const start=s.turn, events=rows.map(()=>new Set());
  let chests=0,sliceStart=performance.now(),executed=null;
  const options={
   onRuleCheck:(index,event)=>events[index]?.add(event==='lowerPriority'?'candidate':event),
   onRuleAction:index=>{executed=index;events[index]?.add('executed');},
   onChestPickup:()=>{chests++;}
  };
  for(let turn=0;turn<maxTurns&&s.phase==='explore';turn++){
   executed=null;
   tick(s,options);
   events.forEach((row,index)=>{if(row.delete('candidate')&&executed!==null&&executed<index)row.add('lowerPriority');});
   while(s.cardOffer){if(!chooseChestCard(s,s.cardOffer.choices[0]))break;}
   s.augmentOffer=null;
   if(performance.now()-sliceStart>=8||turn%24===23){
    await yieldTask();
    if(cancelled())return null;
    sliceStart=performance.now();
   }
  }
  events.forEach((row,index)=>{for(const event of row)rows[index][event]++;});
  runs.push({phase:s.phase,turns:s.turn-start,hpRatio:Math.max(0,s.hp)/stats(s).maxHp,chests});
  onProgress(sample+1,samples);
  await yieldTask();
 }
 return {...summarizeForecast(runs),rows};
}
