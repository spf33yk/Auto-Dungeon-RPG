// Ordered, capacity-limited rules. Only discovered terrain and visible enemies are considered.
export const orderDefinitions=[
 {id:'stairs',name:'階段を発見したら向かう',detail:'既知の階段へ直行する。'},
 {id:'stairs-low',name:'HP低下時は階段へ',detail:'指定HP以下なら探索を切り上げる。',param:'hp',value:35,min:10,max:90,step:5,unit:'%以下'},
 {id:'stairs-after',name:'指定ターン後は階段へ',detail:'この階で指定ターン経過後に帰路へ。',param:'turns',value:150,min:20,max:1000,step:10,unit:'ターン後'},
 {id:'stairs-after-loot',name:'見つけた品の回収後に階段へ',detail:'既知の取得可能な品がなくなったら向かう。',},
 {id:'collect-items',name:'発見した品をすべて回収',detail:'宝箱・泉・開封可能な手紙の箱を回収する。',},
 {id:'chests',name:'宝箱を優先して回収',detail:'通常宝箱だけを集める。中身は開封まで不明。',},
 {id:'chests-near',name:'近くの宝箱だけ回収',detail:'指定距離内の通常宝箱へ向かう。',param:'range',value:6,min:1,max:20,step:1,unit:'マス以内'},
 {id:'heal-critical',name:'瀕死時に泉へ向かう',detail:'指定HP以下で、発見済みの泉へ向かう。',param:'hp',value:35,min:10,max:90,step:5,unit:'%以下'},
 {id:'heal-wounded',name:'負傷したら泉へ向かう',detail:'回復を早めに使うHP基準を指定する。',param:'hp',value:70,min:10,max:95,step:5,unit:'%以下'},
 {id:'letter',name:'手紙の宝箱を優先',detail:'開封条件を満たす手紙の宝箱へ向かう。',},
 {id:'frontier',name:'視界の先を優先して調べる',detail:'未発見の地形に接する既知の床へ進む。'},
 {id:'explore-near',name:'近くの未踏床を調べる',detail:'指定距離内の、まだ踏んでいない床へ。',param:'range',value:6,min:1,max:20,step:1,unit:'マス以内'},
 {id:'explore-all',name:'すべての床を探索',detail:'未踏の床がある間は探索を続ける。',},
 {id:'avoid-group',name:'包囲されそうなら退避',detail:'指定数以上の敵が隣接したら退避を試みる。',param:'count',value:2,min:1,max:4,step:1,unit:'体以上'},
 {id:'retreat-low',name:'HP低下時は敵から離れる',detail:'指定HP以下で敵との距離を広げる。',param:'hp',value:30,min:10,max:90,step:5,unit:'%以下'},
 {id:'hunt-weak',name:'一撃で倒せる敵を追う',detail:'視認した倒し切れる敵へ接近する。',param:'range',value:6,min:1,max:20,step:1,unit:'マス以内'},
 {id:'hunt-injured',name:'負傷した敵を追う',detail:'HPが半分以下の視認敵へ接近する。',param:'range',value:6,min:1,max:20,step:1,unit:'マス以内'},
 {id:'hunt-danger',name:'攻撃力の高い敵を追う',detail:'指定距離内で攻撃力が最大の視認敵へ。',param:'range',value:4,min:1,max:20,step:1,unit:'マス以内'},
 {id:'hunt-any',name:'見える敵を追う',detail:'指定距離内の最も近い視認敵へ接近する。',param:'range',value:4,min:1,max:20,step:1,unit:'マス以内'},
];
export const orderById=Object.fromEntries(orderDefinitions.map(o=>[o.id,o]));
export const orderCapacity=s=>2+(s.levels.commandSlots||0);
export const makeOrder=id=>{const d=orderById[id];return {id,...(d.param?{[d.param]:d.value}:{})};};
export const orderUnlocked=(s,id)=>Boolean(orderById[id]);
export function addOrder(s,id){if(!['prepare','explore'].includes(s.phase)||!orderUnlocked(s,id)||s.orders.length>=orderCapacity(s)||s.orders.some(o=>o.id===id))return false;s.orders.push(makeOrder(id));s.mode='custom';return true;}
export function editOrder(s,index,change){if(!['prepare','explore'].includes(s.phase)||!s.orders[index])return false;const d=orderById[s.orders[index].id];if(change==='remove')s.orders.splice(index,1);else if(change==='up'||change==='down'){const to=index+(change==='up'?-1:1);if(to<0||to>=s.orders.length)return false;[s.orders[index],s.orders[to]]=[s.orders[to],s.orders[index]];}else {const n=Number(change);if(!d.param||!Number.isFinite(n)||n<d.min||n>d.max||(n-d.min)%d.step!==0)return false;s.orders[index][d.param]=n;}s.mode='custom';return true;}
export function activeOrders(s){return (s.orders||[]).filter(o=>orderUnlocked(s,o.id));}
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y),key=p=>`${p.x},${p.y}`,dirs=[[0,-1],[1,0],[0,1],[-1,0]];
export function chooseOrder(s,{route,canSee,stats,obtainable},emergencyOnly=false){
 const visible=s.enemies.filter(e=>canSee(s,e.x,e.y));
 const blocked=new Set(visible.map(key));
 const seek=test=>route(s,test,{blocked});
 const percent=s.hp/stats(s).maxHp*100;
 for(const o of activeOrders(s)){
  const def=orderById[o.id];let next=null,exit=false;
  const flee=o.id==='avoid-group'||o.id==='retreat-low';
  if(emergencyOnly&&!flee)continue;
  if(flee){
   if(s.retreatCooldown>0||!visible.length)continue;
   const adjacent=visible.filter(e=>dist(e,s.player)===1).length;
   if(o.id==='avoid-group'?adjacent<o.count:percent>o.hp)continue;
   const danger=p=>visible.reduce((sum,e)=>sum+(dist(e,p)===1?20:0)+6/(1+dist(e,p)),0);
   const candidates=dirs.map(([dx,dy])=>({x:s.player.x+dx,y:s.player.y+dy})).filter(p=>s.grid[p.y]?.[p.x]&&s.seen[p.y][p.x]&&!blocked.has(key(p))).sort((a,b)=>danger(a)-danger(b));
   if(candidates[0]&&danger(candidates[0])<danger(s.player))next=candidates[0];
  }else if(o.id.startsWith('stairs')){
   if(!s.seen[s.stairs.y][s.stairs.x]||(o.id==='stairs-low'&&percent>o.hp)||(o.id==='stairs-after'&&s.steps<o.turns)||(o.id==='stairs-after-loot'&&s.items.some(i=>s.seen[i.y][i.x]&&obtainable(s,i))))continue;
   next=seek(p=>key(p)===key(s.stairs));exit=true;
  }else if(['collect-items','chests','chests-near','heal-critical','heal-wounded','letter'].includes(o.id)){
   const healing=o.id.startsWith('heal');if(healing&&percent>o.hp)continue;
   next=seek(p=>s.items.some(i=>key(i)===key(p)&&s.seen[i.y][i.x]&&obtainable(s,i)&&(!healing||i.type==='potion')&&(o.id!=='letter'||i.type==='letter')&&(!o.id.startsWith('chests')||i.type==='chest')&&(o.id!=='chests-near'||dist(s.player,i)<=o.range)));
  }else if(o.id==='frontier')next=seek(p=>dirs.some(([dx,dy])=>s.seen[p.y+dy]?.[p.x+dx]===false));
  else if(o.id==='explore-all'||o.id==='explore-near')next=seek(p=>!s.visited[p.y][p.x]&&(o.id!=='explore-near'||dist(s.player,p)<=o.range));
  else if(o.id.startsWith('hunt')){
   let targets=visible.filter(e=>dist(s.player,e)<=o.range&&(o.id!=='hunt-weak'||e.hp<=Math.max(1,stats(s).attack-e.defense))&&(o.id!=='hunt-injured'||e.hp<=e.maxHp*.5));
   targets.sort(o.id==='hunt-danger'?(a,b)=>b.attack-a.attack:(a,b)=>dist(s.player,a)-dist(s.player,b));
   for(const t of targets){next=seek(p=>dist(p,t)===1);if(next)break;}
  }
  if(next)return {next,exit,flee,id:o.id,intent:`指示：${def.name}`};
 }
 return null;
}
