export const buildThemes=[{"id": "explorer", "name": "探索家", "color": "#a9ba91", "detail": "探索と回収、帰還を有利にする。"}, {"id": "monk", "name": "修行僧", "color": "#cdbb88", "detail": "時間をかけて力を蓄える。"}, {"id": "berserker", "name": "狂戦士", "color": "#c89187", "detail": "HPを代償に攻め続ける。"}, {"id": "guardian", "name": "守護者", "color": "#9eb7cd", "detail": "HPを守り、安全に突破する。"}, {"id": "gambler", "name": "勝負師", "color": "#b7a1c9", "detail": "危険を引き受け、大きな利益を狙う。"}];
export const themeById=Object.fromEntries(buildThemes.map(t=>[t.id,t]));
export const themedAugments=[
 {
  "id": "map-reader",
  "name": "地図読み",
  "themeId": "explorer",
  "rarity": "NORMAL",
  "detail": "この階で初めて入る部屋ごとに、5ターン視界半径＋1マス。重複時は時間を更新。"
 },
 {
  "id": "scavenger",
  "name": "収集の心得",
  "themeId": "explorer",
  "rarity": "NORMAL",
  "detail": "床の記憶の欠片を拾うたび、記憶の欠片を通常の取得量に加えて1個獲得。"
 },
 {
  "id": "swift-ascent",
  "name": "駆け上がる記憶",
  "themeId": "explorer",
  "rarity": "NORMAL",
  "detail": "この階を150ターン未満でクリアすると、自分のHPを最大HPの15%回復（端数切上げ）。"
 },
 {
  "id": "trailblazer",
  "name": "踏破の心得",
  "themeId": "explorer",
  "rarity": "EPIC",
  "detail": "この階で入った異なる部屋1つにつきATK＋1、最大＋5。次の階でリセット。"
 },
 {
  "id": "treasure-sense",
  "name": "宝探しの勘",
  "themeId": "explorer",
  "rarity": "EPIC",
  "detail": "カード宝箱の候補上限を3枚から4枚へ増やす。同種類・同レアリティのカード数が少ない場合はその枚数まで。取得枚数は変わらない。"
 },
 {
  "id": "pioneer",
  "name": "未知を拓く者",
  "themeId": "explorer",
  "rarity": "LEGENDARY",
  "detail": "この階の全ての部屋に入ると、HPを最大HPの20%回復（端数切上げ）、記憶の欠片を8個獲得。この階のATK＋5。各階1回。"
 },
 {
  "id": "ripen",
  "name": "熟成の刃",
  "themeId": "monk",
  "rarity": "NORMAL",
  "detail": "この階の40ターンごとにATK＋1、最大＋5。次の階でリセット。"
 },
 {
  "id": "patience",
  "name": "熟成の鎧",
  "themeId": "monk",
  "rarity": "NORMAL",
  "detail": "この階の60ターンごとにDEF＋1、最大＋3。次の階でリセット。"
 },
 {
  "id": "breath",
  "name": "調息の心得",
  "themeId": "monk",
  "rarity": "NORMAL",
  "detail": "ダメージを受けずに20ターン過ごすごとに、HPを最大HPの3%回復（端数切上げ）。各階5回まで。"
 },
 {
  "id": "pilgrim",
  "name": "積年の刃",
  "themeId": "monk",
  "rarity": "EPIC",
  "detail": "旅の累計200ターンごとにATK＋1、最大＋15。"
 },
 {
  "id": "charge",
  "name": "静寂の一閃",
  "themeId": "monk",
  "rarity": "EPIC",
  "detail": "ダメージを受けずに10ターン過ごすと、次の打撃のダメージが2倍。打撃後は無被弾ターン数を0に戻す。"
 },
 {
  "id": "enlightenment",
  "name": "悟りの境地",
  "themeId": "monk",
  "rarity": "LEGENDARY",
  "detail": "この階の100ターンごとに悟りを1蓄積（最大3）。攻撃・回復スキル使用時に蓄積を全て消費し、ダメージ・回復量を1蓄積につき25%増加。次の階でリセット。"
 },
 {
  "id": "desperate",
  "name": "背水の刃",
  "themeId": "berserker",
  "rarity": "NORMAL",
  "detail": "最大HPの10%を失うごとにATK＋1、最大＋9。HPが回復すると補正も減る。"
 },
 {
  "id": "leech",
  "name": "吸命の記憶",
  "themeId": "berserker",
  "rarity": "NORMAL",
  "detail": "打撃で実際に減らした敵HPの3%を、自分のHPとして回復（端数切捨て）。"
 },
 {
  "id": "surrounded",
  "name": "包囲の闘志",
  "themeId": "berserker",
  "rarity": "NORMAL",
  "detail": "視界内の敵1体につきATK＋1、最大＋5。見える敵数に応じて変動。"
 },
 {
  "id": "blood",
  "name": "渇いた骨",
  "themeId": "berserker",
  "rarity": "EPIC",
  "detail": "失ったHPの割合×20%を吸命率に加算。打撃で実際に減らした敵HP×吸命率を自分のHPとして回復（端数切捨て）。"
 },
 {
  "id": "hunter",
  "name": "連戦の昂り",
  "themeId": "berserker",
  "rarity": "EPIC",
  "detail": "この階の通常敵を倒すたびに会心率＋4%、最大＋40%。ボス・増援は対象外。次の階でリセット。"
 },
 {
  "id": "blood-pact",
  "name": "血戦の誓い",
  "themeId": "berserker",
  "rarity": "LEGENDARY",
  "detail": "HP30%以下の間、打撃の与ダメージ1.5倍、吸命率＋15%、被ダメージ1.2倍。吸命は実際に減らした敵HPから計算（端数切捨て）。"
 },
 {
  "id": "shell",
  "name": "満月の守り",
  "themeId": "guardian",
  "rarity": "NORMAL",
  "detail": "HPが最大HPの80%以上の間、DEF＋3。"
 },
 {
  "id": "first-shield",
  "name": "骨の盾",
  "themeId": "guardian",
  "rarity": "NORMAL",
  "detail": "各階1回、被ダメージを50%軽減。より強い防御効果が使われる場合は消費しない。"
 },
 {
  "id": "restful",
  "name": "休息の心得",
  "themeId": "guardian",
  "rarity": "NORMAL",
  "detail": "次の階へ進む際の休息回復に、最大HPの5%分を追加。回復量の合計は端数切上げ。"
 },
 {
  "id": "moon",
  "name": "満月の初太刀",
  "themeId": "guardian",
  "rarity": "EPIC",
  "detail": "各階の最初の打撃時にHP満タンなら必ず会心となり、ダメージ1.5倍。満タンでなくても最初の打撃で機会を消費。"
 },
 {
  "id": "reserve",
  "name": "守りの余力",
  "themeId": "guardian",
  "rarity": "EPIC",
  "detail": "一撃で最大HPの20%以上を失うと、その後2回の被ダメージを30%軽減。各階1回。より強い防御効果が使われる場合は回数を消費しない。"
 },
 {
  "id": "undying",
  "name": "骨の執念",
  "themeId": "guardian",
  "rarity": "LEGENDARY",
  "detail": "各階1回、HPが0になるダメージをHP1で耐える。その後1回の被ダメージを無効化。"
 },
 {
  "id": "critical",
  "name": "会心の記憶",
  "themeId": "gambler",
  "rarity": "NORMAL",
  "detail": "会心率＋10%。通常の会心ダメージは1.5倍。"
 },
 {
  "id": "risky-blade",
  "name": "危うい刃",
  "themeId": "gambler",
  "rarity": "NORMAL",
  "detail": "打撃ごとに50%で与ダメージ1.3倍、残り50%で0.8倍。"
 },
 {
  "id": "lucky-find",
  "name": "拾い物の運",
  "themeId": "gambler",
  "rarity": "NORMAL",
  "detail": "床の記憶の欠片を拾うたび、25%の確率で記憶の欠片を通常の取得量に加えて4個獲得。"
 },
 {
  "id": "double-strike",
  "name": "追撃の記憶",
  "themeId": "gambler",
  "rarity": "EPIC",
  "detail": "通常攻撃の後、15%の確率で追加の通常攻撃を1回行う。攻撃スキルでは発動せず、追加攻撃から再発動しない。"
 },
 {
  "id": "pity",
  "name": "幸運の揺り戻し",
  "themeId": "gambler",
  "rarity": "EPIC",
  "detail": "会心でない打撃ごとに会心率＋5%、最大＋30%。会心が出るか、次の階へ進むとリセット。"
 },
 {
  "id": "destiny",
  "name": "運命の賽",
  "themeId": "gambler",
  "rarity": "LEGENDARY",
  "detail": "各階で最初に開けるカード宝箱のみ、50%の確率で当たり。アクション・条件は2枚、スキルは1枚取得。外れた場合はカードの代わりに記憶の欠片を10個獲得。抽選結果は保存される。"
 }
];
export const themedSkills=[
 {
  "id": "scout",
  "name": "周辺偵察",
  "themeId": "explorer",
  "rarity": "NORMAL",
  "detail": "10ターン、視界半径＋2。壁越しには見えない。"
 },
 {
  "id": "trap-step",
  "name": "罠抜け",
  "themeId": "explorer",
  "rarity": "NORMAL",
  "detail": "次に踏む罠1個を無傷で通過し、作動済みにする。"
 },
 {
  "id": "first-aid",
  "name": "応急手当",
  "themeId": "explorer",
  "rarity": "NORMAL",
  "detail": "最大HPの15%を回復。敵が視界内にいなければ25%。"
 },
 {
  "id": "warp",
  "name": "窮地の転移",
  "themeId": "explorer",
  "rarity": "EPIC",
  "detail": "敵が見える時、ランダムな空き床へ転移。安全は保証されない。"
 },
 {
  "id": "waymark",
  "name": "道標",
  "themeId": "explorer",
  "rarity": "EPIC",
  "detail": "現在の部屋に接続する通路と隣の部屋の地形をMAPへ記録。敵や品物は公開しない。"
 },
 {
  "id": "homeward",
  "name": "帰路の印",
  "themeId": "explorer",
  "rarity": "LEGENDARY",
  "detail": "発見済み・封印解除済みの階段へ転移してClearする。"
 },
 {
  "id": "focus",
  "name": "静寂の構え",
  "themeId": "monk",
  "rarity": "NORMAL",
  "detail": "次の打撃を1.3倍にし、無被弾の蓄積を3ターン進める。"
 },
 {
  "id": "breathe",
  "name": "調息",
  "themeId": "monk",
  "rarity": "NORMAL",
  "detail": "最大HPの15%を回復。この階で100ターン経過後は25%。"
 },
 {
  "id": "iron-stance",
  "name": "金剛の構え",
  "themeId": "monk",
  "rarity": "NORMAL",
  "detail": "5ターン、DEF＋3。"
 },
 {
  "id": "palm",
  "name": "練気掌",
  "themeId": "monk",
  "rarity": "EPIC",
  "detail": "隣接敵へ1.5倍攻撃。この階で100ターン経過後は2.5倍。"
 },
 {
  "id": "clear-mind",
  "name": "明鏡止水",
  "themeId": "monk",
  "rarity": "EPIC",
  "detail": "次の打撃を2倍にし、無被弾の蓄積を5ターン進める。"
 },
 {
  "id": "one-thought",
  "name": "奥義・一念",
  "themeId": "monk",
  "rarity": "LEGENDARY",
  "detail": "隣接敵へ2倍攻撃。この階の100ターンごとに倍率＋0.5、最大4倍。"
 },
 {
  "id": "blood-offering",
  "name": "血の供物",
  "themeId": "berserker",
  "rarity": "NORMAL",
  "detail": "最大HPの10%を消費し、8ターン、ATK＋4。HP1は残る。"
 },
 {
  "id": "frenzy",
  "name": "荒ぶる一撃",
  "themeId": "berserker",
  "rarity": "NORMAL",
  "detail": "隣接敵へ1.5倍攻撃。HP50%以下なら2倍。"
 },
 {
  "id": "bite",
  "name": "食らいつく",
  "themeId": "berserker",
  "rarity": "NORMAL",
  "detail": "隣接敵へ通常攻撃。この打撃に限り吸命率＋30%。"
 },
 {
  "id": "blood-cut",
  "name": "捨て身の斬撃",
  "themeId": "berserker",
  "rarity": "EPIC",
  "detail": "最大HPの10%を消費し、隣接敵へ2.5倍攻撃。HP1は残る。"
 },
 {
  "id": "sweep",
  "name": "円環の斬撃",
  "themeId": "berserker",
  "rarity": "EPIC",
  "detail": "隣接する全敵へ通常の120%で攻撃。"
 },
 {
  "id": "life-burn",
  "name": "奥義・命燃やし",
  "themeId": "berserker",
  "rarity": "LEGENDARY",
  "detail": "現在HPの半分を消費し、隣接敵へ4倍攻撃。この打撃の吸命率＋50%。HP1は残る。"
 },
 {
  "id": "small-prayer",
  "name": "小さな祈り",
  "themeId": "guardian",
  "rarity": "NORMAL",
  "detail": "最大HPの20%を回復。"
 },
 {
  "id": "shield-stance",
  "name": "盾の構え",
  "themeId": "guardian",
  "rarity": "NORMAL",
  "detail": "次の被ダメージ1回を70%軽減。"
 },
 {
  "id": "shield-bash",
  "name": "盾打ち",
  "themeId": "guardian",
  "rarity": "NORMAL",
  "detail": "隣接敵へ通常攻撃し、その敵の次の攻撃ダメージを半減。"
 },
 {
  "id": "mend",
  "name": "再生の祈り",
  "themeId": "guardian",
  "rarity": "EPIC",
  "detail": "最大HPの40%を回復。"
 },
 {
  "id": "guard",
  "name": "骨の守り",
  "themeId": "guardian",
  "rarity": "EPIC",
  "detail": "次の3回の被ダメージを半減。"
 },
 {
  "id": "fortress",
  "name": "不落の祈り",
  "themeId": "guardian",
  "rarity": "LEGENDARY",
  "detail": "最大HPの30%を回復し、次の2回の被ダメージを無効化。"
 },
 {
  "id": "coin-strike",
  "name": "丁か半か",
  "themeId": "gambler",
  "rarity": "NORMAL",
  "detail": "隣接敵へ50%で2倍、50%で0.5倍の攻撃。"
 },
 {
  "id": "gamble-heal",
  "name": "賭けの手当",
  "themeId": "gambler",
  "rarity": "NORMAL",
  "detail": "50%で最大HPの30%を回復、50%で最大HPの5%を失う。HP1は残る。"
 },
 {
  "id": "fortune",
  "name": "運試し",
  "themeId": "gambler",
  "rarity": "NORMAL",
  "detail": "記憶の欠片3を消費。50%で記憶の欠片8を得る。失敗すると追加獲得なし。"
 },
 {
  "id": "life-bet",
  "name": "命の大勝負",
  "themeId": "gambler",
  "rarity": "EPIC",
  "detail": "最大HPの10%を消費し、隣接敵へ50%で4倍、50%で通常攻撃。HP1は残る。"
 },
 {
  "id": "treasure-bet",
  "name": "宝探しの賭け",
  "themeId": "gambler",
  "rarity": "EPIC",
  "detail": "発見済みの床の記憶の欠片へ向かい、50%で取得量3倍、50%で消失。"
 },
 {
  "id": "all-in",
  "name": "奥義・一世一代",
  "themeId": "gambler",
  "rarity": "LEGENDARY",
  "detail": "隣接敵へ50%で6倍攻撃。失敗すると攻撃せず、次の被ダメージ1回を無効化。"
 }
];
export const themedSkillById=Object.fromEntries(themedSkills.map(s=>[s.id,s]));
export const retiredAugments={haste:"trailblazer",rush:"critical",thorns:"desperate",nova:"blood-pact"};
