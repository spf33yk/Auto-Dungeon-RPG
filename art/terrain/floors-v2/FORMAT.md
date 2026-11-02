# floor-texture/v2

2026-11-03。1マス64×64px。配信用atlas-64.pngは256×256px、4列4行。先頭10セルがdata.jsのzone.index順で、残り6セルは予備。各エリアでは同じセルを繰り返し、異なる石模様のランダム配置による切断を避ける。上下左右の対向辺を同一画素へ揃え、外周を単色の枠にしない。描画倍率は等倍率・imageSmoothingEnabled=false。地形判定と視界判定は変更しない。

原画は今回のhost_image（image_gen）による新規生成。PROMPT.txtを保持。旧64px地形原本・中止済みキャラクター画像は入力に使用していない。生成原画はローカルのart/local-originals/environment-refresh-20261103/に保管しGitへ含めない。scripts/build-environment-refresh.pyで64px縮小・40色減色・周期境界補正を行い、敵素材も同時出力する。8pxの対向辺遷移を補正し、減色後に端画素の厳密一致を保証する。

今後の別エリアもセル64px・zone.index対応を維持する。新規模様では必ず上下・左右の接続と反復プレビューを検証する。既存の壁フォーマットとは独立した床素材であり、入口・壁の形状や衝突に使用しない。
