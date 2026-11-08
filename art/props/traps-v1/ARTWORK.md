# 罠素材 map-traps/v1

ユーザーがtrap-study-20261108-r1を承認し採用。今回新規にhost_image / built-in image_genで生成した原画を縮小・減色。モデル指定なし、実費不明。元原画のSHA256はsource-hashes.json、入力はprompts/。旧中止試作は未使用。

1マス64px、2列×6行。format.jsonを参照。底辺Y52、共通48色・二値アルファ。発動後サンプルを破損状態として使用。縦横同倍率を維持する。原画・QC中間物はローカルoutput/trap-study-20261108-r1/のみで、Gitには登録しない。追加はアトラスと軽量資料だけ。

原画QCの警告は以下（原文）。
- 全6原画：`faint_specks` / `warn` / `alpha haze and detached specks; process removes them with --alpha-hygiene both`
- alarm・snare：`safe_frame` / `warn` / `owned art closer than 15% of the cell to its edge; ask for more margin next time`

native_alphaのノイズ除去、共通縮小、余白、二値アルファ処理後、12セルすべて非空・端切れなし・64pxを確認。色数48、底辺Y52。HD原画のピクセル仕上げで、手打ちの清書ではない。警報の前後差は小さいため破損はログでも明示する。
