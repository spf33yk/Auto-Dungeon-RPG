import{augmentStats,starText}from'./set-bonuses.js';
import{growthNumber as f}from'./augment-growth.js';
export function augmentStrength(a,s){const p=augmentStats(s,a.id),pct=key=>f(p[key]*100)+'%',grow=(period,stat,total=false)=>`${total?'旅の累計':'この階の'}${period}ターンごとに${stat}＋${f(p.step)}、最大＋${f(p.cap)}。${total?'':'次の階でリセット。'}`,r={
 'map-reader':()=>`この階で初めて入る部屋ごとに、${p.duration}ターン視界半径＋${p.sight}マス。重複時は時間を更新。`,
 scavenger:()=>`床の記憶の欠片を拾うたび、記憶の欠片を通常の取得量に加えて${p.extra}個獲得。`,
 'swift-ascent':()=>`この階を150ターン未満でクリアすると、自分のHPを最大HPの${pct('heal')}回復（端数切上げ）。`,
 trailblazer:()=>`この階で入った異なる部屋1つにつきATK＋${f(p.step)}、最大＋${f(p.cap)}。次の階でリセット。`,
 'treasure-sense':()=>`カード宝箱の候補上限を3枚から${p.candidates}枚へ増やす。同種類・同レアリティのカード数が少ない場合はその枚数まで。取得枚数は変わらない。`,
 pioneer:()=>`この階の全ての部屋に入ると、HPを最大HPの${pct('heal')}回復（端数切上げ）、記憶の欠片を${p.shards}個獲得。この階のATK＋${p.attack}。各階1回。`,
 ripen:()=>grow(40,'ATK'),patience:()=>grow(60,'DEF'),
 breath:()=>`ダメージを受けずに20ターン過ごすごとに、HPを最大HPの${pct('heal')}回復（端数切上げ）。各階${p.uses}回まで。`,
 pilgrim:()=>grow(200,'ATK',true),
 charge:()=>`ダメージを受けずに10ターン過ごすと、次の打撃のダメージが${p.damage}倍。打撃後は無被弾ターン数を0に戻す。`,
 enlightenment:()=>`この階の100ターンごとに悟りを1蓄積（最大3）。攻撃・回復スキル使用時に蓄積を全て消費し、ダメージ・回復量を1蓄積につき${pct('perCharge')}増加。次の階でリセット。`,
 desperate:()=>`最大HPの10%を失うごとにATK＋${p.step}、最大＋${p.cap}。HPが回復すると補正も減る。`,
 leech:()=>`打撃で実際に減らした敵HPの${pct('rate')}を、自分のHPとして回復（端数切捨て）。`,
 surrounded:()=>`視界内の敵1体につきATK＋${p.step}、最大＋${p.cap}。見える敵数に応じて変動。`,
 blood:()=>`失ったHPの割合×${pct('rate')}を吸命率に加算。打撃で実際に減らした敵HP×吸命率を自分のHPとして回復（端数切捨て）。`,
 hunter:()=>`この階の通常敵を倒すたびに会心率＋${pct('step')}、最大＋${pct('cap')}。ボス・増援は対象外。次の階でリセット。`,
 'blood-pact':()=>`HP30%以下の間、打撃の与ダメージ${p.damage}倍、吸命率＋${pct('leech')}、被ダメージ1.2倍。吸命は実際に減らした敵HPから計算（端数切捨て）。`,
 shell:()=>`HPが最大HPの80%以上の間、DEF＋${p.defense}。`,
 'first-shield':()=>`各階1回、被ダメージを${pct('reduction')}軽減。より強い防御効果が使われる場合は消費しない。`,
 restful:()=>`次の階へ進む際の休息回復に、最大HPの${pct('heal')}分を追加。回復量の合計は端数切上げ。`,
 moon:()=>`各階の最初の打撃時にHP満タンなら必ず会心となり、ダメージ${p.damage}倍。満タンでなくても最初の打撃で機会を消費。`,
 reserve:()=>`一撃で最大HPの20%以上を失うと、その後2回の被ダメージを${pct('reduction')}軽減。各階1回。より強い防御効果が使われる場合は回数を消費しない。`,
 undying:()=>`各階1回、HPが0になるダメージをHP1で耐える。その後${p.immunity}回の被ダメージを無効化。`,
 critical:()=>`会心率＋${pct('chance')}。通常の会心ダメージは1.5倍。`,
 'risky-blade':()=>`打撃ごとに50%で与ダメージ${p.damage}倍、残り50%で0.8倍。`,
 'lucky-find':()=>`床の記憶の欠片を拾うたび、${pct('chance')}の確率で記憶の欠片を通常の取得量に加えて4個獲得。`,
 'double-strike':()=>`通常攻撃の後、${pct('chance')}の確率で追加の通常攻撃を1回行う。攻撃スキルでは発動せず、追加攻撃から再発動しない。`,
 pity:()=>`会心でない打撃ごとに会心率＋${pct('step')}、最大＋${pct('cap')}。会心が出るか、次の階へ進むとリセット。`,
 destiny:()=>`各階で最初に開けるカード宝箱のみ、${p.chance===1?'必ず':pct('chance')+'の確率で'}カードを2枚取得。${p.chance<1?'外れた場合はカードの代わりに記憶の欠片を'+p.consolation+'個獲得。':''}抽選結果は保存される。`
};return r[a.id]?.()||a.detail;}
export function augmentName(a,s){const stars=s?starText(s,a.id):'';return a.name+(stars?' '+stars:'');}
