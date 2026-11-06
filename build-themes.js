export const buildThemes=[{"id": "explorer", "name": "探索家", "color": "#a9ba91", "detail": "探索と回収、帰還を有利にする。"}, {"id": "monk", "name": "修行僧", "color": "#cdbb88", "detail": "時間をかけて力を蓄える。"}, {"id": "berserker", "name": "狂戦士", "color": "#c89187", "detail": "HPを代償に攻め続ける。"}, {"id": "guardian", "name": "守護者", "color": "#9eb7cd", "detail": "HPを守り、安全に突破する。"}, {"id": "gambler", "name": "勝負師", "color": "#b7a1c9", "detail": "危険を引き受け、大きな利益を狙う。"}];
export const themeById=Object.fromEntries(buildThemes.map(t=>[t.id,t]));
export const themedAugments=[
 {
  "id": "map-reader",
  "name": "地図読み",
  "themeId": "explorer",
  "rarity": "NORMAL",
  "detail": "未踏の部屋に入ると5ターン、視界半径＋1。"
 },
 {
  "id": "scavenger",
  "name": "収集の心得",
  "themeId": "explorer",
  "rarity": "NORMAL",
  "detail": "床の記憶の欠片を拾うと、追加で記憶の欠片＋1。"
 },
 {
  "id": "swift-ascent",
  "name": "駆け上がる記憶",
  "themeId": "explorer",
  "rarity": "NORMAL",
  "detail": "150ターン未満でClearすると最大HPの15%を回復。"
 },
 {
  "id": "trailblazer",
  "name": "踏破の心得",
  "themeId": "explorer",
  "rarity": "EPIC",
  "detail": "未踏の部屋を発見するたび、この階のATK＋1。最大＋5。"
 },
 {
  "id": "treasure-sense",
  "name": "宝探しの勘",
  "themeId": "explorer",
  "rarity": "EPIC",
  "detail": "カード宝箱の候補数が最大3枚から最大4枚になる。"
 },
 {
  "id": "pioneer",
  "name": "未知を拓く者",
  "themeId": "explorer",
  "rarity": "LEGENDARY",
  "detail": "この階の全室を発見すると、最大HPの20%を回復・記憶の欠片＋8・この階のATK＋5。各階1回。"
 },
 {
  "id": "ripen",
  "name": "熟成の刃",
  "themeId": "monk",
  "rarity": "NORMAL",
  "detail": "この階の40ターンごとにATK＋1。最大＋5。"
 },
 {
  "id": "patience",
  "name": "熟成の鎧",
  "themeId": "monk",
  "rarity": "NORMAL",
  "detail": "この階の60ターンごとにDEF＋1。最大＋3。"
 },
 {
  "id": "breath",
  "name": "調息の心得",
  "themeId": "monk",
  "rarity": "NORMAL",
  "detail": "被弾せず20ターン過ごすごとに最大HPの3%を回復。各階5回まで。"
 },
 {
  "id": "pilgrim",
  "name": "積年の刃",
  "themeId": "monk",
  "rarity": "EPIC",
  "detail": "累計200ターンごとにATK＋1。最大＋15。"
 },
 {
  "id": "charge",
  "name": "静寂の一閃",
  "themeId": "monk",
  "rarity": "EPIC",
  "detail": "被弾せず10ターン過ごすと、次の打撃が2倍。攻撃時に蓄積を消費。"
 },
 {
  "id": "enlightenment",
  "name": "悟りの境地",
  "themeId": "monk",
  "rarity": "LEGENDARY",
  "detail": "この階の100ターンごとに悟り＋1、最大3。攻撃・回復スキル使用時に消費し、効果量を1段階につき25%増加。"
 },
 {
  "id": "desperate",
  "name": "背水の刃",
  "themeId": "berserker",
  "rarity": "NORMAL",
  "detail": "失ったHP10%ごとにATK＋1。最大＋9。"
 },
 {
  "id": "leech",
  "name": "吸命の記憶",
  "themeId": "berserker",
  "rarity": "NORMAL",
  "detail": "実際に与えたダメージの3%を回復。"
 },
 {
  "id": "surrounded",
  "name": "包囲の闘志",
  "themeId": "berserker",
  "rarity": "NORMAL",
  "detail": "視界内の敵1体につきATK＋1。最大＋5。"
 },
 {
  "id": "blood",
  "name": "渇いた骨",
  "themeId": "berserker",
  "rarity": "EPIC",
  "detail": "失ったHPの割合×20%の吸命率を得る。"
 },
 {
  "id": "hunter",
  "name": "連戦の昂り",
  "themeId": "berserker",
  "rarity": "EPIC",
  "detail": "この階の通常敵撃破1体につき会心率＋4%。最大＋40%。増援は対象外。"
 },
 {
  "id": "blood-pact",
  "name": "血戦の誓い",
  "themeId": "berserker",
  "rarity": "LEGENDARY",
  "detail": "HP30%以下の間、与ダメージ1.5倍・吸命率＋15%。被ダメージも20%増加。"
 },
 {
  "id": "shell",
  "name": "満月の守り",
  "themeId": "guardian",
  "rarity": "NORMAL",
  "detail": "HP80%以上の間、DEF＋3。"
 },
 {
  "id": "first-shield",
  "name": "骨の盾",
  "themeId": "guardian",
  "rarity": "NORMAL",
  "detail": "各階1回、被ダメージを50%軽減。より強い防御がある間は温存。"
 },
 {
  "id": "restful",
  "name": "休息の心得",
  "themeId": "guardian",
  "rarity": "NORMAL",
  "detail": "次階への休息回復に最大HPの5%を追加。"
 },
 {
  "id": "moon",
  "name": "満月の初太刀",
  "themeId": "guardian",
  "rarity": "EPIC",
  "detail": "各階最初の打撃時、HP満タンなら必ず会心。"
 },
 {
  "id": "reserve",
  "name": "守りの余力",
  "themeId": "guardian",
  "rarity": "EPIC",
  "detail": "一撃で最大HPの20%以上を失うと、次の2回の被ダメージを30%軽減。各階1回。"
 },
 {
  "id": "undying",
  "name": "骨の執念",
  "themeId": "guardian",
  "rarity": "LEGENDARY",
  "detail": "各階1回、致命傷をHP1で耐え、続く被ダメージ1回を無効化。"
 },
 {
  "id": "critical",
  "name": "会心の記憶",
  "themeId": "gambler",
  "rarity": "NORMAL",
  "detail": "会心率＋10%。会心ダメージは通常の1.5倍。"
 },
 {
  "id": "risky-blade",
  "name": "危うい刃",
  "themeId": "gambler",
  "rarity": "NORMAL",
  "detail": "打撃ごとに50%で与ダメージ1.3倍、50%で0.8倍。"
 },
 {
  "id": "lucky-find",
  "name": "拾い物の運",
  "themeId": "gambler",
  "rarity": "NORMAL",
  "detail": "床の記憶の欠片を拾うと、25%で追加の記憶の欠片＋4。"
 },
 {
  "id": "double-strike",
  "name": "追撃の記憶",
  "themeId": "gambler",
  "rarity": "EPIC",
  "detail": "通常攻撃の後、15%で追加の1打。追加攻撃から再発動しない。"
 },
 {
  "id": "pity",
  "name": "幸運の揺り戻し",
  "themeId": "gambler",
  "rarity": "EPIC",
  "detail": "会心でない打撃ごとに会心率＋5%。最大＋30%、会心でリセット。"
 },
 {
  "id": "destiny",
  "name": "運命の賽",
  "themeId": "gambler",
  "rarity": "LEGENDARY",
  "detail": "各階最初のカード宝箱で賭ける。50%で2枚取得、50%でカードの代わりに記憶の欠片＋10。"
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
