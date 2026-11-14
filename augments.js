import{augmentStats as ap}from'./set-bonuses.js';
import{recordBuild}from'./build-performance.js';
import{themedAugments,themeById,retiredAugments}from'./build-themes.js';
import{themeState,themeBuff}from'./theme-runtime.js';
export const augments=themedAugments.map(a=>({...a,theme:themeById[a.themeId].name}));
export const augmentById=Object.fromEntries(augments.map(a=>[a.id,a]));
for(const[old,id]of Object.entries(retiredAugments))augmentById[old]=augmentById[id];
export const hasAugment=(s,id)=>(s.augments||[]).some(a=>(retiredAugments[a]||a)===id);
export function offerAugments(s,rng,source){if(s.augmentOffer)return false;const pool=augments.filter(a=>!hasAugment(s,a.id)),choices=[];while(pool.length&&choices.length<3){let pick=rng()*pool.reduce((n,a)=>n+({NORMAL:70,EPIC:25,LEGENDARY:5}[a.rarity]),0),index=pool.length-1;for(let i=0;i<pool.length;i++){pick-=({NORMAL:70,EPIC:25,LEGENDARY:5}[pool[i].rarity]);if(pick<0){index=i;break;}}choices.push(pool.splice(index,1)[0].id);}s.augmentOffer=choices.length?{source,choices}:null;return Boolean(s.augmentOffer);}
export function chooseAugment(s,id){if(!s.augmentOffer?.choices.includes(id)||hasAugment(s,id))return false;s.augments??=[];s.augments.push(id);s.profile.augments??=[];if(!s.profile.augments.includes(id))s.profile.augments.push(id);if(s.augmentOffer.source==='start')s.augmentStarted=true;s.augmentOffer=null;s.logs?.unshift({text:'「'+augmentById[id].name+'」が骨に宿った。',type:'good',turn:s.turn});return true;}
export function augmentBonus(s,maxHp,visibleEnemies=0){const has=id=>hasAugment(s,id),p=id=>ap(s,id),missing=Math.max(0,1-s.hp/maxHp),steps=s.steps||0,t=s.themeState,grow=(id,count)=>has(id)?Math.min(p(id).cap,count*p(id).step):0;return {
 attack:grow('ripen',Math.floor(steps/40))+grow('pilgrim',Math.floor(s.turn/200))+grow('desperate',Math.min(9,Math.floor(missing*10+1e-8)))+grow('surrounded',visibleEnemies)+grow('trailblazer',t?.rooms?.length||0)+(has('pioneer')&&t?.pioneer?p('pioneer').attack:0)+themeBuff(s,'attack')-themeBuff(s,'attackDown'),
 defense:(has('shell')&&s.hp/maxHp>=.8?p('shell').defense:0)+grow('patience',Math.floor(steps/60))+themeBuff(s,'defense')-themeBuff(s,'exposed'),
 critical:Math.min(1,(has('critical')?p('critical').chance:0)+grow('hunter',t?.normalKills||0)+grow('pity',t?.pity||0)),
 leech:(has('leech')?p('leech').rate:0)+(has('blood')?missing*p('blood').rate:0)+(has('blood-pact')&&missing>=.7?p('blood-pact').leech:0),charged:has('charge')&&(s.unharmedTurns||0)>=10,
 damage:has('blood-pact')&&missing>=.7?p('blood-pact').damage:1};}
export function takeHeroDamage(s,damage){if(damage<=0)return false;const t=themeState(s),before=s.hp;s.unharmedTurns=0;if(damage>=s.hp&&hasAugment(s,'undying')&&!s.undyingUsed){recordBuild(s,'damageTaken',Math.max(0,s.hp-1));recordBuild(s,'undyingUses');s.hp=1;s.undyingUsed=true;t.immunity=ap(s,'undying').immunity;return true;}recordBuild(s,'damageTaken',Math.min(s.hp,damage));s.hp=Math.max(0,s.hp-damage);if(hasAugment(s,'reserve')&&!t.reserveUsed&&before-s.hp>=maxHpForReserve(s)*.2){t.reserveUsed=true;t.reserveHits=2;}return false;}
function maxHpForReserve(s){return 54+(Math.max(1,s.level||1)-1)*3+(s.levels?.vitality||0)*12;}
export function clearAugmentHealing(s,maxHp){return hasAugment(s,'swift-ascent')&&s.steps<150?Math.max(0,Math.min(maxHp-s.hp,Math.ceil(maxHp*ap(s,'swift-ascent').heal))):0;}
