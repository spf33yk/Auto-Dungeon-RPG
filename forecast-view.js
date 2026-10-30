export function forecastSummary(floor,result,status='pending'){
 const unavailable=status==='error'?'予測できません':status==='pending'?'計算中…':'—';
 return [
  {label:`${floor}のClear見込み`,value:result?`${result.clearRate}%`:unavailable},
  {label:'想定ターン数（中央値）',value:result?(result.turns===null?'到達なし':`約${result.turns}`):unavailable},
  {label:'回復余力・終了時HP平均',value:result?`${result.remainingHp>=50?'余裕あり':result.remainingHp>=25?'やや不足':'危険'} · ${result.remainingHp}%`:unavailable}
 ];
}
