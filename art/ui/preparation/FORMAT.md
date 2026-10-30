# preparation-skin/v1

形状の基準はlayout.json、標準画像はこのフォルダ直下の7点。カード515×130px、土台左128×128・中央768×128・右64×128px。スキンで座標・縦横比・透過形状・本文位置・接続位置を変えない。土台の中央だけ反復し、カードは等倍率で表示する。

preparation-skins.jsがID・表示名・画面色を定義する。古金classicは直下の画像、黒鉄black-iron・骨白bone-parchment・黒曜石obsidian-runesは同名サブフォルダに同じ7ファイルを置く。scripts/build-preparation-skins.jsは標準画像の暖色の金属だけを色変換する。カテゴリのバッジ領域と透過形状を維持。本文パネルは暗色を保ち、白文字の見出しを読めるようにする。骨白も明るい紙面へ反転する方式ではない。

追加時はPREPARATION_SKINSへ登録して同寸法の7画像を用意し、update-assets.jsを実行する。配信URLは内容ハッシュ付き。スキンIDはabyss-ui-settings.preparationSkinへ保存し、不正値・古い設定はclassic。ゲームセーブv13とは別管理。既存のコンセプト画像は原稿として保管し、今回のスキンは形状を固定した配信用カラーバリエーション。
