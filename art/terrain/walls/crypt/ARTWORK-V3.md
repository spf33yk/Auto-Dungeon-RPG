# 壁マテリアルv3 制作記録（2026-10-29）

制作：組み込みimagegen。新規生成原稿を64×32の2面原稿surfaces-32.pngへ整形。左は壁上面、右は正面。64pxタイルではなく32pxの2セルである。高解像度版はart/local-originals/wall-material-source-v3.pngにローカル保管しGit対象外。

前版の大石模様は床と近く、独立入口の石飾りだけ光源・高さが異なっていた。壁は暗く密な矩形石積み、正面は少し明るい横積みとし、床と形・明暗を区別する。入口は同じ正面素材の控えめな継ぎだけを同じ32×56投影へ重ねる。

## 生成プロンプト

Use case: stylized-concept. ONE compact production pixel-art MATERIAL SOURCE SHEET for an original dark crypt dungeon game. Two equal square panels SIDE BY SIDE, no gap, no labels, no lettering, no UI, no props. Entire image 2:1 ratio, logical64x32 pixels enlarged nearest-neighbor. LEFT panel is seamless TOP SURFACE of a thick stone wall and solid buried wall mass: flat dark charcoal slate, small horizontally rectangular densely fitted cut stones, almost no rounded boulders, NOT cobblestone floor, no random big cracked floor slabs. RIGHT panel is seamless FRONT FACE of the same wall: clearly readable horizontal courses of substantial rectangular ashlar blocks, deep thin horizontal mortar joints, slightly warmer desaturated stone grey, chipped edges but coherent masonry. The front face should be visibly lighter than the cap so a projected wall stands vertically and separates clearly from a mossy crypt floor. Restrained palette of graphite, neutral slate grey, warm grey edge highlights, no green dominance. Crisp hand-placed pixels with original 8bit/16bit dungeon charm, low-resolution readable forms, no dithering noise, no gradients, no photographic detail. Upper-left light, consistent material scale in both panels. Both panels cover their entire square edge-to-edge without frame, border, background, bevel, shadow, vignette, padding, perspective or protrusion. The game will create 16 autotile masks and corridor mouths from these shared material panels; do not draw a map or isolated blocks. No checkerboard, no black empty area. Asset sheet only.

## 配信工程

material.jsonの共通投影・明暗倍率で16壁＋4入口を作成。原稿の余白を避け、端4pxをなじませて接続辺を共通化。壁上面32px・正面24px・左上光源を固定する。15は全域不透明。入口の材質・アトラス・高さ・暗色処理を壁と共有し、旧入口の32×32引き伸ばしを除外した。

配信PNG：128×280、4269 bytes。編集用32px原稿：64×32、2931 bytes。現在の専用原稿は地下墓所のみ。他エリアの専用材質方針と追加手順は../FORMAT.md。
