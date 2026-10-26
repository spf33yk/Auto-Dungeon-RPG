import {orderDefinitions} from './orders.js';

const thoughts={
 tactics:'落ち着こう。倒せる相手から片づけよう。',
 warp:'まだ終われない……ここから逃げよう！',
 'avoid-traps':'足元に気をつけて、罠をよけよう。',
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

// Keep technical intent and combat logs intact; translate only the thought subtitle.
export function thoughtText(intent=''){
 const order=orderDefinitions.find(o=>intent===`指示：${o.name}`);
 if(order)return thoughts[order.id];
 if(intent.startsWith('カード指示：')){const action=intent.slice(6);return ({'階段を上る':'階段だ。上へ行こう。','宝箱を取得':'あの箱を開けてみよう。','品物を取得':'使えそうだ。拾っておこう。','回復品を取得':'傷を癒せるものを探そう。','手紙の箱を開ける':'あの手紙を届けたい。','視界の先を調べる':'この先に何があるだろう。','未踏の床を調べる':'まだ歩いていない道へ行こう。','敵から離れる':'今は距離を取ろう。','敵を攻撃':'あの敵を倒そう。','再生の祈り':'まだ倒れるわけにはいかない。','窮地の転移':'ここから逃れよう！'})[action]||'よし、決めたとおりに動こう。';}
 if(intent.startsWith('戦術判断：'))return `${intent.slice(5).replace(/を優先$/,'')}から倒そう。`;
 if(intent.startsWith('隣接する'))return `${intent.slice(4).replace(/と交戦$/,'')}か……ここは戦うしかない。`;
 if(intent==='進路の敵に向き合う')return 'あいつが道をふさいでいる。ここは倒そう。';
 if(intent==='鍵が足りない。今は開けられない')return '鍵がないな……また後で来よう。';
 if(intent==='封じられた宝箱。まだ思い出せない')return '開かない……誰かとの、大切な記憶が足りない。';
 if(intent==='階段は封印中。中ボスを倒す必要がある')return '階段が封じられている。あの門番を倒さないと。';
 if(intent==='階段を封じる門番の気配')return '何かいる……あいつが階段を守っているのか。';
 if(intent==='基本行動：探索を終え、階段へ')return 'ひと通り調べたな。階段へ戻ろう。';
 return 'この先には、何があるんだろう。';
}
