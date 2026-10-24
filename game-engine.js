import {orderDefinitions,orderById,orderCapacity,makeOrder,orderUnlocked,addOrder,editOrder,activeOrders,chooseOrder} from './orders.js';
export {orderDefinitions,orderById,orderCapacity,makeOrder,orderUnlocked,addOrder,editOrder,activeOrders};
import {zones,monsters,equipment,gearById,monsterById,skills} from './data.js';
export {zones,monsters,equipment,gearById,monsterById,skills};
export const W=31,H=23,LAST_FLOOR=50,IDENTIFY_COST=3,UNCURSE_COST=5,SYNTHESIS_CAP=20,CHEST_CHANCE=.35;
const dirs=[[0,-1],[1,0],[0,1],[-1,0]],key=p=>`${p.x},${p.y}`;
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export function random(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
export function profileDefault(){return {normalClears:0,runs:0,monsters:[],equipment:[],knownEquipment:[]};}
export function zoneFor(s){return zones[Math.min(9,Math.floor((s.floor-1)/5))];}
export function floorLabel(s){return s.phase==='ending'?'地上 1F':`B${51-s.floor}`;}
export function radius(s){return 4+s.levels.scout*.5;}
export function log(s,text,type=''){s.logs.unshift({text,type,turn:s.turn});s.logs=s.logs.slice(0,60);}
function register(list,id){if(!list.includes(id))list.push(id);}
export function createGear(baseId,{plus=0,cursed=false,identified=true}={}){if(!gearById[baseId])throw Error('Unknown equipment');return {baseId,plus,cursed,identified,boundKnown:false};}
export function gearStats(g){const base=gearById[g.baseId];return {attack:base.attack+(base.slot==='weapon'?g.plus:0),defense:base.defense+(base.slot==='armor'?g.plus:0)};}
export function gearName(g){return g.identified?gearById[g.baseId].name+(g.plus?`+${g.plus}`:''):gearById[g.baseId].slot==='weapon'?'未鑑定の剣':'未鑑定の防具';}
export function acquire(s,g){g.acquiredOrder=s.nextAcquisition++;s.inventory.push(g);register(s.profile.equipment,g.baseId);if(g.identified)register(s.profile.knownEquipment,g.baseId);}
export function stats(s){const w=gearStats(s.gear.weapon),a=gearStats(s.gear.armor);return {maxHp:54+s.levels.vitality*12,attack:7+s.levels.power*2+w.attack+a.attack,defense:1+s.levels.guard+w.defense+a.defense};}
export function newGame(seed=Date.now()%10000000,profile=profileDefault()){
 const p=structuredClone(profile);p.runs++;
 const s={version:4,nextAcquisition:0,b25HintShown:false,orders:[makeOrder('stairs')],seed,floor:1,phase:'prepare',hp:54,shards:12,levels:Object.fromEntries(skills.map(k=>[k.id,0])),gear:{weapon:createGear('weapon-0'),armor:createGear('armor-0')},inventory:[],mode:'stairs',turn:0,kills:0,logs:[],memories:[],profile:p,letter:false};
 for(const g of Object.values(s.gear)){g.acquiredOrder=s.nextAcquisition++;register(p.equipment,g.baseId);register(p.knownEquipment,g.baseId);}
 makeFloor(s);log(s,'目が覚めると、そこには骨だけの手があった。','story');log(s,'B50。失った記憶を力に変え、地上を目指す。');return s;
}
export function price(s,k){return k.cost+s.levels[k.id]*4;}
export function locked(s,k){return Boolean((k.requires&&!s.levels[k.requires])||(k.event&&!s.profile.normalClears));}
export function upgrade(s,id){const k=skills.find(k=>k.id===id);if(!k||s.phase!=='prepare'||s.floor===1||locked(s,k)||s.levels[id]>=k.max||s.shards<price(s,k))return false;s.shards-=price(s,k);s.levels[id]++;if(id==='vitality')s.hp+=12;reveal(s);log(s,`「${k.name}」を思い出した。`,'good');return true;}
export function setMode(s,mode){if(!['stairs','collect','explore'].includes(mode)||(mode==='collect'&&!s.levels.collect)||(mode==='explore'&&!s.levels.exploration))return false;s.mode=mode;s.orders=(mode==='stairs'?['stairs']:mode==='collect'?['collect-items','stairs']:['explore-all','stairs']).map(makeOrder);return true;}
export function equip(s,index){const g=s.inventory[index];if(s.phase!=='prepare'||!g)return false;const slot=gearById[g.baseId].slot;if(s.gear[slot].cursed){log(s,'呪いで装備を外せない。先に解呪が必要。','bad');return false;}const old=s.gear[slot];s.gear[slot]=g;s.inventory[index]=old;if(g.cursed)g.boundKnown=true;log(s,`${gearName(g)}を装備。${g.cursed?'呪いにより外せなくなった。':''}`,g.cursed?'bad':'good');return true;}
export function getItem(s,ref){return typeof ref==='number'?s.inventory[ref]:s.gear[ref];}
export function identify(s,ref){const g=getItem(s,ref);if(s.phase!=='prepare'||!s.levels.identify||!g||g.identified||s.shards<IDENTIFY_COST)return false;s.shards-=IDENTIFY_COST;g.identified=true;register(s.profile.knownEquipment,g.baseId);log(s,`${gearName(g)}を鑑定。${g.cursed?'呪われている。':'呪いなし。'}`,'good');return true;}
export function uncurse(s,ref){const g=getItem(s,ref);if(s.phase!=='prepare'||!s.levels.uncurse||!g||!g.cursed||!(g.identified||g.boundKnown)||s.shards<UNCURSE_COST)return false;s.shards-=UNCURSE_COST;g.cursed=false;g.boundKnown=false;log(s,`${gearName(g)}を解呪した。`,'good');return true;}
export function discard(s,index){const g=s.inventory[index];if(s.phase!=='prepare'||!g)return false;s.inventory.splice(index,1);log(s,`${gearName(g)}を手放した。`);return true;}
export function synthesisResult(a,b){if(!a||!b||a===b||!a.identified||!b.identified||a.cursed||b.cursed||a.baseId!==b.baseId)return null;if((a.plus===0)!==(b.plus===0))return null;const result=a.plus===0?1:a.plus+b.plus;return result<=SYNTHESIS_CAP?result:null;}
export function synthesize(s,targetRef,materialIndex){const a=getItem(s,targetRef),b=s.inventory[materialIndex],result=synthesisResult(a,b);if(s.phase!=='prepare'||!s.levels.synthesis||result===null)return false;a.plus=result;s.inventory.splice(materialIndex,1);log(s,`${gearName(a)}に合成した。素材を1個消費。`,'good');return true;}
export function sortedInventory(s,slot,sort='acquired'){return s.inventory.map((g,index)=>({g,index})).filter(({g})=>gearById[g.baseId].slot===slot).sort((a,b)=>sort==='acquired'?(a.g.acquiredOrder??a.index)-(b.g.acquiredOrder??b.index):Number(b.g.identified)-Number(a.g.identified)||(a.g.identified&&b.g.identified?gearStats(b.g)[sort]-gearStats(a.g)[sort]:0)||(a.g.acquiredOrder??a.index)-(b.g.acquiredOrder??b.index));}
export function notifyB25(s){if(s.floor===26&&!s.b25HintShown){s.b25HintShown=true;log(s,'何か大事なものを忘れている気がする','story');return true;}return false;}
export function beginExploration(s){if(s.phase!=='prepare')return false;s.phase='explore';notifyB25(s);return true;}
export function lineOfSight(s,a,b){let x=a.x,y=a.y;const dx=Math.abs(b.x-x),dy=Math.abs(b.y-y),sx=Math.sign(b.x-x),sy=Math.sign(b.y-y);let err=dx-dy;while(x!==b.x||y!==b.y){const twice=2*err;let nx=x,ny=y;if(twice>-dy){err-=dy;nx+=sx;}if(twice<dx){err+=dx;ny+=sy;}if(nx!==x&&ny!==y&&!s.grid[y]?.[nx]&&!s.grid[ny]?.[x])return false;x=nx;y=ny;if(x===b.x&&y===b.y)return true;if(!s.grid[y]?.[x])return false;}return true;}
export function canSee(s,x,y){return Math.hypot(x-s.player.x,y-s.player.y)<=radius(s)&&lineOfSight(s,s.player,{x,y});}
export function reveal(s){for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(canSee(s,x,y))s.seen[y][x]=true;s.visited[s.player.y][s.player.x]=true;for(const e of s.enemies)if(canSee(s,e.x,e.y))register(s.profile.monsters,e.baseId);}
export function rollGear(floor,rng){const z=Math.min(9,Math.floor((floor-1)/5));const slot=rng()<.5?'weapon':'armor';const pool=equipment.filter(g=>g.slot===slot);const weights=pool.map(g=>1/Math.pow(1+Math.abs(g.rank-z),4));let pick=rng()*weights.reduce((a,b)=>a+b,0),base=pool[pool.length-1];for(let i=0;i<pool.length;i++){pick-=weights[i];if(pick<0){base=pool[i];break;}}const enhanced=rng()<.12;return createGear(base.id,{plus:enhanced?1+Math.floor(rng()*3):0,cursed:rng()<.12,identified:rng()>=.35});}
export function makeFloor(s){
 const z=zoneFor(s),rng=random(s.seed+s.floor*997),grid=Array.from({length:H},()=>Array(W).fill(0));
 const rooms=Array.from({length:6},(_,i)=>{const w=z.layout==='hall'?8:z.layout==='channels'?4:4+Math.floor(rng()*4),h=z.layout==='hall'?7:z.layout==='channels'?4:4+Math.floor(rng()*4);return {x:1+(i%3)*10+Math.floor(rng()*2),y:2+Math.floor(i/3)*11+Math.floor(rng()*2),w,h};});
 const centers=rooms.map(r=>({x:r.x+Math.floor(r.w/2),y:r.y+Math.floor(r.h/2)}));
 for(const r of rooms)for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){if(z.layout!=='caves'||Math.hypot((x-r.x-r.w/2)/(r.w/2),(y-r.y-r.h/2)/(r.h/2))<1.15)grid[y][x]=1;}
 function carve(a,b){let {x,y}=a;for(const axis of rng()<.5?['x','y']:['y','x'])while((axis==='x'?x:y)!==b[axis]){grid[y][x]=1;if(axis==='x')x+=Math.sign(b.x-x);else y+=Math.sign(b.y-y);}grid[y][x]=1;}
 const startIndex=Math.floor(rng()*6),connected=[startIndex],remaining=centers.map((_,i)=>i).filter(i=>i!==startIndex);
 while(remaining.length){const from=connected[Math.floor(rng()*connected.length)],to=remaining.reduce((a,b)=>distance(centers[a],centers[from])<distance(centers[b],centers[from])?a:b);carve(centers[from],centers[to]);connected.push(to);remaining.splice(remaining.indexOf(to),1);}
 if(z.layout==='cross'){const hub={x:15,y:11};for(const c of centers)carve(c,hub);}else if(z.layout==='channels'||rng()<.5)carve(centers[0],centers[5]);
 const start=centers[startIndex],end=centers.reduce((a,b)=>distance(a,start)>distance(b,start)?a:b);
 s.grid=grid;s.player={...start};s.stairs={...end};s.seen=grid.map(row=>row.map(()=>false));s.visited=grid.map(row=>row.map(()=>false));s.enemies=[];s.items=[];s.mended=false;s.floorKills=0;s.steps=0;s.flash=null;s.intent='視界の先を調べる';s.retreatTurns=0;s.retreatCooldown=0;s.activeOrder=null;
 const occupied=new Set([key(start),key(end)]);const free=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(grid[y][x]&&!occupied.has(`${x},${y}`)&&distance({x,y},start)>4)free.push({x,y});
 function spot(){if(!free.length)throw Error('No free tile');const p=free.splice(Math.floor(rng()*free.length),1)[0];occupied.add(key(p));return p;}
 for(let i=0;i<5+Math.min(3,Math.floor(z.index/3));i++){const base=monsters[z.index*2+(i%3===2?1:0)];s.enemies.push({...base,baseId:base.id,...spot(),maxHp:base.hp,aggro:false});}
 for(let i=0;i<3;i++)s.items.push({...spot(),type:'potion'});
 for(let i=0;i<4;i++)if(rng()<CHEST_CHANCE)s.items.push({...spot(),type:'chest',gear:rollGear(s.floor,rng)});
 if(s.floor===26)s.items.push({...spot(),type:'letter'});
 reveal(s);
}
// Route planning traverses only discovered walkable tiles. No hidden enemy data.
export function route(s,test,{start=s.player,known=true,blocked=new Set()}={}){const q=[start],prev=new Map([[key(start),null]]);for(let i=0;i<q.length;i++){const p=q[i];if(test(p)){if(i===0)return start;let end=p;while(prev.get(key(end))!==start)end=prev.get(key(end));return end;}for(const [dx,dy]of dirs){const n={x:p.x+dx,y:p.y+dy},k=key(n);if(s.grid[n.y]?.[n.x]&&(!known||s.seen[n.y][n.x])&&!prev.has(k)&&!blocked.has(k)){prev.set(k,p);q.push(n);}}}return null;}
export function targetEnemy(s){const near=dirs.map(([dx,dy])=>s.enemies.find(e=>e.x===s.player.x+dx&&e.y===s.player.y+dy)).filter(Boolean);if(!s.levels.tactics)return near[0];const atk=stats(s).attack;return near.sort((a,b)=>Number(b.hp<=Math.max(1,atk-b.defense))-Number(a.hp<=Math.max(1,atk-a.defense))||b.attack-a.attack)[0];}
function obtainable(s,i){return i.type!=='letter'||Boolean(s.profile.normalClears&&s.levels.bond&&!s.letter);}
function pickup(s){const item=s.items.find(i=>i.x===s.player.x&&i.y===s.player.y);if(!item)return;if(!obtainable(s,item)){s.intent='封じられた宝箱。絆の記憶が必要';return;}s.items=s.items.filter(i=>i!==item);if(item.type==='potion'){const heal=Math.min(stats(s).maxHp-s.hp,18);s.hp+=heal;log(s,`回復の泉。HP +${heal}`,'good');}else if(item.type==='letter'){s.letter=true;log(s,'息子への手紙を入手した。TRUEルートの物語は今後追加。','story');}else{acquire(s,item.gear);s.shards+=2;log(s,`宝箱から${gearName(item.gear)}を入手。かけら +2`,'good');}}
const memories={10:'かつて、この手は誰かを守るために剣を握っていた。',20:'「父さん、帰ってくるよね」――小さな手の温もりが蘇る。',30:'魔王は告げた。「息子の命が惜しければ、記憶を捨てろ」',40:'忘れていた名前よりも先に、帰る理由を思い出した。'};
export function tick(s){
 if(s.phase!=='explore')return;notifyB25(s);s.turn++;s.steps++;s.flash=null;reveal(s);const st=stats(s);
 if(s.levels.mend&&!s.mended&&s.hp<=st.maxHp*.35){s.hp=Math.min(st.maxHp,s.hp+Math.ceil(st.maxHp*.4));s.mended=true;log(s,'再生の祈りが発動した。','good');}
 if(s.retreatCooldown>0)s.retreatCooldown--;
 const adjacentEnemy=targetEnemy(s);
 const emergency=adjacentEnemy?chooseOrder(s,{route,canSee,stats,obtainable},true):null;
 const enemy=emergency?null:adjacentEnemy;let action=emergency;s.activeOrder=null;
 if(enemy){const damage=Math.max(1,st.attack-enemy.defense);enemy.hp-=damage;s.flash={x:enemy.x,y:enemy.y,kind:'hit'};s.intent=s.levels.tactics?`戦術判断：${enemy.name}を優先`:`隣接する${enemy.name}と交戦`;if(s.levels.tactics)log(s,s.intent);if(enemy.hp<=0){s.enemies=s.enemies.filter(e=>e!==enemy);s.kills++;s.floorKills++;s.shards++;log(s,`${enemy.name}を倒した。かけら +1`,'good');}}
 else {
  action ||= chooseOrder(s,{route,canSee,stats,obtainable});
  if(!action){const next=route(s,p=>dirs.some(([dx,dy])=>s.seen[p.y+dy]?.[p.x+dx]===false))||route(s,p=>!s.visited[p.y][p.x]);action=next?{next,intent:'基本行動：視界の先を調べる'}:{next:route(s,p=>key(p)===key(s.stairs)),exit:true,intent:'基本行動：探索を終え、階段へ'};}
  if(action.next){s.player={...action.next};s.intent=action.intent;s.activeOrder=action.id||null;reveal(s);}
  if(action.flee){s.retreatTurns++;if(s.retreatTurns>=4){s.retreatTurns=0;s.retreatCooldown=6;}}else s.retreatTurns=0;
 }
 pickup(s);
 for(const e of s.enemies){if(distance(e,s.player)<=6&&lineOfSight(s,e,s.player))e.aggro=true;if(!e.aggro||s.turn%e.period!==0)continue;if(distance(e,s.player)===1){const damage=Math.max(1,e.attack-st.defense);s.hp-=damage;s.flash={...s.player,kind:'hurt'};log(s,`${e.name}の攻撃。${damage}ダメージ。`,'bad');if(s.hp<=0){s.hp=0;s.phase='dead';log(s,'骨が崩れた。記憶を失い、再び最深部へ。','story');return;}}else{const next=route(s,p=>distance(p,s.player)===1,{start:e,known:false,blocked:new Set(s.enemies.filter(o=>o!==e).map(key))});if(next&&key(next)!==key(s.player)){e.x=next.x;e.y=next.y;}}}
 reveal(s);
 const done=Boolean(action?.exit);
 if(done&&key(s.player)===key(s.stairs)){const reward=8+Math.floor(s.floor/3);s.shards+=reward;s.phase='cleared';log(s,`${floorLabel(s)}踏破。かけら +${reward}`,'good');if(memories[s.floor]){s.memories.push(memories[s.floor]);log(s,memories[s.floor],'story');}}
}
export function ascend(s){if(s.phase!=='cleared')return false;if(s.floor===LAST_FLOOR){s.phase='ending';s.profile.normalClears++;log(s,'地上1F。息子は剣を抜いた。「父の仇……魔物め」','story');log(s,'届かなかった声。砕けた骸は、再び深淵へ沈む。','story');return true;}s.floor++;s.phase='prepare';makeFloor(s);s.hp=Math.min(stats(s).maxHp,s.hp+Math.ceil(stats(s).maxHp*.35));log(s,`${floorLabel(s)}へ。休息して次の探索に備える。`,'good');return true;}
export function codexRows(s,kind){if(kind==='monsters')return monsters.map(m=>s.profile.monsters.includes(m.id)?{name:m.name,attack:m.attack,defense:m.defense,zone:zones[m.zone].name,known:true}:{known:false});return equipment.map(g=>s.profile.knownEquipment.includes(g.id)&&s.profile.equipment.includes(g.id)?{name:g.name,attack:g.attack,defense:g.defense,slot:g.slot,acquiredOrder:s.profile.equipment.indexOf(g.id),known:true}:{known:false,slot:g.slot});}
export function validateSave(s){return Boolean(s?.version===4&&Number.isInteger(s.nextAcquisition)&&s.nextAcquisition>=0&&Array.isArray(s.logs)&&Array.isArray(s.enemies)&&Array.isArray(s.items)&&Array.isArray(s.memories)&&Number.isInteger(s.floor)&&s.floor>=1&&s.floor<=50&&['prepare','explore','cleared','dead','ending'].includes(s.phase)&&s.grid?.length===H&&s.grid.every(r=>r.length===W)&&s.seen?.length===H&&s.visited?.length===H&&s.levels&&skills.every(k=>Number.isInteger(s.levels[k.id])&&s.levels[k.id]>=0&&s.levels[k.id]<=k.max)&&Array.isArray(s.orders)&&s.orders.length<=orderCapacity(s)&&s.orders.every(o=>orderById[o.id]&&(!orderById[o.id].param||(Number.isFinite(o[orderById[o.id].param])&&o[orderById[o.id].param]>=orderById[o.id].min&&o[orderById[o.id].param]<=orderById[o.id].max)))&&s.profile&&['monsters','equipment','knownEquipment'].every(k=>Array.isArray(s.profile[k]))&&s.gear&&Object.values(s.gear).every(g=>gearById[g.baseId])&&Array.isArray(s.inventory)&&s.inventory.every(g=>gearById[g.baseId]));}

export function normalizeSave(input){
 if(!input||![2,3,4].includes(input.version))return null;const s=structuredClone(input);
 if(s.version===2){for(const k of skills)s.levels[k.id]??=0;s.orders=(s.mode==='collect'?['collect-items','stairs']:s.mode==='explore'?['explore-all','stairs']:['stairs']).map(makeOrder);s.retreatTurns=0;s.retreatCooldown=0;s.activeOrder=null;}
 if(s.version<4){
  // Exact acquisition timestamps did not exist before v4. Keep a stable inferred order.
  const owned=[...s.inventory,...Object.values(s.gear)];owned.sort((a,b)=>Number(['weapon-0','armor-0'].includes(b.baseId))-Number(['weapon-0','armor-0'].includes(a.baseId)));
  owned.forEach((g,i)=>{g.acquiredOrder=i;});s.nextAcquisition=owned.length;s.b25HintShown=false;s.version=4;
 }
 return validateSave(s)?s:null;
}
