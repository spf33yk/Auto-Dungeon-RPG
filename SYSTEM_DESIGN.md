# 骸の旅路 ― システム設計書

更新日：2026-11-10。保存v16。現行仕様は[SPEC.md](SPEC.md)、企画は[DESIGN.md](DESIGN.md)。

## 1. 構成と責務

ビルド不要のJavaScript ES modulesとCanvas。server.jsで静的配信し、index.htmlのimport mapで内容ハッシュ付きURLを指定する。ゲーム進行の乱数と視覚表現の時計を分離する。

| 分野 | 実装 | 責務 |
|---|---|---|
| 定義 | data.js、field-events.js | 敵・装備・強化・エリア・階数・異変・次階ヒント |
| 本編 | game-engine.js（入口engine.js） | 状態・地形配置・行動・戦闘・拾得・周回・保存正規化 |
| 地形 | dungeon-layout.js、boss-arena.js、crypt-obstacles.js | 通常階ランダム・対称ボス部屋・墓石と到達可能性 |
| 指示 | card-orders.js、card-placement.js、orders.js、directive-safety.js | カード判定・配置・旧指示互換・停滞検出と基本行動への復帰 |
| 回復互換 | healing-items.js | 泉と回復ポーション・取得カード・選択待ち候補・プリセットの固定移行 |
| 所持 | card-access.js、card-catalog.js、card-inventory.js、retired-cards.js、directive-card-migration.js | 初期6枚・52カード・抽選・図鑑・旧カード移行 |
| 罠 | traps.js、art/props/traps-v1/format.json | 6種類・接触検知・破損抽選・期限付き状態・共通64px素材 |
| 成長・報酬 | progression.js、drop-system.js、reinforcements.js | EXP・二段階ドロップ・保存RNG・増援 |
| オーグメント | augments.js、augment-view.js、augment-art.js | 30効果・3択・計算・共通画像付き表示・配信URL |
| 画面統括 | app.js、index.html、style.css、screens.css | 入力・フェイズ表示・ダイアログ停止・描画・保存 |
| 指示UI | card-editor.js、editor-scroll.js | ドラッグ／タップ・行ゴースト・再描画前後の位置保持 |
| 準備予測 | exploration-forecast.js、forecast-view.js | 複製状態の非同期試行、結果と警告 |
| 表示・設定 | display-mode.js、ui-settings.js、preparation-skins.js、screen-tutorial.js | 16:9拡縮・全画面要求・端末設定・スキン・案内 |
| 視界・地図 | map-view.js、map-discovery.js、scene-lighting.js、scene-depth.js | 追従カメラ・入室式地図・明暗・足元ソート |
| 素材描画 | skill-effects.js、character-animation.js、terrain-view.js、wall-tileset.js、entrance-view.js、prop-view.js、readable-props.js、enemy-view.js | 形式検証・セル切出し・統合壁・小物・敵HP表示 |
| 演出 | awakening.js、normal-ending.js、subtitle-player.js、opening.js、thought-view.js、story-text.js、damage-view.js、log-visibility.js、field-messages.js | 回想・終了・文字送り・タイトル版・思考・ダメージ・5秒ログ |
| 音 | scene-music.js、app.js | 場面BGM・ループ・音量・ブラウザの再生許可、Web Audio効果音 |
| 検証 | *.test.js、test-support/ | Node標準テスト。画面確認は隔離したローカル保存で実施 |

## 2. 状態と遷移

newGameはversion16・floor1（B30）・phase awakening。初期所持6種類と自分→階段の1行、Lv1・HP54・記憶の欠片12を設定。profileは複製して引き継ぐ。

app.jsのshowingTitleはエンジンphaseと別。タイトル中はtick・自動保存を止め、hasSaveでLoadGame可否を管理。開始前映像・開始字幕も一時UI状態。開始3択の候補と未選択状態はエンジン状態として保存する。

awakening → 字幕・開始選択 → explore → cleared → prepare → explore。B1 clearedからascendするとending、normalClearsを増やし手紙カードを付与。dead／あきらめる／次の旅ではprofileを引き継いでnewGame。TRUE本編へ進む遷移は存在しない。

tickはexploreかつaugmentOffer・cardOfferなしでのみ実行。turnは旅の累計、stepsは階ごとの経過。カード行を判定し、隣接戦闘またはスキル・退避・移動を実行、拾得・罠・敵行動・Clear・増援の順に処理する。ボス撃破の3択発生時はその先の処理を停止する。

罠はtriggerTrapで骸と敵の双方を処理。骸の行動後、各敵の行動後（操作済みの敵も1回）に接触を判定する。trapContactは同じマス上の再発動を防ぎ、空き床へ出ると解除。転移の着地点を記録し連鎖を防ぐ。trapStatusのsnare／weaken／mistは階のstepsによる絶対解除期限、trapAlarmは誘導先と期限。状態判定・攻撃倍率・視界減算は実戦と予測で共用。棘の撃破は既存defeatEnemyへ合流し報酬を一度だけ処理する。種類・状態・接触位置はv16の任意フィールドとして検証し、旧罠の種類省略は棘として扱う。

## 3. 保存・移行

状態本体の進行、grid・敵・品物・seen・visited、装備、levels、level／experience、orders、ownedCards／newCards、augments／augmentOffer、seed／rngState、profile等をJSON化しabyss-normal-v2へ保存。normalizeSaveがv2〜v15を順次移行しvalidateSaveで検証する。全データ初期化と旅だけの初期化はデバッグで区別する。

旧鍵・廃止カード・常時スキルは互換移行で処理し、新規取得とは分ける。data.jsの旧rewardDefinitions・chestRewards、orders.jsの旧形式、非公開の旧図鑑経路が残っていても、現在の画面で利用する新規カード箱・4図鑑とは区別する。

ゲーム保存とui-settings.jsの端末設定を分離。設定はミニマップ・映像スキップ・準備スキン・BGM・効果音・画面揺れ・画面別案内閲覧フラグ。案内やスクロールのためゲーム保存版を上げない。視覚時計、ドラッグ・選択、スクロール、ダメージ演出は一時状態。

## 4. 乱数・地形・到達性

地形用random(seed＋floor×997)、異変用fieldPlan、戦闘・報酬用rngStateを区別。保存済みの敵・品物・3択は読み直しで再抽選しない。地形は47×35、通常階は接続グラフと部屋、ボスはbossArena。通常ルートは6エリアを選び、定義上の10エリアすべてを均等配分しない。

routeは既知床を使う幅優先探索で、敵側の経路だけ未知床も利用できる。障害物・敵・目的地を考慮する。視界は四角い範囲と遮蔽、MAPの部屋公開は別モデル。canSeeを敵対象・図鑑登録・描画の共通根拠として使う。

## 5. 描画と座標

ワールドは1マス64px。UI設計座標は1280×720で等倍率拡縮、Canvas描画面は1920×1080。cameraForが通常時の固定倍率と主人公位置から追従カメラを計算し、視覚上の移動補間を使う。身体64px、保存セル128px、ワールド64px、画面倍率を混同しない。

主人公はdata-heroからmukuro-march64-v1/sprites.jsonを読込。character-minimal-4dir/v1は3列互換を保ち、4列ではanimation.cycleDurationsMsの4要素を検証する。4列の接地A／足上げA／接地B／足上げB、行は下・左・右・上。128pxセル・足元原点[64,96]・displayScale1.71875。appの独立したidleClockをsample.cycleElapsedへ渡し、characterActionFrameで120/280/120/280msの連続周期を選ぶ。攻撃・死亡・reduced-motionは接地0。攻撃の踏み込み・斬撃は表示だけで、判定やグリッド座標を変えない。旧3列屈伸・character-4dir/v1は互換維持。[足踏み版採用](docs/characters/MARCH64_INTEGRATION.md)。

床はシームレスfloor-texture/v2、壁はwall-material/v1入力・wall-autotile/v2配信。北1・東2・南4・西8で接続番号を求め、入口と角も同じ壁PNG・光源・riseで描く。15は埋め壁で外枠なし。旧entrance-parts/v1を別材質として重ねない。前景壁は通行床からはみ出さず、足元深度で描画順を決定する。明暗は実視界に合わせ、既知地形を薄暗く残す。

敵の攻撃はcontrolledHitHeroがdamageEventsへsource座標を付加し、enemy-attack-animation.jsが対象個体の参照を解決する。app.jsのenemyAttacksは描画専用で、combat.actorTimeを共用して停止・倍速・動きを減らす設定へ対応。身体・影を同じoffsetで動かし、攻撃マークはラベルより後ろへ描く。種IDではなくオブジェクト参照で複数個体を区別。damageEventsは保存・予測署名から除外、読込時に消去。フロア／旅の切替と個体消滅で演出を破棄する。

## 6. 準備UI・スクロール

renderOrderEditorは折返し可能な操作欄とorder-history.jsの準備内履歴を同期する。instruction-upgradesはorder-expansion-dialogへ配置し、購入後に残高と非活性状態を更新する。履歴は指示とfixedOrderExpandedだけをJSONスナップショット化し、購入やゲーム乱数を含めない。

HUDは探索・準備で共用。ResizeObserverがHUD下端＋余白を--shared-hud-spaceへ設定。#workspace:beforeの上端をこの値、左右・下端を0にして準備枠を描画する。主枠20px・パネル16px、48pxスライスの9分割、辺repeat、pointer-events:none。画像比率保持・内容の安全余白を設ける。

renderCardEditorは指示・能力・所持・phase等の署名で不要なDOM置換を避ける。変更がある場合だけeditor-scroll.jsがホスト・パネル・一覧の縦横位置を採取し復元。WeakMapで前回の指示オブジェクトと行の対応を保持し、移動後の横位置をその指示へ追従する。保存へDOM情報を含めない。

ドラッグはPointer Eventsで、カード／行の複製ゴーストが掴んだ位置に追従。タップでも選択→配置、番号選択→移動先行に対応。カード列のoverscroll-behavior-yはautoで指示一覧の縦スクロールを遮らず、横だけcontain。カードや行番号以外はpan-x pan-yを許可する。

## 7. 予測・停止・案内

forecastExplorationは入力を複製して本編tickを試行し、実状態や乱数を変えない。入力署名は表示専用ログ・intent等を除外。変更時は世代を更新し古い結果を破棄、短い処理区間ごとにUIへ制御を返す。未選択の将来オーグメントは付与しない。

openDialog／finishDialogは元のpausedを保持し、他のダイアログが残る間も停止。screenTutorialsはprepare7手順のみ。探索はaugment-dialog内の短い案内に限定し、取得成功時に端末設定tutorials.exploreをtrueへ保存。NewGameで両フラグをfalseへ戻す。オプションは次のオーグメント選択時の案内を再予約する。ログはlog-visibility.jsが5000ms・ホバー／タップ保持を管理する。

## 8. 指示とセット・報酬の共通化

actor-rules.jsが実行者の対応範囲を定義し、敵はenemy-control.jsの状態と通常AIの周期を共有する。カード条件は実行者へバインド。directive-safety.jsで待機・停滞・1000ターンを検出し、本編と予測の共通tickで適用する。

active-directive.jsが実際のexecutingRuleから番号・対象・条件・効果を整形し、thought-stack内のmemory-quote直前へ表示する。基本AI時は空欄。ログ消去と分離する。

build-themes.jsが5テーマ・30オーグメント・30スキルを定義。set-bonuses.jsが所持・解放済み・有効配置の異なるスキル数から星を算出し、augmentStatsがaugment-growth.jsの個別表から性能を取得。スキル基本性能は変更しない。augment-strength.jsが基本／星別の説明を整形、augment-view.js／theme-view.js／hover-help.jsを通して選択・準備・図鑑・説明ウィンドウへ共通反映する。

card-inventory.jsで宝箱の種類別候補を生成・保存、selectChestCategoryで一度だけ種類を固定しchooseChestCardで取得。取得は次の準備で配置可能。newCardsは初取得の追加カードだけを記録し、準備出発成功時に解除する。

カード内の数値入力は編集groupとinputを分離し、枠のドラッグと競合させない。カード返却はリストへ集約し、編集後に予測を再計算。order-presets.jsが端末の名前付き指示を保存し、現所持・容量・改訂番号を検証する。

個別成長はaugment-growth.jsの数値表を本編・予測・説明で共有する。候補最大8枚とconsolation、能力補正ピークの小数を保存v16で検証し、旧箱の外れ報酬は10個のまま扱う。

## 9. 描画・配信・検証

scene-lighting.jsのexplorationLightGeometryがradius(state)+1.3マスの光半径を生成する。暖色screen＋黒source-overの2グラデーションをカメラのワールド領域全体へ描き、Canvas状態を復元する。app.jsはマス別の床暗転を重ねず、drawSightWallのsmooth経路で原壁を描いて共通照明へ渡す。位置は移動補間へ追従する。照明は表示専用。敵・品物・AI・発見・MAPは四角いcanSeeを参照する。通常カメラ倍率は視界強化に依存せず、霧だけ近づける。準備の外側遮蔽・内側透過・土台の等倍率・レアリティの前景描画はscreens.cssで管理する。

scripts/update-assets.jsがブラウザJS・CSS・対象素材の内容ハッシュを配信URLへ反映。変更時に更新して--checkを通す。Node自動テストとローカル画面確認を基本とし、配信固有の障害がある場合だけ公開走行を追加する。

scripts/verify-clearability.jsは本番ロジックを直接使い、現行UIにある準備操作・報酬選択だけで旅を検証する。初期値・HP・敵・乱数・未所持カードを改変しない。ゲーム内に購入UIのない能力強化は使わない。検証値はdocs/verification/CURRENT_BALANCE.md、実施内容と未確認はIMPLEMENTATION_NOTES.mdへ記録する。

TRUE本編、仲間指定、追加アニメーション、実機スマホは残課題。旧セーブ対応のコードと素材は互換機能として残すが、旧仕様の制作履歴は現行資料へ掲載しない。

回復はheartを新規配置し、BALANCE.heartCount=2／heartHeal=10。isHealingItemは旧potion／herbも認識。migrateHealingItemsはvalidateSave前に行・カード集合・品物・候補を固定置換し、プリセットはhealingRowを使う。図鑑・新規抽選には泉カードを含めない。readable-props.jsのフレーム配置とformat.jsonはテストで照合。新アトラスを先に描画し、未ロード時のみ従来prop-viewへフォールバックする。

回復の表示名・カード名は回復ポーション、アトラスの主フレーム名はpotion。保存中のheart／herbは同じフレームへ別名解決する。名称・絵の変更で回復量・配置数・抽選・指示処理・保存版を変えない。

探索通知はfield-messages.jsがUI直前／直後のgimmick.triggeredとthemeState.usedの差分から抽出。実スキル消費の差分を使い、ログ文言や乱数へ依存しない。FieldMessageQueueはseed・profile.runs・floorの場面キーで同期し、別の階／旅では破棄する。エンジンや予測に通知待ち状態を追加しない。

app.jsはtick完了後に通知を積み、入場通知中だけ次tickと宝箱・オーグメントの自動表示を抑止する。専用native dialogをマップの実矩形へ位置合わせし、下部HUDの上へ配置。入場ダイアログの閉じるイベントには汎用finishDialogを適用せず、paused／dialogWasPausedを書き換えない。最後の確認でlastを更新しrenderを再実行して報酬表示へ引き継ぐ。resizeで位置を再計算、暗転やぼかしを使わず、prefers-reduced-motion時は▼を動かさない。

スキル通知は別の非モーダルDOMとFIFO列で扱い、active（進行停止）は入場通知列だけを参照する。requestAnimationFrameで表示中の実時間2000msを消費。別ダイアログ・画面非表示時はタイマーを止めるが、スキル列の存在はtick・報酬表示・フォーカス・休止フラグへ影響しない。pointer-events:noneで操作を遮らず、階／旅変更で表示と列をともに破棄する。

card-editor.jsのfixedInstructionRowsは隣接攻撃・階段探索の読取専用2行を描画する。data-fixed-order領域への配置を拒否し、説明行はs.ordersに格納しない。FIXED_STAIR_RULEとplanHeroTurnの未踏探索で階段探索を構成する。planHeroTurnから非隣接の可視敵への接近フォールバックを削除し、隣接戦闘と能動指示の優先は維持する。

各行はarticle／divの操作欄・要約欄・本文で構成。有効／無効の隣の開閉ボタンはfoldedを行データへ記録し、再描画と保存を行う。固定行はfixedOrderExpandedへ展開中の添字を保存する。旧保存は未記録を許可。編集行のfoldedは複製・編集・並べ替え・プリセットで保持。閉じたarticle全体へrowのドラッグ元を設定し、行全体を掴んで移動する。音量はabyss-ui-settingsのbgmVolume（初期5）、soundEnabled（初期true）、soundVolume（初期30）で管理する。

app.jsのsyncSceneViewportはany-pointer:coarseからdata-touch-controlsを設定。screens.cssでHUDの押下領域・アイコン・間隔を--game-scene-scaleの逆数で補正し、ResizeObserverで準備領域の開始位置を追従させる。行の有効／無効と折りたたみは同じ詳細度のCSSで寸法を統一する。

INITIAL_CARDSからaction:waitを除外し、カード箱の既存NORMAL抽選へ含める。migrateDirectiveCardsの待機自動付与を廃止し、明示所持・配置済みの互換は維持する。保存v16は変更しない。

## スキルFXのイベントと描画

tick(s,{onSkillEffect})は任意の表示用観測者を受け取る。skill-effect-events.jsが実行直前の使用済み集合・ダメージ列の先頭・使用者座標を取得し、実行直後に新しい消費と実際の命中座標を抽出する。敵の通常行動前に通知するため、後続の敵の攻撃をスキル命中として誤検出しない。敵操作にも同じ観測を適用。コールバック未指定の予測・検証は従来どおり動作し、sには演出列を格納しない。

app.jsは発動前に捕捉した敵の参照へイベント座標を対応づけ、skill-effects.jsのUI列へ渡す。各entity描画と同じ補間・presentation offsetを使って身体中心を計算。生存中はその中心、死亡済みは命中座標に元スプライトの中心補正を適用する。主人公の中心はcharacterDrawBoxと同じ等倍率変換。全FXをワールド描画の後へ置き、名前や数値はその上に描く。

skill-effect-art.jsはscripts/update-assets.jsがformat.jsonから生成し、5画像のSHA256付きURLと登録データを一緒に提供する。5枚のアトラスだけを本編へ採用し、原画・試作GIFは配信しない。heroClockで単発700msを進め、休止では停止、Clear直後の残り再生を許可。動きを減らす時はピーク静止。場面変更でUI列を破棄し、保存へ含めない。

## 起動と準備画面の表示

app.jsはtitleAssetsReadyとgameAssetsReadyを分離。モジュールのtop-level awaitは前者だけとし、index.htmlがタイトル画像とレイアウトの確定後にdata-startupを解除する。全スキルアトラスの通信開始はtitleAssetsReadyの後へ移し、HTTP接続枠でタイトル画像と競合しないようにする。gameAssetsReadyは従来のマップ素材に加えマップ品物・赤箱・敵画像もdecodeし、enterJourneyが開始動画後／スキップ後の遷移を一度だけ実行する。未完了時はstartup-statusを待機表示に再利用。タイトル・開始動画・ENDプレビュー中のdrawは早期終了する。

準備タブはorders／gear。gearの描画にexpedition-summaryのIDを除去したコピーと既存の装備UIを併置し、能力確認と装備操作を統合する。下部のprepare-journalと非表示のprepare-statusボタンを除去。ログ本体の保持と上部ログアイコンは維持する。abandon-runの左autoマージンとprimaryの左0マージンで右側へ2ボタンを隣接配置する。

## 戦闘接触の描画層

combat-feedback.jsが被弾群を最大64件保持し、実時間相当のtimeと姿勢用actorTimeを分離する。advanceCombatFeedbackは次の接触と停止終了を区間積分し、フレームレートに依存せず同じ停止量を適用する。app.jsのheroClockは演出の経過時間、combat.actorTimeはCharacterAnimation・敵の踏み込み・移動補間へ使用する。スキルの8コマと粒子・火花・白化は停止中も進む。1tickにつき先頭の非罠被弾だけに停止枠を与え、同時対象／追撃で加算しない。

damageEventsへ表示用source／impact（melee・skill・splash・trap）とスキル時のskillIdを付記。攻撃・被害の計算や乱数には使わず、保存・予測署名からも従来どおり除外する。UIはtick前の個体参照一覧から被弾者を対応づける。撃破後は短い描画用ghostだけを残す。元のゲーム配列へ戻さない。

敵の純白画像は既存アトラスを起動後のcanvasへ描き、source-inで白くしたものをメモリ内に作る。PNG追加・形状変更・マス矩形のフラッシュは不要。身体描画へ反動を加え、同じ変換をスキル中心へ渡す。背景と世界FXの後で揺れを打ち消してラベル・数字を描き、HUDとミニマップへ伝播させない。damage-view.jsは接触で発行された数字の跳ね・フェード・末尾点滅を管理。新設定screenShakeはui-settings.jsで初期trueを補い、BGM等を維持して保存する。

攻撃用skillIdはtheme-runtimeのhitからattackEnemyまたは敵操作経由のcontrolledHitHeroへ渡し、表示イベントにのみ記録する。combat-feedbackのBLADE_SKILLSで6種の追加軌跡を分類。start（姿勢開始）とcontact（接触）を別に保持し、即時接触のスキルでも軌跡を姿勢へ合わせる。heroAttackAimは実被弾または専用FXの攻撃分類から姿勢方向を返す。外れ時は直前の向きへ姿勢だけを出し、命中キューを増やさない。

## 入場通知と表示座標

field-messages.jsのhouseEntryReadyは移動補間のtime+durationで入場表示の完了を判断。通知はpush時点でactiveとなって次tickを抑止するが、render({ready:false})ではshowModalしない。appの描画時計はその間も進み、完了フレームでrenderしてBGMを同期する。musicSceneのhouseEnteredは既定でgimmick.triggered、UIではtriggeredかつ!fieldMessages.waitingを渡し、論理座標だけ先に入った間の曲変更を抑える。読込時は補間がないため保存されたtriggeredのまま専用曲を使い、過去の通知を再生しない。

idleClockは探索表示中に進む足踏み専用時計。動作中はactorTimeの差分を加算しヒットストップを維持、休止・モーダル中はフレーム経過時間を加算する。idleFootstepSampleは休止中の姿勢だけ待機へ置換し、位置・向きと移動／攻撃状態本体は変更しない。非表示・タイトル・死亡はこの継続対象外。reduced-motionの固定コマも維持する。

fieldMessageLayoutはhostとHUDのgetBoundingClientRectから実画面の幅・高さ・位置・文字サイズ・paddingを一度計算。ダイアログとbody直下へ移したスキル通知へ同じborder-box寸法を適用し、拡縮されたmainの祖先でviewport座標が二重変換されることを避ける。host/HUDのResizeObserver、resize、visualViewport.resize、fullscreenchangeで追従する。

## 霧BGMと指示の一括折りたたみ

scene-music.jsはgimmick.idがfogの場合もphaseを参照し、prepareはdungeon、explore／clearedはfogを返す。霧の視界・描画処理はこの変更で触らない。カード編集のdata-order-fold-allはcard-orders.jsのcollapseAllCardRowsを呼ぶ。prepare以外は変更せず、各orders[].folded=true、fixedOrderExpanded=[]だけを更新する。signatureへfixedOrderExpandedも含め、既存の再描画・スクロール保持・自動保存へ接続する。全行閉じ済みならボタンを無効にし、ゲーム判断・有効状態・カード所持には触れない。

## 霧と敵待機の軽量描画

fog-effect.jsのFOG_EFFECTを描画設定として、fogPixelsで160×90のRGBAを作りcreateFogEffectが1枚のcanvasへキャッシュする。50msの時刻区間と主人公中心で更新を判定し、静止モードでは同じ画像を再利用。固定ハッシュの滑らかなノイズ・正弦帯・密度マスクを使い、ゲーム乱数を呼ばない。描画時だけtransformを単位行列へ戻し1920×1080のマップ空間へ重ね、元の世界変換へ戻ってFX・ラベル・数字を描く。背景の明暗・視界判定は参照・変更しない。

enemy-idle.jsのENEMY_IDLEはperiodMs=1400／amplitudePx=2／footRows=10。敵アトラス読込時のアルファから各64pxセルの足元分割位置を一度計算。drawEnemySpriteの任意crouch／cut引数で足元側と上半身を別々の等倍率矩形として描き、上半身だけ最大2px下げる。createEnemyIdleSamplerのWeakMapへ初期位置とID由来の位相を保持し、敵本体・保存へ追加しない。既存の攻撃・反動を先に評価して屈伸を抑止。スキル中心は有効な屈伸量だけYへ加算し、影とHPは足元座標のまま。未読込・未知画像は従来の描画へフォールバックする。

オーグメント確認はpendingAugmentで候補IDだけ保持し、confirm-augmentで既存chooseAugmentを呼ぶ。確認を閉じても元の候補ダイアログを維持する。

ui-settings.jsのscreenBrightnessが設定値を正規化しread/saveで保持する。scene-lighting.jsのlightingShadeColorsが標準の暗転各段階のアルファを補正する。app.jsはdrawExplorationLightへuiSettings.brightnessを渡し、スライダーinputと標準復帰で保存・表示更新・drawを行う。スライダーは表示0〜100、保存は表示＋50。読込時の表示は保存−50とし、標準は表示50／保存100。既存保存の移行書換えは不要。

extensions.jsは解放・支払い・再抽選・休止回復・交換・任意保存項目の検証を担当する。game-engine.jsのvalidateSaveからvalidExtensionsを呼ぶ。extension-view.jsは既存3強化＋新4機能を3枝と詳細欄へ描画。app.jsはツリー操作・オーグメント再抽選・休止回復、tactics-ui.jsは宝箱再抽選を接続する。各操作は状態／残高・権・ストックを再検証してから対応資源を消費し、再描画と保存を行う。回復はappの明示pausedとイベント・モーダル不在を併せて判定する。候補乱数はnextRandomで進め、未確定交換を保存する。

extensions.jsのnormalizeExtensionsが旧解放をserviceRevision=1の残数へ一度だけ変換する。cardRerolls／augmentRerollsは購入時増加・リロール時減少。potionStockは購入／満タン拾得で増加し、休止使用で減少。game-engine.newGameはfirst-aidとarmor-1・potionStock=1を付与。screen-tutorial.jsのtutorialKey／tutorialStepsで階別手順を選び、app側は同じ選択済み手順配列で描画・操作完了を判定する。guideは旅のtutorialFloorsへ各階完了を保存し、旧UI設定とは独立する。

augment-rerollはaugment-choices後の兄弟要素。tactics-uiのrb.hiddenは未決定categoriesの有無で切り替え、selectedKindまたはcategoryLockedで種類確定を判定する。

EXTENSIONSは取得前提を持たず、unlockExtensionも前提検査を行わない。forgeの実行関数とUIハンドラは削除し、旧保存のunlocked内forgeだけ許容する。指示拡張は他の項目と同じノード書式とselectedクラスを使う。

拡張入口は準備タブ列に置き、card-editor操作欄には描画しない。ウィンドウは画面寸法から定まる固定幅高と内側スクロールを使う。startExchangeは解放・階別回数を参照せず、同種の異なる2枚を検証し、候補を生成してからカード2枚と費用を消費する。新候補はsources/paidを保存。chooseExchangeは支払済み候補を付与し、旧source形式だけ未消費1枚を取り除く。保存検証は新旧両形式を扱う。pickCandidateを共用し、再取得した元カードが所持されていても保存を拒否しない。

order-capacity.jsのactiveOrderCountを行追加・再有効化・保存検証・プリセット保存読込・行数表示で共用する。無効行を保ったまま有効上限を検査。equipment-panel.jsはgearDeltaとequipmentPanelで装備種別に対応する比較値と原inventory添字の操作ボタンを描画する。app.renderTabは種類別一覧のscrollTopと詳細のopenを維持する。主要ステータスはstatsを使用し、比較は装備個体のgearStats差。元のステータスHTMLは詳細内へ保持する。

data.equipmentのarmor-0は基礎DEF1。他防具は従来どおりrank×2。gearStatsとstatsが所持・装備・表示に共通適用するため、既存保存の個体書換えは不要。
