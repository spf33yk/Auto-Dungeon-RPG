import{newDirectiveSafety}from'./directive-safety.js';
import{themedSkillById,retiredAugments,themedAugments}from'./build-themes.js';
import{augmentStats as ap}from'./set-bonuses.js';
export const themeState=s=>s.themeState??=( {rooms:[],mappedRooms:[],mappedTiles:[],used:[],buffs:{},normalKills:0,pity:0,breaths:0,firstShield:false,reserveUsed:false,reserveHits:0,immunity:0,shieldHits:0,shieldRate:0,trapPass:0,pioneer:false,destinyUsed:false,悟り消費:0} );
export function resetThemeFloor(s){s.directiveSafety=newDirectiveSafety();s.themeState=undefined;themeState(s);s.skillUses=[];s.guardHits=0;s.focusPower=false;s.cardOffer=null;s.executingRule=null;}
export const themeBuff=(s,id)=>{const b=s.themeState?.buffs?.[id],extra=id==='sight'?s.themeState?.buffs?.roomSight:null;return (b&&(id==='nextPower'||s.steps<=b.until)?b.value:0)+(extra&&s.steps<=extra.until?extra.value:0);};
export function setThemeBuff(s,id,value,turns){themeState(s).buffs[id]={value,until:id==='nextPower'?0:s.steps+Math.max(0,turns-1)};}
export function validThemeState(t){if(t===undefined)return true;if(!t||typeof t!=='object'||Array.isArray(t)||!Array.isArray(t.rooms)||!Array.isArray(t.mappedRooms)||!Array.isArray(t.mappedTiles)||!Array.isArray(t.used)||!t.buffs||typeof t.buffs!=='object'||Array.isArray(t.buffs))return false;const count=v=>Number.isSafeInteger(v)&&v>=0&&v<=1000000;return t.mappedTiles.length<=10000&&t.mappedTiles.every(count)&&t.rooms.length<=100&&t.rooms.every(count)&&t.mappedRooms.length<=100&&t.mappedRooms.every(count)&&t.used.every(id=>themedSkillById[id])&&t.used.length<=30&&new Set(t.used).size===t.used.length&&new Set(t.rooms).size===t.rooms.length&&new Set(t.mappedRooms).size===t.mappedRooms.length&&['normalKills','pity','breaths','reserveHits','immunity','shieldHits','trapPass','悟り消費'].every(k=>count(t[k]))&&['firstShield','reserveUsed','pioneer','destinyUsed'].every(k=>typeof t[k]==='boolean')&&Number.isFinite(t.shieldRate)&&t.shieldRate>=0&&t.shieldRate<=1&&Object.entries(t.buffs).every(([k,b])=>['sight','roomSight','attack','defense','nextPower'].includes(k)&&b&&Number.isFinite(b.value)&&b.value>=0&&b.value<=20&&count(b.until));}
export function normalizeThemes(s){const oldCount=Array.isArray(s.augments)?s.augments.length:0;for(const p of [s,s.profile])if(Array.isArray(p?.augments))p.augments=[...new Set(p.augments.map(id=>retiredAugments[id]||id))];if(Array.isArray(s.augments)&&oldCount>s.augments.length)s.shards+=(oldCount-s.augments.length)*5;for(const e of Array.isArray(s.items)?s.items:[])if(e?.rewardId&&retiredAugments[e.rewardId])e.rewardId=retiredAugments[e.rewardId];if(s.augmentOffer&&Array.isArray(s.augmentOffer.choices)&&Array.isArray(s.augments)){s.augmentOffer.choices=[...new Set(s.augmentOffer.choices.map(id=>retiredAugments[id]||id))].filter(id=>!s.augments.includes(id));if(!s.augmentOffer.choices.length)s.augmentOffer.choices=themedAugments.filter(a=>!s.augments.includes(a.id)).slice(0,3).map(a=>a.id);if(!s.augmentOffer.choices.length)s.augmentOffer=null;}}
export function updateThemeExploration(s,{has,stats,log}){const t=themeState(s),rooms=s.rooms||[];let changed=false;for(let i=0;i<rooms.length;i++){const r=rooms[i];if(s.player.x>=r.x&&s.player.x<r.x+r.w&&s.player.y>=r.y&&s.player.y<r.y+r.h&&!t.rooms.includes(i)){t.rooms.push(i);changed=true;}}if(changed&&has(s,'map-reader'))setThemeBuff(s,'roomSight',ap(s,'map-reader').sight,ap(s,'map-reader').duration);if(rooms.length&&t.rooms.length===rooms.length&&has(s,'pioneer')&&!t.pioneer){t.pioneer=true;s.hp=Math.min(stats(s).maxHp,s.hp+Math.ceil(stats(s).maxHp*ap(s,'pioneer').heal));s.shards+=ap(s,'pioneer').shards;log(s,'全ての部屋を見つけた。未知を拓く者が力をくれた。','good');}if(has(s,'breath')&&s.unharmedTurns>0&&s.unharmedTurns%20===0&&t.breaths<ap(s,'breath').uses){t.breaths++;s.hp=Math.min(stats(s).maxHp,s.hp+Math.ceil(stats(s).maxHp*ap(s,'breath').heal));}}
export function mitigateThemeDamage(s,damage,{has,stats}){const t=themeState(s);if(t.immunity>0){t.immunity--;return 0;}const choices=[];if(t.shieldHits>0)choices.push({rate:t.shieldRate,use:()=>t.shieldHits--});if(s.guardHits>0)choices.push({rate:.5,use:()=>s.guardHits--});if(has(s,'first-shield')&&!t.firstShield)choices.push({rate:Math.min(1,ap(s,'first-shield').reduction),use:()=>{t.firstShield=true;}});if(t.reserveHits>0)choices.push({rate:Math.min(1,ap(s,'reserve').reduction),use:()=>t.reserveHits--});choices.sort((a,b)=>b.rate-a.rate);const c=choices[0];if(c)c.use();return Math.ceil(damage*(1-(c?.rate||0))*(has(s,'blood-pact')&&s.hp/stats(s).maxHp<=.3?1.2:1));}
const adjacent=(s,ctx)=>s.enemies.filter(e=>ctx.canSee(s,e.x,e.y)&&Math.abs(e.x-s.player.x)+Math.abs(e.y-s.player.y)===1);
const visible=(s,ctx)=>s.enemies.filter(e=>ctx.canSee(s,e.x,e.y));
const attackIds=new Set(['palm','one-thought','frenzy','bite','blood-cut','sweep','life-burn','shield-bash','coin-strike','life-bet','all-in']);
export function skillCanRun(s,id,ctx){const d=themedSkillById[id];if(!d||(s.themeState?.used||[]).includes(id)||(id==='mend'&&s.mended)||(id==='warp'&&s.warped))return false;if(attackIds.has(id)&&!adjacent(s,ctx).length)return false;if(['blood-offering','blood-cut','life-burn','life-bet'].includes(id)&&s.hp<=1)return false;if(['first-aid','breathe','small-prayer','mend'].includes(id)&&s.hp>=ctx.stats(s).maxHp)return false;if(['focus','clear-mind','guard','shield-stance','iron-stance','fortress','warp'].includes(id)&&!visible(s,ctx).length&&id!=='fortress')return false;if(id==='fortune'&&s.shards<3)return false;if(id==='treasure-bet'&&!s.items.some(i=>i.type==='fragment'&&s.seen[i.y][i.x]&&ctx.route(s,p=>p.x===i.x&&p.y===i.y,{blocked:new Set(visible(s,ctx).map(e=>e.x+','+e.y))})))return false;if(id==='homeward'&&(!s.seen[s.stairs.y][s.stairs.x]||s.enemies.some(e=>e.boss)))return false;if(id==='waymark'&&!(s.rooms||[]).some((r,i)=>!(s.themeState?.mappedRooms||[]).includes(i)))return false;return true;}
export function executeThemedSkill(s,id,ctx){const d=themedSkillById[id],t=themeState(s),st=ctx.stats(s),target=adjacent(s,ctx)[0],rng=ctx.rng;let bonus=1;const duration=n=>n,chance=.5;
 if(ctx.has(s,'enlightenment')&&(attackIds.has(id)||['first-aid','breathe','small-prayer','mend','fortress','gamble-heal'].includes(id))){const earned=Math.max(0,Math.floor(s.steps/100)-t.悟り消費),used=Math.min(3,earned);bonus*=1+used*ap(s,'enlightenment').perCharge;t.悟り消費=Math.floor(s.steps/100);}
 const heal=ratio=>{const n=Math.max(0,Math.min(st.maxHp-s.hp,Math.ceil(st.maxHp*ratio*bonus)));s.hp+=n;return n;};const cost=amount=>{s.hp=Math.max(1,s.hp-Math.ceil(amount));};const hit=(e,power=1,leech=0)=>ctx.attackEnemy(s,e,{power:power*bonus,skill:true,leech});
 if(id==='treasure-bet'){const blocked=new Set(visible(s,ctx).map(e=>e.x+','+e.y)),item=s.items.find(i=>i.type==='fragment'&&s.seen[i.y][i.x]&&ctx.route(s,p=>p.x===i.x&&p.y===i.y,{blocked}));const next=item?ctx.route(s,p=>p.x===item.x&&p.y===item.y,{blocked}):null;if(!next)return false;s.player={...next};ctx.reveal(s);if(s.player.x!==item.x||s.player.y!==item.y)return {moving:true};t.used.push(id);s.skillUses=[...t.used];s.items=s.items.filter(i=>i!==item);const win=rng()<chance;s.shards+=win?9:0;ctx.log(s,win?'記憶の欠片への賭けに勝った。記憶の欠片＋9。':'記憶の欠片への賭けに敗れた。光が消えてしまった。',win?'good':'bad');return true;}
 t.used.push(id);s.skillUses=[...t.used];
 switch(id){
 case 'scout':setThemeBuff(s,'sight',2,duration(10));break;
 case 'trap-step':t.trapPass=1;break;
 case 'first-aid':heal(visible(s,ctx).length?.15:.25);break;
 case 'warp':{const dest=ctx.warpDestination(s);if(dest)s.player=dest;s.warped=true;ctx.reveal(s);break;}
 case 'waymark':{const rooms=s.rooms||[],current=rooms.findIndex(r=>s.player.x>=r.x&&s.player.x<r.x+r.w&&s.player.y>=r.y&&s.player.y<r.y+r.h);const queue=[{...s.player,depth:0,room:current}],seen=new Set(),touch=new Set();while(queue.length){const p=queue.shift(),k=p.x+','+p.y;if(seen.has(k))continue;seen.add(k);const i=rooms.findIndex(r=>p.x>=r.x&&p.x<r.x+r.w&&p.y>=r.y&&p.y<r.y+r.h);let depth=p.depth,room=p.room;if(i>=0&&i!==room){depth++;room=i;touch.add(i);if(depth>=(1))continue;}for(const[dx,dy]of [[0,1],[0,-1],[1,0],[-1,0]])if(s.grid[p.y+dy]?.[p.x+dx])queue.push({x:p.x+dx,y:p.y+dy,depth,room});}for(const i of [current,...touch])if(i>=0&&!t.mappedRooms.includes(i))t.mappedRooms.push(i);for(const k of seen){const[x,y]=k.split(',').map(Number);if(!rooms.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)){for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(ny<0||nx<0||ny>=s.grid.length||nx>=s.grid[0].length)continue;if((dx||dy)&&s.grid[ny][nx])continue;const n=ny*s.grid[0].length+nx;if(!t.mappedTiles.includes(n))t.mappedTiles.push(n);}}}break;}
 case 'homeward':s.player={...s.stairs};ctx.reveal(s);break;
 case 'focus':case 'clear-mind':setThemeBuff(s,'nextPower',id==='focus'?1.3:2,100000);s.unharmedTurns+=(id==='focus'?3:5);break;
 case 'breathe':heal(s.steps>=100?.25:.15);break;
 case 'iron-stance':setThemeBuff(s,'defense',3,5);break;
 case 'palm':hit(target,s.steps>=100?2.5:1.5);break;
 case 'one-thought':hit(target,Math.min(4,2+Math.floor(s.steps/100)*.5));break;
 case 'blood-offering':cost(st.maxHp*.1);setThemeBuff(s,'attack',4,8);break;
 case 'frenzy':hit(target,s.hp/st.maxHp<=.5?2:1.5);break;
 case 'bite':hit(target,1,.3);break;
 case 'blood-cut':cost(st.maxHp*.1);hit(target,2.5);break;
 case 'sweep':for(const e of adjacent(s,ctx))hit(e,1.2);break;
 case 'life-burn':cost(s.hp*.5);hit(target,4,.5);break;
 case 'small-prayer':heal(.2);break;
 case 'shield-stance':t.shieldHits=1;t.shieldRate=.7;break;
 case 'shield-bash':hit(target);target.weakenedHits=1;break;
 case 'mend':{const recovered=heal(.4);ctx.recordMend?.(recovered);s.mended=true;break;}
 case 'guard':s.guardHits=3;break;
 case 'fortress':heal(.3);t.immunity=2;break;
 case 'coin-strike':hit(target,rng()<chance?2:.5);break;
 case 'gamble-heal':if(rng()<chance)heal(.3);else cost(st.maxHp*.05);break;
 case 'fortune':s.shards-=3;if(rng()<chance){s.shards+=8;ctx.log(s,'運試しに勝った。記憶の欠片＋8。','good');}else ctx.log(s,'運試しに敗れた。','bad');break;
 case 'life-bet':cost(st.maxHp*.1);hit(target,rng()<chance?4:1);break;
 case 'all-in':if(rng()<chance)hit(target,6);else{t.immunity=1;ctx.log(s,'大勝負は外れた。次の一撃に備える。');}break;
 }
 ctx.log(s,d.name+'を使った。','good');return true;
}
