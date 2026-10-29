// Card data and evaluation are shared by the editor, AI and save migration.
export const targetCards=[{id:'self',name:'自分'},{id:'enemy',name:'近くの敵'},{id:'weak-enemy',name:'HPの低い敵'},{id:'danger-enemy',name:'攻撃力の高い敵'}];
export const conditionCards=[
 {id:'hp-below',name:'HPが指定%以下',param:'value',value:50,min:5,max:100,step:5,unit:'%以下'},
 {id:'hp-above',name:'HPが指定%以上',param:'value',value:50,min:5,max:100,step:5,unit:'%以上'},
 {id:'visible',name:'視界内にある'},
 {id:'range',name:'指定距離以内',param:'value',value:6,min:1,max:20,step:1,unit:'マス以内'},
 {id:'turns',name:'指定ターン経過',param:'value',value:150,min:20,max:1000,step:10,unit:'ターン以上'},
 {id:'enemy-count',name:'隣接敵が指定数以上',param:'value',value:2,min:1,max:4,step:1,unit:'体以上'},
 {id:'one-hit',name:'一撃で倒せる'},
 {id:'injured',name:'敵のHPが半分以下'},
 {id:'loot-empty',name:'既知の回収品がない'},
];
export const actionCards=[
 {id:'stairs',name:'階段を上る',detail:'階段へ向かい、実際に乗ると次の階へ。'},
 {id:'chests',name:'宝箱を取得',detail:'開封可能な通常宝箱へ向かう。'},
 {id:'collect-items',name:'品物を取得',detail:'入手可能な品物へ向かう。'},
 {id:'heal-item',name:'回復品を取得',detail:'泉や薬草へ向かう。'},
 {id:'letter',name:'手紙の箱を開ける',detail:'物語条件を満たす手紙の箱へ向かう。'},
 {id:'frontier',name:'視界の先を調べる',detail:'未発見の地形に接する未踏の床を調べる。'},
 {id:'explore-all',name:'未踏の床を調べる',detail:'まだ歩いていない床を調べる。'},
 {id:'retreat',name:'敵から離れる',detail:'敵が見えるとき、危険の少ない隣の床へ退避。'},
 {id:'attack',name:'敵を攻撃',detail:'選んだ敵へ接近し、隣接したら攻撃。',enemy:true},
 {id:'tactics',name:'戦術で敵を選ぶ',detail:'条件成立中、隣接敵の一撃撃破・攻撃力を優先。',modifier:true},
 {id:'avoid-traps',name:'トラップを避ける',detail:'条件成立中は罠を経路で避け、踏んでも作動させない。',modifier:true,reward:'avoid-traps'},
];
export const skillCards=[
 {id:'mend',name:'再生の祈り',detail:'条件成立時に最大HP40%回復。各階1回。',ability:'mend'},
 {id:'warp',name:'窮地の転移',detail:'条件成立時にランダムな床へ転移。各階1回。',reward:'warp'},
];
export const cardCapacity=s=>4+(s.levels.cardSlots||0);
export const conditionById=Object.fromEntries(conditionCards.map(c=>[c.id,c]));
export const effectDefinition=r=>(r.effect?.kind==='skill'?skillCards:actionCards).find(c=>c.id===r.effect?.id);
export const effectUnlocked=(s,e)=>Boolean(e&&(!e.ability||s.abilities?.includes(e.ability))&&(!e.reward||s.unlockedOrders?.includes(e.reward)));
export const conditionDefault=id=>{const c=conditionById[id];return {id,...(c.param?{value:c.value}:{})};};
export const createCardRule=(target='self',conditions=[],kind='action',effect='stairs')=>({id:'cards',cards:true,target,conditions:structuredClone(conditions),effect:{kind,id:effect}});

export function legacyToCards(o){
 if(o.cards)return structuredClone(o);
 let target='self',effect=o.id,kind='action';const conditions=[];
 const add=(id,value)=>conditions.push({id,...(value===undefined?{}:{value})});
 if(o.id==='stairs-low'){effect='stairs';add('hp-below',o.hp);}
 if(o.id==='stairs-after'){effect='stairs';add('turns',o.turns);}
 if(o.id==='stairs-after-loot'){effect='stairs';add('loot-empty');}
 if(o.id==='chests-near'){effect='chests';add('range',o.range);}
 if(o.id.startsWith('heal-')){effect='heal-item';add('hp-below',o.hp);}
 if(o.id==='explore-near'){effect='explore-all';add('range',o.range);}
 if(o.id==='avoid-group'){effect='retreat';add('enemy-count',o.count);}
 if(o.id==='retreat-low'){effect='retreat';add('hp-below',o.hp);}
 if(o.id.startsWith('hunt-')){target=o.id==='hunt-danger'?'danger-enemy':'enemy';effect='attack';add('range',o.range);if(o.id==='hunt-weak')add('one-hit');if(o.id==='hunt-injured')add('injured');}
 if(o.id==='warp'){effect='warp';kind='skill';add('hp-below',o.hp);}
 return createCardRule(target,conditions,kind,effect);
}

export function validCardRule(s,input,{requireOwned=true}={}){
 if(!input||typeof input.id!=='string')return false;
 const r=legacyToCards(input),effect=effectDefinition(r);
 if(!r.cards||!r.effect||!targetCards.some(t=>t.id===r.target)||!['skill','action'].includes(r.effect.kind)||!effect||Boolean(effect.enemy)!==(r.target!=='self'))return false;
 if(requireOwned&&!effectUnlocked(s,effect))return false;
 if(!Array.isArray(r.conditions)||r.conditions.some(c=>!c||typeof c.id!=='string')||r.conditions.length+2>cardCapacity(s)||new Set(r.conditions.map(c=>c.id)).size!==r.conditions.length)return false;
 return r.conditions.every(c=>{const d=conditionById[c.id];return d&&(!['one-hit','injured'].includes(c.id)||r.target!=='self')&&(!d.param||(Number.isFinite(c.value)&&c.value>=d.min&&c.value<=d.max&&(c.value-d.min)%d.step===0));});
}
export function addCardRule(s){if(s.phase!=='prepare'||s.orders.length>=2+s.levels.commandSlots)return false;s.orders.push(createCardRule());s.mode='custom';return true;}
export function replaceCardRule(s,index,rule){if(s.phase!=='prepare'||!s.orders[index]||!validCardRule(s,rule))return false;s.orders[index]=legacyToCards(rule);s.mode='custom';return true;}

const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y),key=p=>`${p.x},${p.y}`,dirs=[[0,-1],[1,0],[0,1],[-1,0]];
function subjects(s,r,ctx){
 if(r.target==='self')return [s.player];
 const enemies=s.enemies.filter(e=>ctx.canSee(s,e.x,e.y));
 enemies.sort(r.target==='weak-enemy'?(a,b)=>a.hp-b.hp:r.target==='danger-enemy'?(a,b)=>b.attack-a.attack:(a,b)=>dist(s.player,a)-dist(s.player,b));
 return enemies;
}
function destinations(s,r,ctx){
 const id=r.effect.id;
 if(id==='stairs')return [s.stairs].filter(p=>s.seen[p.y][p.x]&&!s.enemies.some(e=>e.boss));
 if(['chests','collect-items','heal-item','letter'].includes(id))return s.items.filter(i=>s.seen[i.y][i.x]&&ctx.obtainable(s,i)&&(id!=='chests'||i.type==='chest')&&(id!=='heal-item'||['potion','herb'].includes(i.type))&&(id!=='letter'||i.type==='letter'));
 if(id==='avoid-traps')return (s.traps||[]).filter(t=>t.revealed&&!t.spent&&(s.gimmick?.id==='traps'||s.seen[t.y][t.x]));
 if(['retreat','tactics','warp'].includes(id))return s.enemies.filter(e=>ctx.canSee(s,e.x,e.y));
 return [s.player];
}
function match(s,r,subject,destination,ctx){
 const enemy=r.target!=='self',hp=enemy?subject.hp:s.hp,maxHp=enemy?subject.maxHp:ctx.stats(s).maxHp;
 return r.conditions.every(c=>{
  switch(c.id){
   case'hp-below':return hp/maxHp*100<=c.value;
   case'hp-above':return hp/maxHp*100>=c.value;
   case'visible':return ctx.canSee(s,destination.x,destination.y);
   case'range':return dist(s.player,destination)<=c.value;
   case'turns':return s.steps>=c.value;
   case'enemy-count':return s.enemies.filter(e=>ctx.canSee(s,e.x,e.y)&&dist(s.player,e)===1).length>=c.value;
   case'one-hit':return subject.hp<=Math.max(1,ctx.stats(s).attack-subject.defense);
   case'injured':return subject.hp<=subject.maxHp*.5;
   case'loot-empty':return !s.items.some(i=>s.seen[i.y][i.x]&&ctx.obtainable(s,i));
   default:return false;
  }
 });
}
export function matchingCardTargets(s,input,ctx){
 const r=legacyToCards(input);if(!validCardRule(s,r))return [];
 const list=r.target==='self'?destinations(s,r,ctx):subjects(s,r,ctx);
 return list.filter(p=>match(s,r,r.target==='self'?s.player:p,p,ctx));
}
export function cardModifier(s,id,ctx){return s.orders.some(input=>{const r=legacyToCards(input);return r.effect.id===id&&matchingCardTargets(s,r,ctx).length>0;});}

export function chooseCardOrder(s,ctx){
 const visible=s.enemies.filter(e=>ctx.canSee(s,e.x,e.y)),blocked=new Set(visible.map(key));
 if(cardModifier(s,'avoid-traps',ctx))for(const t of s.traps||[])if(t.revealed&&!t.spent&&(s.gimmick?.id==='traps'||s.seen[t.y][t.x]))blocked.add(key(t));
 const seek=test=>ctx.route(s,test,{blocked});
 for(let index=0;index<s.orders.length;index++){
  const r=legacyToCards(s.orders[index]),effect=effectDefinition(r),targets=matchingCardTargets(s,r,ctx);
  if(!targets.length||effect?.modifier)continue;
  const base={id:'cards',ruleIndex:index,intent:`カード指示：${effect.name}`};
  if(r.effect.kind==='skill'){
   if(effect.id==='mend'&&!s.mended&&s.hp<ctx.stats(s).maxHp)return {...base,skill:'mend'};
   if(effect.id==='warp'&&!s.warped&&visible.length)return {...base,warp:true};
   continue;
  }
  if(effect.id==='attack'){
   for(const e of targets){if(dist(s.player,e)===1)return {...base,enemy:e};const next=seek(p=>dist(p,e)===1);if(next)return {...base,next};}
  }else if(effect.id==='retreat'){
   if(s.retreatCooldown>0||!visible.length)continue;
   const danger=p=>visible.reduce((n,e)=>n+(dist(p,e)===1?20:0)+6/(1+dist(p,e)),0);
   const next=dirs.map(([dx,dy])=>({x:s.player.x+dx,y:s.player.y+dy})).filter(p=>s.grid[p.y]?.[p.x]&&s.seen[p.y][p.x]&&!blocked.has(key(p))).sort((a,b)=>danger(a)-danger(b))[0];
   if(next&&danger(next)<danger(s.player))return {...base,next,flee:true};
  }else if(['frontier','explore-all'].includes(effect.id)){
   const range=r.conditions.find(c=>c.id==='range')?.value??Infinity;
   const nearby=visible.filter(e=>dist(s.player,e)<=range),combat=nearby.length?seek(p=>dist(s.player,p)<=range&&nearby.some(e=>dist(p,e)===1)):null;
   if(combat)return {...base,next:combat,intent:'進路の敵に向き合う'};
   const next=seek(p=>dist(s.player,p)<=range&&(effect.id==='frontier'?!s.visited[p.y][p.x]&&dirs.some(([dx,dy])=>s.seen[p.y+dy]?.[p.x+dx]===false):!s.visited[p.y][p.x]));
   if(next)return {...base,next};
  }else{
   const next=seek(p=>targets.some(t=>key(t)===key(p)));
   if(next)return {...base,next,exit:effect.id==='stairs'};
  }
 }
 return null;
}

export function describeCardRule(input){
 const r=legacyToCards(input),target=targetCards.find(t=>t.id===r.target)?.name||'？',effect=effectDefinition(r);
 const conditions=r.conditions.map(c=>{const d=conditionById[c.id];if(c.id==='visible')return (r.effect.id==='stairs'?'階段':r.effect.id==='chests'?'宝箱':r.effect.id==='avoid-traps'?'トラップ':r.target==='self'?'対象':'敵')+'が視界内';return d?.param?d.name.replace('指定%',String(c.value)+'%').replace('指定距離',String(c.value)+'マス').replace('指定ターン',String(c.value)+'ターン').replace('指定数',String(c.value)):d?.name||'？';});
 return `${target}は、${conditions.length?conditions.join('、かつ')+'のとき、':''}${effect?.name||'？'}${r.effect.kind==='skill'?'を発動する':''}。`;
}
