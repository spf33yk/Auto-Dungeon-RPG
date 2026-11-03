// 仮バランス。描画・予測・本編で共通の定義を使う。
export const augments=[
 ['ripen','熟成の刃','熟成','NORMAL','この階の40ターンごとに攻撃力+1、最大+8。'],
 ['haste','焦燥の刃','焦燥','NORMAL','攻撃力+6。20ターンごとに1減少、最低0。'],
 ['pilgrim','積年の刃','熟成','EPIC','累計200ターンごとに攻撃力+1、最大+15。'],
 ['desperate','背水の刃','背水','NORMAL','失ったHP10%ごとに攻撃力+1、最大+9。'],
 ['undying','骨の執念','背水','LEGENDARY','各階1回、致命傷をHP1で耐える。'],
 ['blood','渇いた骨','背水','EPIC','失ったHPの割合×20%の吸命率を得る。'],
 ['thorns','棘の記憶','傷跡','EPIC','この旅の罠作動1回につき攻撃力+1、最大+12。'],
 ['charge','静寂の一閃','満月','EPIC','被弾せず10ターン過ごすと次の攻撃が2倍。攻撃後に蓄積を消費。'],
 ['hunter','連戦の昂り','闘争','EPIC','この階の撃破1体につき会心率+4%、最大+40%。'],
 ['moon','満月の初太刀','満月','LEGENDARY','各階最初の攻撃時、HP満タンなら必ず会心。'],
 ['surrounded','包囲の闘志','闘争','NORMAL','視界内の敵1体につき攻撃力+1、最大+6。'],
 ['nova','万象斬り','闘争','LEGENDARY','攻撃時、視界内の他の敵にも通常ダメージ÷(距離+1)の追撃、最低1。'],
 ['critical','会心の記憶','闘争','NORMAL','各打撃の会心率+10%。会心はダメージ1.5倍。'],
 ['leech','吸命の記憶','傷跡','EPIC','実際に与えたダメージの5%を回復（切捨て）。'],
 ['double-strike','追撃の記憶','焦燥','LEGENDARY','通常打撃後5%で追加攻撃。同ターン1回まで。'],
 ['shell','満月の守り','満月','NORMAL','HP80%以上の間、防御力+3。'],
 ['patience','熟成の鎧','熟成','EPIC','この階の50ターンごとに防御力+1、最大+6。'],
 ['rush','焦燥の鋭刃','焦燥','EPIC','この階の最初の60ターン、会心率+25%。'],
].map(([id,name,theme,rarity,detail])=>({id,name,theme,rarity,detail}));
export const augmentById=Object.fromEntries(augments.map(a=>[a.id,a]));
export const hasAugment=(s,id)=>(s.augments||[]).includes(id);
export function offerAugments(s,rng,source){if(s.augmentOffer)return false;const pool=augments.filter(a=>!hasAugment(s,a.id)),choices=[];while(pool.length&&choices.length<3){let pick=rng()*pool.reduce((n,a)=>n+({NORMAL:70,EPIC:25,LEGENDARY:5}[a.rarity]),0),index=pool.length-1;for(let i=0;i<pool.length;i++){pick-=({NORMAL:70,EPIC:25,LEGENDARY:5}[pool[i].rarity]);if(pick<0){index=i;break;}}choices.push(pool.splice(index,1)[0].id);}s.augmentOffer=choices.length?{source,choices}:null;return Boolean(s.augmentOffer);}
export function chooseAugment(s,id){if(!s.augmentOffer?.choices.includes(id)||hasAugment(s,id))return false;s.augments??=[];s.augments.push(id);s.profile.augments??=[];if(!s.profile.augments.includes(id))s.profile.augments.push(id);if(s.augmentOffer.source==='start')s.augmentStarted=true;s.augmentOffer=null;s.logs?.unshift({text:'「'+augmentById[id].name+'」が骨に宿った。',type:'good',turn:s.turn});return true;}
export function augmentBonus(s,maxHp,visibleEnemies=0){const has=id=>hasAugment(s,id),missing=Math.max(0,1-s.hp/maxHp),steps=s.steps||0;return {
 attack:(has('ripen')?Math.min(8,Math.floor(steps/40)):0)+(has('haste')?Math.max(0,6-Math.floor(steps/20)):0)+(has('pilgrim')?Math.min(15,Math.floor(s.turn/200)):0)+(has('desperate')?Math.min(9,Math.floor(missing*10+1e-8)):0)+(has('thorns')?Math.min(12,s.trapTriggers||0):0)+(has('surrounded')?Math.min(6,visibleEnemies):0),
 defense:(has('shell')&&s.hp/maxHp>=.8?3:0)+(has('patience')?Math.min(6,Math.floor(steps/50)):0),
 critical:(has('critical')?.10:0)+(has('hunter')?Math.min(.40,(s.floorKills||0)*.04):0)+(has('rush')&&steps<=60?.25:0),
 leech:(has('leech')?.05:0)+(has('blood')?missing*.20:0),charged:has('charge')&&(s.unharmedTurns||0)>=10};}
export function takeHeroDamage(s,damage){s.unharmedTurns=0;if(damage>=s.hp&&hasAugment(s,'undying')&&!s.undyingUsed){s.hp=1;s.undyingUsed=true;return true;}s.hp=Math.max(0,s.hp-damage);return false;}
