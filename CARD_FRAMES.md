# カードの専用フレーム差し替え

現在は標準テーマの連結カード素材と土台を使用。詳細はdocs/ui/PREPARATION_UI.md。ドラッグ・タップ配置・条件値・取得制限・指示優先順位を維持する。

カード一覧と配置カードに共通のdata-card-kindを付けている。値はtarget／condition／action／skill。screens.cssの共通変数で切り替える。

```css
[data-card-kind="condition"] {
  --card-frame-border-source: url('./art/cards/condition-frame.png');
  --card-frame-slice: 8;
}
```

上記のart/cardsパスは将来の差し替え例。現行の配信用素材はart/ui/preparation/へ配置し、PNGの内容ハッシュ付きURLをindex.htmlのpreparation-assetsスタイルに登録する。カードは260×76論理pxに固定し、長い列は縮小せず横スクロールする。土台は左右の端と反復する中央に分ける。透明余白・文字の可読性・配置可能な溝の強調も確認する。

カードの内容と条件値はHTMLのまま残す。今回の標準素材はカテゴリ見出し・アイコンをそのまま使い、動的な内容を画像に焼き込まない。将来の文字なし枠への完全分離は別工程。追加画像はscripts/update-assets.jsの配信URL更新対象にも登録し、SPEC.mdとART_ASSETS.mdへ寸法・容量・変更点を記録する。

## 制作サンプルと本番導入案（2026-10-29）
確認用のカード原稿はcard-frame/v1、土台はcard-tray/v3まで制作済み。ただし画像にはカテゴリ名が焼き込まれており、現在のHTMLラベル・条件値と重ねる本番用の文字なし枠への分離は未実施。準備画面へ適用する際の課題・UI案はdocs/ui/PREPARATION_CARD_UI_PROPOSAL.mdを参照。装飾の画像領域とクリック／タップ領域を分け、ドラッグ・タップ・条件編集・探索中編集禁止を維持する。
