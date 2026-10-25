// A repeatable strategy sample, not a universal estimate of player clear rates.
import {newGame,makeOrder,beginExploration,ascend,tick,equipBest,upgrade} from '../engine.js';

const count=Number(process.argv[2]??10);
if(!Number.isInteger(count)||count<1||count>100)throw Error('Seed count must be an integer from 1 to 100.');
const runs=[];
for(let seed=1;seed<=count;seed++){
 const s=newGame(seed);
 let actions=0;
 while(!['dead','ending'].includes(s.phase)&&actions++<25000){
  if(s.phase==='awakening')beginExploration(s);
  else if(s.phase==='prepare'){
   s.orders=['heal-critical','chests'].map(makeOrder);
   equipBest(s);
   for(let i=0;i<6;i++)for(const id of ['guard','power','vitality'])upgrade(s,id);
   beginExploration(s);
  }else if(s.phase==='cleared')ascend(s);
  else tick(s);
 }
 runs.push({seed,result:s.phase,floor:s.floor,turns:s.turn,abilities:s.abilities,unlockedOrders:s.unlockedOrders});
}
console.log(JSON.stringify({strategy:'B30 default stairs; from B29 heal-critical + chests; best equipment; guard/power/vitality',seeds:count,clears:runs.filter(r=>r.result==='ending').length,stalls:runs.filter(r=>!['dead','ending'].includes(r.result)).length,runs},null,2));
