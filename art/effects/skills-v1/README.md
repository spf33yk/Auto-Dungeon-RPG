# 採用スキルエフェクト v1

ユーザー承認の前面表示サンプルv4から採用。全30スキル、5アトラス、8列×6行、128pxセル。PNGの画素はサンプルv4と同一で、登録anchorと対象の描画中心だけを本編用に調整する。元画像はimage_gen.imagegenで生成。モデルと費用は生成ツールの応答にないため記録しない。

1マス64pxに対しFXは128px保存セルを等倍率で描く。format.jsonはセル寸法・8コマ時間・不透明度・各スキルのtheme/row/anchor/placement、主人公の身体中心、敵各画像の可視中心を持つ。自己効果のanchorはピーク可視範囲の中心、攻撃は採用サンプルの命中光のanchorを保持。対象側はいずれも身体中心へ合わせる。

PNG合計1,135,398バイト。生成原画・比較GIF・不採用試作は登録しない。差し替え時はformat.jsonとscripts/update-assets.jsによるskill-effect-art.js・index.htmlの更新を同時に行う。
