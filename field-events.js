import {zones,monsters,minibosses} from './data.js';

export const NORMAL_FLOORS=30,LETTER_FLOOR=6;
export const SHORT_START_FLOOR=6;
export const startFloorFor=()=>SHORT_START_FLOOR;
export const zoneIndexForFloor=floor=>[0,1,3,4,9][Math.max(0,Math.floor((floor-SHORT_START_FLOOR)/5))]??9;
export const bossForFloor=floor=>minibosses.find(b=>b.basement===NORMAL_FLOORS+1-floor);
export const bossSkills={
 'boss-b20':{name:'封門斬',range:1,power:1.25,hpRatio:.75,detail:'HP75%以下で隣接する骸に1.25倍の斬撃。'},
 'boss-b10':{name:'霧冠の波動',range:2,power:.8,hpRatio:.65,detail:'HP65%以下で見通せる2マス以内の骸に0.8倍の波動。'},
 'boss-b1':{name:'暁門の一撃',range:1,power:1.5,hpRatio:.35,detail:'HP35%以下で隣接する骸に1.5倍の一撃。'}
};
export const fieldEvents={
 boss:{id:'boss',name:'封印された闘技場',hint:'門番の気配がする。固定の闘技場で門番を倒すまで階段は封印される。'},
 none:{id:'none',name:'静かな階',hint:'強い異変は感じない。油断せず、階段への道を探そう。'},
 monsters:{id:'monsters',name:'モンスターハウス',hint:'広い一室に敵とアイテムが集まる。包囲に備えよう。'},
 traps:{id:'traps',name:'トラップハウス',hint:'棘の紋様が密集する。罠は最初から見える。HPに余裕を残そう。'},
 fog:{id:'fog',name:'忘却の霧',hint:'白い霧の記憶。視界が2マス狭まる。回復と帰還を優先しよう。'},
};
// An independent seed makes the forecast identical to the next generated stage.
export function fieldPlan(seed,floor){
 if(bossForFloor(floor))return {...fieldEvents.boss};
 if(floor===SHORT_START_FLOOR)return {...fieldEvents.none};
 let n=(Math.imul(seed|0,1664525)+Math.imul(floor,1013904223))>>>0;
 n^=n>>>16;n=Math.imul(n,0x7feb352d)>>>0;n^=n>>>15;
 const r=(n>>>0)/4294967296;
 return {...fieldEvents[r<.12?'monsters':r<.24?'traps':r<.40?'fog':'none']};
}
export function nextStageHint(s){
 if(s.phase==='dead')return {title:'再出発 · B'+(NORMAL_FLOORS+1-startFloorFor(s)),text:'骨は砕けても、旅の記録は残る。再び最深部から歩き始めよう。',event:'none'};
 if(s.floor>=NORMAL_FLOORS)return {title:'地上の気配',text:'階段の先から、かすかな風が吹いてくる。',event:'surface'};
 const floor=s.floor+1,boss=bossForFloor(floor),skill=s.profile?.normalClears>0&&bossSkills[boss?.id],z=zones[zoneIndexForFloor(floor)],plan=fieldPlan(s.seed,floor);
 return {floor,event:plan.id,title:`次はB${NORMAL_FLOORS+1-floor} · ${z.name}`,text:`${plan.hint} 主な魔物：${bossForFloor(floor)?.name||monsters[z.index*2].name+'、'+monsters[z.index*2+1].name}。${skill?' 固有スキル「'+skill.name+'」：'+skill.detail+' 各戦闘1回。':''}`};
}

// Preparation already points at the floor that will be explored next.
export function preparationFloorInfo(s){
 const floor=s.floor,z=zones[zoneIndexForFloor(floor)],boss=bossForFloor(floor),event=fieldPlan(s.seed,floor),skill=s.profile?.normalClears>0?bossSkills[boss?.id]:null;
 return {basement:'B'+(NORMAL_FLOORS+1-floor),name:z.name,event:event.id==='none'?'なし':event.name,monsters:boss?[boss.name]:[monsters[z.index*2].name,monsters[z.index*2+1].name],skill:skill?skill.name+'（各戦闘1回）':'なし',skillDetail:skill?skill.detail+' 各戦闘1回。':''};
}
