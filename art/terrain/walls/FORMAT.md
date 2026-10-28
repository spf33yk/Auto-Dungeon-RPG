# 壁専用ドット絵フォーマット：wall-parts/v1

壁の上面・正面・左右側面は独立した原画で制作する。床の画像や旧平面壁画像を切り出して流用しない。現在は新規の地下墓所用石壁を全エリアの共通既定素材にし、エリア専用素材は後から追加できる。

## ファイルと座標

各エリアのフォルダに `master-64.png`、`atlas-32.png`、`tileset.json` を置く。制作原本は配信版の縦横2倍。PNGは透明背景・二値アルファ・nearest-neighbor縮小。大きな生成原案は `art/local-originals/` に保存しGit対象外とする。

既定レイアウトは原本256×288px／配信128×144px。原本の1セル64×96px／配信32×48px。四角い1マスの上に半マス持ち上がる壁全体を1セルとする。

| 行 | 1列 | 2列 | 3列 | 4列 |
|---|---|---|---|---|
| 1 | cap上面A | cap上面B | front正面A | front正面B |
| 2 | leftStart | leftMiddle | leftEnd | leftSingle |
| 3 | rightStart | rightMiddle | rightEnd | rightSingle |

- cap：セル上部64×64pxを描き、下部32pxは透明。
- front：セル上部64pxを透明にし、下部64×32pxへ正面の横積み石を描く。capとは別の原画。
- left/right：左端／右端14px幅に、縦積みの専用側面を描く。それ以外は透明。上・下の接続端に合わせて斜めの輪郭を描く。実行時の多角形・色塗りで側面を代用しない。
- Start＝上と非接続、下と接続。Middle＝上下と接続。End＝上と接続、下と非接続。Single＝上下とも非接続。接続とは、隣の壁セルも同じ側に床が接していること。
- capの全バリアントは上下左右の端画素を共通にする。frontは左右端、側面Middleは上下の継ぎ目を合わせる。原本の外周2pxを揃えると32px縮小後も一致しやすい。
- 壁角はfrontと左右端パーツを重ねて表現する。独立した斜め格子への変形はしない。

## JSON定義

`wall-parts-v1.template.json` を複製して開始する。`wall-parts-v1.schema.json` は編集支援用。実行時は `validateWallTileset` が版、必須部品、フレーム範囲、画像実寸を検証する。

| キー | 意味 |
|---|---|
| format / version | `wall-parts` / `1`。互換性を壊す変更時は版を上げる |
| id | 素材セットの固有ID |
| themes | 適用するzone ID配列。`*`は既定、具体的なIDは優先される |
| image | JSONからの相対画像URL。ビルド時に内容ハッシュを付ける |
| tileSize | 配信画像における床1マスの幅。現在32px |
| rise | 壁高のマス数。現在0.5 |
| width / height | 配信PNGの実寸 |
| parts | 名前ごとのフレーム配列。1フレームは `[x,y,width,height]` |

フレーム幅はtileSize、高さはtileSize×(1+rise)。配置は固定表以外でもよく、JSONの矩形を変更すればよい。cap/frontに複数フレームを登録すると座標とseedに基づき選ばれる。ゲームの乱数列は消費しない。左右も同様にバリアントを追加可能。全フレームは同じ足元を共有し、描画位置は `(x, y-rise)` マス。左右の14px幅は今回の絵の制作規約であり、レンダラーに固定されていない。

## 追加手順

1. 新しいフォルダと原本を作り、テンプレートJSONのid・themes・座標を編集。
2. `node scripts/build-wall-tileset.js art/terrain/walls/新エリア` を実行。Sharpは制作時のみ必要。第3引数でSharpモジュールファイルを指定できる。
3. index.htmlのcanvas `data-walls` に新JSONのURLを空白区切りで追加。既定セットを先に、エリア専用セットを後に登録する。重複themeは後のセットが優先。描画コードの変更は不要。
4. `node scripts/update-assets.js`、`node scripts/update-assets.js --check`、`node --test` を実行。
5. SPEC.md等の該当資料を更新し、ソース・JSON・原本・配信画像を同じコミットにする。

JSONに画像ハッシュ、indexにJSONハッシュを持たせる。画像更新時のビルド漏れは配信URLチェックでエラーにする。読み込み失敗時は旧素材を流用せず、単色ブロックの一時表示とコンソールエラーにする。

保存データの変更は不要。ゲームの壁／床判定、視界、移動、足元順、手前壁の半透明処理は独立して維持する。
