import{W,H,stats,canSee,route,obtainable,reveal,planHeroTurn,zoneFor,monsters}from'./engine.js';
import{legacyToCards,matchingCardTargets,effectDefinition,conditionById,describeCardRule}from'./card-orders.js';
// A synthetic room, never the unseen real map. Evaluates the same planner as tick.
export function testBuildDecision(input,{hp=30,enemies=1,turns=0,stairs=true,trap=false}={}){
 const s=structuredClone(input);s.phase='explore';s.augmentOffer=null;s.player={x:5,y:5};s.steps=Math.max(0,Math.min(1000,Math.round(Number(turns)||0)));s.turn=Math.max(0,input.turn-(input.steps||0))+s.steps;s.stairs={x:stairs?7:20,y:5};s.grid=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>x>=2&&x<=22&&y>=2&&y<=10?1:0));s.seen=s.grid.map(r=>r.map(()=>false));s.visited=s.grid.map(r=>r.map(()=>false));s.obstacles=[];s.rooms=[];s.traps=trap?[{x:6,y:6,revealed:true,spent:false}]:[];s.items=[];s.gimmick={id:'none'};s.mended=false;s.warped=false;s.retreatCooldown=0;s.unharmedTurns=0;s.firstAttackUsed=false;s.undyingUsed=false;
 const base=monsters[zoneFor(s).index*2],points=[[5,4],[6,5],[5,6],[4,5]];s.enemies=points.slice(0,Math.max(0,Math.min(4,Math.round(Number(enemies)||0)))).map(([x,y],i)=>({...base,baseId:base.id,x,y,maxHp:base.hp,hp:i===1?1:base.hp,aggro:true}));s.hp=Math.max(1,Math.round(stats(s).maxHp*Math.max(5,Math.min(100,Number(hp)||5))/100));
 reveal(s);const ctx={canSee,route,stats,obtainable},plan=planHeroTurn(s),rows=s.orders.map((input,index)=>{const r=legacyToCards(input),effect=effectDefinition(r),matched=matchingCardTargets(s,r,ctx).length>0;let status='skipped',reason='上の行が実行されるため待機';
  if(effect?.modifier){status=matched?'support':'inactive';reason=matched?'条件成立・行動を支える補助指示':'対象または条件が成立しない';}
  else if(index===plan.ruleIndex){status='selected';reason='この指示を実行';}
  else if(!matched){status='inactive';const failed=r.conditions.filter(c=>!matchingCardTargets(s,{...r,conditions:[c]},ctx).length);reason=failed.length?'不成立：'+failed.map(c=>conditionById[c.id]?.name||c.id).join('、'):'実行対象がない、または未所持';}
  else if(plan.ruleIndex===null||index<plan.ruleIndex){status='inactive';reason=plan.enemy?'隣接する敵との戦闘を優先':'条件は成立するが、移動先や実行可能な対象がない';}
  return {index,status,reason,text:describeCardRule(r)};});
 const action=plan.enemy?'「'+plan.enemy.name+'」を攻撃':plan.action?.skill==='mend'?'再生の祈りで'+Math.min(stats(s).maxHp-s.hp,Math.ceil(stats(s).maxHp*.4))+'回復':plan.action?.warp?'窮地の転移で退避':plan.action?.intent||'待機';
 return {rows,selected:plan.ruleIndex,action,hp:s.hp,hpPercent:Math.round(s.hp/stats(s).maxHp*1000)/10,maxHp:stats(s).maxHp,attack:stats(s).attack,defense:stats(s).defense,enemyCount:s.enemies.length,steps:s.steps,enemyName:base.name};
}
