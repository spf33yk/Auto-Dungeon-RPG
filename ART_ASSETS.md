# 本編素材と制作規格

更新日：2026-11-04。現行の読込先はindex.htmlのdata属性と各定義JSONを根拠にする。[過去の相談・試作履歴](docs/history/2026-11-04/ART_ASSETS.md)は本編採用一覧ではない。

## 本編の採用素材

| 用途 | 採用先・規格 |
|---|---|
| 主人公 | art/characters/mukuro-minimal64-v1/sprites.json・sprites.png。身体64px、動作余白込み128pxセル、3列4行、原点[64,96]。屈伸・踏み込み・斬撃 |
| 床 | art/terrain/floors-v2/atlas-64.png。1マス64px、256×256の4列4行。対向辺がつながる反復素材 |
| 壁・入口 | art/terrain/walls/crypt/tileset.json・autotile-64.png。wall-autotile/v2、64×112セル、rise0.75、16接続＋統合入口 |
| 敵とHP表示 | art/enemies/v2/atlas-64.png、enemy-view.js。64px、名称・HPバー・足元基準 |
| 宝箱・階段・装備等 | art/props/atlas-64.pngとmap-items-64.png。回復はハート、小物は対応セルを参照 |
| スキル箱 | art/props/chest-skill-64.png。赤い宝箱。LEGENDARYはchest-view.jsの金色エフェクトを重ねる |
| カード・土台 | art/ui/preparation/。ターゲット・条件・アクション・スキルと連結土台。layout.jsonとFORMAT.md、4スキン |
| 準備背景・外枠 | art/ui/preparation-decor-v1/。背景1440×810、透過枠512×512。角固定・辺repeat、合計約163KiB |
| オーグメント | art/ui/augments-v1/。19種の透過WebP192×240と共通透過PNG枠384×576、合計約727KiB |
| タイトル・映像 | index.htmlのtitle-background／title-logo／title-fx／teaser-videoに登録した骸・倅版の画像と動画。背景と動画は1920×1080基準 |
| 通常エンド | normal-end-son-strike-v6を使用する終了演出。normal-ending.jsとindex.htmlの登録を参照 |
| 音 | art/BGM/の配信登録済み楽曲とscene-music.js。効果音はWeb Audio。未登録のローカル音源を採用済みと扱わない |

## 制作ルール

1マス64pxを共通基準にする。身体寸法・動作用保存セル・ワールド寸法・表示倍率は別。現在の主人公は128pxセルでも1マス128pxではない。画面Canvas1920×1080とUI設計1280×720も区別する。

画像は等倍率で拡縮し、縦横比を変えない。長い装飾枠は角・端を固定し辺を繰り返す。ピクセル素材は補間なし。見た目の立体感を当たり判定の変更と混同しない。

新しい素材は一つずつ確認して採用する。原画・比較GIF・生成動画と、軽量な配信用ファイルを分ける。大きい原画や確認用出力をそのままGitHubへ追加しない。素材差し替え時は形式・寸法・alpha・接続・内容ハッシュ・画面を確認する。

## 中止・互換・未決定

2026-11-01の旧試作削除と、2026-11-03の足踏み中止を維持。削除済み試作・旧生成プロンプト・旧保管原本を新規作画へ流用しない。詳細は[中止と今後の扱い](docs/characters/ANIMATION_BACKLOG.md)。art/characters/mukuro-v1/などの旧読込対応は保持されても、現在の主人公には使用していない。

旧32pxのwall-material制作用テンプレート・旧character-4dir/v1・entrance-parts/v1は互換資料。新規制作の採用解像度や本編の読込先と混同しない。壁生成器の64px入力工程は、将来の素材制作時に実装対応を確認する。

追加の主人公モーション・敵や倅の全動作・正式な追加スキン・ボイスは後続課題。実装前の制作サンプルを採用済みにしない。
