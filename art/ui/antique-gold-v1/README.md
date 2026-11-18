# 古金共通UI素材

承認されたパズル接続型のカード・土台と、共通ウィンドウ、ボタン、タブ、入力欄、スクロールレール、HP枠、報酬台、装備スロット、能力アイコン、開いた図鑑を収録。

カードと土台は承認済みの文字なし画像（exec-1e5e65f7-1ac9-408a-8cbd-5a849827dab5.png）から切り出し。全面の色・二重金縁・見出し下の菱形飾り・レアリティ欄・土台の装飾を保持。簡素化した別原画は使用しない。共通素材は各承認サンプルの原画から透明余白を除き、等倍率で縮小して使用する。画像生成には内蔵imagegenを使用。

- card-target / condition / action / alternative / skill: 青灰・金・赤茶・緑・紫。文字と共通アイコンはDOMで別描画。
- tray-left / middle / right: 今回指定の空土台原画exec-ac15e476-88d9-4e08-8372-b5f26182acb0.pngから切り出し。 左右の装飾を固定寸法で描画し、中央のレールだけ反復。切り出し参照用の原画は配信対象に含めない。
- kind-target / condition / action / skill: 照準・4節点の菱形・剣・8方向の星。カード、カードリスト、宝箱種類選択、カード図鑑で共用。
- ability-attack / defense / sight / hp / chest / move: 能力・装備の共通アイコン。
- window / button / tab / field / rail / hp / reward / slot: 端と角を保持し、長い辺を反復する。新しい文字は素材へ焼き込まない。
- scroll-cap-top / cap-bottom / grip / body（horizontalを含む）: つまみの端・溝・反復金属面。単色の金背景で画像外を補わず、等倍率で合成する。
- scroll-track / scroll-thumb / scroll-thumb-horizontal: 今回指定の黒鉄レールと溝付き古金つまみを切り出した縦横共通スクロール部品。画像は等倍率で描画する。
- rail-track: rail中央から切り出した40×16pxの反復用ストリップ。スクロール途中に端飾りを繰り返さない。
- book: 左ページ上の四角い罫線を除去した無地紙面。縦横比を保って表示し、綴じ目を避けた左右のページにナビゲーションと本文を配置。

UI寸法はワールドの1マス64pxと独立した画面座標。ゲームの保存形式、条件判定、数値、報酬抽選、ゲーム乱数には影響しない。

配信URLはscripts/update-assets.jsが全素材の内容ハッシュを生成し、gold-art.jsとindex.htmlへ反映する。原画の制作履歴はGit履歴または確認用ローカル出力を参照し、ゲーム配信へは採用素材だけを含める。
