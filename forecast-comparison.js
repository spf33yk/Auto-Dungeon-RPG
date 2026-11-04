export function compareForecast(before,after){
 if(!before||!after)return null;
 const rate=after.clearRate-before.clearRate,hp=after.remainingHp-before.remainingHp;
 const delta=(n,unit)=>n===0?'変化なし':(n>0?'+':'')+n+unit;
 let turns='変化なし',direction=0;if(before.turns===null&&after.turns!==null){turns='到達できる見込みへ';direction=1;}else if(before.turns!==null&&after.turns===null){turns='到達なしへ';direction=-1;}else if(before.turns!==null&&after.turns!==null){const diff=after.turns-before.turns;turns=diff===0?'変化なし':Math.abs(diff)+'ターン'+(diff<0?'短縮':'増加');direction=-Math.sign(diff);}
 return [{text:delta(rate,'pt'),direction:Math.sign(rate)},{text:turns,direction},{text:delta(hp,'pt'),direction:Math.sign(hp)}];
}
// Frozen at entry, including HP/gear/orders; editing cannot rewrite the baseline.
export function createPreparationBaseline(){let context='',input=null,jobs=new Map();return {
 capture(key,state){if(key===context)return false;context=key;input=structuredClone(state);jobs=new Map();return true;},
 get input(){return input?structuredClone(input):null;},get context(){return context;},
 result(samples,simulate){if(!input)return Promise.resolve(null);if(!jobs.has(samples)){const job=Promise.resolve().then(()=>simulate(structuredClone(input),samples));jobs.set(samples,job);job.then(result=>{if(!result&&jobs.get(samples)===job)jobs.delete(samples);},()=>{if(jobs.get(samples)===job)jobs.delete(samples);});}return jobs.get(samples);}
 };}
