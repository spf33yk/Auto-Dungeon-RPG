# 通路入口素材：entrance-parts/v1

32px基準の専用画像とJSON定義を分け、入口検出・壁の高さ・ゲームの当たり判定とは独立して差し替える。現在の素材もこの定義で読み込む。

## 構成

各セットはPNGとtileset.json。開始用はentrance-parts-v1.template.json、編集支援用はentrance-parts-v1.schema.json。画像は透明背景・二値アルファ・32pxセル。64px原本は作成しない。現在のアトラス64×64pxは32pxセル2×2の集合。

| 部品名 | 用途 | 現在の矩形 `[x,y,w,h]` |
|---|---|---|
| leftJamb | 縦入口の左側の壁 | [0,0,32,32] |
| rightJamb | 縦入口の右側の壁 | [32,0,32,32] |
| lintel | 横入口の上側の壁 | [0,32,32,32] |
| threshold | 横入口の下側の低い縁 | [32,32,32,32] |

formatはentrance-parts、versionは1。idは固有名、themesはzone IDの配列（*は共通既定）、imageはJSONからの相対PNG URL、tileSizeは32、width／heightはPNG実寸。partsの各値は矩形の配列。アトラスの列数・行数・部品位置は自由で、64×64や2×2に固定されない。各矩形の幅・高さは32px。

同じ部品へ複数矩形を登録すると、seedと配置セル座標からバリアントを選ぶ。ゲーム乱数は消費しない。画像寸法・フレーム範囲・必須4部品・版を起動時に検証する。必須部品は変更せず、新しい配置規則や互換性を壊す変更が必要な場合は版を上げる。

## 追加・変更手順

1. art/terrain/entrances/新エリア/へPNGとテンプレートを複製し、tileset.jsonへ改名する。
2. id・themes・image・寸法・partsを編集。PNGは32pxで直接制作し、透明なセル余白を確保する。
3. `node scripts/build-entrance-tileset.js art/terrain/entrances/新エリア` を実行。PNG実寸を検証し、JSONの画像URLへ内容ハッシュを付ける。拡縮・画像生成・外部ライブラリは使わない。
4. index.htmlのcanvasのdata-entrancesへJSON URLを空白区切りで追加。共通セットを先に、エリア専用セットを後に置く。同じthemeは後勝ち、具体的なthemeは*より優先。描画コードの変更は不要。
5. `node scripts/update-assets.js` と `node scripts/update-assets.js --check`、入口関連テストを実行し、各資料と同じコミットへ含める。

imageはJSON内、JSONはindex内の内容ハッシュで更新を管理する。画像だけ変更してビルドを忘れた場合は配信URLチェックがエラーになる。

## 描画との境界

入口の検出結果0〜3は上表の部品名へ変換する内部値で、画像配置の番号ではない。前景の低い壁を含め、既存wallDrawBoxの描画先矩形へ部品を重ねる。歩行床へ置かず、視界外では同じ定義を持つ暗色アトラスを使う。読込失敗時はコンソールにエラーを出し、入口装飾を省略して通常の壁を表示する。保存形式v12・移動・視界への影響なし。
