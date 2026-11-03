# オーグメントイラスト規格 augment-art/v1

imagegenの組込みツールで新規制作した19種のイラストと透過装飾枠。本編の選択・図鑑・準備で共用する。参考画像は構成の参考とし、実画像の画素は使用していない。

- イラスト：192×240pxの透過WebP（品質86、alpha保持）。透過編集した原本セルの縦横比を維持して収め、余る部分も透明にする。描画もobject-fit:contain。
- 枠：384×576pxの透過PNG。2:3の縦横比を維持して描画し、名前・効果・取得状況はHTML文字として重ねる。
- レアリティ：NORMALは銀、EPICは紫、LEGENDARYは金の装飾。元PNGを変形せずCSSの色調・光で区別する。動きはホバー時の小さい浮上のみ。
- format.json：原本1003×1568pxのセル境界・ID・出力寸法を定義。生成原本のセル高が一定でないため、確認した実際の境界を明記。index19の紋章は将来用の未使用セル。
- ワールドの1マス64pxとは別のUIイラスト規格。キャラクター・床・壁には流用しない。

原本は容量節約のためGit対象外のart/local-originals/augments-v1/atlas-source.png（旧背景付き原本）／atlas-transparent.png（透過編集原本）／frame-source.pngに保持。配信用画像とformat、再書出し手順をGitへ保存する。原本から再生成するときはPowerShellでscripts/build-augment-art.ps1を実行し、（透過PNGの中間書出し後、PillowでWebPへ圧縮。AUGMENT_PYTHONでPython実行ファイルを指定できる。）node scripts/update-assets.jsでaugment-art.jsの画像ハッシュとindex.htmlを更新する。原本がない環境でも配信用の完成画像で本編は動作する。制作プロンプトはPROMPTS.md。

追加時は新しい画像を同じ192×240の透過contain配置で用意し、format.iconsへIDを追加、augments.jsに効果を追加する。画像ハッシュを更新すると既存の共通UIへ反映される。生成画像への文字焼込みは行わない。フレームは同じ2:3なら差し替え可能。
