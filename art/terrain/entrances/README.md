# 通路入口の専用素材

現行は[entrance-parts/v1](FORMAT.md)で管理する。tileset.jsonの部品名・矩形・適用エリアを読み込み、固定の2×2配置へ依存しない。テンプレート・スキーマ・検証コマンドはFORMAT.mdを参照。

atlas-32.png：64×64px、32×32pxの4セル、1907 bytes、32色以下・二値アルファ。左上＝左柱、右上＝右柱、左下＝梁、右下＝低い角の縁。64px化ではなく、32pxセルを2×2に並べたもの。大きい生成原案はGit対象外のart/local-originals/entrance-source.pngへ保管。以降は32px画像を直接編集する。

entrance-view.jsは地形から1マス通路が広い床へ開く位置を調べ、隣接する壁マスへ部品を重ねる。縦入口は左右柱、横入口は上の梁と下の低い縁。歩行床へ配置しない。墓石を床へ戻した描画用surfaceで判定するため墓石を入口と誤認しにくい。壁本体と同じ前景の低い矩形・視界外の暗色を適用する。地形変更時だけ入口一覧を作り、毎フレーム再走査しない。旧セーブの地形にも適用。

## 内蔵image_genの最終プロンプト

Use case: stylized-concept. A transparent sprite atlas for an original Japanese pixel dungeon RPG. EXACTLY TWO columns and TWO rows, FOUR equally sized square cells, no text, no grid drawn. Each object is a native 32x32-pixel sprite shown enlarged with crisp square pixels, restrained 16 color grey/olive charcoal stone palette. These are NEW dedicated corridor entrance stone masonry trim pieces, to overlay existing square-grid raised wall shoulders without occupying the passage floor. Slight overhead front view, visible small beveled cap and darker front edge, chunky chipped ashlar crypt stone. TOP LEFT: left door jamb / upright stone entrance pillar with a small square coping block, lit from upper left. TOP RIGHT: matching right door jamb but separately drawn, darker outer side. BOTTOM LEFT: short horizontal overhead entrance lintel, broad chipped stone coping beam, visible short front edge, no side pillars. BOTTOM RIGHT: low corner threshold coping/entrance shoulder, squat stepped stone corner, no stairs. Every cell has generous 2 logical pixels transparent border, fully isolated object, no floor/background or dark rectangle, no closed door, no arch spanning other cells. Functional readable game sprite assets. No smooth painting, gradients, glow, antialiasing, characters, skulls, letters, ornate decorations. Consistent subdued crypt masonry. Keep forms extremely coarse and readable when reduced to native 32px.
