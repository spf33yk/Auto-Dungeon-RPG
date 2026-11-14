import {fixedChestUnlocked} from './story-text.js';
import{activeOrderCount}from'./order-capacity.js';
import{DIRECTIVE_LIMITS}from'./directive-safety.js';
import{actorCanUse,roomContains,enemySkillReasons}from'./actor-rules.js';
import{themedSkills}from'./build-themes.js';
import{skillCanRun,skillAlreadyUsed}from'./theme-runtime.js';
import{gearById}from'./data.js';
// Card data and evaluation are shared by the editor, AI and save migration.
import{cardOwned,cardRarity}from'./card-access.js';
export const targetCards=[{id:'self',name:'自分'},{id:'enemy',name:'敵'}];
export const conditionCards=[
 {id:'hp-below',name:'HPが指定%以下',param:'value',value:50,min:5,max:100,step:5,unit:'%以下'},
 {id:'hp-above',name:'HPが指定%以上',param:'value',value:50,min:5,max:100,step:5,unit:'%以上'},
 {id:'visible',name:'視界内にある'},
 {id:'range',name:'指定距離以内',param:'value',value:6,min:1,max:20,step:1,unit:'マス以内'},
 {id:'turns',name:'指定ターン経過',param:'value',value:150,min:20,max:1000,step:10,unit:'ターン以上'},
 {id:'enemy-count',name:'隣接敵が指定数以上',param:'value',value:2,min:1,max:4,step:1,unit:'体以上'},
 {id:'one-hit',name:'一撃で倒せる'},
 {id:'adjacent',name:'相手と隣接している',detail:'実行者の上下左右に攻撃相手がいるときに実行。斜めは含まない。'},
];
export const actionCards=[
 {id:'stairs',name:'階段を上る',detail:'他の目的より階段を優先。固定指示にも変更できない階段への行動を常設。'},
 {id:'chests',name:'宝箱を取得',detail:'開封可能な宝箱へ向かう。'},
 {id:'collect-weapons',name:'武器を取得',detail:'発見済みの武器へ向かう。'},
 {id:'collect-armor',name:'防具を取得',detail:'発見済みの防具へ向かう。'},
 {id:'collect-fragments',name:'記憶の欠片を取得',detail:'床の記憶の欠片へ向かう。'},
 {id:'collect-herbs',name:'回復ポーションを取得',detail:'床の回復ポーションへ向かう。'},
 {id:'letter',name:'遺書の箱を開ける',detail:'旧セーブの互換用。開封できる遺書の箱へ向かう。'},
 {id:'frontier',name:'全ての部屋を探索する',detail:'まだ入っていない部屋を優先し、全ての部屋へ入ったら完了。'},
 {id:'explore-all',name:'全てのマスを探索する',detail:'到達できる未踏の床を順に歩く。'},
 {id:'wait',name:'1ターン待機',detail:`移動・通常攻撃をせず1ターン待つ。連続${DIRECTIVE_LIMITS.wait}ターンまで。その後${DIRECTIVE_LIMITS.waitCooldown}ターンは待機指示を飛ばす。`},
 {id:'retreat',name:'相手から離れる',detail:'骸なら敵から、操作する敵なら骸から、距離を取れる隣の床へ移動。'},
 {id:'avoid-traps',name:'トラップを避ける',detail:'安全な経路を優先。迂回できないときは罠を踏んで進む（ダメージあり）。',modifier:true,reward:'avoid-traps'},
];
export const skillCards=themedSkills.map(c=>({...c,detail:c.detail+' 指示で発動。骸・敵で各階1回を共有。'+(enemySkillReasons[c.id]?' 敵には使用不可：'+enemySkillReasons[c.id]+'。':''),...(c.id==='warp'?{reward:'warp'}:{ability:c.id})}));
for(const[kind,list]of Object.entries({target:targetCards,condition:conditionCards,action:actionCards,skill:skillCards}))for(const c of list){c.cardKind=kind;c.rarity=cardRarity(kind,c.id);if(!c.detail)c.detail=kind==='target'?'指示を実行する者を選びます。':c.param?`${c.name}を${c.min}〜${c.max}の範囲で指定します。`:'この条件が成立した場合だけ指示を実行します。';}
const cardDetails={self:'骸を実行者にする。HP条件は骸のHPを参照する。',enemy:'視界内で最も近い通常敵1体を実行者にする。ボスは操作しない。HP条件はその敵のHPを参照し、攻撃は骸へ向かう。','weak-enemy':'視界内の敵を残りHPの低い順に対象にする。','danger-enemy':'視界内の敵を攻撃力の高い順に対象にする。','one-hit':'最も近い視認相手のHPと通常攻撃ダメージを比べ、一撃で倒せる場合だけ実行。スキル倍率は含まない。',visible:'目的地・対象が現在の視界に入っている場合に実行。'};
for(const c of [...targetCards,...conditionCards])if(cardDetails[c.id])c.detail=cardDetails[c.id];
export const cardCapacity=s=>4+(s.levels.cardSlots||0);
export const conditionById=Object.fromEntries(conditionCards.map(c=>[c.id,c]));
export const effectDefinition=r=>(r.effect?.kind==='skill'?skillCards:actionCards).find(c=>c.id===r.effect?.id);
export const effectUnlocked=(s,e)=>Boolean(e&&cardOwned(s,e.cardKind||'action',e.id)&&(!e.ability||s.abilities?.includes(e.ability))&&(!e.reward||s.unlockedOrders?.includes(e.reward)));
export const conditionDefault=id=>{const c=conditionById[id];return {id,...(c.param?{value:c.value}:{})};};
export const createCardRule=(target='self',conditions=[],kind='action',effect='stairs')=>({id:'cards',cards:true,target,conditions:structuredClone(conditions),effect:{kind,id:effect}});

export const FIXED_STAIR_RULE=Object.freeze({id:'cards',cards:true,target:'self',conditions:Object.freeze([]),effect:Object.freeze({kind:'action',id:'stairs'})});
export const effectiveCardOrders=s=>[...s.orders,FIXED_STAIR_RULE];

export function legacyToCards(o){
 if(o.cards)return structuredClone(o);
 let target='self',effect=o.id==='collect-items'?'collect-weapons':o.id==='heal-item'?'collect-herbs':o.id,kind='action';const conditions=[];
 const add=(id,value)=>conditions.push({id,...(value===undefined?{}:{value})});
 if(o.id==='stairs-low'){effect='stairs';add('hp-below',o.hp);}
 if(o.id==='stairs-after'){effect='stairs';add('turns',o.turns);}
 if(o.id==='stairs-after-loot'){effect='stairs';}
 if(o.id==='chests-near'){effect='chests';add('range',o.range);}
 if(o.id.startsWith('heal-')){effect='collect-herbs';add('hp-below',o.hp);}
 if(o.id==='explore-near'){effect='explore-all';add('range',o.range);}
 if(o.id==='avoid-group'){effect='retreat';add('enemy-count',o.count);}
 if(o.id==='retreat-low'){effect='retreat';add('hp-below',o.hp);}
 if(o.id.startsWith('hunt-')){target=o.id==='hunt-danger'?'danger-enemy':'enemy';effect='attack';add('range',o.range);if(o.id==='hunt-weak')add('one-hit');if(o.id==='hunt-injured')add('injured');}
 if(o.id==='warp'){effect='warp';kind='skill';add('hp-below',o.hp);}
 const converted=createCardRule(target,conditions,kind,effect);if(typeof o.disabled==='boolean')converted.disabled=o.disabled;if(o.id==='stairs-after-loot')converted.disabled=true;return converted;
}

export function validCardRule(s,input,{requireOwned=true}={}){
 if(!input||input.folded!==undefined&&typeof input.folded!=='boolean'||typeof input.id!=='string'||input.disabled!==undefined&&typeof input.disabled!=='boolean')return false;
 const r=legacyToCards(input),effect=effectDefinition(r);
 if(!r.cards||!r.effect||!targetCards.some(t=>t.id===r.target)||!['skill','action'].includes(r.effect.kind)||!effect||!actorCanUse(r.target,effect))return false;
 if(requireOwned&&!effectUnlocked(s,effect))return false;
 if(requireOwned&&(!cardOwned(s,'target',r.target)||(Array.isArray(r.conditions)&&r.conditions.some(c=>!c||!cardOwned(s,'condition',c.id)))))return false;
 if(!Array.isArray(r.conditions)||r.conditions.some(c=>!c||typeof c.id!=='string')||r.conditions.length+2>cardCapacity(s)||new Set(r.conditions.map(c=>c.id)).size!==r.conditions.length)return false;
 return r.conditions.every(c=>{const d=conditionById[c.id];return d&&(!d.param||(Number.isFinite(c.value)&&c.value>=d.min&&c.value<=d.max&&(c.value-d.min)%d.step===0));});
}
export function addCardRule(s){if(s.phase!=='prepare'||activeOrderCount(s.orders)>=2+s.levels.commandSlots)return false;s.orders.push(createCardRule());s.mode='custom';return true;}
export function replaceCardRule(s,index,rule){if(s.phase!=='prepare'||!s.orders[index]||!validCardRule(s,rule)||s.orders[index].disabled===true&&rule.disabled!==true&&activeOrderCount(s.orders)>=2+s.levels.commandSlots)return false;s.orders[index]=legacyToCards(rule);s.mode='custom';return true;}

const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y),key=p=>`${p.x},${p.y}`,dirs=[[0,-1],[1,0],[0,1],[-1,0]];
function subjects(s,r,ctx){
 if(r.target==='self')return [s.player];
 const enemies=s.enemies.filter(e=>!e.boss&&ctx.canSee(s,e.x,e.y)).sort((a,b)=>dist(s.player,a)-dist(s.player,b)||a.y-b.y||a.x-b.x).slice(0,1);
 return enemies;
}
function destinations(s,r,ctx){
 const id=r.effect.id;
 if(id==='stairs')return [s.stairs].filter(p=>s.seen[p.y][p.x]&&!s.enemies.some(e=>e.boss));
 const types={chests:['chest','letter'],'collect-weapons':['gear'],'collect-armor':['gear'],'collect-fragments':['fragment'],'collect-herbs':['heart','herb','potion'],letter:['letter']};
 if(types[id])return s.items.filter(i=>s.seen[i.y][i.x]&&ctx.obtainable(s,i)&&types[id].includes(i.type)&&(id!=='collect-weapons'||gearById[i.gear?.baseId]?.slot==='weapon')&&(id!=='collect-armor'||gearById[i.gear?.baseId]?.slot==='armor'));
 if(id==='avoid-traps')return (s.traps||[]).filter(t=>t.revealed&&!t.spent&&(s.gimmick?.id==='traps'||s.seen[t.y][t.x]));
 if(['retreat','warp'].includes(id))return s.enemies.filter(e=>ctx.canSee(s,e.x,e.y));
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
   case'enemy-count':return (enemy?(dist(subject,s.player)===1?1:0):s.enemies.filter(e=>ctx.canSee(s,e.x,e.y)&&dist(s.player,e)===1).length)>=c.value;
   case'adjacent':return enemy?dist(subject,s.player)===1:s.enemies.some(e=>ctx.canSee(s,e.x,e.y)&&dist(s.player,e)===1);
   case'one-hit':{const opponent=enemy?{hp:s.hp,defense:ctx.stats(s).defense}:s.enemies.filter(e=>ctx.canSee(s,e.x,e.y)).sort((a,b)=>dist(s.player,a)-dist(s.player,b))[0];return Boolean(opponent)&&opponent.hp<=Math.ceil(Math.max(1,(enemy?subject.attack:ctx.stats(s).attack)-opponent.defense));}
   default:return false;
  }
 });
}
export function matchingCardTargets(s,input,ctx){
 const r=legacyToCards(input);if(r.disabled||!validCardRule(s,r))return [];
 const list=r.target==='self'?destinations(s,r,ctx):subjects(s,r,ctx);
 return list.filter(p=>match(s,r,r.target==='self'?s.player:p,p,ctx));
}
export function cardModifier(s,id,ctx){return s.orders.some(input=>{const r=legacyToCards(input);return r.effect.id===id&&matchingCardTargets(s,r,ctx).length>0;});}

export function chooseCardOrder(s,ctx){
 const visible=s.enemies.filter(e=>ctx.canSee(s,e.x,e.y)),blocked=new Set(visible.map(key));
 if(cardModifier(s,'avoid-traps',ctx))for(const t of s.traps||[])if(t.revealed&&!t.spent&&(s.gimmick?.id==='traps'||s.seen[t.y][t.x]))blocked.add(key(t));
 const seek=test=>ctx.route(s,test,{blocked})||ctx.route(s,test,{blocked:new Set(visible.map(key))});
 let selected=null;
 const rules=effectiveCardOrders(s);for(let index=0;index<rules.length;index++){
  const fixed=index===s.orders.length;if(fixed&&selected)break;if(ctx.ignoreDirectives&&!fixed)continue;const r=legacyToCards(rules[index]),effect=effectDefinition(r),targets=fixed?([s.stairs].filter(p=>s.seen[p.y]?.[p.x]&&!s.enemies.some(e=>e.boss))):matchingCardTargets(s,r,ctx);
  if(fixed&&fixedChestUnlocked(s)&&!ctx.ignoreDirectives){
   const next=seek(p=>s.items.some(i=>i.type==='chest'&&s.seen[i.y]?.[i.x]&&key(i)===key(p)));
   if(next)return {id:'cards',ruleIndex:null,fixed:'chests',next,intent:'固定指示：宝箱を取得'};
  }
  if(ctx.onRuleCheck&&!fixed&&!r.disabled&&validCardRule(s,r)){
   const candidates=r.target==='self'?destinations(s,r,ctx):subjects(s,r,ctx);
   if(!candidates.length)ctx.onRuleCheck(index,'noTarget');
   if(targets.length)ctx.onRuleCheck(index,'matched');
  }
  if(!targets.length||effect?.modifier||effect?.id==='wait'&&s.steps<(s.directiveSafety?.waitUntil||0))continue;
  if(r.effect.kind==='skill'&&skillAlreadyUsed(s,effect.id,r.target==='enemy'?targets[0]:null))ctx.onRuleCheck?.(index,'used');
  const accept=action=>{if(!selected)selected=action;else ctx.onRuleCheck?.(index,'lowerPriority');return !ctx.onRuleCheck;};
  const base={id:'cards',ruleIndex:fixed?null:index,fixed,intent:`カード指示：${effect.name}`};
  if(r.target==='enemy'){const command=ctx.enemyPlan?.(s,r,targets[0]);if(command){if(accept({...base,control:command}))return selected;continue;}continue;}
  if(r.effect.kind==='skill'){if(skillCanRun(s,effect.id,ctx)){if(accept({...base,skill:effect.id,exit:effect.id==='homeward'}))return selected;continue;}continue;}
  if(effect.id==='wait'){if(accept({...base,wait:true}))return selected;continue;}
  if(effect.id==='retreat'){
   if(s.retreatCooldown>0||!visible.length)continue;
   const danger=p=>visible.reduce((n,e)=>n+(dist(p,e)===1?20:0)+6/(1+dist(p,e)),0);
   const next=dirs.map(([dx,dy])=>({x:s.player.x+dx,y:s.player.y+dy})).filter(p=>s.grid[p.y]?.[p.x]&&s.seen[p.y][p.x]&&!blocked.has(key(p))).sort((a,b)=>danger(a)-danger(b))[0];
   if(next&&danger(next)<danger(s.player)){if(accept({...base,next,flee:true}))return selected;continue;}
  }else if(['frontier','explore-all'].includes(effect.id)){
   const range=r.conditions.find(c=>c.id==='range')?.value??Infinity;
   const nearby=visible.filter(e=>dist(s.player,e)<=range),combat=nearby.length?seek(p=>dist(s.player,p)<=range&&nearby.some(e=>dist(p,e)===1)):null;
   if(combat){const plan={...base,next:combat,intent:'進路の敵に向き合う'};if(accept(plan))return selected;continue;}
   const rooms=s.rooms||[],entered=i=>(s.themeState?.rooms||[]).includes(i)||roomContains(rooms[i],s.player);if(effect.id==='frontier'&&rooms.length&&rooms.every((_,i)=>entered(i)))continue;
   const roomStep=effect.id==='frontier'?seek(p=>dist(s.player,p)<=range&&rooms.some((room,i)=>!entered(i)&&roomContains(room,p))):null;const next=roomStep||seek(p=>dist(s.player,p)<=range&&!s.visited[p.y][p.x]&&(effect.id==='explore-all'||dirs.some(([dx,dy])=>s.seen[p.y+dy]?.[p.x+dx]===false)));
   if(next){if(accept({...base,next}))return selected;continue;}
  }else{
   const next=seek(p=>targets.some(t=>key(t)===key(p)));
   if(next){if(accept({...base,next,exit:effect.id==='stairs'}))return selected;continue;}
  }
 }
 return selected;
}

export function describeCardRule(input){
 const r=legacyToCards(input),target=targetCards.find(t=>t.id===r.target)?.name||'？',effect=effectDefinition(r);
 const conditions=r.conditions.map(c=>{const d=conditionById[c.id];if(c.id==='visible')return (r.effect.id==='stairs'?'階段':r.effect.id==='chests'?'宝箱':r.effect.id==='avoid-traps'?'トラップ':r.target==='self'?'対象':'敵')+'が視界内';return d?.param?d.name.replace('指定%',String(c.value)+'%').replace('指定距離',String(c.value)+'マス').replace('指定ターン',String(c.value)+'ターン').replace('指定数',String(c.value)):d?.name||'？';});
 return `${target}が、${conditions.length?conditions.join('、かつ')+(/(?:いる|ある|できる|倒せる)$/.test(conditions.at(-1))?'とき、':'のとき、'):''}${effect?.name||'？'}${r.effect.kind==='skill'?'を発動する':r.effect.id==='wait'?'する':''}。`;
}

export function collapseAllCardRows(s){if(s.phase!=='prepare')return false;for(const row of s.orders)row.folded=true;s.fixedOrderExpanded=[];return true;}
