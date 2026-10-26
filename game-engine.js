import {createCardRule,legacyToCards,validCardRule,chooseCardOrder,cardModifier} from './card-orders.js';
export * from './card-orders.js';
import {nextRandom,rollEnemyDrop,rollChestReward,grantReward} from './drop-system.js';
export {nextRandom,rollEnemyDrop,rollChestReward,grantReward};
import {rewardDefinitions,rewardById,enemyDropTables,chestRewards} from './data.js';
export {rewardDefinitions,rewardById,enemyDropTables,chestRewards};
import {NORMAL_FLOORS,TRUE_FLOORS,LETTER_FLOOR,fieldPlan,nextStageHint,zoneIndexForFloor,bossForFloor} from './field-events.js';
export {NORMAL_FLOORS,TRUE_FLOORS,LETTER_FLOOR,fieldPlan,nextStageHint,zoneIndexForFloor,bossForFloor};
import {orderDefinitions,orderById,orderCapacity,makeOrder,orderUnlocked,addOrder,editOrder,activeOrders,chooseOrder} from './orders.js';
export {orderDefinitions,orderById,orderCapacity,makeOrder,orderUnlocked,addOrder,editOrder,activeOrders};
import {zones,monsters,equipment,gearById,monsterById,skills} from './data.js';
export {zones,monsters,equipment,gearById,monsterById,skills};
export const W=31,H=23,LAST_FLOOR=NORMAL_FLOORS,IDENTIFY_COST=3,UNCURSE_COST=5,SYNTHESIS_CAP=20,CHEST_CHANCE=.35;
export const BALANCE={springCount:2,springHeal:10,restRatio:.15,enemyCount:z=>6+Math.floor(z/2)};
const dirs=[[0,-1],[1,0],[0,1],[-1,0]],key=p=>`${p.x},${p.y}`;
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export function random(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
export function profileDefault(){return {normalClears:0,runs:0,monsters:[],equipment:[],knownEquipment:[],skills:[]};}
export function zoneFor(s){return zones[Math.min(9,zoneIndexForFloor(s.floor))];}
export function floorLabel(s){return s.phase==='ending'?'地上 1F':`B${LAST_FLOOR+1-s.floor}`;}
export function radius(s){return Math.max(2,3+s.levels.scout-(s.gimmick?.id==='fog'?2:0));}
export function log(s,text,type=''){s.logs.unshift({text,type,turn:s.turn});s.logs=s.logs.slice(0,60);}
function register(list,id){if(!list.includes(id))list.push(id);}
export function createGear(baseId,{plus=0,cursed=false,identified=true}={}){if(!gearById[baseId])throw Error('Unknown equipment');return {baseId,plus,cursed,identified,boundKnown:false};}
export function gearStats(g){const base=gearById[g.baseId];return {attack:base.attack+(base.slot==='weapon'?g.plus:0),defense:base.defense+(base.slot==='armor'?g.plus:0)};}
export function gearName(g){return g.identified?gearById[g.baseId].name+(g.plus?`+${g.plus}`:''):gearById[g.baseId].slot==='weapon'?'未鑑定の剣':'未鑑定の防具';}
export function acquire(s,g){g.identified=true;g.cursed=false;g.boundKnown=false;g.acquiredOrder=s.nextAcquisition++;s.inventory.push(g);register(s.profile.equipment,g.baseId);if(g.identified)register(s.profile.knownEquipment,g.baseId);}
export const incomingDamage=(attack,defense)=>Math.max(1,Math.ceil(attack*.2),attack-defense);
export function stats(s){const w=gearStats(s.gear.weapon),a=gearStats(s.gear.armor);return {maxHp:54+s.levels.vitality*12,attack:7+s.levels.power*2+w.attack+a.attack,defense:1+s.levels.guard+w.defense+a.defense};}
export function newGame(seed=Date.now()%10000000,profile=profileDefault()){
 const p=structuredClone(profile);p.skills??=[];p.runs++;
 const s={version:10,keys:0,abilities:[],unlockedOrders:[],rngState:seed>>>0,warped:false,nextAcquisition:0,b15HintShown:false,orders:[createCardRule()],seed,floor:1,phase:'awakening',hp:54,shards:12,levels:Object.fromEntries(skills.map(k=>[k.id,0])),gear:{weapon:createGear('weapon-0'),armor:createGear('armor-0')},inventory:[],mode:'stairs',turn:0,kills:0,logs:[],memories:[],profile:p,letter:false};
 for(const g of Object.values(s.gear)){g.acquiredOrder=s.nextAcquisition++;register(p.equipment,g.baseId);register(p.knownEquipment,g.baseId);}
 makeFloor(s);log(s,'目が覚めると、そこには骨だけの手があった。','story');log(s,'B30。失った記憶を力に変え、地上を目指す。');return s;
}
export function abandonRun(s){return s.phase==='prepare'?newGame(undefined,s.profile):null;}
export function price(s,k){return k.cost+s.levels[k.id]*(k.costStep??4);}
export function locked(s,k){return Boolean((k.requires&&!s.levels[k.requires])||(k.event&&!s.profile.normalClears));}
export function upgrade(s,id){const k=skills.find(k=>k.id===id);if(!k||s.phase!=='prepare'||s.floor===1||locked(s,k)||s.levels[id]>=k.max||s.shards<price(s,k))return false;s.shards-=price(s,k);s.levels[id]++;if(id==='vitality')s.hp+=12;reveal(s);log(s,`「${k.name}」を思い出した。`,'good');return true;}
export function setMode(s,mode){if(s.phase!=='prepare')return false;if(!['stairs','collect','explore'].includes(mode))return false;s.mode=mode;s.orders=(mode==='stairs'?['stairs']:mode==='collect'?['collect-items','stairs']:['explore-all','stairs']).map(makeOrder);return true;}
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
export function notifyB15(s){if(s.floor===LETTER_FLOOR&&!s.b15HintShown){s.b15HintShown=true;log(s,'何か大事なものを忘れている気がする','story');return true;}return false;}
export function beginExploration(s){if(!['awakening','prepare'].includes(s.phase))return false;s.phase='explore';notifyB15(s);return true;}
export function lineOfSight(s,a,b){let x=a.x,y=a.y;const dx=Math.abs(b.x-x),dy=Math.abs(b.y-y),sx=Math.sign(b.x-x),sy=Math.sign(b.y-y);let err=dx-dy;while(x!==b.x||y!==b.y){const twice=2*err;let nx=x,ny=y;if(twice>-dy){err-=dy;nx+=sx;}if(twice<dx){err+=dx;ny+=sy;}if(nx!==x&&ny!==y&&!s.grid[y]?.[nx]&&!s.grid[ny]?.[x])return false;x=nx;y=ny;if(x===b.x&&y===b.y)return true;if(!s.grid[y]?.[x])return false;}return true;}
export function canSee(s,x,y){return Math.hypot(x-s.player.x,y-s.player.y)<=radius(s)&&lineOfSight(s,s.player,{x,y});}
export function reveal(s){for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(canSee(s,x,y))s.seen[y][x]=true;s.visited[s.player.y][s.player.x]=true;for(const e of s.enemies)if(canSee(s,e.x,e.y))register(s.profile.monsters,e.baseId);}
export function rollGear(floor,rng){const z=Math.min(9,zoneIndexForFloor(floor));const slot=rng()<.5?'weapon':'armor';const pool=equipment.filter(g=>g.slot===slot);const weights=pool.map(g=>1/Math.pow(1+Math.abs(g.rank-z),4));let pick=rng()*weights.reduce((a,b)=>a+b,0),base=pool[pool.length-1];for(let i=0;i<pool.length;i++){pick-=weights[i];if(pick<0){base=pool[i];break;}}const enhanced=rng()<.12,plus=enhanced?1+Math.floor(rng()*3):0;
 // Preserve the previous random sequence without spawning cursed or unidentified gear.
 rng();rng();return createGear(base.id,{plus});}
export function makeBossFloor(s,boss){
 const grid=Array.from({length:H},()=>Array(W).fill(0));
 for(let y=3;y<=19;y++)for(let x=5;x<=25;x++)grid[y][x]=1;
 const pillars=boss.basement===20?[[10,7],[20,7],[10,15],[20,15]]:[[9,7],[21,7],[9,15],[21,15],[12,11],[18,11]];
 for(const [px,py] of pillars)for(let y=py;y<py+2;y++)for(let x=px;x<px+2;x++)grid[y][x]=0;
 Object.assign(s,{grid,player:{x:15,y:19},stairs:{x:15,y:3},seen:grid.map(r=>r.map(()=>false)),visited:grid.map(r=>r.map(()=>false)),enemies:[{...boss,baseId:boss.id,x:15,y:10,maxHp:boss.hp,aggro:true,boss:true}],items:[{x:8,y:17,type:'potion'},{x:22,y:17,type:'potion'}],traps:[],bossFloor:true,gimmick:{...fieldPlan(s.seed,s.floor),triggered:false,room:null},nextHint:null,warped:false,mended:false,floorKills:0,steps:0,flash:null,intent:'階段を封じる門番の気配',retreatTurns:0,retreatCooldown:0,activeOrder:null});reveal(s);
}
export function makeFloor(s){
 const boss=bossForFloor(s.floor);if(boss){makeBossFloor(s,boss);return;}s.bossFloor=false;
 const z=zoneFor(s),rng=random(s.seed+s.floor*997),grid=Array.from({length:H},()=>Array(W).fill(0));
 const rooms=Array.from({length:6},(_,i)=>{const w=z.layout==='hall'?8:z.layout==='channels'?4:4+Math.floor(rng()*4),h=z.layout==='hall'?7:z.layout==='channels'?4:4+Math.floor(rng()*4);return {x:1+(i%3)*10+Math.floor(rng()*2),y:2+Math.floor(i/3)*11+Math.floor(rng()*2),w,h};});
 const centers=rooms.map(r=>({x:r.x+Math.floor(r.w/2),y:r.y+Math.floor(r.h/2)}));
 for(const r of rooms)for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){if(z.layout!=='caves'||Math.hypot((x-r.x-r.w/2)/(r.w/2),(y-r.y-r.h/2)/(r.h/2))<1.15)grid[y][x]=1;}
 function carve(a,b){let {x,y}=a;for(const axis of rng()<.5?['x','y']:['y','x'])while((axis==='x'?x:y)!==b[axis]){grid[y][x]=1;if(axis==='x')x+=Math.sign(b.x-x);else y+=Math.sign(b.y-y);}grid[y][x]=1;}
 const startIndex=Math.floor(rng()*6),connected=[startIndex],remaining=centers.map((_,i)=>i).filter(i=>i!==startIndex);
 while(remaining.length){const from=connected[Math.floor(rng()*connected.length)],to=remaining.reduce((a,b)=>distance(centers[a],centers[from])<distance(centers[b],centers[from])?a:b);carve(centers[from],centers[to]);connected.push(to);remaining.splice(remaining.indexOf(to),1);}
 if(z.layout==='cross'){const hub={x:15,y:11};for(const c of centers)carve(c,hub);}else if(z.layout==='channels'||rng()<.5)carve(centers[0],centers[5]);
 const start=centers[startIndex],end=centers.reduce((a,b)=>distance(a,start)>distance(b,start)?a:b);
 s.gimmick={...fieldPlan(s.seed,s.floor),triggered:false,room:null};s.traps=[];s.nextHint=null;
 s.grid=grid;s.player={...start};s.stairs={...end};s.seen=grid.map(row=>row.map(()=>false));s.visited=grid.map(row=>row.map(()=>false));s.enemies=[];s.items=[];s.mended=false;s.warped=false;s.floorKills=0;s.steps=0;s.flash=null;s.intent='視界の先を調べる';s.retreatTurns=0;s.retreatCooldown=0;s.activeOrder=null;
 const occupied=new Set([key(start),key(end)]);const free=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(grid[y][x]&&!occupied.has(`${x},${y}`)&&distance({x,y},start)>4)free.push({x,y});
 function spot(){if(!free.length)throw Error('No free tile');const p=free.splice(Math.floor(rng()*free.length),1)[0];occupied.add(key(p));return p;}
 for(let i=0;i<BALANCE.enemyCount(z.index);i++){const base=monsters[z.index*2+(i%3===2?1:0)];s.enemies.push({...base,baseId:base.id,...spot(),maxHp:base.hp,aggro:false});}
 for(let i=0;i<BALANCE.springCount;i++)s.items.push({...spot(),type:'potion'});
 for(let i=0;i<2;i++)s.items.push({...spot(),type:rng()<.25?'herb':'fragment'});
 for(let i=0;i<4;i++)if(rng()<CHEST_CHANCE)s.items.push({...spot(),type:'chest',locked:true,rewardId:rollChestReward(rng)});
 if(s.floor===LETTER_FLOOR)s.items.push({...spot(),type:'letter'});
 if(['monsters','traps'].includes(s.gimmick.id)){
  const inside=(p,r)=>p.x>=r.x&&p.x<r.x+r.w&&p.y>=r.y&&p.y<r.y+r.h;
  const candidates=rooms.filter(r=>!inside(start,r)&&!inside(end,r));
  const room=candidates[Math.floor(rng()*candidates.length)];s.gimmick.room=room;
  const houseTiles=free.filter(p=>inside(p,room));
  const count=Math.min(s.gimmick.id==='monsters'?4:8,houseTiles.length);
  for(let i=0;i<count;i++){const tile=houseTiles.splice(Math.floor(rng()*houseTiles.length),1)[0];
   if(s.gimmick.id==='monsters'){const base=monsters[z.index*2+(i%2)];s.enemies.push({...base,baseId:base.id,...tile,maxHp:base.hp,aggro:false,house:true});}
   else s.traps.push({...tile,spent:false,revealed:true});
  }
 }
 if(s.gimmick.id==='none'&&s.floor>1){const trapRng=random(s.seed+s.floor*7919+43);if(trapRng()<.25){for(let i=0,n=1+Math.floor(trapRng()*2);i<n&&free.length;i++)s.traps.push({...spot(),spent:false,revealed:true});}}
 reveal(s);
}
// Route planning traverses only discovered walkable tiles. No hidden enemy data.
export function route(s,test,{start=s.player,known=true,blocked=new Set()}={}){const q=[start],prev=new Map([[key(start),null]]);for(let i=0;i<q.length;i++){const p=q[i];if(test(p)){if(i===0)return start;let end=p;while(prev.get(key(end))!==start)end=prev.get(key(end));return end;}for(const [dx,dy]of dirs){const n={x:p.x+dx,y:p.y+dy},k=key(n);if(s.grid[n.y]?.[n.x]&&(!known||s.seen[n.y][n.x])&&!prev.has(k)&&!blocked.has(k)){prev.set(k,p);q.push(n);}}}return null;}
function modifierActive(s,id){return s.orders.some(o=>o.cards)?cardModifier(s,id,{canSee,stats,obtainable}):activeOrders(s).some(o=>o.id===id);}
export function targetEnemy(s){const near=dirs.map(([dx,dy])=>s.enemies.find(e=>e.x===s.player.x+dx&&e.y===s.player.y+dy)).filter(Boolean);if(!modifierActive(s,'tactics'))return near[0];const atk=stats(s).attack;return near.sort((a,b)=>Number(b.hp<=Math.max(1,atk-b.defense))-Number(a.hp<=Math.max(1,atk-a.defense))||b.attack-a.attack)[0];}
export function obtainable(s,i){return i.type==='letter'?Boolean(s.profile.normalClears&&!s.letter):i.type==='chest'&&i.locked?s.keys>0:true;}
function receiveReward(s,id){const fresh=grantReward(s,id);log(s,fresh?'「'+rewardById[id].name+'」を手に入れた。'+(rewardById[id].kind==='order'?'次の準備で探索指示に設定できる。':'この旅で使用できる。'):'「'+rewardById[id].name+'」は取得済み。記憶の欠片 +5','good');}
function pickup(s){const item=s.items.find(i=>i.x===s.player.x&&i.y===s.player.y);if(!item)return;if(!obtainable(s,item)){s.intent=item.type==='letter'?'封じられた宝箱。まだ思い出せない':'鍵が足りない。今は開けられない';return;}s.items=s.items.filter(i=>i!==item);
 if(item.type==='potion'||item.type==='herb'){const heal=Math.min(stats(s).maxHp-s.hp,item.type==='herb'?10:BALANCE.springHeal);s.hp+=heal;log(s,(item.type==='herb'?'薬草':'回復の泉')+'。HP +'+heal,'good');}
 else if(item.type==='fragment'){s.shards+=3;log(s,'床の記憶の欠片を拾った。+3','good');}
 else if(item.type==='key'){s.keys++;log(s,'古びた鍵を拾った。所持 '+s.keys+'個','good');}
 else if(item.type==='gear'){acquire(s,item.gear);log(s,gearName(item.gear)+'を拾った。','good');}
 else if(item.type==='reward')receiveReward(s,item.rewardId);
 else if(item.type==='letter'){s.letter=true;log(s,'息子への手紙を入手した。TRUEルートの物語は今後追加。','story');}
 else if(item.type==='chest'){if(item.locked){s.keys--;log(s,'鍵を1個使い、宝箱を開けた。','good');}if(item.gear){acquire(s,item.gear);s.shards+=2;log(s,'旧宝箱から'+gearName(item.gear)+'を入手。記憶の欠片 +2','good');}else receiveReward(s,item.rewardId);}
}
export function dropFromEnemy(s,e){const rng=()=>nextRandom(s),drop=rollEnemyDrop(e.baseId,rng);if(!drop)return null;
 const q=[{x:e.x,y:e.y}],seen=new Set([key(e)]);let position=null;
 for(let i=0;i<q.length;i++){const p=q[i];if(key(p)!==key(s.stairs)&&!s.items.some(i=>key(i)===key(p))&&!s.enemies.some(o=>key(o)===key(p))){position=p;break;}for(const [dx,dy] of dirs){const n={x:p.x+dx,y:p.y+dy};if(s.grid[n.y]?.[n.x]&&!seen.has(key(n))){seen.add(key(n));q.push(n);}}}
 if(!position){log(s,'落とした品は瓦礫に埋もれた。');return null;}
 const item={...position,type:drop.type};if(drop.type==='gear'){const plus=rng()<.12?1+Math.floor(rng()*3):0;item.gear=createGear(drop.id,{plus});}else if(drop.type==='reward')item.rewardId=drop.id;s.items.push(item);log(s,e.name+'が'+(drop.type==='key'?'鍵':drop.type==='gear'?gearName(item.gear):rewardById[drop.id].name)+'を落とした。');return item;
}
export function attackEnemy(s,enemy){
 if(!s.enemies.includes(enemy)||enemy.hp<=0)return;
 const strike=()=>{const critical=s.abilities.includes('critical')&&nextRandom(s)<.10,base=Math.max(1,stats(s).attack-enemy.defense),damage=critical?Math.ceil(base*1.5):base,actual=Math.min(enemy.hp,damage);enemy.hp-=damage;s.flash={x:enemy.x,y:enemy.y,kind:'hit'};if(critical)log(s,'会心の一撃！ '+damage+'ダメージ。','good');if(s.abilities.includes('leech')){const heal=Math.max(0,Math.min(stats(s).maxHp-s.hp,Math.floor(actual*.05)));s.hp+=heal;if(heal)log(s,'吸命の記憶。HP +'+heal,'good');}};
 strike();if(enemy.hp>0&&s.abilities.includes('double-strike')&&nextRandom(s)<.05){log(s,'追撃の記憶が発動！','good');strike();}
 if(enemy.hp<=0){s.enemies=s.enemies.filter(e=>e!==enemy);s.kills++;s.floorKills++;s.shards+=enemy.boss?8:1;log(s,enemy.name+'を倒した。記憶の欠片 +'+(enemy.boss?8:1),'good');dropFromEnemy(s,enemy);if(enemy.boss)log(s,'門番の封印が解けた。階段を上れる。','story');}
}
function warpDestination(s){const cells=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(s.grid[y][x]&&key({x,y})!==key(s.player)&&key({x,y})!==key(s.stairs)&&!s.enemies.some(e=>e.x===x&&e.y===y))cells.push({x,y});return cells.length?cells[Math.floor(nextRandom(s)*cells.length)]:null;}
const memories={6:'かつて、この手は誰かを守るために剣を握っていた。',12:'「父さん、帰ってくるよね」――小さな手の温もりが蘇る。',18:'魔王は告げた。「息子の命が惜しければ、記憶を捨てろ」',24:'忘れていた名前よりも先に、帰る理由を思い出した。'};
export function tick(s){
 if(s.phase!=='explore')return;notifyB15(s);s.turn++;s.steps++;s.flash=null;reveal(s);const st=stats(s);
 if(s.retreatCooldown>0)s.retreatCooldown--;
 const sealedStart=s.enemies.some(e=>e.boss)&&key(s.player)===key(s.stairs);
 const cardPlan=s.orders.some(o=>o.cards)?chooseCardOrder(s,{route,canSee,stats,obtainable}):null;
 const adjacentEnemy=targetEnemy(s);
 const emergency=!s.orders.some(o=>o.cards)&&adjacentEnemy?chooseOrder(s,{route,canSee,stats,obtainable},true):null;
 const escapePlan=cardPlan&&(cardPlan.skill||cardPlan.warp||cardPlan.flee);
 const enemy=cardPlan?.enemy||(escapePlan||emergency?null:adjacentEnemy);let action=cardPlan||emergency;s.activeOrder=null;
 if(enemy){const tactical=modifierActive(s,'tactics');s.intent=tactical?`戦術判断：${enemy.name}を優先`:`隣接する${enemy.name}と交戦`;if(tactical)log(s,s.intent);attackEnemy(s,enemy);}
 else {
  action ||= chooseOrder(s,{route,canSee,stats,obtainable});
  if(!action){const visible=s.enemies.filter(e=>canSee(s,e.x,e.y)),next=visible.length?route(s,p=>visible.some(e=>distance(p,e)===1),{blocked:new Set(visible.map(key))}):null;if(next)action={next,intent:'進路の敵に向き合う'};}
  if(!action){const next=route(s,p=>dirs.some(([dx,dy])=>s.seen[p.y+dy]?.[p.x+dx]===false))||route(s,p=>!s.visited[p.y][p.x]);action=next?{next,intent:'基本行動：視界の先を調べる'}:{next:route(s,p=>key(p)===key(s.stairs)),exit:true,intent:'基本行動：探索を終え、階段へ'};}
  if(action.skill==='mend'){s.hp=Math.min(st.maxHp,s.hp+Math.ceil(st.maxHp*.4));s.mended=true;s.intent=action.intent;s.activeOrder='cards';log(s,'再生の祈りが発動した。','good');}
  if(action.warp){action.next=warpDestination(s);s.warped=true;log(s,'窮地の転移。見知らぬ場所へ逃れた。','good');}
  if(action.next){s.player={...action.next};s.intent=action.intent;s.activeOrder=action.id||null;reveal(s);}
  if(action.flee){s.retreatTurns++;if(s.retreatTurns>=4){s.retreatTurns=0;s.retreatCooldown=6;}}else s.retreatTurns=0;
 }
 pickup(s);
 const house=s.gimmick?.room;
 if(house&&!s.gimmick.triggered&&s.player.x>=house.x&&s.player.x<house.x+house.w&&s.player.y>=house.y&&s.player.y<house.y+house.h){s.gimmick.triggered=true;log(s,s.gimmick.name+'！','bad');if(s.gimmick.id==='monsters')for(const e of s.enemies)if(e.house)e.aggro=true;}
 const trap=s.traps?.find(t=>!t.spent&&t.x===s.player.x&&t.y===s.player.y);
 if(trap&&modifierActive(s,'avoid-traps'))log(s,'罠を見切り、踏み抜かずに進んだ。','good');
 if(trap&&!modifierActive(s,'avoid-traps')){trap.spent=true;trap.revealed=true;const damage=Math.max(1,Math.ceil(st.maxHp*.08));s.hp=Math.max(0,s.hp-damage);s.flash={...s.player,kind:'hurt'};log(s,'棘の罠。'+damage+'ダメージ。','bad');if(s.hp===0){s.phase='dead';s.nextHint=nextStageHint(s);log(s,'罠で骨が崩れた。再び最深部へ。','story');return;}}
 for(const e of s.enemies){if(distance(e,s.player)<=6&&lineOfSight(s,e,s.player))e.aggro=true;if((e.house&&!s.gimmick?.triggered)||!e.aggro||s.turn%e.period!==0)continue;if(distance(e,s.player)===1){const damage=incomingDamage(e.attack,st.defense);s.hp-=damage;s.flash={...s.player,kind:'hurt'};log(s,`${e.name}の攻撃。${damage}ダメージ。`,'bad');if(s.hp<=0){s.hp=0;s.phase='dead';s.nextHint=nextStageHint(s);log(s,'骨が崩れた。記憶を失い、再び最深部へ。','story');return;}}else{const next=route(s,p=>distance(p,s.player)===1,{start:e,known:false,blocked:new Set(s.enemies.filter(o=>o!==e).map(key))});if(next&&key(next)!==key(s.player)){e.x=next.x;e.y=next.y;}}}
 reveal(s);
 const bossAlive=s.enemies.some(e=>e.boss);
 if(bossAlive&&(sealedStart||key(s.player)===key(s.stairs)))s.intent='階段は封印中。中ボスを倒す必要がある';
 const done=Boolean(action?.exit)&&!bossAlive;
 if(done&&key(s.player)===key(s.stairs)){const reward=8+Math.floor(s.floor/3);s.shards+=reward;s.phase='cleared';s.nextHint=nextStageHint(s);log(s,`${floorLabel(s)} Clear。記憶の欠片 +${reward}`,'good');if(memories[s.floor]){s.memories.push(memories[s.floor]);log(s,memories[s.floor],'story');}}
}
export function ascend(s){if(s.phase!=='cleared')return false;if(s.floor===LAST_FLOOR){s.phase='ending';s.profile.normalClears++;log(s,'地上1F。息子は剣を抜いた。「父の仇……魔物め」','story');log(s,'届かなかった声。砕けた骸は、再び深淵へ沈む。','story');return true;}s.floor++;s.phase='prepare';makeFloor(s);s.hp=Math.min(stats(s).maxHp,s.hp+Math.ceil(stats(s).maxHp*BALANCE.restRatio));log(s,`${floorLabel(s)}へ。休息して次の探索に備える。`,'good');return true;}
export function codexRows(s,kind){if(kind==='skills')return rewardDefinitions.map(r=>s.profile.skills.includes(r.id)?{...r,known:true,owned:(r.kind==='skill'?s.abilities:s.unlockedOrders).includes(r.id)}:{known:false});if(kind==='monsters')return monsters.map(m=>s.profile.monsters.includes(m.id)?{name:m.name,attack:m.attack,defense:m.defense,zone:zones[m.zone].name,known:true}:{known:false});return equipment.map(g=>s.profile.knownEquipment.includes(g.id)&&s.profile.equipment.includes(g.id)?{name:g.name,attack:g.attack,defense:g.defense,slot:g.slot,acquiredOrder:s.profile.equipment.indexOf(g.id),known:true}:{known:false,slot:g.slot});}
export function validateSave(s){return Boolean(s?.version===10&&Number.isInteger(s.keys)&&s.keys>=0&&Number.isInteger(s.rngState)&&s.rngState>=0&&s.rngState<=4294967295&&typeof s.warped==='boolean'&&Array.isArray(s.abilities)&&s.abilities.every(id=>rewardById[id]?.kind==='skill')&&new Set(s.abilities).size===s.abilities.length&&Array.isArray(s.unlockedOrders)&&s.unlockedOrders.every(id=>rewardById[id]?.kind==='order')&&new Set(s.unlockedOrders).size===s.unlockedOrders.length&&Number.isInteger(s.nextAcquisition)&&s.nextAcquisition>=0&&Array.isArray(s.logs)&&Array.isArray(s.enemies)&&Array.isArray(s.items)&&s.items.every(i=>i&&Number.isInteger(i.x)&&Number.isInteger(i.y)&&i.x>=0&&i.x<W&&i.y>=0&&i.y<H&&(['potion','herb','fragment','key','letter'].includes(i.type)||i.type==='gear'&&gearById[i.gear?.baseId]||i.type==='reward'&&rewardById[i.rewardId]||i.type==='chest'&&(i.gear?gearById[i.gear.baseId]:Boolean(rewardById[i.rewardId]&&i.locked===true))))&&Array.isArray(s.memories)&&Number.isInteger(s.floor)&&s.floor>=1&&s.floor<=LAST_FLOOR&&['awakening','prepare','explore','cleared','dead','ending'].includes(s.phase)&&s.grid?.length===H&&s.grid.every(r=>r.length===W)&&s.seen?.length===H&&s.visited?.length===H&&s.levels&&skills.every(k=>Number.isInteger(s.levels[k.id])&&s.levels[k.id]>=0&&s.levels[k.id]<=k.max)&&Array.isArray(s.orders)&&s.orders.length<=orderCapacity(s)&&s.orders.every(o=>validCardRule(s,o))&&s.profile&&['monsters','equipment','knownEquipment','skills'].every(k=>Array.isArray(s.profile[k]))&&s.profile.skills.every(id=>rewardById[id])&&s.gear&&Object.values(s.gear).every(g=>gearById[g.baseId])&&Array.isArray(s.inventory)&&s.inventory.every(g=>gearById[g.baseId]));}

export function normalizeSave(input){
 if(!input||![2,3,4,5,6,7,8,9,10].includes(input.version))return null;const s=structuredClone(input);
 if(s.version===2){for(const k of skills)s.levels[k.id]??=0;s.orders=(s.mode==='collect'?['collect-items','stairs']:s.mode==='explore'?['explore-all','stairs']:['stairs']).map(makeOrder);s.retreatTurns=0;s.retreatCooldown=0;s.activeOrder=null;}
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
  s.version=6;log(s,'30階版へ移行。指示は全開放。旧指示スキル補償 '+refund+'pt を返還。','story');
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
  s.version=8;log(s,'育成を整理。旧機能の習得費用 '+refund+'pt を返還。装備は鑑定済み・呪いなしへ移行。','story');
 }
 if(s.version<9){
  s.keys=0;s.abilities=[];s.unlockedOrders=[];s.rngState=s.seed>>>0;s.warped=false;s.profile.skills??=[];
  let refund=0;if(s.levels.tactics){refund+=8;if(s.orders.length<orderCapacity(s)&&!s.orders.some(o=>o.id==='tactics'))s.orders.push(makeOrder('tactics'));}if(s.levels.mend){refund+=10;grantReward(s,'mend');}delete s.levels.tactics;delete s.levels.mend;s.shards+=refund;
  // Existing generated gear chests remain free legacy chests. New floors use locked reward chests.
  for(const i of s.items)if(i.type==='chest'&&i.gear)i.locked=false;
  s.version=9;log(s,'ドロップ版へ移行。旧戦術・再生の費用 '+refund+'pt を返還。新しい階から鍵付き宝箱が出現。','story');
 }
 if(s.version<10){
  s.levels.cardSlots=0;s.orders=s.orders.map(legacyToCards);
  if(s.abilities.includes('mend')&&s.orders.length<orderCapacity(s))s.orders.unshift(createCardRule('self',[{id:'hp-below',value:35}],'skill','mend'));
  s.version=10;log(s,'カード指示へ移行。再生の祈りは条件を組んで発動。設定は準備中に変更できる。','story');
 }
 return validateSave(s)?s:null;
}
