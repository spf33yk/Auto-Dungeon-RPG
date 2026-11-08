# map-readable-props/v1

ハート・記憶の欠片・武器・防具・封筒マークはbuilt-in image_gen（host_image）で今回新規生成。モデル指定なし、実費不明。プロンプトはprompts/、原画SHA256はsource-hashes.json。画像生成原画をnative_alpha・単一素材でprocessしqa_status=pass、64pxへ縮小後、共通64色・二値アルファに整理した。HD原画のピクセル仕上げで手打ち清書ではない。

宝箱・赤箱・階段・墓石・ひび割れ墓石・互換報酬は現在使用中の素材から等倍率拡縮して再配置。未採用・中止画像は使っていない。主人公・敵・床・壁・罠の採用先は変更していない。

64pxセル、256×192の4列3行。空きセルは拡張用。配置・別名・アンカーはformat.json。実表示はreadable-props.js、画像URLはindex.htmlのdata-readable-props。生画像や比較画像はローカルoutput/object-icons-20261108-r1/のみ。Gitには軽量アトラス・この規格・プロンプト・原画ハッシュを保持する。

比較時は現行地下墓所の床上で実寸64pxと2倍を目視し、非空・端切れ・二値アルファを確認。今回の画面以外の全床色・スマホ実機は未確認。
