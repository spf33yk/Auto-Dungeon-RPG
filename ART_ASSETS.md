# 本編素材と制作規格

更新日：2026-11-08。現行の読込先はindex.htmlのdata属性と各定義JSONを根拠にする。

## 本編の採用素材

| 用途 | 採用先・規格 |
|---|---|
| 主人公 | art/characters/mukuro-march64-v1/sprites.json・sprites.png。身体64px基準、128pxセル、4列4行512×512、原点[64,96]。800ms足踏み・踏み込み・斬撃。r12採用。原画16枚・承認ハッシュ・監査記録を同フォルダーへ保存 |
| 床 | art/terrain/floors-v2/atlas-64.png。1マス64px、256×256の4列4行。対向辺がつながる反復素材 |
| 壁・入口 | art/terrain/walls/crypt/tileset.json・autotile-64.png。wall-autotile/v2、64×112セル、rise0.75、16接続＋統合入口 |
| 敵とHP表示 | art/enemies/v2/atlas-64.png、enemy-view.js。64px、名称・HPバー・足元基準。enemy-attack-animation.jsで攻撃時の平行移動と接触マークを描画 |
| 宝箱・階段・装備等 | art/props/readable-v1/atlas-64.png。64px・4列3行。11種の小物を共通配置、旧アトラスはロード失敗時の互換 |
| 罠 | art/props/traps-v1/atlas-64.png。64px・6種×発動可能／破損の12セル。format.jsonで配置を定義 |
| スキル箱 | readable-v1のchest-redセル。赤い宝箱。LEGENDARYはchest-view.jsの金色エフェクトを重ねる |
| カード・土台 | art/ui/preparation/。ターゲット・条件・アクション・スキルと連結土台。layout.jsonとFORMAT.md、4スキン |
| 準備背景・外枠 | art/ui/preparation-decor-v1/。背景1440×810、透過枠512×512。角固定・辺repeat、合計約163KiB |
| オーグメント | augment-art.js登録の30種の専用透過WebPと5テーマアイコン。共通枠はart/ui/augments-v1/。縦横比を維持 |
| タイトル・映像 | index.htmlのtitle-background／title-logo／title-fx／teaser-videoに登録した骸・倅版の画像と動画。背景と動画は1920×1080基準 |
| 通常エンド | normal-end-son-strike-v6を使用する終了演出。normal-ending.jsとindex.htmlの登録を参照 |
| 音 | art/BGM/の配信登録済み楽曲とscene-music.js。効果音はWeb Audio。未登録のローカル音源を採用済みと扱わない |

## 制作ルール

1マス64pxを共通基準にする。身体寸法・動作用保存セル・ワールド寸法・表示倍率は別。現在の主人公は128pxセルでも1マス128pxではない。画面Canvas1920×1080とUI設計1280×720も区別する。

画像は等倍率で拡縮し、縦横比を変えない。長い装飾枠は角・端を固定し辺を繰り返す。ピクセル素材は補間なし。見た目の立体感を当たり判定の変更と混同しない。

新しい素材は一つずつ確認して採用する。原画・比較GIF・生成動画と、軽量な配信用ファイルを分ける。大きい原画や確認用出力をそのままGitHubへ追加しない。素材差し替え時は形式・寸法・alpha・接続・内容ハッシュ・画面を確認する。

## 互換と今後の制作

旧形式のローダー・保存互換用素材は維持するが、本編の採用先は上表のみ。新規制作は64px基準。中止済み画像・旧生成プロンプト・旧保管原本を制作入力に流用しない。現在の主人公は承認済みmukuro-march64-v1を基準にする。

追加の攻撃・被弾・崩壊死亡、敵や倅の全動作、追加スキン・ボイスは未完成部分を残す。試作を本編採用済みと扱わない。

## 罠の64px素材

art/props/traps-v1/atlas-64.pngを採用。map-traps/v1、64pxセル、横2状態（発動可能／破損）×縦6種（棘・転移・拘束・衰弱・警報・霧）。原画を等倍率縮小・共通48色・二値アルファへ仕上げたもの。詳細と生成元は同フォルダのARTWORK.md、配置情報はformat.json。原画や大容量中間ファイルはGitへ含めない。

## 視認性を整理したマップ小物

回復ポーション・記憶の欠片・武器・防具はhost_imageで新規生成し64pxへピクセル仕上げ。回復ポーションと階段は今回描き直し、階段の横向きの上り方向を維持して段差・側面の陰影を強調。現行の宝箱・赤箱・墓石・ひび割れ墓石・旧報酬は縦横比を保って拡縮し再配置。art/props/readable-v1/format.jsonにセル・別名・足元・色数を定義。原画はローカルoutput/object-icons-20261108-r1/、軽量なアトラス・プロンプト・SHA256のみGitへ保持。床・壁、主人公・敵、罠6種の採用素材は変更しない。

霧はfog-effect.jsによる手続き描画で追加画像なし。敵の2px待機はenemies/v2の既存64pxセルを上半身／固定足元へ分けて等倍率描画する。原画と配信アトラスは変更せず、比較GIFはローカルoutputだけに保持する。
