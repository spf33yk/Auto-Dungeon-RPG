# 骸・提供正面シート（本編使用）

## 2026-11-01 64px版と方向別静止画（現行）

本編は提供シートから作った `sprites-64.png`（320×256、64pxセル）を直接読み込む。原本の立ち姿は最終可視行y=59、アンカー[32,60]。待機3コマ目の頭部中心だけ約3px左へ寄っていたため、そのコマを右に3px移動した。再生順・時間は`sprites.json`で定義する。

ユーザー指摘の左腕欠落に対し、画像編集結果`generated-left-arm-edit.png`から左腕の画素だけを抽出し、待機4コマと各攻撃列の構え・戻り4コマ（計8コマ）へ合成した。`build-arm-fix.py`が処理を記録し、`sprites-64-before-arm.png`は修正前の比較用、`arm-before-after-8x.png`は1コマの拡大比較。剣を振る途中の4コマと崩れ5コマには腕の追加を行っていない。元画像の構図と攻撃軌跡を保つためで、方向別の連続攻撃は引き続き未制作。

追加の指摘を受け、肩から手までの接続が明瞭な`generated-left-arm-edit-v2.png`を生成した。`arm-v2-candidate-64.png`へ等倍率縮小後、`build-arm-fix.py`で腕の領域だけを修正前シートから再合成し、同じ8コマへ適用した。最新比較は`arm-before-after-v2-8x.png`。前段落のv1編集結果は履歴であり、現在の配信PNGにはv2の腕を使う。

提供シートには正面しかないため、同じキャラクターを参照して`host_image_gen`で左・右・背面の静止画を新規生成し、`directions-64.png`へ各64pxセルに揃えた。足元は全方向y=59。移動と待機は向きに応じて表示する。左右・背面の攻撃と崩れの連続コマは未制作で、攻撃中はその向きの静止画、死亡時は正面の崩れを表示する。`generated-turnaround.png`が生成原画で、`build-directions.py`が色抜き・等倍率縮小を再現する。モデル名・費用はツールから返されていない。

下記の32px版は前段階の試作記録。現在の配信対象は64px版であり、ゲームの世界座標はまだ1マス24論理pxのまま。64×64マスへの世界座標変更は`art/scale64-sample/`の確認後に決める。

2026-11-01にユーザーが提供した `sprite_sheet_64.png`（320×256、64pxセル、5列×4行、SHA-256 `d1d708e4760378c96dd2108191e73167811a0108417cb631539888b547f21d75`）から一度だけ32px版を制作した。削除済みの旧試作やそのプロンプトは参照していない。64px原本はユーザーの提供場所に保管し、以後の編集・配信工程はこの32px版を基準にする。旧 `art/characters/mukuro-v1/` は保持する。

- `sprites-32.png`: 160×128、32×32セル。先頭3行の各4列は待機、斬撃A、突きB。最下行は5コマの崩れ。空の5列目はそのまま保持。
- `sprites.json`: character-front-actions/v1、各コマの再生時間、足元アンカー[16,29]。
- `preview-5x.png`: 32px版を最近傍5倍で表示する確認用画像。

調整：各64pxセルを縦横同じ1/2倍率のBOX法で縮小。alpha<96の微小な色付き縁を除去して2値化。全コマを縦1px上げて立ち姿の最終可視行をy=28に統一。待機3コマ目のみ右1px移し、頭部の横方向の跳ねを抑えた。攻撃A/Bは交互に再生し、斬撃・突きの溜めと振り抜きに70/80/90/70msを配分する。崩れは5コマを一回再生して最終コマを保持。

正面シートのため、上下左右の専用絵はない。ゲーム内表示は全方向で正面。`sprites-32.png`のSHA-256は`333ecb71e0d52891f7e4b485352f563e4622ca1d5cc4ad5b4bf321a725683943`。

## refined 64px artwork (2026-11-01)

Host image edits refined the front action sheet and four directions while preserving the approved connected left arm and red cloak. The standing sprites are 48px high with a shared y=60 foot baseline. `sprites-64-before-refine.png` and `directions-64-before-refine.png` retain the prior delivery assets. The generated edits are kept as `sprites-refined-generated.png` and `directions-refined-generated.png`; `scripts/build-mukuro-refined.py` processes them with uniform scaling and alpha cleanup. Side and rear movement remains a directional still.

## 2026-11-01 下あごのみの修正（現行）

前節の生成シートは本編未使用へ戻した。配信用`sprites-64.png`は`sprites-64-before-refine.png`を基準に顔の下あご10×7px領域だけを修正。`directions-64.png`は前段階の左右・背面を維持し正面のみ同期。実寸4方向44px高、足元y=60。再現スクリプトは`scripts/build-mukuro-jaw-only.py`。生成ソースは`jaw-generated.png`、生成経路はhost_image。
