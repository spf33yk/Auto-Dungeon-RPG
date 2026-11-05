import{recordBuild}from'./build-performance.js';
import{themedAugments,themeById,retiredAugments}from'./build-themes.js';
import{themeState,themeBuff}from'./theme-runtime.js';
export const augments=themedAugments.map(a=>({...a,theme:themeById[a.themeId].name}));
export const augmentById=Object.fromEntries(augments.map(a=>[a.id,a]));
for(const[old,id]of Object.entries(retiredAugments))augmentById[old]=augmentById[id];
export const hasAugment=(s,id)=>(s.augments||[]).some(a=>(retiredAugments[a]||a)===id);
export function offerAugments(s,rng,source){if(s.augmentOffer)return false;const pool=augments.filter(a=>!hasAugment(s,a.id)),choices=[];while(pool.length&&choices.length<3){let pick=rng()*pool.reduce((n,a)=>n+({NORMAL:70,EPIC:25,LEGENDARY:5}[a.rarity]),0),index=pool.length-1;for(let i=0;i<pool.length;i++){pick-=({NORMAL:70,EPIC:25,LEGENDARY:5}[pool[i].rarity]);if(pick<0){index=i;break;}}choices.push(pool.splice(index,1)[0].id);}s.augmentOffer=choices.length?{source,choices}:null;return Boolean(s.augmentOffer);}
export function chooseAugment(s,id){if(!s.augmentOffer?.choices.includes(id)||hasAugment(s,id))return false;s.augments??=[];s.augments.push(id);s.profile.augments??=[];if(!s.profile.augments.includes(id))s.profile.augments.push(id);if(s.augmentOffer.source==='start')s.augmentStarted=true;s.augmentOffer=null;s.logs?.unshift({text:'「'+augmentById[id].name+'」が骨に宿った。',type:'good',turn:s.turn});return true;}
export function augmentBonus(s,maxHp,visibleEnemies=0){const has=id=>hasAugment(s,id),missing=Math.max(0,1-s.hp/maxHp),steps=s.steps||0,t=s.themeState;return {
 attack:(has('ripen')?Math.min(5,Math.floor(steps/40)):0)+(has('pilgrim')?Math.min(15,Math.floor(s.turn/200)):0)+(has('desperate')?Math.min(9,Math.floor(missing*10+1e-8)):0)+(has('surrounded')?Math.min(5,visibleEnemies):0)+(has('trailblazer')?Math.min(5,t?.rooms?.length||0):0)+(has('pioneer')&&t?.pioneer?5:0)+themeBuff(s,'attack'),
 defense:(has('shell')&&s.hp/maxHp>=.8?3:0)+(has('patience')?Math.min(3,Math.floor(steps/60)):0)+themeBuff(s,'defense'),
 critical:(has('critical')?.10:0)+(has('hunter')?Math.min(.40,(t?.normalKills||0)*.04):0)+(has('pity')?Math.min(.30,(t?.pity||0)*.05):0),
 leech:(has('leech')?.03:0)+(has('blood')?missing*.20:0)+(has('blood-pact')&&missing>=.7?.15:0),charged:has('charge')&&(s.unharmedTurns||0)>=10,
 damage:has('blood-pact')&&missing>=.7?1.5:1};}
export function takeHeroDamage(s,damage){if(damage<=0)return false;const t=themeState(s),before=s.hp;s.unharmedTurns=0;if(damage>=s.hp&&hasAugment(s,'undying')&&!s.undyingUsed){recordBuild(s,'damageTaken',Math.max(0,s.hp-1));recordBuild(s,'undyingUses');s.hp=1;s.undyingUsed=true;t.immunity=1;return true;}recordBuild(s,'damageTaken',Math.min(s.hp,damage));s.hp=Math.max(0,s.hp-damage);if(hasAugment(s,'reserve')&&!t.reserveUsed&&before-s.hp>=maxHpForReserve(s)*.2){t.reserveUsed=true;t.reserveHits=2;}return false;}
function maxHpForReserve(s){return 54+(Math.max(1,s.level||1)-1)*3+(s.levels?.vitality||0)*12;}
export function clearAugmentHealing(s,maxHp){return hasAugment(s,'swift-ascent')&&s.steps<150?Math.max(0,Math.min(maxHp-s.hp,Math.ceil(maxHp*.15))):0;}
