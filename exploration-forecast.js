import {tick,stats} from './engine.js';import {thoughtText} from './thought-view.js';
export function forecastWarnings(s){const effects=s.orders.map(o=>o.effect?.id);const warnings=[];if(!effects.some(id=>['mend','heal-item'].includes(id)))warnings.push('回復の指示がありません。');if(!s.orders.some(o=>o.conditions?.some(c=>c.id==='hp-below')&&['stairs','retreat','warp'].includes(o.effect?.id)))warnings.push('HP低下時の撤退・帰還指示がありません。');return warnings;}
export function summarizeForecast(runs){const cleared=runs.filter(r=>r.phase==='cleared'),turns=cleared.map(r=>r.turns).sort((a,b)=>a-b);return {samples:runs.length,clearRate:Math.round(cleared.length/runs.length*100),turns:turns.length?turns[Math.floor(turns.length/2)]:null,remainingHp:Math.round(runs.reduce((a,r)=>a+r.hpRatio,0)/runs.length*100),incomplete:runs.filter(r=>r.phase==='explore').length,examples:runs[0]?.examples||[]};}
// Real simulation on disposable clones; never advances the real game, save, profile or RNG.
export async function forecastExploration(input,{samples=8,maxTurns=1200,cancelled=()=>false,yieldTask=()=>new Promise(r=>setTimeout(r,0)),onProgress=()=>{}}={}){
 const runs=[];for(let sample=0;sample<samples;sample++){
  if(cancelled())return null;const s=structuredClone(input);s.phase='explore';s.rngState=(input.rngState+Math.imul(sample+1,2654435761))>>>0;s.damageEvents=[];const start=s.turn,examples=[];let previous='';
  for(let turn=0;turn<maxTurns&&s.phase==='explore';turn++){tick(s);if(examples.length<3&&s.intent!==previous){examples.push({hp:s.hp,text:thoughtText(s.intent)});previous=s.intent;}if(turn%24===23){await yieldTask();if(cancelled())return null;}}
  runs.push({phase:s.phase,turns:s.turn-start,hpRatio:Math.max(0,s.hp)/stats(s).maxHp,examples});onProgress(sample+1,samples);await yieldTask();
 }return {...summarizeForecast(runs),warnings:forecastWarnings(input)};
}
