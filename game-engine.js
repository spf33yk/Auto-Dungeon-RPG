import{isHealingItem,migrateHealingItems}from'./healing-items.js';
import{rollTrap,triggerTrap,trapActive,trapAttackFactor,trapSightPenalty,validTraps}from'./traps.js';
import{validDirectiveSafety,bypassDirectives,progressSnapshot,updateDirectiveSafety,beginDirectiveSafety}from'./directive-safety.js';
import{migrateDirectiveCards}from'./directive-card-migration.js';
import{migrateLootCondition}from'./retired-loot-condition.js';
import{removeTacticsCard}from'./retired-tactics.js';
import{migrateActorRules,ACTOR_RULE_REVISION,retiredTargets}from'./actor-rules.js';
import{planEnemyCommand,executeEnemyCommand,enemyDefense,enemyAttack,mitigateControlledDamage,validEnemyControls}from'./enemy-control.js';
import{chestCategoryChoices,validChestCategories}from'./card-inventory.js';
import{withinSightShape}from'./sight-shape.js';
import{augmentStats as ap}from'./set-bonuses.js';
import{themeState,themeBuff,resetThemeFloor,normalizeThemes,validThemeState,updateThemeExploration,mitigateThemeDamage,executeThemedSkill}from'./theme-runtime.js';
import{themedSkillById}from'./build-themes.js';
import{emptyBuildReport,buildReport,recordBuild,recordRule,validBuildReport}from'./build-performance.js';
import{spawnReinforcement}from'./reinforcements.js';
import{retiredCollectionCards,migrateRetiredCards}from'./retired-cards.js';
import{augments,augmentById,hasAugment,offerAugments,chooseAugment,augmentBonus,takeHeroDamage,clearAugmentHealing}from'./augments.js';
export{augments,augmentById,offerAugments,chooseAugment};
import {bossArena} from './boss-arena.js';
import {generateDungeonLayout} from './dungeon-layout.js';
import{INITIAL_CARDS}from'./card-access.js';
import{cardCatalog,cardByKey,cardCodexRows}from'./card-catalog.js';
import{grantCard,migrateCardInventory,rollCardChest,cardChestChoices,chooseChestCard}from'./card-inventory.js';
export{grantCard,chooseChestCard,cardCatalog,cardByKey,cardCodexRows};
import {placeCryptObstacles,validCryptObstacles} from './crypt-obstacles.js';
import {createCardRule,legacyToCards,validCardRule,chooseCardOrder,cardModifier} from './card-orders.js';
import {storyFragment,letterFloorThought} from './story-text.js';
import {MAX_LEVEL,HP_PER_LEVEL,experienceToNext,gainExperience} from './progression.js';
export {MAX_LEVEL,HP_PER_LEVEL,experienceToNext,gainExperience};
export * from './card-orders.js';
import {nextRandom,rollEnemyDrop,rollChestReward,grantReward} from './drop-system.js';
export {nextRandom,rollEnemyDrop,rollChestReward,grantReward};
import {rewardDefinitions,rewardById,enemyDropTables,chestRewards} from './data.js';
export {rewardDefinitions,rewardById,enemyDropTables,chestRewards};
import {NORMAL_FLOORS,LETTER_FLOOR,fieldPlan,nextStageHint,zoneIndexForFloor,bossForFloor} from './field-events.js';
export {NORMAL_FLOORS,LETTER_FLOOR,fieldPlan,nextStageHint,zoneIndexForFloor,bossForFloor};
import {orderDefinitions,orderById,orderCapacity,makeOrder,orderUnlocked,addOrder,editOrder,activeOrders,chooseOrder} from './orders.js';
export {orderDefinitions,orderById,orderCapacity,makeOrder,orderUnlocked,addOrder,editOrder,activeOrders};
import {zones,monsters,equipment,gearById,monsterById,skills} from './data.js';
export {zones,monsters,equipment,gearById,monsterById,skills};
export const W=47,H=35,LAST_FLOOR=NORMAL_FLOORS,IDENTIFY_COST=3,UNCURSE_COST=5,SYNTHESIS_CAP=20,CHEST_CHANCE=.35;
export const BALANCE={heartCount:2,heartHeal:10,restRatio:.15,enemyCount:z=>6+Math.floor(z/2)};
const dirs=[[0,-1],[1,0],[0,1],[-1,0]],key=p=>`${p.x},${p.y}`;
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export function random(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
export function profileDefault(){return {normalClears:0,trueEnding:false,augments:[],cards:[],runs:0,monsters:[],equipment:[],knownEquipment:[],skills:[]};}
export function zoneFor(s){return zones[Math.min(9,zoneIndexForFloor(s.floor))];}
export function floorLabel(s){return s.phase==='ending'?'地上 1F':`B${LAST_FLOOR+1-s.floor}`;}
export function radius(s){return Math.max(2,3+s.levels.scout+themeBuff(s,'sight')-(s.gimmick?.id==='fog'?2:0)-trapSightPenalty(s));}
export function log(s,text,type=''){s.logs.unshift({text,type,turn:s.turn});}
function register(list,id){if(!list.includes(id))list.push(id);}
export function createGear(baseId,{plus=0,cursed=false,identified=true}={}){if(!gearById[baseId])throw Error('Unknown equipment');return {baseId,plus,cursed,identified,boundKnown:false};}
export function gearStats(g){const base=gearById[g.baseId];return {attack:base.attack+(base.slot==='weapon'?g.plus:0),defense:base.defense+(base.slot==='armor'?g.plus:0)};}
export function gearName(g){return g.identified?gearById[g.baseId].name+(g.plus?`+${g.plus}`:''):gearById[g.baseId].slot==='weapon'?'未鑑定の剣':'未鑑定の防具';}
export function acquire(s,g){g.identified=true;g.cursed=false;g.boundKnown=false;g.acquiredOrder=s.nextAcquisition++;s.inventory.push(g);register(s.profile.equipment,g.baseId);if(g.identified)register(s.profile.knownEquipment,g.baseId);}
export const incomingDamage=(attack,defense)=>Math.max(1,Math.ceil(attack*.2),attack-defense);
export function stats(s){const w=gearStats(s.gear.weapon),a=gearStats(s.gear.armor),maxHp=54+((s.level??1)-1)*HP_PER_LEVEL+s.levels.vitality*12,b=augmentBonus(s,maxHp,(s.enemies||[]).filter(e=>canSee(s,e.x,e.y)).length);return {maxHp,attack:Number(((7+s.levels.power*2+w.attack+a.attack+b.attack)*trapAttackFactor(s)).toFixed(6)),defense:Number((1+s.levels.guard+w.defense+a.defense+b.defense).toFixed(6))};}
export function newGame(seed=Date.now()%10000000,profile=profileDefault()){
 const p=structuredClone(profile);migrateHealingItems({profile:p});p.augments??=[];p.skills??=[];p.cards??=[];for(const key of INITIAL_CARDS)if(!p.cards.includes(key))p.cards.push(key);p.trueEnding??=false;p.runs++;
 const s={version:16,actorRuleRevision:ACTOR_RULE_REVISION,heroWeakenedHits:0,augments:[],augmentOffer:null,augmentStarted:false,trapTriggers:0,ownedCards:[...INITIAL_CARDS],newCards:[],level:1,experience:0,damageEvents:[],abilities:[],unlockedOrders:[],rngState:seed>>>0,warped:false,nextAcquisition:0,b15HintShown:false,orders:[createCardRule()],seed,floor:1,phase:'awakening',hp:54,shards:12,levels:Object.fromEntries(skills.map(k=>[k.id,0])),gear:{weapon:createGear('weapon-0'),armor:createGear('armor-0')},inventory:[],mode:'stairs',turn:0,kills:0,logs:[],memories:[],profile:p,letter:false};
 for(const g of Object.values(s.gear)){g.acquiredOrder=s.nextAcquisition++;register(p.equipment,g.baseId);register(p.knownEquipment,g.baseId);}
 if(p.normalClears)grantCard(s,'action:letter');s.newCards=[];makeFloor(s);log(s,'目が覚めると、そこには骨だけの手があった。','story');log(s,p.normalClears?'息子に会いたい。今度こそ、あの手紙を届けよう。':'なぜだろう。上へ行かなければならない気がする。','story');return s;
}
export function abandonRun(s){return ['prepare','explore'].includes(s.phase)?newGame(undefined,s.profile):null;}
export function price(s,k){return k.cost+s.levels[k.id]*(k.costStep??4);}
export function locked(s,k){return Boolean((k.requires&&!s.levels[k.requires])||(k.event&&!s.profile.normalClears));}
export function upgrade(s,id){const k=skills.find(k=>k.id===id);if(!k||s.phase!=='prepare'||s.floor===1||locked(s,k)||s.levels[id]>=k.max||s.shards<price(s,k))return false;s.shards-=price(s,k);s.levels[id]++;if(id==='vitality')s.hp+=12;reveal(s);log(s,`「${k.name}」を思い出した。`,'good');return true;}
export function setMode(s,mode){if(s.phase!=='prepare')return false;if(!['stairs','collect','explore'].includes(mode))return false;s.mode=mode;s.orders=(mode==='stairs'?['stairs']:mode==='collect'?['collect-weapons','stairs']:['explore-all','stairs']).map(makeOrder);return true;}
export function equip(s,index){const g=s.inventory[index];if(s.phase!=='prepare'||!g)return false;const slot=gearById[g.baseId].slot;if(s.gear[slot].cursed){log(s,'呪いで装備を外せない。先に解呪が必要。','bad');return false;}const old=s.gear[slot];s.gear[slot]=g;s.inventory[index]=old;if(g.cursed)g.boundKnown=true;log(s,`${gearName(g)}を装備。${g.cursed?'呪いにより外せなくなった。':''}`,g.cursed?'bad':'good');return true;}
export function equipBest(s){
 if(s.phase!=='prepare')return false;
 let changed=false;
 for(const slot of ['weapon','armor']){
  const current=s.gear[slot];if(current.cursed||!current.identified)continue;
  const stat=slot==='weapon'?'attack':'defense';let score=gearStats(current)[stat],best=-1;
  const candidates=s.inventory.map((g,index)=>({g,index})).filter(({g})=>gearById[g.baseId].slot===slot&&g.identified&&!g.cursed).sort((a,b)=>(a.g.acquiredOrder??a.index)-(b.g.acquiredOrder??b.index));
  for(const {g,index} of candidates){const value=gearStats(g)[stat];if(value>score){score=value;best=index;}}
  if(best>=0&&equip(s,best))changed=true;
 }
 if(!changed)log(s,'変更できる上位装備はありません。');
 return changed;
}
export function getItem(s,ref){return typeof ref==='number'?s.inventory[ref]:s.gear[ref];}
// Deferred until the post-TRUE endgame is designed. Legacy entry points cannot mutate story saves.
export function identify(){return false;}
export function uncurse(){return false;}
export function discard(s,index){const g=s.inventory[index];if(s.phase!=='prepare'||!g)return false;s.inventory.splice(index,1);log(s,`${gearName(g)}を手放した。`);return true;}
export function synthesisResult(a,b){if(!a||!b||a===b||!a.identified||!b.identified||a.cursed||b.cursed||a.baseId!==b.baseId)return null;if((a.plus===0)!==(b.plus===0))return null;const result=a.plus===0?1:a.plus+b.plus;return result<=SYNTHESIS_CAP?result:null;}
export function synthesize(){return false;}
export function sortedInventory(s,slot,sort='acquired'){return s.inventory.map((g,index)=>({g,index})).filter(({g})=>gearById[g.baseId].slot===slot).sort((a,b)=>sort==='acquired'?(a.g.acquiredOrder??a.index)-(b.g.acquiredOrder??b.index):Number(b.g.identified)-Number(a.g.identified)||(a.g.identified&&b.g.identified?gearStats(b.g)[sort]-gearStats(a.g)[sort]:0)||(a.g.acquiredOrder??a.index)-(b.g.acquiredOrder??b.index));}
export function notifyB15(s){if(s.floor===LETTER_FLOOR&&!s.b15HintShown){s.b15HintShown=true;log(s,letterFloorThought(s.profile.normalClears),'story');return true;}return false;}
export function beginExploration(s){if(!['awakening','prepare'].includes(s.phase))return false;if(s.phase==='awakening'&&!s.augmentStarted){if(offerAugments(s,()=>nextRandom(s),'start')||s.augmentOffer)return false;s.augmentStarted=true;}if(s.augmentOffer)return false;if(s.phase==='prepare')s.newCards=[];s.phase='explore';notifyB15(s);return true;}
export function lineOfSight(s,a,b){let x=a.x,y=a.y;const dx=Math.abs(b.x-x),dy=Math.abs(b.y-y),sx=Math.sign(b.x-x),sy=Math.sign(b.y-y);let err=dx-dy;while(x!==b.x||y!==b.y){const twice=2*err;let nx=x,ny=y;if(twice>-dy){err-=dy;nx+=sx;}if(twice<dx){err+=dx;ny+=sy;}if(nx!==x&&ny!==y&&!s.grid[y]?.[nx]&&!s.grid[ny]?.[x])return false;x=nx;y=ny;if(x===b.x&&y===b.y)return true;if(!s.grid[y]?.[x])return false;}return true;}
export function canSee(s,x,y){return withinSightShape(x-s.player.x,y-s.player.y,radius(s))&&lineOfSight(s,s.player,{x,y});}
export function reveal(s){for(let y=0;y<s.grid.length;y++)for(let x=0;x<s.grid[y].length;x++)if(canSee(s,x,y))s.seen[y][x]=true;s.visited[s.player.y][s.player.x]=true;for(const e of s.enemies)if(canSee(s,e.x,e.y))register(s.profile.monsters,e.baseId);}
export function rollGear(floor,rng){const z=Math.min(9,zoneIndexForFloor(floor));const slot=rng()<.5?'weapon':'armor';const pool=equipment.filter(g=>g.slot===slot);const weights=pool.map(g=>1/Math.pow(1+Math.abs(g.rank-z),4));let pick=rng()*weights.reduce((a,b)=>a+b,0),base=pool[pool.length-1];for(let i=0;i<pool.length;i++){pick-=weights[i];if(pick<0){base=pool[i];break;}}const enhanced=rng()<.12,plus=enhanced?1+Math.floor(rng()*3):0;
 // Preserve the previous random sequence without spawning cursed or unidentified gear.
 rng();rng();return createGear(base.id,{plus});}
export function makeBossFloor(s,boss){
 s.trapStatus={};s.trapContact=null;
 s.undyingUsed=false;s.firstAttackUsed=false;s.unharmedTurns=0;
 const arena=bossArena(boss.basement,W,H),{grid}=arena;
 Object.assign(s,{rooms:arena.rooms,grid,player:arena.player,stairs:arena.stairs,seen:grid.map(r=>r.map(()=>false)),visited:grid.map(r=>r.map(()=>false)),enemies:[{...boss,baseId:boss.id,...arena.boss,maxHp:boss.hp,aggro:true,boss:true}],items:arena.items,traps:[],obstacles:[],bossFloor:true,gimmick:{...fieldPlan(s.seed,s.floor),triggered:false,room:null},nextHint:null,warped:false,mended:false,floorKills:0,steps:0,flash:null,intent:'階段を封じる門番の気配',retreatTurns:0,retreatCooldown:0,activeOrder:null});reveal(s);
}
export function makeFloor(s){
 s.trapStatus={};s.trapContact=null;
 resetThemeFloor(s);
 s.buildReport=emptyBuildReport(s.floor);
 s.undyingUsed=false;s.firstAttackUsed=false;s.unharmedTurns=0;
 const boss=bossForFloor(s.floor);if(boss){makeBossFloor(s,boss);return;}s.bossFloor=false;
 const z=zoneFor(s),rng=random(s.seed+s.floor*997),{grid,rooms,start,end}=generateDungeonLayout(s.floor,rng,{width:W,height:H,layout:z.layout});
 s.gimmick={...fieldPlan(s.seed,s.floor),triggered:false,room:null};s.traps=[];s.obstacles=[];s.nextHint=null;
 s.rooms=rooms;s.grid=grid;s.player={...start};s.stairs={...end};s.seen=grid.map(row=>row.map(()=>false));s.visited=grid.map(row=>row.map(()=>false));s.enemies=[];s.items=[];s.cardOffer=null;s.skillUses=[];s.guardHits=0;s.focusPower=false;s.executingRule=null;s.mended=false;s.warped=false;s.floorKills=0;s.heroWeakenedHits=0;s.actorSkillEvent=null;s.steps=0;s.flash=null;s.damageEvents=[];s.intent='視界の先を調べる';s.retreatTurns=0;s.retreatCooldown=0;s.activeOrder=null;
 const occupied=new Set([key(start),key(end)]);const free=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(grid[y][x]&&!occupied.has(`${x},${y}`)&&distance({x,y},start)>4)free.push({x,y});
 function spot(){if(!free.length)throw Error('No free tile');const p=free.splice(Math.floor(rng()*free.length),1)[0];occupied.add(key(p));return p;}
 for(let i=0;i<BALANCE.enemyCount(z.index);i++){const base=monsters[z.index*2+(i%3===2?1:0)];s.enemies.push({...base,baseId:base.id,...spot(),maxHp:base.hp,aggro:false});}
 for(let i=0;i<BALANCE.heartCount;i++)s.items.push({...spot(),type:'heart'});
 for(let i=0;i<2;i++)s.items.push({...spot(),type:rng()<.25?'heart':'fragment'});
 for(let i=0;i<4;i++)if(rng()<CHEST_CHANCE)s.items.push({...spot(),type:'chest',cardId:rollCardChest(s,rng)});
 if(s.floor===LETTER_FLOOR)s.items.push({...spot(),type:'letter'});
 if(['monsters','traps'].includes(s.gimmick.id)){
  const inside=(p,r)=>p.x>=r.x&&p.x<r.x+r.w&&p.y>=r.y&&p.y<r.y+r.h;
  const candidates=rooms.filter(r=>!inside(start,r)&&!inside(end,r));
  const room=candidates[Math.floor(rng()*candidates.length)];s.gimmick.room=room;
  const houseTiles=free.filter(p=>inside(p,room));
  const count=Math.min(s.gimmick.id==='monsters'?4:8,houseTiles.length);
  for(let i=0;i<count;i++){const tile=houseTiles.splice(Math.floor(rng()*houseTiles.length),1)[0];
   if(s.gimmick.id==='monsters'){const base=monsters[z.index*2+(i%2)];s.enemies.push({...base,baseId:base.id,...tile,maxHp:base.hp,aggro:false,house:true});}
   else s.traps.push({...tile,type:rollTrap(rng),spent:false,revealed:true});
  }
 }
 if(s.gimmick.id==='none'&&s.floor>1){const trapRng=random(s.seed+s.floor*7919+43);if(trapRng()<.25){for(let i=0,n=1+Math.floor(trapRng()*2);i<n&&free.length;i++)s.traps.push({...spot(),type:rollTrap(trapRng),spent:false,revealed:true});}}
 if(z.id==='crypt')placeCryptObstacles(s,rooms);
 reveal(s);
}
// Route planning traverses only discovered walkable tiles. No hidden enemy data.
export function route(s,test,{start=s.player,known=true,blocked=new Set()}={}){const q=[start],prev=new Map([[key(start),null]]);for(let i=0;i<q.length;i++){const p=q[i];if(test(p)){if(i===0)return start;let end=p;while(prev.get(key(end))!==start)end=prev.get(key(end));return end;}for(const [dx,dy]of dirs){const n={x:p.x+dx,y:p.y+dy},k=key(n);if(s.grid[n.y]?.[n.x]&&(!known||s.seen[n.y][n.x])&&!prev.has(k)&&!blocked.has(k)){prev.set(k,p);q.push(n);}}}return null;}
function modifierActive(s,id){return s.orders.some(o=>o.cards)?cardModifier(s,id,{canSee,stats,obtainable}):activeOrders(s).some(o=>o.id===id);}
export function targetEnemy(s){return dirs.map(([dx,dy])=>s.enemies.find(e=>e.x===s.player.x+dx&&e.y===s.player.y+dy)).find(Boolean);}
export function obtainable(s,i){return i.type==='letter'?Boolean(s.profile.normalClears&&!s.letter):true;}
function receiveReward(s,id){const fresh=grantReward(s,id);log(s,fresh?'「'+rewardById[id].name+'」を手に入れた。'+(rewardById[id].kind==='order'?'次の準備で探索指示に設定できる。':'この旅で使用できる。'):'「'+rewardById[id].name+'」は取得済み。記憶の欠片 +5','good');}
function pickup(s){const item=s.items.find(i=>i.x===s.player.x&&i.y===s.player.y);if(!item)return;if(!obtainable(s,item)){s.intent='封じられた宝箱。まだ思い出せない';return;}s.items=s.items.filter(i=>i!==item);
 if(isHealingItem(item)){const heal=Math.min(stats(s).maxHp-s.hp,BALANCE.heartHeal);s.hp+=heal;log(s,'回復ポーション。HP +'+heal,'good');}
 else if(item.type==='fragment'){const amount=3+(hasAugment(s,'scavenger')?ap(s,'scavenger').extra:0)+(hasAugment(s,'lucky-find')&&nextRandom(s)<Math.min(1,ap(s,'lucky-find').chance)?4:0);s.shards+=amount;log(s,'床の記憶の欠片を拾った。＋'+amount,'good');}
 else if(item.type==='gear'){acquire(s,item.gear);log(s,gearName(item.gear)+'を拾った。','good');}
 else if(item.type==='reward')receiveReward(s,item.rewardId);
 else if(item.type==='letter'){s.letter=true;log(s,'古びた手紙を手に取った。今度こそ、届けよう。','story');}
 else if(item.type==='chest'){log(s,'宝箱を開けた。','good');if(item.cardId){const t=themeState(s),gamble=hasAugment(s,'destiny')&&!t.destinyUsed;if(gamble)t.destinyUsed=true;const win=gamble?nextRandom(s)<Math.min(1,ap(s,'destiny').chance):false,categories=chestCategoryChoices(s,item.cardId,()=>nextRandom(s)),choices=categories[cardByKey[item.cardId].kind]||Object.values(categories)[0];s.cardOffer={choices,categories,remaining:gamble&&win?2:1,...(gamble?{gamble:true,lost:!win,consolation:ap(s,'destiny').consolation}:{})};log(s,'箱の中で、いくつもの記憶が揺れている。ひとつ選ぼう。','good');}else if(item.gear){acquire(s,item.gear);s.shards+=2;log(s,'旧宝箱から'+gearName(item.gear)+'を入手。記憶の欠片 +2','good');}else receiveReward(s,item.rewardId);}
}
export function dropFromEnemy(s,e){if(e.reinforcement)return null;const rng=()=>nextRandom(s),drop=rollEnemyDrop(e.baseId,rng);if(!drop)return null;
 const q=[{x:e.x,y:e.y}],seen=new Set([key(e)]);let position=null;
 for(let i=0;i<q.length;i++){const p=q[i];if(key(p)!==key(s.stairs)&&!s.items.some(i=>key(i)===key(p))&&!s.enemies.some(o=>key(o)===key(p))){position=p;break;}for(const [dx,dy] of dirs){const n={x:p.x+dx,y:p.y+dy};if(s.grid[n.y]?.[n.x]&&!seen.has(key(n))){seen.add(key(n));q.push(n);}}}
 if(!position){log(s,'落とした品は瓦礫に埋もれた。');return null;}
 const item={...position,type:drop.type};if(drop.type==='gear'){const plus=rng()<.12?1+Math.floor(rng()*3):0;item.gear=createGear(drop.id,{plus});}else if(drop.type==='reward')item.rewardId=drop.id;s.items.push(item);log(s,e.name+'が'+(drop.type==='gear'?gearName(item.gear):rewardById[drop.id].name)+'を落とした。');return item;
}
export function attackEnemy(s,enemy,{splashDamage=null,power=1,skill=false,leech=0}={}){
 if(!s.enemies.includes(enemy)||enemy.hp<=0)return;
 const strike=()=>{const b=augmentBonus(s,stats(s).maxHp),critical=(hasAugment(s,'moon')&&!s.firstAttackUsed&&s.hp===stats(s).maxHp)||(splashDamage===null&&b.critical>0&&nextRandom(s)<b.critical),base=Math.max(1,stats(s).attack-enemyDefense(s,enemy))*power*(s.heroWeakenedHits>0?.5:1)*(b.charged?ap(s,'charge').damage:1)*(themeBuff(s,'nextPower')|| (s.focusPower?1.25:1))*b.damage*(hasAugment(s,'risky-blade')?(nextRandom(s)<.5?ap(s,'risky-blade').damage:.8):1),rawDamage=splashDamage??(critical?Math.ceil(base*(hasAugment(s,'moon')&&!s.firstAttackUsed&&s.hp===stats(s).maxHp?ap(s,'moon').damage:1.5)):Math.ceil(base)),damage=mitigateControlledDamage(s,enemy,rawDamage),actual=Math.min(enemy.hp,damage);enemy.hp-=damage;if(s.heroWeakenedHits>0)s.heroWeakenedHits--;recordBuild(s,'damageDealt',actual);if(critical)recordBuild(s,'criticalHits');if(b.charged&&splashDamage===null)recordBuild(s,'chargedHits');s.firstAttackUsed=true;s.focusPower=false;delete themeState(s).buffs.nextPower;if(critical)themeState(s).pity=0;else themeState(s).pity++;if(b.charged&&splashDamage===null)s.unharmedTurns=0;(s.damageEvents??=[]).push({x:enemy.x,y:enemy.y,damage,hero:false});s.flash={x:enemy.x,y:enemy.y,kind:'hit'};if(critical)log(s,'会心の一撃！ '+damage+'ダメージ。','good');if(b.leech+leech>0){const heal=Math.max(0,Math.min(stats(s).maxHp-s.hp,Math.floor(actual*(b.leech+leech))));s.hp+=heal;recordBuild(s,'leechHealing',heal);if(heal)log(s,'吸命の記憶。HP +'+heal,'good');}};
 strike();if(!skill&&splashDamage===null&&enemy.hp>0&&hasAugment(s,'double-strike')&&nextRandom(s)<Math.min(1,ap(s,'double-strike').chance)){recordBuild(s,'doubleStrikes');log(s,'追撃の記憶が発動！','good');strike();}
 if(enemy.hp<=0)defeatEnemy(s,enemy);
 if(splashDamage===null&&hasAugment(s,'nova'))for(const other of [...s.enemies])if(other!==enemy&&canSee(s,other.x,other.y))attackEnemy(s,other,{splashDamage:Math.max(1,Math.floor(Math.max(1,stats(s).attack-other.defense)/(distance(s.player,other)+1)))});
}
function defeatEnemy(s,enemy){s.enemies=s.enemies.filter(e=>e!==enemy);s.kills++;s.floorKills++;if(!enemy.reinforcement&&!enemy.boss)themeState(s).normalKills++;const exp=!enemy.reinforcement&&s.level<MAX_LEVEL?(monsterById[enemy.baseId||enemy.id]?.experience??3):0;const gained=gainExperience(s,exp);if(exp)log(s,`経験値 +${exp}`,'good');if(gained)log(s,`レベルアップ！ Lv.${s.level}。HP +${gained*HP_PER_LEVEL}`,'good');const fragments=enemy.reinforcement?0:enemy.boss?8:1;s.shards+=fragments;log(s,enemy.name+'を倒した。'+(fragments?'記憶の欠片 +'+fragments:'増援からの報酬はない。'),'good');if(!enemy.reinforcement)dropFromEnemy(s,enemy);if(enemy.boss){log(s,'門番の封印が解けた。階段を上れる。','story');offerAugments(s,()=>nextRandom(s),'boss:'+s.floor);}}
function controlledHitHero(s,e,{power=1,leech=0,controlled=true}={}){const b=themeBuff({steps:s.steps,themeState:e.control?.state},'nextPower')||1,weak=e.weakenedHits>0;if(weak)e.weakenedHits--;const damage=skillDamage(s,Math.ceil(incomingDamage(enemyAttack(s,e),stats(s).defense)*power*b*(weak?.5:1))),before=s.hp;if(takeHeroDamage(s,damage))log(s,'骨の執念で踏みとどまった。','good');const actual=before-s.hp;if(e.control?.state)delete e.control.state.buffs.nextPower;if(leech)e.hp=Math.min(e.maxHp,e.hp+Math.floor(actual*leech));s.damageEvents.push({...s.player,damage,hero:true,source:{x:e.x,y:e.y}});s.flash={...s.player,kind:'hurt'};log(s,e.name+(controlled?'が指示に従って攻撃。':'の攻撃。')+damage+'ダメージ。','bad');if(s.hp<=0){s.hp=0;s.phase='dead';s.cardOffer=null;s.nextHint=nextStageHint(s);log(s,'骨が崩れた。再び最深部へ。','story');}}
function warpDestination(s){if(trapActive(s,null,'snare'))return null;const cells=[];for(let y=1;y<s.grid.length-1;y++)for(let x=1;x<s.grid[y].length-1;x++)if(s.grid[y][x]&&key({x,y})!==key(s.player)&&key({x,y})!==key(s.stairs)&&!s.enemies.some(e=>e.x===x&&e.y===y))cells.push({x,y});return cells.length?cells[Math.floor(nextRandom(s)*cells.length)]:null;}
// Shared by real turns and the preparation decision tester. No mutations or RNG.
export function planHeroTurn(s){
 const ctx={canSee,stats,obtainable,enemyPlan:(state,r,e)=>planEnemyCommand(state,r,e,{canSee,stats,route,lineOfSight})},avoid=modifierActive(s,'avoid-traps');
 const heroRoute=(state,test,options={})=>{const blocked=new Set(options.blocked||[]);if(avoid)for(const t of state.traps||[])if(t.revealed&&!t.spent&&(state.gimmick?.id==='traps'||state.seen[t.y]?.[t.x]))blocked.add(key(t));return route(state,test,{...options,blocked})||(avoid?route(state,test,options):null);};ctx.route=heroRoute;
 const forceBasic=bypassDirectives(s),cardPlan=forceBasic?chooseCardOrder(s,{...ctx,ignoreDirectives:true}):(!s.orders.length||s.orders.some(o=>o.cards))?chooseCardOrder(s,ctx):null,adjacentEnemy=targetEnemy(s);
 const emergency=!forceBasic&&!s.orders.some(o=>o.cards)&&adjacentEnemy?chooseOrder(s,ctx,true):null;
 const escapePlan=cardPlan&&(cardPlan.skill||cardPlan.warp||cardPlan.flee||cardPlan.wait||cardPlan.control),enemy=cardPlan?.enemy||(escapePlan||emergency?null:adjacentEnemy);
 let action=cardPlan||emergency;
 if(!enemy){
  if(!forceBasic)action ||= chooseOrder(s,ctx);
  // Cards prioritize tasks. When none applies, a known unsealed stair is a safe fallback.
  if(!action){const visible=s.enemies.filter(e=>canSee(s,e.x,e.y)),next=visible.length?heroRoute(s,p=>visible.some(e=>distance(p,e)===1),{blocked:new Set(visible.map(key))}):null;if(next)action={next,intent:'進路の敵に向き合う'};}
  if(!action&&!s.enemies.some(e=>e.boss)&&s.seen[s.stairs.y]?.[s.stairs.x]){const next=heroRoute(s,p=>key(p)===key(s.stairs));if(next)action={next,exit:true,intent:'基本行動：見つけた階段へ向かう'};}
  if(!action){const next=heroRoute(s,p=>!s.visited[p.y][p.x]&&dirs.some(([dx,dy])=>s.seen[p.y+dy]?.[p.x+dx]===false))||heroRoute(s,p=>!s.visited[p.y][p.x]);action=next?{next,intent:'基本行動：視界の先を調べる'}:{next:heroRoute(s,p=>key(p)===key(s.stairs)),exit:true,intent:'基本行動：探索を終え、階段へ'};}
 }
 return {enemy,action,ruleIndex:enemy?(cardPlan?.enemy?cardPlan.ruleIndex:null):action?.ruleIndex??null};
}
function skillDamage(s,damage){return mitigateThemeDamage(s,damage,{has:hasAugment,stats});}
function applyTrap(s,enemy=null){
 return triggerTrap(s,enemy,{rng:()=>nextRandom(s),log,maxHp:()=>stats(s).maxHp,
  protected:()=>{const t=themeState(s);if(t.trapPass>0){t.trapPass--;return true;}return false;},
  damage:(e,n)=>{
   const damage=e?mitigateControlledDamage(s,e,n):skillDamage(s,n);
   if(e){e.hp=Math.max(0,e.hp-damage);s.damageEvents.push({x:e.x,y:e.y,damage,hero:false});if(e.hp<=0)defeatEnemy(s,e);}
   else{if(takeHeroDamage(s,damage))log(s,'骨の執念で踏みとどまった。','good');s.damageEvents.push({...s.player,damage,hero:true});s.flash={...s.player,kind:'hurt'};if(s.hp<=0){s.hp=0;s.phase='dead';s.cardOffer=null;s.nextHint=nextStageHint(s);log(s,'罠で骨が崩れた。再び最深部へ。','story');}}
   log(s,(e?e.name:'骸')+'に'+damage+'ダメージ。',e?'':'bad');
  }});
}
export function tick(s){
 if(s.phase!=='explore'||s.augmentOffer||s.cardOffer)return;notifyB15(s);s.unharmedTurns=(s.unharmedTurns||0)+1;s.turn++;s.steps++;s.flash=null;s.damageEvents=[];reveal(s);const st=stats(s);const report=buildReport(s),bonus=augmentBonus(s,st.maxHp,s.enemies.filter(e=>canSee(s,e.x,e.y)).length);report.turns++;report.peakAttackBonus=Math.max(report.peakAttackBonus,bonus.attack);report.peakDefenseBonus=Math.max(report.peakDefenseBonus,bonus.defense);
 beginDirectiveSafety(s,log);const progressBefore=progressSnapshot(s);s.actorSkillEvent=null;for(const e of s.enemies)if(e.control)e.control.unharmedTurns++;if(s.retreatCooldown>0)s.retreatCooldown--;
 const sealedStart=s.enemies.some(e=>e.boss)&&key(s.player)===key(s.stairs);
 const {enemy,action:plannedAction,ruleIndex}=planHeroTurn(s);let action=plannedAction;s.activeOrder=null;s.executingRule=ruleIndex===null?(!enemy&&action?.fixed?'fixed':null):ruleIndex;recordRule(s,ruleIndex);
 let controlledActor=null;
 if(action?.control){controlledActor=action.control.actor;executeEnemyCommand(s,action.control,{stats,route,lineOfSight,rng:()=>nextRandom(s),log,hitHero:controlledHitHero});s.intent='敵への指示：'+action.intent.replace('カード指示：','');if(s.hp<=0)return;}
 else if(enemy){s.intent=`隣接する${enemy.name}と交戦`;attackEnemy(s,enemy);}
 else {
  if(action.wait)s.intent=action.intent;
  if(action.warp&&!action.skill)action.skill='warp';
  if(action.skill){s.intent=action.intent;s.activeOrder='cards';executeThemedSkill(s,action.skill,{stats,canSee,route,reveal,attackEnemy,warpDestination,has:hasAugment,rng:()=>nextRandom(s),log,recordMend:n=>{recordBuild(s,'mendUses');recordBuild(s,'mendHealing',n);}});}
  if(action.next&&!trapActive(s,null,'snare')){s.player={...action.next};s.intent=action.intent;s.activeOrder=action.id||null;reveal(s);}
  if(action.flee){s.retreatTurns++;if(s.retreatTurns>=4){s.retreatTurns=0;s.retreatCooldown=6;}}else s.retreatTurns=0;
 }
 updateThemeExploration(s,{has:hasAugment,stats,log});
 if(s.augmentOffer)return;
 pickup(s);
 const house=s.gimmick?.room;
 if(house&&!s.gimmick.triggered&&s.player.x>=house.x&&s.player.x<house.x+house.w&&s.player.y>=house.y&&s.player.y<house.y+house.h){s.gimmick.triggered=true;log(s,s.gimmick.name+'！','bad');if(s.gimmick.id==='monsters')for(const e of s.enemies)if(e.house)e.aggro=true;}
 applyTrap(s);
 if(s.hp<=0)return;
 for(const e of [...s.enemies]){
  if(!s.enemies.includes(e))continue;
  if(e!==controlledActor){
   const sight=Math.max(2,6+themeBuff({steps:s.steps,themeState:e.control?.state},'sight')-trapSightPenalty(s,e));
   if(distance(e,s.player)<=sight&&lineOfSight(s,e,s.player))e.aggro=true;
   const alarm=e.trapAlarm?.until>=s.steps?e.trapAlarm:null;
   const obscured=trapSightPenalty(s,e)>0&&(distance(e,s.player)>sight||!lineOfSight(s,e,s.player));
   if((!e.house||s.gimmick?.triggered||alarm)&&(!obscured||alarm)&&e.aggro&&s.turn%e.period===0){
    if(distance(e,s.player)===1){controlledHitHero(s,e,{controlled:false});if(s.hp<=0)return;}
    else if(!trapActive(s,e,'snare')){const next=route(s,p=>alarm?key(p)===key(alarm):distance(p,s.player)===1,{start:e,known:false,blocked:new Set(s.enemies.filter(o=>o!==e).map(key))});if(next&&key(next)!==key(s.player)){e.x=next.x;e.y=next.y;}}
   }
  }
  applyTrap(s,e);
  if(s.augmentOffer)return;
 }
 reveal(s);
 updateDirectiveSafety(s,progressBefore,!enemy&&Boolean(action?.wait||action?.control?.wait),log);
 const bossAlive=s.enemies.some(e=>e.boss);
 if(bossAlive&&(sealedStart||key(s.player)===key(s.stairs)))s.intent='階段は封印中。中ボスを倒す必要がある';
 const done=Boolean(action?.exit)&&!bossAlive;
 if(done&&key(s.player)===key(s.stairs)){const reward=8+Math.floor(s.floor/3);s.shards+=reward;s.phase='cleared';const heal=clearAugmentHealing(s,stats(s).maxHp);if(heal){recordBuild(s,'swiftHealing',heal);s.hp+=heal;log(s,'駆け上がる記憶。HP +'+heal,'good');}s.nextHint=nextStageHint(s);log(s,`${floorLabel(s)} Clear。記憶の欠片 +${reward}`,'good');const memory=storyFragment(s.floor,s.profile.normalClears);if(memory){s.memories.push(memory);log(s,memory,'story');}}
 if(s.phase==='explore'){const z=zoneFor(s),e=spawnReinforcement(s,{canSee,rng:()=>nextRandom(s),pool:monsters.filter(m=>m.id.startsWith('enemy-')&&m.zone===z.index)});if(e)log(s,'遠くで、新たな足音が響いた。長居は危険だ。','bad');}
}
export function ascend(s){if(s.phase!=='cleared')return false;if(s.floor===LAST_FLOOR){s.phase='ending';s.profile.normalClears++;if(!s.ownedCards.includes('action:letter'))grantCard(s,'action:letter');log(s,'地上で、若者が剣を抜いた。「魔物か」','story');log(s,'骸は言葉を伝えられないまま、若者の剣に倒れた。','story');return true;}if(s.buildReport)s.lastBuildReport=structuredClone(s.buildReport);s.floor++;s.phase='prepare';makeFloor(s);s.hp=Math.min(stats(s).maxHp,s.hp+Math.ceil(stats(s).maxHp*(BALANCE.restRatio+(hasAugment(s,'restful')?ap(s,'restful').heal:0))));log(s,`${floorLabel(s)}へ。休息して次の探索に備える。`,'good');return true;}
export function codexRows(s,kind){if(kind==='augments')return augments.map(a=>({...a,known:true,owned:hasAugment(s,a.id),discovered:s.profile.augments?.includes(a.id)??false}));if(kind==='cards')return cardCodexRows(s);if(kind==='skills')return rewardDefinitions.filter(r=>Boolean(themedSkillById[r.id])).map(r=>s.profile.skills.includes(r.id)?{...r,known:true,owned:(r.kind==='skill'?s.abilities:s.unlockedOrders).includes(r.id)}:{known:false});if(kind==='monsters')return monsters.map(m=>s.profile.monsters.includes(m.id)?{name:m.name,attack:m.attack,defense:m.defense,zone:zones[m.zone].name,known:true}:{known:false});return equipment.map(g=>s.profile.knownEquipment.includes(g.id)&&s.profile.equipment.includes(g.id)?{name:g.name,attack:g.attack,defense:g.defense,slot:g.slot,acquiredOrder:s.profile.equipment.indexOf(g.id),known:true}:{known:false,slot:g.slot});}
function validMapShape(s){const h=s.grid?.length,w=s.grid?.[0]?.length;return ((w===W&&h===H)||(w===31&&h===23))&&s.grid.every(r=>Array.isArray(r)&&r.length===w)&&[s.seen,s.visited].every(g=>Array.isArray(g)&&g.length===h&&g.every(r=>Array.isArray(r)&&r.length===w))&&(s.rooms===undefined||Array.isArray(s.rooms)&&s.rooms.every(r=>r&&['x','y','w','h'].every(k=>Number.isInteger(r[k]))&&r.x>=0&&r.y>=0&&r.w>0&&r.h>0&&r.x+r.w<=w&&r.y+r.h<=h));}
function validTacticsSave(s){if(!s||!validTraps(s)||!validDirectiveSafety(s)||!validEnemyControls(s)||!validThemeState(s.themeState)||!validChestCategories(s.cardOffer))return false;if(s.themeState&&(!s.themeState.rooms.every(i=>i<(s.rooms?.length||0))||!s.themeState.mappedRooms.every(i=>i<(s.rooms?.length||0))||!s.themeState.mappedTiles.every(i=>i<(s.grid?.length||0)*(s.grid?.[0]?.length||0))))return false;return (s.cardOffer==null||s.phase==='explore'&&(s.cardOffer.remaining===undefined||Number.isInteger(s.cardOffer.remaining)&&s.cardOffer.remaining>=1&&s.cardOffer.remaining<=2)&&(s.cardOffer.gamble===undefined||typeof s.cardOffer.gamble==='boolean')&&(s.cardOffer.lost===undefined||typeof s.cardOffer.lost==='boolean')&&(s.cardOffer.consolation===undefined||[10,12,16,24].includes(s.cardOffer.consolation))&&Array.isArray(s.cardOffer.choices)&&s.cardOffer.choices.length>=1&&s.cardOffer.choices.length<=8&&new Set(s.cardOffer.choices).size===s.cardOffer.choices.length&&s.cardOffer.choices.every(k=>cardByKey[k]&&!INITIAL_CARDS.includes(k)&&k!=='action:letter'&&cardByKey[k].kind===cardByKey[s.cardOffer.choices[0]]?.kind&&cardByKey[k].rarity===cardByKey[s.cardOffer.choices[0]]?.rarity))&&(s.skillUses===undefined||Array.isArray(s.skillUses)&&new Set(s.skillUses).size===s.skillUses.length&&s.skillUses.every(id=>Boolean(themedSkillById[id])))&&(s.focusPower===undefined||typeof s.focusPower==='boolean')&&(s.guardHits===undefined||Number.isInteger(s.guardHits)&&s.guardHits>=0&&s.guardHits<=4);}
export function validateSave(s){return Boolean(validTacticsSave(s)&&s?.version===16&&validBuildReport(s.buildReport)&&validBuildReport(s.lastBuildReport)&&typeof s.augmentStarted==='boolean'&&['trapTriggers','unharmedTurns'].every(k=>Number.isSafeInteger(s[k])&&s[k]>=0)&&typeof s.undyingUsed==='boolean'&&typeof s.firstAttackUsed==='boolean'&&Array.isArray(s.profile?.augments)&&s.profile.augments.every(id=>augmentById[id])&&Array.isArray(s.augments)&&s.augments.every(id=>augmentById[id])&&new Set(s.augments).size===s.augments.length&&(!s.augmentOffer||['start',...['11','21','30'].map(f=>'boss:'+f)].includes(s.augmentOffer.source)&&Array.isArray(s.augmentOffer.choices)&&s.augmentOffer.choices.length>=1&&s.augmentOffer.choices.length<=3&&new Set(s.augmentOffer.choices).size===s.augmentOffer.choices.length&&s.augmentOffer.choices.every(id=>augmentById[id]&&!s.augments.includes(id)))&&(s.newCards===undefined||Array.isArray(s.newCards)&&new Set(s.newCards).size===s.newCards.length&&s.newCards.every(k=>Boolean(cardByKey[k])&&s.ownedCards?.includes(k)&&!INITIAL_CARDS.includes(k)))&&Array.isArray(s.ownedCards)&&s.ownedCards.every(key=>Boolean(cardByKey[key]))&&new Set(s.ownedCards).size===s.ownedCards.length&&Number.isInteger(s.level)&&s.level>=1&&s.level<=MAX_LEVEL&&Number.isSafeInteger(s.experience)&&s.experience>=0&&(s.level===MAX_LEVEL?s.experience===0:s.experience<experienceToNext(s.level))&&!Object.hasOwn(s,'keys')&&Number.isInteger(s.rngState)&&s.rngState>=0&&s.rngState<=4294967295&&typeof s.warped==='boolean'&&Array.isArray(s.abilities)&&s.abilities.every(id=>rewardById[id]?.kind==='skill')&&new Set(s.abilities).size===s.abilities.length&&Array.isArray(s.unlockedOrders)&&s.unlockedOrders.every(id=>rewardById[id]?.kind==='order')&&new Set(s.unlockedOrders).size===s.unlockedOrders.length&&Number.isInteger(s.nextAcquisition)&&s.nextAcquisition>=0&&Array.isArray(s.logs)&&Array.isArray(s.enemies)&&Array.isArray(s.items)&&s.items.every(i=>i&&Number.isInteger(i.x)&&Number.isInteger(i.y)&&i.x>=0&&i.x<W&&i.y>=0&&i.y<H&&(['heart','potion','herb','fragment','letter'].includes(i.type)||i.type==='gear'&&gearById[i.gear?.baseId]||i.type==='reward'&&rewardById[i.rewardId]||i.type==='chest'&&(i.gear?gearById[i.gear.baseId]:Boolean((cardByKey[i.cardId]||rewardById[i.rewardId])&&!Object.hasOwn(i,'locked')))))&&Array.isArray(s.memories)&&Number.isInteger(s.floor)&&s.floor>=1&&s.floor<=LAST_FLOOR&&['awakening','prepare','explore','cleared','dead','ending'].includes(s.phase)&&validMapShape(s)&&s.levels&&skills.every(k=>Number.isInteger(s.levels[k.id])&&s.levels[k.id]>=0&&s.levels[k.id]<=k.max)&&Array.isArray(s.orders)&&s.orders.length<=orderCapacity(s)&&s.orders.every(o=>validCardRule(s,o))&&s.profile&&typeof s.profile.trueEnding==='boolean'&&['monsters','equipment','knownEquipment','skills','cards'].every(k=>Array.isArray(s.profile[k]))&&s.profile.skills.every(id=>rewardById[id])&&s.profile.cards.every(key=>Boolean(cardByKey[key]))&&s.gear&&Object.values(s.gear).every(g=>gearById[g.baseId])&&Array.isArray(s.inventory)&&s.inventory.every(g=>gearById[g.baseId])&&validCryptObstacles(s));}

export function normalizeSave(input){
 if(!input||![2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].includes(input.version))return null;const s=structuredClone(input);if(input.version<16)delete s.actorRuleRevision;if(input.version<16){delete s.buildReport;delete s.lastBuildReport;}if(s.obstacles===undefined)s.obstacles=[];if(s.profile&&s.profile.trueEnding===undefined)s.profile.trueEnding=false;
 if(s.version===2){for(const k of skills)s.levels[k.id]??=0;s.orders=(s.mode==='collect'?['collect-weapons','stairs']:s.mode==='explore'?['explore-all','stairs']:['stairs']).map(makeOrder);s.retreatTurns=0;s.retreatCooldown=0;s.activeOrder=null;}
 if(s.version<4){
  // Exact acquisition timestamps did not exist before v4. Keep a stable inferred order.
  const owned=[...s.inventory,...Object.values(s.gear)];owned.sort((a,b)=>Number(['weapon-0','armor-0'].includes(b.baseId))-Number(['weapon-0','armor-0'].includes(a.baseId)));
  owned.forEach((g,i)=>{g.acquiredOrder=i;});s.nextAcquisition=owned.length;s.b15HintShown=false;s.version=4;
 }
 if(s.version<6){
  // Preserve relative progress, equipment and records when shortening 50 stages to 30.
  s.floor=1+Math.floor((s.floor-1)*29/49);
  const retired=['collect','exploration','exitLow','exitTimed','exitLoot','chestSense','chestNear','survival','healEarly','exploreNear','avoidGroup','evasion','huntAny','huntInjured','huntWeak','huntDanger'];
  let refund=0;for(const id of retired){if(s.levels[id]){const costs={collect:7,exploration:8,exitLow:5,exitTimed:5,exitLoot:6,chestSense:5,chestNear:6,survival:6,healEarly:6,exploreNear:5,avoidGroup:7,evasion:8,huntAny:5,huntInjured:6,huntWeak:7,huntDanger:7};refund+=costs[id]*s.levels[id];}delete s.levels[id];}
  s.shards+=refund;s.b15HintShown=s.b15HintShown||false;
  s.gimmick={id:'none',name:'移行済みの階',triggered:false,room:null};s.traps=[];
  s.items=s.items.filter(i=>i.type!=='letter');
  if(s.floor===LETTER_FLOOR&&!s.letter){const p=s.grid.flatMap((row,y)=>row.map((c,x)=>({c,x,y}))).find(p=>p.c&&key(p)!==key(s.player)&&key(p)!==key(s.stairs)&&!s.enemies.some(e=>key(e)===key(p))&&!s.items.some(i=>key(i)===key(p)));if(p)s.items.push({x:p.x,y:p.y,type:'letter'});}
  s.nextHint=['cleared','dead','ending'].includes(s.phase)?nextStageHint(s):null;
  s.version=6;log(s,'30階版へ移行。指示は全開放。旧指示スキル補償として記憶の欠片 '+refund+'個を返還。','story');
 }
 if(s.version<7){s.traps??=[];for(const t of s.traps)t.revealed=true;s.bossFloor=false;if(s.floor===1&&s.phase==='prepare')s.phase='awakening';s.version=7;}
 if(s.version<8){
  let refund=0;
  for(const [id,cost] of Object.entries({identify:5,uncurse:5,synthesis:8,bond:15})){
   const level=Math.min(1,Math.max(0,Math.trunc(s.levels[id]||0)));refund+=level*cost;delete s.levels[id];
  }
  s.shards+=refund;
  for(const g of [...Object.values(s.gear),...s.inventory,...s.items.filter(i=>i.type==='chest'&&i.gear).map(i=>i.gear)]){g.identified=true;g.cursed=false;g.boundKnown=false;}
  for(const id of s.profile.equipment)register(s.profile.knownEquipment,id);
  if(s.intent==='封じられた宝箱。絆の記憶が必要')s.intent='封じられた宝箱。まだ思い出せない';
  s.version=8;log(s,'育成を整理。旧機能の習得費用として記憶の欠片 '+refund+'個を返還。装備は鑑定済み・呪いなしへ移行。','story');
 }
 if(s.version<9){
  s.keys=0;s.abilities=[];s.unlockedOrders=[];s.rngState=s.seed>>>0;s.warped=false;s.profile.skills??=[];
  let refund=0;if(s.levels.tactics){refund+=8;}if(s.levels.mend){refund+=10;grantReward(s,'mend');}delete s.levels.tactics;delete s.levels.mend;s.shards+=refund;
  // Existing generated gear chests remain free legacy chests. New floors use locked reward chests.
  for(const i of s.items)if(i.type==='chest'&&i.gear)i.locked=false;
  s.version=9;log(s,'ドロップ版へ移行。旧戦術・再生の費用として記憶の欠片 '+refund+'個を返還。新しい階から特殊報酬宝箱が出現。','story');
 }
 if(s.version<10){
  s.levels.cardSlots=0;s.orders=s.orders.map(legacyToCards);
  if(s.abilities.includes('mend')&&s.orders.length<orderCapacity(s))s.orders.unshift(createCardRule('self',[{id:'hp-below',value:35}],'skill','mend'));
  s.version=10;log(s,'カード指示へ移行。再生の祈りは条件を組んで発動。設定は準備中に変更できる。','story');
 }
 if(s.version<11){s.level=1;s.experience=0;s.version=11;}s.damageEvents=[];s.actorSkillEvent=null;
 if(s.version<12)s.version=12;
 if(s.version<13){
  if(!Array.isArray(s.items)||!Array.isArray(s.orders)||s.orders.some(rule=>rule?.cards&&!Array.isArray(rule.conditions)))return null;
  delete s.keys;s.items=s.items.filter(i=>i.type!=='key');for(const i of s.items)if(i.type==='chest')delete i.locked;
  for(const rule of s.orders)if(rule.cards)rule.conditions=rule.conditions.filter(c=>c.id!=='keys');
  s.version=13;log(s,'鍵を廃止。宝箱は鍵なしで開封できます。旧鍵と鍵条件は削除しました。','story');
 }
 if(s.version<14){if(!s.profile||!Array.isArray(s.profile.skills)||!Array.isArray(s.abilities)||!Array.isArray(s.unlockedOrders)||!Array.isArray(s.orders)||s.orders.some(r=>!r||typeof r.id!=='string'||r.cards&&(!Array.isArray(r.conditions)||r.conditions.some(c=>!c||typeof c.id!=='string'))))return null;migrateHealingItems(s);migrateCardInventory(s);s.version=14;log(s,'カード所持制へ移行。設定済みの指示と所持スキルを維持しました。','story');}
 if(s.version<15){s.augments=[];s.profile.augments=(s.profile.skills||[]).filter(id=>augmentById[id]);s.augmentOffer=null;s.augmentStarted=s.phase!=='awakening';s.trapTriggers=0;s.unharmedTurns=0;s.undyingUsed=false;s.firstAttackUsed=false;
 for(const id of ['critical','leech','double-strike'])if(s.abilities.includes(id)){s.augments.push(id);if(!s.profile.augments.includes(id))s.profile.augments.push(id);}
 s.orders=s.orders.filter(r=>!['critical','leech','double-strike'].includes(r.effect?.id));s.abilities=s.abilities.filter(id=>!['critical','leech','double-strike'].includes(id));s.ownedCards=s.ownedCards.filter(k=>cardByKey[k]||retiredTargets.includes(k)||k==='action:tactics'||k==='condition:loot-empty'||k==='condition:injured');s.profile.cards=s.profile.cards.filter(k=>cardByKey[k]||retiredTargets.includes(k)||k==='action:tactics'||k==='condition:loot-empty'||k==='condition:injured');
 for(const i of s.items)if(i.type==='chest'&&!i.gear&&i.cardId&&!cardByKey[i.cardId]&&i.cardId!=='action:tactics'&&i.cardId!=='condition:loot-empty'&&i.cardId!=='condition:injured'&&i.cardId!=='action:attack'&&!retiredTargets.includes(i.cardId)&&!retiredCollectionCards[i.cardId.replace('action:','')]){const id=i.cardId.replace('skill:','');delete i.cardId;if(augmentById[id])i.rewardId=id;else i.cardId=rollCardChest(s,()=>nextRandom(s));}else if(i.cardId==='action:letter'){i.cardId=rollCardChest(s,()=>nextRandom(s));}
 if(s.profile.normalClears&&!s.ownedCards.includes('action:letter'))grantCard(s,'action:letter');s.version=15;log(s,'常時スキルをオーグメントへ移行。品物取得は装備取得へ変更しました。','story');}
 if(s.version<16){migrateRetiredCards(s,input);s.version=16;log(s,'一括取得カードを削除。旧指示は武器／回復ポーションに置換し、防具カードも補填しました。増援はこの階の経過ターンに従って出現します。','story');}
 removeTacticsCard(s);migrateLootCondition(s);normalizeThemes(s);if(s.actorRuleRevision!==undefined&&s.actorRuleRevision!==1)return null;if(!Array.isArray(s.orders)||!Array.isArray(s.items)||!Array.isArray(s.ownedCards)||!Array.isArray(s.profile?.cards))return null;if(s.actorRuleRevision===undefined)s.orders=s.orders.map(r=>r&&!r.cards&&typeof r.id==='string'?legacyToCards(r):r);migrateActorRules(s);migrateDirectiveCards(s);migrateHealingItems(s);if(s.newCards===undefined)s.newCards=[];if(!validateSave(s))return null;const t=themeState(s);for(const id of [...(s.skillUses||[]),...(s.mended?['mend']:[]),...(s.warped?['warp']:[])])if(!t.used.includes(id))t.used.push(id);reveal(s);return s;
}
