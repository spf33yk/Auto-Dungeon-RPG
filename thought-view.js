import {orderDefinitions} from './orders.js';

const thoughts={
 stairs:'階段だ。上へ行こう。',
 'stairs-low':'このままじゃ危ない。階段へ急ごう。',
 'stairs-after':'ずいぶん歩いたな。そろそろ上へ行こう。',
 'stairs-after-loot':'拾えるものは拾った。上へ行こう。',
 'collect-items':'あそこに何かある。拾っておこう。',
 chests:'宝箱だ。何が入っているだろう。',
 'chests-near':'すぐそこに宝箱がある。寄っていこう。',
 'heal-critical':'もう限界だ……泉までたどり着かないと。',
 'heal-wounded':'少し傷ついたな。泉で休もう。',
 letter:'あの箱が気になる……確かめたい。',
 frontier:'この先には、何があるんだろう。',
 'explore-near':'近くに、まだ歩いていない道がある。',
 'explore-all':'見落としたものはないか、隅まで調べよう。',
 'avoid-group':'囲まれる！ いったん離れよう。',
 'retreat-low':'これ以上はまずい……敵から離れよう。',
 'hunt-weak':'あの敵なら、一撃で倒せそうだ。',
 'hunt-injured':'あの敵、弱っている。今のうちだ。',
 'hunt-danger':'あいつは手強そうだ。先に倒しておこう。',
 'hunt-any':'敵がいる。近づいて倒そう。'
};

// Keep technical intent and combat logs intact; translate only the speech bubble.
export function thoughtText(intent=''){
 const order=orderDefinitions.find(o=>intent===`指示：${o.name}`);
 if(order)return thoughts[order.id];
 if(intent.startsWith('戦術判断：'))return `${intent.slice(5).replace(/を優先$/,'')}から倒そう。`;
 if(intent.startsWith('隣接する'))return `${intent.slice(4).replace(/と交戦$/,'')}か……ここは戦うしかない。`;
 if(intent==='封じられた宝箱。まだ思い出せない')return '開かない……誰かとの、大切な記憶が足りない。';
 if(intent==='階段は封印中。中ボスを倒す必要がある')return '階段が封じられている。あの門番を倒さないと。';
 if(intent==='階段を封じる門番の気配')return '何かいる……あいつが階段を守っているのか。';
 if(intent==='基本行動：探索を終え、階段へ')return 'ひと通り調べたな。階段へ戻ろう。';
 return 'この先には、何があるんだろう。';
}

// Coordinates are CSS pixels in the rendered canvas, including the sprite's hop.
export function thoughtPlacement({x,y,width,height,bubbleWidth,bubbleHeight,spriteHeight=0}){
 const margin=6,gap=10;
 const left=Math.max(margin,Math.min(width-bubbleWidth-margin,x-bubbleWidth/2));
 const below=y-bubbleHeight-gap<margin;
 const top=Math.max(margin,Math.min(height-bubbleHeight-margin,below?y+spriteHeight+gap:y-bubbleHeight-gap));
 return {left,top,below,tail:Math.max(10,Math.min(bubbleWidth-10,x-left))};
}
