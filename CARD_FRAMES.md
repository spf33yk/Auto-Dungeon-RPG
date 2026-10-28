# カードの専用フレーム差し替え

現在はCSSの仮枠を使用。カード画像を変更しても、ドラッグ・タップ配置・条件値・取得制限・指示優先順位は変更しない。

カード一覧と配置カードに共通のdata-card-kindを付けている。値はtarget／condition／action／skill。screens.cssの共通変数で切り替える。

```css
[data-card-kind="condition"] {
  --card-frame-border-source: url('./art/cards/condition-frame.png');
  --card-frame-slice: 8;
}
```

上記は将来の使用例で、画像はまだ作成していない。32px基準で作成する。フレームの四隅を保つ場合はborder-imageの9分割を使う。カードの背景まで含めて伸縮する画像には--card-frame-imageを指定できる（100%×100%表示）。仮枠の線色は--card-frame-line、角丸は--card-frame-radius。透明余白・文字の可読性・ドラッグ中の選択枠も差し替え時に確認する。

カードラベルと条件値はHTMLのまま残す。フレーム画像に文言を焼き込まない。追加画像はscripts/update-assets.jsの配信URL更新対象にも登録し、SPEC.mdとART_ASSETS.mdへ寸法・容量・変更点を記録する。
