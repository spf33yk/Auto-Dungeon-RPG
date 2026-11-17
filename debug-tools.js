import{cardCatalog}from'./card-catalog.js';import{grantCard}from'./card-inventory.js';
import {newGame,makeFloor,stats,skills,log,createGear,acquire,gearById,gearName,LAST_FLOOR,startFloorFor,rewardDefinitions,grantReward} from './engine.js';
export function debugJump(s,floor){if(!Number.isInteger(floor)||floor<startFloorFor(s)||floor>LAST_FLOOR)return false;s.floor=floor;s.phase=floor===startFloorFor(s)?'awakening':'prepare';if(floor===startFloorFor(s))s.willHintShown=false;makeFloor(s);s.hp=Math.max(1,Math.min(s.hp,stats(s).maxHp));s.debugUsed=true;log(s,`DEBUG：B${LAST_FLOOR+1-floor}へ移動。地形を再生成。`,'story');return true;}
export function debugBeforeWillChest(current){
 const state=structuredClone(current);
 state.letter=false;
 debugJump(state,startFloorFor(state));
 if(!state.items.some(item=>item.type==='letter'&&Math.abs(item.x-state.player.x)+Math.abs(item.y-state.player.y)===1))return null;
 state.phase='explore';
 state.augmentStarted=true;
 state.augmentOffer=null;
 state.guidedJourney=false;
 state.debugWillChest=true;
 log(state,'DEBUG：古びた遺書の宝箱の手前。探索を再開すると取得します。','story');
 return state;
}
export function debugHeal(s){s.hp=stats(s).maxHp;s.debugUsed=true;log(s,'DEBUG：HPを全回復。','good');}
export function debugTitleEnding(s,enabled){if(typeof enabled!=='boolean')return false;s.profile.trueEnding=enabled;s.debugUsed=true;log(s,'DEBUG：タイトルのTRUE END達成記録を'+(enabled?'ON':'OFF')+'。本編のエンディングは変更しない。','story');return true;}
export function debugShards(s,amount=100){if(!Number.isInteger(amount)||amount<1||amount>10000)return false;s.shards+=amount;s.debugUsed=true;log(s,`DEBUG：記憶の欠片 +${amount}`,'good');return true;}
export function debugSkills(s){for(const c of cardCatalog)if(!s.ownedCards?.includes(c.key))grantCard(s,c.key);for(const k of skills)s.levels[k.id]=k.max;for(const r of rewardDefinitions)if(!(r.kind==='skill'?s.abilities:s.unlockedOrders).includes(r.id))grantReward(s,r.id);s.hp=stats(s).maxHp;s.debugUsed=true;log(s,'DEBUG：能力強化とドロップ報酬をすべて取得。','good');}
export function debugEquipment(s,id,options={}){if(!gearById[id]||!Number.isInteger(options.plus??0)||(options.plus??0)<0||(options.plus??0)>20)return false;const g=createGear(id,{plus:options.plus??0});acquire(s,g);s.debugUsed=true;log(s,`DEBUG：${gearName(g)}を生成。`,'good');return true;}

export function debugJourney(current,basement,second=false){
 const profile=structuredClone(current.profile);
 profile.normalClears=second?1:0;
 profile.carryCards??=[...current.ownedCards];
 profile.trueEnding=false;
 const state=newGame(current.seed,profile);
 if(basement!==25){
  if(!debugJump(state,LAST_FLOOR+1-basement))return null;
  state.augmentStarted=true;
  if(second){
   const boss=state.enemies.find(enemy=>enemy.boss);
   if(boss){
    boss.hp=Math.max(1,Math.floor(boss.maxHp*.3));
    const adjacent=[[0,1],[0,-1],[1,0],[-1,0]].map(([x,y])=>({x:boss.x+x,y:boss.y+y})).find(p=>state.grid[p.y]?.[p.x]);
    if(adjacent)state.player=adjacent;
    state.turn=boss.period-1;
    state.orders=[];
    state.phase='explore';
   }
  }
 }
 state.debugUsed=true;
 return state;
}
