> 旧制作記録・互換資料です。現行は壁FORMAT.mdとcrypt/ARTWORK-V3.mdを参照してください。

# 岩壁オートタイルv2 制作記録（2026-10-29）

生成方法：組み込みimagegen。外部素材は使用しない。
生成原画：art/local-originals/wall-auto16-source-v2.png（ローカル保管、Git対象外）。
編集用32px原稿：painted-32.png。ゲームへ配信する画像：autotile-32.png。

## 生成プロンプト

Use case: stylized-concept. Create ONE production pixel art wall AUTOTILE ATLAS for an original dark crypt roguelike game. No characters, floor, objects, UI, words, labels, numerals, grid lines, margins, or watermarks. Image aspect 4:7, exactly a tightly packed FOUR columns by FOUR rows of equal rectangular tiles, each tile width32 height56 logical pixels, pixel-perfect low-resolution 32px art enlarged with nearest neighbor. Entire atlas logical size128x224. Muted charcoal grey stone, subtle cold olive undertones, chiseled irregular large rock blocks, clear hand-placed pixels, restrained highlights, very dark mortar, elegant cohesive classic dungeon pixel art. Each of the 16 tiles must be individually designed yet have perfectly matching edges wherever walls connect. Shallow 3/4 top-down view: upper 32px of each tile stone top surface, lower24px vertically layered stone facade where SOUTH edge exposed. The four-neighbor wall bit mask uses NORTH=1 EAST=2 SOUTH=4 WEST=8. Tiles row-major masks: row1 0,1,2,3; row2 4,5,6,7; row3 8,9,10,11; row4 12,13,14,15. Connected sides have uninterrupted rock texture without outlines. Exposed sides have thin beveled rims and shaded side faces. No floating isolated outlined cubes on connected sides. Consistent scale and pixel palette across all16. IMPORTANT bottom-right tile15 (all four sides connected) is a fully filled dark seamless rock texture rectangle across its full32x56, NO border, NO bevel, NO black or transparent holes, NO front face, NO isolated block: it represents the solid rock mass beyond dungeon rooms. All filled rock areas must merge naturally. Use opaque near-black backing in any empty exterior pixels, not checkerboard. Output the atlas only, no presentation mockup.

## 実装への整形

生成した原画を最近傍で128×224へ整形し、48色の32px原稿を保存。生成画像だけでは厳密な接続や余白を保証できないため、ビルド時に岩面（原稿15）と正面（原稿0）を共通素材として全16接続の形状を構成する。岩面の生成余白を避け、端4pxをなじませる。露出方向だけ縁を描き、接続辺を画素単位で共通化。15は全面岩で縁と正面を付けない。既存の旧壁パーツは使わない。

配信PNGは128×224、3726 bytes。32px原稿は27773 bytes。PNGの高解像度版は配信・GitHubへ追加しない。
