# 骸・赤いマント アニメーション原画

組み込みimagegenで新規制作。既存のゲーム内素材・保管中の旧キャラクター画像は参照していない。元勇者であり、家族の記憶を失った父親の骸という設定に合わせ、骨・傷んだ深紅のマント・古い剣を描く。物語の結末や設定は変更しない。

高解像度の生成原画・修正案はart/local-originalsへローカル保管しGit対象外。配信は32pxセルの96×128PNGとsprites.jsonのみ。生成後に方向・歩行差分・32pxでの読みやすさを検査し、透明余白・共通足元・32色へ整形する。

## 初回生成プロンプト

Use case: stylized-concept. Create ONE original production pixel-art sprite sheet for a dark top-down 2D roguelike. A lonely SKELETON former hero with an aged torn DEEP RED CAPE, ivory bones, empty dark eye sockets, a small worn iron sword in right hand, no armor helmet, no glowing magic, no grin, melancholy dignity and weary determination. This father has forgotten his life and is trying to return to his son; visual storytelling only, no text. Do not copy or use existing character assets. Authentic coarse 32x32-pixel game sprite detail, bold readable silhouette, limited 16bit palette, crisp pixel edges, no soft rendering or anti-aliasing. True transparent background, no checkerboard, no shadows below feet. EXACT layout: THREE equal columns and FOUR equal rows, logical atlas96x128 pixels, each cell32x32, rendered enlarged with nearest-neighbor. NO labels, numbers, separators, UI, margins, extra sprites. ROW0 facing SOUTH/front: column0 left-foot-step idle/walk1, column1 right-foot-step walk2, column2 short sword attack. ROW1 facing WEST/left: same three states. ROW2 facing EAST/right: same three states. ROW3 facing NORTH/back: same three states; back of skull and red cape clearly visible, no face. All 12 are the SAME character and clothing proportions, each skull faces the specified direction. West and East must be visibly opposing profiles. Walk frames visibly alternate legs and cape hem, NOT twelve identical static poses. Attack frame raises or sweeps the short sword toward the facing direction, distinct from walking, no slash VFX. Character approximately22px tall with large readable skull, bone arms, separated legs, dark-red tattered cape behind torso. Keep the whole sprite including sword within each32px cell, with 2px transparent gutter on all four sides. Feet on a consistent row28 baseline in every cell; character centered x16. Shallow three-quarter overhead game view, consistent light upper-left. Atlas only, transparent outside sprites.

## 修正指示

歩行の2列目を逆の足運びにする。西向きの2列目が東を向いた修正案は採用せず、西向きへ戻す。32pxへ縮小したとき頭部が読みにくかったため、32pxで読める大きい頭蓋骨・黒い眼窩・太い骨・明瞭な赤マントへ調整する。4行3列・4方向・攻撃列・足元は維持する。

## 整形

scripts/build-character-sheet.jsで生成セルの透明領域を確認し、共通倍率・最近傍で32pxへ収める。描画範囲はx2〜29・y2〜28、足元アンカーは[16,29]。アルファは0／255。元画像の高解像度を配信しない。

## 歩行Bの足運び修正（2026-10-29）

初版はA/Bで同じ足が前に残り、歩行として不十分だった。全体シートの再生成だけでは直らなかったため、技術ポーズガイドを入力し、Bだけを4方向の横一列としてimagegenで新規生成した。採用原画はart/local-originals/mukuro-walk-b-corrected.pngへローカル保管。未採用の再生成案は配信しない。

既存のAと攻撃の画素は全8コマで維持し、Bだけを差し替えた。Bの高さと足元をAへ合わせ、頭の骨色の重心差を0.5px以内に揃える。既存32色パレットへ合わせ、マントの色がコマ間で変わらないようにした。配信PNGは4286 bytes。足元の骨画素の重心はA→Bで南+2.07、左+1.26、右-3.42、背面-1.35px移動し、同じ足のままの差分を回帰検出する。

### 採用した修正プロンプト

Create ONLY FOUR replacement WALK-B sprites in ONE HORIZONTAL ROW, four equal square cells, transparent background. Reference image1 supplies the exact identity: ivory skeleton, worn deep red cape, short grey sword, chunky native32px pixel art, same head and torso proportions. Reference image2 is the REQUIRED LEG POSE BLUEPRINT for each sprite. Follow the leg silhouettes and light/dark leg positions EXACTLY, not the existing right-foot-forward pose of reference1. Output cells left-to-right SOUTH, WEST, EAST, NORTH. Each logical32x32, feet baseline28, 2px transparent gutters, same skull/hip centered. SOUTH: bright leg on screen RIGHT is long and forward to x21,28; screen LEFT leg is bent and raised/back with foot x11,25. WEST/left-facing: LIGHTER NEAR LEG is BENT BACK TO SCREEN RIGHT, foot x22,27; DARKER FAR LEG extends FORWARD TO SCREEN LEFT, foot x7,28. EAST/right-facing: LIGHTER NEAR LEG is BENT BACK TO SCREEN LEFT, foot x10,27; DARKER FAR LEG extends FORWARD TO SCREEN RIGHT, foot x25,28. NORTH/back-facing: LONG bright leg is on screen LEFT with foot x10,28; screen RIGHT leg bent and raised/back with foot x21,25. These asymmetrical opposite-leg silhouettes are mandatory and must be obvious at32px; do not put the bright leg forward in both side views. Cape must leave the legs sufficiently visible to read the swapped step. Keep upper-body design from image1; same sword hand, face left in WEST and right in EAST, no eyes on back. No attack poses, no second row, no WALK-A poses, no text, guides, background, shadow or labels. The guide is a technical pose reference, not final art: output complete skeleton sprites with proper bone legs in exactly those poses. Transparent strip128x32 logical pixels enlarged nearest-neighbor.
