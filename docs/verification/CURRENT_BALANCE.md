# 現行バランスの通し検証

2026-11-09。基準a693598に準備画面の開閉保存・条件／アクション階級変更・宝箱の混合階級抽選を反映した作業ツリーを検証。数値は仮採用。実測時のゲームモジュールSHA256はoutput/preparation-balance.jsonのruntimeHashesへ記録。

## 結果と範囲

テーマ重視（build）・敵待機活用（control）の2方針、同じ40シードで初回80試行。通常ENDは1件、死亡79件、2000ターン打切り0件。buildは0/40、controlは1/40。各階の最大実測ターン数はbuild198、control217。成功はcontrol・seed3980703、合計3212ターン・30階踏破。公称の探索時間は1倍約22.5分、4倍約5.6分。手動の選択や動画・準備時間を含まない。

この標本は遺書ルート追加前の初周を対象とし、TRUE ENDの達成率・所要時間は未測定。固定方針の限定標本で、人間一般や最適攻略の勝率ではない。序盤の難しさは残る。直行／回収方針の再測定と100シードへの拡張は未実施。

## 方法

`node scripts/verify-clearability.js 40 output/preparation-balance.json build,control`

本番newGame／beginExploration／tick／ascend／equipBest／upgrade／chooseAugment／selectChestCategory／chooseChestCardを使用。初期HP54・Lv1・記憶の欠片12・初期5カード・初期装備。未所持付与、HP変更、敵削除、乱数巻戻し、デバッグ強化なし。各階で指示とvalidateSaveを検査する。全件debugUsed=false。

シードは(1001＋104729×i) mod 10000000、i=0〜39。共通で所持スキル・行数と視界購入・装備変更を行い、テーマ重視は同テーマ報酬／配置、敵待機は取得済みの隣接条件と敵への待機を優先する。正確な点数と選択手順はスクリプトを参照。候補の独立階級抽選で乱数消費と取得構成が変わるため、以前の成功シードを現行の成功保証には使用しない。

成功profileだけseed+19で2周目へ引継いだ1件はseed3980722・control、B25で死亡、402ターン。TRUE本編の検証ではない。

計算時間約37.5秒。[CSV](current-balance.csv)と[集計JSON](current-balance-summary.json)を保持。詳細JSONはローカルのみ。
