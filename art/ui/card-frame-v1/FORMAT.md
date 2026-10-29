# card-frame/v1：連結カード素材フォーマット

2026-10-29。素材制作用。ゲームUIへの組み込み・スキン選択設定は未実装。

## ファイル構成

- `format.json`：キャンバス、共通の四隅、パターン、カード種別と画像部品の対応。
- `parts/*-base.png`：四隅の♦を含まない枠。名称・カテゴリのアイコン・接続部の♦は残す。
- `parts/corner-diamond.png`：全カード・全四隅で共有する唯一の♦部品（保管80×80px、表示40×40px）。
- `PROMPTS.md`：内蔵image_genで制作した部品の編集条件。
- `scripts/build-card-frames.js`：画像を埋め込んだ単体SVGを生成。SharpがあればPNGも出力。

## 寸法と配置

出力は1085×363px、外側透過、内容欄は暗色。これはUI部品の制作寸法で、フィールド素材の32pxルールとは分ける。

四隅の中心は左上(140,104)、右上(950,104)、左下(140,280)、右下(950,280)。すべて同じ画像を同じ40×40pxで描く。個別のサイズ・位置補正は持たせない。これによりターゲット左上だけ高くなる問題を防ぐ。

`sourceBody` は生成原稿のレール四隅 `[left,top,right,bottom]`。各原稿は共通body矩形へ、元の縦横比を保つ1つの倍率で収める。X/Y別の倍率で矩形いっぱいに変形しない。寸法が合わない部分は余白を残す。出力側の♦の位置は共通のまま。生成原稿を交換するときは新画像の寸法を `sourceSize`、レール位置を `sourceBody` に登録する。元の原稿はサンプルフォルダ内へ保管し、ゲームへ配信しない。

ターゲット＝青／先頭、条件＝黄／中間、スキル＝紫／末尾、アクション＝赤／末尾。名称はそれぞれ「ターゲットカード」「条件カード」「スキルカード」「アクションカード」に統一。カード名上中央の♦は付けない。既存の接続部・端部の♦は今回の四隅表示切替の対象外。

## パターンの追加

`patterns.ornate.corners=true` は♦あり、`patterns.plain.corners=false` は四隅の♦だけなし。両方を別フォルダに同時出力し、元の枠部品は上書きしない。

同じ形の表示パターンは `patterns` にIDと `corners` を追加する。例：`"minimal": {"corners": false}`。材質・スキンを変える場合はフォーマット一式を新しいフォルダへ複製し、`cards.*.base` と `corner.asset` を差し替える。共通bodyとcorner寸法を維持すれば配置が再現される。四隅ごとに別の♦を生成しない。

```powershell
node scripts/build-card-frames.js
# 別フォーマット／別の出力先
node scripts/build-card-frames.js art/ui/card-frame-v1/format.json art/samples/my-cards
# Sharpを利用できる環境ではPNGも生成
node scripts/build-card-frames.js --png
```

標準出力先は `art/samples/card-format-v3/`。`ornate/` と `plain/` に各4種類を書き出す。SVGはNode標準機能のみ。PNGはSharpが必要で、通常の `sharp` パッケージ、または環境変数 `CARD_FRAME_SHARP_MODULE` で指定したSharpの入口を使用する。自動で外部通信・依存のインストールはしない。

## 制作範囲と既存データ

今回は枠の比較・再生成まで。ゲーム内の指示、装備、能力、保存形式、セーブ移行は変更しない。土台の追加加工や実際の連結操作、可変長の本番切り出し、別スキンの完成素材化は別工程。比較用原稿と大量の生成SVG/PNGはGit管理から除外し、部品と定義・スクリプトを小さく保持する。
