import {zones,monsters,minibosses} from './data.js';

export const NORMAL_FLOORS=30,TRUE_FLOORS=50,LETTER_FLOOR=16;
export const zoneIndexForFloor=floor=>[0,1,3,4,6,9][Math.floor((floor-1)/5)]??9;
export const bossForFloor=floor=>minibosses.find(b=>b.basement===NORMAL_FLOORS+1-floor);
export const fieldEvents={
 boss:{id:'boss',name:'封印された闘技場',hint:'門番の気配がする。固定の闘技場で中ボスを倒すまで階段は封印される。'},
 none:{id:'none',name:'静かな階',hint:'強い異変は感じない。油断せず、階段への道を探そう。'},
 monsters:{id:'monsters',name:'モンスターハウス',hint:'一室に幾つもの敵意が重なる。包囲への備えと、引き返す判断を。'},
 traps:{id:'traps',name:'トラップハウス',hint:'棘の紋様が密集する。罠は最初から見える。HPに余裕を残そう。'},
 fog:{id:'fog',name:'忘却の霧',hint:'白い霧の記憶。視界が2マス狭まる。回復と帰還を優先しよう。'},
};
// An independent seed makes the forecast identical to the next generated stage.
export function fieldPlan(seed,floor){
 if(bossForFloor(floor))return {...fieldEvents.boss};
 if(floor===1)return {...fieldEvents.none};
 let n=(Math.imul(seed|0,1664525)+Math.imul(floor,1013904223))>>>0;
 n^=n>>>16;n=Math.imul(n,0x7feb352d)>>>0;n^=n>>>15;
 const r=(n>>>0)/4294967296;
 return {...fieldEvents[r<.12?'monsters':r<.24?'traps':r<.40?'fog':'none']};
}
export function nextStageHint(s){
 if(s.phase==='dead')return {title:'再出発の残響 · B30',text:'骨は砕けても、旅の記録は残る。B30で装備と2枠の指示を確認しよう。',event:'none'};
 if(s.floor>=NORMAL_FLOORS)return {title:'地上1Fの残響',text:'階段の先で、誰かが剣を握っている。伝えたい想いがあるなら、その証を忘れずに。',event:'surface'};
 const floor=s.floor+1,z=zones[zoneIndexForFloor(floor)],plan=fieldPlan(s.seed,floor);
 return {floor,event:plan.id,title:`次はB${NORMAL_FLOORS+1-floor} · ${z.name}`,text:`${plan.hint} 主な魔物：${bossForFloor(floor)?.name||monsters[z.index*2].name}、${monsters[z.index*2+1].name}。${floor===LETTER_FLOOR?'胸の奥に、届けられなかった言葉の気配がある。':''}`};
}
