# 旧通路入口素材：entrance-parts/v1

この形式は2026-10-29に現行ゲームから除外。旧素材と入口検出の互換検証用に保管する。
新しい入口は壁と統合したwall-autotile/v2に含める。制作入力はwall-material/v1。

現行仕様は[ステージ壁マテリアル制作フォーマット](../walls/FORMAT.md)を参照。
壁と同じPNG・32×56セル・光源・投影先・暗色処理を用い、入口単独の別アトラスを登録しない。
入口検出関数entranceWallFramesは継続利用するが、旧drawEntrance／loadEntranceTilesetsは現行ゲームでは呼び出さない。
旧PNGとJSON・テンプレート・検証スクリプトは保管する。
