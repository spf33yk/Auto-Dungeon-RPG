import{legacyToCards}from'./card-orders.js';
export function buildConnections(s){
 const held=new Set(s.augments||[]),rows=(s.orders||[]).map(legacyToCards),result=[];
 const add=(id,title,text,ids,predicate,tone='gold')=>{const augments=ids.filter(id=>held.has(id)),matches=rows.flatMap((r,i)=>predicate(r)?[i]:[]);if(augments.length&&matches.length)result.push({id,title,text,augments,rows:matches,tone});};
 add('haste','駆け上がる構成','階段を優先し、序盤の火力や300ターン未満のClear回復を生かす。',['haste','rush','swift-ascent'],r=>r.effect.id==='stairs','amber');
 add('ripen','探索して熟成','探索を優先して経過ターンの強化を育てる。300ターンからの増援には注意。',['ripen','patience','pilgrim'],r=>['frontier','explore-all'].includes(r.effect.id)||r.conditions.some(c=>c.id==='turns'),'green');
 add('desperate','背水の立て直し','低HPの強化を使い、回復・転移・退避の閾値で危険を調整する。回復すると背水の強化は下がる。',['desperate','blood','undying'],r=>r.target==='self'&&r.conditions.some(c=>c.id==='hp-below')&&['mend','warp','retreat','stairs'].includes(r.effect.id),'red');
 add('moon','満月を保つ','HPを高く保つ指示が満月の守りや初太刀を支える。',['shell','moon'],r=>['mend','collect-herbs','collect-springs'].includes(r.effect.id),'blue');
 add('battle','狙いを定める','敵を選ぶ指示に、会心・連戦・包囲攻撃の効果を重ねる。',['critical','hunter','surrounded','nova','charge'],r=>r.effect.id==='attack'||r.effect.id==='tactics','purple');
 if(held.has('double-strike')&&(held.has('leech')||held.has('blood')))result.push({id:'leech-strike',title:'追撃と吸命',text:'追撃で与えた実ダメージにも吸命が働く。回復量は切捨てのため小さな打撃では0になる。',augments:['double-strike',...['leech','blood'].filter(id=>held.has(id))],rows:rows.flatMap((r,i)=>r.effect.id==='attack'?[i]:[]),tone:'red'});
 return result;
}
