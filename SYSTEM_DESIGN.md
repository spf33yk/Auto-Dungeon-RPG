# 骸の旅路 ― システム設計書

更新日：2026-11-04。保存v16。基準実装fd464e0と、本書と同時コミットの5職業テーマ・セット実装。現行の機能仕様は[SPEC.md](SPEC.md)、企画は[DESIGN.md](DESIGN.md)。[整理前の設計履歴](docs/history/2026-11-04/SYSTEM_DESIGN.md)は互換・制作経緯の参照専用。

## 1. 構成と責務

ビルド不要のJavaScript ES modulesとCanvas。server.jsで静的配信し、index.htmlのimport mapで内容ハッシュ付きURLを指定する。ゲーム進行の乱数と視覚表現の時計を分離する。

| 分野 | 実装 | 責務 |
|---|---|---|
| 定義 | data.js、field-events.js | 敵・装備・強化・エリア・階数・異変・次階ヒント |
| 本編 | game-engine.js（入口engine.js） | 状態・地形配置・行動・戦闘・拾得・周回・保存正規化 |
| 地形 | dungeon-layout.js、boss-arena.js、crypt-obstacles.js | 通常階ランダム・対称ボス部屋・墓石と到達可能性 |
| 指示 | card-orders.js、card-placement.js、orders.js | カード判定・互換性・配置操作・旧指示互換 |
| 所持 | card-access.js、card-catalog.js、card-inventory.js、retired-cards.js | 初期5枚・57カード・抽選・図鑑・旧カード移行 |
| 成長・報酬 | progression.js、drop-system.js、reinforcements.js | EXP・二段階ドロップ・保存RNG・増援 |
| オーグメント | augments.js、augment-view.js、augment-art.js | 30効果・3択・計算・共通画像付き表示・配信URL |
| 画面統括 | app.js、index.html、style.css、screens.css | 入力・フェイズ表示・ダイアログ停止・描画・保存 |
| 指示UI | card-editor.js、editor-scroll.js | ドラッグ／タップ・行ゴースト・再描画前後の位置保持 |
| 準備予測 | exploration-forecast.js、forecast-view.js | 複製状態の非同期試行、結果と警告 |
| 表示・設定 | display-mode.js、ui-settings.js、preparation-skins.js、screen-tutorial.js | 16:9拡縮・全画面要求・端末設定・スキン・案内 |
| 視界・地図 | map-view.js、map-discovery.js、scene-lighting.js、scene-depth.js | 追従カメラ・入室式地図・明暗・足元ソート |
| 素材描画 | character-animation.js、terrain-view.js、wall-tileset.js、entrance-view.js、prop-view.js、enemy-view.js | 形式検証・セル切出し・統合壁・小物・敵HP表示 |
| 演出 | awakening.js、normal-ending.js、subtitle-player.js、opening.js、thought-view.js、story-text.js、damage-view.js、log-visibility.js | 回想・終了・文字送り・タイトル版・思考・ダメージ・5秒ログ |
| 音 | scene-music.js、app.js | 場面BGM・ループ・音量・ブラウザの再生許可、Web Audio効果音 |
| 検証 | *.test.js、test-support/ | Node標準テスト。画面確認は隔離したローカル保存で実施 |

## 2. 状態と遷移

newGameはversion16・floor1（B30）・phase awakening。初期所持5種類と自分→階段の1行、Lv1・HP54・欠片12を設定。profileは複製して引き継ぐ。

app.jsのshowingTitleはエンジンphaseと別。タイトル中はtick・自動保存を止め、hasSaveでLoadGame可否を管理。開始前映像・開始字幕も一時UI状態。開始3択の候補と未選択状態はエンジン状態として保存する。

awakening → 字幕・開始選択 → explore → cleared → prepare → explore。B1 clearedからascendするとending、normalClearsを増やし手紙カードを付与。dead／あきらめる／次の旅ではprofileを引き継いでnewGame。TRUE本編へ進む遷移は存在しない。

tickはexploreかつaugmentOfferなしでのみ実行。turnは旅の累計、stepsは階ごとの経過。カード行を判定し、隣接戦闘またはスキル・退避・移動を実行、拾得・罠・敵行動・Clear・増援の順に処理する。ボス撃破の3択発生時はその先の処理を停止する。

## 3. 保存・移行

状態本体の進行、grid・敵・品物・seen・visited、装備、levels、level／experience、orders、ownedCards、augments／augmentOffer、seed／rngState、profile等をJSON化しabyss-normal-v2へ保存。normalizeSaveがv2〜v15を順次移行しvalidateSaveで検証する。全データ初期化と旅だけの初期化はデバッグで区別する。

旧鍵・廃止カード・常時スキルは互換移行で処理し、新規取得とは分ける。data.jsの旧rewardDefinitions・chestRewards、orders.jsの旧形式、非公開の旧図鑑経路が残っていても、現在の画面で利用する新規カード箱・4図鑑とは区別する。

ゲーム保存とui-settings.jsの端末設定を分離。設定はミニマップ・映像スキップ・準備スキン・BGM・画面別案内閲覧フラグ。案内やスクロールのためゲーム保存版を上げない。視覚時計、ドラッグ・選択、スクロール、ダメージ演出は一時状態。

## 4. 乱数・地形・到達性

地形用random(seed＋floor×997)、異変用fieldPlan、戦闘・報酬用rngStateを区別。保存済みの敵・品物・3択は読み直しで再抽選しない。地形は47×35、通常階は接続グラフと部屋、ボスはbossArena。通常ルートは6エリアを選び、定義上の10エリアすべてを均等配分しない。

routeは既知床を使う幅優先探索で、敵側の経路だけ未知床も利用できる。障害物・敵・目的地を考慮する。視界は四角い範囲と遮蔽、MAPの部屋公開は別モデル。canSeeを敵対象・図鑑登録・描画の共通根拠として使う。

## 5. 描画と座標

ワールドは1マス64px。UI設計座標は1280×720で等倍率拡縮、Canvas描画面は1920×1080。cameraForが視界と位置から追従カメラを計算し、視覚上の移動補間を使う。身体64px、保存セル128px、ワールド64px、画面倍率を混同しない。

主人公はdata-heroからmukuro-minimal64-v1/sprites.jsonを読込。character-minimal-4dir/v1は下・左・右・上、3列の立ち／沈み1／沈み2と足元原点[64,96]、displayScale1.71875。屈伸・踏み込み・斬撃は表示だけで、攻撃判定やグリッド座標を変えない。旧character-4dir/v1は互換形式で現在の主人公への作画指示ではない。

床はシームレスfloor-texture/v2、壁はwall-material/v1入力・wall-autotile/v2配信。北1・東2・南4・西8で接続番号を求め、入口と角も同じ壁PNG・光源・riseで描く。15は埋め壁で外枠なし。旧entrance-parts/v1を別材質として重ねない。前景壁は通行床からはみ出さず、足元深度で描画順を決定する。明暗は実視界に合わせ、既知地形を薄暗く残す。

## 6. 準備UI・スクロール

HUDは探索・準備で共用。ResizeObserverがHUD下端＋余白を--shared-hud-spaceへ設定。#workspace:beforeの上端をこの値、左右・下端を0にして準備枠を描画する。主枠20px・パネル16px、48pxスライスの9分割、辺repeat、pointer-events:none。画像比率保持・内容の安全余白を設ける。

renderCardEditorは指示・能力・所持・phase等の署名で不要なDOM置換を避ける。変更がある場合だけeditor-scroll.jsがホスト・パネル・一覧の縦横位置を採取し復元。WeakMapで前回の指示オブジェクトと行の対応を保持し、移動後の横位置をその指示へ追従する。保存へDOM情報を含めない。

ドラッグはPointer Eventsで、カード／行の複製ゴーストが掴んだ位置に追従。タップでも選択→配置、番号選択→移動先行に対応。カード列のoverscroll-behavior-yはautoで指示一覧の縦スクロールを遮らず、横だけcontain。カードや行番号以外はpan-x pan-yを許可する。

## 7. 予測・停止・案内

forecastExplorationは入力を複製して本編tickを試行し、実状態や乱数を変えない。入力署名は表示専用ログ・intent等を除外。変更時は世代を更新し古い結果を破棄、短い処理区間ごとにUIへ制御を返す。未選択の将来オーグメントは付与しない。

openDialog／finishDialogは元のpausedを保持し、他のダイアログが残る間も停止。screenTutorialsのexplore4項目／prepare5項目を初回表示し、完了・閉じる・Escapeで画面別閲覧フラグを記録。オプションからどちらも再閲覧できる。ログはlog-visibility.jsが5000ms・ホバー／タップ保持を管理する。

## 8. 配信・検証・既知課題

scripts/update-assets.jsがroot JS・CSS・指定画像と音等の内容ハッシュをindex.htmlや配信定義へ反映。--checkはGitHubテストでも実行。Node標準テストとローカル画面確認を基本とし、公開障害時にはPagesのbuild／deployと公開HTMLの実URLまで確認する。

直近の検証は271件成功。横向きサイズ検証はPC内iframeであり、スマホ実機のタッチやSafari・回転・全画面が検証済みという意味ではない。実施コミット・配信確認・未確認はIMPLEMENTATION_NOTESへ記録する。

戦術と明示攻撃の競合・罠回避の基本探索への未適用は判断処理の共通化時に解消。一部条件の常時成立は既知のまま。TRUE分岐、将来の合成等、現在の全旅クリア率は未実装／未測定として扱う。


## 9. 準備表示と判断・集計（2026-11-04）

- game-engine.jsのplanHeroTurnを本編と予測の共通判断入口とする。削除したbuild-lab.js／build-insights.js／build-workshop.jsを読み込まない。
- card-orders.jsのFIXED_STAIR_RULEをeffectiveCardOrdersで編集行の末尾に付加。未所持カードの照合から独立し、既知・封印解除済みの階段だけを候補にする。ruleIndexはnull、fixedはtrueとして編集行統計と区別。セーブordersは編集行だけ保持する。
- card-editor.jsは操作属性のない常設行を描画。編集入力から常設行を除外し、card-placement.jsの配列範囲チェックでも保護する。
- screens.cssはdata-card-kind／data-palette-tabで4種類の色を共通化し、既存画像をマスクとして色を重ねる。準備背景はborder-boxまで描画し、内容用の境界幅は0とし、装飾だけ別レイヤーに描画する。準備中のCanvasを隠し、HUDと画面端の装飾を保持する。
- forecast-comparison.jsは準備入口の複製を基準として同じ試行系列で差分比較する。世代・階・試行数を検証し古い非同期結果を捨てる。基準はセーブしない。
- build-performance.jsは実イベントを集計。Clear・死亡時の実績表示は撤去済み。任意のbuildReport／lastBuildReportは保存v16で検証し、旧保存の欠落を許可する。予測内の記録は実レポートに合算しない。

2026-11-04：カードの種類別カラーを低彩度に調整。準備の内側は維持し、外側だけ暗い単色にする。装飾下の内側背景はフレームまで描画する。詳細はSPEC.mdを参照。

2026-11-04 サイズ復元：準備画面本体の20px境界を撤去し、追加前の広い内容領域へ復元。装飾フレームは独立レイヤーのまま、上辺はHUD下・左右下辺は画面端。内側の背景は全面に描画し、外側のダンジョンと影だけ非表示とする。カード配色・操作・保存は変更しない。

2026-11-04 カード表示の統一：カード本体4種類は共通の基本素材を使用し、スキン切替では土台・周辺装飾だけ変更する。種類別カラーは固定。行の文章冒頭の「使用枚数 / 上限枚数 ·」を非表示とする（枚数上限の判定は維持）。大外フレーム外側の遮蔽は維持し、カードリストと探索指示のパネル背景・内側の影は透明化する。寸法・操作・取得条件・保存v16に変更なし。

2026-11-04 外周の漏れ修正：大外装飾の透明な外縁から内側背景が漏れるため、準備本体を四辺5pxだけクリップする。独立した装飾はクリップせず、背景の見える範囲だけを制限する。内容のレイアウト・寸法、内側パネルの透過、カード色、保存は変更しない。

2026-11-04 実績表示の撤去・土台ドラッグ：Clear・死亡画面のATK補正、ビルドの活躍、与被ダメージ集計、指示実行回数の表示を削除する。内部集計と旧保存の互換データは維持するが表示しない。探索指示の編集可能な土台全体を行ドラッグ開始領域に追加。カード上はカード単体の移動、条件追加口は従来操作を優先。常設最終行は移動不可。準備中のみ編集でき、スクロール保持とタップ操作を維持する。保存v16への影響なし。

2026-11-04 カメラ安定化：画面中央で主人公を追従し、通常のカメラ倍率は初期視界3相当で固定する。霧では2相当の近い表示にする。霧の視界・AI判定は従来のまま。マップ形状・階層による位置や倍率の変更は行わない。保存への影響なし。

2026-11-04 カメラ仕様再確定：原因は感覚の記憶に応じた自動ズームアウト。通常倍率は初期視界3相当（縦11マス）で固定し、感覚の記憶を上げても画面内のマス・主人公の大きさを変えない。霧では視界2相当（縦9マス）へ寄る演出を維持する。視界・AI判定は従来の半径を使用し、強化後に画面外へ広がる範囲も判定対象。主人公中央追従と保存v16は維持。前項の「強化に伴う倍率調整を維持」「霧で倍率を変えない」は撤回。


## 追加の指示・報酬制御

- card-orders.js：任意disabledを検証・保持し、matchingCardTargetsで無効行を除外。行動・補助指示に共通適用。常設最終行は対象外。
- game-engine.js：planHeroTurnの実行行だけexecutingRuleへ記録し、app.jsがfield-log-host内のexecuting-orderへ番号と行動名を独立表示する。思考字幕へ番号を付けない（チャット直上への仮配置）。描画専用値は予測署名から除外。追加4スキルは既存attackEnemy／ダメージ処理を共有、power倍率と一時防御を適用。
- card-inventory.js：cardChestChoicesはアンカーと同種類・同階級で抽選。pickupでcardOfferを作り、chooseChestCardで候補1個だけ取得・消去。選択待ち中はtickを停止。予測は複製上で先頭候補を選択する。
- tactics-ui.js：選択宝箱とプリセットのダイアログ。選択中は既存のdialog[open]判定で本編を停止する。プリセット名・カード文言はHTMLエスケープ。
- order-presets.js：端末別10件の名前付き指示配列。読込時は最新の所有・枠を検証、失敗は変更なし。設定とは別のキーを使い周回を越えて保持する。
- 追加の保存項目cardOffer／skillUses／guardHits／focusPowerは任意、既存v16では未使用扱い。disabledも任意boolean。配信コードを旧版へ戻す場合の前方互換は保証しない。


テーマ表記は持久・速攻・背水・守護・不屈・猛攻に統一。旧表記の熟成／焦燥／満月／傷跡／闘争はテーマ名として使用しない。個別オーグメント名（熟成の刃・満月の守り等）、効果・重み・IDは維持する。保存はIDを使うため既存セーブへ影響なし。スキルには正式なテーマ属性を追加せず、相性分類は分析として区別する。


## 5テーマ制と素材・セットの共通化

build-themes.jsは5職業・30オーグメント・30スキル・旧ID置換表の正規定義。card-access／card-orders／dataは同じ定義からレアリティと取得情報を構築する。set-bonuses.jsのskillSetActiveとsetBonusRowsを本編・準備UI・選択予告・図鑑で共有し、表示だけのセットを作らない。

theme-runtime.jsは状態の初期化・検証・移行、発動可能判定、能動スキル実行、入室特典・一時強化・軽減処理を担当する。エンジンの戦闘・視界・経路・乱数はコンテキストで渡し、定義間の循環importを避ける。skillCanRunは状態を変更しない。通常階とボス階の生成前にresetThemeFloorを呼び、makeBossFloor経由でも使用回数を持ち越さない。

保存v16へ任意themeStateを追加し、配列・数値・boolean・地形インデックス・使用スキルIDを検証。既存使用フラグを復元する。廃止4IDの所持統合による重複は欠片5で補填。正規化後に再保存されるため同じ補填を繰り返さない。

art/ui/build-themes-v2/format.jsonに生成元ハッシュ・矩形・正方形出力を定義。scripts/build-theme-art.pyが等倍率でWebPへ出力し、scripts/update-assets.jsが専用絵とテーマアイコンのハッシュをaugment-art.jsへ生成。theme-view.jsが画像とSET表示を共通化。raw PNGはローカルoutputへ保管し配信しない。

2026-11-06 オーグメント／宝箱UI：準備中の所持オーグメント列は高さ制限を解除し、枠全体を表示して横スクロール。ホバーの説明にセット効果と配置中スキルを追加。セット一覧はスキル名と具体的な強化量（成功率50%→65%等）を明示。スキルカードのテーマアイコンは左上の四角内、テーマ名はその下へ配置。宝箱候補は既存カード素材を使い縦1列に並べる。通常3候補、宝探しの勘による4候補も縦に表示。画像の縦横比と選択・取得条件、保存v16は維持。

2026-11-06 テーマ表示の再配置：左上の四角へのアイコン重ね合わせは撤回。テーマアイコン・テーマ名・SETを専用の通常フロー行としてカード画像の上へ表示する。カードリストでは各カードの上、配置済み指示では土台の上、宝箱では候補カードの上へ統一。元画像・連結部・文字欄に重ねず、位置をカード画像の比率や透明余白に依存させない。性能・保存形式の変更なし。

2026-11-06 準備編集領域の整理：上部タブの上下余白・本文上下余白を縮小し、カードリストと探索指示の高さを確保。既存フレームの端固定・中央繰り返しを維持し画像を変形しない。返却案内と初期操作案内を撤去し、配置済みカードの選択・ドラッグ中は返却先カードリストを強調。スキル一覧は探索家／修行僧／狂戦士／守護者／勝負師で所持カードを分類（空テーマは省略）。行ボタンは有効／無効のみ。指示行のテーマ表示からSET文字だけ撤去し、セット発動スキルカード本体を発光。操作・性能・保存形式は維持。
